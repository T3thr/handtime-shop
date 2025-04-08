"use client";
import Link from "next/link";
import React, { useState, useContext, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import AuthContext from "@/context/AuthContext";
import { toast } from "react-toastify";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, User as UserIcon, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { FaLine } from "react-icons/fa";

const Signin = () => {
  const { data: session } = useSession();
  const { error, clearErrors, adminSignIn } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLineLoading, setIsLineLoading] = useState(false);

  const router = useRouter();
  const params = useSearchParams();
  const callBackUrl = params.get("callbackUrl") || "/";

  useEffect(() => {
    if (session) {
      router.push(callBackUrl);
    }
  }, [session, callBackUrl, router]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearErrors();
    }
  }, [error]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter both username and password");
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await signIn("admin-credentials", {
        redirect: false,
        username: username.trim(),
        password: password.trim(),
      });

      if (result?.error) {
        toast.error(result.error || "Invalid admin credentials");
      } else if (result?.ok) {
        toast.success("Admin login successful!");
        router.push(callBackUrl.includes("/admin") ? callBackUrl : "/admin/dashboard");
      }
    } catch (error) {
      console.error("Admin login error:", error);
      toast.error("An error occurred during admin login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLineSignIn = async () => {
    try {
      setIsLineLoading(true);
      await signIn("line", { 
        callbackUrl: callBackUrl,
      });
    } catch (error) {
      toast.error("Failed to initiate LINE login");
    } finally {
      setIsLineLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground transition-all duration-500 ease-in-out p-4">
      <div className="bg-surface-card shadow-lg rounded-xl p-8 max-w-md w-full border border-border-primary">
        <div className="flex justify-center mb-6">
          <Link href="/">
            <Image 
              src="/logo.png" 
              alt="Logo" 
              width={120} 
              height={40} 
              className="h-10 w-auto"
              priority
            />
          </Link>
        </div>
        
        <h2 className="mb-6 text-2xl font-bold text-center text-foreground">
          Welcome Back
        </h2>

        {/* LINE Login Button */}
        <div className="mb-8">
          <button
            onClick={handleLineSignIn}
            disabled={isLineLoading}
            className="flex items-center justify-center w-full bg-[#06C755] text-white py-3 rounded-md hover:bg-[#05b54d] transition duration-200"
          >
            {isLineLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : (
              <>
                <FaLine className="w-5 h-5 mr-2" />
                Sign in with LINE
              </>
            )}
          </button>
        </div>

        {/* Admin Login Toggle */}
        <div className="mb-4">
          <button
            onClick={() => setShowAdminLogin(!showAdminLogin)}
            className="flex items-center justify-center w-full text-sm text-primary hover:text-primary-dark transition-colors"
          >
            <LockKeyhole className="w-4 h-4 mr-1" />
            Admin Login
            {showAdminLogin ? (
              <ChevronUp className="w-4 h-4 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-1" />
            )}
          </button>
        </div>

        {/* Admin Login Form */}
        {showAdminLogin && (
          <form onSubmit={handleAdminLogin} className="mt-4 border-t border-border-primary pt-4">
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-text-secondary">
                Admin Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-text-tertiary" />
                </div>
                <input
                  className="block w-full pl-10 pr-3 py-2.5 border border-border-primary bg-container rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  type="text"
                  placeholder="Enter admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-text-secondary">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockKeyhole className="h-5 w-5 text-text-tertiary" />
                </div>
                <input
                  className="block w-full pl-10 pr-3 py-2.5 border border-border-primary bg-container rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <button
              className={`w-full flex justify-center items-center ${
                isLoading ? "bg-primary/70" : "bg-primary hover:bg-primary-dark"
              } text-text-inverted py-2.5 rounded-md transition duration-200 mb-4`}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign In as Admin"
              )}
            </button>
          </form>
        )}

        <div className="text-center text-sm pt-4 border-t border-border-primary">
          <Link 
            href="/auth/forgot-password" 
            className="text-primary hover:text-primary-dark hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signin;