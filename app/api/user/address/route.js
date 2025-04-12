"use client";
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/user/address - Get all addresses for the current user
export async function GET(req) {
  try {
    await connectToDB();
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({ addresses: user.addresses || [] });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json({ message: "Failed to fetch addresses" }, { status: 500 });
  }
}

// POST /api/user/address - Add a new address
export async function POST(req) {
  try {
    await connectToDB();
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    
    const addressData = await req.json();
    
    // Validate required fields
    const requiredFields = ['recipientName', 'street', 'city', 'postalCode', 'country'];
    for (const field of requiredFields) {
      if (!addressData[field]) {
        return NextResponse.json({ message: `${field} is required` }, { status: 400 });
      }
    }
    
    // If this is the first address or isDefault is true, make it the default
    if (user.addresses.length === 0 || addressData.isDefault) {
      // If making this address default, remove default from other addresses
      if (user.addresses.length > 0) {
        user.addresses.forEach(addr => {
          addr.isDefault = false;
        });
      }
      addressData.isDefault = true;
    }
    
    user.addresses.push(addressData);
    await user.save();
    
    return NextResponse.json({ 
      message: "Address added successfully", 
      address: user.addresses[user.addresses.length - 1] 
    });
  } catch (error) {
    console.error("Error adding address:", error);
    return NextResponse.json({ message: "Failed to add address" }, { status: 500 });
  }
}
