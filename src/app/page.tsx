"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BarChart3, Shield, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleNavigate = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setIsTransitioning(true);
    
    // Accelerated timing for faster feel
    setTimeout(() => {
      router.push(path);
    }, 600); 
  };

  return (
    <div className="relative min-h-screen bg-background flex flex-col">
      
      {/* FAST PREMIUM WIPE LAYER */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div 
            initial={{ clipPath: "circle(0% at 50% 50%)" }}
            animate={{ clipPath: "circle(150% at 50% 50%)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
            className="fixed inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 z-[9999] flex items-center justify-center flex-col gap-6"
          >
             <motion.div
               initial={{ opacity: 0, scale: 0.6, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               transition={{ delay: 0.2, duration: 0.4 }}
               className="bg-white/15 backdrop-blur-lg border border-white/20 p-6 rounded-3xl shadow-2xl"
             >
               <img src="/logo.png" className="h-20 w-20 object-contain brightness-0 invert drop-shadow-2xl" alt="Vault Logo" />
             </motion.div>
             
             <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="text-center"
             >
               <h2 className="text-white font-extrabold text-3xl tracking-widest uppercase drop-shadow-md">BUN VAULT</h2>
               <p className="text-blue-100 text-xs tracking-widest uppercase font-mono opacity-80 mt-1 animate-pulse">Opening Secure Portal</p>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="px-4 lg:px-6 h-16 flex items-center border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <Link className="flex items-center justify-center" href="#">
          <div className="bg-white p-1 rounded-md border border-border/40 shadow-sm flex items-center justify-center h-8 w-8 mr-2">
            <img src="/logo.png" alt="Bun Vault Logo" className="h-full w-full object-contain" />
          </div>
          <span className="text-lg font-bold tracking-tight">BUN VAULT</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <a 
            className="text-sm font-medium hover:text-primary transition-colors flex items-center cursor-pointer" 
            onClick={(e) => handleNavigate(e, "/login")}
          >
            Login
          </a>
          <a 
            className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors cursor-pointer shadow-sm active:scale-95"
            onClick={(e) => handleNavigate(e, "/signup")}
          >
            Get Started
          </a>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center">
        <section className="w-full py-4 md:py-8 lg:py-12">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-2 text-center">
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="flex justify-center mb-4"
              >
                <div className="relative group">
                  <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 opacity-20 blur-xl group-hover:opacity-35 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-xl transition-transform duration-500 hover:scale-[1.05]">
                    <img src="/logo.png" alt="Bun Vault Logo" className="h-24 w-24 object-contain" />
                  </div>
                </div>
              </motion.div>

              <div className="space-y-1">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none"
                >
                  Your Wealth, <span className="text-primary">Perfectly Tracked</span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mx-auto max-w-[600px] text-muted-foreground md:text-lg"
                >
                  BUN VAULT provides premium, real-time insights into your portfolio. Managed in one elegant dashboard.
                </motion.p>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="pt-3"
              >
                <button
                  onClick={(e) => handleNavigate(e, "/login")}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-10 text-base font-semibold text-white shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border border-blue-400/20 cursor-pointer"
                >
                  Login to Bun Vault
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </motion.div>
            </div>
          </div>
        </section>
        
        <section className="w-full py-16 md:py-24 bg-secondary/20 border-t">
          <div className="container px-4 md:px-6">
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-white dark:bg-slate-800 shadow-md rounded-3xl">
                  <Zap className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold">Live Price Sync</h3>
                <p className="text-muted-foreground">Automatic syncing of live market prices for all your assets, keeping your portfolio value perfectly accurate.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-white dark:bg-slate-800 shadow-md rounded-3xl">
                  <BarChart3 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold">Advanced Analytics</h3>
                <p className="text-muted-foreground">Beautiful, interactive charts and insights to help you understand your wealth growth and asset allocation.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-white dark:bg-slate-800 shadow-md rounded-3xl">
                  <Shield className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold">AI Portfolio Assistant</h3>
                <p className="text-muted-foreground">Smart insights that detect overexposure, analyze risk, and suggest optimizations for a healthier portfolio.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-border/40">
        <p className="text-xs text-muted-foreground">© 2026 BUN VAULT. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
