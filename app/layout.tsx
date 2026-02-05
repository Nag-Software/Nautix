import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ConversationProvider } from "@/contexts/conversation-context";
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Nautix - Din digitale båtassistent",
    template: "Nautix app",
  },
  description:
    "Nautix hjelper deg med vedlikehold, dokumenter og oversikt – slik at du kan bruke mer tid på sjøen. Få påminnelser, AI-hjelp og full kontroll på båten din.",
  keywords: [
    "båt",
    "vedlikehold",
    "båtvedlikehold",
    "båtlogg",
    "dokumenter",
    "AI-assistent",
    "påminnelser",
    "utstyr",
    "maritim",
    "båteier",
  ],
  authors: [{ name: "Nautix" }],
  creator: "Nautix",
  publisher: "Nautix",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/favicon.ico", sizes: "180x180" }],
    shortcut: [{ url: "/favicon.ico" }],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConversationProvider>
            {children}
          </ConversationProvider>
          <Toaster richColors position="top-right" duration={15000} />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
