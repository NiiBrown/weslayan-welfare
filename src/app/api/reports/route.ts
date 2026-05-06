import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const VALID_TYPES = ["dashboard", "contributions", "outstanding", "monthly", "yearly", "expenses", "balance"];

// GET /api/reports?type=dashboard|contributions|outstanding|expenses
export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type") || "dashboard";

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid report type. Must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (type === "dashboard") {
      const [members, payments, expenses, dues] = await Promise.all([
        prisma.member.findMany({ include: { dues: true, payments: true } }),
        prisma.payment.findMany({
          orderBy: { paymentDate: "desc" },
          take: 10,
          include: { member: { select: { fullName: true } } },
        }),
        prisma.expense.findMany({ orderBy: { date: "desc" } }),
        prisma.due.findMany(),
      ]);

      const totalMembers = members.length;
      const activeMembers = members.filter((m) => m.status === "active").length;
      const inactiveMembers = members.filter((m) => m.status !== "active").length;
      const totalDuesExpected = dues.reduce((s, d) => s + d.amount, 0);
      const totalPayments = members.reduce(
        (s, m) => s + m.payments.reduce((ps, p) => ps + p.amount, 0),
        0
      );
      const totalOutstanding = totalDuesExpected - totalPayments;
      const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
      const netBalance = totalPayments - totalExpenses;

      const membersOwing = members
        .map((m) => {
          const mDues = m.dues.reduce((s, d) => s + d.amount, 0);
          const mPaid = m.payments.reduce((s, p) => s + p.amount, 0);
          return {
            id: m.id,
            name: m.fullName,
            yearGroup: m.yearGroup,
            outstanding: mDues - mPaid,
            unpaidMonths: m.dues.filter((d) => d.status === "unpaid").length,
          };
        })
        .filter((m) => m.outstanding > 0)
        .sort((a, b) => b.outstanding - a.outstanding);

      return NextResponse.json({
        totalMembers,
        activeMembers,
        inactiveMembers,
        totalDuesExpected,
        totalPayments,
        totalOutstanding,
        totalExpenses,
        netBalance,
        membersOwing,
        recentPayments: payments,
        recentExpenses: expenses.slice(0, 5),
      });
    }

    if (type === "contributions") {
      const payments = await prisma.payment.findMany({
        include: { member: { select: { fullName: true, yearGroup: true } } },
        orderBy: { paymentDate: "desc" },
      });
      return NextResponse.json(payments);
    }

    if (type === "outstanding") {
      const members = await prisma.member.findMany({
        where: { status: "active" },
        include: { dues: true, payments: true },
      });

      const owing = members
        .map((m) => {
          const totalDues = m.dues.reduce((s, d) => s + d.amount, 0);
          const totalPaid = m.payments.reduce((s, p) => s + p.amount, 0);
          return {
            id: m.id,
            name: m.fullName,
            phone: m.phone,
            yearGroup: m.yearGroup,
            totalDues,
            totalPaid,
            outstanding: totalDues - totalPaid,
            unpaidMonths: m.dues.filter((d) => d.status === "unpaid").length,
          };
        })
        .filter((m) => m.outstanding > 0);

      return NextResponse.json(owing);
    }

    if (type === "expenses") {
      const expenses = await prisma.expense.findMany({ orderBy: { date: "desc" } });
      const byCategory: Record<string, number> = {};
      expenses.forEach((e) => {
        byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      });
      return NextResponse.json({
        expenses,
        byCategory,
        total: expenses.reduce((s, e) => s + e.amount, 0),
      });
    }

    return NextResponse.json({ error: "Report type not yet implemented" }, { status: 501 });
  } catch (error: any) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json(
      { error: "Something went wrong while generating the report." },
      { status: 500 }
    );
  }
}
