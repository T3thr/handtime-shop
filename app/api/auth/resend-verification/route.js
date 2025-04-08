// app/api/auth/resend-verification/route.js
import { NextResponse } from "next/server";
import User from "@/backend/models/User";
import mongodbConnect from "@/backend/lib/mongodb";
import crypto from 'crypto';
import { sendVerificationEmail } from '@/backend/utils/sendemail';

export async function POST(req) {
  try {
    await mongodbConnect();
    const { email } = await req.json();

    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { message: "No account found with this email" },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { message: "Email is already verified" },
        { status: 400 }
      );
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = verificationTokenExpiry;
    await user.save();

    // Send new verification email
    await sendVerificationEmail(email, verificationToken);

    return NextResponse.json(
      { message: "Verification email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { message: "Error sending verification email" },
      { status: 500 }
    );
  }
}