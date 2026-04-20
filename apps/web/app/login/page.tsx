"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LucideCommand, Code } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Rate limiting lock state
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  // Update countdown timer
  useEffect(() => {
    if (!lockoutTime) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockoutTime - Date.now()) / 1000));
      setLockoutRemaining(remaining);
      if (remaining === 0) {
        setLockoutTime(null);
        setErrorMsg("");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTime]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTime) return; // Prevent submissions during lockout
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("http://localhost:4000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (res.status === 429) {
        setLockoutTime(data.lockedUntil);
        setErrorMsg(data.error || "Too many failed attempts.");
      } else if (res.status === 401) {
        const remaining = data.attemptsRemaining;
        setErrorMsg(`Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before lockout.`);
      } else if (res.ok) {
        document.cookie = `access_token=${data.token}; path=/; max-age=900`;
        router.push("/dashboard");
      } else {
        setErrorMsg(data.error || "Login Failed");
      }
    } catch {
      setErrorMsg("Network Error");
    } finally {
      setLoading(false);
    }
  };

  const handleBypass = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("http://localhost:4000/api/v1/auth/bypass", {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok) {
        document.cookie = `access_token=${data.token}; path=/; max-age=900`;
        router.push("/dashboard");
      } else {
        setErrorMsg(data.error || "Bypass Failed");
      }
    } catch {
      setErrorMsg("Network Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      
      <div className="relative z-10 space-y-6 max-w-md w-full">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-lg mb-4">
            <LucideCommand className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">ECOS Access</h1>
          <p className="text-zinc-400">Executive Committee Operating System</p>
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-md shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-100">Sign In</CardTitle>
            <CardDescription className="text-zinc-400">
              Only authorized members may access this portal.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {errorMsg && (
                <div className={`p-3 text-sm rounded-lg flex flex-col gap-1 border border-destructive/20 bg-destructive/10 text-destructive`}>
                   <span className="font-semibold">{errorMsg}</span>
                   {lockoutTime && lockoutRemaining > 0 && (
                     <span>Unlock in {Math.floor(lockoutRemaining / 60)}:{String(lockoutRemaining % 60).padStart(2, '0')}</span>
                   )}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">Official Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="chair@ieeesb.org"
                  className="bg-zinc-950 border-zinc-800 text-zinc-100"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!lockoutTime || loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  className="bg-zinc-950 border-zinc-800 text-zinc-100"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!!lockoutTime || loading}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]" disabled={!!lockoutTime || loading}>
                {loading ? "Authenticating..." : lockoutTime ? "System Locked" : "Authorize"}
              </Button>
              <Button onClick={handleBypass} type="button" variant="outline" className="w-full border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all" disabled={loading}>
                <Code className="w-4 h-4 mr-2" /> Developer Bypass
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}
