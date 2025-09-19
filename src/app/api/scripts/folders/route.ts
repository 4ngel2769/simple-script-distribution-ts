import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import fs from "fs-extra";
import path from "path";

const SCRIPTS_DIR = process.env.SCRIPTS_DIR || path.join(process.cwd(), 'scripts');

// GET /api/scripts/folders?path=subfolder
export async function GET(req: NextRequest) {
  // Check authentication
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const relPath = url.searchParams.get('path') || '';
  const absPath = path.join(SCRIPTS_DIR, relPath);

  // Security check
  if (!absPath.startsWith(SCRIPTS_DIR)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    // Check if directory exists, create if it doesn't
    if (!(await fs.pathExists(absPath))) {
      await fs.ensureDir(absPath);
      return NextResponse.json([]);
    }

    const entries = await fs.readdir(absPath, { withFileTypes: true });
    return NextResponse.json(entries.map(e => ({
      name: e.name,
      isDirectory: e.isDirectory(),
      path: path.posix.join(relPath, e.name),
    })));
  } catch (error) {
    console.error('Error reading directory:', error);
    return NextResponse.json(
      { error: "Failed to read directory" },
      { status: 500 }
    );
  }
}
