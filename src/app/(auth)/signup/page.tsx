'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wallet, Loader2, ArrowLeft, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTransition } from '@/components/animations';
import { useAuth } from '@/context/auth-context';
import { useHaptics } from '@/hooks/use-haptics';
import { APP_NAME } from '@/lib/constants';

// Google Icon component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

const benefits = [
  'Track expenses effortlessly',
  'Smart budget insights',
  'Secure & private',
];

export default function SignUpPage() {
  const { signInWithGoogle } = useAuth();
  const haptics = useHaptics();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    haptics.medium();
    setIsLoading(true);
    setError(null);

    const result = await signInWithGoogle();

    if (!result.success) {
      haptics.error();
      setError(result.error || 'Failed to sign up');
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4">
        {/* Back to home */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute left-4 top-4 sm:left-8 sm:top-8"
        >
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
        </motion.div>

        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 flex flex-col items-center"
        >
          <div 
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
            style={{
              background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)',
              boxShadow: '0 8px 32px rgba(152, 239, 90, 0.3)',
            }}
          >
            <Wallet className="text-[#101010] h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{APP_NAME}</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-sm"
        >
          <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-xl">
            <CardHeader className="space-y-1 text-center pb-4">
              <CardTitle className="text-xl font-semibold">Create your account</CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Start your financial journey today
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Benefits */}
              <div className="space-y-2 pb-2">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    {benefit}
                  </motion.div>
                ))}
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-destructive/10 text-destructive rounded-xl p-3 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}

              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full h-12 gap-3 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm font-medium"
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <GoogleIcon className="h-5 w-5" />
                )}
                Sign up with Google
              </Button>

              <p className="text-center text-xs text-muted-foreground pt-2">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Trust badges */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex items-center gap-4 text-muted-foreground"
        >
          <div className="flex items-center gap-1.5 text-xs">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            Free forever
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            No credit card
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
