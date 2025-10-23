# Authentication Flow Changes - October 2025

## 🔄 What Changed?

We've unified the authentication system to work seamlessly with both Firebase and Django backends.

## ✨ New Signup Flow

When a user signs up via the **Sign Up** form, the system now:

1. ✅ Creates user in **Firebase Authentication**
2. ✅ Creates user profile in **Firestore**
3. ✅ **NEW:** Also creates user in **Django database** (for email/password login)

### Why This Change?

**Before:**
- Sign up → Only Firebase + Firestore
- Login with email/password → ❌ Failed (user not in Django)
- Had to manually sync users with `python manage.py sync_firebase_users`

**After:**
- Sign up → Firebase + Firestore + Django ✅
- Login with email/password → ✅ Works immediately
- No manual sync needed for new users

---

## 🎯 Authentication Methods Now Available

### 1. **Google Sign-In** (Recommended)
- Click "Continue with Google"
- Automatically creates account in both Firebase **and** Django
- Best for users who prefer social login

### 2. **Email/Password Registration**
- Fill out the Sign Up form
- Creates account in Firebase **and** Django
- Can login immediately after signup

### 3. **Email/Password Login**
- Works for users who signed up via form
- Works for users who used Google Sign-In previously
- Authenticates against Django backend

---

## 🛠️ For Existing Users (Before This Update)

If you or your teammates created accounts **before this change**, you need to sync once:

```bash
cd backend
python3.10 manage.py sync_firebase_users
```

This will import all existing Firebase users into Django database.

**After syncing:** Everyone can login with email/password! ✅

---

## 🔐 Login Troubleshooting

### Problem: "401 Unauthorized" when trying to login

**Possible Causes:**
1. Account created before the sync update
2. Account only exists in Firebase, not Django

**Solutions:**

**Option 1: Use Google Sign-In** (Easiest)
- Just click "Continue with Google"
- Works for all accounts

**Option 2: Sync Firebase Users** (For admins)
```bash
cd backend
python3.10 manage.py sync_firebase_users
```

**Option 3: Create New Account** (If needed)
- Sign up again with a different email
- New signups automatically work with both login methods

---

## 📊 User Storage Architecture

| Component | Purpose | Users Stored |
|-----------|---------|--------------|
| **Firebase Auth** | Google OAuth, email/password auth | All users |
| **Firestore** | User profiles, events, guests | All users |
| **Django DB** | Backend authentication, permissions | All users (after sync/signup) |

### Why Three Databases?

- **Firebase Auth**: Industry-standard authentication, handles OAuth
- **Firestore**: Real-time data for events and guests
- **Django**: Backend API, user management, role-based permissions

---

## 🧪 Testing the New Flow

### Test New User Signup:
1. Go to Sign Up page
2. Fill out the form with a **new email**
3. Submit
4. Immediately try to login with that email/password
5. ✅ Should work without any sync command!

### Verify User Created in Both Systems:

**Check Firebase:**
```
Go to Firebase Console → Authentication → Users
```

**Check Django:**
```bash
cd backend
python3.10 manage.py shell

# In shell:
from authentication.models import User
User.objects.filter(email='new-user@example.com').exists()
# Should return True
```

---

## 🚨 Important Notes

1. **Passwords are NOT synced** between Firebase and Django
   - Each system maintains its own password hash
   - This is intentional for security

2. **Django registration is non-blocking**
   - If Django registration fails, Firebase signup still succeeds
   - User can still login with Google
   - Check logs if Django registration fails

3. **Username = Email**
   - All users use their email as username
   - This prevents conflicts between systems

4. **Default Role = "planner"**
   - All signups default to "planner" role
   - Admins can change roles later via Django admin or API

---

## 📝 For Developers

### Code Changes:

**File:** `frontend/src/services/AuthService.ts`

**What was added:**
- After Firebase user creation, also call Django `/api/auth/register/`
- Parse user name into first_name/last_name for Django
- Handle Django registration failures gracefully (non-blocking)
- Log success/failure for debugging

**Error Handling:**
- Firebase errors → Thrown to user (critical)
- Django errors → Logged as warning (non-critical)
- User can still login with Firebase/Google if Django fails

---

## 🔮 Future Improvements

Consider:
- [ ] Single Sign-On (SSO) for enterprise
- [ ] Password sync between Firebase and Django
- [ ] Automatic role assignment based on email domain
- [ ] Multi-factor authentication (MFA)

---

## 💬 Questions?

If you encounter issues:
1. Check `SETUP_GUIDE.md` for setup instructions
2. Run `python manage.py sync_firebase_users` to sync existing users
3. Contact team lead or check team chat

---

**Last Updated:** October 22, 2025  
**Author:** Development Team  
**Status:** ✅ Active and Working
