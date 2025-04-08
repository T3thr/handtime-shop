// app/resend-verification/page.jsx
"use client";

import { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

export default function ResendVerification() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/resend-verification', { email });
      toast.success('Verification email sent successfully');
      setEmail('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-var-background">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-600 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center text-var-foreground mb-6">
          Resend Verification Email
        </h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-var-muted">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </form>
      </div>
    </div>
  );
}