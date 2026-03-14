"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/Sidebar";
import { Card, Button, Badge } from "@/components/ui";
import {
  Video,
  Upload,
  Plus,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Zap,
  GitBranch,
  FileText,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { Meeting, Task } from "@/types";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [meetingsRes, tasksRes] = await Promise.all([
        fetch("/api/meetings"),
        fetch("/api/tasks"),
      ]);
      const [meetingsData, tasksData] = await Promise.all([
        meetingsRes.json(),
        tasksRes.json(),
      ]);
      setMeetings(meetingsData.meetings || []);
      setTasks(tasksData.tasks || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Meetings" subtitle="Upload or start live meetings" />
      <div className="p-6 space-y-6">
        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="card-hover p-6 cursor-pointer group"
            onClick={() => router.push("/dashboard/meetings/upload")}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-brand-600/20 rounded-xl flex items-center justify-center group-hover:bg-brand-600/30 transition-colors">
                <Upload className="w-7 h-7 text-brand-400" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Upload Meeting</h3>
                <p className="text-sm text-text-secondary mt-0.5">
                  Upload audio or video recording for AI analysis
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-text-muted ml-auto group-hover:text-text-secondary transition-colors" />
            </div>
            <div className="mt-4 pt-4 border-t border-surface-border flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-brand-400" /> Sarvam AI STT</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-purple-400" /> Gemini analysis</span>
              <span className="flex items-center gap-1"><GitBranch className="w-3 h-3 text-green-400" /> Auto-issues</span>
            </div>
          </div>

          <div
            className="card-hover p-6 cursor-pointer group"
            onClick={() => router.push("/dashboard/meetings/live")}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-red-600/20 rounded-xl flex items-center justify-center group-hover:bg-red-600/30 transition-colors">
                <Video className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Start Live Meeting</h3>
                <p className="text-sm text-text-secondary mt-0.5">
                  Record a live meeting with real-time transcript
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-text-muted ml-auto group-hover:text-text-secondary transition-colors" />
            </div>
            <div className="mt-4 pt-4 border-t border-surface-border flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 recording-pulse" /> Live recording
              </span>
              <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Live transcript</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Meeting timer</span>
            </div>
          </div>
        </div>

        {/* Meeting History */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-4">Meeting History</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-surface-card rounded-xl animate-pulse border border-surface-border" />
              ))}
            </div>
          ) : meetings.length === 0 ? (
            <Card className="py-16 text-center">
              <div className="flex flex-col items-center">
                <Video className="w-12 h-12 text-text-muted mb-3" />
                <p className="text-text-muted text-sm">No meetings yet. Upload or start a live meeting.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {meetings.map((meeting) => {
                const meetingTasks = tasks.filter((t) => t.meeting_id === meeting.meeting_id);
                return (
                  <MeetingRow
                    key={meeting.meeting_id}
                    meeting={meeting}
                    taskCount={meetingTasks.length}
                    bugCount={meetingTasks.filter((t) => t.type === "bug").length}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MeetingRow({
  meeting,
  taskCount,
  bugCount,
}: {
  meeting: Meeting;
  taskCount: number;
  bugCount: number;
}) {
  return (
    <Card hover className="flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            meeting.meeting_type === "live" ? "bg-red-600/20" : "bg-brand-600/20"
          }`}
        >
          <Video
            className={`w-5 h-5 ${
              meeting.meeting_type === "live" ? "text-red-400" : "text-brand-400"
            }`}
          />
        </div>
        <div className="min-w-0">
          <h4 className="font-medium text-text-primary">
            {meeting.title || "Untitled Meeting"}
          </h4>
          <p className="text-xs text-text-muted mt-0.5 truncate">
            {meeting.summary || "Processing transcript..."}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
        <Badge variant={meeting.meeting_type === "live" ? "task" : "decision"}>
          {meeting.meeting_type}
        </Badge>
        <div
          className={`flex items-center gap-1.5 ${
            meeting.status === "completed"
              ? "text-green-400"
              : meeting.status === "failed"
              ? "text-red-400"
              : "text-yellow-400"
          }`}
        >
          {meeting.status === "completed" ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : meeting.status === "failed" ? (
            <span className="w-3.5 h-3.5 text-red-400">✗</span>
          ) : (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          )}
          <span className="text-xs font-medium capitalize">{meeting.status}</span>
        </div>
        <span className="text-xs text-text-muted bg-surface-elevated px-2 py-1 rounded-full">
          {taskCount} tasks
        </span>
        {bugCount > 0 && (
          <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
            {bugCount} bugs
          </span>
        )}
        {meeting.notion_url && (
          <a
            href={meeting.notion_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-400 hover:underline flex items-center gap-1"
          >
            <FileText className="w-3 h-3" /> Notion
          </a>
        )}
        <span className="text-xs text-text-muted">{formatRelativeTime(meeting.created_at)}</span>
      </div>
    </Card>
  );
}
