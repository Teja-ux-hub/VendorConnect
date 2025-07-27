import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoDB';
import { Order } from '@/models/OrderModel';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType');

    if (!userId || !userType) {
      return NextResponse.json(
        { error: 'userId and userType are required' },
        { status: 400 }
      );
    }

    let orders;
    
    if (userType === 'vendor') {
      orders = await Order.find({ vendorId: userId })
        .populate('supplierId', 'shopName location phone')
        .sort({ createdAt: -1 });
    } else if (userType === 'supplier') {
      orders = await Order.find({ supplierId: userId })
        .populate('vendorId', 'name location phone')
        .sort({ createdAt: -1 });
    } else {
      return NextResponse.json(
        { error: 'Invalid userType' },
        { status: 400 }
      );
    }

    return NextResponse.json({ orders });

  } catch (error) {
    console.error('Fetch Orders Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
