const places = {
  istanbul: { name: "Istanbul, Türkiye", lat: 41.0082, lng: 28.9784, zoom: 12 },
  london: { name: "London, United Kingdom", lat: 51.5072, lng: -0.1276, zoom: 12 },
  newyork: { name: "New York, USA", lat: 40.7128, lng: -74.0060, zoom: 12 },
  tokyo: { name: "Tokyo, Japan", lat: 35.6762, lng: 139.6503, zoom: 12 }
};

const map = L.map("map", { zoomControl: false, preferCanvas: true }).setView([places.istanbul.lat, places.istanbul.lng], places.istanbul.zoom);
const tileLayers = {
  streets: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }),
  dark: L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 20, attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }),
  satellite: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 19, attribution: 'Tiles &copy; Esri'
  })
};
let activeLayer = "streets";
tileLayers[activeLayer].addTo(map);
let searchMarker = null;
let userMarker = null;
let currentPlaceName = places.istanbul.name;
let token = "";
const $ = (id) => document.getElementById(id);

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 3000);
}
function setPlace(name, lat, lng, zoom = 13) {
  currentPlaceName = name;
  $("mapLocation").textContent = name;
  map.flyTo([lat, lng], zoom, { duration: 0.8 });
  $("coordinates").textContent = `${lat.toFixed(4)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? "E" : "W"}`;
}
function updateCoordinates() {
  const c = map.getCenter();
  $("coordinates").textContent = `${Math.abs(c.lat).toFixed(4)}° ${c.lat >= 0 ? "N" : "S"}, ${Math.abs(c.lng).toFixed(4)}° ${c.lng >= 0 ? "E" : "W"}`;
}
map.on("moveend", updateCoordinates);
map.on("click", (e) => {
  if (searchMarker) map.removeLayer(searchMarker);
  searchMarker = L.marker(e.latlng).addTo(map).bindPopup(`<b>Selected location</b><br>${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`).openPopup();
  currentPlaceName = "Selected location";
  $("mapLocation").textContent = currentPlaceName;
});

document.querySelectorAll(".layer-option").forEach((button) => {
  button.addEventListener("click", () => {
    const next = button.dataset.layer;
    if (next === activeLayer) return;
    map.removeLayer(tileLayers[activeLayer]);
    tileLayers[next].addTo(map);
    activeLayer = next;
    document.querySelectorAll(".layer-option").forEach((b) => b.classList.toggle("selected", b === button));
  });
});
document.querySelectorAll(".quick-chip").forEach((button) => {
  button.addEventListener("click", () => {
    const p = places[button.dataset.preset];
    document.querySelectorAll(".quick-chip").forEach((b) => b.classList.toggle("active", b === button));
    setPlace(p.name, p.lat, p.lng, p.zoom);
  });
});

$("searchForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = $("searchInput").value.trim();
  if (!query) return;
  const submit = $("searchForm").querySelector("button");
  submit.disabled = true; submit.textContent = "…";
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!response.ok) throw new Error("Search service unavailable");
    const results = await response.json();
    if (!results.length) { toast("No matching place found."); return; }
    const result = results[0], lat = Number(result.lat), lng = Number(result.lon);
    setPlace(result.display_name.split(",").slice(0, 3).join(","), lat, lng, 14);
    if (searchMarker) map.removeLayer(searchMarker);
    searchMarker = L.marker([lat, lng]).addTo(map).bindPopup(`<b>${escapeHtml(result.name || query)}</b>`).openPopup();
    document.querySelectorAll(".quick-chip").forEach((b) => b.classList.remove("active"));
  } catch (error) { toast(error.message || "Could not search right now."); }
  finally { submit.disabled = false; submit.textContent = "↵"; }
});
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
}
$("zoomIn").addEventListener("click", () => map.zoomIn());
$("zoomOut").addEventListener("click", () => map.zoomOut());
$("resetView").addEventListener("click", () => setPlace(places.istanbul.name, places.istanbul.lat, places.istanbul.lng, 12));
$("locateBtn").addEventListener("click", () => {
  if (!navigator.geolocation) return toast("Geolocation is not supported by this browser.");
  toast("Finding your location…");
  navigator.geolocation.getCurrentPosition((position) => {
    const { latitude, longitude } = position.coords;
    if (userMarker) map.removeLayer(userMarker);
    userMarker = L.circleMarker([latitude, longitude], { radius: 8, color: "#fff", weight: 3, fillColor: "#28a8f0", fillOpacity: 1 }).addTo(map).bindPopup("You are here");
    setPlace("Your location", latitude, longitude, 15);
    userMarker.openPopup();
  }, () => toast("Location permission was denied or unavailable."), { enableHighAccuracy: true, timeout: 10000 });
});
$("saveTokenBtn").addEventListener("click", () => {
  token = $("tokenInput").value.trim();
  $("tokenNote").textContent = token ? "Token set for this page session." : "No token entered. Token stays in this browser session only.";
  toast(token ? "Mapillary token set for this session." : "Token cleared.");
});
$("imageryBtn").addEventListener("click", loadNearbyImages);

async function loadNearbyImages() {
  if (!token) { toast("Add a Mapillary access token first."); $("tokenInput").focus(); return; }
  const center = map.getCenter();
  const resultsEl = $("imageResults");
  resultsEl.innerHTML = '<div class="empty-state"><span class="empty-icon">◌</span><b>Searching nearby…</b><p>Checking public street-level imagery.</p></div>';
  const params = new URLSearchParams({
    fields: "id,thumb_1024_url,computed_geometry,captured_at",
    closeto: `${center.lng},${center.lat}`,
    radius: "1000",
    limit: "12",
    access_token: token
  });
  try {
    const response = await fetch(`https://graph.mapillary.com/images?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Mapillary request failed. Check your token and permissions.");
    const images = data.data || [];
    if (!images.length) {
      resultsEl.innerHTML = '<div class="empty-state"><span class="empty-icon">▧</span><b>No images found nearby</b><p>Try another area or zoom out and search again.</p></div>';
      return;
    }
    resultsEl.innerHTML = images.map((item) => {
      const point = item.computed_geometry?.coordinates || [];
      const lat = point[1], lng = point[0];
      const date = item.captured_at ? new Date(item.captured_at).toLocaleDateString() : "Capture date unavailable";
      const imageUrl = item.thumb_1024_url || "";
      return `<article class="image-card">
        ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="Mapillary street-level image" loading="lazy">` : ""}
        <div class="image-card-info"><small>${escapeHtml(date)}</small><a href="https://www.mapillary.com/app/?pKey=${encodeURIComponent(item.id)}" target="_blank" rel="noopener">Open in Mapillary ↗</a></div>
      </article>`;
    }).join("");
    toast(`${images.length} nearby image${images.length === 1 ? "" : "s"} found.`);
  } catch (error) {
    resultsEl.innerHTML = `<div class="empty-state"><span class="empty-icon">!</span><b>Couldn't load imagery</b><p>${escapeHtml(error.message)}</p></div>`;
    toast("Mapillary imagery search failed.");
  }
}
$("aboutBtn").addEventListener("click", () => $("infoDialog").showModal());
$("privacyLink").addEventListener("click", (e) => { e.preventDefault(); toast("TerraVista does not send your search history to a TerraVista server. See README for provider details."); });
$("closeDialog").addEventListener("click", () => $("infoDialog").close());
$("dialogOk").addEventListener("click", () => $("infoDialog").close());
updateCoordinates();
