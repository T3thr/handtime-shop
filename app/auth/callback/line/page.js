// app/auth/callback/line/page.js
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { toast } from "react-toastify";

export default function LineCallback() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      // If user is already authenticated, redirect to homepage immediately
      if (status === "authenticated") {
        router.replace("/");
        return;
      }

      // If user is not authenticated and not in the process of logging in, redirect to home
      if (status === "unauthenticated" && !isProcessing && !document.referrer.includes("line.me")) {
        router.replace("/");
        return;
      }

      setIsProcessing(true);

      try {
        const { default: liff } = await import("@line/liff");
        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        const profile = await liff.getProfile();
        const res = await signIn("line", {
          redirect: false,
          userId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
        });

        if (res?.ok) {
          toast.success("LINE login successful!");
          router.replace("/"); // Redirect to homepage after successful login
        } else {
          throw new Error(res?.error || "Authentication failed");
        }
      } catch (error) {
        console.error("LINE callback error:", error);
        toast.error(error.message || "Failed to complete LINE login");
        router.replace("/"); // Redirect to sign-in page on failure
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [router, status, isProcessing]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg">Processing LINE login...</p>
        <div className="mt-4 animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    </div>
  );
}