# 📺 IPTV — Free Live TV Channels

[![Deploy](https://img.shields.io/github/deployments/MdMarufHossen71/IPTV/github-pages?label=GitHub%20Pages)](https://MdMarufHossen71.github.io/IPTV/)
[![Channels](https://img.shields.io/badge/Channels-90%2B-blue)](https://MdMarufHossen71.github.io/IPTV/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> Watch 90+ free live TV channels in your browser. No app, no registration, no cost.

**🌐 Live:** https://MdMarufHossen71.github.io/IPTV/  
**👤 Built by:** [Md Maruf Hossen](https://mdmarufhossen71.site) • [GitHub](https://github.com/MdMarufHossen71)

---

## ✨ Features
- 90+ channels from 18+ countries — scraped from multiple open-source sources
- 🇧🇩 30 Bangladeshi channels (priority)
- Auto-fallback: if a stream dies, backup URLs are tried automatically
- Live stream health checker — green/red dot per card, updated in background
- Search + Category tabs + Country filter
- Favorites list saved in browser storage
- Share channel link (copy to clipboard)
- M3U playlist for VLC / IPTV apps / Smart TV
- Works on PC, Mobile, Tablet, and Smart TV browser
- Responsive dark UI (2 → 3 → 5 → 6 column grid)

---

## 📱 How to Use

### In Browser (Easiest)
1. Open → https://MdMarufHossen71.github.io/IPTV/
2. Browse or search channels
3. Click **▶ Watch** to open the player

### In VLC Media Player
1. Open VLC
2. **Media → Open Network Stream**
3. Paste: `https://MdMarufHossen71.github.io/IPTV/playlist.m3u`

### In IPTV Apps (TiviMate, IPTV Smarters, OTT Navigator)
1. Add Playlist → M3U URL
2. Paste: `https://MdMarufHossen71.github.io/IPTV/playlist.m3u`

### On Android TV / Fire TV
Use **OTT Navigator** or **TiviMate** and add the M3U URL above.

---

## 📦 Channel Categories

| Category | Channels |
|----------|----------|
| 🇧🇩 Bangladeshi | 30 |
| 📰 News | 16 |
| ⚽ Sports | 8 |
| 🎬 Entertainment | 6 |
| 🎵 Music | 6 |
| 🕌 Religious | 6 |
| 🎥 Movies | 6 |
| 📡 Documentary | 4 |
| 👶 Kids | 5 |

---

## 🚀 How to Deploy Your Own Fork

1. Fork this repo on GitHub
2. Go to repo **Settings → Pages**
3. Source: **GitHub Actions**
4. Push any commit → auto-deploys
5. Your URL: `https://YOUR-USERNAME.github.io/IPTV/`

### Via GitHub Desktop
1. Open GitHub Desktop
2. **Repository → Publish Repository** (uncheck "Keep this code private")
3. Go to repo **Settings → Pages → Source: GitHub Actions**

---

## 🧪 Stream Health Check (local)

Run the Python script to test stream URLs before publishing:

```bash
python scripts/check_streams.py        # test all
python scripts/check_streams.py 20    # test first 20
```

---

## 🙏 Credits & Sources

This project aggregates publicly available streams from these amazing open-source projects:

| Project | Author | Link |
|---------|--------|------|
| iptv-org/iptv | iptv-org | https://github.com/iptv-org/iptv |
| Rakibiptv | Rakib49 | https://github.com/Rakib49/Rakibiptv |
| live | fanmingming | https://github.com/fanmingming/live |
| iptv-api | Guovin | https://github.com/Guovin/iptv-api |
| my-tv | lizongying | https://github.com/lizongying/my-tv |
| awesome-iptv | iptv-org | https://github.com/iptv-org/awesome-iptv |
| iptvnator | 4gray | https://github.com/4gray/iptvnator |
| Tvlist-awesome-m3u-m3u8 | imDazui | https://github.com/imDazui/Tvlist-awesome-m3u-m3u8 |

> All streams are publicly available on the internet. This project does not host any video content.

---

## ⚠️ Disclaimer

This project does not host or distribute any video content. All stream URLs point to publicly accessible resources on the internet. Stream availability may change at any time. For copyright concerns, contact the original stream providers.

---

## 📄 License

MIT License © 2026 [Md Maruf Hossen](https://mdmarufhossen71.site)
