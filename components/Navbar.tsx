'use client'

import { useAuth, SignInButton, SignUpButton, SignOutButton, UserButton } from '@clerk/nextjs'
import { Truck, LogOut, User } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { isSignedIn } = useAuth()
  const [showProfile, setShowProfile] = useState(false)

  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .floating-icon {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>

      <header className="relative bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Truck className="h-8 w-8 text-orange-500 floating-icon" />
                <div className="absolute inset-0 h-8 w-8 bg-orange-500/20 rounded-full blur animate-pulse"></div>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-blue-500 bg-clip-text text-transparent">
                VendorConnect
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {isSignedIn ? (
                <div className="flex items-center space-x-4">
                  {/* Clerk UserButton with custom styling */}
                  <div className="flex items-center">
                    <UserButton 
                      appearance={{
                        elements: {
                          avatarBox: "w-10 h-10 hover:shadow-lg transition-all duration-300 hover:scale-105",
                          userButtonPopoverCard: "shadow-xl border border-gray-100",
                          userButtonPopoverActionButton: "hover:bg-orange-50 hover:text-orange-600 transition-colors",
                          userButtonPopoverActionButtonText: "font-medium",
                          userButtonPopoverFooter: "hidden"
                        }
                      }}
                      userProfileMode="modal"
                      afterSignOutUrl="/"
                      showName={false}
                    />
                  </div>
                  
                  {/* Optional: Custom profile dropdown (you can remove this if you only want UserButton) */}
                  <div className="relative">
                    
                    
                    {showProfile && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                        <SignOutButton>
                          <button className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors">
                            <LogOut className="w-4 h-4 mr-3" />
                            Logout
                          </button>
                        </SignOutButton>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <button className="px-6 py-2 text-gray-700 hover:text-orange-500 font-medium transition-all duration-300 hover:scale-105">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full font-medium hover:shadow-lg hover:scale-105 transition-all duration-300">
                      Sign Up
                    </button>
                  </SignUpButton>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Click outside to close profile dropdown */}
        {showProfile && (
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowProfile(false)}
          ></div>
        )}
      </header>
    </>
  )
}