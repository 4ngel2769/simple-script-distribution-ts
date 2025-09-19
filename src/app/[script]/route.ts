import { NextRequest, NextResponse } from "next/server";
import { getScriptByName, getScriptContent } from "@/lib/db";

// Reserved page names that scripts cannot use
const RESERVED_NAMES = [
  'admin',
  'login', 
  'api',
  'health',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml'
];

// GET /[script] - Serve raw script content
export async function GET(request: NextRequest, context: { params: Promise<{ script: string }> }) {
  const { script: scriptName } = await context.params;
  
  // Check if this is a reserved name
  if (RESERVED_NAMES.includes(scriptName.toLowerCase())) {
    return NextResponse.json(
      { error: "Script name conflicts with system routes" },
      { status: 404 }
    );
  }
  
  try {
    const script = await getScriptByName(scriptName);
    
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
      } catch (error) {
        console.error('Error reading script content:', error);
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
  } catch (error) {
    console.error('Error getting script:', error);
    return NextResponse.json(
      { error: "Failed to get script" },
      { status: 500 }
    );
  }
}
