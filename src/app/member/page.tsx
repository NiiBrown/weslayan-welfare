"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Home, CreditCard, Bell, User, LogOut, Menu, CheckCircle,
  AlertCircle, DollarSign, Clock, Phone, Mail, MapPin, Calendar,
} from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "@/lib/helpers";

export default function MemberDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [memberData, setMemberData] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const memberId = (session?.user as any)?.memberId;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?role=member");
      return;
    }
    if (status === "authenticated" && memberId) {
      fetchData();
    }
  }, [status, memberId]);

  async function fetchData() {
    setLoading(true);
    try {
      const [member, pay, ann] = await Promise.all([
        fetch(`/api/members/${memberId}`).then((r) => r.json()),
        fetch(`/api/payments?memberId=${memberId}`).then((r) => r.json()),
        fetch("/api/announcements").then((r) => r.json()),
      ]);
      setMemberData(member);
      setPayments(pay);
      setAnnouncements(ann);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "payments", label: "Payment History", icon: CreditCard },
    { id: "announcements", label: "Announcements", icon: Bell },
    { id: "profile", label: "My Profile", icon: User },
  ];

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="text-center">
          <div className="w-10 h-10 rounded-lg bg-[#1B4B8A] flex items-center justify-center text-white font-bold mx-auto mb-3 animate-pulse">WW</div>
          <p className="text-sm text-[#6B7F99]">Loading your portal...</p>
        </div>
      </div>
    );
  }

  const balance = memberData?.outstanding || 0;
  const monthsOwing = memberData?.unpaidMonths || 0;
  const isFullyPaid = balance <= 0;

  const Badge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: string }) => {
    const colors: Record<string, string> = {
      default: "bg-[#E8F0FA] text-[#1B4B8A]",
      success: "bg-green-100 text-green-700",
      warning: "bg-amber-100 text-amber-700",
      danger: "bg-red-100 text-red-700",
    };
    return <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[variant] || colors.default}`}>{children}</span>;
  };

  const StatCard = ({ icon: Icon, label, value, color = "#1B4B8A" }: any) => (
    <div className="bg-white rounded-xl p-5 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
          <Icon size={22} style={{ color }} />
        </div>
        <div>
          <div className="text-xs text-[#6B7F99] mb-1">{label}</div>
          <div className="text-xl font-bold text-[#1A2440]">{value}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      {/* Sidebar */}
      <aside className={`w-64 bg-[#0A1B3D] text-white flex flex-col fixed inset-y-0 left-0 z-50 transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1B4B8A] flex items-center justify-center font-extrabold text-sm">WW</div>
          <div>
            <div className="font-bold text-sm">Weslayan Welfare</div>
            <div className="text-[11px] opacity-50">Member Portal</div>
          </div>
        </div>
        <nav className="flex-1 p-3 overflow-auto">
          {navItems.map((item) => (
            <button key={item.id}
              onClick={() => { setActivePage(item.id); setSidebarOpen(false); }}
              className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-lg text-sm mb-0.5 text-left transition ${
                activePage === item.id ? "bg-white/12 text-white font-semibold" : "text-white/55 hover:text-white/80"
              }`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-lg text-sm text-white/50 hover:text-white/80 text-left">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="flex-1 md:ml-64 min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b border-[#D0DCE8] px-7 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1A2440]">
              {activePage === "dashboard" ? "My Dashboard" : activePage === "payments" ? "Payment History" : activePage === "announcements" ? "Announcements" : "My Profile"}
            </h1>
            <p className="text-xs text-[#6B7F99] mt-0.5">Welcome back, {memberData?.fullName?.split(" ")[0]}</p>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1"><Menu size={24} /></button>
        </header>

        <div className="p-7">
          {/* Dashboard */}
          {activePage === "dashboard" && memberData && (
            <>
              <div className={`rounded-xl p-6 mb-6 border ${isFullyPaid ? "bg-gradient-to-r from-green-50 to-green-100 border-green-300" : "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300"}`}>
                <div className="flex items-center gap-3 mb-2">
                  {isFullyPaid ? <CheckCircle size={24} className="text-green-600" /> : <AlertCircle size={24} className="text-amber-600" />}
                  <h3 className={`text-base font-bold ${isFullyPaid ? "text-green-800" : "text-amber-800"}`}>
                    {isFullyPaid ? "You're in good standing!" : "You have outstanding dues"}
                  </h3>
                </div>
                <p className={`text-sm leading-relaxed ${isFullyPaid ? "text-green-700" : "text-amber-700"}`}>
                  {isFullyPaid
                    ? "Thank you for your commitment. Your contribution helps strengthen the welfare of all members."
                    : "You currently have outstanding dues. Kindly settle them to remain in good standing and support the welfare fund."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
                <StatCard icon={DollarSign} label="Total Dues" value={formatCurrency(memberData.totalDues)} />
                <StatCard icon={CheckCircle} label="Total Paid" value={formatCurrency(memberData.totalPaid)} color="#16a34a" />
                <StatCard icon={AlertCircle} label="Outstanding" value={formatCurrency(balance)} color={balance > 0 ? "#d97706" : "#16a34a"} />
                <StatCard icon={Clock} label="Months Owing" value={monthsOwing} color="#6366f1" />
              </div>

              <h3 className="text-base font-bold mb-4">Recent Payments</h3>
              <div className="overflow-x-auto rounded-xl border border-[#D0DCE8] bg-white">
                <table className="w-full text-sm">
                  <thead><tr className="bg-[#EFF3F8]">
                    {["Date", "Amount", "Method", "Reference"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#6B7F99] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {payments.slice(0, 5).map((p: any) => (
                      <tr key={p.id} className="border-t border-[#D0DCE8]">
                        <td className="px-4 py-3">{formatDate(p.paymentDate)}</td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency(p.amount)}</td>
                        <td className="px-4 py-3">{p.method}</td>
                        <td className="px-4 py-3">{p.reference}</td>
                      </tr>
                    ))}
                    {payments.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-[#6B7F99]">No payments recorded yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Payment History */}
          {activePage === "payments" && (
            <div className="overflow-x-auto rounded-xl border border-[#D0DCE8] bg-white">
              <table className="w-full text-sm">
                <thead><tr className="bg-[#EFF3F8]">
                  {["Date", "Amount", "Method", "Reference", "Recorded By"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#6B7F99] uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {payments.map((p: any) => (
                    <tr key={p.id} className="border-t border-[#D0DCE8]">
                      <td className="px-4 py-3">{formatDate(p.paymentDate)}</td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3">{p.method}</td>
                      <td className="px-4 py-3">{p.reference}</td>
                      <td className="px-4 py-3">{p.recordedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Announcements */}
          {activePage === "announcements" && (
            <div className="space-y-4">
              {announcements.map((a: any) => (
                <div key={a.id} className={`bg-white rounded-xl p-6 border border-[#D0DCE8] border-l-4 ${
                  a.priority === "high" ? "border-l-red-500" : a.priority === "medium" ? "border-l-amber-500" : "border-l-green-500"
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-base font-bold">{a.title}</h3>
                    <Badge variant={a.priority === "high" ? "danger" : a.priority === "medium" ? "warning" : "success"}>{a.priority}</Badge>
                  </div>
                  <p className="text-sm text-[#3D4E66] leading-relaxed mb-2">{a.content}</p>
                  <span className="text-xs text-[#6B7F99]">{formatDate(a.createdAt)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Profile */}
          {activePage === "profile" && memberData && (
            <div className="bg-white rounded-xl p-7 border border-[#D0DCE8] max-w-lg">
              <div className="flex items-center gap-4 mb-7">
                <div className="w-16 h-16 rounded-full bg-[#1B4B8A] flex items-center justify-center text-white font-bold text-2xl">
                  {getInitials(memberData.fullName)}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{memberData.fullName}</h3>
                  <p className="text-sm text-[#6B7F99]">Year Group: {memberData.yearGroup}</p>
                </div>
              </div>
              {[
                { icon: Mail, label: "Email", value: memberData.email },
                { icon: Phone, label: "Phone", value: memberData.phone },
                { icon: MapPin, label: "Location", value: memberData.location },
                { icon: Calendar, label: "Member Since", value: formatDate(memberData.joinDate) },
              ].map((f, i) => (
                <div key={i} className={`flex items-center gap-3 py-3.5 ${i < 3 ? "border-b border-[#D0DCE8]" : ""}`}>
                  <f.icon size={18} className="text-[#6B7F99]" />
                  <div>
                    <div className="text-xs text-[#6B7F99]">{f.label}</div>
                    <div className="text-sm font-medium">{f.value || "Not set"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
