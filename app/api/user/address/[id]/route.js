import { NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import User from "@/backend/models/User";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";

// PUT /api/user/address/[id] - Update an address
export async function PUT(request, { params }) {
  const session = await getServerSession(options);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const addressId = params.id;
    const data = await request.json();
    
    // Validate required fields
    const requiredFields = ['recipientName', 'street', 'city', 'postalCode', 'country'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }
    
    // Find user and address
    const user = await User.findOne({ 
      $or: [
        { email: session.user.email }, 
        { lineId: session.user.lineId }
      ],
      "addresses._id": addressId
    });
    
    if (!user) {
      return NextResponse.json({ error: "User or address not found" }, { status: 404 });
    }
    
    // Find the address in the user's addresses array
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }
    
    // Update address fields
    user.addresses[addressIndex].recipientName = data.recipientName;
    user.addresses[addressIndex].street = data.street;
    user.addresses[addressIndex].city = data.city;
    user.addresses[addressIndex].state = data.state || "";
    user.addresses[addressIndex].postalCode = data.postalCode;
    user.addresses[addressIndex].country = data.country;
    user.addresses[addressIndex].phone = data.phone || "";
    user.addresses[addressIndex].type = data.type || "home";
    
    // Handle default address setting
    if (data.isDefault && !user.addresses[addressIndex].isDefault) {
      // Unset any existing default
      user.addresses.forEach((addr, idx) => {
        if (idx !== addressIndex) {
          addr.isDefault = false;
        }
      });
      user.addresses[addressIndex].isDefault = true;
    }
    
    await user.save();
    
    return NextResponse.json({ 
      message: "Address updated successfully", 
      address: user.addresses[addressIndex] 
    });
  } catch (error) {
    console.error("Failed to update address:", error);
    return NextResponse.json({ 
      error: "Failed to update address", 
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE /api/user/address/[id] - Delete an address
export async function DELETE(request, { params }) {
  const session = await getServerSession(options);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const addressId = params.id;
    
    // Find user and address
    const user = await User.findOne({ 
      $or: [
        { email: session.user.email }, 
        { lineId: session.user.lineId }
      ],
      "addresses._id": addressId
    });
    
    if (!user) {
      return NextResponse.json({ error: "User or address not found" }, { status: 404 });
    }
    
    // Find the address in the user's addresses array
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }
    
    // Check if this is the default address
    const isDefault = user.addresses[addressIndex].isDefault;
    
    // Remove the address
    user.addresses.splice(addressIndex, 1);
    
    // If the deleted address was the default and there are other addresses,
    // set the first remaining address as default
    if (isDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }
    
    await user.save();
    
    return NextResponse.json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Failed to delete address:", error);
    return NextResponse.json({ 
      error: "Failed to delete address", 
      details: error.message 
    }, { status: 500 });
  }
}
