import ThemeToggle from "@/components/ThemeToggle";
import PrivacyToggle from "@/components/PrivacyToggle";
import UserAvatar from "@/components/UserAvatar";
import MobileNavBar from "@/components/MobileNavBar";
import MobileDrawer from "@/components/MobileDrawer";
import DesktopSidebarNav from "@/components/DesktopSidebarNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="hidden border-r bg-card/40 backdrop-blur-md md:block w-[240px] lg:w-[280px]">
        <DesktopSidebarNav />
      </aside>

      {/* Main Content */}
      <div className="flex flex-col w-full flex-1">
        <header className="flex h-14 items-center gap-4 border-b bg-card/40 backdrop-blur-md px-4 lg:h-[60px] lg:px-6 z-10 sticky top-0">
          <MobileDrawer />
          <div className="w-full flex-1">
            <h1 className="font-semibold text-lg">Dashboard Overview</h1>
          </div>
          <div className="flex items-center gap-4">
             <PrivacyToggle />
             <ThemeToggle />
             <UserAvatar />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6 bg-transparent relative pb-20 md:pb-6">
          {children}
        </main>
        <MobileNavBar />
      </div>
    </div>
  );
}
