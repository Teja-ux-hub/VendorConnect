import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoDB';
import { Order } from '@/models/OrderModel';
import { Supplier } from '@/models/SupplierModel';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const {
      vendorId,
      products,
      vendorLocation,
      vendorPhone,
      preferredSupplierId,
    } = body;

    // Validate required fields
    if (!vendorId || !products || !products.length) {
      return NextResponse.json(
        { error: 'Missing required fields: vendorId, products' },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = products.reduce((sum: number, product: any) => 
      sum + (product.price * product.quantity), 0
    );

    // Find supplier
    let supplierId = preferredSupplierId;

    if (!supplierId) {
      const supplier = await Supplier.findOne({}).limit(1);
      if (!supplier) {
        return NextResponse.json(
          { error: 'No suppliers available for quick order' },
          { status: 400 }
        );
      }
      supplierId = supplier._id;
    }

    // Transform products for storage
    const transformedProducts = products.map((product: any) => ({
      productId: product.productId || product.id,
      name: product.name,
      quantity: product.quantity,
      price: product.price
    }));

    // Create order with fallback for vendorPhone
    const order = new Order({
      vendorId,
      supplierId,
      products: transformedProducts,
      totalPrice: totalAmount,
      status: 'pending',
      isQuickOrder: true,
      vendorLocation,
      vendorPhone: vendorPhone || '+91 0000000000',
      sellerPhone: '+91 9876543210',
    });

    const savedOrder = await order.save();

    // Populate the order for response
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('supplierId', 'shopName location phone')
      .populate('vendorId', 'name location phone');

    return NextResponse.json({
      message: 'Order placed successfully!',
      order: populatedOrder
    }, { status: 201 });

  } catch (error) {
    console.error('Quick Order Error:', error);
    return NextResponse.json(
      { error: 'Failed to place order' },
      { status: 500 }
    );
  }
}
