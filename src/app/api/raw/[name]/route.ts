import { NextRequest, NextResponse } from "next/server";
import { getScriptByName, getScriptContent } from "@/lib/db";

// GET /api/raw/[name] - Serve raw script content
export async function GET(request: NextRequest, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  try {
    const script = await getScriptByName(name);
    
    if (!script) {
      return NextResponse.json(
        { error: "Script not found" },
        { status: 404 }
      );
    }
    
    // For redirect scripts
    if (script.type === 'redirect') {
      return NextResponse.redirect(script.redirectUrl || '');
    }
    
    // For local scripts (both managed and unmanaged)
    if (script.type === 'local') {
      try {
        const content = await getScriptContent(script.name);
        return new NextResponse(content, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'X-Content-Type-Options': 'nosniff',
          }
        });
      } catch {
        return NextResponse.json(
          { error: "Failed to read script file" },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Invalid script configuration" },
      { status: 500 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to get script" },
      { status: 500 }
    );
  }
}
