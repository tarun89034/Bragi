import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Bragi — AI music discovery and streaming",
  description:
    "Discover, stream, and share music powered by AI recommendations—from emerging creators to your favorite artists.",
  icons: {
    icon: [{ url: "/favicon.ico", type: "image/x-icon" }],
  },
  openGraph: {
    title: "Bragi — AI music discovery and streaming",
    description:
      "Discover, stream, and share music powered by AI recommendations—from emerging creators to your favorite artists.",
    type: "website",
    url: "https://example.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bragi — AI music discovery and streaming",
    description:
      "Discover, stream, and share music powered by AI recommendations—from emerging creators to your favorite artists.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100`}
      >
        {children}
      </body>
    </html>
  );
}
