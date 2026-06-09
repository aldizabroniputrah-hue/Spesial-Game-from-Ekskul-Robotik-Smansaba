# Robot Sky Jump 🤖

Game lompat-lompatan berbasis browser dengan AI Coach, leaderboard lokal, dan efek suara sintetis.

## Struktur File

```
RobotSkyJump/
├── index.html      ← Struktur HTML utama
├── style.css       ← Semua styling (terpisah dari HTML)
├── app.js          ← Semua logika game + AI + audio
└── img/
    ├── robot-icon.svg   ← Ikon robot (SVG)
    └── sky-bg.svg       ← Background langit (SVG)
```

## Cara Menjalankan

Buka `index.html` langsung di browser (Chrome / Edge disarankan).  
Tidak perlu server — semua berjalan di sisi klien.

## Kontrol

| Platform | Kiri | Kanan |
|----------|------|-------|
| Keyboard | `A`  | `D`   |
| Mobile   | Tombol berlian kiri | Tombol berlian kanan |

## Fitur

- 🤖 **Robot Canvas 2D** — karakter digambar sepenuhnya dengan Canvas API
- 🧸 **Kolektibel Beruang** — +10 poin tiap berhasil diambil
- 🦅 **Elang Berbahaya** — muncul setelah skor 100
- 🎵 **Audio Sintetis** — efek suara pakai Web Audio API (tanpa file audio)
- ✨ **AI Name Generator** — Claude AI menyarankan nama robot unik
- 🎯 **AI Coach Feedback** — komentar sarkas + suportif setelah game over
- 🌟 **Daily Challenge** — tantangan harian absurd dari AI
- 🏆 **Leaderboard Lokal** — simpan 15 skor tertinggi di LocalStorage

## Teknologi

- HTML5 Canvas 2D
- Web Audio API
- Tailwind CSS (CDN)
- Anthropic Claude API (claude-sonnet-4-20250514)
- LocalStorage
