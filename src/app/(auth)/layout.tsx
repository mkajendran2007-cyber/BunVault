import Link from "next/link";
import { Shield } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
       <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
             <div className="flex items-center gap-2 mb-8 font-black tracking-wider text-2xl">
              <div className="bg-white p-1.5 rounded-lg border border-border/40 shadow-sm flex items-center justify-center h-10 w-10">
                <img src="/logo.png" alt="Bun Vault Logo" className="h-full w-full object-contain" />
              </div>
              <span>BUN VAULT</span>
             </div>
             {children}
          </div>
       </div>
       <div className="hidden lg:block relative w-0 flex-1 bg-secondary/30">
          <div className="absolute inset-0 h-full w-full object-cover p-12 flex flex-col justify-center">
             <h2 className="text-4xl font-bold text-foreground mb-6">Manage Your Wealth Like a Pro</h2>
             <p className="text-xl text-muted-foreground max-w-lg">Track all your investments, analyze risk, and plan your financial goals in one unified premium dashboard.</p>
          </div>
       </div>
    </div>
  );
}
