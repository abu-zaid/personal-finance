'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Wallet,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { useAppDispatch } from '@/lib/hooks';
import { enterDemoMode } from '@/lib/features/auth/authSlice';
import { PlayCircle } from 'lucide-react';

// Brand Configuration
const BRAND_ICON = "/icon.svg";

// Using standard green-500 (#22C55E) as requested
const ACCENT_BG = "bg-green-500";

const features = [
  {
    icon: Wallet,
    title: 'Smart Budgeting',
    description: 'Set category-based budgets and track your actual spending in real-time.',
  },
  {
    icon: TrendingUp,
    title: 'Deep Analytics',
    description: 'Visualize your spending patterns with beautiful, interactive charts.',
  },
  {
    icon: Zap,
    title: 'Instant Insights',
    description: 'Get AI-powered recommendations to optimize your financial health.',
  },
  {
    icon: ShieldCheck,
    title: 'Private & Secure',
    description: 'Your data is encrypted and never sold. Privacy is our priority.',
  },
];

const stats = [
  { value: '15K+', label: 'Active Users' },
  { value: '$50M+', label: 'Tracked' },
  { value: '4.9', label: 'Rating' },
];

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleDemo = async () => {
    await dispatch(enterDemoMode());
    router.push('/dashboard');
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen selection:bg-green-500/20 font-sans">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="flex h-16 items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 border border-green-500/20 overflow-hidden">
                <img src={BRAND_ICON} alt="Logo" className="h-5 w-5 object-contain" />
              </div>
              <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <ThemeToggle />
              <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                Log in
              </Link>
              <Button asChild size="sm" className={cn("rounded-full font-medium shadow-none hover:opacity-90 transition-opacity", ACCENT_BG, "text-white hover:bg-green-600")}>
                <Link href="/signup">
                  Get Started
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 lg:pt-48 lg:pb-24 overflow-hidden">
        {/* Subtle Green Glow - Ambient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-green-500/20 to-transparent blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 md:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 mb-8"
            >
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </div>
              <span className="text-xs font-medium text-muted-foreground">New: AI-Powered Insights</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8 text-foreground"
            >
              Master your money <br className="hidden sm:block" />
              with <span className={cn("text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-green-600")}>precision.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Experience the evolution of personal finance. Automated tracking,
              intelligent insights, and beautiful analytics in one premium workspace.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button asChild size="lg" className={cn("h-12 px-8 rounded-full text-base font-semibold shadow-xl shadow-green-500/10 hover:shadow-green-500/20 transition-all", ACCENT_BG, "text-white hover:bg-green-600")}>
                <Link href="/signup">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleDemo}
                className="h-12 px-8 rounded-full text-base bg-background/50 backdrop-blur-sm border-border/50 hover:bg-accent/50 gap-2"
              >
                <PlayCircle className="h-4 w-4" />
                Try Live Demo
              </Button>
              {/* <Button asChild size="lg" variant="outline" className="h-12 px-8 rounded-full text-base bg-background/50 backdrop-blur-sm border-border/50 hover:bg-accent/50">
                <Link href="/login">
                  Live Demo
                </Link>
              </Button> */}
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="mt-12 pt-8 border-t border-border/40 flex justify-center gap-8 sm:gap-16"
            >
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Grid - Reduced Spacing */}
      <section className="py-16 sm:py-24 relative">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 md:text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Everything needed to grow your wealth</h2>
            <p className="text-muted-foreground text-lg">Stop relying on spreadsheets. Upgrade to a financial operating system designed for clarity.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative rounded-3xl border border-border/50 bg-card/50 p-6 hover:bg-card/80 transition-colors"
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className={cn("mb-6 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500/10 text-green-500")}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Dashboard Preview - Tighter & More Identical */}
      <section className="py-16 space-y-8 bg-muted/20 border-y border-border/40 overflow-hidden relative">
        <div className="mx-auto max-w-md px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-[3rem] border border-border/30 shadow-2xl bg-card overflow-hidden"
          >
            <div className="absolute inset-0 bg-green-500/5 pointer-events-none mix-blend-overlay" />

            {/* Fake UI Header */}
            <div className="h-16 flex items-center px-8 gap-2 bg-card/50">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
            </div>

            {/* Compact Dashboard Content */}
            <div className="px-8 pb-10 flex flex-col gap-6 bg-card">
              {/* Balance */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Balance</p>
                <div className="flex items-center justify-between">
                  <h3 className="text-4xl font-bold tracking-tight text-foreground">$12,450.00</h3>
                  <div className="flex flex-col items-center justify-center bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 text-[10px] font-bold px-3 py-1.5 rounded-full leading-tight text-center">
                    <span>+12.5%</span>
                    <span className="opacity-80 text-[8px]">THIS MONTH</span>
                  </div>
                </div>
              </div>

              {/* Top Categories - White Card */}
              <div className="p-6 rounded-3xl bg-background border border-border/30 shadow-sm space-y-4">
                <div className="text-sm font-semibold text-foreground">Top Categories</div>
                <div className="space-y-4">
                  {[
                    { l: 'Housing', c: 'bg-green-500', v: '32%' },
                    { l: 'Food', c: 'bg-blue-500', v: '32%' },
                    { l: 'Transport', c: 'bg-orange-500', v: '32%' }
                  ].map((cat, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${cat.c}`} />
                      <div className="text-sm font-medium text-foreground flex-1">{cat.l}</div>
                      <div className="text-sm text-muted-foreground font-medium">{cat.v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Under Budget - White Card */}
              <div className="p-4 rounded-[2rem] bg-background border border-border/30 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">Under Budget</div>
                  <div className="text-xs text-muted-foreground">You saved $240 this week.</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section - Reduced Height */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">Ready to upgrade your wallet?</h2>
          <p className="text-muted-foreground text-lg mb-8">Join thousands of users who have streamlined their finances with FinanceFlow.</p>
          <Button asChild size="lg" className={cn("h-12 px-8 rounded-full text-lg font-semibold shadow-xl shadow-green-500/20 hover:shadow-green-500/30 transition-all", ACCENT_BG, "text-white hover:bg-green-600")}>
            <Link href="/signup">
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="mt-6 text-sm text-muted-foreground">No credit card required. Free forever plan available.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 bg-muted/10">
        <div className="mx-auto max-w-7xl px-6 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-green-500/20 text-green-500 overflow-hidden">
              <img src={BRAND_ICON} alt="Logo" className="h-3.5 w-3.5 object-contain" />
            </div>
            <span className="font-semibold tracking-tight">{APP_NAME}</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Twitter</Link>
          </div>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {APP_NAME}.
          </div>
        </div>
      </footer>
    </div>
  );
}
