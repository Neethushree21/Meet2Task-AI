import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshot = await adminDb
      .collection("projects")
      .orderBy("created_at", "desc")
      .get();
    const projects = snapshot.docs.map((doc: any) => doc.data());
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Projects fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (body.github_owner && body.github_repo) {
       try {
          const ghRes = await fetch(`https://api.github.com/repos/${body.github_owner}/${body.github_repo}`, {
             headers: {
                "Authorization": `token ${process.env.GITHUB_TOKEN}`,
                "Accept": "application/vnd.github.v3+json"
             }
          });
          if (!ghRes.ok) {
             return NextResponse.json({ error: "Invalid GitHub owner or repository." }, { status: 400 });
          }
       } catch (e) {
          return NextResponse.json({ error: "Failed to validate repository" }, { status: 500 });
       }
    }

    const projectId = uuidv4();
    const project = {
      project_id: projectId,
      project_name: body.project_name,
      description: body.description || "",
      github_owner: body.github_owner || "",
      github_repo: body.github_repo || "",
      status: "active",
      created_by: session.user.github_username || "",
      created_at: new Date().toISOString(),
    };

    await adminDb.collection("projects").doc(projectId).set(project);
    return NextResponse.json({ project });
  } catch (error) {
    console.error("Project creation error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
