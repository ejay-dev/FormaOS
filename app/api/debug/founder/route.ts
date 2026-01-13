import { NextResponse } from "next/server";
import { isFounder } from "@/lib/utils/founder";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Test the founder detection utility with various inputs
    const testCases = [
      { email: "ejazhussaini313@gmail.com", userId: "test-user-1" },
      { email: "normal@example.com", userId: "test-user-2" },
      { email: "", userId: "" },
      { email: undefined, userId: undefined },
    ];

    const results = testCases.map(({ email, userId }) => ({
      email: email || "undefined",
      userId: userId || "undefined", 
      isFounder: isFounder(email ?? "", userId ?? ""),
    }));

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        FOUNDER_EMAILS: process.env.FOUNDER_EMAILS,
        FOUNDER_USER_IDS: process.env.FOUNDER_USER_IDS,
      },
      testResults: results,
    });
  } catch (error) {
    return NextResponse.json({
      error: "Debug failed",
      message: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}