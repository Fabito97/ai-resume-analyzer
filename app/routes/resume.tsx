import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import ATS from "~/components/resume/ATS";
import Details from "~/components/resume/Details";
import Summary from "~/components/resume/Summary";
import { usePuterStore } from "~/lib/puter";

export const meta = () => [
  { title: "Resumind | Review" },
  { name: "description", content: "Detailed analysis of your resume" },
];

// Placeholder types based on other files
interface ResumeVersionMeta {
  version: number;
  resumePath: string;
  imagePath: string;
  overallScore: number;
  feedback?: Feedback;
}

interface JobApplication {
  jobId: string;
  // other properties exist, but resumeVersionMeta is what we need
  resumeVersionMeta?: ResumeVersionMeta[];
}

const resume = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();

  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const version = Number(searchParams.get("version") ?? 1);

  const [jobId, setJobId] = useState<string | null>();
  const [resumeId, setResumeId] = useState<string | null>();
  const [imageUrl, setImagUrl] = useState<string | null>();
  const [resumeUrl, setResumeUrl] = useState<string | null>();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [feedbackVersion, setFeedbackVersion] = useState<number | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<
    FeedbackEntry[] | null
  >(null);
  const [feedbackMenuOpen, setFeedbackMenuOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [feedbackLoading, setFeedbackLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!auth.isAuthenticated)
      navigate(
        `/auth?next=${encodeURIComponent(`/resume/${id}?version=${version}`)}`,
      );
  }, [auth.isAuthenticated, isLoading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setFeedbackMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popoverRef]);

  useEffect(() => {
    const loadResume = async () => {
      setFeedbackLoading(true);
      const resume = await kv.get(`resume:${id}:v${version}`);
      if (!resume) return;

      const data = JSON.parse(resume);

      const resumeBlob = await fs.read(data.resumePath);
      if (!resumeBlob) return;

      const pdfBlob = new Blob([resumeBlob], { type: "application/pdf" });
      const resumeUrl = URL.createObjectURL(pdfBlob);
      setResumeUrl(resumeUrl);
      setResumeId(data.id);

      const imageBlob = await fs.read(data.imagePath);
      if (!imageBlob) return;
      const imageUrl = URL.createObjectURL(
        new Blob([imageBlob], { type: "image/png" }),
      );
      setImagUrl(imageUrl);

      setFeedback(data.feedback);
      setFeedbackLoading(false);
      setJobId(data.jobId);
      console.log({ resumeUrl, imageUrl, feedback: data.feedback });
    };

    console.log("Feedbact Ats:", feedback?.ATS);

    loadResume();
  }, [id, version, fs, kv]);

  useEffect(() => {
    const loadFeedbackHistory = async () => {
      if (!id) return;
      const feedbacks = await kv.get(`feedbackHistory:${resumeId}`);
      if (!feedbacks) return;

      const feedbackData: FeedbackEntry[] = JSON.parse(feedbacks);
      // Assuming versions are sorted. If not, they should be.
      setFeedbackHistory(feedbackData || []);
      setFeedbackVersion(feedbackData.length > 0 ? feedbackData.length : null)
    };

    loadFeedbackHistory();
  }, [id, kv]);

  const handleFeedbackChange = (feedbackId: string, index: number) => {
    // Only navigate if it's a different version
   const newFeedback = feedbackHistory?.find((feedback) => feedback.id === feedbackId);
    if (newFeedback) {
      setFeedback(newFeedback.feedback);
      setFeedbackVersion(index);
    }

    setFeedbackMenuOpen(false);
  };

  return (
    <main className="!pt-0">
      <nav className="resume-nav dark:!bg-gray-800">
        <Link to={`/`} className="back-button">
          <img src="/icons/back.svg" alt="log" className="w-2.5 h-2.5" />
          <span className="text-gray-800 dark:!text-white text-sm font-semibold">
            Back to Homepage
          </span>
        </Link>
        <div className="flex gap-4 items-center">
          <Link to={`/upload/${jobId}?version=${version}`} className="">
            <span className="text-gray-800 dark:!text-white text-sm font-semibold hover:border-b hover:border-blue-200">
              Re-analyze
            </span>
          </Link>
          {feedback && (
            <Link to={`/optimise-resume/${jobId}`} className="back-button">
              <span className="text-gray-800 dark:!text-white text-sm font-semibold">
                Optimize Resume
              </span>
              <img
                src="/icons/back.svg"
                alt="log"
                className="w-2.5 h-2.5 text-white"
              />
            </Link>
          )}
        </div>
      </nav>
      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className='feedback-section bg-[url("/images/bg-small.svg")] bg-cover sm:h-[100vh] sticky top-0 items-center justify-center'>
          {imageUrl && resumeUrl && (
            <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit  w-fit">
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={imageUrl}
                  alt="resume"
                  className="w-full h-full object-contain rounded-2xl"
                  title="resume"
                />
              </a>
            </div>
          )}
        </section>
        <section className="feedback-section dark:bg-gray-800">
          <div className="flex dark:text-white justify-between items-center gap-2">
            <h2 className="text-4xl dark:!text-white font-bold">
              Resume Review
            </h2>
            {feedbackHistory && feedbackHistory.length > 1 && (
              <div className="relative" ref={popoverRef}>
                <button
                  onClick={() => setFeedbackMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors bg-white dark:bg-gray-700/50 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
                >
                  <span>Version {version}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      feedbackMenuOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {feedbackMenuOpen && feedbackHistory.length > 0 &&(
                  <div className="absolute top-full mt-2 w-48 right-0 z-10 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-100 dark:border-gray-600 overflow-hidden animate-in fade-in duration-150">
                    <div className="p-2 px-3 font-semibold text-xs text-gray-400 uppercase border-b border-gray-100 dark:border-gray-600">
                      History
                    </div>
                    <ul className="py-1 max-h-60 overflow-y-auto">
                      {feedbackHistory.map((feedbackData, index) => (
                        <li key={version}>
                          <button
                            onClick={() => handleFeedbackChange(feedbackData.id, index + 1)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between"
                          >
                            <span>Version {index + 1}</span>
                            <span className="text-xs text-gray-400">
                              {feedbackData && feedbackData.feedback?.overallScore}/100
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {feedbackLoading ? (
            <img src="/images/resume-scan-2.gif" alt="" className="w-full" />
          ) : feedback ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
              <Summary feedback={feedback} />
              <ATS
                score={feedback.ATS.score || 0}
                suggestions={feedback.ATS.tips || []}
              />
              <Details feedback={feedback} />
            </div>
          ) : (
            <div className="flex flex-col gap-3 items-center justify-center h-[70%] text-white">
              <p className="text-xl">No Feedback Given</p>
              <Link
                to={`/upload/${id}`}
                className="text-xl text-blue-200 border p-2 rounded-lg hover:bg-gray-50 hover:text-gray-800"
              >
                Re-analyze
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default resume;
