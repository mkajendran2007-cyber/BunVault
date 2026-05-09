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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <circle cx="12" cy="12" r="3" />
                <path d="M12 15v3" />
                <path d="M12 6v3" />
                <path d="M6.5 9.5L9 11" />
                <path d="M17.5 14.5L15 13" />
              </svg>
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
