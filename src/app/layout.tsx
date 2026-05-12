import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import InstallPrompt from "@/components/InstallPrompt";
import SmoothSplash from "@/components/SmoothSplash";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BUN VAULT | Premium Finance Tracker",
  description: "Personal wealth management and portfolio analysis.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <SmoothSplash />
          {children}
          <InstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
