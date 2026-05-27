const state = {
  channels: [],
  filtered: [],
  search: "",
  category: localStorage.getItem("iptv_preferred_category") || "all",
  country: "all",
  favorites: new Set(JSON.parse(localStorage.getItem("iptv_favorites") || "[]"))
};

const grid = document.getElementById("channelGrid");
const resultCount = document.getElementById("resultCount");
const searchInput = document.getElementById("searchInput");
const countryFilter = document.getElementById("countryFilter");
const lastWatchedLabel = document.getElementById("lastWatchedLabel");
const tabsWrap = document.getElementById("categoryTabs");
const template = document.getElementById("channelCardTemplate");

function debounce(fn, wait = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

function saveFavorites() {
  localStorage.setItem("iptv_favorites", JSON.stringify([...state.favorites]));
}

function setSkeleton(count = 8) {
  grid.innerHTML = "";
  for (let i = 0; i < count; i += 1) {
    const skeleton = document.createElement("div");
    skeleton.className = "skeleton";
    grid.appendChild(skeleton);
  }
}

function isLikelyLive(url) {
  return typeof url === "string" && (url.includes(".m3u8") || url.includes("live"));
}

function applyFilters() {
  const search = state.search.trim().toLowerCase();
  state.filtered = state.channels.filter((channel) => {
    const inFavorites = state.favorites.has(channel.id);
    const byCategory = state.category === "all" ||
      (state.category === "favorites" && inFavorites) ||
      channel.category.toLowerCase() === state.category;
    const byCountry = state.country === "all" || channel.country === state.country;
    const bySearch = !search || channel.name.toLowerCase().includes(search);
    return byCategory && byCountry && bySearch;
  });
}

function updateLastWatched() {
  const last = JSON.parse(localStorage.getItem("iptv_last_watched") || "null");
  if (last && last.name) {
    lastWatchedLabel.textContent = `Last watched: ${last.name}`;
  }
}

function shareChannel(channel) {
  const url = `${location.origin}${location.pathname.replace("index.html", "")}player.html?id=${encodeURIComponent(channel.id)}`;
  navigator.clipboard.writeText(url).then(() => {
    alert("Channel link copied.");
  }).catch(() => {
    alert("Copy failed. You can manually copy this URL:\n" + url);
  });
}

function renderChannels() {
  grid.innerHTML = "";
  if (!state.filtered.length) {
    grid.innerHTML = '<p class="muted">No channels matched your filters.</p>';
    resultCount.textContent = "0 channels";
    return;
  }

  const frag = document.createDocumentFragment();
  state.filtered.forEach((channel) => {
    const node = template.content.firstElementChild.cloneNode(true);
    const logo = node.querySelector(".channel-logo");
    const fallback = node.querySelector(".logo-fallback");
    const live = node.querySelector(".live-dot");
    const watchBtn = node.querySelector(".btn-watch");
    const favBtn = node.querySelector(".btn-favorite");
    const shareBtn = node.querySelector(".btn-share");

    node.querySelector(".channel-name").textContent = channel.name;
    node.querySelector(".category-badge").textContent = channel.category;
    node.querySelector(".country-chip").textContent = channel.country;
    logo.src = channel.logo || "";
    logo.alt = `${channel.name} logo`;
    fallback.textContent = channel.name;
    live.style.display = isLikelyLive(channel.url) ? "inline-flex" : "none";

    logo.onerror = () => {
      logo.style.display = "none";
      fallback.style.display = "flex";
    };

    watchBtn.addEventListener("click", () => {
      localStorage.setItem("iptv_last_watched", JSON.stringify({
        id: channel.id,
        name: channel.name,
        watchedAt: new Date().toISOString()
      }));
      window.location.href = `player.html?id=${encodeURIComponent(channel.id)}`;
    });

    const setFavState = () => {
      favBtn.textContent = state.favorites.has(channel.id) ? "Favorited" : "Favorite";
    };
    setFavState();

    favBtn.addEventListener("click", () => {
      if (state.favorites.has(channel.id)) {
        state.favorites.delete(channel.id);
      } else {
        state.favorites.add(channel.id);
      }
      saveFavorites();
      setFavState();
      if (state.category === "favorites") {
        applyFilters();
        renderChannels();
      }
    });

    shareBtn.addEventListener("click", () => shareChannel(channel));

    frag.appendChild(node);
  });

  grid.appendChild(frag);
  resultCount.textContent = `${state.filtered.length} channel(s)`;
}

function renderCountries() {
  const countries = [...new Set(state.channels.map((c) => c.country))].sort();
  const options = ['<option value="all">All Countries</option>']
    .concat(countries.map((country) => `<option value="${country}">${country}</option>`));
  countryFilter.innerHTML = options.join("");
}

function setActiveTab() {
  tabsWrap.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.category === state.category);
  });
}

async function init() {
  setSkeleton();
  updateLastWatched();
  setActiveTab();

  try {
    state.channels = await loadChannels();
    renderCountries();
    applyFilters();
    renderChannels();
  } catch (error) {
    grid.innerHTML = `<p class="muted">Could not load channels. ${error.message}</p>`;
  }
}

searchInput.addEventListener("input", debounce((event) => {
  state.search = event.target.value;
  applyFilters();
  renderChannels();
}, 300));

countryFilter.addEventListener("change", (event) => {
  state.country = event.target.value;
  applyFilters();
  renderChannels();
});

tabsWrap.addEventListener("click", (event) => {
  const tab = event.target.closest(".tab");
  if (!tab) return;
  state.category = tab.dataset.category;
  localStorage.setItem("iptv_preferred_category", state.category);
  setActiveTab();
  applyFilters();
  renderChannels();
});

init();
