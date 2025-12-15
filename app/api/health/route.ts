import { NextResponse } from "next/server";
import { healthCheck } from "@/lib/db";

export async function GET() {
  try {
    const dbHealthy = await healthCheck();

    if (!dbHealthy) {
      return NextResponse.json(
        {
          status: "unhealthy",
          database: "disconnected",
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

