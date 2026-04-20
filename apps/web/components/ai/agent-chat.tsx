"use client";

import { useEffect, useRef, useState } from "react";
import { useAIStore } from "@/lib/store";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AgentChat() {
  const { activeAgent, setActiveAgent, sessions, loading, fetchSessions, sendMessage } = useAIStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions(activeAgent);
  }, [activeAgent, fetchSessions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, loading]);

  const activeSession = sessions.find((s) => s.endedAt === null);
  const messages = activeSession ? activeSession.messages.filter((m: any) => m.role !== "system") : [];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const message = input;
    setInput("");
    await sendMessage(message, activeAgent);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-400" />
          <h2 className="font-semibold text-white">ECOS AI Assistant</h2>
        </div>
        <Select value={activeAgent} onValueChange={(val) => setActiveAgent(val as any)}>
          <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-zinc-200">
            <SelectValue placeholder="Select Agent" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-200">
            <SelectItem value="CONTENT">Content Agent</SelectItem>
            <SelectItem value="DRIVE">Drive Agent</SelectItem>
            <SelectItem value="MEDIA">Media Agent</SelectItem>
            <SelectItem value="BUDGET">Budget Agent</SelectItem>
            <SelectItem value="DATA">Data Agent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-3">
            <Bot className="w-12 h-12 opacity-20" />
            <p>How can I help you today?</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg: any, idx: number) => (
              <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-indigo-400" />
                  </div>
                )}
                <div
                  className={`px-4 py-2.5 rounded-2xl max-w-[80%] ${
                    msg.role === "user"
                      ? "bg-indigo-500 text-white rounded-br-none"
                      : "bg-zinc-800 text-zinc-200 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-zinc-300" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="px-4 py-3 rounded-2xl max-w-[80%] bg-zinc-800 text-zinc-200 rounded-bl-none flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                  <span className="text-sm text-zinc-400">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the AI agent..."
          className="flex-1 bg-zinc-800 border-zinc-700 text-white focus-visible:ring-indigo-500"
          disabled={loading}
        />
        <Button 
          type="submit" 
          disabled={!input.trim() || loading}
          className="bg-indigo-500 hover:bg-indigo-600 text-white"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
