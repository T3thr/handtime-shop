// app/auth/callback/line/page.js
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "react-toastify";

export default function LineCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
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
          router.push("/"); // Redirect to homepage or intended page
        } else {
          throw new Error(res?.error || "Authentication failed");
        }
      } catch (error) {
        console.error("LINE callback error:", error);
        toast.error(error.message || "Failed to complete LINE login");
        router.push("/auth/signin");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg">Processing LINE login...</p>
        <div className="mt-4 animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    </div>
  );
}