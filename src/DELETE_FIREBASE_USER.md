# Delete Old Firebase User

Your old registration created a user in Firebase only (not Django).
You need to delete it before you can register again with the same email.

## Option 1: Firebase Console (Easiest)

1. Go to https://console.firebase.google.com/
2. Select project: **deco-ad56f**
3. Click **Authentication** in left sidebar
4. Click **Users** tab
5. Find your email in the list
6. Click the three dots (⋮) on the right
7. Click **Delete user**
8. Confirm deletion

## Option 2: Use Different Email

Just register with a different email address!

## After Deleting

1. Go to http://localhost:5173/signup
2. Fill in the form
3. Click "Sign Up"
4. Should work now! ✅
5. Then test login at http://localhost:5173/signin

## Verify Backend is Running

Before testing, make sure Django backend is running:

```bash
cd backend
python3 manage.py runserver
```

You should see:
```
Starting development server at http://127.0.0.1:8000/
```

