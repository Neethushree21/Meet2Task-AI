import { Badge } from "@/components/ui/badge"
import { Clock, Filter, Plus, Search } from "lucide-react"

const tasks = [
  { id: "BUG-201", title: "Login rate limiting fails on edge cases", team: "Auth", assignee: "@nikhil", priority: "High", deadline: "Mar 15", status: "In Progress" },
  { id: "FEAT-142", title: "Implement dark mode toggle", team: "Frontend", assignee: "@ananya", priority: "Medium", deadline: "Mar 18", status: "Todo" },
  { id: "REFACTOR-89", title: "Clean up legacy billing webhooks", team: "Payments", assignee: "@rahul", priority: "Low", deadline: "Mar 22", status: "Todo" },
  { id: "FEAT-135", title: "Add OAuth2 Support for Google", team: "Auth", assignee: "@ananya", priority: "High", deadline: "Mar 10", status: "Done" },
  { id: "BUG-198", title: "Fix memory leak in background worker", team: "Infra", assignee: "@nikhil", priority: "High", deadline: "Mar 12", status: "Done" },
  { id: "TASK-45", title: "Update Terms of Service document", team: "Legal", assignee: "@sarah", priority: "Low", deadline: "Apr 01", status: "Todo" },
]

export default function Tasks() {
  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Tracking {tasks.length} active issues across the organization.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-secondary/80 transition-colors border border-border">
             <Filter className="h-4 w-4" /> Filter
           </button>
           <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors">
             <Plus className="h-4 w-4" /> Create Task
           </button>
        </div>
      </div>

      <div className="flex items-center bg-card border border-border rounded-lg px-4 py-2 shadow-sm">
        <Search className="h-5 w-5 text-muted-foreground mr-3" />
        <input 
          type="text" 
          placeholder="Search for tasks, issues, or tokens..." 
          className="flex-1 bg-transparent border-none outline-none text-sm h-8"
        />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
           <span className="bg-muted px-2 py-1 rounded">⌘</span>
           <span className="bg-muted px-2 py-1 rounded">K</span>
        </div>
      </div>

      <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Token</th>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Priority</th>
                <th className="px-6 py-4 font-medium">Assignee</th>
                <th className="px-6 py-4 font-medium">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-muted/30 transition-colors group cursor-pointer">
                  <td className="px-6 py-4 font-mono font-medium text-muted-foreground">{task.id}</td>
                  <td className="px-6 py-4 font-medium text-foreground max-w-sm truncate group-hover:underline">
                    {task.title}
                  </td>
                  <td className="px-6 py-4">
                     <span className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md text-xs font-medium">
                       {task.status === "Done" && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
                       {task.status === "In Progress" && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                       {task.status === "Todo" && <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />}
                       {task.status}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={task.priority === "High" ? "destructive" : task.priority === "Medium" ? "warning" : "secondary"}>
                      {task.priority}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-primary font-medium">{task.assignee}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {task.deadline}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
