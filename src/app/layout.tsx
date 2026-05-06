import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Weslayan Welfare Management System",
  description: "Manage welfare contributions, dues, payments, and member records for the Weslayan Welfare Association.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
