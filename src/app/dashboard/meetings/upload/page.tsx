"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/Sidebar";
import { Card, Button, Select, Badge } from "@/components/ui";
import {
  Upload,
  FileAudio,
  X,
  CheckCircle2,
  Loader2,
  GitBranch,
  FileText,
  AlertTriangle,
  ChevronLeft,
  Zap,
  Bot,
  ExternalLink,
} from "lucide-react";
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

export default function UploadMeetingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedProject, setSelectedProject] = useState(searchParams.get("project") || "");
  const [selectedTeam, setSelectedTeam] = useState(searchParams.get("team") || "");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState("");
  const [step, setStep] = useState<"setup" | "uploading" | "analyzing" | "complete" | "error">("setup");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/teams").then((r) => r.json()),
    ]).then(([pd, td]) => {
      setProjects(pd.projects || []);
      setTeams(td.teams || []);
    });
  }, []);

  const filteredTeams = teams.filter(
    (t) => !selectedProject || t.project_id === selectedProject
  );

  async function handleAnalyze() {
    if (!selectedProject || !selectedTeam) {
      setError("Please select a project and team.");
      return;
    }
    if (!file && !transcript) {
      setError("Please upload a file or paste a transcript.");
      return;
    }

    setError("");
    setStep("uploading");

    try {
      // Create meeting record
      const meetingRes = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: selectedProject,
          team_id: selectedTeam,
          title: meetingTitle || "Uploaded Meeting",
          meeting_type: "upload",
        }),
      });
      const { meeting } = await meetingRes.json();

      setStep("analyzing");

      // Submit for analysis
      const fd = new FormData();
      fd.append("meeting_id", meeting.meeting_id);
      fd.append("project_id", selectedProject);
      fd.append("team_id", selectedTeam);
      if (file) fd.append("audio", file);
      if (transcript) fd.append("transcript", transcript);

      const analysisRes = await fetch("/api/meetings/analyze", {
        method: "POST",
        body: fd,
      });
      const analysis = await analysisRes.json();

      if (analysis.error) throw new Error(analysis.error);

      setResult(analysis);
      setStep("complete");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error occurred");
      setStep("error");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Upload Meeting" subtitle="Upload audio/video for AI analysis" />
      <div className="p-6 max-w-3xl mx-auto w-full space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Meetings
        </button>

        {step === "setup" && (
          <div className="space-y-4 animate-fade-in">
            {/* Pipeline */}
            <Card className="bg-gradient-to-r from-brand-900/40 to-purple-900/40 border-brand-500/20">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-brand-300 uppercase tracking-wide">Pipeline:</span>
                {["Audio Upload", "Sarvam AI STT", "Transcript Chunks", "Gemini Analysis", "GitHub Issues", "Jira Tickets", "Notion Notes"].map(
                  (s, i, arr) => (
                    <div key={s} className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary bg-surface-elevated px-2 py-0.5 rounded-full">{s}</span>
                      {i < arr.length - 1 && <span className="text-text-muted">→</span>}
                    </div>
                  )
                )}
              </div>
            </Card>

            {/* Configuration */}
            <Card>
              <h3 className="font-semibold text-text-primary mb-4">Meeting Setup</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Meeting Title</label>
                  <input
                    className="input"
                    placeholder="Sprint Planning, Bug Review..."
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Project *"
                    options={[
                      { value: "", label: "Select project..." },
                      ...projects.map((p) => ({ value: p.project_id, label: p.project_name })),
                    ]}
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                  />
                  <Select
                    label="Team *"
                    options={[
                      { value: "", label: "Select team..." },
                      ...filteredTeams.map((t) => ({ value: t.team_id, label: t.team_name })),
                    ]}
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* File Upload */}
            <Card>
              <h3 className="font-semibold text-text-primary mb-4">Upload Audio / Video</h3>
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
                  dragOver
                    ? "border-brand-500 bg-brand-500/5"
                    : "border-surface-border hover:border-brand-500/50 hover:bg-surface-elevated/50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="audio/*,video/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileAudio className="w-10 h-10 text-brand-400" />
                    <p className="text-sm font-medium text-text-primary">{file.name}</p>
                    <p className="text-xs text-text-muted">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 mt-1"
                    >
                      <X className="w-3 h-3" /> Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-10 h-10 text-text-muted" />
                    <p className="text-sm text-text-primary font-medium">
                      Drop your meeting recording here
                    </p>
                    <p className="text-xs text-text-muted">
                      MP3, WAV, MP4, M4A, OGG supported
                    </p>
                    <span className="text-xs text-brand-400 mt-1">Click to browse</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex-1 h-px bg-surface-border" />
                <span className="text-xs text-text-muted">or paste transcript</span>
                <div className="flex-1 h-px bg-surface-border" />
              </div>

              <textarea
                className="input mt-4 resize-none"
                rows={6}
                placeholder="Paste the meeting transcript here directly (will skip Sarvam AI step)..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />
            </Card>

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button
              className="w-full py-3"
              onClick={handleAnalyze}
              disabled={!selectedProject || !selectedTeam || (!file && !transcript)}
            >
              <Zap className="w-4 h-4" />
              Analyze with AI
            </Button>
          </div>
        )}

        {(step === "uploading" || step === "analyzing") && (
          <ProcessingView step={step} />
        )}

        {step === "complete" && result && (
          <ResultView result={result} onBack={() => router.push("/dashboard/meetings")} />
        )}

        {step === "error" && (
          <Card className="py-10 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">Analysis Failed</h3>
            <p className="text-text-muted text-sm mb-4">{error}</p>
            <Button onClick={() => { setStep("setup"); setError(""); }}>Try Again</Button>
          </Card>
        )}
      </div>
    </div>
  );
}

function ProcessingView({ step }: { step: string }) {
  const stages = [
    { id: "uploading", label: "Uploading audio file", icon: Upload },
    { id: "transcribing", label: "Sarvam AI transcribing speech", icon: FileText },
    { id: "chunking", label: "Chunking transcript", icon: Zap },
    { id: "analyzing", label: "Gemini AI analyzing meeting", icon: Bot },
    { id: "creating", label: "Creating GitHub/Jira/Notion items", icon: GitBranch },
  ];

  const currentIdx = step === "uploading" ? 0 : 2;

  return (
    <Card className="py-10 animate-fade-in">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 gradient-brand rounded-2xl flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            {step === "uploading" ? "Uploading Meeting" : "Analyzing Meeting"}
          </h3>
          <p className="text-text-muted text-sm">This may take a minute for longer recordings</p>
        </div>
        <div className="w-full max-w-sm space-y-3">
          {stages.map((stage, i) => (
            <div key={stage.id} className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  i < currentIdx
                    ? "bg-green-500/20 text-green-400"
                    : i === currentIdx
                    ? "bg-brand-500/20 text-brand-400"
                    : "bg-surface-elevated text-text-muted"
                }`}
              >
                {i < currentIdx ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : i === currentIdx ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="text-xs">{i + 1}</span>
                )}
              </div>
              <span
                className={`text-sm ${
                  i <= currentIdx ? "text-text-primary" : "text-text-muted"
                }`}
              >
                {stage.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function ResultView({ result, onBack }: { result: AnalysisResult; onBack: () => void }) {
  return (
    <div className="space-y-4 animate-slide-up">
      {/* Success banner */}
      <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-400">Analysis Complete!</p>
          <p className="text-xs text-text-muted">
            {result.tasks.length} tasks extracted and pushed to your integrations.
          </p>
        </div>
        {result.notion_url && (
          <a href={result.notion_url} target="_blank" rel="noopener noreferrer" className="ml-auto">
            <Button variant="secondary" size="sm">
              <ExternalLink className="w-3.5 h-3.5" /> View in Notion
            </Button>
          </a>
        )}
      </div>

      {/* Summary */}
      <Card>
        <h3 className="font-semibold text-text-primary mb-3">Meeting Summary</h3>
        <p className="text-sm text-text-secondary leading-relaxed">{result.analysis.summary}</p>

        {result.analysis.decisions.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
              Decisions Made
            </h4>
            <ul className="space-y-1.5">
              {result.analysis.decisions.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 flex-shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Extracted Tasks */}
      <Card>
        <h3 className="font-semibold text-text-primary mb-4">
          Extracted Tasks ({result.tasks.length})
        </h3>
        <div className="space-y-3">
          {result.tasks.map((task, i) => (
            <div key={i} className="p-4 bg-surface-elevated rounded-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-text-primary">{task.title}</h4>
                  <p className="text-xs text-text-muted mt-1">{task.description}</p>
                  {task.assigned_to && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <img
                        src={`https://avatars.githubusercontent.com/${task.assigned_to}`}
                        alt={task.assigned_to}
                        className="w-4 h-4 rounded-full"
                      />
                      <span className="text-xs text-text-secondary">@{task.assigned_to}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <Badge variant={task.type}>{task.type}</Badge>
                  <Badge variant={task.priority}>{task.priority}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-surface-border">
                {task.github_issue_url && (
                  <a
                    href={task.github_issue_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-text-muted hover:text-brand-400 transition-colors"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-green-400" /> GitHub Issue
                  </a>
                )}
                {task.jira_issue_url && (
                  <a
                    href={task.jira_issue_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-text-muted hover:text-blue-400 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" /> Jira Ticket
                  </a>
                )}
                {!task.github_issue_url && !task.jira_issue_url && (
                  <span className="text-xs text-text-muted">Saved to database</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Button className="w-full" onClick={onBack}>
        Back to Meetings
      </Button>
    </div>
  );
}
