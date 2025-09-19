import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createScript, getAllScripts } from "@/lib/db";

// GET /api/scripts - Get all scripts
export async function GET() {
  try {
    const scripts = await getAllScripts();
    return NextResponse.json(scripts);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch scripts" },
      { status: 500 }
    );
  }
}

// POST /api/scripts - Create a new script
export async function POST(request: NextRequest) {
  // Check authentication
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const scriptData = await request.json();
    
    // Validate required fields
    if (!scriptData.name || !scriptData.description) {
      return NextResponse.json(
        { error: "Name and description are required" },
        { status: 400 }
      );
    }
    
    // Validate redirect URL for redirect type
    if (scriptData.type === "redirect" && !scriptData.redirectUrl) {
      return NextResponse.json(
        { error: "Redirect URL is required for redirect type scripts" },
        { status: 400 }
      );
    }
    
    // Sanitize script name
    scriptData.name = scriptData.name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_")
      .replace(/\./g, "_");
      
    const newScript = await createScript(scriptData);
    return NextResponse.json(newScript, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : "Failed to create script") },
      { status: 400 }
    );
  }
}
