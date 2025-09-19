import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getScriptByName, updateScript, deleteScript } from "@/lib/db";

// GET /api/scripts/[name] - Get a script by name
export async function GET(request: NextRequest, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  try {
    const script = await getScriptByName(name);
    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }
    return NextResponse.json(script);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to get script" },
      { status: 500 }
    );
  }
}

// PUT /api/scripts/[name] - Update a script
export async function PUT(request: NextRequest, context: { params: Promise<{ name: string }> }) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { name } = await context.params;
  
  try {
    const updates = await request.json();
    const updatedScript = await updateScript(name, updates);
    return NextResponse.json(updatedScript);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update script" },
      { status: 400 }
    );
  }
}

// DELETE /api/scripts/[name] - Delete a script
export async function DELETE(request: NextRequest, context: { params: Promise<{ name: string }> }) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { name } = await context.params;
  
  try {
    await deleteScript(name);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete script" },
      { status: 400 }
    );
  }
}
