// context/AuthContext.js
"use client";
import axios from "axios";
import { useRouter } from "next/navigation";
import { createContext, useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut, useSession } from "next-auth/react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { data: session, status, update } = useSession();
  const [user, setUser] = useState(null);
  const [lineProfile, setLineProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Initialize LIFF and handle LINE login
  useEffect(() => {
    const initializeLiff = async () => {
      if (!process.env.NEXT_PUBLIC_LIFF_ID) {
        console.warn("LIFF ID is not defined in environment variables");
        return;
      }

      try {
        const { default: liff } = await import("@line/liff");
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID });

        if (liff.isLoggedIn() && status === "unauthenticated") {
          const profile = await liff.getProfile();
          setLineProfile(profile);
          await lineSignIn(profile);
        }
      } catch (error) {
        console.error("LIFF initialization error:", error);
        toast.error("Failed to initialize LINE login");
      }
    };

    if (typeof window !== "undefined") {
      initializeLiff();
    }
  }, [status]);

  // Sync user state with session
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setUser(session.user);
      if (session.user.provider === "line" && !lineProfile) {
        setLineProfile({
          userId: session.user.lineId,
          displayName: session.user.name,
          pictureUrl: session.user.image,
        });
      }
    } else if (status === "unauthenticated") {
      setUser(null);
      setLineProfile(null);
    }
  }, [session, status]);

  const registerLineUser = useCallback(async (profile) => {
    try {
      setLoading(true);
      const res = await axios.post("/api/auth/line/register", {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
      });

      if (res.data.success) {
        const registeredUser = {
          id: res.data.user.id,
          name: res.data.user.name,
          lineId: res.data.user.lineId,
          avatar: res.data.user.avatar,
          role: res.data.user.role,
        };
        setUser(registeredUser);
        return { success: true, user: registeredUser };
      }
      return { success: false, message: "Registration failed" };
    } catch (error) {
      console.error("LINE registration error:", error);
      toast.error(error.response?.data?.error || "Failed to register LINE user");
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const signupUser = async ({ name, username, email, password }) => {
    try {
      setLoading(true);
      const { data, status: resStatus } = await axios.post("/api/auth/signup", {
        name,
        username,
        email,
        password,
      });
      if (resStatus === 201) {
        toast.success("Signup successful! Please sign in to continue.", {
          autoClose: 3000,
          onClose: () => router.push("/auth/signin"),
        });
        return { success: true };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Signup failed";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const adminSignIn = async ({ username, password }) => {
    try {
      setLoading(true);
      const res = await nextAuthSignIn("admin-credentials", {
        redirect: false,
        username,
        password,
      });

      if (res?.error) {
        toast.error(res.error);
        return { success: false, message: res.error };
      }

      if (res?.ok) {
        await update(); // Force session update
        toast.success("Admin login successful!");
        return { success: true };
      }
      return { success: false, message: "Unknown error occurred" };
    } catch (error) {
      toast.error("Admin signin failed");
      return { success: false, message: "Admin signin failed" };
    } finally {
      setLoading(false);
    }
  };

  const lineSignIn = useCallback(async (profile) => {
    try {
      setLoading(true);
      if (!profile || !profile.userId) throw new Error("LINE profile data is required");

      setLineProfile(profile);

      const res = await nextAuthSignIn("line", {
        redirect: false,
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
      });

      if (res?.error) {
        toast.error(res.error);
        return { success: false, message: res.error };
      }

      if (res?.ok) {
        await update(); // Force session update
        toast.success("LINE login successful!");
        return { success: true };
      }
      return { success: false, message: "Unknown error occurred" };
    } catch (error) {
      console.error("LINE signin error:", error);
      toast.error("LINE signin failed");
      return { success: false, message: error.message || "LINE signin failed" };
    } finally {
      setLoading(false);
    }
  }, [update]);

  const logoutUser = useCallback(async () => {
    try {
      setLoading(true);
      await nextAuthSignOut({ redirect: false });

      if (typeof window !== "undefined") {
        const { default: liff } = await import("@line/liff");
        if (liff.isLoggedIn()) {
          liff.logout();
        }
      }

      setUser(null);
      setLineProfile(null);
      toast.success("Logged out successfully");
      router.push("/");

      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
      return { success: false, message: "Logout failed" };
    } finally {
      setLoading(false);
    }
  }, [router]);

  const clearErrors = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        lineProfile,
        error,
        loading,
        status,
        signupUser,
        adminSignIn,
        lineSignIn,
        logoutUser,
        registerLineUser,
        setUser,
        setLineProfile,
        clearErrors,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;