import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import PrivacyToggle from "@/components/PrivacyToggle";
import { 
  BarChart3, 
  Briefcase, 
  LayoutDashboard, 
  LineChart, 
  Settings, 
  Shield, 
  Target, 
  Wallet,
  Eye
} from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="hidden border-r bg-card/40 backdrop-blur-md md:block w-[240px] lg:w-[280px]">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-black tracking-wider text-lg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <circle cx="12" cy="12" r="3" />
                <path d="M12 15v3" />
                <path d="M12 6v3" />
                <path d="M6.5 9.5L9 11" />
                <path d="M17.5 14.5L15 13" />
              </svg>
              <span>BUN VAULT</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/holdings"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Wallet className="h-4 w-4" />
                Holdings
              </Link>
              <Link
                href="/watchlist"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Eye className="h-4 w-4" />
                Watchlist
              </Link>

              <Link
                href="/ai-assistant"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <LineChart className="h-4 w-4" />
                AI Assistant
              </Link>
              <Link
                href="/sip-planner"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Briefcase className="h-4 w-4" />
                SIP Planner
              </Link>
              <Link
                href="/goals"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Target className="h-4 w-4" />
                Goals
              </Link>
            </nav>
          </div>
          <div className="mt-auto p-4 border-t">
            <Link
                href="/settings"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col w-full flex-1">
        <header className="flex h-14 items-center gap-4 border-b bg-card/40 backdrop-blur-md px-4 lg:h-[60px] lg:px-6 z-10 sticky top-0">
          <div className="w-full flex-1">
            <h1 className="font-semibold text-lg">Dashboard Overview</h1>
          </div>
          <div className="flex items-center gap-4">
             <PrivacyToggle />
             <ThemeToggle />
             <UserAvatar />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6 bg-transparent relative">
          {children}
        </main>
      </div>
    </div>
  );
}
