import { NextResponse } from 'next/server';
import { Product } from '@/models/ProductModel';
import { connectDB } from '@/lib/mongoDB';

/**
 * GET /api/products?type=seller&userId=<sellerId>
 * GET /api/products?type=vendor
 */
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');

    // Fetch products for a seller
    if (type === 'seller') {
      if (!userId) {
        return NextResponse.json({ error: 'Missing seller userId' }, { status: 400 });
      }

      const products = await Product.find({ supplierId: userId });
      return NextResponse.json({ products });
    }

    // Fetch all sellers and their products (for vendor)
    if (type === 'vendor') {
      const products = await Product.find({});
      const grouped = products.reduce((acc: Record<string, any[]>, prod) => {
        const sid = prod.supplierId;
        if (!acc[sid]) acc[sid] = [];
        acc[sid].push(prod);
        return acc;
      }, {});
      return NextResponse.json({ sellers: grouped });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
