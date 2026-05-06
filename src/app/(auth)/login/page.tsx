"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Shield, User } from "lucide-react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams.get("role") || "member";
  const isAdmin = role === "admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your credentials");
      return;
    }
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email/phone or password");
      setLoading(false);
    } else {
      // Redirect based on role after login
      router.push(isAdmin ? "/admin" : "/member");
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${isAdmin ? "bg-gradient-to-br from-[#0A1B3D] to-[#1B4B8A]" : "bg-gradient-to-br from-[#EFF3F8] to-[#E8F0FA]"}`}>
      <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className={`w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center ${isAdmin ? "bg-[#1B4B8A]" : "bg-[#E8F0FA]"}`}>
            {isAdmin ? <Shield size={28} className="text-white" /> : <User size={28} className="text-[#1B4B8A]" />}
          </div>
          <h2 className="font-display text-2xl font-bold mb-1">
            {isAdmin ? "Admin Portal" : "Member Portal"}
          </h2>
          <p className="text-sm text-[#6B7F99]">
            {isAdmin ? "Access the administration dashboard" : "View your contributions and welfare status"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#6B7F99] mb-1.5">Email or Phone</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isAdmin ? "admin@weslayanwelfare.org" : "Enter email or phone"}
              className="w-full px-4 py-2.5 rounded-lg border border-[#D0DCE8] text-sm outline-none focus:border-[#1B4B8A] focus:ring-1 focus:ring-[#1B4B8A]/20"
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-[#6B7F99] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2.5 rounded-lg border border-[#D0DCE8] text-sm outline-none focus:border-[#1B4B8A] focus:ring-1 focus:ring-[#1B4B8A]/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#1B4B8A] text-white font-semibold text-sm hover:bg-[#15407A] disabled:opacity-60 transition"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-center mt-5">
          <Link href="/" className="text-[#1B4B8A] text-sm font-medium no-underline hover:underline">
            &larr; Back to website
          </Link>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-[#EFF3F8] rounded-lg text-xs text-[#6B7F99]">
          <p className="font-semibold text-[#1A2440] mb-2">Demo credentials:</p>
          {isAdmin ? (
            <>
              <p>Admin: admin@weslayanwelfare.org / password123</p>
              <p>Treasurer: treasurer@weslayanwelfare.org / password123</p>
            </>
          ) : (
            <p>Any member: kwame@email.com / password123</p>
          )}
        </div>
      </div>
    </div>
  );
}
