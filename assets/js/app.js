const state = {
  channels: [],
  filtered: [],
  search: "",
  category: localStorage.getItem("iptv_category") || "all",
  country: "all",
  favorites: new Set(JSON.parse(localStorage.getItem("iptv_favorites") || "[]")),
};

const grid             = document.getElementById("channelGrid");
const resultCount      = document.getElementById("resultCount");
const searchInput      = document.getElementById("searchInput");
const countryFilter    = document.getElementById("countryFilter");
const lastWatchedLabel = document.getElementById("lastWatchedLabel");
const tabsWrap         = document.getElementById("categoryTabs");
const template         = document.getElementById("channelCardTemplate");

/* ── helpers ──────────────────────────────────────────────── */
function debounce(fn, ms = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function saveFavorites() {
  localStorage.setItem("iptv_favorites", JSON.stringify([...state.favorites]));
}

function isHls(url) {
  return typeof url === "string" && url.includes(".m3u8");
}

function showSkeletons(n = 12) {
  grid.innerHTML = "";
  for (let i = 0; i < n; i++) {
    const s = document.createElement("div");
    s.className = "skeleton";
    grid.appendChild(s);
  }
}

/* ── filtering ────────────────────────────────────────────── */
function applyFilters() {
  const q = state.search.toLowerCase().trim();
  state.filtered = state.channels.filter((ch) => {
    if (state.category === "favorites" && !state.favorites.has(ch.id)) return false;
    if (state.category !== "all" && state.category !== "favorites" &&
        ch.category.toLowerCase() !== state.category.toLowerCase()) return false;
    if (state.country !== "all" && ch.country !== state.country) return false;
    if (q && !ch.name.toLowerCase().includes(q)) return false;
    return true;
  });
}

/* ── render ───────────────────────────────────────────────── */
function buildCard(channel) {
  const node = template.content.firstElementChild.cloneNode(true);
  node.dataset.id = channel.id;

  const logo      = node.querySelector(".channel-logo");
  const fallback  = node.querySelector(".logo-fallback-text");
  const liveBadge = node.querySelector(".live-badge");
  const dot       = node.querySelector(".status-dot");
  const name      = node.querySelector(".channel-name");
  const catBadge  = node.querySelector(".cat-badge");
  const ctyBadge  = node.querySelector(".country-badge");
  const watchBtn  = node.querySelector(".btn-watch");
  const favBtn    = node.querySelector(".btn-fav");
  const shareBtn  = node.querySelector(".btn-share");

  name.textContent    = channel.name;
  catBadge.textContent = channel.category;
  ctyBadge.textContent = channel.country || "";
  dot.dataset.id      = channel.id;
  liveBadge.style.display = isHls(channel.url) ? "inline-flex" : "none";

  if (channel.logo) {
    logo.src  = channel.logo;
    logo.alt  = channel.name;
    logo.onerror = () => {
      logo.style.display   = "none";
      fallback.style.display = "block";
      fallback.textContent = channel.name;
    };
  } else {
    logo.style.display   = "none";
    fallback.style.display = "block";
    fallback.textContent = channel.name;
  }

  // offline state at render time if pre-known
  if (channel.status === "offline") {
    node.classList.add("offline");
    dot.classList.add("offline-badge");
    dot.title = "Stream unavailable";
    watchBtn.disabled = true;
    watchBtn.textContent = "Unavailable";
    watchBtn.style.opacity = "0.5";
  }

  // favorites
  const refreshFav = () => {
    favBtn.textContent = state.favorites.has(channel.id) ? "★" : "☆";
    favBtn.classList.toggle("active", state.favorites.has(channel.id));
  };
  refreshFav();

  // events
  watchBtn.addEventListener("click", () => {
    localStorage.setItem("iptv_last_watched", JSON.stringify({
      id: channel.id, name: channel.name, watchedAt: new Date().toISOString(),
    }));
    window.location.href = `player.html?id=${encodeURIComponent(channel.id)}`;
  });

  node.addEventListener("keydown", (e) => {
    if (e.key === "Enter") watchBtn.click();
  });

  favBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (state.favorites.has(channel.id)) state.favorites.delete(channel.id);
    else state.favorites.add(channel.id);
    saveFavorites();
    refreshFav();
    if (state.category === "favorites") { applyFilters(); renderChannels(); }
  });

  shareBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const url = `${location.origin}${location.pathname.replace("index.html", "")}player.html?id=${encodeURIComponent(channel.id)}`;
    navigator.clipboard.writeText(url)
      .then(() => { shareBtn.textContent = "✓"; setTimeout(() => { shareBtn.textContent = "🔗"; }, 1500); })
      .catch(() => alert("Copy manually:\n" + url));
  });

  return node;
}

function renderChannels() {
  grid.innerHTML = "";
  if (!state.filtered.length) {
    const p = document.createElement("p");
    p.className = "empty-msg";
    p.textContent = "No channels matched your filters.";
    grid.appendChild(p);
    resultCount.textContent = "0 channels";
    return;
  }

  const frag = document.createDocumentFragment();
  state.filtered.forEach((ch) => frag.appendChild(buildCard(ch)));
  grid.appendChild(frag);
  resultCount.textContent = `${state.filtered.length} channels`;
}

/* ── countries ────────────────────────────────────────────── */
function populateCountries() {
  const seen = new Set();
  const opts = ['<option value="all">All Countries</option>'];
  state.channels.forEach((ch) => {
    if (ch.country && !seen.has(ch.country)) {
      seen.add(ch.country);
      opts.push(`<option value="${ch.country}">${ch.country}</option>`);
    }
  });
  countryFilter.innerHTML = opts.join("");
}

/* ── tabs ─────────────────────────────────────────────────── */
function syncTabs() {
  tabsWrap.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.category === state.category);
  });
}

/* ── last watched label ───────────────────────────────────── */
function showLastWatched() {
  try {
    const lw = JSON.parse(localStorage.getItem("iptv_last_watched") || "null");
    if (lw && lw.name) lastWatchedLabel.textContent = `Last: ${lw.name}`;
  } catch { /* ignore */ }
}

/* ── init ─────────────────────────────────────────────────── */
async function init() {
  showSkeletons();
  showLastWatched();
  syncTabs();

  try {
    state.channels = await loadChannels();
    populateCountries();
    applyFilters();
    renderChannels();
    // kick off background stream checks after first render
    startStreamVerification(state.channels);
  } catch (err) {
    grid.innerHTML = `<p class="empty-msg">Could not load channels. ${err.message}</p>`;
  }
}

/* ── event listeners ──────────────────────────────────────── */
searchInput.addEventListener("input", debounce((e) => {
  state.search = e.target.value;
  applyFilters();
  renderChannels();
}));

countryFilter.addEventListener("change", (e) => {
  state.country = e.target.value;
  applyFilters();
  renderChannels();
});

tabsWrap.addEventListener("click", (e) => {
  const tab = e.target.closest(".tab");
  if (!tab) return;
  state.category = tab.dataset.category;
  localStorage.setItem("iptv_category", state.category);
  syncTabs();
  applyFilters();
  renderChannels();
});

init();
