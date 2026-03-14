"use client";

import { useEffect, useState } from "react";
import { Session } from "next-auth";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Video,
  FolderOpen,
  TrendingUp,
  GitBranch,
  Zap,
  AlertCircle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { formatRelativeTime, truncate } from "@/lib/utils";
import Link from "next/link";
import type { Task, Meeting, Project } from "@/types";

interface DashboardClientProps {
  session: Session | null;
}

const mockStats = {
  totalMeetings: 24,
  tasksCreated: 137,
  githubIssues: 89,
  completedTasks: 64,
};

export function DashboardClient({ session }: DashboardClientProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [tasksRes, meetingsRes, projectsRes] = await Promise.all([
          fetch(
            `/api/tasks?assigned_to=${session?.user?.github_username || ""}`
          ),
          fetch("/api/meetings"),
          fetch("/api/projects"),
        ]);
        const tasksData = await tasksRes.json();
        const meetingsData = await meetingsRes.json();
        const projectsData = await projectsRes.json();

        setTasks(tasksData.tasks || []);
        setMeetings(meetingsData.meetings || []);
        setProjects(projectsData.projects || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [session]);

  const openTasks = tasks.filter((t) => t.status === "open");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Video}
          label="Total Meetings"
          value={meetings.length || mockStats.totalMeetings}
          trend="+3 this week"
          color="brand"
        />
        <StatCard
          icon={Zap}
          label="Tasks Created"
          value={tasks.length || mockStats.tasksCreated}
          trend="AI extracted"
          color="purple"
        />
        <StatCard
          icon={GitBranch}
          label="GitHub Issues"
          value={tasks.filter((t) => t.github_issue_url).length || mockStats.githubIssues}
          trend="Auto-created"
          color="green"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={completedTasks.length || mockStats.completedTasks}
          trend={`${Math.round(((completedTasks.length || mockStats.completedTasks) / (tasks.length || mockStats.tasksCreated)) * 100)}%`}
          color="yellow"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assigned Tasks */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="section-title">Assigned to Me</h3>
                <p className="section-subtitle mt-0.5">
                  {openTasks.length} open tasks
                </p>
              </div>
              <Link href="/dashboard/meetings" className="btn-ghost text-xs">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <TaskSkeleton />
            ) : openTasks.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                text="No open tasks assigned to you"
              />
            ) : (
              <div className="space-y-3">
                {openTasks.slice(0, 5).map((task) => (
                  <TaskRow key={task.task_id} task={task} />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Projects + Activity */}
        <div className="space-y-4">
          {/* Active Projects */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Projects</h3>
              <Link href="/dashboard/projects" className="btn-ghost text-xs">
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-surface-elevated rounded-lg animate-pulse" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <EmptyState icon={FolderOpen} text="No projects yet" />
            ) : (
              <div className="space-y-2">
                {projects.slice(0, 4).map((project) => (
                  <div
                    key={project.project_id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-surface-elevated hover:bg-surface-border transition-colors"
                  >
                    <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {project.project_name}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        {truncate(project.description, 40)}
                      </p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pipeline Status */}
          <Card>
            <h3 className="section-title mb-4">AI Pipeline Status</h3>
            <div className="space-y-3">
              {[
                { label: "Sarvam AI (STT)", status: "operational" },
                { label: "Gemini (Analysis)", status: "operational" },
                { label: "GitHub API", status: "operational" },
                { label: "Jira API", status: "operational" },
                { label: "Notion API", status: "operational" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-text-secondary">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs text-green-400">Ready</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Meetings */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="section-title">Recent Meetings</h3>
            <p className="section-subtitle mt-0.5">
              Latest meeting analyses and task extractions
            </p>
          </div>
          <Link href="/dashboard/meetings" className="btn-primary text-xs">
            <Video className="w-3.5 h-3.5" />
            New Meeting
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-surface-elevated rounded-lg animate-pulse" />
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <EmptyState icon={Video} text="No meetings yet. Upload or start a live meeting." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border">
                  {["Meeting", "Type", "Status", "Tasks", "Date"].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-medium text-text-muted pb-3 pr-4"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {meetings.slice(0, 5).map((meeting) => (
                  <tr key={meeting.meeting_id} className="hover:bg-surface-elevated/50 transition-colors">
                    <td className="py-3 pr-4">
                      <p className="text-sm font-medium text-text-primary">
                        {meeting.title || "Untitled Meeting"}
                      </p>
                      <p className="text-xs text-text-muted">
                        {truncate(meeting.summary || "Processing...", 50)}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={meeting.meeting_type === "live" ? "task" : "decision"}>
                        {meeting.meeting_type === "live" ? "Live" : "Upload"}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        variant={
                          meeting.status === "completed"
                            ? "completed"
                            : meeting.status === "failed"
                            ? "bug"
                            : "in_progress"
                        }
                      >
                        {meeting.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm text-text-secondary">
                        {tasks.filter((t) => t.meeting_id === meeting.meeting_id).length}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-xs text-text-muted">
                        {formatRelativeTime(meeting.created_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  trend: string;
  color: "brand" | "purple" | "green" | "yellow";
}) {
  const colorMap = {
    brand: "bg-brand-600/20 text-brand-400",
    purple: "bg-purple-600/20 text-purple-400",
    green: "bg-green-600/20 text-green-400",
    yellow: "bg-yellow-600/20 text-yellow-400",
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg ${colorMap[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs text-green-400 font-medium">{trend}</span>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-text-primary">{value}</div>
        <div className="text-sm text-text-muted mt-0.5">{label}</div>
      </div>
    </Card>
  );
}

function TaskRow({ task }: { task: Task }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-elevated hover:bg-surface-border transition-colors">
      <div
        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
          task.priority === "high"
            ? "bg-red-400"
            : task.priority === "medium"
            ? "bg-yellow-400"
            : "bg-green-400"
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{task.title}</p>
        <p className="text-xs text-text-muted truncate">{truncate(task.description, 60)}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant={task.type}>{task.type}</Badge>
          <Badge variant={task.priority}>{task.priority}</Badge>
          {task.github_issue_url && (
            <a
              href={task.github_issue_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-brand-400 hover:underline"
            >
              <GitBranch className="w-3 h-3" /> GitHub
            </a>
          )}
        </div>
      </div>
      {task.deadline && (
        <div className="flex items-center gap-1 text-xs text-text-muted flex-shrink-0">
          <Clock className="w-3 h-3" />
          {task.deadline}
        </div>
      )}
    </div>
  );
}

function TaskSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 bg-surface-elevated rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-12 h-12 bg-surface-elevated rounded-xl flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-text-muted" />
      </div>
      <p className="text-sm text-text-muted">{text}</p>
    </div>
  );
}
