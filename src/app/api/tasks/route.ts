import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const assigned_to = searchParams.get("assigned_to");
  const meeting_id = searchParams.get("meeting_id");
  const project_id = searchParams.get("project_id");

  try {
    let query = adminDb.collection("tasks").orderBy("created_at", "desc");
    if (assigned_to) {
      query = query.where("assigned_to", "==", assigned_to) as typeof query;
    }
    if (meeting_id) {
      query = query.where("meeting_id", "==", meeting_id) as typeof query;
    }
    if (project_id) {
      query = query.where("project_id", "==", project_id) as typeof query;
    }
    const snapshot = await query.limit(50).get();
    const tasks = snapshot.docs.map((doc: any) => doc.data());
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Tasks fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { task_id, ...updates } = body;
    await adminDb.collection("tasks").doc(task_id).update(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Task update error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
