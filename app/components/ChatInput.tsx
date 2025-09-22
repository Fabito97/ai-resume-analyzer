import React, { useRef, useState, type KeyboardEvent } from "react";
import PaperAirplaneIcon from "~/icons/PaperAirplaneIcon";

const ChatInput = () => {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (inputValue.trim()) {
      // onSendMessage(inputValue);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-gray-900 p-4 border-t border-gray-600/50">
      <form
        onSubmit={handleSubmit}
        className="flex items-center space-x-3 max-w-4xl mx-auto bg-gray-800 rounded-xl p-2 border border-gray-600 focus-within:border-blue-500 transition-colors"
      >
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here..."
          rows={1}
          className="flex-1 bg-transparent text-gray-200 placeholder-gray-400 resize-none focus:outline-none max-h-48"
          disabled={isLoading}
          style={{ overflowY: "auto" }}
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="bg-blue-600 text-white rounded-lg p-2 h-10 w-10 flex items-center cursor-pointer justify-center flex-shrink-0 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          aria-label="Send message"
        >
          <PaperAirplaneIcon />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
