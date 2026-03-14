"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Loader2, Mail, Github, Twitter } from "lucide-react"
import type { Team, Project } from "@/types"

export default function TeamPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [teamName, setTeamName] = useState("")
  const [projectId, setProjectId] = useState("")
  const [members, setMembers] = useState("") // comma separated for now

  useEffect(() => {
    Promise.all([
      fetch("/api/teams").then(r => r.json()),
      fetch("/api/projects").then(r => r.json())
    ]).then(([teamsData, projectsData]) => {
      if (teamsData.teams) setTeams(teamsData.teams)
      if (projectsData.projects) setProjects(projectsData.projects)
      setLoading(false)
    }).catch(console.error)
  }, [])

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!teamName.trim() || !projectId) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_name: teamName,
          project_id: projectId,
          members: members.split(",").map(m => m.trim()).filter(Boolean),
        })
      })
      const data = await res.json()
      if (data.team) {
        setTeams([data.team, ...teams])
        setShowModal(false)
        setTeamName("")
        setProjectId("")
        setMembers("")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-10 relative h-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">Manage your organizational groups and squad members.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Team
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-xl bg-muted/20">
           <h3 className="text-lg font-semibold mb-2">No Teams Found</h3>
           <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">Create your first team to start assigning AI-generated tasks to your members.</p>
           <button onClick={() => setShowModal(true)} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md font-medium text-sm">Create First Team</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {teams.map((team) => (
            <Card key={team.team_id} className="overflow-hidden hover:border-primary/40 transition-colors pt-6 flex flex-col justify-between">
              <CardContent className="flex flex-col items-center text-center p-6 gap-4">
                <div className={`h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white bg-brand-500 shadow-inner`}>
                  {team.team_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col items-center gap-1">
                  <h3 className="font-semibold text-lg">{team.team_name}</h3>
                  <Badge variant="outline" className="mt-2 text-xs text-muted-foreground">
                    {projects.find(p => p.project_id === team.project_id)?.project_name || "Unknown Project"}
                  </Badge>
                </div>
                
                <div className="flex flex-col w-full gap-2 mt-2">
                   <span className="text-xs font-semibold text-muted-foreground uppercase text-left">Members ({team.members.length})</span>
                   <div className="flex flex-wrap gap-1.5 justify-center">
                     {team.members.length > 0 ? team.members.map((m, i) => (
                        <span key={i} className="bg-secondary px-2 py-1 rounded text-xs font-mono">@{m}</span>
                     )) : (
                        <span className="text-xs text-muted-foreground italic">No members added</span>
                     )}
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Basic modal for New Team */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <Card className="w-full max-w-md shadow-lg border border-border animate-in fade-in zoom-in duration-200">
             <form onSubmit={handleCreateTeam}>
               <CardHeader>
                 <CardTitle>Create New Team</CardTitle>
                 <CardDescription>Group members together for a specific project.</CardDescription>
               </CardHeader>
               <CardContent className="flex flex-col gap-4">
                 <div className="flex flex-col gap-1.5">
                   <label className="text-sm font-semibold">Team Name *</label>
                   <input required value={teamName} onChange={e => setTeamName(e.target.value)} className="px-3 py-2 border rounded-md text-sm bg-background" placeholder="e.g. Frontend Squad" />
                 </div>
                 <div className="flex flex-col gap-1.5">
                   <label className="text-sm font-semibold">Linked Project *</label>
                   <select required value={projectId} onChange={e => setProjectId(e.target.value)} className="px-3 py-2 border rounded-md text-sm bg-background">
                      <option value="">Select Project...</option>
                      {projects.map(p => (
                         <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                      ))}
                   </select>
                 </div>
                 <div className="flex flex-col gap-1.5">
                   <label className="text-sm font-semibold">GitHub Usernames</label>
                   <textarea value={members} onChange={e => setMembers(e.target.value)} className="px-3 py-2 border rounded-md text-sm bg-background h-20 resize-none" placeholder="nikhiljram, octocat (comma separated)" />
                 </div>
               </CardContent>
               <CardFooter className="flex justify-end gap-3 pt-4 border-t border-border/50">
                 <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-md" disabled={isSubmitting}>Cancel</button>
                 <button type="submit" className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md flex items-center gap-2" disabled={isSubmitting}>
                   {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create Team
                 </button>
               </CardFooter>
             </form>
           </Card>
        </div>
      )}
    </div>
  )
}
