import axios from "axios";

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY || "PROJ";

const authHeader = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64");

export interface JiraIssuePayload {
  title: string;
  description: string;
  priority?: "Highest" | "High" | "Medium" | "Low" | "Lowest";
  assignee?: string;
  issuetype?: "Task" | "Bug" | "Story";
}

export async function createJiraTicket(
  payload: JiraIssuePayload
): Promise<{ url: string; key: string }> {
  try {
    const response = await axios.post(
      `${JIRA_BASE_URL}/rest/api/3/issue`,
      {
        fields: {
          project: { key: JIRA_PROJECT_KEY },
          summary: payload.title,
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: payload.description }],
              },
            ],
          },
          issuetype: { name: payload.issuetype || "Task" },
          priority: { name: payload.priority || "Medium" },
        },
      },
      {
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    return {
      key: response.data.key,
      url: `${JIRA_BASE_URL}/browse/${response.data.key}`,
    };
  } catch (error) {
    console.error("Jira ticket creation error:", error);
    throw new Error("Failed to create Jira ticket");
  }
}
