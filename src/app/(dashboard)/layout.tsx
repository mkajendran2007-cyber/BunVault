import ThemeToggle from "@/components/ThemeToggle";
import PrivacyToggle from "@/components/PrivacyToggle";
import UserAvatar from "@/components/UserAvatar";
import MobileNavBar from "@/components/MobileNavBar";
import AppBrandLogo from "@/components/AppBrandLogo";
import DesktopSidebarNav from "@/components/DesktopSidebarNav";
import HeaderUserName from "@/components/HeaderUserName";
import NotificationCenter from "@/components/NotificationCenter";
import { LiveMarketTicker } from "@/components/LiveMarketTicker";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-screen w-full bg-background overflow-hidden selection:bg-amber-500/30">
      {/* Apple / Revolut Ambient Glow Spheres (Subtle luminous depth beneath glass) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 opacity-60 dark:opacity-80">
        <div className="absolute -top-[20%] left-[10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-amber-500/15 via-amber-400/5 to-transparent blur-[120px]" />
        <div className="absolute top-[30%] -right-[10%] h-[550px] w-[550px] rounded-full bg-gradient-to-bl from-emerald-500/12 via-teal-400/5 to-transparent blur-[140px]" />
        <div className="absolute -bottom-[20%] left-[30%] h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent blur-[150px]" />
      </div>

      {/* Fixed Sidebar — Apple frosted glass */}
      <aside className="relative hidden border-r border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#070A11]/75 backdrop-blur-3xl md:flex md:flex-col w-[240px] lg:w-[280px] h-screen sticky top-0 shrink-0 overflow-y-auto z-40 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_30px_rgba(0,0,0,0.4)]">
        <DesktopSidebarNav />
      </aside>

      {/* Right column */}
      <div className="relative flex flex-col flex-1 min-w-0 h-screen z-10">
        {/* Premium Apple blurred header — always on top */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/75 dark:bg-[#070A11]/80 backdrop-blur-2xl px-4 lg:h-[62px] lg:px-6 z-50 shadow-xs sticky top-0">
          <div className="md:hidden shrink-0">
            <AppBrandLogo size="header" />
          </div>
          <div className="hidden md:block w-full flex-1">
            <HeaderUserName />
          </div>
          <div className="flex flex-1 md:flex-none items-center justify-end gap-2.5 md:gap-3.5">
            <NotificationCenter />
            <PrivacyToggle />
            <ThemeToggle />
            <UserAvatar />
          </div>
        </header>

        {/* Live Market Ticker Banner */}
        <LiveMarketTicker />

        {/* Scrollable content with smooth padding */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-transparent pb-32 md:pb-8">
          {children}
        </main>

        <MobileNavBar />
      </div>
    </div>
  );
}

