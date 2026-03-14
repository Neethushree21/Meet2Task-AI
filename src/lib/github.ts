import axios from "axios";

const GITHUB_API = "https://api.github.com";

export interface GitHubIssuePayload {
  title: string;
  body: string;
  assignees?: string[];
  labels?: string[];
}

export async function createGitHubIssue(
  owner: string,
  repo: string,
  payload: GitHubIssuePayload
): Promise<{ url: string; number: number }> {
  try {
    const response = await axios.post(
      `${GITHUB_API}/repos/${owner}/${repo}/issues`,
      {
        title: payload.title,
        body: payload.body,
        assignees: payload.assignees || [],
        labels: payload.labels || ["meet2task"],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );
    return {
      url: response.data.html_url,
      number: response.data.number,
    };
  } catch (error) {
    console.error("GitHub issue creation error:", error);
    throw new Error("Failed to create GitHub issue");
  }
}

export async function getUserByGitHubUsername(username: string): Promise<{ login: string; avatar_url: string } | null> {
  try {
    const response = await axios.get(`${GITHUB_API}/users/${username}`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    });
    return { login: response.data.login, avatar_url: response.data.avatar_url };
  } catch {
    return null;
  }
}
