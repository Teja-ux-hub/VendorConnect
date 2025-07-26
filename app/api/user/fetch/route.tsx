import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { Supplier } from '@/models/SupplierModel';
import { Vendor } from '@/models/VendorModel';
import { connectDB } from '@/lib/mongoDB';

export async function GET(req: Request) {
  try {
    await connectDB();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to find as vendor first
    const vendor = await Vendor.findOne({ userId });
    if (vendor) {
      return NextResponse.json({
        success: true,
        user: {
          id: vendor._id.toString(),
          userType: 'vendor',
          name: vendor.name,
          phone: vendor.phone,
          location: vendor.location,
          userId: vendor.userId
        }
      });
    }

    // Try to find as supplier
    const supplier = await Supplier.findOne({ userId });
    if (supplier) {
      return NextResponse.json({
        success: true,
        user: {
          id: supplier._id.toString(),
          userType: 'seller',
          name: supplier.name,
          phone: supplier.phone,
          location: supplier.location,
          shopName: supplier.shopName,
          userId: supplier.userId
        }
      });
    }

    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
