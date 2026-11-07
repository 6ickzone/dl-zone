<div align="center">

<h1>⚡ dl-zone</h1>

[![Status: Beta](https://img.shields.io/badge/STATUS-BETA%20%2F%20WIP-cyan?style=for-the-badge&logo=codeforces&logoColor=black)](https://github.com/6ickzone/dl-zone)
[![License](https://img.shields.io/badge/LICENSE-MIT-blue?style=for-the-badge)](https://github.com/6ickzone/dl-zone/blob/main/LICENSE)
[![Contributions: Welcome](https://img.shields.io/badge/CONTRIBUTIONS-WELCOME-magenta?style=for-the-badge&logo=git&logoColor=white)](https://github.com/6ickzone/dl-zone/pulls)
[![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Backend-Express.js-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Docker](https://img.shields.io/badge/Deploy-Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Google Cloud Run](https://img.shields.io/badge/Cloud-Google_Cloud_Run-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/run)

**Advanced Web Downloader & Pipeline Media Engine**

</div>

---

> ⚠️ **Notice:** This project is currently under active development (**Beta / Work in Progress**). Download pipelines, proxy systems, and conversion modules are being refactored regularly. If you encounter bugs, broken streams, or want to help fix issues related to corrupted files, **Pull Requests** and **Issues** are warmly welcomed!

---

> All-in-one multi-platform downloader for watermark-free videos, photos, music, and reels from 17 popular platforms at ultra-high speeds — free forever, without ads.

---

## ✨ Key Features

- 🎵 **TikTok**: Download watermark-free HD videos (1080p), original audio MP3s, and photo slide carousels via TikWM.
- 📸 **Instagram**: Reels, Post Photos & Videos, Carousel albums, and IGTV with direct stream decoding.
- 🔴 **YouTube**: Shorts and regular videos with multi-resolution choices (up to 4K Ultra HD) and 320kbps MP3 audio conversion.
- 📘 **Facebook**: Public videos and FB Reels with dual stream options (HD & SD).
- 🐦 **Twitter / X**: Crystal-clear MP4 videos and animated GIFs.
- 📌 **Pinterest**: High-definition original image extraction via Pinterest Pidgets API.
- 🎶 **Spotify & SoundCloud**: Instant track metadata, cover art, and stream previews.
- 🌐 **Multi-Language Support**: Seamless bilingual support (**English by default**, with one-click toggle to Bahasa Indonesia).
- 📡 **Real-Time Live Network Status**: Live active user indicators, today's processed download counter, ~1.2s response latency, and a real-time download activity stream.
- 🛡️ **Built-in Proxy Downloader**: Server-side streaming endpoint (`/api/proxy-download`) that bypasses client-side CORS limitations, prevents CDN hotlink blocks, and attaches clean `Content-Disposition` attachment headers for instant device saving.
- ⚡ **Smart Multi-Resolver Fallback Engine**: Multi-tiered API resolver that gracefully falls back to secondary scrapers whenever primary endpoints face rate limits.
- 📱 **Modern Neon-Dark Glassmorphism**: Tailored for mobile, tablet, and desktop devices with interactive video/audio players, QR code mobile scanning, and one-click clipboard paste.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React icons
- **Backend**: Express.js (Node.js runtime), Axios, Streaming Pipes
- **Build System**: Vite 6, tsx
- **Containerization**: Docker (Multi-stage build)
- **Cloud Infrastructure**: Google Cloud Run (Serverless container deployment)

---

## 🚀 Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) version 18 or 20+
- `npm` or `yarn`

### 1. Clone Repository
```bash
git clone https://github.com/6ickzone/dl-zone.git
cd dl-zone
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
The app will be accessible at `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🐳 Running with Docker

This project comes with an optimized, lightweight production multi-stage `Dockerfile`:

```bash
# Build Docker image
docker build -t dl-zone .

# Run container on port 8080
docker run -p 8080:8080 dl-zone
```
Open your browser and visit `http://localhost:8080`.

---

## ☁️ Deploy to Google Cloud Run

Deploy directly to **Google Cloud Run** using the Google Cloud SDK (`gcloud`):

```bash
# Set your active Google Cloud project
gcloud config set project <YOUR_PROJECT_ID>

# Deploy directly from the project directory to asia-southeast1 (Singapore)
gcloud run deploy dl-zone \
  --source . \
  --region=asia-southeast1 \
  --allow-unauthenticated \
  --port=8080
```

Cloud Build automatically builds the container image and generates an HTTPS Cloud Run endpoint ready for production traffic.

---

## 📂 Project Structure

```text
├── src/
│   ├── components/      # UI Components (Navbar, HeroDownloader, MediaResultCard, Faq, Stats, Footer, etc.)
│   ├── context/         # React Contexts (LanguageContext for EN/ID i18n)
│   ├── data/            # Static data configurations (platforms, faq)
│   ├── types/           # TypeScript interface definitions
│   ├── utils/           # Media metadata resolver and download triggers
│   ├── App.tsx          # Main React Application
│   ├── main.tsx         # React DOM entry point
│   └── index.css        # Tailwind CSS v4 styling rules
├── server.ts            # Express backend (resolver APIs & CORS-bypass stream proxy)
├── Dockerfile           # Production multi-stage Docker container build
├── .dockerignore        # Build ignore definitions
├── package.json         # Dependencies and lifecycle scripts
├── vite.config.ts       # Vite configuration
└── README.md            # Project documentation
```

---

## 📤 Pushing to GitHub

If you are setting up a fresh repository on GitHub:

```bash
# 1. Initialize git (if not already done)
git init

# 2. Stage all files
git add .

# 3. Create initial commit
git commit -m "feat: complete Downloader Zone multi-platform app with live stats & EN/ID i18n"

# 4. Switch branch to main
git branch -M main

# 5. Link your GitHub remote repository
git remote add origin https://github.com/6ickzone/dl-zone.git

# 6. Push to GitHub
git push -u origin main
```

---

## 🙏 Credits & Acknowledgments

The **Downloader Zone** project is powered by a combination of custom engineering, trusted open-source tools, and public community API services. We extend our gratitude and appreciation to:

### 🌐 Media Resolvers & Public APIs
- **[TikWM](https://tikwm.com/)** – Public API for watermark-free TikTok video and audio extraction.
- **[SnapSave Community](https://github.com/topics/snapsave)** & **`snapsave-media-downloader`** – Resolver algorithms for decoding Instagram Reels and Facebook HD video streams.
- **[Pinterest Pidgets API](https://widgets.pinterest.com/)** – Public endpoint for retrieving original high-resolution Pinterest photos and metadata.
- **[YouTube oEmbed & iFrame API](https://developers.google.com/youtube)** – Official oEmbed endpoints for YouTube title, duration, and thumbnail rendering.
- **[Spotify oEmbed](https://developer.spotify.com/documentation/embeds)** & **[SoundCloud oEmbed](https://developers.soundcloud.com/docs/api/reference#oembed)** – High-fidelity music and album embed metadata services.

### 💻 Open Source Frameworks & Tools
- **[React 19](https://react.dev/)** & **[Vite](https://vitejs.dev/)** – Fast frontend framework and instantaneous dev server.
- **[Tailwind CSS v4](https://tailwindcss.com/)** – Utility-first CSS framework providing responsive neon-dark glassmorphism styling.
- **[Lucide Icons](https://lucide.dev/)** – Clean, modern icon suite.
- **[Express.js](https://expressjs.com/)** – Node.js web server powering the proxy stream pipeline and bypassing CORS.

---

## 📄 License & Disclaimer

This project is created for educational, research, and personal media archiving purposes. Please respect the copyright and Terms of Service of each social media platform. All trademarks, logos, and third-party media content belong to their respective copyright holders.
