'use client'

import { useAuth, SignUpButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Store, MapPin, Mic, ArrowRight, Zap, Heart, Star } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function HomePage() {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      if (isSignedIn) {
        try {
          const response = await fetch('/api/user/fetch')
          const data = await response.json()
          
          if (response.ok && data.user) {
            // User exists, check if profile is complete
            if (data.user.name && data.user.phone && data.user.location) {
              // Profile complete - redirect to appropriate dashboard
              const dashboardPath = data.user.userType === "vendor" 
                ? "/vendor/dashboard" 
                : "/seller/dashboard"
              router.push(dashboardPath)
            } else {
              // Profile incomplete - redirect to onboarding
              router.push('/onboarding')
            }
          } else {
            // User doesn't exist - redirect to onboarding
            router.push('/onboarding')
          }
        } catch (error) {
          console.error('Error checking user:', error)
          router.push('/onboarding')
        }
      }
    }
    
    checkUserAndRedirect()
  }, [isSignedIn, router])

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 overflow-x-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-orange-200/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-blue-200/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-24 h-24 bg-green-200/25 rounded-full blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <style jsx>{`
        @keyframes floatUp {
          0% { transform: translateY(100px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes floatIn {
          0% { transform: translateY(50px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes bounceIn {
          0% { transform: translateY(30px) scale(0.9); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes slideInUp {
          0% { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes moveLoop {
          0% { transform: translateX(-100px); }
          100% { transform: translateX(calc(100vw + 100px)); }
        }
        
        .animate-float-up {
          animation: floatUp 1.2s ease-out forwards;
        }
        
        .animate-float-in {
          animation: floatIn 1s ease-out 0.5s forwards;
          opacity: 0;
        }
        
        .animate-bounce-in {
          animation: bounceIn 0.8s ease-out 0.8s forwards;
          opacity: 0;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-slide-up {
          animation: slideInUp 0.6s ease-out forwards;
        }
        
        .feature-card {
          opacity: 0;
          transform: translateY(30px);
          animation: slideInUp 0.8s ease-out forwards;
        }
        
        .feature-card:nth-child(1) { animation-delay: 0.2s; }
        .feature-card:nth-child(2) { animation-delay: 0.4s; }
        .feature-card:nth-child(3) { animation-delay: 0.6s; }
        
        .floating-icon {
          animation: float 3s ease-in-out infinite;
        }
        
        .floating-icon:nth-child(1) { animation-delay: 0s; }
        .floating-icon:nth-child(2) { animation-delay: 0.5s; }
        .floating-icon:nth-child(3) { animation-delay: 1s; }
        
        .moving-vehicle {
          animation: moveLoop 15s linear infinite;
          position: fixed;
          top: 60%;
          z-index: 10;
          pointer-events: none;
        }
        
        .moving-vehicle:nth-child(1) { animation-delay: 0s; }
        .moving-vehicle:nth-child(2) { animation-delay: 5s; }
        .moving-vehicle:nth-child(3) { animation-delay: 10s; }
      `}</style>

      {/* Moving Vehicles */}
      <div className="moving-vehicle">
        <div className="text-4xl">🛵</div>
      </div>
      <div className="moving-vehicle">
        <div className="text-4xl">🚚</div>
      </div>
      <div className="moving-vehicle">
        <div className="text-4xl">🚗</div>
      </div>

      {/* <Navbar /> */}

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          {/* Animated delivery icons */}
          <div className="absolute top-10 left-10 floating-icon">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
              🛵
            </div>
          </div>
          <div className="absolute top-20 right-10 floating-icon">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              🥘
            </div>
          </div>
          <div className="absolute bottom-20 left-20 floating-icon">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              🚚
            </div>
          </div>

          <div className={`${isLoaded ? 'animate-float-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center px-4 py-2 bg-orange-100 rounded-full text-orange-700 text-sm font-medium mb-6">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Street Food Platform
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Connect Street Food
              <span className="block bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Vendors with Suppliers
              </span>
            </h2>
          </div>
          
          <p className={`text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed ${isLoaded ? 'animate-float-in' : 'opacity-0'}`}>
            Real-time sourcing platform with AI voice support in Hindi. Find suppliers nearby, 
            place orders instantly, and grow your street food business with smart technology.
          </p>
          
          <div className={`flex flex-col sm:flex-row gap-4 justify-center ${isLoaded ? 'animate-bounce-in' : 'opacity-0'}`}>
            <SignUpButton mode="modal">
              <button className="group bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-4 px-8 rounded-2xl text-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </SignUpButton>
            <button className="group bg-white text-gray-700 border-2 border-gray-200 hover:border-orange-300 font-semibold py-4 px-8 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-105">
              <span className="flex items-center">
                Watch Demo
                <div className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </span>
            </button>
          </div>

          {/* Stats */}
          <div className={`mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto ${isLoaded ? 'animate-slide-up' : 'opacity-0'}`} style={{animationDelay: '1.2s'}}>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">1000+</div>
              <div className="text-sm text-gray-600">Vendors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">500+</div>
              <div className="text-sm text-gray-600">Suppliers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">50+</div>
              <div className="text-sm text-gray-600">Cities</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Built for Indian Street Food Business
            </h3>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Experience the power of technology designed specifically for local vendors and suppliers
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="feature-card group text-center p-8 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-orange-100 to-red-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Mic className="h-10 w-10 text-orange-500" />
              </div>
              <h4 className="text-2xl font-bold mb-4 text-gray-900">Voice AI Assistant</h4>
              <p className="text-gray-600 leading-relaxed">
                Speak in Hindi: <span className="font-semibold text-orange-500">"Mujhe 50 puri chahiye"</span> and find suppliers instantly with intelligent voice commands.
              </p>
              <div className="mt-4 flex justify-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
            </div>

            <div className="feature-card group text-center p-8 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="h-10 w-10 text-blue-500" />
              </div>
              <h4 className="text-2xl font-bold mb-4 text-gray-900">Hyperlocal Sourcing</h4>
              <p className="text-gray-600 leading-relaxed">
                GPS-powered supplier discovery. Find the nearest shops with real-time inventory and competitive pricing within minutes.
              </p>
              <div className="mt-4 flex justify-center">
                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  Real-time GPS
                </div>
              </div>
            </div>

            <div className="feature-card group text-center p-8 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-green-100 to-teal-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Store className="h-10 w-10 text-green-500" />
              </div>
              <h4 className="text-2xl font-bold mb-4 text-gray-900">Cash on Delivery</h4>
              <p className="text-gray-600 leading-relaxed">
                No digital payments needed. All transactions are cash-based with instant contact exchange and secure processing.
              </p>
              <div className="mt-4 flex justify-center">
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  100% Cash Safe
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <Heart className="w-12 h-12 text-white mx-auto mb-4" />
            <blockquote className="text-2xl text-white font-medium mb-4">
              "VendorConnect ne mera business transform kar diya! Ab main easily suppliers find kar sakta hun."
            </blockquote>
            <cite className="text-orange-100">- Rajesh Kumar, Street Food Vendor, Delhi</cite>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Street Food Business?
          </h3>
          <p className="text-gray-300 text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of vendors and suppliers already using VendorConnect to grow their business
          </p>
          <SignUpButton mode="modal">
            <button className="group bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 px-10 rounded-2xl text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
              Start Connecting Today
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform inline" />
            </button>
          </SignUpButton>
          
          <div className="mt-8 text-gray-400 text-sm">
            No credit card required • Free forever plan available
          </div>
        </div>
      </section>

      {/* <Footer /> */}
    </div>
  )
}