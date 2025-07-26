import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { Supplier } from '@/models/SupplierModel';
import { Vendor } from '@/models/VendorModel';
import { connectDB } from '@/lib/mongoDB';

export async function POST(req: Request) {
  try {
    await connectDB();

    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    console.log("Incoming request body:", body);

    const { role, name, phone, location, shopName } = body;

    // Validate required fields
    if (!role || !name || !phone || !location) {
      return NextResponse.json(
        { error: 'Missing required fields', received: { role, name, phone, location } },
        { status: 400 }
      );
    }

    let userDoc;

    // ---------------- SUPPLIER ----------------
    if (role === 'supplier') {
      if (!shopName) {
        return NextResponse.json({ error: 'Shop name is required for supplier' }, { status: 400 });
      }

      const existingSupplier = await Supplier.findOne({ userId });
      if (existingSupplier) {
        return NextResponse.json({ error: 'Supplier already exists for this user' }, { status: 409 });
      }

      try {
        userDoc = await Supplier.create({
          userId,
          name,
          phone,
          location, // As a string (lat, lng, address combined)
          shopName,
        });
        console.log('Supplier created successfully:', userDoc);
      } catch (err) {
        console.error('Supplier model error:', err);
        return NextResponse.json(
          { error: 'Supplier creation failed', details: err instanceof Error ? err.message : err },
          { status: 500 }
        );
      }
    }

    // ---------------- VENDOR ----------------
    else if (role === 'vendor') {
      const existingVendor = await Vendor.findOne({ userId });
      if (existingVendor) {
        return NextResponse.json({ error: 'Vendor already exists for this user' }, { status: 409 });
      }

      try {
        userDoc = await Vendor.create({
          userId,
          name,
          phone,
          location, // Same as supplier
        });
        console.log('Vendor created successfully:', userDoc);
      } catch (err) {
        console.error('Vendor model error:', err);
        return NextResponse.json(
          { error: 'Vendor creation failed', details: err instanceof Error ? err.message : err },
          { status: 500 }
        );
      }
    }

    // ---------------- INVALID ROLE ----------------
    else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: userDoc }, { status: 200 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
