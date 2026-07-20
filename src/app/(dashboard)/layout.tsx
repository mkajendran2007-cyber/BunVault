import ThemeToggle from "@/components/ThemeToggle";
import PrivacyToggle from "@/components/PrivacyToggle";
import UserAvatar from "@/components/UserAvatar";
import MobileNavBar from "@/components/MobileNavBar";
import AppBrandLogo from "@/components/AppBrandLogo";
import DesktopSidebarNav from "@/components/DesktopSidebarNav";
import HeaderUserName from "@/components/HeaderUserName";
import NotificationCenter from "@/components/NotificationCenter";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Fixed Sidebar — never scrolls */}
      <aside className="hidden border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0D1117] backdrop-blur-xl md:flex md:flex-col w-[240px] lg:w-[280px] h-screen sticky top-0 shrink-0 overflow-y-auto z-40">
        <DesktopSidebarNav />
      </aside>

      {/* Right column */}
      <div className="flex flex-col flex-1 min-w-0 h-screen">
        {/* Premium blurred header — always on top */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0D1117]/90 backdrop-blur-xl px-4 lg:h-[60px] lg:px-6 z-50 shadow-sm sticky top-0">
          <div className="md:hidden shrink-0">
            <AppBrandLogo size="header" />
          </div>
          <div className="hidden md:block w-full flex-1">
            <HeaderUserName />
          </div>
          <div className="flex flex-1 md:flex-none items-center justify-end gap-3 md:gap-4">
            <NotificationCenter />
            <PrivacyToggle />
            <ThemeToggle />
            <UserAvatar />
          </div>
        </header>

        {/* Scrollable content — modals rendered via portal escape this */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-transparent pb-24 md:pb-6">
          {children}
        </main>

        <MobileNavBar />
      </div>
    </div>
  );
}
