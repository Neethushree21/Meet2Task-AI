import axios from "axios";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

export interface NotionPagePayload {
  title: string;
  summary: string;
  decisions: string[];
  meeting_date: string;
  project_name: string;
}

export async function createNotionPage(
  payload: NotionPagePayload
): Promise<{ url: string; id: string }> {
  try {
    const response = await axios.post(
      "https://api.notion.com/v1/pages",
      {
        parent: { database_id: NOTION_DATABASE_ID },
        properties: {
          Name: {
            title: [{ text: { content: payload.title } }],
          },
          Date: {
            date: { start: payload.meeting_date },
          },
          Project: {
            rich_text: [{ text: { content: payload.project_name } }],
          },
        },
        children: [
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [{ type: "text", text: { content: "Meeting Summary" } }],
            },
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ type: "text", text: { content: payload.summary } }],
            },
          },
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [{ type: "text", text: { content: "Key Decisions" } }],
            },
          },
          ...payload.decisions.map((decision) => ({
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [{ type: "text", text: { content: decision } }],
            },
          })),
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
      }
    );
    return { id: response.data.id, url: response.data.url };
  } catch (error) {
    console.error("Notion page creation error:", error);
    throw new Error("Failed to create Notion page");
  }
}
