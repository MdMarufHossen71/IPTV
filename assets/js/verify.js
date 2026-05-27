/**
 * verify.js — background stream health checker.
 *
 * Runs after the page renders. For each channel card already in the DOM,
 * fires a HEAD request (5 s timeout). Updates the status-dot colour in
 * real time. If primary URL fails, tries fallback_urls in order and
 * updates channel.url to the first working one so the player uses it.
 */

const STREAM_TIMEOUT_MS = 6000;

async function testStream(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);
    const resp = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      mode: "no-cors",   // avoids CORS pre-flight for cross-origin m3u8 hosts
    });
    clearTimeout(timer);
    // no-cors gives opaque response (status=0) which we treat as reachable
    return true;
  } catch {
    return false;
  }
}

async function loadWithFallback(channel) {
  const urls = [channel.url, ...(channel.fallback_urls || [])];
  for (const url of urls) {
    const ok = await testStream(url);
    if (ok) {
      channel.url = url;      // mutate in-place so player picks it up
      return url;
    }
  }
  return null;
}

/**
 * Called by app.js after cards are rendered.
 * @param {Array} channels — the loaded channel objects (live references)
 */
function startStreamVerification(channels) {
  // stagger checks so we don't slam the network all at once
  channels.forEach((channel, idx) => {
    setTimeout(async () => {
      const dot = document.querySelector(`.status-dot[data-id="${channel.id}"]`);
      const card = document.querySelector(`.channel-card[data-id="${channel.id}"]`);
      const workingUrl = await loadWithFallback(channel);

      if (!dot) return;

      if (workingUrl) {
        dot.classList.add("live");
        dot.title = "Stream reachable";
      } else {
        dot.classList.add("dead");
        dot.title = "Stream unavailable";
        channel.status = "offline";

        if (card) {
          card.classList.add("offline");
          // add overlay label if not already there
          if (!card.querySelector(".offline-label")) {
            const lw = card.querySelector(".card-logo-wrap");
            if (lw) {
              const label = document.createElement("span");
              label.className = "offline-label";
              label.textContent = "Stream Unavailable";
              lw.appendChild(label);
            }
          }
          // disable watch button
          const watchBtn = card.querySelector(".btn-watch");
          if (watchBtn) {
            watchBtn.disabled = true;
            watchBtn.textContent = "Unavailable";
            watchBtn.style.opacity = "0.5";
          }
        }
      }
    }, idx * 120);   // 120 ms stagger between each check
  });
}
