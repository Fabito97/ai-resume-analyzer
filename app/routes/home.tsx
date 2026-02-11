import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/resume/ResumeCard";
import { usePuterStore } from "~/lib/puter";
import { Link, useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import LoadingSpinner from "~/components/LoadingSpinner";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for you dream job" },
  ];
}

export interface Resume {
  jobId: string;
  version: number;
  companyName: string;
  jobTitle: string;
  imagePath: string;
  resumePath: string;
  overallScore: number;
}

export default function Home() {
  const { auth, kv, fs, isLoading } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!auth.isAuthenticated) navigate("auth");
  }, [auth.isAuthenticated, isLoading]);

  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true);
      try {
        const applications = (await kv.list(
          "jobApplication:*",
          true,
        )) as KVItem[];

        const parsedResumes: (Resume)[] = applications?.map((application) => {
          if (!application.value) return null;

          const job = JSON.parse(application.value) as JobApplication;
          
          const currentResumeVersion = job.resumeVersionMeta?.find(
            (resumeVersion) => resumeVersion.version === job?.currentVersion,
          );

          const resume: Resume = {
            jobId: job?.jobId,
            version: job.currentVersion ?? currentResumeVersion?.version ?? 1,
            jobTitle: job?.jobTitle,
            companyName: job?.companyName,
            overallScore: currentResumeVersion?.overallScore || 0,
            imagePath: currentResumeVersion?.imagePath || "",
            resumePath: currentResumeVersion?.resumePath || "",
          };

          return resume;
        }).filter(Boolean) as Resume[];

        console.log(parsedResumes);

        setResumes(parsedResumes || []);
      } catch (error) {
        console.error(error ?? "An error occurred");
      } finally {
        setLoadingResumes(false);
      }
    };
    loadResumes();
  }, [kv, isLoading]);

  const handleDelete = async (resume: Resume) => {
    await fs.delete(resume.imagePath);
    await fs.delete(resume.resumePath);

    await kv.delete(resume.jobId);
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] dark:bg-none dark:bg-gray-900">
      <Navbar />

      <section className="main-section">
        <div className="page-heading mb-10">
          <h1 className=" dark:!text-gray-300">
            Track Your Applications & Resume Ratings
          </h1>
          {!loadingResumes && resumes?.length === 0 ? (
            <h2 className=" dark:!text-gray-300">
              No resumes found. Upload your first resume to get feedback.
            </h2>
          ) : (
            <h2 className=" dark:!text-gray-300 mt-5">
              Review your submissions and check AI-powered feedback.
            </h2>
          )}
        </div>

        {loadingResumes && (
          <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" alt="" className="w-[200px]" />
          </div>
        )}

        {!loadingResumes && resumes.length > 0 && (
          <div className="resumes-section">
            {resumes.map((resume) => (
              <ResumeCard key={resume.jobId} resume={resume} />
            ))}
          </div>
        )}

        {!isLoading && !loadingResumes && resumes?.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-10 gap-4">
            <Link
              to={"/upload"}
              className="primary-button w-fit text-xl font-semibold"
            >
              Upload Resume
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
