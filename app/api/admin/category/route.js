import { NextResponse } from 'next/server';
import dbConnect from '@/backend/lib/mongodb';
import Category from '@/backend/models/Category';
import { getServerSession } from 'next-auth/next';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { Server } from 'socket.io';

const verifyAdminSession = async () => {
  const session = await getServerSession(options);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return session;
};

const sendToClients = (io, event, data) => {
  io.emit(event, data); // Emit the event to all connected clients
};

export async function POST(request) {
  const session = await verifyAdminSession();
  if (session instanceof NextResponse) return session;

  try {
    await dbConnect();
    const data = await request.json();

    const slug = data.name ? data.name.toLowerCase().replace(/\s+/g, '-') : '';

    const category = new Category({
      ...data,
      createdBy: session.user.id,
      slug,
    });

    await category.save();

    // Emit event to clients after saving the category
    const io = request.socket.server.io; // Access the Socket.IO server
    sendToClients(io, "category_added", category);

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to add category' }, { status: 400 });
  }
}

export async function PUT(request) {
  const session = await verifyAdminSession();
  if (session instanceof NextResponse) return session;

  try {
    await dbConnect();
    const data = await request.json();

    const updatedCategory = {
      ...data,
      updatedBy: session.user.id,
      slug: data.name ? data.name.toLowerCase().replace(/\s+/g, '-') : data.slug,
    };

    const category = await Category.findOneAndUpdate(
      { slug: data.slug },
      updatedCategory,
      { new: true }
    );

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Emit event to clients after updating the category
    const io = request.socket.server.io;
    sendToClients(io, "category_updated", category);

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 400 });
  }
}

export async function DELETE(request) {
  const session = await verifyAdminSession();
  if (session instanceof NextResponse) return session;

  try {
    await dbConnect();
    const { slug } = await request.json();
    const category = await Category.findOneAndDelete({ slug });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Emit event to clients after deleting the category
    const io = request.socket.server.io;
    sendToClients(io, "category_deleted", slug);

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to delete category' }, { status: 400 });
  }
}
