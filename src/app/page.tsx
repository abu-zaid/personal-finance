'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Wallet,
  PieChart,
  TrendingUp,
  Shield,
  Sparkles,
  CheckCircle2,
  BarChart3,
  Target,
  Zap,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';
import { useAuth } from '@/context/auth-context';

const features = [
  {
    icon: PieChart,
    title: 'Budget Tracking',
    description: 'Set monthly budgets for each category and track your spending in real-time.',
    color: '#98EF5A',
  },
  {
    icon: TrendingUp,
    title: 'Smart Insights',
    description: 'Understand your spending patterns with beautiful charts and actionable insights.',
    color: '#60A5FA',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your financial data stays private. We never sell or share your information.',
    color: '#F472B6',
  },
];

const benefits = [
  'Track all your expenses in one place',
  'Set and monitor monthly budgets',
  'Visualize spending patterns',
  'Get smart financial insights',
  'Works on all devices',
  'Secure Google sign-in',
];

const stats = [
  { value: '10K+', label: 'Active Users' },
  { value: '$2M+', label: 'Tracked Monthly' },
  { value: '4.9', label: 'App Rating' },
];

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2.5"
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{
                  background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)',
                }}
              >
                <Wallet className="text-[#101010] h-4.5 w-4.5" />
              </div>
              <span className="text-lg font-bold">{APP_NAME}</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="gap-1.5"
                style={{
                  background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)',
                  color: '#101010',
                }}
              >
                <Link href="/signup">
                  Get Started
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{ background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)' }}
          />
          <div
            className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-10"
            style={{ background: 'linear-gradient(145deg, #60A5FA 0%, #3B82F6 100%)' }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Now with AI insights</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
            >
              {APP_DESCRIPTION.split(' ').map((word, i) => (
                <span key={i} className={i === 3 || i === 4 ? 'text-primary' : ''}>
                  {word}{' '}
                </span>
              ))}
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Track expenses effortlessly, understand your spending patterns at a glance,
              and stay on budget—all within a calm, premium interface.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button asChild size="lg" className="gap-2 h-12 px-8 text-base font-medium shadow-lg"
                style={{
                  background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)',
                  color: '#101010',
                  boxShadow: '0 8px 32px rgba(152, 239, 90, 0.3)',
                }}
              >
                <Link href="/signup">
                  Start Free Today
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2 h-12 px-8 text-base">
                <Link href="/login">
                  Sign In
                </Link>
              </Button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-8"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* App Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-16 sm:mt-20 relative"
          >
            <div className="relative mx-auto max-w-4xl">
              {/* Glow effect */}
              <div
                className="absolute inset-0 rounded-3xl blur-3xl opacity-30"
                style={{ background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)' }}
              />

              {/* Mock app interface */}
              <div className="relative bg-card border border-border/50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
                {/* Header bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 bg-background rounded-full text-xs text-muted-foreground">
                      app.financeflow.io
                    </div>
                  </div>
                </div>

                {/* Content preview */}
                <div className="p-6 sm:p-8 space-y-4">
                  {/* Balance card mock */}
                  <div
                    className="p-5 rounded-2xl"
                    style={{
                      background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)',
                    }}
                  >
                    <p className="text-[#101010]/60 text-xs font-medium uppercase">Available Balance</p>
                    <p className="text-[#101010] text-3xl font-bold mt-1">$2,847.50</p>
                    <div className="flex gap-4 mt-4">
                      <div className="flex-1 bg-white/20 rounded-xl p-3">
                        <p className="text-[#101010]/60 text-[10px] uppercase">Budget</p>
                        <p className="text-[#101010] font-bold">$4,000</p>
                      </div>
                      <div className="flex-1 bg-white/20 rounded-xl p-3">
                        <p className="text-[#101010]/60 text-[10px] uppercase">Spent</p>
                        <p className="text-[#101010] font-bold">$1,152</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick stats mock */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: BarChart3, label: 'Analytics', color: '#60A5FA' },
                      { icon: Target, label: 'Goals', color: '#F472B6' },
                      { icon: Zap, label: 'Insights', color: '#FBBF24' },
                    ].map((item, i) => (
                      <div key={i} className="bg-muted/30 rounded-xl p-4 text-center">
                        <div
                          className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2"
                          style={{ background: `${item.color}20` }}
                        >
                          <item.icon className="h-5 w-5" style={{ color: item.color }} />
                        </div>
                        <p className="text-xs font-medium">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-32 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold">
              Everything you need to{' '}
              <span className="text-primary">manage your money</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features designed to help you take control of your finances.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div className="bg-card border border-border/50 rounded-2xl p-6 h-full transition-all duration-300 hover:shadow-xl hover:border-primary/20">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${feature.color}20` }}
                  >
                    <feature.icon className="h-6 w-6" style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Why choose{' '}
                <span className="text-primary">{APP_NAME}</span>?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Built for people who want a simple, beautiful way to manage their personal finances without the complexity.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Decorative cards */}
              <div className="relative">
                <div
                  className="absolute -top-4 -left-4 w-full h-full rounded-2xl"
                  style={{ background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)', opacity: 0.1 }}
                />
                <div className="relative bg-card border border-border/50 rounded-2xl p-8 shadow-xl">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Wallet className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">This Month</p>
                        <p className="text-2xl font-bold">$1,247.50</p>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full w-[62%]"
                        style={{ background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)' }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You&apos;ve spent 62% of your monthly budget. Keep going! 🎉
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl p-8 sm:p-12 lg:p-16 text-center"
            style={{
              background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)',
            }}
          >
            {/* Decorations */}
            <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#101010] mb-4">
                Ready to take control?
              </h2>
              <p className="text-lg text-[#101010]/70 max-w-2xl mx-auto mb-8">
                Join thousands of users who are already managing their finances smarter.
                Get started in seconds with Google sign-in.
              </p>
              <Button asChild size="lg" className="h-12 px-8 text-base font-medium bg-[#101010] text-white hover:bg-[#202020]">
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)',
                }}
              >
                <Wallet className="text-[#101010] h-4 w-4" />
              </div>
              <span className="font-semibold">{APP_NAME}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
