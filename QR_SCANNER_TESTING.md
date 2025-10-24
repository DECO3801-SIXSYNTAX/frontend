# QR Scanner Implementation - Testing Guide

## ✅ **Yang Sudah Diimplementasikan:**

### 1. **QR Code Detection Library**
- ✅ Installed `jsQR` library
- ✅ Real-time QR scanning dari camera
- ✅ QR detection dari file upload
- ✅ Token extraction dari QR data

### 2. **Backend Integration**
- ✅ API call ke `/api/debug/decode-guest/` untuk validate token
- ✅ Error handling untuk berbagai response codes
- ✅ Guest data mapping dari backend response

### 3. **UI Updates**
- ✅ Real QR scanning interface dengan canvas overlay
- ✅ Start/Stop scanning controls
- ✅ File upload dengan QR detection
- ✅ Updated guest info display dengan struktur data backend

## 🧪 **Cara Testing:**

### **Prerequisites:**
1. Backend Django server harus running di `http://localhost:8000`
2. Frontend server running di `http://localhost:5173`

### **Testing Steps:**

#### **1. Test dengan Demo Tokens:**
- Buka `http://localhost:5173/kiosk/qr`
- Gunakan tombol demo: "Demo: Valid", "Demo: Invalid", "Demo: Expired"
- Atau masukkan manual token di input field

#### **2. Test dengan Real QR Codes:**
- Generate QR code dari backend: `GET /api/guests/qr/{event_id}/{guest_id}/`
- Scan QR code dengan camera
- Atau upload gambar QR code

#### **3. Test Camera Access:**
- Allow camera permission saat diminta
- Pastikan menggunakan HTTPS atau localhost
- Test start/stop scanning controls

## 🔧 **API Endpoints yang Digunakan:**

### **QR Token Validation:**
```
POST /api/debug/decode-guest/
Content-Type: application/json
{
  "token": "encrypted_token_here"
}
```

### **Response Format:**
```json
{
  "payload": {
    "e": "event_id",
    "g": "guest_id"
  },
  "guest": {
    "id": "guest_id",
    "name": "Guest Name",
    "email": "guest@example.com",
    "phone": "1234567890",
    "tags": ["tag1", "tag2"],
    "seatId": "seat_123",
    "seatName": "A-15",
    "seatType": "VIP",
    "dietaryRestriction": "Vegetarian",
    "accessibilityNeeds": "Wheelchair access",
    "checkedIn": false
  }
}
```

## 🐛 **Troubleshooting:**

### **Camera Issues:**
- Pastikan menggunakan HTTPS atau localhost
- Check browser permissions untuk camera
- Restart browser jika camera tidak terdeteksi

### **API Issues:**
- Pastikan backend server running
- Check network tab di browser dev tools
- Verify API endpoint URL di `.env` atau kode

### **QR Detection Issues:**
- Pastikan QR code jelas dan tidak blur
- Test dengan QR code yang berbeda
- Check console untuk error messages

## 📱 **Browser Compatibility:**
- ✅ Chrome/Chromium (recommended)
- ✅ Firefox
- ✅ Safari (iOS 11+)
- ✅ Edge

## 🎯 **Next Steps:**
1. Test dengan real QR codes dari backend
2. Implementasi check-in functionality
3. Add seat map integration
4. Performance optimization untuk mobile devices
