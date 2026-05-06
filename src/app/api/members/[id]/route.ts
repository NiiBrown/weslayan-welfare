import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { updateMemberSchema, validateRequest } from "@/lib/validations";

// GET /api/members/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id || id.length > 50) {
      return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
    }

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        dues: { orderBy: { month: "desc" } },
        payments: { orderBy: { paymentDate: "desc" } },
        welfareBenefits: { orderBy: { date: "desc" } },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const totalDues = member.dues.reduce((s, d) => s + d.amount, 0);
    const totalPaid = member.payments.reduce((s, p) => s + p.amount, 0);

    return NextResponse.json({
      ...member,
      totalDues,
      totalPaid,
      outstanding: totalDues - totalPaid,
      unpaidMonths: member.dues.filter((d) => d.status === "unpaid").length,
    });
  } catch (error: any) {
    console.error(`GET /api/members/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// PUT /api/members/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Check member exists
    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const validation = validateRequest(updateMemberSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 422 }
      );
    }

    const data = validation.data;

    // If phone is being changed, check for duplicates
    if (data.phone && data.phone !== existing.phone) {
      const phoneExists = await prisma.member.findFirst({
        where: { phone: data.phone, id: { not: id } },
      });
      if (phoneExists) {
        return NextResponse.json(
          { error: "Another member already has this phone number" },
          { status: 409 }
        );
      }
    }

    const member = await prisma.member.update({
      where: { id },
      data: {
        ...(data.fullName && { fullName: data.fullName }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.phone && { phone: data.phone }),
        ...(data.yearGroup && { yearGroup: data.yearGroup }),
        ...(data.location && { location: data.location }),
        ...(data.status && { status: data.status }),
      },
    });

    return NextResponse.json(member);
  } catch (error: any) {
    console.error(`PUT /api/members/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Something went wrong while updating the member." },
      { status: 500 }
    );
  }
}

// DELETE /api/members/[id] - Soft delete only
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (existing.status === "removed") {
      return NextResponse.json(
        { error: "This member has already been deactivated" },
        { status: 400 }
      );
    }

    const member = await prisma.member.update({
      where: { id },
      data: { status: "removed" },
    });

    return NextResponse.json({
      message: `${member.fullName} has been deactivated. Financial records are preserved.`,
      member,
    });
  } catch (error: any) {
    console.error(`DELETE /api/members/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Something went wrong while deactivating the member." },
      { status: 500 }
    );
  }
}
