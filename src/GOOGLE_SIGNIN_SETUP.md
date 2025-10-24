# Google Sign-In Setup Guide

## Error: "The given origin is not allowed for the given client ID"

This error occurs when your application's origin is not authorized in Google Cloud Console.

## Quick Fix Steps

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/apis/credentials

### 2. Select Your Project
Look for the project with Client ID: `39518858179-okj6ufls3a79hhc9t35dr455cj66b3g9`

### 3. Click on the OAuth 2.0 Client ID

### 4. Add These Authorized JavaScript Origins:
```
http://localhost:3000
http://127.0.0.1:3000
http://localhost:8000
http://127.0.0.1:8000
```

For production, also add:
```
https://yourdomain.com
https://www.yourdomain.com
```

### 5. Add These Authorized Redirect URIs:
```
http://localhost:3000
http://localhost:3000/signin
http://localhost:3000/signup
http://127.0.0.1:3000
http://127.0.0.1:3000/signin
```

For production:
```
https://yourdomain.com
https://yourdomain.com/signin
https://yourdomain.com/signup
```

### 6. Click "SAVE" at the bottom

### 7. Wait 5-10 minutes for changes to propagate

### 8. Clear browser cache and reload your app

## Current Configuration

- **Frontend URL**: http://localhost:3000
- **Backend URL**: http://localhost:8000
- **Google Client ID**: `39518858179-okj6ufls3a79hhc9t35dr455cj66b3g9.apps.googleusercontent.com`

## Testing

After updating the Google Cloud Console:

1. Clear your browser cache (Cmd+Shift+Delete on Mac, Ctrl+Shift+Delete on Windows)
2. Close all browser tabs
3. Open http://localhost:3000
4. Try Google Sign-In again

## Common Issues

### Issue: Still getting 403 error after adding origins
**Solution**: Wait 5-10 minutes for Google's servers to propagate the changes

### Issue: Error says "redirect_uri_mismatch"
**Solution**: Make sure the redirect URIs match exactly (including trailing slashes)

### Issue: Using a different port?
**Solution**: Check `vite.config.ts` for the actual port and add it to authorized origins

## Environment Variables

Your `.env` file should have:
```
VITE_GOOGLE_CLIENT_ID=39518858179-okj6ufls3a79hhc9t35dr455cj66b3g9.apps.googleusercontent.com
```

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In for Web](https://developers.google.com/identity/gsi/web/guides/overview)
