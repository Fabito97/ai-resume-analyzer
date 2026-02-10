import { useState } from "react";
import { usePuterStore } from "~/lib/puter";
import { convertPdfToImage } from "~/lib/pdf2image";
import { generateUUID } from "~/lib/utils";
import { prepareInstructions } from "../constants/index";

interface UseUploadParams {
  onSuccess?: (jobId: string, version: number) => void;
  onError?: (error: string) => void;
}

interface AnalyzeParams {
  file: File;
  companyName?: string;
  jobTitle?: string;
  jobDescription?: string;
  jobId?: string; // Re-upload (new version)
  resumeText?: StructuredResume;
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
  }: AnalyzeParams) => {
    setIsProcessing(true);
    setError(null);

    try {
      setStatusText("Uploading the file...");
      const uploadedFile = await fs.upload([file]);
      if (!uploadedFile) throw new Error("Failed to upload PDF");

      setStatusText("Converting to image...");
      const imageResult = await convertPdfToImage(file);
      if (!imageResult.file) throw new Error(imageResult.error || "Failed to convert PDF to image");

      setStatusText("Uploading the image...");
      const uploadedImage = await fs.upload([imageResult.file]);
      if (!uploadedImage) throw new Error("Failed to upload image");

      // ── Job application logic ──
      let jobId: string;
      let version: number;
      let application: JobApplication;

      if (existingJobId) {
        // Re-upload
        jobId = existingJobId;
        const existingAppData = await kv.get(`jobApplication:${jobId}`);
        if (!existingAppData) throw new Error(`Job application ${jobId} not found`);

        const existingApp: JobApplication = JSON.parse(existingAppData);
        version = existingApp.currentVersion + 1;

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
          jobTitle: jobTitle || "",
          jobDescription: jobDescription || "",
          currentVersion: version,
          resumeVersionMeta: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      // ── Store uploaded resume immediately to prevent orphaned files ──
      const resumeId = `resume:${jobId}:v${version}`;
      const resume: Resume = {
        id: resumeId,
        jobId,
        version,
        resumePath: uploadedFile.path,
        imagePath: uploadedImage.path,
        resumeText: resumeText || null,
        source: resumeText ? "optimized" : "upload",
        feedback: null, // AI not run yet
        status: "pending", // pending AI analysis
        createdAt: new Date().toISOString(),
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
      
      try {
        const feedbackResponse = await ai.feedback(uploadedFile.path, message);
        if (feedbackResponse) {
          const feedbackText =
          typeof feedbackResponse.message.content === "string"
          ? feedbackResponse.message.content
          : feedbackResponse.message.content[0].text;
          
          feedback = JSON.parse(feedbackText);
        }
      } catch (err) {
        console.warn("AI analysis failed:", err);
        feedback = null; // Safe fallback
      }
      
      // Update resume with feedback and status
      resume.feedback = feedback;
      resume.status = feedback ? "complete" : "failed";
      await kv.set(resumeId, JSON.stringify(resume));
      
      application.resumeVersionMeta?.push({
        resumePath: resume.resumePath,
        imagePath: resume.imagePath,
        createdAt: resume.createdAt,
        version: resume.version,
        source: resume.source,
        overallScore: feedback?.overallScore,
      });

      await kv.set(`jobApplication:${jobId}`, JSON.stringify(application));

      setStatusText("Analysis complete!");
      setIsProcessing(false);

      if (onSuccess) onSuccess(jobId, version);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setStatusText("");
      setIsProcessing(false);
      if (onError) onError(errorMessage);
    }
  };

  return { handleAnalyze, isProcessing, statusText, error };
}
