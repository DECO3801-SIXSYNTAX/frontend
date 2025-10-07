# Google Authentication Debugging Guide

## Current Issue: 400 Bad Request Error

The 400 error indicates that the server cannot process the request due to invalid or incomplete data. Here's how to debug and fix this issue:

## 1. Check Environment Configuration

### Frontend (.env file)
Add this to your `.env` file:
```
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=your-actual-google-client-id
```

**Important**: Replace `your-actual-google-client-id` with your real Google OAuth Client ID from Google Console.

### Backend (Django settings)
Ensure your Django backend has:
```python
GOOGLE_CLIENT_ID = "your-actual-google-client-id"  # Same as frontend
```

## 2. Verify Backend Endpoint

The frontend sends POST requests to: `http://localhost:8000/api/auth/google/`

Make sure your Django backend:
- Is running on port 8000
- Has the `/api/auth/google/` endpoint configured
- Accepts POST requests with this payload format:
```json
{
  "id_token": "google-jwt-token-here",
  "role": "planner" // optional
}
```

## 3. Expected Response Format

The backend should return:
```json
{
  "refresh": "jwt-refresh-token",
  "access": "jwt-access-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "planner"
  },
  "is_new_user": true/false,
  "login_provider": "google"
}
```

## 4. Common 400 Error Causes

1. **Invalid Google Client ID**: Frontend and backend have different client IDs
2. **Missing id_token**: Google authentication didn't provide a valid token
3. **Backend serializer validation**: Django serializer rejecting the payload
4. **CORS issues**: Backend not accepting requests from frontend origin
5. **Malformed request**: Missing Content-Type headers or invalid JSON

## 5. Debugging Steps

### Step 1: Check Browser Console
Open browser DevTools → Console and look for:
- Google authentication logs showing token received
- API request details (URL, payload, headers)
- Detailed error information including server response

### Step 2: Check Network Tab
Open DevTools → Network → XHR/Fetch:
- Find the POST request to `/api/auth/google/`
- Check Request Headers, Request Payload, and Response

### Step 3: Check Backend Logs
Look at your Django server console for:
- Incoming request details
- Serializer validation errors
- Any authentication-related error messages

## 6. Quick Fix Checklist

- [ ] Google Client ID is set in both frontend .env and backend settings
- [ ] Backend server is running on http://localhost:8000
- [ ] Backend has CORS configured for frontend origin
- [ ] Google OAuth is properly configured in Google Console
- [ ] Frontend can reach backend (no network blocks/firewalls)

## 7. Test Commands

### Start Backend (Django)
```bash
python manage.py runserver 8000
```

### Start Frontend (React)
```bash
npm start
```

### Test API Endpoint Manually
```bash
curl -X POST http://localhost:8000/api/auth/google/ \
  -H "Content-Type: application/json" \
  -d '{"id_token": "test-token"}'
```

If this returns a proper error message, the endpoint is working and the issue is with the Google token.

## 8. Need More Help?

The enhanced error handling will now show you:
- Detailed console logs of the authentication flow
- Specific error messages from the backend
- Request/response debugging information

Check the browser console after attempting Google sign-in to get specific error details.