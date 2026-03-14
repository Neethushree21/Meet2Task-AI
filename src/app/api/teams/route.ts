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
    let query = adminDb.collection("teams").orderBy("created_at", "desc");
    if (projectId) {
      query = query.where("project_id", "==", projectId) as typeof query;
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
    const teamId = uuidv4();
    const team = {
      team_id: teamId,
      project_id: body.project_id,
      team_name: body.team_name,
      members: body.members || [],
      created_at: new Date().toISOString(),
    };

    await adminDb.collection("teams").doc(teamId).set(team);
    return NextResponse.json({ team });
  } catch (error) {
    console.error("Team creation error:", error);
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }
}
