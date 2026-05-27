const CHANNELS_URL = "channels.json";

async function loadChannels() {
  const response = await fetch(CHANNELS_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load channels: ${response.status}`);
  }
  const channels = await response.json();
  return channels.filter((item) => item && item.url && item.name && !item.is_nsfw);
}
