const params = new URLSearchParams(window.location.search);
const channelId = params.get("id");
const playerEl = document.getElementById("livePlayer");
const channelNameEl = document.getElementById("channelName");
const channelDescEl = document.getElementById("channelDescription");
const errorMessageEl = document.getElementById("errorMessage");
const relatedWrap = document.getElementById("relatedChannels");

let retryCount = 0;
let hls;
const MAX_RETRY = 3;
const RETRY_DELAY = 5000;

const vjs = videojs(playerEl, {
  controls: true,
  fluid: true,
  preload: "auto",
  controlBar: {
    volumePanel: { inline: false }
  }
});

function stopPlayback() {
  if (hls) {
    hls.destroy();
    hls = null;
  }
  vjs.pause();
  vjs.src({ src: "", type: "" });
}

function playChannelStream(url) {
  stopPlayback();
  errorMessageEl.textContent = "";

  const isHls = url.includes(".m3u8");
  if (isHls && Hls.isSupported()) {
    hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(vjs.tech().el());
    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) retryPlayback(url);
    });
    vjs.play().catch(() => {});
    return;
  }

  const type = isHls ? "application/x-mpegURL" : "video/mp4";
  vjs.src({ src: url, type });
  vjs.ready(() => {
    vjs.play().catch(() => retryPlayback(url));
  });

  vjs.on("error", () => retryPlayback(url));
}

function retryPlayback(url) {
  if (retryCount >= MAX_RETRY) {
    errorMessageEl.textContent = "This stream appears unavailable. Please try another channel.";
    return;
  }
  retryCount += 1;
  errorMessageEl.textContent = `Stream error. Retrying ${retryCount}/${MAX_RETRY} in 5s...`;
  setTimeout(() => playChannelStream(url), RETRY_DELAY);
}

function renderRelated(channels, current) {
  relatedWrap.innerHTML = "";
  channels
    .filter((c) => c.category === current.category && c.id !== current.id)
    .slice(0, 10)
    .forEach((channel) => {
      const item = document.createElement("button");
      item.className = "related-item";
      item.type = "button";
      item.textContent = channel.name;
      item.addEventListener("click", () => {
        window.location.href = `player.html?id=${encodeURIComponent(channel.id)}`;
      });
      relatedWrap.appendChild(item);
    });
}

async function initPlayer() {
  try {
    const channels = await loadChannels();
    const channel = channels.find((c) => c.id === channelId) || channels[0];
    if (!channel) {
      errorMessageEl.textContent = "No channels are available.";
      return;
    }

    retryCount = 0;
    channelNameEl.textContent = channel.name;
    channelDescEl.textContent = channel.description || "No description available.";
    localStorage.setItem("iptv_last_watched", JSON.stringify({
      id: channel.id,
      name: channel.name,
      watchedAt: new Date().toISOString()
    }));

    renderRelated(channels, channel);
    playChannelStream(channel.url);
  } catch (error) {
    errorMessageEl.textContent = `Failed to load player: ${error.message}`;
  }
}

initPlayer();
