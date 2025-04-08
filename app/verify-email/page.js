'use client'
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, XCircle, Loader2, Mail, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verificationState, setVerificationState] = useState('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setVerificationState('error');
        setErrorMessage('Verification token is missing or invalid');
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`, {
          method: 'GET',
        });

        if (response.ok) {
          setVerificationState('success');
          startCountdown();
        } else {
          const data = await response.json();
          setVerificationState('error');
          setErrorMessage(data.message || 'Verification failed');
        }
      } catch (error) {
        setVerificationState('error');
        setErrorMessage('An error occurred during verification');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/signin');
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: searchParams.get('email') }),
      });

      if (response.ok) {
        setErrorMessage('New verification email sent. Please check your inbox.');
      } else {
        const data = await response.json();
        setErrorMessage(data.message || 'Failed to resend verification email');
      }
    } catch (error) {
      setErrorMessage('Failed to resend verification email');
    }
    setIsResending(false);
  };

  const renderContent = () => {
    const states = {
      verifying: (
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Verifying Your Email
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Please wait while we confirm your email address...
            </p>
          </div>
        </div>
      ),
      success: (
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Email Verified Successfully!
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Your email has been verified. You can now sign in to your account.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting in {countdown} seconds...
            </p>
          </div>
          <Link
            href="/signin"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Sign In Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ),
      error: (
        <div className="flex flex-col items-center space-y-6">
          <XCircle className="h-16 w-16 text-red-500" />
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Verification Failed
            </h2>
            <p className="text-red-500">{errorMessage}</p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isResending ? (
                <RefreshCcw className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </button>
            <Link
              href="/signin"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      ),
    };

    return states[verificationState];
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="relative">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-gray-800/80 dark:to-gray-700/80 rounded-2xl transform -rotate-2" />
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-gray-700/80 dark:to-gray-600/80 rounded-2xl transform rotate-2" />
          </div>
          
          <div className="relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="p-4 bg-white dark:bg-gray-700 rounded-full shadow-xl">
                <Mail className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="mt-8">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
