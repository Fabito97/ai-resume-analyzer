import React, { useState } from "react";
import ChatInput from "./ChatInput";
import UserIcon from "~/icons/UserIcon";
import LoadingSpinner from "./LoadingSpinner";
import type { Message } from "types/message";

export enum Sender {
  User = "User",
  AI = "Agent",
}

const ChatPanel = () => {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>({
    text: "",
    sender: "Agent",
    id: "1",
  });

  const isUser = message.sender === Sender.User;
  const isAI = message.sender === Sender.AI;

  const bubbleAlignment = isUser ? "justify-end" : "justify-start";
  const bubbleColor = isUser ? "bg-gray-600" : "bg-gray-800";
  const bubbleStyles = `max-w-xs md:max-w-md lg:max-w-2xl px-4 py-3 rounded-lg shadow-md ${bubbleColor}`;

  const AILogo = () => (
    <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center mr-3 flex-shrink-0 text-xl">
      ✍️
    </div>
  );

  const UserLogo = () => (
    <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center ml-3 flex-shrink-0">
      <UserIcon className="h-5 w-5 text-gray-400" />
    </div>
  );
  return (
    <div className="flex-1 flex flex-col h-full bg-gray-900">
      <div className="p-2">
        {/* <h2 className="!text-white !text-sm">
          Hello, let's refine your Resume
        </h2> */}
      </div>
      
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="space-y-6 flex flex-col items-center">
          <div className={`flex items-start ${bubbleAlignment} w-full`}>
            {isAI && <AILogo />}
            <div className={bubbleStyles}>
              {isAI && message.text === "" ? (
                <LoadingSpinner />
              ) : (
                // ) : isAI ? (
                //   <div className={""}></div>
                <p className="text-white whitespace-pre-wrap break-words">
                  {message.text}
                </p>
              )}
            </div>
            {isUser && <UserLogo />}
          </div>
        </div>
      </div>

      {error && (
        <div className="px-6 pb-2">
          <div
            className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg"
            role="alert"
          >
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}
      <ChatInput />
    </div>
  );
};

export default ChatPanel;
