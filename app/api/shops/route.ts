import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoDB'
import { Supplier } from '@/models/SupplierModel'
import { Product } from '@/models/ProductModel'

function parseLocation(locationStr: string) {
  const [latLngPart] = locationStr.split(' (')
  const [lat, lng] = latLngPart.split(',').map(Number)
  return { lat, lng }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function GET(req: Request) {
  try {
    await connectDB()

    const url = new URL(req.url)
    const lat = parseFloat(url.searchParams.get('lat') || '0')
    const lng = parseFloat(url.searchParams.get('lng') || '0')
    const radiusKm = parseFloat(url.searchParams.get('radius') || '5')

    const suppliers = await Supplier.find({})

    const shopData = await Promise.all(
      suppliers.map(async (supplier) => {
        const { lat: shopLat, lng: shopLng } = parseLocation(supplier.location)
        const distance = calculateDistance(lat, lng, shopLat, shopLng)

        if (distance > radiusKm) return null

        const products = await Product.find({ supplierId: supplier._id })
        return {
          id: supplier._id.toString(),
          shopName: supplier.shopName,
          name: supplier.name,
          phone: supplier.phone,
          location: {
            lat: shopLat,
            lng: shopLng,
            address: supplier.location.split(' (')[1]?.replace(')', '') || ''
          },
          distance: Number(distance.toFixed(2)),
          products: products.map((p) => ({
            id: p._id.toString(),
            name: p.name,
            price: p.price,
            unit: p.unit,
            inStock: p.inStock,
            description: p.description
          }))
        }
      })
    )

    const filteredShops = shopData.filter((s) => s !== null)
    return NextResponse.json({ shops: filteredShops })
  } catch (error) {
    console.error('Error fetching shops:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
