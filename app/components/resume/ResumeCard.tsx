import { Link } from "react-router";
import ScoreCircle from "~/components/resume/ScoreCircle";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import type { Resume } from "~/routes/home";

const ResumeCard = ({
  resume: { jobId: id, version, companyName, jobTitle, resumePath, imagePath, overallScore},
}: {
  resume: Resume;
}) => {
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const { fs } = usePuterStore();

  useEffect(() => {
    const loadResume = async () => {
      const blob = await fs.read(imagePath);
      if (!blob) return;
      let url = URL.createObjectURL(blob);
      setResumeUrl(url);
    };

    loadResume();
  }, [imagePath]);

  return (
    <Link
      to={`/resume/${id}?version=${version}`}
      className="resume-card animate-in fade-in duration-1000"
    >
      <div className="resume-card-header">
        <div className="flex flex-col sm:gap-2 max-sm:items-center">
          {companyName && (
            <h2 className="!text-black !text-xl font-bold break-words">
              {companyName}
            </h2>
          )}
          {jobTitle && (
            <h3 className={"text-sm break-words text-gray-500"}>{jobTitle}</h3>
          )}
          {!companyName && !jobTitle && (
            <h2 className="!text-black text-md font-bold">Resume</h2>
          )}
        </div>
        {overallScore > 0 && (
          <div className="flex-shrink-0">
            <ScoreCircle score={overallScore}></ScoreCircle>
          </div>
        )}
      </div>
      {resumeUrl && (
        <div
          className={
            "gradient-border animate-in fade-in duration-1000 overflow-hidden"
          }
        >
          <div className="w-full h-full shadow-2xl overflow-hidden">
            <img
              src={resumeUrl}
              alt="resume"
              className="w-full h-[300px] max-sm:h-[200px] object-cover object-top"
            />
          </div>
        </div>
      )}
    </Link>
  );
};

export default ResumeCard;
