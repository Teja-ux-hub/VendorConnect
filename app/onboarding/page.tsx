"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { MapPin, Phone, User, Truck, Store, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

export default function OnboardingPage() {
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<"vendor" | "seller" | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    location: { lat: 0, lng: 0, address: "" },
    storeName: "", // for sellers
    // products: [] as Array<{ name: string; price: number; quantity: number }>
  });
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/");
      return;
    }

    // Check if user already exists in database
    checkExistingUser();
  }, [isSignedIn, router]);

  const checkExistingUser = async () => {
    try {
      setIsCheckingUser(true);
      const response = await axios.get("/api/user/fetch");
      
      if (response.status === 200 && response.data.user) {
        const userData = response.data.user;
        
        // Check if user has complete profile (name, phone, location)
        if (userData.name && userData.phone && userData.location) {
          // Redirect to appropriate dashboard based on user type
          const dashboardPath = userData.userType === "vendor" 
            ? "/vendor/dashboard" 
            : "/seller/dashboard";
            
          toast.success("Welcome back! Redirecting to your dashboard...");
          router.push(dashboardPath);
          return;
        }
      }
    } catch (error: any) {
      // If user doesn't exist (404) or other error, continue with onboarding
      if (error?.response?.status === 404) {
        console.log("User not found, proceeding with onboarding");
      } else {
        console.error("Error checking existing user:", error);
        toast.error("Error loading user profile. Please try again.");
      }
    } finally {
      setIsCheckingUser(false);
    }
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData((prev) => ({
            ...prev,
            location: {
              lat: latitude,
              lng: longitude,
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            },
          }));
          console.log(
            "Location details - Latitude:",
            latitude,
            "Longitude:",
            longitude
          );
          setIsGettingLocation(false);
          toast.success("Location detected successfully!");
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsGettingLocation(false);
          toast.error("Could not get location. Please try again.");
        }
      );
    } else {
      setIsGettingLocation(false);
      toast.error("Geolocation is not supported by this browser.");
    }
  };

  const handleNext = () => {
    if (step === 1 && !userType) {
      toast.error("Please select your role");
      return;
    }
    if (step === 2) {
      if (!formData.fullName || !formData.phoneNumber) {
        toast.error("Please fill all required fields");
        return;
      }
      if (!formData.location.lat) {
        toast.error("Please detect your location");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleComplete = async () => {
    try {
      // Sanitize payload and remove undefined fields
      const payload: any = {
        role: userType === "seller" ? "supplier" : "vendor",
        name: formData.fullName,
        phone: formData.phoneNumber,
        location: `${formData.location.lat}, ${formData.location.lng} (${formData.location.address})`,
      };
      if (userType === "seller" && formData.storeName) {
        payload.shopName = formData.storeName;
      }

      const response = await axios.post("/api/user/create", payload);

      if (response.status === 200) {
        // Fetch the actual user data from database
        const fetchResponse = await axios.get("/api/user/fetch");
        
        if (fetchResponse.status === 200 && fetchResponse.data.user) {
          const userData = fetchResponse.data.user;
          localStorage.setItem('userData', JSON.stringify(userData));
          
          toast.success("Profile saved successfully! 🎉");
          
          // Navigate based on actual user type from database
          setTimeout(() => {
            router.push(
              userData.userType === "vendor" ? "/vendor/dashboard" : "/seller/dashboard"
            );
          }, 100);
        } else {
          toast.error("Profile created but unable to load user data.");
        }
      } else {
        toast.error("Something went wrong. Please login again.");
      }
    } catch (error: any) {
      // Show backend error message if available
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to save profile. Please try again.";
      console.error("Error saving profile:", error);
      toast.error(message);
    }
  };

  // Show loading screen while checking if user exists
  if (!isSignedIn || isCheckingUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">
            {!isSignedIn ? "Checking authentication..." : "Loading your profile..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Complete Your Profile
          </h2>
          <p className="text-gray-600 mt-2">Step {step} of 3</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-center">
                What describes you best?
              </h3>

              <div className="space-y-4">
                <button
                  onClick={() => setUserType("vendor")}
                  className={`w-full p-4 border-2 rounded-lg flex items-center space-x-3 transition-all duration-200 ${
                    userType === "vendor"
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <Truck className="h-6 w-6 text-orange-500" />
                  <div className="text-left">
                    <div className="font-medium">Street Food Vendor</div>
                    <div className="text-sm text-gray-600">
                      I sell street food and need suppliers
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setUserType("seller")}
                  className={`w-full p-4 border-2 rounded-lg flex items-center space-x-3 transition-all duration-200 ${
                    userType === "seller"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <Store className="h-6 w-6 text-blue-500" />
                  <div className="text-left">
                    <div className="font-medium">Supplier/Retailer</div>
                    <div className="text-sm text-gray-600">
                      I supply raw materials to vendors
                    </div>
                  </div>
                </button>
              </div>

              <button onClick={handleNext} className="w-full btn-primary">
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Basic Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
                  className="input-field"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      phoneNumber: e.target.value,
                    }))
                  }
                  className="input-field"
                  placeholder="+91 9876543210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Current Location *
                </label>
                <div className="space-y-2">
                  <button
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    {isGettingLocation
                      ? "Detecting Location..."
                      : "Detect My Location"}
                  </button>
                  {formData.location.address && (
                    <p className="text-sm text-green-600">
                      📍 {formData.location.address}
                    </p>
                  )}
                </div>
              </div>

              <button onClick={handleNext} className="w-full btn-primary">
                Continue
              </button>
            </div>
          )}

          {step === 3 && userType === "seller" && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Store Setup</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Name *
                </label>
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      storeName: e.target.value,
                    }))
                  }
                  className="input-field"
                  placeholder="e.g., Sharma General Store"
                />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  You can add products later from your dashboard
                </p>
              </div>

              <button onClick={handleComplete} className="w-full btn-primary">
                Complete Setup
              </button>
            </div>
          )}

          {step === 3 && userType === "vendor" && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">You're all set!</h3>

              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-gray-600">
                  Your vendor profile is ready. Start finding suppliers near
                  you!
                </p>
              </div>

              <button onClick={handleComplete} className="w-full btn-primary">
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}