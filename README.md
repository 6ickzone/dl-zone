# ⚡ Downloader Zone

> **All-in-One Multi-Platform Media Downloader**  
> Unduh video, foto, audio, dan reels tanpa watermark dari berbagai platform dengan kecepatan tinggi, gratis, dan tanpa iklan mengganggu.

[![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Backend-Express.js-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Docker](https://img.shields.io/badge/Deploy-Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Google Cloud Run](https://img.shields.io/badge/Cloud-Google_Cloud_Run-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/run)

---

## ✨ Fitur Utama

- 🎵 **TikTok**: Download video HD No-Watermark, Watermark, Audio MP3, dan Photo Slide carousel.
- 📸 **Instagram**: Reels, Post Foto/Video, Carousel album, dan IGTV.
- 🔴 **YouTube**: Shorts dan Video reguler dengan pilihan resolusi dan opsi audio MP3.
- 📘 **Facebook**: Reels dan video publik (kualitas HD & SD).
- 🐦 **Twitter / X**: Video dan GIF dalam format MP4 jernih.
- 🧵 **Platform Lainnya**: Threads, Pinterest, SoundCloud, dan platform media sosial populer lainnya.
- 🛡️ **Built-in Proxy Downloader**: Dilengkapi endpoint backend stream proxy (`/api/proxy-download`) untuk melewati restriksi CORS serta memastikan unduhan langsung tersimpan di perangkat pengguna dengan nama file yang rapi.
- ⚡ **Auto Fallback Engine**: Sistem multi-resolver pintar yang otomatis beralih ke engine cadangan jika salah satu API platform sedang down atau membatasi akses.
- 📱 **Desain Responsif & Modern**: Tampilan dark-neon glassmorphism yang responsif untuk ponsel, tablet, dan desktop.
- 📋 **One-Click Paste**: Tombol tempel otomatis dari clipboard untuk kenyamanan pengguna.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React icons
- **Backend**: Express.js (Node.js runtime), Axios, Multer / Stream proxy
- **Build Tool**: Vite 6, tsx
- **Container & Deployment**: Docker (Multi-stage build), Google Cloud Run

---

## 🚀 Panduan Menjalankan Secara Lokal

### Prasyarat
- [Node.js](https://nodejs.org/) versi 18 atau 20+
- `npm` atau `yarn`

### 1. Clone Repository
```bash
git clone https://github.com/USERNAME_ANDA/downloaderz.git
cd downloaderz
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Jalankan Server Development
```bash
npm run dev
```
Aplikasi akan aktif di `http://localhost:3000`.

### 4. Build untuk Production
```bash
npm run build
npm start
```

---

## 🐳 Menjalankan dengan Docker

Proyek ini telah dilengkapi dengan `Dockerfile` multi-stage yang optimal:

```bash
# Build image Docker
docker build -t downloaderz .

# Jalankan container pada port 8080
docker run -p 8080:8080 downloaderz
```
Buka browser dan akses `http://localhost:8080`.

---

## ☁️ Deploy ke Google Cloud Run

Aplikasi siap dideploy ke **Google Cloud Run** menggunakan Google Cloud SDK (`gcloud`):

```bash
# Set project Google Cloud aktif
gcloud config set project <PROJECT_ID_ANDA>

# Deploy langsung dari direktori proyek ke region asia-southeast1 (Singapura)
gcloud run deploy downloaderz \
  --source . \
  --region=asia-southeast1 \
  --allow-unauthenticated \
  --port=8080
```

Cloud Build akan otomatis membangun container image dan memberikan URL HTTPS Cloud Run yang siap diakses publik.

---

## 📂 Struktur Proyek

```text
├── src/
│   ├── components/      # Komponen UI (Navbar, DownloaderForm, MediaPreview, Faq, dll.)
│   ├── services/        # Service API client (resolving link, format converter)
│   ├── types/           # Definisi tipe TypeScript
│   ├── App.tsx          # Komponen utama aplikasi
│   ├── main.tsx         # Entry point React
│   └── index.css        # Konfigurasi Tailwind CSS v4
├── server.ts            # Backend Express (API resolver & proxy stream downloader)
├── Dockerfile           # Konfigurasi Docker multi-stage production
├── .dockerignore        # File ignore untuk Docker build
├── package.json         # Dependensi dan skrip proyek
├── vite.config.ts       # Konfigurasi Vite
└── README.md            # Dokumentasi proyek
```

---

## 📤 Cara Push ke GitHub

Jika Anda baru membuat repository kosong di GitHub:

```bash
# 1. Inisialisasi git (jika belum)
git init

# 2. Tambahkan semua file
git add .

# 3. Buat commit pertama
git commit -m "feat: initial commit Downloader Zone app"

# 4. Ubah branch ke main
git branch -M main

# 5. Tambahkan remote repository GitHub Anda
git remote add origin https://github.com/USERNAME_ANDA/downloaderz.git

# 6. Push ke GitHub
git push -u origin main
```

---

## 🙏 Kredit & Ucapan Terima Kasih (Thanks To)

Proyek **Downloader Zone** dibangun menggunakan kombinasi custom code, library open-source terpercaya, serta layanan API publik dari komunitas developer. Terima kasih dan apresiasi sebesar-besarnya kami sampaikan kepada:

### 🌐 Media Resolver & Public APIs
- **[TikWM](https://tikwm.com/)** – Layanan API publik tanpa watermark untuk ekstraksi video dan audio TikTok.
- **[SnapSave Community](https://github.com/topics/snapsave)** & **`snapsave-media-downloader`** – Library resolver untuk decoding stream video Instagram Reels dan Facebook HD.
- **[Pinterest Pidgets API](https://widgets.pinterest.com/)** – Public endpoint untuk metadata gambar dan resolusi asli Pinterest.
- **[YouTube oEmbed & iFrame API](https://developers.google.com/youtube)** – Endpoint resmi oEmbed untuk parsing judul dan thumbnail video YouTube.
- **[Spotify oEmbed](https://developer.spotify.com/documentation/embeds)** & **[SoundCloud oEmbed](https://developers.soundcloud.com/docs/api/reference#oembed)** – Layanan embed metadata musik dan album.

### 💻 Open Source Frameworks & Tools
- **[React](https://react.dev/)** & **[Vite](https://vitejs.dev/)** – Pondasi frontend modern berkecepatan tinggi.
- **[Tailwind CSS](https://tailwindcss.com/)** (v4) – Utility-first CSS framework untuk styling glassmorphism dark-mode yang elegan.
- **[Lucide Icons](https://lucide.dev/)** – Koleksi icon open-source yang clean dan konsisten.
- **[Express.js](https://expressjs.com/)** – Web framework Node.js untuk proxy stream download, bypass CORS, dan caching.

### 🎨 Inspirasi Desain
- **Zeta Download / Zetabot** (`zetabot.eu.cc`) – Referensi inspirasi UI layout modern, icon grid 20 platform, dan arsitektur form tempel link.
- **6ickzone** – Branding, ide konsep, dan penyesuaian fungsionalitas Downloader Zone.

---

## 📄 Lisensi & Disclaimer

Proyek ini dibuat untuk tujuan edukasi, penelitian, dan penggunaan arsip pribadi. Pastikan Anda mematuhi kebijakan hak cipta serta ketentuan layanan dari masing-masing platform media sosial yang Anda unduh. Seluruh merk dagang, logo, dan konten adalah hak cipta dari masing-masing pemilik aslinya.

