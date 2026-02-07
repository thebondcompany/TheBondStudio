# The Bond Studio: Audio → Video & Subtitles

**Turn podcast audio into videos *or* subtitle (.srt) files — fully in your browser.**

Upload audio, generate AI subtitles locally, and export:
- 🎥 **YouTube-ready 1920×1080 MP4 videos with animated waveforms**
- 📝 **Clean, editable `.srt` subtitle files** (no video required)

**No API keys. No backend. No uploads. 100% local.**

![Audio → Video](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Runs Locally](https://img.shields.io/badge/runs-100%25%20locally-success)

---

## ☕ Support this project

We’re a for-profit company, open-sourcing some tools we use.

If this project helped you, consider keeping the developer caffeinated.

All support goes directly to the dev.

👉 https://buy.stripe.com/6oU14pcrK20N8hJ42I5Ne01

---

## ✨ What This Is

**Audio → Video** is a free, open-source tool for turning **podcasts, interviews, and voice recordings** into:

- Shareable **audiogram videos**
- **Accurate subtitle (.srt) files**
- Branded content for **YouTube, TikTok, Instagram, and LinkedIn**

Unlike tools like **Descript**, **Riverside**, **Headliner**, or **Wavve**, this project:

- Runs entirely **in your browser**
- Requires **no account**
- Requires **no API keys**
- Never uploads your audio anywhere

Your content stays on your machine.

---

## 🔥 Key Use Cases

- 🎙 **Podcasters** → videos or subtitle files from episodes
- 🎥 **Video editors** → generate `.srt` from audio
- 📱 **Social creators** → audiograms for short-form clips
- 🧠 **Researchers & journalists** → fast local transcription
- 🧩 **Developers** → Whisper-in-browser reference implementation

---

## ⭐ Features

### 📝 Subtitles & Transcription
- **Local AI transcription** using OpenAI Whisper
- Runs fully in-browser (`whisper-tiny` or `whisper-small`)
- Export **editable `.srt` subtitle files**
- Remove filler words (um, uh, you know)
- Edit transcript before export

### 🎥 Video Generation (Optional)
- Export **1920×1080 MP4** (H.264 + AAC)
- **20+ animated waveform styles**
  - Bars, dots, rings, waves, spectrum, orb, helix, and more
- Subtitle burn-in with full styling control
- Frame-accurate preview with progress bar

### 🎨 Branding
- Custom logo
- Color themes
- Background images
- Subtitle font, size, color, and position

### 🔒 Privacy-First
- No servers
- No uploads
- No tracking
- No API keys

---

## 🧑‍💻 Quick Start

```bash
git clone https://github.com/thebondcompany/TheBondStudio.git
cd TheBondStudio
npm install
npm run dev
