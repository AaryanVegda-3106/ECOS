"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Send, Check, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Profile {
  id: string;
  name: string;
  role: { name: string; tier: string };
}

export function NotificationComposer({ 
  trigger,
  onSuccess 
}: { 
  trigger: React.ReactNode;
  onSuccess?: () => void;
}) {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [scope, setScope] = useState<"INDIVIDUAL" | "GLOBAL">("INDIVIDUAL");
  // using string array because my simple ui will handle multiple individuals later. 
  // for now just simple dropdown with one individual selection or checking multiple in custom UI
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const isGlobalAllowed = ["MASTER", "LEADERSHIP"].includes(user?.role?.tier || "");

  useEffect(() => {
    if (open && profiles.length === 0) {
      apiFetch<{ data: Profile[] }>("/users")
        .then((res) => setProfiles(res.data || []))
        .catch(console.error);
    }
  }, [open, profiles.length]);

  const handleSend = async () => {
    if (!message.trim()) return;
    if (scope === "INDIVIDUAL" && selectedUserIds.length === 0) return;

    setLoading(true);
    try {
      const res = await apiFetch("/notifications/send", {
        method: "POST",
        body: JSON.stringify({
          scope,
          recipientIds: scope === "GLOBAL" ? undefined : selectedUserIds,
          message: message.trim()
        })
      });

      if (res.data) {
        setOpen(false);
        setMessage("");
        setSelectedUserIds([]);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error("Failed to send notification:", err);
      alert("Failed to send notification. You may not have permission.");
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (id: string) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Send an announcement to individuals or the entire committee.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Scope Selection */}
          <div className="space-y-2">
            <Label>Audience</Label>
            <Select 
               value={scope} 
               onValueChange={(v) => {
                 setScope(v as any);
                 if (v === "GLOBAL") setSelectedUserIds([]);
               }}
            >
              <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 focus:ring-indigo-500">
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="INDIVIDUAL">Specific Members</SelectItem>
                {isGlobalAllowed && (
                  <SelectItem value="GLOBAL">Entire Committee (Global)</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Individual Recipient Selection */}
          {scope === "INDIVIDUAL" && (
            <div className="space-y-2">
              <Label>Select Recipients</Label>
              <div className="max-h-[150px] overflow-y-auto border border-zinc-800 rounded-md bg-zinc-900/50 p-1 custom-scrollbar">
                {profiles.map(p => {
                  if (p.id === user?.id) return null; // Can't send to self
                  
                  const isSelected = selectedUserIds.includes(p.id);
                  return (
                    <div 
                      key={p.id}
                      onClick={() => toggleUser(p.id)}
                      className={`flex items-center gap-2 p-2 text-sm rounded cursor-pointer transition-colors ${
                        isSelected ? "bg-indigo-500/20 text-indigo-300" : "hover:bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? "border-indigo-500 bg-indigo-500" : "border-zinc-600"
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="truncate">{p.name}</span>
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded ml-auto">{p.role.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Message Content */}
          <div className="space-y-2">
             <Label htmlFor="message">Message</Label>
             <Textarea 
                id="message" 
                placeholder="Write your announcement here..."
                className="bg-zinc-900 border-zinc-800 text-zinc-100 min-h-[100px] resize-none focus:border-indigo-500"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
             />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-900">
            Cancel
          </Button>
          <Button 
             onClick={handleSend} 
             className="bg-indigo-600 text-white hover:bg-indigo-500 gap-2 shadow-[0_0_15px_rgba(79,70,229,0.2)]"
             disabled={loading || !message.trim() || (scope === "INDIVIDUAL" && selectedUserIds.length === 0)}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
