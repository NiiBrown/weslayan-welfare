import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const memberId = req.nextUrl.searchParams.get("memberId");
    const where: any = {};
    if (memberId) where.memberId = memberId;

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

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const memberId: string = body.memberId || "";
    const amount: number = Number(body.amount) || 0;
    const paymentDate: string = body.paymentDate || new Date().toISOString();
    const method: string = body.method || "cash";
    const reference: string = body.reference || "";
    const recordedBy: string = body.recordedBy || "Admin";
    const notes: string = body.notes || "";

    if (!memberId) {
      return NextResponse.json({ error: "Please select a member" }, { status: 422 });
    }
    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 422 });
    }
    if (isNaN(Date.parse(paymentDate))) {
      return NextResponse.json({ error: "Please enter a valid payment date" }, { status: 422 });
    }

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

    if (reference) {
      const existingRef = await prisma.payment.findFirst({ where: { reference } });
      if (existingRef) {
        return NextResponse.json(
          { error: "A payment with this reference already exists" },
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
        recordedBy,
        notes: notes || null,
      },
    });

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
      { message: "Payment recorded", payment },
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