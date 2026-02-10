import React, { useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import type { Message } from "~/types/message";
import ChatInput from "./ChatInput";
import ChatPanel from "./ChatPanel";

const OptimizationPanel = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<Message>({
    text: "",
    sender: "Agent",
    id: "1",
  });

  const reviewHtml = useMemo(() => {
    if (!message.text) return "";
    try {
      const raw = marked.parse(message.text);
      // marked.use({breaks: true})
      // marked.parse can be sync or async depending on extensions; coerce to string
      return DOMPurify.sanitize(String(raw));
    } catch (e) {
      // fall back to escaped text if parsing fails
      console.error("Error parsing review markdown:", e);
      return DOMPurify.sanitize(String(message.text));
    }
  }, [message.text]);

  return (
    <section className="flex  h-full">
      <ChatPanel />
      <div
        className="flex-1 p-4 text-white"
        dangerouslySetInnerHTML={{ __html: reviewHtml }}
      />
    </section>
  );
};

export default OptimizationPanel;
