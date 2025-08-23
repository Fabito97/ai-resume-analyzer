import {Link} from "react-router";
import {resumes} from "../../constants";
import ScoreCircle from "~/components/ScoreCircle";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";

const ResumeCard = ({resume: {id, jobTitle, companyName, resumePath, imagePath, feedback}}:{resume: Resume}) => {
    const [resumeUrl, setResumeUrl] = useState<string | null>(null);
    const { fs } = usePuterStore();

    useEffect(() => {
        const loadResume = async () => {
          const blob = await fs.read(imagePath)
          if(!blob) return;
          let url = URL.createObjectURL(blob);
          setResumeUrl(url);
        }

        loadResume();
      }, [imagePath]);

    return (
        <Link to={`/resume/${id}`} className="resume-card animate-in fade-in duration-1000">
            <div className="resume-card-header">
                <div className="flex flex-col sm:gap-2 max-sm:items-center">
                    {companyName && <h2 className="!text-black font-bold break-words">{companyName}</h2>}
                    {jobTitle && <h3 className={"text-lg break-words text-gray-500"}>{jobTitle}</h3>}
                    {!companyName && !jobTitle && <h2 className="!text-black font-bold">Resume</h2>}
                </div>
                <div className="flex-shrink-0">
                    <ScoreCircle score={feedback.overallScore}></ScoreCircle>
                </div>
            </div>
            {resumeUrl && (
                <div className={"gradient-border animate-in fade-in duration-1000"}>
                    <div className="w-full h-full shadow-2xl">
                        <img
                            src={resumeUrl}
                            alt="resume"
                            className="w-full h-[350px] max-sm:h-[250px] object-cover object-top"
                        />
                    </div>
                </div>
            )}
        </Link>
    )
}

export default ResumeCard