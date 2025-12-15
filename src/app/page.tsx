import Link from 'next/link';
import { ArrowRight, Wallet, PieChart, TrendingUp, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';

export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-xl">
                <Wallet className="text-primary-foreground h-5 w-5" />
              </div>
              <span className="text-xl font-bold">{APP_NAME}</span>
            </div>

            <h1 className="mt-10 text-4xl font-bold tracking-tight sm:text-6xl">
              {APP_DESCRIPTION}
            </h1>
            <p className="text-muted-foreground mt-6 text-lg leading-8">
              Track expenses effortlessly, understand your spending patterns at a glance, and stay
              on budget—all within a calm, premium interface that respects your time.
            </p>
            <div className="mt-10 flex items-center gap-x-4">
              <Button asChild size="lg" className="gap-2">
                <Link href="/dashboard">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-muted/30 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-primary text-base font-semibold leading-7">
              Take Control of Your Finances
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to manage your money
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                    <PieChart className="h-5 w-5" />
                  </div>
                  Budget Tracking
                </dt>
                <dd className="text-muted-foreground mt-4 flex flex-auto flex-col text-base leading-7">
                  <p className="flex-auto">
                    Set monthly budgets for each category and track your spending in real-time.
                    Never go overbudget again.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  Smart Insights
                </dt>
                <dd className="text-muted-foreground mt-4 flex flex-auto flex-col text-base leading-7">
                  <p className="flex-auto">
                    Understand your spending patterns with beautiful charts and actionable insights.
                    Make informed financial decisions.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                    <Shield className="h-5 w-5" />
                  </div>
                  Privacy First
                </dt>
                <dd className="text-muted-foreground mt-4 flex flex-auto flex-col text-base leading-7">
                  <p className="flex-auto">
                    Your financial data stays private. We never sell your information or share it
                    with third parties.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <span className="text-muted-foreground text-sm">
              Built with Next.js, Tailwind CSS, and shadcn/ui
            </span>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-muted-foreground text-center text-xs leading-5">
              &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
