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
    let query = adminDb.collection("meetings").orderBy("created_at", "desc");
    if (projectId) {
      query = query.where("project_id", "==", projectId) as typeof query;
    }
    const snapshot = await query.limit(20).get();
    const meetings = snapshot.docs.map((doc: any) => doc.data());
    return NextResponse.json({ meetings });
  } catch (error) {
    console.error("Meetings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const meetingId = uuidv4();
    const meeting = {
      meeting_id: meetingId,
      project_id: body.project_id,
      team_id: body.team_id,
      title: body.title || "Untitled Meeting",
      meeting_type: body.meeting_type || "upload",
      status: "processing",
      created_at: new Date().toISOString(),
      created_by: session.user.github_username || session.user.email || "",
    };

    await adminDb.collection("meetings").doc(meetingId).set(meeting);
    return NextResponse.json({ meeting });
  } catch (error) {
    console.error("Meeting creation error:", error);
    return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 });
  }
}
