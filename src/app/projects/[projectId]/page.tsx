"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, Users, CalendarDays, GitBranch, Video } from "lucide-react"
import type { Project, Team, Meeting } from "@/types"

export default function ProjectDetails() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [project, setProject] = useState<Project | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return

    Promise.all([
      fetch("/api/projects").then(r => r.json()),
      fetch(`/api/teams?project_id=${projectId}`).then(r => r.json()),
      fetch(`/api/meetings?project_id=${projectId}`).then(r => r.json())
    ]).then(([projectsData, teamsData, meetingsData]) => {
      if (projectsData.projects) {
        const found = projectsData.projects.find((p: Project) => p.project_id === projectId)
        if (found) setProject(found)
      }
      if (teamsData.teams) setTeams(teamsData.teams)
      if (meetingsData.meetings) setMeetings(meetingsData.meetings)
    }).catch(console.error).finally(() => setLoading(false))

  }, [projectId])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
        <button onClick={() => router.back()} className="text-primary hover:underline">Go Back</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex flex-col gap-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-fit">
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.project_name}</h1>
            <p className="text-muted-foreground mt-1">{project.description || "No description provided."}</p>
          </div>
          <Badge variant="outline" className="capitalize px-3 py-1 text-sm bg-secondary">{project.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="flex items-center gap-2 text-lg"><GitBranch className="h-5 w-5" /> GitHub Integration</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground uppercase">Repository</span>
             {project.github_owner && project.github_repo 
               ? <span className="font-mono bg-muted/50 px-3 py-1.5 rounded-md w-fit mt-1">{project.github_owner}/{project.github_repo}</span>
               : <span className="text-sm text-muted-foreground italic mt-1 pb-1">No repository linked</span>
             }
          </CardContent>
        </Card>
        <Card>
           <CardHeader className="pb-3 border-b border-border/40">
             <CardTitle className="flex items-center gap-2 text-lg"><CalendarDays className="h-5 w-5" /> Details</CardTitle>
           </CardHeader>
           <CardContent className="pt-4 flex flex-col gap-3">
             <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Created By</span>
                <span className="font-medium bg-secondary px-2 py-0.5 rounded text-xs">{project.created_by}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Created At</span>
                <span className="font-medium">{new Date(project.created_at).toLocaleDateString()}</span>
             </div>
           </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="h-5 w-5" /> Assigned Teams</h2>
        {teams.length === 0 ? (
          <div className="border border-dashed rounded-lg p-8 text-center bg-muted/20">
             <p className="text-sm text-muted-foreground">No teams are currently assigned to this project.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {teams.map(team => (
                <Card key={team.team_id} className="pt-6 hover:border-primary/40 transition-colors">
                   <CardContent className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-brand-500 text-white flex items-center justify-center text-xl font-bold shadow-inner">
                         {team.team_name.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="font-semibold">{team.team_name}</h3>
                      <div className="flex flex-wrap gap-1 justify-center mt-2">
                         {team.members.map((m, i) => (
                            <span key={i} className="text-xs font-mono bg-secondary px-2 py-0.5 rounded">@{m}</span>
                         ))}
                      </div>
                   </CardContent>
                </Card>
             ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Video className="h-5 w-5" /> Recent Meetings</h2>
        {meetings.length === 0 ? (
           <div className="border border-dashed rounded-lg p-8 text-center bg-muted/20">
              <p className="text-sm text-muted-foreground">No meetings have been analyzed for this project yet.</p>
           </div>
        ) : (
           <div className="flex flex-col gap-3">
              {meetings.map((meeting) => (
                 <Card key={meeting.meeting_id} className="p-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:bg-muted/10 transition-colors">
                    <div>
                       <h3 className="font-medium flex items-center gap-2">
                          {meeting.title || "Untitled Meeting"}
                          <Badge variant="outline" className={`text-xs ${meeting.status === 'completed' ? 'text-green-500 border-green-500/20 bg-green-500/10' : ''}`}>{meeting.status}</Badge>
                       </h3>
                       <p className="text-xs text-muted-foreground mt-1">Processed on {new Date(meeting.created_at).toLocaleDateString()}</p>
                    </div>
                    {meeting.notion_url && (
                       <a href={meeting.notion_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-center">
                          View Notion Log
                       </a>
                    )}
                 </Card>
              ))}
           </div>
        )}
      </div>

    </div>
  )
}
