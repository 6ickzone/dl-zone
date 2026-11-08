# ⚡ Downloader Zone

Downloader yang mengambil file langsung dari tautan publik yang Anda tempel. Tidak ada URL contoh, metadata dummy, atau kualitas palsu: setiap opsi unduhan harus berasal dari file yang benar-benar ditemukan pada tautan tersebut.

## Platform yang benar-benar didukung

| Platform | Hasil nyata |
| --- | --- |
| TikTok | Video MP4 tanpa watermark + audio MP3 (ffmpeg) |
| Instagram | Reels/video MP4, foto JPG, audio MP3 (ffmpeg) |
| Facebook | Video/Reels MP4 publik + audio MP3 (ffmpeg) |
| X / Twitter | Video MP4 dan foto dari post aktif + audio MP3 (ffmpeg) |
| Pinterest | Foto JPG resolusi asli |
| YouTube | Video MP4 144p–1080p dengan audio asli digabung ffmpeg + MP3 (ffmpeg) |
| Twitch Clips | Klip MP4 360p–1080p + MP3 (ffmpeg) |

Tautan Spotify dan Apple Music mengembalikan cover art asli beserta penjelasan bahwa audionya ber-DRM dan tidak dapat diunduh. SoundCloud dan Vimeo memerlukan akses HLS/DASH, sehingga aplikasi menampilkan pesan error yang jelas alih-alih menawarkan tombol unduhan palsu. Playlist YouTube, siaran langsung, VOD Twitch, dan klip privat juga tidak didukung.

## Cara kerja

1. `POST /api/parse` menerima URL runtime dari pengguna, memvalidasinya, lalu menjalankan resolver sesuai platform.
2. Resolver mengembalikan URL media asli (CDN) beserta ukuran file bila tersedia. Tidak ada fallback ke URL statis.
3. `/api/proxy-download` melakukan streaming file dengan header unduhan dan validasi anti-SSRF.
4. `/api/convert` menjalankan `ffmpeg` pada stream media asli untuk menghasilkan MP3 192 kbps. File MP3 diverifikasi berasal dari video yang diunduh, bukan stream dummy.
5. YouTube memakai stream video dan audio terpisah dari `@distube/ytdl-core`; `/api/youtube/video` menggabungkannya dengan ffmpeg, sedangkan `/api/youtube/audio` mengonversi audio ke MP3.
6. Frontend memeriksa endpoint dengan `HEAD` sebelum memulai unduhan, lalu menampilkan error sumber jika gagal.

## Menjalankan secara lokal

```bash
bun install
bun run dev
```

Aplikasi berjalan di `http://localhost:3000`. Server Express dan Vite memakai port yang sama.

## Build produksi (butuh runtime Node/Bun)

```bash
bun run build   # menghasilkan dist/
NODE_ENV=production bun start
```

Server produksi menyajikan `dist/` dan seluruh endpoint `/api/*` dari proses Express yang sama.

## Deploy

**Penting:** hosting statis (termasuk Freebuff Deploy untuk proyek Vite) hanya mengunggah `dist/`. Express, proxy, dan ffmpeg tidak ikut berjalan, sehingga `/api/*` akan 404. Aplikasi akan menampilkan pesan bahwa API pemroses tidak tersedia.

Gunakan host yang menjalankan container atau proses Node/Bun:

```bash
docker build -t downloader-zone .
docker run -p 8080:8080 downloader-zone
```

Atau deploy ke Cloud Run / Render / Railway dengan start command `bun start` dan port dari `PORT`. Dockerfile sudah memakai `bun.lock` dan menyertakan `ffmpeg-static`. Runtime harus Node 22.22+ (atau Bun yang kompatibel) karena `@distube/ytdl-core` membutuhkan Node modern.

## Struktur

```text
src/
  components/     UI (hero, hasil media, platform, FAQ, riwayat)
  context/        i18n EN/ID
  data/           daftar platform yang berfungsi
  utils/          pemanggilan API dan unduhan
server.ts         resolver, proxy streaming, konversi ffmpeg
Dockerfile        image produksi
```

## Batasan

- Hanya konten publik. Post privat, story kedaluwarsa, dan tautan CDN kedaluwarsa akan menghasilkan error.
- YouTube dibatasi hingga 1080p dan satu video; playlist, live, dan video age-restricted tidak didukung. Twitch hanya mendukung klip, bukan VOD/live.
- Ekstraksi YouTube bergantung pada perubahan sisi YouTube. Jika `ytdl-core` berhenti bekerja, resolver akan menampilkan error sumber dan perlu pembaruan dependency.
- Tidak ada bypass DRM.
- Tautan media dari platform dapat kedaluwarsa; proses ulang tautan asli untuk mendapatkan URL baru.
- Gunakan hanya untuk arsip pribadi dan hormati hak cipta serta Terms of Service masing-masing platform.
