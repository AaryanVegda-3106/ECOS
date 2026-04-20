"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ShieldAlert, Users, Loader2 } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  role: {
    name: string;
    tier: string;
  };
}

export function RoleSwitcher() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Only MASTER tier should be able to see/use this
  if (user?.role?.tier !== "MASTER") {
    return null;
  }

  useEffect(() => {
    if (open && profiles.length === 0) {
      apiFetch<{ data: Profile[] }>("/users")
        .then((res) => setProfiles(res.data || []))
        .catch(console.error);
    }
  }, [open, profiles.length]);

  const switchProfile = async (targetUserId: string) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/v1/auth/switch-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/)?.[1]}`
        },
        body: JSON.stringify({ targetUserId }),
      });
      
      const data = await res.json();
      if (res.ok) {
        document.cookie = `access_token=${data.token}; path=/; max-age=900`;
        // Hard refresh to reload all context as the new user
        window.location.href = "/dashboard";
      } else {
        alert(data.error || "Failed to switch role");
      }
    } catch {
      alert("Network Error");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-zinc-400 hover:text-white border border-dashed border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 hidden md:flex">
          <ShieldAlert className="w-4 h-4 text-orange-400" />
          <span>Switch Profile</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px] bg-zinc-950 border-zinc-800 text-zinc-100 max-h-[400px] overflow-y-auto custom-scrollbar">
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-zinc-400 uppercase tracking-wider">
          <Users className="w-4 h-4" /> Committee Members
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />
        
        {profiles.map((p) => {
          const isActive = user.id === p.id;
          return (
            <DropdownMenuItem
              key={p.id}
              onClick={() => !isActive && switchProfile(p.id)}
              disabled={loading || isActive}
              className={`flex items-center gap-3 p-3 cursor-pointer focus:bg-zinc-900 ${
                isActive ? "opacity-50 cursor-default" : ""
              }`}
            >
               <Avatar className="h-8 w-8 border border-zinc-800 shrink-0">
                 <AvatarFallback className="bg-zinc-900 text-xs">
                   {getInitials(p.name)}
                 </AvatarFallback>
               </Avatar>
               <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="text-sm font-medium leading-none mb-1 truncate text-white">{p.name}</span>
                  <span className={`text-[10px] uppercase font-semibold w-fit px-1.5 py-0.5 rounded ${
                    p.role.tier === "MASTER" ? "bg-red-500/10 text-red-400" :
                    p.role.tier === "LEADERSHIP" ? "bg-orange-500/10 text-orange-400" :
                    p.role.tier === "OPERATIONS" ? "bg-blue-500/10 text-blue-400" :
                    "bg-zinc-800 text-zinc-300"
                  }`}>
                    {p.role.name}
                  </span>
               </div>
               {loading && !isActive && <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />}
            </DropdownMenuItem>
          );
        })}

        {profiles.length === 0 && !loading && (
          <div className="p-4 text-center text-sm text-zinc-500">Loading members...</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
