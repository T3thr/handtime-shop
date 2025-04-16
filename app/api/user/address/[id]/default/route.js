import { NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import User from "@/backend/models/User";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/api/auth/[...nextauth]/options";

// PUT /api/user/address/[id]/default - Set an address as default
export async function PUT(request, { params }) {
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
    
    // Unset any existing default
    user.addresses.forEach((addr, idx) => {
      addr.isDefault = idx === addressIndex;
    });
    
    await user.save();
    
    return NextResponse.json({ 
      message: "Default address updated successfully", 
      address: user.addresses[addressIndex] 
    });
  } catch (error) {
    console.error("Failed to update default address:", error);
    return NextResponse.json({ 
      error: "Failed to update default address", 
      details: error.message 
    }, { status: 500 });
  }
}
