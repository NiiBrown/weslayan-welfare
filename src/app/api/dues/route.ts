import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { assignDuesSchema, validateRequest } from "@/lib/validations";

// GET /api/dues
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const memberId = searchParams.get("memberId");
    const status = searchParams.get("status");

    const where: any = {};
    if (memberId) where.memberId = memberId;
    if (status) {
      if (!["paid", "unpaid", "partial", "exempt"].includes(status)) {
        return NextResponse.json(
          { error: "Status must be paid, unpaid, partial, or exempt" },
          { status: 400 }
        );
      }
      where.status = status;
    }

    const dues = await prisma.due.findMany({
      where,
      include: { member: { select: { fullName: true } } },
      orderBy: { month: "desc" },
    });

    return NextResponse.json(dues);
  } catch (error: any) {
    console.error("GET /api/dues error:", error);
    return NextResponse.json(
      { error: "Something went wrong while fetching dues." },
      { status: 500 }
    );
  }
}

// POST /api/dues - Assign dues to members for a specific month
export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (typeof body.amount === "string") {
      body.amount = parseFloat(body.amount);
    }

    const validation = validateRequest(assignDuesSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 422 }
      );
    }

    const { month, amount, memberIds } = validation.data;

    // Validate month isn't too far in the future
    const [year, mo] = month.split("-").map(Number);
    const monthDate = new Date(year, mo - 1);
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    if (monthDate > sixMonthsFromNow) {
      return NextResponse.json(
        { error: "Cannot assign dues more than 6 months in advance" },
        { status: 422 }
      );
    }

    // Determine target members
    let targetMembers: string[];
    if (memberIds && memberIds.length > 0) {
      // Verify all provided IDs exist
      const existing = await prisma.member.findMany({
        where: { id: { in: memberIds } },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((m) => m.id));
      const invalid = memberIds.filter((id) => !existingIds.has(id));
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: `These member IDs were not found: ${invalid.join(", ")}` },
          { status: 404 }
        );
      }
      targetMembers = memberIds;
    } else {
      const activeMembers = await prisma.member.findMany({
        where: { status: "active" },
        select: { id: true },
      });
      targetMembers = activeMembers.map((m) => m.id);

      if (targetMembers.length === 0) {
        return NextResponse.json(
          { error: "No active members found to assign dues to" },
          { status: 400 }
        );
      }
    }

    // Skip members who already have dues for this month
    const existing = await prisma.due.findMany({
      where: { month, memberId: { in: targetMembers } },
    });
    const existingMemberIds = new Set(existing.map((d) => d.memberId));

    const newDues = targetMembers
      .filter((id) => !existingMemberIds.has(id))
      .map((memberId) => ({
        memberId,
        amount,
        month,
        status: "unpaid",
      }));

    if (newDues.length === 0) {
      return NextResponse.json({
        message: "Dues were already assigned for this month to all selected members",
        created: 0,
        skipped: existingMemberIds.size,
      });
    }

    const result = await prisma.due.createMany({ data: newDues });

    return NextResponse.json(
      {
        message: `Dues of GHS ${amount} assigned to ${result.count} members for ${month}`,
        created: result.count,
        skipped: existingMemberIds.size,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/dues error:", error);
    return NextResponse.json(
      { error: "Something went wrong while assigning dues." },
      { status: 500 }
    );
  }
}
