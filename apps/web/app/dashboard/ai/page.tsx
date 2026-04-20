"use client";

import { AgentChat } from "@/components/ai/agent-chat";

export default function AIPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AI Assistant</h1>
          <p className="text-zinc-400 mt-1">Context-aware agents to help with content, structure, and operations.</p>
        </div>
      </div>
      
      <AgentChat />
    </div>
  );
}
