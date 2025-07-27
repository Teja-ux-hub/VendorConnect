import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { Product } from '@/models/ProductModel';
import { connectDB } from '@/lib/mongoDB';

export async function POST(req: Request) {
  try {
    await connectDB();

    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    console.log("Incoming request body:", body);

    const { supplierId, name, price, quantity, unit, inStock, description } = body;

    if (!supplierId || !name || !price) {
      return NextResponse.json(
        { error: 'Missing required fields', received: { supplierId, name, price } },
        { status: 400 }
      );
    }

    // Remove supplier existence check (wrong logic)
    const productDoc = await Product.create({
      supplierId,
      name,
      price,
      quantity,
      unit: unit || 'kg',
      inStock: inStock !== undefined ? inStock : true,
      description,
    });

    console.log('Product created successfully:', productDoc);
    return NextResponse.json(productDoc, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/products/add:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
