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
      if (status === "authenticated") {
        console.log("User already authenticated, redirecting to /");
        router.replace("/");
        return;
      }

      if (status === "unauthenticated" && !isProcessing) {
        setIsProcessing(true);

        try {
          const { default: liff } = await import("@line/liff");
          console.log("Initializing LIFF in callback with ID:", process.env.NEXT_PUBLIC_LIFF_ID);
          await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID });

          if (!liff.isLoggedIn()) {
            const redirectUri = `${window.location.origin}/auth/callback/line`;
            console.log("User not logged in, redirecting to LINE login with URI:", redirectUri);
            liff.login({ redirectUri });
            return;
          }

          const profile = await liff.getProfile();
          console.log("LINE profile retrieved in callback:", profile);
          const res = await signIn("line", {
            redirect: false,
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
          });

          if (res?.ok) {
            console.log("LINE login successful, redirecting to /");
            //toast.success("LINE login successful!");
            router.replace("/");
          } else {
            throw new Error(res?.error || "Authentication failed");
          }
        } catch (error) {
          console.error("LINE callback error:", error);
          toast.error("LINE login failed: " + (error.message || "Unknown error"));
          router.replace("/");
        } finally {
          setIsProcessing(false);
        }
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