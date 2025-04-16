import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getServerSession } from 'next-auth/next';
import { options } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/backend/lib/mongodb';
import Banner from '@/backend/models/Banner';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(request) {
  try {
    await dbConnect();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    
    // Build query
    const query = activeOnly ? { isActive: true } : {};
    
    // Fetch banners
    const banners = await Banner.find(query).sort({ order: 1 });
    
    return NextResponse.json({ banners });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(options);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title') || '';
    const link = formData.get('link') || '';
    const isActive = formData.get('isActive') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64String}`;

    // Upload to Cloudinary with banner folder
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        dataURI,
        {
          folder: 'handtime/banners',
          upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 600, crop: 'fill', quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    // Get the highest order value
    const highestOrder = await Banner.findOne().sort({ order: -1 }).select('order');
    const newOrder = highestOrder ? highestOrder.order + 1 : 1;

    // Create new banner in database
    const banner = new Banner({
      title,
      imageUrl: result.secure_url,
      publicId: result.public_id,
      link,
      isActive,
      order: newOrder,
      createdBy: session.user.id
    });

    await banner.save();

    return NextResponse.json({
      banner,
      message: 'Banner uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload banner' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(options);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const data = await request.json();
    
    if (!data.bannerId) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 });
    }
    
    const banner = await Banner.findById(data.bannerId);
    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }
    
    // Update fields if provided
    if (data.title !== undefined) banner.title = data.title;
    if (data.link !== undefined) banner.link = data.link;
    if (data.isActive !== undefined) banner.isActive = data.isActive;
    if (data.order !== undefined) banner.order = data.order;
    
    banner.updatedAt = new Date();
    await banner.save();
    
    return NextResponse.json({
      banner,
      message: 'Banner updated successfully'
    });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update banner' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(options);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { bannerId } = await request.json();
    
    if (!bannerId) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 });
    }
    
    const banner = await Banner.findById(bannerId);
    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }
    
    // Delete image from Cloudinary if publicId exists
    if (banner.publicId) {
      await new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(banner.publicId, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      });
    }
    
    // Delete banner from database
    await Banner.findByIdAndDelete(bannerId);
    
    return NextResponse.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete banner' },
      { status: 500 }
    );
  }
}
