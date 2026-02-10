import { prepareInstructions } from "../constants/index";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import FileUploader from "~/components/resume/FileUploader";
import Navbar from "~/components/Navbar";
import { convertPdfToImage } from "~/lib/pdf2image";
import { usePuterStore } from "~/lib/puter";
import { generateUUID } from "~/lib/utils";
import { useUpload } from "~/hooks/useUpload";

const upload = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    companyName: "",
    jobTitle: "",
    jobDescription: "",
  });

  const [resumePath, setResumePath] = useState<string>("");
  const { handleAnalyze, isProcessing, statusText, error } = useUpload({
    onSuccess: (jobId, version) =>
      navigate(`/resume/${jobId}?version=${version}`),
  });
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (isLoading) return;

    if (!auth.isAuthenticated) navigate("auth?next=/upload");
  }, [auth.isAuthenticated]);

  useEffect(() => {
    const getJob = async () => {
      if (!id) return;

      const job = await kv.get(`jobApplication:${id}`);
      const parsedJob: JobApplication = job ? JSON.parse(job) : null;

      if (parsedJob) {
        const jobResume = parsedJob?.resumeVersionMeta?.find(
          (resume) => parsedJob.currentVersion === resume.version,
        );

        setForm({
          jobDescription: parsedJob.jobDescription,
          jobTitle: parsedJob.jobTitle,
          companyName: parsedJob.companyName,
        });
        setResumePath(jobResume?.resumePath ?? "");
      }
    };
    getJob();
  }, [id]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

     if (!file) {
    alert("Please upload a resume");
    return;
  }
    
  if (!form || !form.jobDescription || !form.jobTitle) {
    alert("Please provide a Jobitle and description");
    return;
  }

  handleAnalyze({
    companyName: form.companyName,
    jobTitle: form.jobTitle,
    jobDescription: form.jobDescription,
    file,
    jobId: id, // optional: pass existing job ID for updating
  });
  };

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] dark:bg-none dark:!bg-gray-900 dark:!text-white">
      <nav className={"navbar"}>
        <Link to="/">
          <p className={"text-2xl font-bold text-gradient"}>RESUMIND</p>
        </Link>
      </nav>
      <section className="main-section">
        <div className="page-heading py-16">
          <h1 className="dark:!text-gray-300">
            Smart feedback for your dream job
          </h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img
                src="/images/resume-scan.gif"
                alt="Processing..."
                className="w-full"
              />
            </>
          ) : error ? (
            <div>
              <p className="dark:!text-gray-300 p-5 border border-red-400">
                {error}
              </p>
            </div>
          ) : (
            <h2 className="dark:!text-gray-300">
              Drop your resume for an ATS score and improvement tips
            </h2>
          )}

          {!isProcessing && (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8 main-form dark:!text-gray-700"
            >
              <div className="form-div">
                <label className="dark:!text-gray-300" htmlFor="companyName">
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleInputChange}
                  placeholder="Company Name"
                  id="companyName"
                />
              </div>
              <div className="form-div">
                <label className="dark:!text-gray-300" htmlFor="job-title">
                  Job Title
                </label>
                <input
                  type="text"
                  name="jobTitle"
                  value={form.jobTitle}
                  onChange={handleInputChange}
                  placeholder="Job Title"
                  id="job-title"
                />
              </div>
              <div className="form-div">
                <label
                  className="dark:!text-gray-300"
                  htmlFor="job-description"
                >
                  Job Description
                </label>
                <textarea
                  rows={5}
                  name="jobDescription"
                  value={form.jobDescription}
                  onChange={handleInputChange}
                  placeholder="Job Description"
                  id="job-description"
                  className="upload-textarea"
                />
              </div>
              <div className="form-div">
                <label className="dark:!text-gray-300" htmlFor="upload-resume">
                  Upload Resume
                </label>
                <FileUploader
                  onFileSelect={handleFileSelect}
                  file={file}
                  existingResumePath={resumePath}
                />
              </div>
              <button type="submit" className="primary-button">
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default upload;
