"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/Sidebar";
import { Card, Button, Input, Textarea, Badge } from "@/components/ui";
import {
  FolderOpen,
  Plus,
  X,
  Github,
  Calendar,
  Zap,
} from "lucide-react";
import { formatRelativeTime, truncate } from "@/lib/utils";
import type { Project } from "@/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    project_name: "",
    description: "",
    github_owner: "",
    github_repo: "",
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.project_name) return;
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.project) {
        setProjects((prev) => [data.project, ...prev]);
        setShowModal(false);
        setForm({ project_name: "", description: "", github_owner: "", github_repo: "" });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Projects" subtitle="Manage your engineering projects" />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary">All Projects</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              {projects.length} active projects
            </p>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-surface-card rounded-xl animate-pulse border border-surface-border" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyProjects onNew={() => setShowModal(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.project_id} project={project} />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md card p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text-primary">
                Create New Project
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <Input
                label="Project Name *"
                placeholder="e.g. Backend API Service"
                value={form.project_name}
                onChange={(e) => setForm((f) => ({ ...f, project_name: e.target.value }))}
              />
              <Textarea
                label="Description"
                placeholder="Brief description of this project..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="GitHub Owner"
                  placeholder="org or username"
                  value={form.github_owner}
                  onChange={(e) => setForm((f) => ({ ...f, github_owner: e.target.value }))}
                />
                <Input
                  label="GitHub Repo"
                  placeholder="repository name"
                  value={form.github_repo}
                  onChange={(e) => setForm((f) => ({ ...f, github_repo: e.target.value }))}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  loading={creating}
                  onClick={handleCreate}
                  disabled={!form.project_name}
                >
                  Create Project
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const colors = [
    "from-brand-600 to-indigo-600",
    "from-purple-600 to-brand-600",
    "from-emerald-600 to-teal-600",
    "from-rose-600 to-pink-600",
    "from-orange-600 to-amber-600",
  ];

  const colorIdx = project.project_name.charCodeAt(0) % colors.length;

  return (
    <Card hover className="flex flex-col gap-4">
      <div className={`h-2 w-full bg-gradient-to-r ${colors[colorIdx]} rounded-full`} />
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-text-primary">{project.project_name}</h3>
          <p className="text-xs text-text-muted mt-1">
            {truncate(project.description || "No description", 70)}
          </p>
        </div>
        <Badge variant="completed">Active</Badge>
      </div>
      <div className="flex items-center gap-3 text-xs text-text-muted pt-1 border-t border-surface-border">
        {project.github_repo && (
          <a
            href={`https://github.com/${project.github_owner}/${project.github_repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-brand-400 transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            {project.github_owner}/{project.github_repo}
          </a>
        )}
        <span className="flex items-center gap-1 ml-auto">
          <Calendar className="w-3 h-3" />
          {formatRelativeTime(project.created_at)}
        </span>
      </div>
    </Card>
  );
}

function EmptyProjects({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-surface-card border border-surface-border rounded-2xl flex items-center justify-center mb-4">
        <FolderOpen className="w-8 h-8 text-text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">No projects yet</h3>
      <p className="text-text-muted text-sm mb-6 max-w-xs">
        Create your first project to start organizing teams, meetings, and tasks.
      </p>
      <Button onClick={onNew}>
        <Plus className="w-4 h-4" />
        Create First Project
      </Button>
    </div>
  );
}
