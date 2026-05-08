"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import {
  Home, Users, CreditCard, Receipt, BarChart3, MessageSquare, Bell,
  Settings, LogOut, Menu, Plus, Search, Download, Send, Eye, Edit,
  Check, Clock, AlertCircle, TrendingUp, DollarSign, CheckCircle,
  X, Filter, User, Calendar, Phone, Mail, MapPin,
} from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "@/lib/helpers";
import { downloadCsv } from "@/lib/reports";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "members", label: "Members", icon: Users },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "sms", label: "SMS Reminders", icon: MessageSquare },
  { id: "announcements", label: "Announcements", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data state
  const [dashData, setDashData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [smsHistory, setSmsHistory] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modals
  const [showModal, setShowModal] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?role=admin");
      return;
    }
    if (status === "authenticated") {
      fetchAll();
    }
  }, [status]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [dash, mem, pay, exp, sms, ann] = await Promise.all([
        fetch("/api/reports?type=dashboard").then((r) => r.json()),
        fetch("/api/members").then((r) => r.json()),
        fetch("/api/payments").then((r) => r.json()),
        fetch("/api/expenses").then((r) => r.json()),
        fetch("/api/sms").then((r) => r.json()),
        fetch("/api/announcements").then((r) => r.json()),
      ]);
      setDashData(dash);
      setMembers(mem);
      setPayments(pay);
      setExpenses(exp);
      setSmsHistory(sms);
      setAnnouncements(ann);
    } catch (e) {
      console.error("Failed to load data", e);
    }
    setLoading(false);
  }

  // Form states
  const [memberForm, setMemberForm] = useState({ fullName: "", email: "", phone: "", yearGroup: "", location: "" });
  const [paymentForm, setPaymentForm] = useState({ memberId: "", amount: "", paymentDate: new Date().toISOString().split("T")[0], method: "mobile_money", reference: "" });
  const [expenseForm, setExpenseForm] = useState({ title: "", amount: "", date: new Date().toISOString().split("T")[0], category: "medical", description: "", approvedBy: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberForm),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.details
          ? Object.values(data.details as Record<string, string[]>).flat().join(". ")
          : data.error;
        setFormError(msg);
        setFormLoading(false);
        return;
      }
      setShowModal(null);
      setMemberForm({ fullName: "", email: "", phone: "", yearGroup: "", location: "" });
      fetchAll();
    } catch {
      setFormError("Network error. Please check your connection and try again.");
    }
    setFormLoading(false);
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentForm),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.details
          ? Object.values(data.details as Record<string, string[]>).flat().join(". ")
          : data.error;
        setFormError(msg);
        setFormLoading(false);
        return;
      }
      setShowModal(null);
      setPaymentForm({ memberId: "", amount: "", paymentDate: new Date().toISOString().split("T")[0], method: "mobile_money", reference: "" });
      fetchAll();
    } catch {
      setFormError("Network error. Please check your connection and try again.");
    }
    setFormLoading(false);
  }

  async function handleRecordExpense(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseForm),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.details
          ? Object.values(data.details as Record<string, string[]>).flat().join(". ")
          : data.error;
        setFormError(msg);
        setFormLoading(false);
        return;
      }
      setShowModal(null);
      setExpenseForm({ title: "", amount: "", date: new Date().toISOString().split("T")[0], category: "medical", description: "", approvedBy: "" });
      fetchAll();
    } catch {
      setFormError("Network error. Please check your connection and try again.");
    }
    setFormLoading(false);
  }

  async function handleSendReminders() {
    setFormLoading(true);
    try {
      await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preview: false }),
      });
      fetchAll();
    } catch (e) {
      console.error("Failed to send reminders", e);
    }
    setFormLoading(false);
  }

  const filteredMembers = members.filter((m: any) => {
    const matchSearch = m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone?.includes(searchTerm) || m.yearGroup?.includes(searchTerm);
    const matchStatus = filterStatus === "all" || m.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const titles: Record<string, string> = {
    dashboard: "Admin Dashboard", members: "Member Management", payments: "Payment Management",
    expenses: "Expense Management", reports: "Reports", sms: "SMS Reminders",
    announcements: "Announcements", settings: "Settings",
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="text-center">
          <div className="w-10 h-10 rounded-lg bg-[#1B4B8A] flex items-center justify-center text-white font-bold mx-auto mb-3 animate-pulse">WW</div>
          <p className="text-sm text-[#6B7F99]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Stat card component
  const StatCard = ({ icon: Icon, label, value, sub, color = "#1B4B8A" }: any) => (
    <div className="bg-white rounded-xl p-5 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
          <Icon size={22} style={{ color }} />
        </div>
        <div>
          <div className="text-xs text-[#6B7F99] mb-1">{label}</div>
          <div className="text-xl font-bold text-[#1A2440]">{value}</div>
          {sub && <div className="text-xs text-[#6B7F99] mt-1">{sub}</div>}
        </div>
      </div>
    </div>
  );

  // Badge
  const Badge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: string }) => {
    const colors: Record<string, string> = {
      default: "bg-[#E8F0FA] text-[#1B4B8A]",
      success: "bg-green-100 text-green-700",
      warning: "bg-amber-100 text-amber-700",
      danger: "bg-red-100 text-red-700",
    };
    return <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[variant] || colors.default}`}>{children}</span>;
  };

  // Modal wrapper
  const ModalWrapper = ({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-5" onClick={() => { onClose(); setFormError(null); }}>
      <div className="bg-white rounded-2xl p-7 w-full max-w-lg max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={() => { onClose(); setFormError(null); }} className="p-1"><X size={20} className="text-[#6B7F99]" /></button>
        </div>
        {formError && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4 border border-red-200">
            {formError}
          </div>
        )}
        {children}
      </div>
    </div>
  );

  const inputClass = "w-full px-3.5 py-2.5 rounded-lg border border-[#D0DCE8] text-sm outline-none focus:border-[#1B4B8A]";
  const labelClass = "block text-xs font-semibold text-[#6B7F99] mb-1.5";
  const btnPrimary = "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1B4B8A] text-white text-sm font-semibold hover:bg-[#15407A] transition";
  const btnSecondary = "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#D0DCE8] text-sm font-semibold hover:bg-[#EFF3F8] transition";

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      {/* Sidebar */}
      <aside className={`w-64 bg-[#0A1B3D] text-white flex flex-col fixed inset-y-0 left-0 z-50 transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1B4B8A] flex items-center justify-center font-extrabold text-sm">WW</div>
          <div>
            <div className="font-bold text-sm">Weslayan Welfare</div>
            <div className="text-[11px] opacity-50">Admin Portal</div>
          </div>
        </div>
        <nav className="flex-1 p-3 overflow-auto">
          {navItems.map((item) => (
            <button key={item.id}
              onClick={() => { setActivePage(item.id); setSidebarOpen(false); }}
              className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-lg text-sm mb-0.5 text-left transition ${
                activePage === item.id ? "bg-white/12 text-white font-semibold" : "text-white/55 hover:text-white/80 hover:bg-white/5"
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

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <main className="flex-1 md:ml-64 min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b border-[#D0DCE8] px-7 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1A2440]">{titles[activePage]}</h1>
            <p className="text-xs text-[#6B7F99] mt-0.5">Weslayan Welfare Association</p>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1"><Menu size={24} /></button>
        </header>

        <div className="p-7">
          {/* ═══ DASHBOARD ═══ */}
          {activePage === "dashboard" && dashData && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-7">
                <StatCard icon={Users} label="Total Members" value={dashData.totalMembers} sub={`${dashData.activeMembers} active, ${dashData.inactiveMembers} inactive`} />
                <StatCard icon={DollarSign} label="Total Dues Expected" value={formatCurrency(dashData.totalDuesExpected)} color="#6366f1" />
                <StatCard icon={TrendingUp} label="Total Received" value={formatCurrency(dashData.totalPayments)} color="#16a34a" />
                <StatCard icon={AlertCircle} label="Total Outstanding" value={formatCurrency(dashData.totalOutstanding)} color="#d97706" />
                <StatCard icon={Receipt} label="Total Expenses" value={formatCurrency(dashData.totalExpenses)} color="#dc2626" />
                <StatCard icon={BarChart3} label="Net Welfare Balance" value={formatCurrency(dashData.netBalance)} color={dashData.netBalance >= 0 ? "#16a34a" : "#dc2626"} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white rounded-xl p-6 border border-[#D0DCE8]">
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2"><AlertCircle size={18} className="text-amber-600" /> Members Owing ({dashData.membersOwing.length})</h3>
                  {dashData.membersOwing.slice(0, 6).map((m: any) => (
                    <div key={m.id} className="flex justify-between items-center py-2.5 border-b border-[#D0DCE8] last:border-0">
                      <div>
                        <div className="text-sm font-semibold">{m.name}</div>
                        <div className="text-xs text-[#6B7F99]">Year: {m.yearGroup} &middot; {m.unpaidMonths} months</div>
                      </div>
                      <Badge variant="warning">{formatCurrency(m.outstanding)}</Badge>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl p-6 border border-[#D0DCE8]">
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2"><CreditCard size={18} className="text-green-600" /> Recent Payments</h3>
                  {dashData.recentPayments.slice(0, 6).map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center py-2.5 border-b border-[#D0DCE8] last:border-0">
                      <div>
                        <div className="text-sm font-semibold">{p.member?.fullName}</div>
                        <div className="text-xs text-[#6B7F99]">{formatDate(p.paymentDate)} &middot; {p.method}</div>
                      </div>
                      <Badge variant="success">{formatCurrency(p.amount)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ═══ MEMBERS ═══ */}
          {activePage === "members" && (
            <>
              <div className="flex gap-3 mb-5 flex-wrap items-center">
                <div className="relative flex-1 min-w-[250px]">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7F99]" />
                  <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, phone, year..."
                    className={`${inputClass} pl-9`} />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={`${inputClass} w-auto min-w-[140px]`}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <button onClick={() => setShowModal("addMember")} className={btnPrimary}><Plus size={16} /> Add Member</button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#D0DCE8] bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#EFF3F8]">
                      {["Name", "Phone", "Year", "Location", "Status", "Balance"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#6B7F99] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((m: any) => (
                      <tr key={m.id} className="border-t border-[#D0DCE8] hover:bg-[#EFF3F8]/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#E8F0FA] flex items-center justify-center text-xs font-bold text-[#1B4B8A]">{getInitials(m.fullName)}</div>
                            <div>
                              <div className="font-semibold">{m.fullName}</div>
                              <div className="text-xs text-[#6B7F99]">{m.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{m.phone}</td>
                        <td className="px-4 py-3">{m.yearGroup}</td>
                        <td className="px-4 py-3">{m.location}</td>
                        <td className="px-4 py-3"><Badge variant={m.status === "active" ? "success" : "danger"}>{m.status}</Badge></td>
                        <td className="px-4 py-3 font-semibold" style={{ color: m.outstanding > 0 ? "#d97706" : "#16a34a" }}>
                          {m.outstanding > 0 ? formatCurrency(m.outstanding) : "Settled"}
                        </td>
                      </tr>
                    ))}
                    {filteredMembers.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-[#6B7F99]">No members found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[#6B7F99] mt-3">Showing {filteredMembers.length} of {members.length} members</p>
            </>
          )}

          {/* ═══ PAYMENTS ═══ */}
          {activePage === "payments" && (
            <>
              <div className="mb-5">
                <button onClick={() => setShowModal("recordPayment")} className={btnPrimary}><Plus size={16} /> Record Payment</button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[#D0DCE8] bg-white">
                <table className="w-full text-sm">
                  <thead><tr className="bg-[#EFF3F8]">
                    {["Date", "Member", "Amount", "Method", "Reference", "Recorded By"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#6B7F99] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {payments.map((p: any) => (
                      <tr key={p.id} className="border-t border-[#D0DCE8] hover:bg-[#EFF3F8]/50">
                        <td className="px-4 py-3 whitespace-nowrap">{formatDate(p.paymentDate)}</td>
                        <td className="px-4 py-3 font-semibold">{p.member?.fullName}</td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency(p.amount)}</td>
                        <td className="px-4 py-3">{p.method}</td>
                        <td className="px-4 py-3">{p.reference}</td>
                        <td className="px-4 py-3">{p.recordedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ═══ EXPENSES ═══ */}
          {activePage === "expenses" && (
            <>
              <div className="mb-5">
                <button onClick={() => setShowModal("recordExpense")} className={btnPrimary}><Plus size={16} /> Record Expense</button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[#D0DCE8] bg-white">
                <table className="w-full text-sm">
                  <thead><tr className="bg-[#EFF3F8]">
                    {["Date", "Title", "Amount", "Category", "Approved By"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#6B7F99] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {expenses.map((exp: any) => (
                      <tr key={exp.id} className="border-t border-[#D0DCE8] hover:bg-[#EFF3F8]/50">
                        <td className="px-4 py-3 whitespace-nowrap">{formatDate(exp.date)}</td>
                        <td className="px-4 py-3 font-semibold">{exp.title}</td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency(exp.amount)}</td>
                        <td className="px-4 py-3"><Badge>{exp.category}</Badge></td>
                        <td className="px-4 py-3">{exp.approvedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ═══ REPORTS ═══ */}
          {activePage === "reports" && (
            <>
              <p className="text-sm text-[#3D4E66] mb-6">Generate and download reports. Click any report to export as CSV.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: "Member Contributions", desc: "All member payments", icon: CreditCard, reportType: "contributions" },
                  { title: "Outstanding Dues", desc: "Members with unpaid balances", icon: AlertCircle, reportType: "outstanding" },
                  { title: "Expense Report", desc: "All welfare expenses", icon: Receipt, reportType: "expenses" },
                ].map((r, i) => (
                  <div key={i} className="bg-white rounded-xl p-6 border border-[#D0DCE8] hover:shadow-md transition-shadow">
                    <div className="w-11 h-11 rounded-lg bg-[#E8F0FA] flex items-center justify-center mb-3.5">
                      <r.icon size={22} className="text-[#1B4B8A]" />
                    </div>
                    <h4 className="text-[15px] font-bold mb-1">{r.title}</h4>
                    <p className="text-xs text-[#6B7F99] mb-4">{r.desc}</p>
                    <button onClick={async () => {
                      const data = await fetch(`/api/reports?type=${r.reportType}`).then((res) => res.json());
                      const rows = Array.isArray(data) ? data : data.expenses || data;
                      downloadCsv({
                        title: r.title,
                        generatedAt: new Date().toISOString(),
                        columns: Object.keys(rows[0] || {}).map((k) => ({ key: k, label: k })),
                        rows,
                      }, `${r.reportType}-report.csv`);
                    }} className={btnSecondary}><Download size={14} /> Download CSV</button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ═══ SMS ═══ */}
          {activePage === "sms" && (
            <>
              <div className="bg-white rounded-xl p-6 border border-[#D0DCE8] mb-6">
                <h3 className="text-base font-bold mb-3">Send Monthly Reminder</h3>
                <p className="text-sm text-[#3D4E66] mb-4">
                  Send SMS to all members with outstanding dues. In dev mode, messages are logged to the console instead of actually sent.
                </p>
                <div className="bg-[#EFF3F8] rounded-lg p-4 mb-4 text-sm text-[#3D4E66] italic border border-[#D0DCE8]">
                  "Dear [Name], you currently owe [Amount] for [Months] month(s) welfare dues. Kindly make payment to support the association. Thank you."
                </div>
                <button onClick={handleSendReminders} className={btnPrimary}><Send size={16} /> Send Reminders</button>
              </div>
              <h3 className="text-base font-bold mb-4">SMS History</h3>
              <div className="overflow-x-auto rounded-xl border border-[#D0DCE8] bg-white">
                <table className="w-full text-sm">
                  <thead><tr className="bg-[#EFF3F8]">
                    {["Date", "Member", "Phone", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#6B7F99] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {smsHistory.map((s: any) => (
                      <tr key={s.id} className="border-t border-[#D0DCE8]">
                        <td className="px-4 py-3 whitespace-nowrap">{formatDate(s.dateSent)}</td>
                        <td className="px-4 py-3">{s.member?.fullName}</td>
                        <td className="px-4 py-3">{s.phone}</td>
                        <td className="px-4 py-3"><Badge variant={s.status === "delivered" ? "success" : "danger"}>{s.status}</Badge></td>
                      </tr>
                    ))}
                    {smsHistory.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-[#6B7F99]">No SMS history</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ═══ ANNOUNCEMENTS ═══ */}
          {activePage === "announcements" && (
            <div className="space-y-4">
              {announcements.map((a: any) => (
                <div key={a.id} className="bg-white rounded-xl p-6 border border-[#D0DCE8]">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-base font-bold">{a.title}</h3>
                    <Badge variant={a.priority === "high" ? "danger" : a.priority === "medium" ? "warning" : "success"}>{a.priority}</Badge>
                  </div>
                  <p className="text-sm text-[#3D4E66] mb-2 leading-relaxed">{a.content}</p>
                  <span className="text-xs text-[#6B7F99]">{formatDate(a.createdAt)}</span>
                </div>
              ))}
            </div>
          )}

          {/* ═══ SETTINGS ═══ */}
          {activePage === "settings" && (
            <div className="max-w-lg space-y-5">
              <div className="bg-white rounded-xl p-7 border border-[#D0DCE8]">
                <h3 className="text-base font-bold mb-5">Dues Configuration</h3>
                <div className="mb-4"><label className={labelClass}>Monthly Dues Amount (GHS)</label><input type="number" defaultValue={200} className={inputClass} /></div>
                <div className="mb-4"><label className={labelClass}>Dues Start Month</label><input type="month" defaultValue="2024-01" className={inputClass} /></div>
                <button className={btnPrimary}><Check size={16} /> Save Changes</button>
              </div>
              <div className="bg-white rounded-xl p-7 border border-[#D0DCE8]">
                <h3 className="text-base font-bold mb-5">SMS Provider</h3>
                <div className="mb-4"><label className={labelClass}>Provider</label>
                  <select className={inputClass}><option>Hubtel</option><option>Africa&apos;s Talking</option><option>Twilio</option></select>
                </div>
                <div className="mb-4"><label className={labelClass}>API Key</label><input type="password" className={inputClass} placeholder="Enter API key" /></div>
                <div className="mb-4"><label className={labelClass}>Sender ID</label><input defaultValue="WWA" className={inputClass} /></div>
                <button className={btnPrimary}><Check size={16} /> Save SMS Settings</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ═══ MODALS ═══ */}
      {showModal === "addMember" && (
        <ModalWrapper title="Add New Member" onClose={() => setShowModal(null)}>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div><label className={labelClass}>Full Name *</label><input required value={memberForm.fullName} onChange={(e) => { const v = e.target.value; setMemberForm(p => ({ ...p, fullName: v })); }} className={inputClass} placeholder="e.g. Kwame Asante" /></div>
            <div><label className={labelClass}>Email</label><input value={memberForm.email} onChange={(e) => { const v = e.target.value; setMemberForm(p => ({ ...p, email: v })); }} className={inputClass} placeholder="email@example.com" /></div>
            <div><label className={labelClass}>Phone *</label><input required value={memberForm.phone} onChange={(e) => { const v = e.target.value; setMemberForm(p => ({ ...p, phone: v })); }} className={inputClass} placeholder="+233..." /></div>
            <div><label className={labelClass}>Year Group</label><input value={memberForm.yearGroup} onChange={(e) => { const v = e.target.value; setMemberForm(p => ({ ...p, yearGroup: v })); }} className={inputClass} placeholder="e.g. 2005" /></div>
            <div><label className={labelClass}>Location</label><input value={memberForm.location} onChange={(e) => { const v = e.target.value; setMemberForm(p => ({ ...p, location: v })); }} className={inputClass} placeholder="e.g. Accra" /></div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={formLoading} className={btnPrimary}>{formLoading ? "Adding..." : <><Plus size={16} /> Add Member</>}</button>
              <button type="button" onClick={() => setShowModal(null)} className={btnSecondary}>Cancel</button>
            </div>
          </form>
        </ModalWrapper>
      )}

      {showModal === "recordPayment" && (
        <ModalWrapper title="Record Payment" onClose={() => setShowModal(null)}>
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div><label className={labelClass}>Member *</label>
              <select required value={paymentForm.memberId} onChange={(e) => { const v = e.target.value; setPaymentForm(p => ({ ...p, memberId: v })); }} className={inputClass}>
                <option value="">Select member...</option>
                {members.map((m: any) => <option key={m.id} value={m.id}>{m.fullName}</option>)}
              </select>
            </div>
            <div><label className={labelClass}>Amount (GHS) *</label><input required type="number" value={paymentForm.amount} onChange={(e) => { const v = e.target.value; setPaymentForm(p => ({ ...p, amount: v })); }} className={inputClass} placeholder="200" /></div>
            <div><label className={labelClass}>Payment Date</label><input type="date" value={paymentForm.paymentDate} onChange={(e) => { const v = e.target.value; setPaymentForm(p => ({ ...p, paymentDate: v })); }} className={inputClass} /></div>
            <div><label className={labelClass}>Method</label>
              <select value={paymentForm.method} onChange={(e) => { const v = e.target.value; setPaymentForm(p => ({ ...p, method: v })); }} className={inputClass}>
                <option value="mobile_money">Mobile Money</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            <div><label className={labelClass}>Reference</label><input value={paymentForm.reference} onChange={(e) => { const v = e.target.value; setPaymentForm(p => ({ ...p, reference: v })); }} className={inputClass} placeholder="Optional" /></div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={formLoading} className={btnPrimary}>{formLoading ? "Recording..." : <><Check size={16} /> Record Payment</>}</button>
              <button type="button" onClick={() => setShowModal(null)} className={btnSecondary}>Cancel</button>
            </div>
          </form>
        </ModalWrapper>
      )}

      {showModal === "recordExpense" && (
        <ModalWrapper title="Record Expense" onClose={() => setShowModal(null)}>
          <form onSubmit={handleRecordExpense} className="space-y-4">
            <div><label className={labelClass}>Title *</label><input required value={expenseForm.title} onChange={(e) => { const v = e.target.value; setExpenseForm(p => ({ ...p, title: v })); }} className={inputClass} placeholder="e.g. Medical Support" /></div>
            <div><label className={labelClass}>Amount (GHS) *</label><input required type="number" value={expenseForm.amount} onChange={(e) => { const v = e.target.value; setExpenseForm(p => ({ ...p, amount: v })); }} className={inputClass} /></div>
            <div><label className={labelClass}>Date</label><input type="date" value={expenseForm.date} onChange={(e) => { const v = e.target.value; setExpenseForm(p => ({ ...p, date: v })); }} className={inputClass} /></div>
            <div><label className={labelClass}>Category</label>
              <select value={expenseForm.category} onChange={(e) => { const v = e.target.value; setExpenseForm(p => ({ ...p, category: v })); }} className={inputClass}>
                <option value="medical">Medical</option>
                <option value="bereavement">Bereavement</option>
                <option value="marriage">Marriage</option>
                <option value="naming_ceremony">Naming Ceremony</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div><label className={labelClass}>Description</label><input value={expenseForm.description} onChange={(e) => { const v = e.target.value; setExpenseForm(p => ({ ...p, description: v })); }} className={inputClass} /></div>
            <div><label className={labelClass}>Approved By</label><input value={expenseForm.approvedBy} onChange={(e) => { const v = e.target.value; setExpenseForm(p => ({ ...p, approvedBy: v })); }} className={inputClass} placeholder="e.g. President" /></div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={formLoading} className={btnPrimary}>{formLoading ? "Recording..." : <><Check size={16} /> Record Expense</>}</button>
              <button type="button" onClick={() => setShowModal(null)} className={btnSecondary}>Cancel</button>
            </div>
          </form>
        </ModalWrapper>
      )}
    </div>
  );
}
