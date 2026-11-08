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

> Downloader that fetches the real file from a public link you paste. There are no sample URLs, dummy metadata, or fake quality options: every result must come from media actually found at that link.

---

## ✨ Key Features

- 🎵 **TikTok**: Public MP4 video without watermark plus MP3 audio converted with ffmpeg.
- 📸 **Instagram**: Reels and video posts as MP4, photos as JPG, and MP3 audio.
- 📘 **Facebook**: Public videos and Reels as MP4 plus MP3 audio.
- 🐦 **Twitter / X**: Active post videos as MP4, photos as JPG, and MP3 audio.
- 📌 **Pinterest**: Original-resolution JPG images.
- 🔴 **YouTube**: Single public videos up to 1080p, with the original video and audio streams merged by ffmpeg, plus MP3 conversion.
- 🟣 **Twitch Clips**: Public clips in the available MP4 qualities plus MP3 conversion.
- 🎶 **Spotify & Apple Music**: Original cover art and a clear notice that their audio is DRM-protected.
- 🌐 **Multi-Language Support**: Bilingual English/Indonesian interface.
- 🛡️ **Built-in Proxy Downloader**: `/api/proxy-download` streams files with attachment headers and SSRF validation, avoiding client-side CORS and CDN hotlink issues.
- ⚡ **Real Source Checks**: The frontend performs a `HEAD` check before saving, and the server returns a clear error when a source is private, expired, unsupported, or unavailable.
- 📱 **Responsive Neon-Dark UI**: Mobile, tablet, and desktop layouts with video/audio previews and one-click clipboard paste.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Vite, Lucide React
- **Backend**: Express.js on Node.js, streaming pipes
- **Media extraction**: `@distube/ytdl-core` for YouTube, public Twitch GQL for clips, and platform-specific resolvers
- **Conversion**: `ffmpeg-static` for MP4 muxing and MP3 encoding
- **Runtime**: Node.js 22.22+ (the included Docker image uses Bun 1.x)
- **Containerization**: Docker multi-stage build
- **Cloud**: Google Cloud Run or any host that runs a persistent Node/Bun process

---

## 🚀 Local Development Setup

### Prerequisites

- Node.js 22.22+ (required by `@distube/ytdl-core`)
- Bun 1.x

### 1. Clone Repository

```bash
git clone https://github.com/6ickzone/dl-zone.git
cd dl-zone
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Start Development Server

```bash
bun run dev
```

The app is available at `http://localhost:3000`. Express and Vite share the same port.

### 4. Build for Production

```bash
bun run build
NODE_ENV=production bun start
```

The production server serves `dist/` and every `/api/*` endpoint from the same Express process.

---

## 🐳 Running with Docker

```bash
# Build the image
docker build -t dl-zone .

# Run the container on port 8080
docker run -p 8080:8080 dl-zone
```

Open `http://localhost:8080`.

---

## ☁️ Deploy to Google Cloud Run

```bash
# Set your active Google Cloud project
gcloud config set project <YOUR_PROJECT_ID>

# Deploy to asia-southeast1 (Singapore)
gcloud run deploy dl-zone \
  --source . \
  --region=asia-southeast1 \
  --allow-unauthenticated \
  --port=8080
```

Cloud Build builds the container image and provides an HTTPS Cloud Run endpoint.

> **Static hosting will not work.** GitHub Pages, Netlify static output, and similar hosts only serve `dist/`; they cannot run Express, ffmpeg, or the `/api/*` endpoints. Use a Node/container host instead.

---

## 📂 Project Structure

```text
├── src/
│   ├── components/      # UI (hero, media result, platform grid, history, footer)
│   ├── context/         # EN/ID language context
│   ├── data/            # Supported platform definitions
│   ├── utils/           # API calls and download triggers
│   ├── types.ts         # Shared TypeScript types
│   ├── App.tsx          # Main React application
│   ├── main.tsx         # React entry point
│   └── index.css        # Tailwind CSS v4 styling
├── server.ts            # Express resolvers, stream proxy, ffmpeg conversion
├── Dockerfile           # Production multi-stage container build
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
└── README.md            # Project documentation
```

---

## 📤 Pushing to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/6ickzone/dl-zone.git
git push -u origin main
```

---

## 🙏 Credits & Acknowledgments

### Media Sources & Protocols

- **TikTok, Instagram, Facebook, X, and Pinterest** – Public page metadata and platform endpoints resolved by the server.
- **YouTube** – [`@distube/ytdl-core`](https://github.com/distubejs/ytdl-core) for public video metadata and streams.
- **Twitch Clips** – Public Twitch GQL endpoint and signed clip playback URLs.
- **Spotify** – Public oEmbed metadata for cover art.

### Open Source Tools

- **[React 19](https://react.dev/)** and **[Vite](https://vitejs.dev/)** – Frontend framework and build tooling.
- **[Tailwind CSS v4](https://tailwindcss.com/)** – Responsive neon-dark styling.
- **[Lucide Icons](https://lucide.dev/)** – Icon set.
- **[Express.js](https://expressjs.com/)** – Web server and streaming proxy.
- **[ffmpeg-static](https://github.com/eugeneware/ffmpeg-static)** – Bundled ffmpeg binary for MP4 muxing and MP3 conversion.

---

## 📄 License & Disclaimer

This project is released under the **MIT License**. See [LICENSE](LICENSE) for details.

It is intended for educational, research, and personal media archiving purposes. Please respect the copyright and Terms of Service of each platform. All trademarks, logos, and third-party media content belong to their respective copyright holders. Only download content you have the right to save.
