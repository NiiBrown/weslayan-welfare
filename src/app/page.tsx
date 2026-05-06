"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu, X, ChevronDown, ChevronUp, ArrowRight, Phone, Mail, MapPin,
  CreditCard, Calendar, Receipt, MessageSquare, Eye, BarChart3,
} from "lucide-react";

const features = [
  { icon: CreditCard, title: "Contribution Tracking", desc: "Every payment is recorded and visible to you. No guesswork, no lost records." },
  { icon: Calendar, title: "Dues Management", desc: "Clear monthly dues with automatic tracking of what's paid and what's outstanding." },
  { icon: Receipt, title: "Expense Records", desc: "See exactly how welfare funds are spent, with receipts and approvals on record." },
  { icon: MessageSquare, title: "SMS Reminders", desc: "Friendly monthly reminders so nobody falls behind unintentionally." },
  { icon: Eye, title: "Financial Transparency", desc: "Open books. Any member can review how funds are collected and distributed." },
  { icon: BarChart3, title: "Executive Reports", desc: "Detailed reports for leadership to make informed decisions about welfare spending." },
];

const steps = [
  { num: "01", title: "Register Members", desc: "Executives add members with their details and year group" },
  { num: "02", title: "Set Dues", desc: "Monthly dues amount is configured and assigned to all active members" },
  { num: "03", title: "Record Payments", desc: "Payments are logged as they come in, with method and reference" },
  { num: "04", title: "Track Expenses", desc: "Every welfare expense is recorded with category and approval" },
  { num: "05", title: "Send Reminders", desc: "Automated SMS nudges go out to members with outstanding balances" },
  { num: "06", title: "Generate Reports", desc: "Pull statements, summaries, and financial reports anytime" },
];

const faqs = [
  { q: "Who can join the association?", a: "Any former student of the school who has completed their studies is eligible to register as a member. We welcome all year groups." },
  { q: "How much are the monthly dues?", a: "Monthly welfare dues are currently set at GHS 200. This amount is reviewed periodically by the executive committee with input from the general membership." },
  { q: "How do I make payments?", a: "You can pay via Mobile Money, bank transfer, or cash to the treasurer. All payments are recorded and tracked in the system. Online payment integration is coming soon." },
  { q: "What welfare benefits do I get?", a: "Benefits include medical support, bereavement assistance, marriage support, naming ceremony donations, and emergency welfare grants. You must be in good standing to access benefits." },
  { q: "Can I see how funds are being used?", a: "Yes. Every member has access to their personal statement and the association publishes regular financial reports. Transparency is core to how we operate." },
];

