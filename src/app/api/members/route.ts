import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createMemberSchema, validateRequest } from "@/lib/validations";

// GET /api/members
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const yearGroup = searchParams.get("yearGroup");

    const where: any = {};
    if (status && status !== "all") {
      if (!["active", "inactive", "removed"].includes(status)) {
        return NextResponse.json(
          { error: "Status must be active, inactive, or removed" },
          { status: 400 }
        );
      }
      where.status = status;
    }
    if (yearGroup) where.yearGroup = yearGroup;
    if (search) {
      const term = search.trim();
      if (term.length > 100) {
        return NextResponse.json({ error: "Search term is too long" }, { status: 400 });
      }
      where.OR = [
        { fullName: { contains: term } },
        { phone: { contains: term } },
        { email: { contains: term } },
        { yearGroup: { contains: term } },
      ];
    }

    const members = await prisma.member.findMany({
      where,
      include: {
        dues: true,
        payments: { orderBy: { paymentDate: "desc" } },
      },
      orderBy: { fullName: "asc" },
    });

    const enriched = members.map((m) => {
      const totalDues = m.dues.reduce((s, d) => s + d.amount, 0);
      const totalPaid = m.payments.reduce((s, p) => s + p.amount, 0);
      return {
        id: m.id,
        fullName: m.fullName,
        email: m.email,
        phone: m.phone,
        yearGroup: m.yearGroup,
        location: m.location,
        status: m.status,
        joinDate: m.joinDate,
        totalDues,
        totalPaid,
        outstanding: totalDues - totalPaid,
        unpaidMonths: m.dues.filter((d) => d.status === "unpaid").length,
        recentPayment: m.payments[0] || null,
      };
    });

    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error("GET /api/members error:", error);
    return NextResponse.json(
      { error: "Something went wrong while fetching members. Please try again." },
      { status: 500 }
    );
  }
}

// POST /api/members
export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body. Please send valid JSON." },
        { status: 400 }
      );
    }

    // Validate input
    const validation = validateRequest(createMemberSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 422 }
      );
    }

    const { fullName, email, phone, yearGroup, location } = validation.data;

    // Check for duplicate phone
    const existingPhone = await prisma.user.findFirst({ where: { phone } });
    if (existingPhone) {
      return NextResponse.json(
        { error: "A member with this phone number already exists" },
        { status: 409 }
      );
    }

    // Check for duplicate email if provided
    if (email) {
      const existingEmail = await prisma.user.findFirst({ where: { email } });
      if (existingEmail) {
        return NextResponse.json(
          { error: "A member with this email already exists" },
          { status: 409 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash("password123", 10);

    const user = await prisma.user.create({
      data: {
        email: email || null,
        phone,
        password: hashedPassword,
        role: "member",
      },
    });

    const member = await prisma.member.create({
      data: {
        userId: user.id,
        fullName,
        email: email || null,
        phone,
        yearGroup: yearGroup || null,
        location: location || null,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/members error:", error);

    // Handle Prisma unique constraint violations
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] || "field";
      return NextResponse.json(
        { error: `A record with this ${field} already exists` },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong while creating the member. Please try again." },
      { status: 500 }
    );
  }
}
