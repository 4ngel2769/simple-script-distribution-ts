import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getScriptContent, updateScriptContent, getScriptByName } from "@/lib/db";

// GET /api/scripts/[name]/content - Get script content
export async function GET(request: NextRequest, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  try {
    const content = await getScriptContent(name);
    return NextResponse.json({ content });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to get script content";
    return NextResponse.json(
      { error: message },
      { status: 404 }
    );
  }
}

// PUT /api/scripts/[name]/content - Update script content (only for managed scripts)
export async function PUT(request: NextRequest, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  // Check authentication
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const script = await getScriptByName(name);
    if (!script) {
      return NextResponse.json(
        { error: "Script not found" },
        { status: 404 }
      );
    }

    // Only allow content editing for managed scripts
    if (script.mode === 'unmanaged') {
      return NextResponse.json(
        { error: "Cannot edit content of unmanaged scripts" },
        { status: 400 }
      );
    }

    const { content } = await request.json();
    
    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Update the script content
    await updateScriptContent(name, content);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update script content";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
