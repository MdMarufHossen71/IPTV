const params    = new URLSearchParams(location.search);
const channelId = params.get("id");

const videoEl    = document.getElementById("livePlayer");
const nameEl     = document.getElementById("playerName");
const descEl     = document.getElementById("playerDesc");
const catEl      = document.getElementById("playerCat");
const countryEl  = document.getElementById("playerCountry");
const errorEl    = document.getElementById("errorMsg");
const relatedEl  = document.getElementById("relatedList");

let plyr = null;
let hlsInstance = null;
let retries = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

/* ── Plyr init ───────────────────────────────────────────── */
function initPlyr() {
  plyr = new Plyr(videoEl, {
    controls: ["play", "progress", "current-time", "mute", "volume", "fullscreen"],
    autoplay: false,
    ratio: "16:9",
  });
}

/* ── stream playback ─────────────────────────────────────── */
function stopAll() {
  if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null; }
  if (plyr) plyr.pause();
}

function playStream(url) {
  stopAll();
  errorEl.textContent = "";
  retries = 0;
  _attemptPlay(url);
}

function _attemptPlay(url) {
  const isHls = url.includes(".m3u8");

  if (isHls && typeof Hls !== "undefined" && Hls.isSupported()) {
    hlsInstance = new Hls({ enableWorker: true, lowLatencyMode: true });
    hlsInstance.loadSource(url);
    hlsInstance.attachMedia(videoEl);
    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
      videoEl.play().catch(() => {});
    });
    hlsInstance.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) _onFatalError(url);
    });
    return;
  }

  if (isHls && videoEl.canPlayType("application/vnd.apple.mpegurl")) {
    videoEl.src = url;
    videoEl.play().catch(() => _onFatalError(url));
    return;
  }

  videoEl.src = url;
  videoEl.play().catch(() => _onFatalError(url));
  videoEl.onerror = () => _onFatalError(url);
}

function _onFatalError(url) {
  if (retries < MAX_RETRIES) {
    retries++;
    errorEl.textContent = `Stream error — retrying ${retries}/${MAX_RETRIES} in 5 s…`;
    setTimeout(() => _attemptPlay(url), RETRY_DELAY);
  } else {
    errorEl.textContent = "This stream is currently unavailable. Please try another channel.";
  }
}

/* ── related channels ────────────────────────────────────── */
function renderRelated(all, current) {
  relatedEl.innerHTML = "";
  const related = all
    .filter((c) => c.category === current.category && c.id !== current.id)
    .slice(0, 12);

  if (!related.length) {
    relatedEl.innerHTML = '<p style="color:var(--muted);font-size:.85rem;">No related channels.</p>';
    return;
  }

  related.forEach((ch) => {
    const item = document.createElement("div");
    item.className = "related-item";
    item.innerHTML = `
      <img class="related-logo" src="${ch.logo || ""}" alt="${ch.name}" loading="lazy"
           onerror="this.style.display='none'" />
      <span class="related-name">${ch.name}</span>`;
    item.addEventListener("click", () => {
      location.href = `player.html?id=${encodeURIComponent(ch.id)}`;
    });
    relatedEl.appendChild(item);
  });
}

/* ── main ────────────────────────────────────────────────── */
async function initPlayer() {
  initPlyr();

  try {
    const channels = await loadChannels();
    let channel = channels.find((c) => c.id === channelId) || channels[0];
    if (!channel) { errorEl.textContent = "No channels available."; return; }

    // try to find a working URL (primary + fallbacks)
    const workingUrl = await loadWithFallback(channel);
    if (!workingUrl) {
      channel = channel; // keep showing info even if offline
      errorEl.textContent = "All stream sources unavailable right now.";
    }

    nameEl.textContent    = channel.name;
    descEl.textContent    = channel.description || "";
    catEl.textContent     = channel.category;
    countryEl.textContent = channel.country || "";
    document.title        = `${channel.name} — IPTV Player`;

    localStorage.setItem("iptv_last_watched", JSON.stringify({
      id: channel.id, name: channel.name, watchedAt: new Date().toISOString(),
    }));

    renderRelated(channels, channel);

    if (workingUrl) playStream(workingUrl);
  } catch (err) {
    errorEl.textContent = `Failed to initialise player: ${err.message}`;
  }
}

initPlayer();
