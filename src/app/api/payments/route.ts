import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createPaymentSchema, validateRequest } from "@/lib/validations";

// GET /api/payments
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const memberId = searchParams.get("memberId");

    const where: any = {};
    if (memberId) {
      if (memberId.length > 50) {
        return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
      }
      where.memberId = memberId;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: { member: { select: { fullName: true, phone: true } } },
      orderBy: { paymentDate: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error: any) {
    console.error("GET /api/payments error:", error);
    return NextResponse.json(
      { error: "Something went wrong while fetching payments." },
      { status: 500 }
    );
  }
}

// POST /api/payments
export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Coerce amount to number if it came in as a string
    if (typeof body.amount === "string") {
      const parsed = parseFloat(body.amount);
      if (isNaN(parsed)) {
        return NextResponse.json(
          { error: "Validation failed", details: { amount: ["Amount must be a valid number"] } },
          { status: 422 }
        );
      }
      body.amount = parsed;
    }

    const validation = validateRequest(createPaymentSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 422 }
      );
    }

    const { memberId, amount, paymentDate, method, reference, recordedBy, notes } = validation.data;

    // Verify the member exists and is active
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    if (member.status === "removed") {
      return NextResponse.json(
        { error: "Cannot record payment for a deactivated member" },
        { status: 400 }
      );
    }

    // Check for duplicate reference if provided
    if (reference) {
      const existingRef = await prisma.payment.findFirst({ where: { reference } });
      if (existingRef) {
        return NextResponse.json(
          { error: `A payment with reference "${reference}" already exists` },
          { status: 409 }
        );
      }
    }

    const payment = await prisma.payment.create({
      data: {
        memberId,
        amount,
        paymentDate: new Date(paymentDate),
        method,
        reference: reference || null,
        recordedBy: recordedBy || "Admin",
        notes: notes || null,
      },
    });

    // Auto-mark dues as paid
    let remaining = amount;
    const unpaidDues = await prisma.due.findMany({
      where: { memberId, status: { in: ["unpaid", "partial"] } },
      orderBy: { month: "asc" },
    });

    for (const due of unpaidDues) {
      if (remaining <= 0) break;
      if (remaining >= due.amount) {
        await prisma.due.update({
          where: { id: due.id },
          data: { status: "paid" },
        });
        remaining -= due.amount;
      } else {
        await prisma.due.update({
          where: { id: due.id },
          data: { status: "partial" },
        });
        remaining = 0;
      }
    }

    return NextResponse.json(
      { message: `Payment of GHS ${amount} recorded for ${member.fullName}`, payment },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/payments error:", error);
    return NextResponse.json(
      { error: "Something went wrong while recording the payment." },
      { status: 500 }
    );
  }
}
