"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
  role: {
    name: string;
    tier: string;
  };
  semester?: number;
  contribution?: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { data } = await apiFetch<{ data: Member[] }>("/users");
        setMembers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Members</h1>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 bg-zinc-900/50 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const filteredMembers = members.filter(m => {
    const term = search.toLowerCase();
    const nameMatch = m.name.toLowerCase().includes(term);
    const roleMatch = m.role?.name.toLowerCase().includes(term);
    const contribMatch = (m.contribution || "").toLowerCase().includes(term);
    const semMatch = m.semester?.toString().includes(term);
    return nameMatch || roleMatch || contribMatch || semMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Team Roster</h1>
          <p className="text-zinc-400 mt-1">View committee members and their roles</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            placeholder="Search by name, role, semester..." 
            className="pl-9 bg-zinc-900/50 border-zinc-800 text-zinc-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredMembers.map(member => (
          <Card key={member.id} className="bg-zinc-900/60 border-zinc-800">
            <CardContent className="p-5 flex flex-col items-center text-center space-y-3 mt-2">
              <Avatar className="h-16 w-16 border-2 border-zinc-800">
                <AvatarFallback className="bg-indigo-900/30 text-indigo-400 text-lg">
                  {member.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="font-semibold text-zinc-200">{member.name}</h3>
                <p className="text-xs text-zinc-500">{member.email}</p>
                {member.semester && <p className="text-xs text-indigo-400/80">Semester {member.semester}</p>}
              </div>
              <Badge variant="outline" className="border-indigo-500/20 text-indigo-400 bg-indigo-500/10">
                {member.role?.name || "Member"}
              </Badge>
              {member.contribution && (
                <div className="mt-4 pt-4 border-t border-zinc-800/80 w-full text-left">
                  <p className="text-[10px] text-zinc-500 uppercase font-semibold mb-1 tracking-wider">Contribution</p>
                  <p className="text-xs text-zinc-400 leading-snug">{member.contribution}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
