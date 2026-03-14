import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project_id");

  try {
    let query: any = adminDb.collection("teams");
    if (projectId) {
      query = query.where("project_id", "==", projectId);
    } else {
      query = query.orderBy("created_at", "desc");
    }
    const snapshot = await query.get();
    const teams = snapshot.docs.map((doc: any) => doc.data());
    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Teams fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const members = body.members || [];

    // Verify all github usernames
    if (members.length > 0) {
       for (const username of members) {
          try {
             const ghRes = await fetch(`https://api.github.com/users/${username}`, {
                 headers: {
                    "Authorization": `token ${process.env.GITHUB_TOKEN}`,
                    "Accept": "application/vnd.github.v3+json"
                 }
             });
             if (!ghRes.ok) {
                 return NextResponse.json({ error: `Invalid GitHub username: ${username}` }, { status: 400 });
             }
          } catch (e) {
             return NextResponse.json({ error: "Failed to validate GitHub usernames due to network error." }, { status: 500 });
          }
       }
    }

    const teamId = uuidv4();
    const team = {
      team_id: teamId,
      project_id: body.project_id,
      team_name: body.team_name,
      members: members,
      created_at: new Date().toISOString(),
    };

    await adminDb.collection("teams").doc(teamId).set(team);
    return NextResponse.json({ team });
  } catch (error) {
    console.error("Team creation error:", error);
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }
}
