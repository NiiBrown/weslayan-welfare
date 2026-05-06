import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.smsReminder.deleteMany();
  await prisma.welfareBenefit.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.due.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.member.deleteMany();
  await prisma.user.deleteMany();
  await prisma.appSettings.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@weslayanwelfare.org",
      phone: "+233244000001",
      password: hashedPassword,
      role: "super_admin",
    },
  });

  const treasurerUser = await prisma.user.create({
    data: {
      email: "treasurer@weslayanwelfare.org",
      phone: "+233244000002",
      password: hashedPassword,
      role: "treasurer",
    },
  });

  // Create member users and members
  const membersData = [
    { name: "Kwame Asante", email: "kwame@email.com", phone: "+233244123456", yearGroup: "2005", location: "Accra", joinDate: "2022-01-15" },
    { name: "Ama Serwaa", email: "ama@email.com", phone: "+233201234567", yearGroup: "2008", location: "Kumasi", joinDate: "2022-03-10" },
    { name: "Yaw Mensah", email: "yaw@email.com", phone: "+233551234567", yearGroup: "2003", location: "Tema", joinDate: "2021-06-20" },
    { name: "Efua Danso", email: "efua@email.com", phone: "+233271234567", yearGroup: "2010", location: "Cape Coast", joinDate: "2023-01-05" },
    { name: "Kofi Boateng", email: "kofi@email.com", phone: "+233541234567", yearGroup: "2005", location: "Accra", joinDate: "2022-01-15" },
    { name: "Adwoa Frimpong", email: "adwoa@email.com", phone: "+233261234567", yearGroup: "2007", location: "Takoradi", joinDate: "2022-06-01" },
    { name: "Nana Osei", email: "nana@email.com", phone: "+233501234567", yearGroup: "2003", location: "Accra", joinDate: "2021-01-10" },
    { name: "Abena Kyei", email: "abena@email.com", phone: "+233241234568", yearGroup: "2012", location: "Sunyani", joinDate: "2023-06-15" },
  ];

  const members = [];
  for (const m of membersData) {
    const user = await prisma.user.create({
      data: {
        email: m.email,
        phone: m.phone,
        password: hashedPassword,
        role: "member",
      },
    });

    const member = await prisma.member.create({
      data: {
        userId: user.id,
        fullName: m.name,
        email: m.email,
        phone: m.phone,
        yearGroup: m.yearGroup,
        location: m.location,
        status: m.name === "Adwoa Frimpong" ? "inactive" : "active",
        joinDate: new Date(m.joinDate),
      },
    });
    members.push(member);
  }

  // Create dues for each member (monthly from their join date to Dec 2024)
  const duesAmount = 200;
  for (const member of members) {
    const joinDate = member.joinDate;
    const startYear = joinDate.getFullYear();
    const startMonth = joinDate.getMonth(); // 0-indexed

    for (let y = startYear; y <= 2024; y++) {
      const mStart = y === startYear ? startMonth : 0;
      const mEnd = y === 2024 ? 11 : 11;
      for (let mo = mStart; mo <= mEnd; mo++) {
        const monthStr = `${y}-${String(mo + 1).padStart(2, "0")}`;
        await prisma.due.create({
          data: {
            memberId: member.id,
            amount: duesAmount,
            month: monthStr,
            status: "unpaid",
          },
        });
      }
    }
  }

  // Record payments
  const paymentRecords = [
    { memberIdx: 0, amount: 2400, date: "2024-06-15", method: "mobile_money", ref: "MM-2024-001" },
    { memberIdx: 1, amount: 1800, date: "2024-09-20", method: "bank_transfer", ref: "BT-2024-002" },
    { memberIdx: 2, amount: 2400, date: "2024-08-10", method: "mobile_money", ref: "MM-2024-003" },
    { memberIdx: 3, amount: 600, date: "2024-11-05", method: "cash", ref: "CSH-2024-004" },
    { memberIdx: 4, amount: 1200, date: "2024-10-15", method: "mobile_money", ref: "MM-2024-005" },
    { memberIdx: 5, amount: 600, date: "2024-04-20", method: "bank_transfer", ref: "BT-2024-006" },
    { memberIdx: 6, amount: 2000, date: "2024-11-12", method: "mobile_money", ref: "MM-2024-007" },
    { memberIdx: 7, amount: 600, date: "2024-11-20", method: "bank_transfer", ref: "BT-2024-008" },
  ];

  for (const p of paymentRecords) {
    await prisma.payment.create({
      data: {
        memberId: members[p.memberIdx].id,
        amount: p.amount,
        paymentDate: new Date(p.date),
        method: p.method,
        reference: p.ref,
        recordedBy: "Admin",
      },
    });

    // Mark some dues as paid
    const memberDues = await prisma.due.findMany({
      where: { memberId: members[p.memberIdx].id, status: "unpaid" },
      orderBy: { month: "asc" },
    });
    let remaining = p.amount;
    for (const d of memberDues) {
      if (remaining <= 0) break;
      await prisma.due.update({
        where: { id: d.id },
        data: { status: "paid" },
      });
      remaining -= d.amount;
    }
  }

  // Expenses
  const expensesData = [
    { title: "Medical Support - Yaw Mensah", amount: 500, date: "2024-11-20", category: "medical", description: "Hospital bill assistance", approvedBy: "President" },
    { title: "Funeral Donation - Kofi Family", amount: 300, date: "2024-10-15", category: "bereavement", description: "Funeral support for member's parent", approvedBy: "President" },
    { title: "Marriage Support - Ama Serwaa", amount: 400, date: "2024-08-20", category: "marriage", description: "Wedding gift and support for member", approvedBy: "Committee" },
    { title: "Naming Ceremony - Nana Osei Family", amount: 300, date: "2024-09-01", category: "naming_ceremony", description: "Naming ceremony donation for member's child", approvedBy: "President" },
  ];

  for (const e of expensesData) {
    await prisma.expense.create({
      data: { ...e, date: new Date(e.date) },
    });
  }

  // Announcements
  await prisma.announcement.createMany({
    data: [
      { title: "Annual General Meeting", content: "The AGM is scheduled for January 25, 2025 at the school campus. All members are encouraged to attend.", priority: "high" },
      { title: "Dues Payment Reminder", content: "Please ensure all outstanding dues are settled before the end of the year. Contact the treasurer for payment options.", priority: "medium" },
      { title: "New Welfare Benefits Package", content: "The executive committee has approved expanded welfare benefits starting January 2025. Details will be shared at the AGM.", priority: "low" },
    ],
  });

  // App settings
  await prisma.appSettings.create({
    data: {
      id: "app_settings",
      monthlyDues: 200,
      associationName: "Weslayan Welfare Association",
    },
  });

  console.log("Seeding complete!");
  console.log("");
  console.log("Login credentials:");
  console.log("─────────────────────────────────────");
  console.log("Admin:      admin@weslayanwelfare.org / password123");
  console.log("Treasurer:  treasurer@weslayanwelfare.org / password123");
  console.log("Member:     kwame@email.com / password123");
  console.log("            (any member email works with password123)");
  console.log("─────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
