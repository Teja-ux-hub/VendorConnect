import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
}

// TypeScript interface for cached connection
interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Extend global namespace
declare global {
  var mongoose: MongooseCache | undefined
}

// Initialize cache
let cached: MongooseCache = (global as any).mongoose

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null }
}

export async function connectToDatabase() {
  // Return existing connection
  if (cached.conn) {
    return cached.conn
  }

  // Create new connection if promise doesn't exist
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts)
  }

  try {
    cached.conn = await cached.promise
    console.log('✅ Connected to MongoDB')
    return cached.conn
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    cached.promise = null
    throw error
  }
}