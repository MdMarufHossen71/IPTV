# 📺 IPTV - Free Live TV Channels

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-ready-blue)](https://github.com/maruf/IPTV/actions)
[![Channels](https://img.shields.io/badge/Channels-50%2B-red)](./channels.json)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

> Watch free live TV channels directly in your browser. No app needed.

## 🌐 Live Demo
https://maruf.github.io/IPTV/

## 📋 Features
- 50+ live TV channels
- Works on PC, Mobile, and Tablet
- No registration required
- Dark mode UI
- Category and country filters
- M3U playlist download for VLC/IPTV apps
- Favorites, share links, and last watched memory

## 📱 How to Use

### In Browser
1. Go to the live demo link.
2. Browse or search channels.
3. Click **Watch** to open the player.

### In VLC Media Player
1. Open VLC.
2. Go to **Media > Open Network Stream**.
3. Paste: `https://maruf.github.io/IPTV/playlist.m3u`

### In IPTV Apps (TiviMate, IPTV Smarters, etc.)
1. Add a new playlist.
2. Paste M3U URL: `https://maruf.github.io/IPTV/playlist.m3u`

### On Smart TV / Android TV
Use any IPTV app and add the M3U URL above.

## 📺 Channel Categories
| Category | Count |
|----------|-------|
| Bangladeshi | 16 |
| News | 16 |
| Sports | 8 |
| Entertainment | 5 |
| Music | 5 |
| Kids | 4 |
| Religious | 6 |
| Movies | 5 |

## 🚀 Publish via GitHub Desktop
1. Open GitHub Desktop.
2. Go to **Repository > Publish Repository**.
3. Uncheck **Keep this code private**.
4. Click **Publish Repository**.
5. Open GitHub repo settings.
6. Go to **Pages** and set **Source: GitHub Actions**.

## ⚙️ Development Notes
- Static project only: HTML, CSS, JavaScript.
- Streams are loaded from `channels.json`.
- `player.html` supports HLS via HLS.js and non-HLS direct playback.
- GitHub Actions deploy workflow is in `.github/workflows/deploy.yml`.

## ⚠️ Disclaimer
This project does not host any video content. All streams are publicly available on the internet. Stream availability can change without notice.

## 🤝 Contributing
Pull requests are welcome. Add or update channels in `channels.json` and `playlist.m3u`.

## 📄 License
MIT License - see `LICENSE`.
