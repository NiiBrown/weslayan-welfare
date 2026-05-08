import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createExpenseSchema, validateRequest } from "@/lib/validations";

// GET /api/expenses
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

// POST /api/expenses
export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Coerce amount
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

    const validation = validateRequest(createExpenseSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 422 }
      );
    }

    const validData = validation.data as { title: string; amount: number; date: string; category: string; description: string; approvedBy: string };
    const { title, amount, date, category, description, approvedBy } = validData;

    // Runtime guard + sanity check
    const dateStr = date as string;
    if (!dateStr || isNaN(Date.parse(dateStr))) {
      return NextResponse.json(
        { error: "A valid date is required" },
        { status: 422 }
      );
    }

    const expenseDate = new Date(dateStr);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    if (expenseDate > threeMonthsFromNow) {
      return NextResponse.json(
        { error: "Expense date seems too far in the future. Please check the date." },
        { status: 422 }
      );
    }

  const expense = await prisma.expense.create({
      data: {
        title,
        amount,
        date: expenseDate,
        category: category as string,
        description: (description as string) || null,
        approvedBy: (approvedBy as string) || "Admin",
      },
    });

    return NextResponse.json(
      { message: `Expense "${title}" recorded`, expense },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json(
      { error: "Something went wrong while recording the expense." },
      { status: 500 }
    );
  }
}
