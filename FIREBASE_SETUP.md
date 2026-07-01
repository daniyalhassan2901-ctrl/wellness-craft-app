# Daniyal Fitness — Firebase Setup

Follow these steps once to connect your Firebase backend. All keys below are Firebase **web** (publishable) config — safe to expose in your frontend.

## 1. Create a Firebase project
1. Go to <https://console.firebase.google.com> → **Add project**.
2. Give it a name (e.g. `daniyal-fitness`), disable analytics if you don't need it.

## 2. Add a Web App
1. In the project overview, click the **Web** icon (`</>`).
2. Register the app with a nickname; no need to enable Firebase Hosting.
3. Copy the `firebaseConfig` object — you'll paste each value into `.env`.

## 3. Fill in `.env`
Copy `.env.example` → `.env` and paste:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Restart the dev server after editing `.env`.

On **Vercel**, add the same variables under Project → Settings → Environment Variables.

## 4. Enable Auth providers
Firebase Console → **Authentication** → **Get started**.
- Enable **Email/Password**.
- Enable **Google** (add a support email, save).
- Under **Settings → Authorized domains**, add your Vercel domain and your Lovable preview domain.

## 5. Create Firestore database
Firebase Console → **Firestore Database** → **Create database** → start in **production mode** → pick a region.

## 6. Firestore security rules
Paste these rules under Firestore → **Rules** → Publish. Each user can read/write only their own data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /{sub=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## 7. (Optional) Firebase Storage
For profile pictures. Firebase Console → **Storage** → **Get started**. Use these rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Data model

All user data lives under `users/{uid}` with these sub-collections:

- `users/{uid}` — profile document (name, age, height, weight, goals…)
- `users/{uid}/dailyLogs/{YYYY-MM-DD}` — foods + water for one day
- `users/{uid}/weights/{id}` — weight entries
- `users/{uid}/favorites/{foodId}` — favorite foods
- `users/{uid}/recentFoods/{foodId}` — recently used foods
- `users/{uid}/diaries/{id}` — diary entries

The food database itself is bundled in `src/data/foods.ts` (no Firestore round-trip needed).

## Deploy to Vercel
1. Push this repo to GitHub (Lovable's `+ → GitHub → Connect` handles this).
2. In Vercel: **New Project → Import** the repo.
3. Framework preset: **Other** — Vercel auto-detects Vite/TanStack.
4. Add the six `VITE_FIREBASE_*` env vars.
5. Deploy.
