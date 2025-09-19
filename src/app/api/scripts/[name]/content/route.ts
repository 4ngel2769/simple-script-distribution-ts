import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getScriptContent, updateScriptContent } from "@/lib/db";

interface Params {
  params: {
    name: string;
  };
}

// GET /api/scripts/[name]/content - Get script content
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const content = await getScriptContent(params.name);
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

// PUT /api/scripts/[name]/content - Update script content
export async function PUT(request: NextRequest, { params }: Params) {
  // Check authentication
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const { content } = await request.json();
    
    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Update the script content
    await updateScriptContent(params.name, content);
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