# QR Scanner Debugging Guide

## 🔍 **Debugging Steps:**

### **1. Check Browser Console**
Buka browser developer tools (F12) dan lihat console untuk:
- Camera access messages
- Video dimension info
- QR scanning status
- Error messages

### **2. Test Manual Token Input**
1. Masukkan token manual di input field
2. Submit untuk test flow verification
3. Pastikan backend API berfungsi

### **3. Test QR Code Generation**
Untuk test QR scanning, buat QR code dengan data sederhana:
- Text: `test-token-123`
- Atau URL: `https://example.com?token=test-token-123`

### **4. Check Camera Permissions**
- Pastikan browser allow camera access
- Refresh page jika permission ditolak
- Test di localhost atau HTTPS

### **5. Debug Info di UI**
Di kiosk page, lihat debug info di kiri atas:
- Camera Status: Should be "Active"
- Video Ready: Should be "4" (HAVE_ENOUGH_DATA)
- Video Playing: Should be "Yes"
- Video Dimensions: Should show width x height > 0
- QR Scanning: Should be "Active"

## 🧪 **Test QR Codes:**

### **Simple Text QR:**
```
Data: test-token-123
```

### **URL QR:**
```
Data: https://example.com/checkin?token=test-token-123
```

### **Backend Token QR:**
Generate dari backend API:
```
GET /api/guests/qr/{event_id}/{guest_id}/
```

## 🐛 **Common Issues:**

### **Camera Not Working:**
- Check browser permissions
- Use HTTPS or localhost
- Restart browser

### **QR Not Detecting:**
- Check video dimensions > 0
- Ensure QR code is clear and well-lit
- Try different QR code sizes

### **Video Dimensions 0x0:**
- Wait for video to load completely
- Check camera is working
- Try manual start scanning button

## 🔧 **Manual Testing:**

1. **Test Manual Token**: Masukkan "test-token-123"
2. **Test Camera**: Allow camera permission
3. **Test QR Scanning**: Use manual start/stop buttons
4. **Test File Upload**: Upload QR image file

## 📱 **Browser Compatibility:**
- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari (iOS 11+)
- ✅ Edge
