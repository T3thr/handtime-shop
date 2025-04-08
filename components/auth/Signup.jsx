"use client";

import Link from "next/link";
import React, { useState, useContext, useEffect } from "react";
import AuthContext from "@/context/AuthContext";
import { toast } from "react-toastify";

const Signup = () => {
  const { error, signupUser, clearErrors } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearErrors();
    }
  }, [error, clearErrors]);

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    // Warn if uppercase letters are found
    if (/[A-Z]/.test(value)) {
      toast.warn("Please use lowercase letters for your email.");
    }
  };

  const submitHandler = (e) => {
    e.preventDefault();
    signupUser({ name, username, email, password });
  };

  return (
    <div className="pt-4 flex items-center justify-center min-h-screen bg-background text-foreground transition-all duration-500 ease-in-out">
      <div className="bg-surface-card shadow-md rounded-lg p-8 max-w-md w-full border border-border-primary">
        <form onSubmit={submitHandler}>
          <h2 className="mb-5 text-2xl font-semibold text-center text-foreground">
            Create Account
          </h2>

          <div className="mb-4">
            <label className="block mb-1 text-text-secondary">Name</label>
            <input
              className="appearance-none border border-border-primary bg-container rounded-md py-2 px-3 hover:border-border-secondary focus:outline-none focus:ring-2 focus:ring-primary w-full text-foreground"
              type="text"
              placeholder="Type your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-text-secondary">Username</label>
            <input
              className="appearance-none border border-border-primary bg-container rounded-md py-2 px-3 hover:border-border-secondary focus:outline-none focus:ring-2 focus:ring-primary w-full text-foreground"
              type="text"
              placeholder="Type your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-text-secondary">Email</label>
            <input
              className="appearance-none border border-border-primary bg-container rounded-md py-2 px-3 hover:border-border-secondary focus:outline-none focus:ring-2 focus:ring-primary w-full text-foreground"
              type="email"
              placeholder="Type your email"
              value={email}
              onChange={handleEmailChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-text-secondary">Password</label>
            <input
              className="appearance-none border border-border-primary bg-container rounded-md py-2 px-3 hover:border-border-secondary focus:outline-none focus:ring-2 focus:ring-primary w-full text-foreground"
              type="password"
              placeholder="Type your password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="my-2 px-4 py-2 text-center w-full inline-block text-text-inverted bg-primary border border-transparent rounded-md hover:bg-primary-dark transition duration-200"
          >
            Sign up
          </button>

          <hr className="mt-4 border-border-primary" />

          <p className="text-center mt-5 text-text-secondary">
            Already have an account?{" "}
            <Link href="/signin" className="text-primary hover:text-primary-dark hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
