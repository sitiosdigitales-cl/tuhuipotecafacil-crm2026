"use client";

import { Bot, User } from "lucide-react";

interface MensajeAsistenteProps {
  message: {
    role: string;
    content?: string;
    parts?: Array<{ type: string; text?: string }>;
  };
}

export function MensajeAsistente({ message }: MensajeAsistenteProps) {
  const isUser = message.role === "user";

  // Get text content from either content or parts
  const textContent = message.content || 
    message.parts?.filter(p => p.type === "text").map(p => p.text).join("") || "";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isUser
            ? "bg-gradient-to-br from-blue-500 to-blue-600"
            : "bg-gradient-to-br from-violet-500 to-purple-600"
        }`}
      >
        {isUser ? (
          <User size={16} className="text-white" />
        ) : (
          <Bot size={16} className="text-white" />
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? "bg-blue-500 text-white rounded-tr-md"
            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-tl-md"
        }`}
      >
        {/* Message Content */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {textContent}
        </div>
      </div>
    </div>
  );
}
