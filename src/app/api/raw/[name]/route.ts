import fs from 'fs-extra';
import { NextRequest, NextResponse } from "next/server";
import { getScriptByName } from "@/lib/db";

interface Params {
  params: {
    name: string;
  };
}

// GET /api/raw/[name] - Serve raw script content
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const script = await getScriptByName(params.name);
    
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
    
    // For local scripts
    if (script.type === 'local' && script.scriptPath) {
      try {
        const content = await fs.readFile(script.scriptPath, 'utf8');
        
        // Return as plain text
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
