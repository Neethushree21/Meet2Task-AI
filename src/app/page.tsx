"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, AlertCircle, Clock, CheckCircle2, ChevronRight, MessageSquare, Video, ArrowUpRight, CheckSquare } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
// @ts-ignore
import type { Project, Task, Meeting } from "@/types";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      Promise.all([
        fetch("/api/projects").then((res) => res.json()),
        fetch("/api/tasks").then((res) => res.json()),
        fetch("/api/meetings").then((res) => res.json()),
      ]).then(([projData, taskData, meetData]) => {
        setProjects(projData.projects || []);
        setTasks(taskData.tasks || []);
        setMeetings(meetData.meetings || []);
        setLoading(false);
      });
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  if (loading) return <div className="p-10 flex text-center"><p>Loading workspace...</p></div>;

  const assignedTasks = tasks.filter((t) => t.assigned_to === session?.user?.github_username && t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed").slice(0, 5);
  const recentMeetings = meetings.slice(0, 3);

  const aiInsights = {
    summary: "The workspace is active. You have new tasks waiting for context and several recent meetings ready for review.",
    actionItems: assignedTasks.slice(0, 2).map((t) => t.title),
    issues: tasks.filter(t => t.type === 'bug').slice(0, 2).map(t => t.title),
    decisions: []
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {session?.user?.name || 'Engineer'}. Here is the overview of your workspace.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Projects & Tasks) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Projects Overview */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">Active Projects</h2>
              <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                View all <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.length === 0 && <p className="text-sm text-muted-foreground">No projects created yet.</p>}
              {projects.map((project) => (
                <Card key={project.project_id} className="hover:border-primary/50 transition-colors group cursor-pointer flex flex-col justify-between">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      {project.project_name}
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">{project.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="p-4 pt-4 flex items-center justify-between border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Users className="h-3.5 w-3.5" />
                      {project.github_repo || "No repo linked"}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>

          {/* Assigned Tasks */}
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold tracking-tight">Your Assigned Tasks</h2>
            <div className="flex flex-col gap-3">
              {assignedTasks.length === 0 && <p className="text-sm text-muted-foreground">No pending assigned tasks.</p>}
              {assignedTasks.map((task) => (
                <Card key={task.task_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:border-primary/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5">
                      {task.status === "open" ? (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-amber-500/50 flex items-center justify-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {task.task_id.substring(0, 8)}
                        </span>
                        <h3 className="text-sm font-semibold">{task.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"}>
                      {task.priority || "Normal"}
                    </Badge>
                    <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                      @{task.assigned_to}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Completed Tasks */}
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              Recently Completed <CheckCircle2 className="h-5 w-5 text-green-500" />
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {completedTasks.length === 0 && <p className="text-sm text-muted-foreground">No recent completed tasks.</p>}
              {completedTasks.map((task) => (
                <Card key={task.task_id} className="bg-muted/30 border-dashed hover:bg-muted/50 transition-colors">
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-semibold text-muted-foreground opacity-60">
                        {task.task_id.substring(0,8)}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md">
                        @{task.assigned_to}
                      </span>
                    </div>
                    <CardTitle className="text-sm line-through opacity-70">{task.title}</CardTitle>
                    <CardDescription className="opacity-60 text-xs mt-1">{task.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>

        </div>

        {/* Right Column (AI Insights & Meetings) */}
        <div className="flex flex-col gap-8">
          
          {/* AI Insights Panel */}
          <Card className="bg-gradient-to-b from-primary/5 to-transparent border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 bg-primary rounded-md shadow-sm">
                  <MessageSquare className="h-4 w-4 text-primary-foreground" />
                </div>
                AI Insights Panel
              </CardTitle>
              <CardDescription>Generated from your recent meetings and communications</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 text-sm">
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Summary
                </span>
                <p className="text-muted-foreground leading-relaxed">{aiInsights.summary}</p>
              </div>

              {aiInsights.actionItems.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Action Items
                  </span>
                  <ul className="flex flex-col gap-1 text-muted-foreground">
                    {aiInsights.actionItems.map((item, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-amber-500">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiInsights.issues.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Critical Issues
                  </span>
                  <ul className="flex flex-col gap-1 text-red-500/80 dark:text-red-400">
                    {aiInsights.issues.map((item, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Recent Meetings */}
          <Card>
            <CardHeader className="p-5 border-b border-border/50">
              <CardTitle className="text-lg flex items-center justify-between">
                Recent Meetings
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col">
                {recentMeetings.length === 0 && <p className="text-sm p-4 text-muted-foreground">No recent meetings logs.</p>}
                {recentMeetings.map((meeting, i) => (
                  <div key={meeting.meeting_id} className={cn(
                    "flex flex-col gap-2 p-5 hover:bg-muted/40 transition-colors",
                    i !== recentMeetings.length - 1 && "border-b border-border/50"
                  )}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{meeting.title}</h4>
                      <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
                        {format(new Date(meeting.created_at || new Date()), "MMM d")}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1.5">
                        <CheckSquare className="h-3.5 w-3.5" />
                        {meeting.status}
                      </span>
                      {meeting.notion_url && (
                         <a href={meeting.notion_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                           View Notion Log
                         </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
