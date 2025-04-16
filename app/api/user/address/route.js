import { NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import User from "@/backend/models/User";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";

// GET /api/user/address - Get all addresses for the current user
export async function GET() {
  const session = await getServerSession(options);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const user = await User.findOne({ 
      $or: [
        { email: session.user.email }, 
        { lineId: session.user.lineId }
      ] 
    }).select("addresses").lean();
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({ addresses: user.addresses || [] });
  } catch (error) {
    console.error("Failed to fetch addresses:", error);
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 });
  }
}

// POST /api/user/address - Add a new address
export async function POST(request) {
  const session = await getServerSession(options);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const data = await request.json();
    
    // Validate required fields
    const requiredFields = ['recipientName', 'street', 'city', 'postalCode', 'country'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }
    
    const user = await User.findOne({ 
      $or: [
        { email: session.user.email }, 
        { lineId: session.user.lineId }
      ] 
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Create a new address with a unique _id
    const newAddress = {
      _id: new mongoose.Types.ObjectId(),
      recipientName: data.recipientName,
      street: data.street,
      city: data.city,
      state: data.state || "",
      postalCode: data.postalCode,
      country: data.country,
      phone: data.phone || "",
      isDefault: data.isDefault || false,
      type: data.type || "home"
    };
    
    // If this is the first address or isDefault is true, make it the default
    if (data.isDefault || user.addresses.length === 0) {
      // If setting this as default, unset any existing default
      if (user.addresses.length > 0) {
        user.addresses.forEach(addr => {
          addr.isDefault = false;
        });
      }
      newAddress.isDefault = true;
    }
    
    user.addresses.push(newAddress);
    await user.save();
    
    return NextResponse.json({ 
      message: "Address added successfully", 
      address: newAddress 
    });
  } catch (error) {
    console.error("Failed to add address:", error);
    return NextResponse.json({ 
      error: "Failed to add address", 
      details: error.message 
    }, { status: 500 });
  }
}
