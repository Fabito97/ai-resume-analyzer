import { GoogleGenAI, type Content } from "@google/genai";
import type { Message } from "types/message";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });

const buildHistory = (messages: Message[]): Content[] => {
  const validMessages = messages.filter((msg) => msg.text.trim() !== "");

  return validMessages.map((msg) => ({
    role: String(msg.sender) === "user" ? "user" : "assistant",
    parts: [{ text: msg.text }],
  }));
};


export const streamChatResponse = async (
  history: Message[],
  newPrompt: string,
  systemInstruction: string
) => {
  try {
    const model = "gemiini-2.5-flash";

    // Create a new chat session with the existing history for context
    const chat = ai.chats.create({
      model,
      history: buildHistory(history),
      config: {
        systemInstruction,
      }
    })

    // Send the new message
    const result = await chat.sendMessageStream({message: newPrompt})
    return result
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error(
      "Failed to get response from AI. Please check your API key and network connection."
    )
  }
}