import { NextResponse } from "next/server";
import User from "@/backend/models/User";
import mongodbConnect from "@/backend/lib/mongodb";
import crypto from 'crypto';
import { sendVerificationEmail } from "@/backend/utils/sendemail"; // Make sure this import path is correct

export async function GET(req) {
  try {
    await mongodbConnect();
    
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { message: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find user with matching verification token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() },
      isVerified: false
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Update user verification status
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { message: "Error verifying email" },
      { status: 500 }
    );
  }
}

// Add resend verification endpoint
export async function POST(req) {
  try {
    await mongodbConnect();
    
    const { email } = await req.json();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
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
    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
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
      { message: "Error resending verification email" },
      { status: 500 }
    );
  }
}