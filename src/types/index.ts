export interface User {
  user_id: string;
  name: string;
  github_username: string;
  github_id: number;
  email: string;
  avatar_url?: string;
  created_at: string;
}

export interface Project {
  project_id: string;
  project_name: string;
  description: string;
  created_by: string;
  github_repo?: string;
  github_owner?: string;
  status: "active" | "archived";
  created_at: string;
}

export interface Team {
  team_id: string;
  project_id: string;
  team_name: string;
  members: string[];
  created_at: string;
}

export interface Meeting {
  meeting_id: string;
  project_id: string;
  team_id: string;
  title: string;
  meeting_type: "upload" | "live";
  transcript?: string;
  audio_url?: string;
  status: "processing" | "completed" | "failed";
  summary?: string;
  decisions?: string[];
  key_points?: string[];
  notion_url?: string;
  created_at: string;
  created_by: string;
  duration?: number;
}

export interface Task {
  task_id: string;
  meeting_id: string;
  project_id: string;
  title: string;
  description: string;
  assigned_to: string | null;
  status: "open" | "in_progress" | "completed" | "closed";
  priority: "high" | "medium" | "low";
  type: "task" | "bug" | "decision";
  deadline: string | null;
  github_issue_url: string | null;
  github_issue_number: number | null;
  jira_issue_url: string | null;
  jira_issue_key: string | null;
  created_at: string;
}

export interface TeamMember {
  github_username: string;
  name: string;
  avatar_url: string;
  role?: string;
}

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      github_id?: number;
      github_username?: string;
    };
  }
}
