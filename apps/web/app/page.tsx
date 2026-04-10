"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LucideCommand, Calendar, ArrowRight, Zap, Target, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const events = [
    { title: "TechNova 2026", date: "April 15-17", type: "Hackathon", description: "Flagship 48-hour annual hackathon event." },
    { title: "AI/ML Workshop", date: "April 20", type: "Workshop", description: "Session 2: Supervised learning methodologies." },
    { title: "Membership Drive", date: "Ongoing", type: "Initiative", description: "Recruiting freshmen for technical committees." }
  ];

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(79,70,229,0.15),rgba(255,255,255,0))]"></div>
      
      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <LucideCommand className="w-8 h-8 text-indigo-400" />
          <span className="text-xl font-bold text-white tracking-widest">ECOS</span>
        </div>
        <Link href="/login">
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]">
            Access Portal <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center flex-1 justify-center text-center px-4 py-20 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight">
          Executive Committee <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            Operating System
          </span>
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          The central nervous system for our IEEE Student Branch. Manage pipelines, track tasks, balance budgets, and drive initiatives seamlessly from a single unified platform.
        </p>
        <Link href="/login">
          <Button size="lg" className="h-14 px-8 text-lg bg-zinc-100 hover:bg-white text-zinc-900 font-semibold rounded-full shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-transform hover:scale-105 duration-300">
            Enter Dashboard
          </Button>
        </Link>
      </section>

      {/* Upcoming Events / Initiatives Section */}
      <section className="relative z-10 bg-zinc-900/40 border-t border-zinc-800 backdrop-blur-xl py-24 px-6 mt-12 w-full flex justify-center">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Upcoming Events & Initiatives</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">Explore the ongoing projects and upcoming pipelines currently being managed through ECOS.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {events.map((evt, idx) => (
              <Card key={idx} className="bg-zinc-900/60 border-zinc-800 hover:border-indigo-500/50 transition-colors group">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[11px] font-bold tracking-wider uppercase bg-zinc-800 text-indigo-400 px-2 py-1 rounded">
                      {evt.type}
                    </span>
                    <span className="flex items-center text-xs font-medium text-zinc-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {evt.date}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">{evt.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">{evt.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/80 py-8 text-center bg-zinc-950">
        <p className="text-zinc-500 text-sm">© 2026 IEEE Student Branch. ECOS Platform powered by Next.js.</p>
      </footer>
    </main>
  );
}