export default function HomePage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#FAFBFD] text-[#1A2440]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#FAFBFD]/90 backdrop-blur-md border-b border-[#D0DCE8]">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-9 h-9 rounded-lg bg-[#1B4B8A] flex items-center justify-center text-white font-extrabold text-sm">
              WW
            </div>
            <span className="font-bold text-[#1B4B8A] text-lg hidden sm:inline">Weslayan Welfare</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {["Home", "About", "Benefits", "Dues", "News", "Contact"].map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="px-3 py-2 text-sm font-medium text-[#3D4E66] hover:text-[#1B4B8A] rounded-md no-underline">
                {l}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login?role=member" className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg border border-[#D0DCE8] text-[#1A2440] hover:bg-[#EFF3F8] no-underline">
              Member Login
            </Link>
            <Link href="/login?role=admin" className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-[#1B4B8A] text-white hover:bg-[#15407A] no-underline">
              Admin Login
            </Link>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-1">
              {mobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <div className="md:hidden border-t border-[#D0DCE8] bg-white px-6 py-4 space-y-2">
            {["Home", "About", "Benefits", "Dues", "News", "Contact"].map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMobileMenu(false)}
                className="block px-3 py-2 text-sm font-medium text-[#3D4E66] rounded-md no-underline">
                {l}
              </a>
            ))}
            <Link href="/login?role=member" className="block px-3 py-2 text-sm font-semibold text-[#1B4B8A] no-underline">
              Member Login
            </Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="home" className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1B4B8A 0%, #0D2E5C 100%)" }}>
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-white/5" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[250px] h-[250px] rounded-full bg-white/[0.03]" />
        <div className="relative max-w-3xl mx-auto text-center text-white px-6 py-20 md:py-28">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-sm font-medium mb-6 tracking-wide">
            Weslayan Welfare Association
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-[52px] font-extrabold leading-[1.12] mb-5">
            Manage Welfare Contributions with Clarity and Trust
          </h1>
          <p className="text-lg leading-relaxed opacity-85 max-w-xl mx-auto mb-9">
            Track contributions, settle dues, access welfare support, and stay connected with your association. Everything in one place, completely transparent.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/login?role=member"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-[#1B4B8A] font-bold text-base hover:bg-gray-50 no-underline transition">
              Member Login <ArrowRight size={18} />
            </Link>
            <a href="#contact"
              className="inline-flex items-center px-7 py-3.5 rounded-xl border border-white/30 text-white font-semibold text-base hover:bg-white/10 no-underline transition">
              Contact Executives
            </a>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20 px-6" style={{ background: "var(--gold-50, #FDF6E8)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold tracking-[0.08em] uppercase text-[#C8963E] mb-3">The Problem</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-5">
            WhatsApp messages and notebooks aren&apos;t built for this
          </h2>
          <p className="text-base leading-7 text-[#3D4E66]">
            Too many associations still track welfare dues through scattered WhatsApp threads, handwritten notebooks, and personal spreadsheets. Payments get lost. Members don&apos;t know where they stand. Nobody trusts the numbers. It doesn&apos;t have to be this way.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="benefits" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.08em] uppercase text-[#1B4B8A] mb-3">Features</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Everything your association needs</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-7 border border-[#D0DCE8] hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#E8F0FA] flex items-center justify-center mb-4">
                  <f.icon size={24} className="text-[#1B4B8A]" />
                </div>
                <h3 className="text-[17px] font-bold mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed text-[#3D4E66] m-0">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-[#EFF3F8]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.08em] uppercase text-[#1B4B8A] mb-3">How It Works</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Simple from start to finish</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-[#D0DCE8]">
                <div className="font-display text-3xl font-extrabold text-[#E8F0FA] mb-2">{s.num}</div>
                <h3 className="text-base font-bold mb-1.5">{s.title}</h3>
                <p className="text-sm leading-snug text-[#6B7F99] m-0">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.08em] uppercase text-[#1B4B8A] mb-3">FAQ</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Common questions</h2>
          </div>
          {faqs.map((f, i) => (
            <div key={i} className="border-b border-[#D0DCE8] py-4">
              <button
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                className="w-full flex justify-between items-center text-left bg-transparent border-none cursor-pointer p-0"
              >
                <span className="text-base font-semibold pr-4">{f.q}</span>
                {activeFaq === i ? <ChevronUp size={20} className="text-[#1B4B8A] shrink-0" /> : <ChevronDown size={20} className="text-[#6B7F99] shrink-0" />}
              </button>
              {activeFaq === i && (
                <p className="text-sm leading-7 text-[#3D4E66] mt-3 pr-10">{f.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-white text-center" style={{ background: "linear-gradient(135deg, #1B4B8A 0%, #0D2E5C 100%)" }}>
        <div className="max-w-xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-base opacity-85 mb-8 leading-relaxed">
            Contact the executive committee to get registered, or log in if you&apos;re already a member.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/login?role=member" className="px-7 py-3.5 rounded-xl bg-white text-[#1B4B8A] font-bold no-underline hover:bg-gray-50 transition">
              Member Login
            </Link>
            <Link href="/login?role=admin" className="px-7 py-3.5 rounded-xl border border-white/30 text-white font-semibold no-underline hover:bg-white/10 transition">
              Admin Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-[#0A1B3D] text-white/70 px-6 pt-12 pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg bg-[#1B4B8A] flex items-center justify-center text-white font-extrabold text-sm">WW</div>
                <span className="font-bold text-white">Weslayan Welfare</span>
              </div>
              <p className="text-sm leading-relaxed">
                Weslayan Welfare Association. Building a strong community through mutual support and accountability.
              </p>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Quick Links</h4>
              <div className="flex flex-col gap-2">
                {["About", "Benefits", "Dues", "News", "Contact"].map((l) => (
                  <a key={l} href="#" className="text-white/60 text-sm no-underline hover:text-white/80">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Contact</h4>
              <div className="flex flex-col gap-2.5 text-sm">
                <div className="flex items-center gap-2"><Phone size={14} /> +233 24 412 3456</div>
                <div className="flex items-center gap-2"><Mail size={14} /> info@weslayanwelfare.org</div>
                <div className="flex items-center gap-2"><MapPin size={14} /> Accra, Ghana</div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-5 text-center text-xs text-white/40">
            &copy; {new Date().getFullYear()} Weslayan Welfare Association. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
