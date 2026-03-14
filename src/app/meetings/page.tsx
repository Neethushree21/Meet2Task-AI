"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, Video, Mic, StopCircle, CheckCircle2, Loader2, GitBranch, AlertTriangle, Zap, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Project, Team, Task } from "@/types";

type AnalysisResult = {
  transcript: string;
  analysis: {
    summary: string;
    decisions: string[];
    key_points: string[];
  };
  tasks: Task[];
  notion_url: string | null;
};

export default function Meetings() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<"setup" | "processing" | "complete" | "error">("setup");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/projects").then(r => r.json()).then(d => setProjects(d.projects || []));
    fetch("/api/teams").then(r => r.json()).then(d => setTeams(d.teams || []));
  }, []);

  const filteredTeams = teams.filter((t) => !selectedProject || t.project_id === selectedProject);

  async function handleAnalyze() {
    if (!selectedProject || !selectedTeam) {
      setError("Please select a project and a team.");
      return;
    }
    if (!file) {
      setError("Please attach an audio/video file.");
      return;
    }

    setError("");
    setStep("processing");

    try {
      // 1. Create meeting record
      const meetingRes = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: selectedProject,
          team_id: selectedTeam,
          title: meetingTitle || file.name,
          meeting_type: "upload",
        }),
      });
      const { meeting } = await meetingRes.json();

      // 2. Submit for analysis
      const fd = new FormData();
      fd.append("meeting_id", meeting.meeting_id);
      fd.append("project_id", selectedProject);
      fd.append("team_id", selectedTeam);
      fd.append("audio", file);

      const analysisRes = await fetch("/api/meetings/analyze", {
        method: "POST",
        body: fd,
      });
      const data = await analysisRes.json();

      if (data.error) throw new Error(data.error);

      setResult(data);
      setStep("complete");
      setFile(null);
    } catch (e: any) {
      setError(e.message || "Something went wrong during analysis.");
      setStep("error");
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Meetings to Tasks</h1>
        <p className="text-muted-foreground">Upload recordings to generate assignments, issues, and notes automatically.</p>
      </div>

      {step === "setup" && (
        <div className="flex items-start gap-8">
          {/* Main Upload Area */}
          <div className="flex-1 flex flex-col gap-6">
            <div 
              className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-primary/20 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group"
              onClick={() => fileRef.current?.click()}
            >
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <UploadCloud className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Upload Meeting File</h3>
              <p className="text-sm text-muted-foreground mt-2 text-center max-w-sm">
                {file ? file.name : "Drag and drop your text transcript, audio, or video file here. TXT, MP4, MP3, WAV supported."}
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="audio/*,video/*,text/plain,.txt"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <button className="mt-6 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium text-sm transition-colors">
                {file ? "Change File" : "Select File"}
              </button>
            </div>
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex gap-2 items-center">
                <AlertTriangle className="h-4 w-4" /> {error}
              </div>
            )}
            <button 
              onClick={handleAnalyze}
              disabled={!file}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Zap className="h-4 w-4" /> Run AI Analysis
            </button>
          </div>

          {/* Configuration Form */}
          <Card className="w-80 shrink-0">
            <CardHeader>
              <CardTitle className="text-base">Meeting Context</CardTitle>
              <CardDescription>Tell the AI where to file tasks</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold">Meeting Title</label>
                <input 
                  type="text" 
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Q1 Planning Sync"
                  className="px-3 py-2 border rounded-md text-sm bg-background w-full"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold">Project</label>
                <select 
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm bg-background w-full"
                >
                  <option value="">Select Project...</option>
                  {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold">Team members</label>
                <select 
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm bg-background w-full"
                >
                  <option value="">Select Team...</option>
                  {filteredTeams.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
                </select>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === "processing" && (
        <div className="py-20 flex flex-col items-center justify-center animate-fade-in text-center">
           <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
           </div>
           <h2 className="text-2xl font-semibold mb-2">Analyzing Meeting with AI</h2>
           <p className="text-muted-foreground max-w-sm">Uploading file, transcribing speech, identifying action items, and creating Jira/GitHub tickets...</p>
        </div>
      )}

      {step === "error" && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
           <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
           <h2 className="text-2xl font-semibold mb-2">Analysis Failed</h2>
           <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
           <button onClick={() => setStep("setup")} className="px-6 py-2 bg-secondary rounded-lg font-medium">Try Again</button>
        </div>
      )}

      {step === "complete" && result && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-lg flex justify-between items-center">
             <div className="flex items-center gap-3">
               <CheckCircle2 className="h-6 w-6" />
               <span className="font-semibold">Meeting analyzed and tasks successfully synced!</span>
             </div>
             {result.notion_url && (
               <a href={result.notion_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold bg-green-500/20 px-3 py-1.5 rounded flex items-center gap-1.5 hover:bg-green-500/30 transition-colors">
                  <ExternalLink className="h-3 w-3" /> View Notion Log
               </a>
             )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <Card>
                <CardHeader>
                   <CardTitle>Extracted Tasks ({result.tasks.length})</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {result.tasks.map((task, i) => (
                    <div key={i} className="flex flex-col gap-3 p-4 border border-border/50 bg-muted/20 rounded-lg">
                       <div className="flex justify-between items-start">
                         <div>
                            <h4 className="font-semibold text-sm">{task.title}</h4>
                            <p className="text-muted-foreground text-xs mt-1">{task.description}</p>
                         </div>
                         <Badge variant={task.type === "bug" ? "destructive" : "default"}>{task.type}</Badge>
                       </div>
                       <div className="flex items-center gap-4 text-xs mt-2 border-t border-border/50 pt-3">
                          <span className="font-medium bg-secondary px-2 py-0.5 rounded">@{task.assigned_to || "unassigned"}</span>
                          {task.github_issue_url && (
                            <a href={task.github_issue_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                               <GitBranch className="h-3 w-3" /> Issue #{task.github_issue_number}
                            </a>
                          )}
                          {task.jira_issue_url && (
                            <a href={task.jira_issue_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
                               <ExternalLink className="h-3 w-3" /> {task.jira_issue_key}
                            </a>
                          )}
                       </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            
            <div className="flex flex-col gap-6">
               <Card>
                 <CardHeader><CardTitle className="text-base">Executive Summary</CardTitle></CardHeader>
                 <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.analysis.summary}</p>
                 </CardContent>
               </Card>
               {result.analysis.decisions.length > 0 && (
                 <Card>
                   <CardHeader><CardTitle className="text-base">Key Decisions</CardTitle></CardHeader>
                   <CardContent>
                      <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                        {result.analysis.decisions.map((d, i) => (
                           <li key={i} className="flex gap-2"><span className="text-primary">•</span>{d}</li>
                        ))}
                      </ul>
                   </CardContent>
                 </Card>
               )}
            </div>
          </div>
          
          <div className="flex justify-center mt-6">
            <button onClick={() => setStep("setup")} className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm">
               Process Another Meeting
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
