import { useState } from "react";
import { usePuterStore } from "~/lib/puter";
import { convertPdfToImage } from "~/lib/pdf2image";
import { generateUUID } from "~/lib/utils";
import { prepareInstructions } from "../constants/index";

interface UseUploadParams {
  onSuccess?: (jobId: string, version: number) => void;
  onError?: (error: string, jobId: string, version: number) => void;
}

interface AnalyzeParams {
  file?: File | null;
  companyName?: string;
  jobTitle: string;
  jobDescription: string;
  jobId?: string; // Re-upload (new version)
  resumeText?: StructuredResume;

  existingResumePath?: string;
  existingImagePath?: string;
}


export function useUpload({ onSuccess, onError }: UseUploadParams = {}) {
  const { fs, ai, kv } = usePuterStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async ({
    file,
    companyName,
    jobTitle,
    jobDescription,
    jobId: existingJobId,
    resumeText,
    existingResumePath,
    existingImagePath,
  }: AnalyzeParams) => {
    setIsProcessing(true);
    setError(null);

    let uploadedFile: FSItem | undefined;
    let uploadedImage: FSItem | undefined;
    let jobId: string = "";
    let version: number = 1;
    try {
      if (!file && (!existingResumePath || !existingImagePath)) {
        throw new Error("No resume file provided and no existing resume found");
      }

      if (file) {
        setStatusText("Uploading the file...");
        uploadedFile = await fs.upload([file]);
        if (!uploadedFile) throw new Error("Failed to upload PDF");

        setStatusText("Converting to image...");
        const imageResult = await convertPdfToImage(file);
        if (!imageResult.file)
          throw new Error(
            imageResult.error || "Failed to convert PDF to image",
          );

        setStatusText("Uploading the image...");
        uploadedImage = await fs.upload([imageResult.file]);
        if (!uploadedImage) throw new Error("Failed to upload image");
      }

      // ── Job application logic ──
      let application: JobApplication;

      if (existingJobId) {
        // Re-upload
        jobId = existingJobId;
        const existingAppData = await kv.get(`jobApplication:${jobId}`);
        if (!existingAppData)
          throw new Error(`Job application ${jobId} not found`);

        const existingApp: JobApplication = JSON.parse(existingAppData);
        version = file
          ? existingApp.currentVersion + 1
          : existingApp.currentVersion;

        // Merge optional fields only if provided
        application = {
          ...existingApp,
          companyName: companyName || existingApp.companyName,
          jobTitle: jobTitle || existingApp.jobTitle,
          jobDescription: jobDescription || existingApp.jobDescription,
          currentVersion: version,
          updatedAt: new Date().toISOString(),
          resumeVersionMeta: existingApp.resumeVersionMeta ?? [],
        };
      } else {
        // New job
        jobId = generateUUID();
        version = 1;
        application = {
          jobId,
          companyName: companyName || "",
          jobTitle: jobTitle,
          jobDescription: jobDescription,
          currentVersion: version,
          resumeVersionMeta: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      // ── Store uploaded resume immediately to prevent orphaned files ──
      const resumeId = `resume:${jobId}:v${version}`;
      const resumeData: Resume = {
        id: resumeId,
        jobId,
        version,
        resumePath: uploadedFile?.path ?? existingResumePath!,
        imagePath: uploadedImage?.path ?? existingImagePath!,
        resumeText: resumeText || null,
        source: resumeText ? "optimized" : "upload",
        feedback: null,
        status: "pending",
      };

      const resume: Resume = {
        ...resumeData,
        createdAt: file
          ? new Date().toISOString()
          : resumeData.createdAt || new Date().toISOString(),
      };

      await kv.set(resumeId, JSON.stringify(resume));

      // Add resume to job

      // ── AI Analysis ──
      setStatusText("Analyzing... this may take a few minutes");

      const message = prepareInstructions({
        jobTitle: application.jobTitle,
        jobDescription: application.jobDescription,
      });

      let feedback: Feedback | null = null;
      const feedbackEntry: FeedbackEntry = {
        id: generateUUID(),
        feedback: null,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      const resumeFilePath = uploadedFile?.path ?? existingResumePath!;

      try {
        const feedbackResponse = await ai.feedback(resumeFilePath, message);
        if (feedbackResponse) {
          const feedbackText =
            typeof feedbackResponse.message.content === "string"
              ? feedbackResponse.message.content
              : feedbackResponse.message.content[0].text;

          feedback = JSON.parse(feedbackText);
          feedbackEntry.feedback = feedback;
          feedbackEntry.status = "complete";
        }
      } catch (err) {
        console.warn("AI analysis failed:", err);
        // feedback = null; // Safe fallback
        feedbackEntry.status = "failed";
      }

      // ── Save feedback history ──
      const feedbackHistoryKey = `feedback:${resume.id}`;
      const existingHistoryData = await kv.get(feedbackHistoryKey);
      const existingHistory: FeedbackEntry[] = existingHistoryData
        ? JSON.parse(existingHistoryData)
        : [];
      existingHistory.push(feedbackEntry);
      await kv.set(feedbackHistoryKey, JSON.stringify(existingHistory));

      // Update resume with feedback and status
      resume.feedback = feedback;
      resume.status = feedback ? "complete" : "failed";
      await kv.set(resumeId, JSON.stringify(resume));

      application.resumeVersionMeta?.push({
        resumePath: resume.resumePath,
        imagePath: resume.imagePath,
        createdAt: resume.createdAt ?? new Date().toISOString(),
        version: resume.version,
        source: resume.source,
        overallScore: feedback?.overallScore,
      });

      // Maintain max 3 resumes
      if (
        application.resumeVersionMeta &&
        application.resumeVersionMeta.length > 3
      ) {
        const excessCount = application.resumeVersionMeta.length - 3;
        const removedResumes = application.resumeVersionMeta.splice(
          0,
          excessCount,
        );

        removedResumes.forEach((removed) => {
          console.log("Removing old resume:", removed.version);

          // Run cleanup in the background, safely
          (async () => {
            try {
              // Remove KV entry
              await kv.delete(`resume:${jobId}:v${removed.version}`);

              // Remove files
              if (removed.resumePath) await fs.delete(removed.resumePath);
              if (removed.imagePath) await fs.delete(removed.imagePath);
            } catch (err) {
              console.warn("Background resume cleanup failed:", err);
            }
          })();
        });
      }

      // Persist the trimmed version meta before moving on
      await kv.set(`jobApplication:${jobId}`, JSON.stringify(application));

      setStatusText(
        feedback ? "Analysis complete!" : "Analysis failed. You can retry.",
      );

      setIsProcessing(false);

      if (onSuccess) onSuccess(jobId, version);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setStatusText("");
      setIsProcessing(false);
      if (onError) onError(errorMessage, jobId, version);
    }
  };

  return { handleAnalyze, isProcessing, statusText, error };
}
