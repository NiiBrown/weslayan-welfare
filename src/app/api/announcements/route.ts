import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createAnnouncementSchema, validateRequest } from "@/lib/validations";

// GET /api/announcements
export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(announcements);
  } catch (error: any) {
    console.error("GET /api/announcements error:", error);
    return NextResponse.json(
      { error: "Something went wrong while fetching announcements." },
      { status: 500 }
    );
  }
}

// POST /api/announcements
export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const validation = validateRequest(createAnnouncementSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 422 }
      );
    }

    const { title, content, priority } = validation.data;

    const announcement = await prisma.announcement.create({
      data: { title, content, priority },
    });

    return NextResponse.json(
      { message: "Announcement published", announcement },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/announcements error:", error);
    return NextResponse.json(
      { error: "Something went wrong while creating the announcement." },
      { status: 500 }
    );
  }
}
