"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { TopBar } from "@/components/layout/Sidebar";
import { Card, Button, Input, Select, Badge } from "@/components/ui";
import {
  Users,
  Plus,
  X,
  UserPlus,
  Video,
  Upload,
  Github,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { Team, Project, Task } from "@/types";

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newMember, setNewMember] = useState("");
  const [form, setForm] = useState({
    team_name: "",
    project_id: "",
    members: [] as string[],
  });
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [teamsRes, projectsRes, tasksRes] = await Promise.all([
        fetch("/api/teams"),
        fetch("/api/projects"),
        fetch("/api/tasks"),
      ]);
      const [teamsData, projectsData, tasksData] = await Promise.all([
        teamsRes.json(),
        projectsRes.json(),
        tasksRes.json(),
      ]);
      setTeams(teamsData.teams || []);
      setProjects(projectsData.projects || []);
      setTasks(tasksData.tasks || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.team_name || !form.project_id) return;
    setCreating(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.team) {
        setTeams((prev) => [data.team, ...prev]);
        setShowModal(false);
        setForm({ team_name: "", project_id: "", members: [] });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  }

  function addMember() {
    if (newMember && !form.members.includes(newMember)) {
      setForm((f) => ({ ...f, members: [...f.members, newMember] }));
      setNewMember("");
    }
  }

  function getProject(projectId: string) {
    return projects.find((p) => p.project_id === projectId);
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Teams" subtitle="Manage teams and meeting workflows" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Teams</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              {teams.length} teams across all projects
            </p>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            New Team
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-surface-card rounded-xl animate-pulse border border-surface-border" />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <EmptyTeams onNew={() => setShowModal(true)} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {teams.map((team) => (
              <TeamCard
                key={team.team_id}
                team={team}
                project={getProject(team.project_id)}
                tasks={tasks.filter((t) => t.project_id === team.project_id)}
                onStartLive={() => router.push(`/dashboard/meetings/live?team=${team.team_id}&project=${team.project_id}`)}
                onUpload={() => router.push(`/dashboard/meetings/upload?team=${team.team_id}&project=${team.project_id}`)}
              />
            ))}
          </div>
        )}

        {/* Recent Tasks Table */}
        {tasks.length > 0 && (
          <Card>
            <h3 className="section-title mb-5">Recent Team Tasks</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border">
                    {["Task", "Type", "Priority", "Assigned To", "Deadline", "Status"].map((h) => (
                      <th key={h} className="text-left text-xs font-medium text-text-muted pb-3 pr-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {tasks.slice(0, 10).map((task) => (
                    <tr key={task.task_id} className="hover:bg-surface-elevated/50 transition-colors">
                      <td className="py-3 pr-4">
                        <p className="text-sm font-medium text-text-primary">{task.title}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={task.type}>{task.type}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={task.priority}>{task.priority}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://avatars.githubusercontent.com/${task.assigned_to || "ghost"}`}
                            alt={task.assigned_to || "Unassigned"}
                            className="w-5 h-5 rounded-full"
                          />
                          <span className="text-sm text-text-secondary">
                            @{task.assigned_to || "Unassigned"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-xs text-text-muted">
                          {task.deadline || "No deadline"}
                        </span>
                      </td>
                      <td className="py-3">
                        <Badge variant={task.status as "open" | "completed" | "in_progress"}>
                          {task.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Create Team Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md card p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text-primary">Create New Team</h3>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <Input
                label="Team Name *"
                placeholder="e.g. Backend Engineers"
                value={form.team_name}
                onChange={(e) => setForm((f) => ({ ...f, team_name: e.target.value }))}
              />
              <Select
                label="Project *"
                options={[
                  { value: "", label: "Select project..." },
                  ...projects.map((p) => ({ value: p.project_id, label: p.project_name })),
                ]}
                value={form.project_id}
                onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))}
              />
              <div>
                <label className="label">Team Members (GitHub usernames)</label>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Add GitHub username..."
                    value={newMember}
                    onChange={(e) => setNewMember(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addMember()}
                  />
                  <Button variant="secondary" onClick={addMember}>
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
                {form.members.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.members.map((m) => (
                      <span
                        key={m}
                        className="flex items-center gap-1.5 bg-surface-elevated border border-surface-border px-2.5 py-1 rounded-full text-xs text-text-secondary"
                      >
                        <img
                          src={`https://avatars.githubusercontent.com/${m}`}
                          alt={m}
                          className="w-4 h-4 rounded-full"
                        />
                        @{m}
                        <button
                          onClick={() =>
                            setForm((f) => ({ ...f, members: f.members.filter((x) => x !== m) }))
                          }
                          className="text-text-muted hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  loading={creating}
                  onClick={handleCreate}
                  disabled={!form.team_name || !form.project_id}
                >
                  Create Team
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TeamCard({
  team,
  project,
  tasks,
  onStartLive,
  onUpload,
}: {
  team: Team;
  project?: Project;
  tasks: Task[];
  onStartLive: () => void;
  onUpload: () => void;
}) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-text-primary">{team.team_name}</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {project?.project_name || "No project"} · {team.members.length} members
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-xs text-text-muted">{formatRelativeTime(team.created_at)}</span>
        </div>
      </div>

      {/* Members */}
      <div>
        <p className="text-xs font-medium text-text-muted mb-2">Team Members</p>
        <div className="flex items-center gap-2 flex-wrap">
          {team.members.length === 0 ? (
            <span className="text-xs text-text-muted">No members added</span>
          ) : (
            team.members.map((username) => (
              <a
                key={username}
                href={`https://github.com/${username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-surface-elevated px-2 py-1 rounded-lg text-xs text-text-secondary hover:text-brand-400 transition-colors"
              >
                <img
                  src={`https://avatars.githubusercontent.com/${username}`}
                  alt={username}
                  className="w-5 h-5 rounded-full"
                />
                @{username}
              </a>
            ))
          )}
        </div>
      </div>

      {/* Task stats */}
      <div className="flex gap-3 text-xs">
        <span className="bg-surface-elevated px-2.5 py-1.5 rounded-lg text-text-secondary">
          <span className="font-semibold text-text-primary">{tasks.length}</span> tasks
        </span>
        <span className="bg-surface-elevated px-2.5 py-1.5 rounded-lg text-text-secondary">
          <span className="font-semibold text-green-400">
            {tasks.filter((t) => t.status === "completed").length}
          </span>{" "}
          completed
        </span>
        <span className="bg-surface-elevated px-2.5 py-1.5 rounded-lg text-text-secondary">
          <span className="font-semibold text-red-400">
            {tasks.filter((t) => t.type === "bug").length}
          </span>{" "}
          bugs
        </span>
      </div>

      {/* Meeting Controls */}
      <div className="flex gap-2 pt-1 border-t border-surface-border">
        <Button variant="secondary" className="flex-1 text-xs" onClick={onUpload}>
          <Upload className="w-3.5 h-3.5" />
          Upload Meeting
        </Button>
        <Button className="flex-1 text-xs" onClick={onStartLive}>
          <Video className="w-3.5 h-3.5" />
          Live Meeting
        </Button>
      </div>
    </Card>
  );
}

function EmptyTeams({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-surface-card border border-surface-border rounded-2xl flex items-center justify-center mb-4">
        <Users className="w-8 h-8 text-text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">No teams yet</h3>
      <p className="text-text-muted text-sm mb-6 max-w-xs">
        Create teams to group members and manage meeting workflows.
      </p>
      <Button onClick={onNew}>
        <Plus className="w-4 h-4" />
        Create First Team
      </Button>
    </div>
  );
}
