let viewer;
let currentPlanet = "Earth";
let featuresData = {};

async function loadFeatures() {
  const res = await fetch("features.json");
  featuresData = await res.json();
}

function initViewer(tileSource) {
  if (viewer) viewer.destroy();
  viewer = OpenSeadragon({
    id: "viewer",
    prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/",
    tileSources: tileSource
  });
}

async function loadDataset() {
  const datasetPath = document.getElementById("datasetSelect").value;
  const response = await fetch(datasetPath);
  const dataset = await response.json();
  currentPlanet = dataset.name.split(" ")[0];
  initViewer(dataset.tileSource);
  alert(`Loaded dataset: ${dataset.name}`);
}

// --- NEW FEATURE SEARCH FUNCTION ---
function searchFeature() {
  const query = document.getElementById("searchBox").value.trim();
  const planetData = featuresData[currentPlanet];

  if (!planetData || !planetData[query]) {
    alert(`Feature '${query}' not found on ${currentPlanet}.`);
    return;
  }

  const { x, y, zoom } = planetData[query];
  viewer.viewport.panTo(new OpenSeadragon.Point(x, y));
  viewer.viewport.zoomTo(zoom);
  alert(`Zooming to ${query} on ${currentPlanet}`);
}

function toggleOverlay() {
  viewer.addTiledImage({
    tileSource: "https://openseadragon.github.io/example-images/highsmith/highsmith.dzi",
    opacity: 0.5
  });
}

window.onload = async () => {
  await loadFeatures();
  loadDataset();
};
