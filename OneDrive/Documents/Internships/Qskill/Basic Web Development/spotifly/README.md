# 🎵 SpotiFly — Spotify-Style Song Downloader

A full-stack web application inspired by Spotify's design — dark mode, green accents, and a clean dashboard for downloading music via Spotify links.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v16 or higher
- **npm** (comes with Node.js)

### Setup

```bash
# 1. Navigate into project folder
cd spotifly

# 2. Install dependencies
npm install

# 3. Start the server
npm start

# 4. Open in browser
# Go to: http://localhost:3000
```

For development with auto-reload:
```bash
npm run dev   # requires nodemon (installed as devDependency)
```

---

## 📁 Project Structure

```
spotifly/
├── server.js                  # Express server + routes
├── package.json
├── data/
│   └── users.json             # Auto-created; stores user accounts
├── routes/
│   ├── auth.js                # Auth route definitions
│   └── download.js            # Download route definitions
├── controllers/
│   ├── authController.js      # Signup, login, logout logic
│   └── downloadController.js  # Spotify link parsing + download
└── public/
    ├── index.html             # Sign In page
    ├── signup.html            # Sign Up page
    ├── dashboard.html         # Protected dashboard
    ├── css/
    │   └── styles.css         # Full Spotify-inspired theme
    └── js/
        └── dashboard.js       # Dashboard logic, download flow
```

---

## 🔐 Authentication System

- **Signup** → Passwords hashed with **bcryptjs** (12 salt rounds)
- **Login** → Session created via **express-session** (24hr expiry)
- **Dashboard** → Server-side session guard (redirects to `/` if not logged in)
- **Logout** → Session destroyed, cookie cleared
- Users stored in `data/users.json` (flat-file DB — swap for MongoDB in production)

---

## 🔗 Spotify Link Handling Logic

### How it works:

1. **User pastes** a Spotify URL or URI into the input field
2. **Frontend validates** the format using regex before sending to server
3. **Backend parses** the track ID:
   - `https://open.spotify.com/track/{trackId}?si=...` → extracts `{trackId}`
   - `spotify:track:{trackId}` → extracts `{trackId}`
4. **Track info** is looked up from the mock track database (or Spotify API if configured)
5. **Download** proxies a royalty-free MP3 file through the server

### Supported link formats:
```
https://open.spotify.com/track/4iJyoBOLtHqaWYs3ScKj1J
https://open.spotify.com/track/4iJyoBOLtHqaWYs3ScKj1J?si=abc123
spotify:track:4iJyoBOLtHqaWYs3ScKj1J
```

---

## 🎵 Download Feature

- Backend fetches a demo MP3 and **proxies it** through the Express server
- Frontend triggers a real file download using `Blob` + `<a>` element
- Progress bar animates during download
- Download history saved in **localStorage** per browser session

---

## ⚠️ Limitations & Legal Notes

1. **Simulated downloads**: The app uses a public domain sample MP3 for demonstration. It does NOT rip actual Spotify audio.
2. **Real Spotify API** requires OAuth credentials from [Spotify Developer Dashboard](https://developer.spotify.com/). To get real metadata (title, artist, album art), replace the mock track database in `downloadController.js` with Spotify API calls.
3. **Downloading copyrighted music** without authorization violates Spotify's Terms of Service and copyright law. This app is for **educational/demo purposes only**.
4. **YouTube DL integration** (e.g., yt-dlp) can be added server-side to actually fetch audio matching the Spotify track name — but legality depends on jurisdiction and usage.

---

## 🔧 Upgrading to Real Spotify API

1. Go to [developer.spotify.com](https://developer.spotify.com) → Create an App
2. Add your **Client ID** and **Client Secret** to a `.env` file:
   ```
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   ```
3. Install: `npm install dotenv node-fetch`
4. In `downloadController.js`, replace the mock lookup with:
   ```js
   const token = await getSpotifyToken(); // client_credentials flow
   const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
     headers: { Authorization: `Bearer ${token}` }
   });
   ```

---

## 🎨 UI Features

- Spotify-inspired dark theme with green accents
- Sidebar navigation with active states
- Animated equalizer bars
- Toast notifications (success / error / info)
- Download progress bar
- Responsive layout (mobile sidebar with overlay)
- Shimmer skeleton animations
- Download history with timestamps
- User profile page with stats

---

## 📱 Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| > 900px | Sidebar + main 2-column layout |
| ≤ 900px | Full-width; sidebar slides in from left |
| ≤ 600px | Stacked URL input; full-width cards |

---

Made with ❤️ — SpotiFly Demo App
