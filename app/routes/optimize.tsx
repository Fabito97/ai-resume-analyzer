import React, { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { usePuterStore } from "~/lib/puter";
import { Link, useNavigate, useParams } from "react-router";
import PaperAirplaneIcon from "~/icons/PaperAirplaneIcon";
import ChatInput from "~/components/chat/ChatInput";
import OptimizationPanel from "~/components/chat/OptimizationPanel";

const optimize = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();
  const { id } = useParams<{ id: string }>();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated)
      navigate(`auth?next=/optimise-resume/${id}`);
  }, [isLoading]);

  console.log("Feedback:", feedback);
  useEffect(() => {
    const loadFeedback = async () => {
      setFeedbackLoading(true);
      const resume = await kv.get(`resume:${id}`);
      if (!resume) return;

      const data = JSON.parse(resume);

      setFeedback(data.feedback);
      setFeedbackLoading(false);
      console.log({ feedback: data.feedback });
    };

    loadFeedback();
  }, [id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  return (
    <section className="h-screen flex flex-col overflow-hidden">
      <nav className="resume-nav dark:!bg-gray-800 dark:!text-white z-10 ">
        <Link to={`/resume/${id}`} className="back-button dark:bg-white">
          <img src="/icons/back.svg" alt="log" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-xs font-semibold">
            Back to resume review
          </span>
        </Link>
        {feedback && (
          <Link
            to={`/optimise-resume/${id}`}
            className="back-button  dark:bg-white"
          >
            <span className="text-gray-800 text-xs font-semibold">
              Download pdf
            </span>
            <img src="/icons/back.svg" alt="log" className="w-2.5 h-2.5" />
          </Link>
        )}
      </nav>

      <section className="bg-gray-800 flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {/* <div className="sidebar w-64 flex-1 h-full bg-gray-700 text-white p-6">

        </div> */}

        <div className="flex-1 flex flex-col bg-gray-700 m-0">
          <OptimizationPanel />
        </div>
      </section>
    </section>
  );
};

export default optimize;
