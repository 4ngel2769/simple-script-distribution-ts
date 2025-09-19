import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

// GET /api/health - Health check endpoint
export async function GET() {
    const packageJsonPath = join(process.cwd(), "package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
    const version = packageJson.version || "unknown";

    return NextResponse.json({
        status: "ok",
        version,
        timestamp: new Date().toISOString(),
    });
}
