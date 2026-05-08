import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(expenses);
  } catch (error: any) {
    console.error("GET /api/expenses error:", error);
    return NextResponse.json(
      { error: "Something went wrong while fetching expenses." },
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

    const title: string = body.title || "";
    const amount: number = Number(body.amount) || 0;
    const date: string = body.date || new Date().toISOString();
    const category: string = body.category || "other";
    const description: string = body.description || "";
    const approvedBy: string = body.approvedBy || "Admin";

    if (!title || title.length < 2) {
      return NextResponse.json({ error: "Title must be at least 2 characters" }, { status: 422 });
    }
    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 422 });
    }
    if (isNaN(Date.parse(date))) {
      return NextResponse.json({ error: "Please enter a valid date" }, { status: 422 });
    }

    const expenseDate = new Date(date);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    if (expenseDate > threeMonthsFromNow) {
      return NextResponse.json(
        { error: "Expense date seems too far in the future." },
        { status: 422 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        amount,
        date: expenseDate,
        category,
        description: description || null,
        approvedBy,
      },
    });

    return NextResponse.json({ message: "Expense recorded", expense }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json(
      { error: "Something went wrong while recording the expense." },
      { status: 500 }
    );
  }
}