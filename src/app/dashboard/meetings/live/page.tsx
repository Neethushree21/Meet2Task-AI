"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/Sidebar";
import { Card, Button, Badge, Select } from "@/components/ui";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Users,
  FileText,
  Clock,
  Zap,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  AlertTriangle,
  GitBranch,
  ExternalLink,
} from "lucide-react";
import type { Project, Team, Task } from "@/types";

type MeetingState = "idle" | "live" | "processing" | "complete";

export default function LiveMeetingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedProject, setSelectedProject] = useState(searchParams.get("project") || "");
  const [selectedTeam, setSelectedTeam] = useState(searchParams.get("team") || "");
  const [meetingTitle, setMeetingTitle] = useState(`Meeting - ${new Date().toLocaleDateString()}`);

  const [state, setMeetingState] = useState<MeetingState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [participants] = useState(["You"]);
  const [result, setResult] = useState<{ tasks: Task[]; analysis: { summary: string; decisions: string[] }; notion_url: string | null } | null>(null);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/teams").then((r) => r.json()),
    ]).then(([pd, td]) => {
      setProjects(pd.projects || []);
      setTeams(td.teams || []);
    });
  }, []);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((secs % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  async function startMeeting() {
    if (!selectedProject || !selectedTeam) {
      setError("Please select a project and team.");
      return;
    }
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;

      // Web Speech API for live transcript
      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        const SpeechRecognitionAPI =
          (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition ||
          window.SpeechRecognition;
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalText = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalText += event.results[i][0].transcript + " ";
            }
          }
          if (finalText) {
            setTranscript((prev) => prev + finalText);
          }
        };
        recognition.start();
        recognitionRef.current = recognition;
      }

      // Timer
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      setMeetingState("live");
    } catch (e) {
      setError("Could not access microphone. Please allow microphone access.");
    }
  }

  async function endMeeting() {
    // Stop everything
    if (recognitionRef.current) recognitionRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());

    await new Promise((resolve) => setTimeout(resolve, 500));
    setMeetingState("processing");

    try {
      // Create meeting
      const meetingRes = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: selectedProject,
          team_id: selectedTeam,
          title: meetingTitle,
          meeting_type: "live",
        }),
      });
      const { meeting } = await meetingRes.json();

      // Prepare form data
      const fd = new FormData();
      fd.append("meeting_id", meeting.meeting_id);
      fd.append("project_id", selectedProject);
      fd.append("team_id", selectedTeam);
      if (transcript) fd.append("transcript", transcript);

      // If we have audio chunks, send audio
      if (audioChunksRef.current.length > 0 && !transcript) {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        fd.append("audio", audioBlob, "meeting.webm");
      }

      const analysisRes = await fetch("/api/meetings/analyze", {
        method: "POST",
        body: fd,
      });
      const analysis = await analysisRes.json();
      if (analysis.error) throw new Error(analysis.error);

      setResult(analysis);
      setMeetingState("complete");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to process meeting");
      setMeetingState("idle");
    }
  }

  const filteredTeams = teams.filter(
    (t) => !selectedProject || t.project_id === selectedProject
  );

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Live Meeting" subtitle="Record and transcribe in real-time" />
      <div className="p-6 space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Meetings
        </button>

        {state === "idle" && (
          <div className="max-w-xl mx-auto space-y-4 animate-fade-in">
            <Card>
              <h3 className="font-semibold text-text-primary mb-4">Meeting Setup</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Meeting Title</label>
                  <input
                    className="input"
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

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button
              className="w-full py-3"
              onClick={startMeeting}
              disabled={!selectedProject || !selectedTeam}
            >
              <Video className="w-4 h-4" />
              Start Live Meeting
            </Button>
          </div>
        )}

        {state === "live" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 animate-fade-in">
            {/* Main meeting area */}
            <div className="lg:col-span-3 space-y-4">
              {/* Video area */}
              <Card className="h-72 relative overflow-hidden bg-gradient-to-br from-surface-card to-surface-elevated flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-surface-elevated border-2 border-brand-500/30 flex items-center justify-center">
                    <Video className="w-10 h-10 text-text-muted" />
                  </div>
                </div>
                {/* Recording indicator */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 recording-pulse" />
                  <span className="text-xs text-white font-semibold bg-black/50 px-2 py-0.5 rounded-full">
                    REC
                  </span>
                </div>
                {/* Timer */}
                <div className="absolute top-4 right-4 text-sm font-mono font-bold text-white bg-black/60 px-3 py-1 rounded-full flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatTime(elapsed)}
                </div>
              </Card>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setMicMuted((m) => !m)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                    micMuted
                      ? "bg-red-500 hover:bg-red-400"
                      : "bg-surface-elevated hover:bg-surface-border"
                  }`}
                >
                  {micMuted ? (
                    <MicOff className="w-5 h-5 text-white" />
                  ) : (
                    <Mic className="w-5 h-5 text-text-primary" />
                  )}
                </button>
                <button
                  onClick={() => setVideoOff((v) => !v)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                    videoOff
                      ? "bg-red-500 hover:bg-red-400"
                      : "bg-surface-elevated hover:bg-surface-border"
                  }`}
                >
                  {videoOff ? (
                    <VideoOff className="w-5 h-5 text-white" />
                  ) : (
                    <Video className="w-5 h-5 text-text-primary" />
                  )}
                </button>
                <button
                  onClick={endMeeting}
                  className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-all duration-200"
                >
                  <PhoneOff className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Live Transcript */}
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-400" />
                    <h4 className="text-sm font-semibold text-text-primary">Live Transcript</h4>
                  </div>
                  {transcript && (
                    <span className="text-xs text-text-muted">{transcript.split(" ").length} words</span>
                  )}
                </div>
                <div className="h-40 overflow-y-auto rounded-lg bg-surface-elevated p-3">
                  {transcript ? (
                    <p className="text-sm text-text-secondary leading-relaxed">{transcript}</p>
                  ) : (
                    <div className="flex items-center gap-2 text-text-muted">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-1 h-4 bg-brand-500 rounded-full waveform-bar"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                      <span className="text-xs">Listening for speech...</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Title */}
              <Card>
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Meeting</h4>
                <p className="text-sm font-medium text-text-primary">{meetingTitle}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400 recording-pulse" />
                  <span className="text-xs text-red-400">Live</span>
                </div>
              </Card>

              {/* Participants */}
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-brand-400" />
                  <h4 className="text-sm font-semibold text-text-primary">
                    Participants ({participants.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {participants.map((p) => (
                    <div key={p} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center">
                        <span className="text-xs text-white font-bold">{p[0]}</span>
                      </div>
                      <span className="text-sm text-text-secondary">{p}</span>
                      <span className="w-2 h-2 rounded-full bg-green-400 ml-auto" />
                    </div>
                  ))}
                </div>
              </Card>

              {/* End meeting CTA */}
              <Button variant="danger" className="w-full justify-center" onClick={endMeeting}>
                <PhoneOff className="w-4 h-4" />
                End & Analyze
              </Button>
              <p className="text-xs text-text-muted text-center">
                The recording will be analyzed with AI automatically
              </p>
            </div>
          </div>
        )}

        {state === "processing" && (
          <Card className="max-w-xl mx-auto py-16 text-center animate-fade-in">
            <Loader2 className="w-16 h-16 text-brand-400 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">Analyzing Meeting</h3>
            <p className="text-text-muted text-sm">
              Running Gemini AI analysis, creating GitHub issues, Jira tickets, and Notion notes...
            </p>
            <div className="mt-6 space-y-2 text-left max-w-xs mx-auto">
              {["Processing transcript", "Extracting tasks with AI", "Creating integrations"].map(
                (s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 text-brand-400 animate-spin" />
                    <span className="text-xs text-text-secondary">{s}</span>
                  </div>
                )
              )}
            </div>
          </Card>
        )}

        {state === "complete" && result && (
          <div className="max-w-2xl mx-auto space-y-4 animate-slide-up">
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-400">Meeting Processed!</p>
                <p className="text-xs text-text-muted">
                  {result.tasks.length} tasks extracted · Duration: {formatTime(elapsed)}
                </p>
              </div>
            </div>

            <Card>
              <h3 className="font-semibold text-text-primary mb-3">Summary</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{result.analysis.summary}</p>
            </Card>

            <Card>
              <h3 className="font-semibold text-text-primary mb-4">
                Tasks Created ({result.tasks.length})
              </h3>
              <div className="space-y-3">
                {result.tasks.map((task, i) => (
                  <div key={i} className="p-3 bg-surface-elevated rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{task.title}</p>
                        {task.assigned_to && (
                          <p className="text-xs text-text-muted mt-0.5">@{task.assigned_to}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Badge variant={task.type}>{task.type}</Badge>
                        <Badge variant={task.priority}>{task.priority}</Badge>
                      </div>
                    </div>
                    {task.github_issue_url && (
                      <a
                        href={task.github_issue_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-green-400 hover:underline mt-2"
                      >
                        <GitBranch className="w-3 h-3" /> GitHub Issue Created
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Button className="w-full" onClick={() => router.push("/dashboard/meetings")}>
              Back to Meetings
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
