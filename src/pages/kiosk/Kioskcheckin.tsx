import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, User, Clock, MapPin, Users, Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

interface GuestInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  tableId?: string;
  seatNumber?: number;
  dietaryRestrictions?: string[];
  accessibilityNeeds?: string[];
  checkedIn: boolean;
  checkInTime?: string;
}

interface EventInfo {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: {
    name: string;
    address: string;
  };
}

interface VerifyResponse {
  ok: boolean;
  guest: GuestInfo;
  event: EventInfo;
}

interface CheckInResponse {
  ok: boolean;
  alreadyCheckedIn: boolean;
  message: string;
  checkInTime: string;
  guest: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export function KioskCheckIn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const eventId = searchParams.get("eventId");

  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);

  // Verify QR code on mount
  useEffect(() => {
    if (!token || !eventId) {
      navigate("/kiosk");
      return;
    }

    verifyQRCode();
  }, [token, eventId, navigate]);

  const verifyQRCode = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("🔍 Verifying QR code...");

      const response = await fetch(`${API_BASE}/api/guests/verify-qr/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        const data: VerifyResponse = await response.json();
        console.log("✅ QR verified:", data);
        
        setGuestInfo(data.guest);
        setEventInfo(data.event);
        setAlreadyCheckedIn(data.guest.checkedIn);
        setError(null);
      } else {
        const errorData = await response.json();
        console.error("❌ Verification failed:", errorData);
        setError(errorData.detail || "Invalid QR code. Please contact event staff.");
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!token) return;

    setIsCheckingIn(true);
    setError(null);

    try {
      console.log("🎫 Checking in guest...");

      const response = await fetch(`${API_BASE}/api/guests/checkin/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        const data: CheckInResponse = await response.json();
        console.log("✅ Check-in successful:", data);
        
        setIsCheckedIn(true);
        setAlreadyCheckedIn(data.alreadyCheckedIn);

        // Auto redirect after 3 seconds
        setTimeout(() => {
          navigate("/kiosk");
        }, 3000);
      } else {
        const errorData = await response.json();
        console.error("❌ Check-in failed:", errorData);
        setError(errorData.detail || "Check-in failed. Please try again.");
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-xl text-gray-600">Verifying QR code...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !guestInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center"
        >
          <XCircle className="h-20 w-20 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid QR Code</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/kiosk")}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Kiosk
          </button>
        </motion.div>
      </div>
    );
  }

  // Success - Already checked in
  if (alreadyCheckedIn && guestInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8"
        >
          <div className="text-center mb-6">
            <CheckCircle className="h-20 w-20 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Already Checked In</h1>
            <p className="text-gray-600">This guest has already been checked in</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {guestInfo.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{guestInfo.name}</h2>
                <p className="text-gray-600">{guestInfo.email}</p>
              </div>
            </div>

            {guestInfo.checkInTime && (
              <div className="flex items-center text-gray-600 mb-2">
                <Clock className="h-5 w-5 mr-2" />
                <span>Checked in at: {new Date(guestInfo.checkInTime).toLocaleString()}</span>
              </div>
            )}

            {guestInfo.tableId && (
              <div className="flex items-center text-gray-600">
                <MapPin className="h-5 w-5 mr-2" />
                <span>Table: {guestInfo.tableId}</span>
                {guestInfo.seatNumber && <span className="ml-2">Seat: {guestInfo.seatNumber}</span>}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate("/kiosk")}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Kiosk
          </button>
        </motion.div>
      </div>
    );
  }

  // Success - Show check-in confirmation
  if (isCheckedIn && guestInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8"
        >
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-4" />
            </motion.div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome!</h1>
            <p className="text-xl text-gray-600">Check-in successful</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {guestInfo.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{guestInfo.name}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    guestInfo.role === 'VIP' ? 'bg-yellow-100 text-yellow-800' :
                    guestInfo.role === 'Speaker' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {guestInfo.role}
                  </span>
                </div>
              </div>
            </div>

            {eventInfo && (
              <div className="space-y-2 mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center text-gray-700">
                  <Users className="h-5 w-5 mr-2" />
                  <span className="font-medium">{eventInfo.name}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-2" />
                  <span>{eventInfo.date} at {eventInfo.time}</span>
                </div>
                {eventInfo.venue && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{eventInfo.venue.name}</span>
                  </div>
                )}
              </div>
            )}

            {guestInfo.tableId && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Your assigned seat:</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    Table {guestInfo.tableId}
                    {guestInfo.seatNumber && ` - Seat ${guestInfo.seatNumber}`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-gray-500 text-sm">
            Redirecting to kiosk in 3 seconds...
          </p>
        </motion.div>
      </div>
    );
  }

  // Main check-in screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8"
      >
        <div className="text-center mb-6">
          <User className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Guest Verification</h1>
          <p className="text-gray-600">Please confirm your details below</p>
        </div>

        {guestInfo && (
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {guestInfo.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{guestInfo.name}</h2>
                <p className="text-gray-600">{guestInfo.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium text-gray-900">{guestInfo.role}</p>
              </div>
              {guestInfo.tableId && (
                <div>
                  <p className="text-sm text-gray-500">Table Assignment</p>
                  <p className="font-medium text-gray-900">
                    Table {guestInfo.tableId}
                    {guestInfo.seatNumber && ` - Seat ${guestInfo.seatNumber}`}
                  </p>
                </div>
              )}
            </div>

            {guestInfo.dietaryRestrictions && guestInfo.dietaryRestrictions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Dietary Restrictions</p>
                <div className="flex flex-wrap gap-2">
                  {guestInfo.dietaryRestrictions.map((diet, i) => (
                    <span key={i} className="px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded-full">
                      {diet}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {guestInfo.accessibilityNeeds && guestInfo.accessibilityNeeds.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Accessibility Needs</p>
                <div className="flex flex-wrap gap-2">
                  {guestInfo.accessibilityNeeds.map((need, i) => (
                    <span key={i} className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                      {need}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {eventInfo && (
          <div className="bg-indigo-50 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Event Details</h3>
            <div className="space-y-2">
              <div className="flex items-center text-gray-700">
                <Users className="h-5 w-5 mr-2 text-indigo-600" />
                <span>{eventInfo.name}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Clock className="h-5 w-5 mr-2 text-indigo-600" />
                <span>{eventInfo.date} at {eventInfo.time}</span>
              </div>
              {eventInfo.venue && (
                <>
                  <div className="flex items-center text-gray-700">
                    <MapPin className="h-5 w-5 mr-2 text-indigo-600" />
                    <span>{eventInfo.venue.name}</span>
                  </div>
                  {eventInfo.venue.address && (
                    <p className="text-sm text-gray-600 ml-7">{eventInfo.venue.address}</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            onClick={() => navigate("/kiosk")}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCheckIn}
            disabled={isCheckingIn}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isCheckingIn ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Checking In...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Check In
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default KioskCheckIn;