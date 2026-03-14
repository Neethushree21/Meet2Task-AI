"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "@/components/ui/card"
import { Users, ChevronRight, Activity, CalendarDays, Plus, Loader2, GitBranch } from "lucide-react"
import type { Project } from "@/types"

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [description, setDescription] = useState("")
  const [githubOwner, setGithubOwner] = useState("")
  const [githubRepo, setGithubRepo] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects")
      const data = await res.json()
      if (data.projects) setProjects(data.projects)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!projectName.trim()) return

    setIsSubmitting(true)
    setErrorMsg("")
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: projectName,
          description,
          github_owner: githubOwner,
          github_repo: githubRepo,
        })
      })
      const data = await res.json()
      
      if (!res.ok) {
         setErrorMsg(data.error || "Failed to create project")
         setIsSubmitting(false)
         return
      }
      
      if (data.project) {
        setProjects([data.project, ...projects])
        setShowModal(false)
        setProjectName("")
        setDescription("")
        setGithubOwner("")
        setGithubRepo("")
      }
    } catch (e) {
      setErrorMsg("Network error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-10 relative h-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your team's active products and initiatives.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Project
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-xl bg-muted/20">
           <h3 className="text-lg font-semibold mb-2">No Projects Found</h3>
           <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">Create your first project to start tracking your automated AI tasks and linking your GitHub repos.</p>
           <button onClick={() => setShowModal(true)} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md font-medium text-sm">Create First Project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project.project_id} href={`/projects/${project.project_id}`} className="block h-full outline-none">
              <Card className="hover:border-primary/50 transition-colors group cursor-pointer flex flex-col justify-between h-full">
                <CardHeader className="p-5 pb-3 border-b border-border/40">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{project.project_name}</CardTitle>
                    <div className="px-2 py-0.5 rounded-full bg-secondary text-xs font-medium text-secondary-foreground capitalize">
                      {project.status}
                    </div>
                  </div>
                  <CardDescription className="pt-2 line-clamp-2">{project.description || "No description provided."}</CardDescription>
                </CardHeader>
                <div className="px-5 py-4 flex flex-col gap-3">
                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Activity className="h-4 w-4" /> Codebase Sync
                   </div>
                   <div className="flex items-center gap-2 text-xs font-medium bg-muted/50 p-2 rounded truncate">
                      <GitBranch className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {project.github_owner && project.github_repo 
                          ? `${project.github_owner}/${project.github_repo}`
                          : "No repository linked"
                        }
                      </span>
                   </div>
                </div>
                <CardFooter className="p-5 pt-0 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Basic modal for New Project */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <Card className="w-full max-w-md shadow-lg border border-border animate-in fade-in zoom-in duration-200">
             <form onSubmit={handleCreateProject}>
               <CardHeader>
                 <CardTitle>Create New Project</CardTitle>
                 <CardDescription>Setup a workspace for your automated tasks.</CardDescription>
               </CardHeader>
               <CardContent className="flex flex-col gap-4">
                 {errorMsg && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-md">{errorMsg}</div>}
                 <div className="flex flex-col gap-1.5">
                   <label className="text-sm font-semibold">Project Name *</label>
                   <input required value={projectName} onChange={e => setProjectName(e.target.value)} className="px-3 py-2 border rounded-md text-sm bg-background" placeholder="e.g. Mobile App V2" />
                 </div>
                 <div className="flex flex-col gap-1.5">
                   <label className="text-sm font-semibold">Description</label>
                   <textarea value={description} onChange={e => setDescription(e.target.value)} className="px-3 py-2 border rounded-md text-sm bg-background h-20 resize-none" placeholder="Brief context about this project..." />
                 </div>
                 <div className="grid grid-cols-2 gap-3 pt-2">
                   <div className="flex flex-col gap-1.5">
                     <label className="text-xs font-semibold text-muted-foreground">GitHub Owner</label>
                     <input value={githubOwner} onChange={e => setGithubOwner(e.target.value)} className="px-3 py-2 border rounded-md text-sm bg-background" placeholder="vercel" />
                   </div>
                   <div className="flex flex-col gap-1.5">
                     <label className="text-xs font-semibold text-muted-foreground">GitHub Repo</label>
                     <input value={githubRepo} onChange={e => setGithubRepo(e.target.value)} className="px-3 py-2 border rounded-md text-sm bg-background" placeholder="next.js" />
                   </div>
                 </div>
               </CardContent>
               <CardFooter className="flex justify-end gap-3 pt-4 border-t border-border/50">
                 <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-md" disabled={isSubmitting}>Cancel</button>
                 <button type="submit" className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md flex items-center gap-2" disabled={isSubmitting}>
                   {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create Project
                 </button>
               </CardFooter>
             </form>
           </Card>
        </div>
      )}
    </div>
  )
}
