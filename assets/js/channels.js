async function loadChannels() {
  const resp = await fetch("channels.json", { cache: "no-store" });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  return data.filter((c) => c && c.url && c.name && !c.is_nsfw);
}
