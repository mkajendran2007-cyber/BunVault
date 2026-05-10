import Link from "next/link";
import { Shield } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background overflow-x-hidden">
       
       {/* Side Branding / Mobile Top Branding */}
       <div className="bg-secondary/30 lg:flex-1 relative lg:min-h-screen order-1 lg:order-2 flex flex-col justify-center px-6 py-6 lg:px-16 lg:py-24">
          <div className="max-w-lg mx-auto lg:mx-0 flex flex-col items-center lg:items-start text-center lg:text-left w-full">
             {/* BIG PREMIUM LOGO */}
             <div className="mb-4 lg:mb-8 relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-70" />
                <div className="relative bg-white dark:bg-slate-900 p-3 lg:p-4 rounded-2xl lg:rounded-3xl border border-border/50 shadow-[0_10px_30px_rgba(0,0,0,0.1)] lg:shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-center h-16 w-16 lg:h-32 lg:w-32 transform transition hover:scale-105 duration-300">
                   <img src="/logo.png" alt="Bun Vault Logo" className="h-full w-full object-contain drop-shadow-xl" />
                </div>
             </div>
             
             <h2 className="text-2xl lg:text-5xl font-extrabold tracking-tight text-foreground mb-2 lg:mb-6 leading-tight">
                Manage Your <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Wealth</span> Like a Pro
             </h2>
             <p className="text-sm lg:text-xl text-muted-foreground max-w-md lg:max-w-lg font-medium leading-relaxed hidden sm:block">
                Track all your investments, analyze risk, and plan your financial goals in one unified premium dashboard.
             </p>
          </div>
       </div>

       {/* Auth Form Side */}
       <div className="flex flex-col justify-center px-4 py-4 lg:py-12 sm:px-6 lg:flex-none lg:w-[480px] xl:w-[540px] order-2 lg:order-1 bg-background relative">
          <div className="mx-auto w-full max-w-sm lg:max-w-md">
             {/* Small Branding Header for desktop form clarity, hidden on mobile because big logo is stacked above it */}
             <div className="hidden lg:flex items-center gap-2 mb-12 font-black tracking-wider text-xl opacity-80">
                <div className="bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-border/40 shadow-sm flex items-center justify-center h-8 w-8">
                  <img src="/logo.png" alt="Bun Vault Logo" className="h-full w-full object-contain" />
                </div>
                <span>BUN VAULT</span>
             </div>
             
             <div className="glass-panel p-6 sm:p-8 rounded-2xl shadow-xl lg:shadow-none lg:bg-transparent lg:border-0 lg:p-0">
                {children}
             </div>
          </div>
       </div>
       
    </div>
  );
}
