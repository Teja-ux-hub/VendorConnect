import { Truck } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Truck className="h-6 w-6 text-orange-500" />
          <span className="text-white font-semibold">VendorConnect</span>
        </div>
        <p className="text-gray-400 text-sm">
          Connecting India's street food ecosystem, one vendor at a time.
        </p>
      </div>
    </footer>
  )
}