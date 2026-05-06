import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendSms, generateReminderMessage } from "@/lib/sms";

// GET /api/sms - SMS history
export async function GET() {
  try {
    const history = await prisma.smsReminder.findMany({
      include: { member: { select: { fullName: true } } },
      orderBy: { dateSent: "desc" },
      take: 100, // Limit to last 100 records
    });
    return NextResponse.json(history);
  } catch (error: any) {
    console.error("GET /api/sms error:", error);
    return NextResponse.json(
      { error: "Something went wrong while fetching SMS history." },
      { status: 500 }
    );
  }
}

// POST /api/sms - Preview or send reminders
export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Defaults to send mode if body is empty
    }

    const preview = body.preview === true;

    // Find members with outstanding dues
    const members = await prisma.member.findMany({
      where: { status: "active" },
      include: { dues: true, payments: true },
    });

    const membersOwing = members
      .map((m) => {
        const totalDues = m.dues.reduce((s, d) => s + d.amount, 0);
        const totalPaid = m.payments.reduce((s, p) => s + p.amount, 0);
        const outstanding = totalDues - totalPaid;
        const unpaidMonths = m.dues.filter((d) => d.status === "unpaid").length;
        return { ...m, outstanding, unpaidMonths };
      })
      .filter((m) => m.outstanding > 0);

    if (membersOwing.length === 0) {
      return NextResponse.json({
        message: "No members with outstanding dues. Nothing to send.",
        count: 0,
        members: [],
      });
    }

    // Preview mode — just return the list
    if (preview) {
      return NextResponse.json({
        count: membersOwing.length,
        members: membersOwing.map((m) => ({
          id: m.id,
          name: m.fullName,
          phone: m.phone,
          outstanding: m.outstanding,
          unpaidMonths: m.unpaidMonths,
          message: generateReminderMessage(m.fullName, m.outstanding, m.unpaidMonths),
        })),
      });
    }

    // Send mode
    const results = [];
    let delivered = 0;
    let failed = 0;

    for (const m of membersOwing) {
      // Validate phone before attempting to send
      if (!m.phone || m.phone.length < 10) {
        results.push({
          member: m.fullName,
          phone: m.phone,
          status: "failed",
          error: "Invalid phone number",
        });
        failed++;
        continue;
      }

      const message = generateReminderMessage(m.fullName, m.outstanding, m.unpaidMonths);

      try {
        const smsResult = await sendSms({ to: m.phone, message });

        await prisma.smsReminder.create({
          data: {
            memberId: m.id,
            phone: m.phone,
            message,
            status: smsResult.success ? "delivered" : "failed",
          },
        });

        if (smsResult.success) {
          delivered++;
        } else {
          failed++;
        }

        results.push({
          member: m.fullName,
          phone: m.phone,
          status: smsResult.success ? "delivered" : "failed",
          error: smsResult.error,
        });
      } catch (error: any) {
        failed++;
        results.push({
          member: m.fullName,
          phone: m.phone,
          status: "failed",
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      message: `Reminders sent: ${delivered} delivered, ${failed} failed`,
      delivered,
      failed,
      results,
    });
  } catch (error: any) {
    console.error("POST /api/sms error:", error);
    return NextResponse.json(
      { error: "Something went wrong while sending reminders." },
      { status: 500 }
    );
  }
}
