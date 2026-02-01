import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Real Estate POC",
  description: "End-to-End POC with Next.js, Flutter, Node, and Zitadel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
