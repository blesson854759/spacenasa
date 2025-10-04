// Module Navigation Variables
let navItems, modules, moduleTitle;

const moduleTitles = {
  'home': 'Dashboard',
  'about-nasa': 'About NASA',
  'space-apps': 'Space Apps Challenge',
  'image-explorer': 'Image Explorer',
  'comparison-tool': 'Data Comparison Tool',
  'gallery': 'Public Gallery'
};

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  const user = localStorage.getItem('starExplorerUser') || sessionStorage.getItem('starExplorerUser');
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  
  const userData = JSON.parse(user);
  document.getElementById('username').textContent = userData.username;
  
  // Initialize navigation
  navItems = document.querySelectorAll('.nav-item');
  modules = document.querySelectorAll('.module');
  moduleTitle = document.getElementById('module-title');
  
  console.log('Navigation items found:', navItems.length);
  console.log('Modules found:', modules.length);
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const moduleName = item.getAttribute('data-module');
      console.log('Clicked module:', moduleName);
      switchModule(moduleName);
    });
  });
});

// Logout function
function logout() {
  localStorage.removeItem('starExplorerUser');
  sessionStorage.removeItem('starExplorerUser');
  window.location.href = 'login.html';
}

function switchModule(moduleName) {
  // Update navigation
  navItems.forEach(item => item.classList.remove('active'));
  document.querySelector(`[data-module="${moduleName}"]`).classList.add('active');
  
  // Update modules
  modules.forEach(module => module.classList.remove('active'));
  document.getElementById(moduleName).classList.add('active');
  
  // Update title
  moduleTitle.textContent = moduleTitles[moduleName];
  
  // Initialize module-specific features
  if (moduleName === 'image-explorer' && !window.viewer) {
    initImageExplorer();
  } else if (moduleName === 'comparison-tool' && !window.leftViewer) {
    initComparisonTool();
  }
}

// ===== IMAGE EXPLORER MODULE =====
let viewer;
let currentDataset = 'earth';
let featuresData = {};

async function initImageExplorer() {
  // Load features data
  try {
    const response = await fetch('features.json');
    featuresData = await response.json();
  } catch (error) {
    console.log('Features data not loaded, using defaults');
    featuresData = {
      "Earth": {
        "Amazon Rainforest": { "x": 0.45, "y": 0.55, "zoom": 3 },
        "Himalayas": { "x": 0.6, "y": 0.3, "zoom": 4 },
        "Sahara Desert": { "x": 0.4, "y": 0.45, "zoom": 3 }
      },
      "Moon": {
        "Tycho Crater": { "x": 0.45, "y": 0.65, "zoom": 5 },
        "Copernicus Crater": { "x": 0.5, "y": 0.4, "zoom": 4 }
      },
      "Mars": {
        "Olympus Mons": { "x": 0.52, "y": 0.35, "zoom": 5 },
        "Valles Marineris": { "x": 0.48, "y": 0.55, "zoom": 4 }
      }
    };
  }
  
  loadDataset();
}

function loadDataset() {
  const datasetSelect = document.getElementById('datasetSelect');
  currentDataset = datasetSelect.value;
  
  // Sample tile sources (in production, these would be real NASA data)
  const tileSources = {
    'earth': 'https://openseadragon.github.io/example-images/highsmith/highsmith.dzi',
    'moon': 'https://openseadragon.github.io/example-images/duomo/duomo.dzi',
    'mars': 'https://openseadragon.github.io/example-images/highsmith/highsmith.dzi',
    'tess': 'https://openseadragon.github.io/example-images/duomo/duomo.dzi'
  };
  
  if (viewer) {
    viewer.destroy();
  }
  
  viewer = OpenSeadragon({
    id: "viewer",
    prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/",
    tileSources: tileSources[currentDataset],
    showNavigationControl: true,
    navigationControlAnchor: OpenSeadragon.ControlAnchor.TOP_RIGHT,
    animationTime: 0.5,
    blendTime: 0.1,
    constrainDuringPan: true,
    maxZoomPixelRatio: 2,
    minZoomLevel: 0.8,
    visibilityRatio: 1,
    zoomPerScroll: 2
  });
  
  // Update info panel
  updateImageInfo();
  
  // Add viewport change listener
  viewer.addHandler('viewport-change', () => {
    const zoom = viewer.viewport.getZoom();
    const center = viewer.viewport.getCenter();
    document.getElementById('infoZoom').textContent = zoom.toFixed(2) + 'x';
    document.getElementById('infoCoords').textContent = 
      `${center.x.toFixed(4)}°, ${center.y.toFixed(4)}°`;
  });
  
  showNotification('Dataset loaded successfully!', 'success');
}

function updateImageInfo() {
  const datasetInfo = {
    'earth': {
      name: 'Earth - Landsat',
      resolution: '30m/pixel',
      date: '2024-01-15'
    },
    'moon': {
      name: 'Moon - LRO',
      resolution: '0.5m/pixel',
      date: '2023-12-20'
    },
    'mars': {
      name: 'Mars - MRO',
      resolution: '25cm/pixel',
      date: '2023-11-10'
    },
    'tess': {
      name: 'TESS - Space',
      resolution: '21 arcsec/pixel',
      date: '2024-01-01'
    }
  };
  
  const info = datasetInfo[currentDataset];
  document.getElementById('infoDataset').textContent = info.name;
  document.getElementById('infoResolution').textContent = info.resolution;
  document.getElementById('infoDate').textContent = info.date;
}

function searchFeature() {
  const query = document.getElementById('featureSearch').value.trim();
  const datasetName = currentDataset.charAt(0).toUpperCase() + currentDataset.slice(1);
  
  if (!featuresData[datasetName] || !featuresData[datasetName][query]) {
    showNotification(`Feature '${query}' not found on ${datasetName}`, 'error');
    return;
  }
  
  const { x, y, zoom } = featuresData[datasetName][query];
  viewer.viewport.panTo(new OpenSeadragon.Point(x, y));
  viewer.viewport.zoomTo(zoom);
  showNotification(`Zooming to ${query}`, 'success');
}

function addLabel() {
  const labelName = prompt('Enter label name:');
  if (labelName) {
    const center = viewer.viewport.getCenter();
    const zoom = viewer.viewport.getZoom();
    
    // Add to labels list
    const labelsList = document.getElementById('labelsList');
    const labelItem = document.createElement('div');
    labelItem.className = 'label-item';
    labelItem.innerHTML = `
      <span class="label-name">${labelName}</span>
      <button onclick="goToLabel('${labelName}')" class="mini-btn">Go</button>
    `;
    labelsList.appendChild(labelItem);
    
    showNotification(`Label "${labelName}" added!`, 'success');
  }
}

function measureDistance() {
  showNotification('Click two points on the image to measure distance', 'info');
  // In production, this would implement actual measurement functionality
}

function toggleOverlay() {
  if (viewer) {
    viewer.addTiledImage({
      tileSource: 'https://openseadragon.github.io/example-images/duomo/duomo.dzi',
      opacity: 0.5
    });
    showNotification('Overlay added', 'success');
  }
}

function captureView() {
  showNotification('View captured! (In production, this would save the current view)', 'success');
}

function showAllLabels() {
  showNotification('Showing all labels for current dataset', 'info');
}

function goToLabel(labelName) {
  showNotification(`Navigating to ${labelName}`, 'info');
  searchFeature();
}

// ===== COMPARISON TOOL MODULE =====
let leftViewer, rightViewer;
 comparisonMode = 'sidebyside';

function initComparisonTool() {
  leftViewer = OpenSeadragon({
    id: "leftViewer",
    prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/",
    tileSources: 'https://openseadragon.github.io/example-images/highsmith/highsmith.dzi',
    showNavigationControl: false
  });
  
  rightViewer = OpenSeadragon({
    id: "rightViewer",
    prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/",
    tileSources: 'https://openseadragon.github.io/example-images/duomo/duomo.dzi',
    showNavigationControl: false
  });
  
  // Sync viewers
  syncViewers(leftViewer, rightViewer);
  syncViewers(rightViewer, leftViewer);
}

function syncViewers(viewer1, viewer2) {
  viewer1.addHandler('viewport-change', () => {
    const center = viewer1.viewport.getCenter();
    const zoom = viewer1.viewport.getZoom();
    viewer2.viewport.panTo(center, false);
    viewer2.viewport.zoomTo(zoom, null, false);
  });
}

function setComparisonMode(mode) {
  comparisonMode = mode;
  
  // Update button states
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.closest('.mode-btn').classList.add('active');
  
  showNotification(`Comparison mode: ${mode}`, 'info');
}

function loadComparison() {
  const leftDataset = document.getElementById('leftDataset').value;
  const rightDataset = document.getElementById('rightDataset').value;
  
  showNotification(`Loading comparison: ${leftDataset} vs ${rightDataset}`, 'success');
  
  // In production, this would load actual datasets
  if (leftViewer && rightViewer) {
    // Reload viewers with new data
    initComparisonTool();
  }
}

function exportAnalysis() {
  showNotification('Exporting analysis data...', 'success');
  
  // Create sample data
  const analysisData = {
    leftImage: document.getElementById('leftDataset').value,
    rightImage: document.getElementById('rightDataset').value,
    areaChanged: '12.4%',
    vegetationLoss: '-8.2%',
    urbanGrowth: '+5.6%',
    timestamp: new Date().toISOString()
  };
  
  // Download as JSON
  const dataStr = JSON.stringify(analysisData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'comparison-analysis.json';
  link.click();
}

// ===== GALLERY MODULE =====
function filterGallery(category) {
  const items = document.querySelectorAll('.gallery-item');
  
  // Update button states
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Filter items
  items.forEach(item => {
    if (category === 'all' || item.getAttribute('data-category') === category) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

// ===== IMAGE MODAL FUNCTIONALITY =====
let currentImageIndex = 0;
const galleryData = [
  { title: "🌳 Amazon Rainforest", description: "Deforestation patterns over 5 years", category: "Earth", image: "https://images-assets.nasa.gov/image/iss068e016472/iss068e016472~orig.jpg" },
  { title: "🌙 Tycho Crater", description: "High-resolution lunar surface features", category: "Moon", image: "https://images-assets.nasa.gov/image/PIA00302/PIA00302~orig.jpg" },
  { title: "🔴 Olympus Mons", description: "Largest volcano in the solar system", category: "Mars", image: "https://images-assets.nasa.gov/image/PIA02820/PIA02820~orig.jpg" },
  { title: "🏔️ Himalayan Glaciers", description: "Glacier retreat monitoring", category: "Earth", image: "https://images-assets.nasa.gov/image/iss068e030835/iss068e030835~orig.jpg" },
  { title: "✨ Pillars of Creation", description: "James Webb Space Telescope", category: "Deep Space", image: "https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001327/GSFC_20171208_Archive_e001327~orig.jpg" },
  { title: "🏜️ Sahara Desert Patterns", description: "Sand dune formations", category: "Earth", image: "https://images-assets.nasa.gov/image/iss068e042594/iss068e042594~orig.jpg" },
  { title: "🪐 Jupiter's Great Red Spot", description: "Juno spacecraft close-up", category: "Deep Space", image: "https://images-assets.nasa.gov/image/PIA23122/PIA23122~orig.jpg" },
  { title: "🚁 Mars Helicopter View", description: "Ingenuity's aerial perspective", category: "Mars", image: "https://images-assets.nasa.gov/image/PIA24542/PIA24542~orig.jpg" },
  { title: "🌀 Hurricane from Space", description: "Storm system tracking", category: "Earth", image: "https://images-assets.nasa.gov/image/iss067e316517/iss067e316517~orig.jpg" },
  { title: "🌌 Carina Nebula", description: "Star-forming region", category: "Deep Space", image: "https://images-assets.nasa.gov/image/PIA23645/PIA23645~orig.jpg" },
  { title: "🌑 Lunar South Pole", description: "Permanently shadowed regions", category: "Moon", image: "https://images-assets.nasa.gov/image/PIA13517/PIA13517~orig.jpg" },
  { title: "🌈 Aurora Borealis", description: "Northern lights from ISS", category: "Earth", image: "https://images-assets.nasa.gov/image/iss068e018789/iss068e018789~orig.jpg" },
  { title: "🪐 Saturn's Majestic Rings", description: "Cassini spacecraft detailed view", category: "Saturn", image: "https://images-assets.nasa.gov/image/PIA17172/PIA17172~orig.jpg" },
  { title: "☀️ Massive Solar Flare", description: "Solar Dynamics Observatory capture", category: "Sun", image: "https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e000393/GSFC_20171208_Archive_e000393~orig.jpg" },
  { title: "🌌 Andromeda Galaxy", description: "Our nearest galactic neighbor", category: "Deep Space", image: "https://images-assets.nasa.gov/image/PIA15985/PIA15985~orig.jpg" },
  { title: "🐠 Great Barrier Reef", description: "Coral reef ecosystem from orbit", category: "Earth", image: "https://images-assets.nasa.gov/image/iss070e050412/iss070e050412~orig.jpg" },
  { title: "🔴 Valles Marineris Canyon", description: "Largest canyon in solar system", category: "Mars", image: "https://images-assets.nasa.gov/image/PIA23499/PIA23499~orig.jpg" },
  { title: "✨ Orion Nebula", description: "Stellar nursery in infrared", category: "Deep Space", image: "https://images-assets.nasa.gov/image/PIA23128/PIA23128~orig.jpg" },
  { title: "🪐 Saturn's Hexagon Storm", description: "Mysterious north pole pattern", category: "Saturn", image: "https://images-assets.nasa.gov/image/PIA21046/PIA21046~orig.jpg" },
  { title: "🌙 Apollo 11 Landing Site", description: "Historic first moon landing", category: "Moon", image: "https://images-assets.nasa.gov/image/as11-40-5903/as11-40-5903~orig.jpg" },
  { title: "☀️ Solar Prominence", description: "Plasma eruption from sun's surface", category: "Sun", image: "https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001481/GSFC_20171208_Archive_e001481~orig.jpg" },
  { title: "🏞️ Nile River Delta", description: "Ancient civilization cradle", category: "Earth", image: "https://images-assets.nasa.gov/image/iss069e042012/iss069e042012~orig.jpg" },
  { title: "🌪️ Jupiter's Cloud Bands", description: "Turbulent atmospheric patterns", category: "Deep Space", image: "https://images-assets.nasa.gov/image/PIA23122/PIA23122~orig.jpg" },
  { title: "🔴 Jezero Crater Delta", description: "Ancient river delta on Mars", category: "Mars", image: "https://images-assets.nasa.gov/image/PIA25969/PIA25969~orig.jpg" },
  { title: "💛 Venus Surface Radar", description: "Magellan spacecraft radar mapping", category: "Venus", image: "https://images-assets.nasa.gov/image/PIA00271/PIA00271~orig.jpg" },
  { title: "💙 Neptune's Great Dark Spot", description: "Voyager 2 historic flyby", category: "Neptune", image: "https://images-assets.nasa.gov/image/PIA01492/PIA01492~orig.jpg" },
  { title: "☄️ Comet Hale-Bopp", description: "Spectacular dual-tail comet", category: "Comet", image: "https://images-assets.nasa.gov/image/PIA02142/PIA02142~orig.jpg" },
  { title: "🪐 Saturn with Titan & Dione", description: "Multiple moons in one frame", category: "Saturn", image: "https://images-assets.nasa.gov/image/PIA08329/PIA08329~orig.jpg" },
  { title: "🌟 TRAPPIST-1 System", description: "Seven Earth-sized exoplanets", category: "Exoplanet", image: "https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001327/GSFC_20171208_Archive_e001327~orig.jpg" },
  { title: "🏔️ Mount Everest Peak", description: "World's highest mountain from ISS", category: "Earth", image: "https://images-assets.nasa.gov/image/iss071e564940/iss071e564940~orig.jpg" },
  { title: "💛 Venus Cloud Patterns", description: "Thick sulfuric acid atmosphere", category: "Venus", image: "https://images-assets.nasa.gov/image/PIA00106/PIA00106~orig.jpg" },
  { title: "✨ Cosmic Cliffs", description: "James Webb's stunning nebula view", category: "Deep Space", image: "https://images-assets.nasa.gov/image/PIA23645/PIA23645~orig.jpg" },
  { title: "☄️ Comet 67P/Churyumov", description: "Rosetta mission close-up", category: "Comet", image: "https://images-assets.nasa.gov/image/PIA19710/PIA19710~orig.jpg" },
  { title: "💙 Neptune's Moon Triton", description: "Icy moon with nitrogen geysers", category: "Neptune", image: "https://images-assets.nasa.gov/image/PIA02224/PIA02224~orig.jpg" },
  { title: "🌟 Kepler's Discoveries", description: "Thousands of distant worlds", category: "Exoplanet", image: "https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001481/GSFC_20171208_Archive_e001481~orig.jpg" },
  { title: "🔴 Mars North Polar Ice Cap", description: "Frozen water and CO2 layers", category: "Mars", image: "https://images-assets.nasa.gov/image/PIA24924/PIA24924~orig.jpg" },
  { title: "🌃 Tokyo Megacity Lights", description: "Urban sprawl from space at night", category: "Earth", image: "https://images-assets.nasa.gov/image/iss070e001313/iss070e001313~orig.jpg" },
  { title: "🌑 Moon's Far Side", description: "The hidden hemisphere never seen from Earth", category: "Moon", image: "https://images-assets.nasa.gov/image/PIA00405/PIA00405~orig.jpg" },
  { title: "🌀 Whirlpool Galaxy M51", description: "Spiral galaxy with companion", category: "Deep Space", image: "https://images-assets.nasa.gov/image/PIA15254/PIA15254~orig.jpg" },
  { title: "🏜️ Valles Marineris Detail", description: "Layered rock formations in canyon walls", category: "Mars", image: "https://images-assets.nasa.gov/image/PIA23499/PIA23499~orig.jpg" },
  { title: "🪐 Saturn Backlit by Sun", description: "Cassini's spectacular eclipse view", category: "Saturn", image: "https://images-assets.nasa.gov/image/PIA06077/PIA06077~orig.jpg" },
  { title: "🌋 Iceland's Volcanic Landscape", description: "Glaciers meeting volcanic terrain", category: "Earth", image: "https://images-assets.nasa.gov/image/iss068e059971/iss068e059971~orig.jpg" },
  { title: "✨ Orion Nebula Infrared", description: "Star formation revealed in infrared", category: "Deep Space", image: "https://images-assets.nasa.gov/image/PIA23128/PIA23128~orig.jpg" },
  { title: "☀️ Solar Corona During Eclipse", description: "Sun's outer atmosphere revealed", category: "Sun", image: "https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e000678/GSFC_20171208_Archive_e000678~orig.jpg" },
  { title: "👨‍🚀 Apollo 17 Moonwalk", description: "Last humans on the Moon (1972)", category: "Moon", image: "https://images-assets.nasa.gov/image/as17-134-20384/as17-134-20384~orig.jpg" },
  { title: "🏝️ Bahamas Turquoise Waters", description: "Crystal clear shallow ocean banks", category: "Earth", image: "https://images-assets.nasa.gov/image/iss069e000587/iss069e000587~orig.jpg" },
  { title: "🐴 Horsehead Nebula", description: "Iconic dark nebula in Orion", category: "Deep Space", image: "https://images-assets.nasa.gov/image/PIA16695/PIA16695~orig.jpg" },
  { title: "🏜️ Martian Sand Dunes", description: "Dark dunes in Proctor Crater", category: "Mars", image: "https://images-assets.nasa.gov/image/PIA23623/PIA23623~orig.jpg" },
  { title: "💎 Enceladus Ice Geysers", description: "Water plumes from Saturn's moon", category: "Saturn", image: "https://images-assets.nasa.gov/image/PIA17218/PIA17218~orig.jpg" },
  { title: "🏞️ Grand Canyon from Space", description: "Geological layers spanning millions of years", category: "Earth", image: "https://images-assets.nasa.gov/image/iss070e086420/iss070e086420~orig.jpg" },
  { title: "💍 Southern Ring Nebula", description: "Dying star's expanding gas shell", category: "Deep Space", image: "https://images-assets.nasa.gov/image/PIA23645/PIA23645~orig.jpg" },
  { title: "🌋 Venus Volcanic Domes", description: "Pancake-shaped volcanic features", category: "Venus", image: "https://images-assets.nasa.gov/image/PIA00148/PIA00148~orig.jpg" },
  { title: "🌙 Lunar Highlands Terrain", description: "Ancient cratered surface", category: "Moon", image: "https://images-assets.nasa.gov/image/PIA00094/PIA00094~orig.jpg" },
  { title: "🏝️ Dubai Palm Islands", description: "Artificial islands visible from space", category: "Earth", image: "https://images-assets.nasa.gov/image/iss071e317890/iss071e317890~orig.jpg" },
  { title: "🌌 Andromeda Galaxy Core", description: "Central region with billions of stars", category: "Deep Space", image: "https://images-assets.nasa.gov/image/PIA15985/PIA15985~orig.jpg" },
  { title: "🏔️ Martian Gullies", description: "Evidence of recent water flow", category: "Mars", image: "https://images-assets.nasa.gov/image/PIA23304/PIA23304~orig.jpg" },
  { title: "☀️ Giant Solar Filament", description: "Suspended plasma in magnetic field", category: "Sun", image: "https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001992/GSFC_20171208_Archive_e001992~orig.jpg" },
  { title: "🏜️ Sahara Desert Patterns", description: "Wind-sculpted sand formations", category: "Earth", image: "https://images-assets.nasa.gov/image/iss068e042594/iss068e042594~orig.jpg" },
  { title: "🌪️ Jupiter's Turbulent Storms", description: "Chaotic atmospheric dynamics", category: "Deep Space", image: "https://images-assets.nasa.gov/image/PIA23122/PIA23122~orig.jpg" },
  { title: "☄️ Comet Nucleus Close-Up", description: "Icy body with active jets", category: "Comet", image: "https://images-assets.nasa.gov/image/PIA00342/PIA00342~orig.jpg" }
];

function viewGalleryItem(id) {
  currentImageIndex = id - 1; // Convert to 0-based index
  openImageModal();
}

function openImageModal() {
  const modal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');
  const modalTitle = document.getElementById('modalTitle');
  const modalDescription = document.getElementById('modalDescription');
  const modalCategory = document.getElementById('modalCategory');
  const modalCounter = document.getElementById('modalCounter');
  const modalDownload = document.getElementById('modalDownload');
  const loader = document.querySelector('.modal-loader');
  
  const data = galleryData[currentImageIndex];
  
  // Show modal
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  // Show loader
  loader.style.display = 'flex';
  modalImage.style.opacity = '0';
  
  // Reset image transforms when opening new image
  resetImageTransform();
  
  // Update content
  modalTitle.textContent = data.title;
  modalDescription.textContent = data.description;
  modalCategory.textContent = data.category;
  modalCategory.setAttribute('data-category', data.category.toLowerCase().replace(' ', '-'));
  modalCounter.textContent = `Image ${currentImageIndex + 1} of ${galleryData.length}`;
  modalDownload.href = data.image;
  modalDownload.download = `nasa-${data.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.jpg`;
  
  // Load image
  modalImage.onload = function() {
    loader.style.display = 'none';
    modalImage.style.opacity = '1';
  };
  modalImage.src = data.image;
  modalImage.alt = data.title;
}

function closeImageModal() {
  const modal = document.getElementById('imageModal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  
  // Exit comparison mode when closing modal
  if (comparisonMode) {
    exitCompareMode();
  }
}

function navigateImage(direction) {
  currentImageIndex += direction;
  
  // Wrap around
  if (currentImageIndex < 0) {
    currentImageIndex = galleryData.length - 1;
  } else if (currentImageIndex >= galleryData.length) {
    currentImageIndex = 0;
  }
  
  // Exit comparison mode when navigating
  if (comparisonMode) {
    exitCompareMode();
  }
  
  openImageModal();
}

// Keyboard navigation
document.addEventListener('keydown', function(e) {
  const modal = document.getElementById('imageModal');
  if (modal.style.display === 'flex') {
    if (e.key === 'Escape') {
      closeImageModal();
    } else if (e.key === 'ArrowLeft') {
      navigateImage(-1);
    } else if (e.key === 'ArrowRight') {
      navigateImage(1);
    }
  }
});

// Close modal when clicking outside
document.addEventListener('click', function(e) {
  const modal = document.getElementById('imageModal');
  if (e.target === modal) {
    closeImageModal();
  }
});

// ===== IMAGE BALANCE/SYMMETRY CONTROLS =====
let imageTransform = {
  flipH: false,
  flipV: false,
  symmetry: false
};

function toggleFlipHorizontal() {
  imageTransform.flipH = !imageTransform.flipH;
  imageTransform.symmetry = false; // Disable symmetry when flipping
  applyImageTransform();
}

function toggleFlipVertical() {
  imageTransform.flipV = !imageTransform.flipV;
  imageTransform.symmetry = false; // Disable symmetry when flipping
  applyImageTransform();
}

function toggleSymmetry() {
  imageTransform.symmetry = !imageTransform.symmetry;
  if (imageTransform.symmetry) {
    // Reset flips when enabling symmetry
    imageTransform.flipH = false;
    imageTransform.flipV = false;
  }
  applyImageTransform();
}

function resetImageTransform() {
  imageTransform = {
    flipH: false,
    flipV: false,
    symmetry: false
  };
  applyImageTransform();
}

function applyImageTransform() {
  const modalImage = document.getElementById('modalImage');
  const container = document.querySelector('.modal-image-container');
  
  if (imageTransform.symmetry) {
    // Apply symmetry effect - create mirrored version
    container.classList.add('symmetry-mode');
    modalImage.style.transform = 'none';
  } else {
    // Apply flip transforms
    container.classList.remove('symmetry-mode');
    let scaleX = imageTransform.flipH ? -1 : 1;
    let scaleY = imageTransform.flipV ? -1 : 1;
    modalImage.style.transform = `scale(${scaleX}, ${scaleY})`;
  }
}

// ===== IMAGE COMPARISON FEATURE =====
 comparisonMode = false;
let comparisonImageIndex = null;
let isDraggingSlider = false;

function toggleCompareMode() {
  comparisonMode = !comparisonMode;
  const comparisonContainer = document.getElementById('modalComparisonContainer');
  const comparisonControls = document.getElementById('modalComparisonControls');
  const compareBtn = document.querySelector('.compare-btn');
  
  if (comparisonMode) {
    // Enter comparison mode
    comparisonContainer.style.display = 'block';
    comparisonControls.style.display = 'flex';
    compareBtn.classList.add('active');
    
    // Populate the image selector dropdown
    populateComparisonSelector();
    
    // Initialize slider position
    updateSliderPosition(50);
    
    // Add slider drag functionality
    initializeSlider();
    
    showNotification('Comparison mode activated. Select an image to compare.', 'info');
  } else {
    exitCompareMode();
  }
}

function exitCompareMode() {
  comparisonMode = false;
  const comparisonContainer = document.getElementById('modalComparisonContainer');
  const comparisonControls = document.getElementById('modalComparisonControls');
  const compareBtn = document.querySelector('.compare-btn');
  const modalImage = document.getElementById('modalImage');
  
  comparisonContainer.style.display = 'none';
  comparisonControls.style.display = 'none';
  compareBtn.classList.remove('active');
  
  // Reset clip path on main image
  modalImage.style.clipPath = 'none';
  
  comparisonImageIndex = null;
}

function populateComparisonSelector() {
  const select = document.getElementById('modalCompareImageSelect');
  select.innerHTML = '<option value="">Select an image...</option>';
  
  galleryData.forEach((item, index) => {
    if (index !== currentImageIndex) {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${index + 1}. ${item.title}`;
      select.appendChild(option);
    }
  });
}

function updateComparisonImage() {
  const select = document.getElementById('modalCompareImageSelect');
  const selectedIndex = parseInt(select.value);
  
  if (isNaN(selectedIndex)) {
    return;
  }
  
  comparisonImageIndex = selectedIndex;
  const compareImage = document.getElementById('modalCompareImage');
  const data = galleryData[selectedIndex];
  
  // Load comparison image
  compareImage.src = data.image;
  compareImage.alt = data.title;
  
  // Show the comparison
  updateSliderPosition(50);
  
  showNotification(`Comparing with: ${data.title}`, 'success');
}

function initializeSlider() {
  const slider = document.getElementById('modalComparisonSlider');
  const container = document.querySelector('.modal-image-container');
  
  // Remove old event listeners if they exist
  const newSlider = slider.cloneNode(true);
  slider.parentNode.replaceChild(newSlider, slider);
  
  // Mouse events
  newSlider.addEventListener('mousedown', startDragging);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDragging);
  
  // Touch events for mobile
  newSlider.addEventListener('touchstart', startDragging);
  document.addEventListener('touchmove', drag);
  document.addEventListener('touchend', stopDragging);
  
  function startDragging(e) {
    isDraggingSlider = true;
    newSlider.classList.add('dragging');
    e.preventDefault();
  }
  
  function drag(e) {
    if (!isDraggingSlider) return;
    
    const containerRect = container.getBoundingClientRect();
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const position = ((clientX - containerRect.left) / containerRect.width) * 100;
    
    // Clamp between 0 and 100
    const clampedPosition = Math.max(0, Math.min(100, position));
    updateSliderPosition(clampedPosition);
  }
  
  function stopDragging() {
    isDraggingSlider = false;
    newSlider.classList.remove('dragging');
  }
}

function updateSliderPosition(percentage) {
  const slider = document.getElementById('modalComparisonSlider');
  const modalImage = document.getElementById('modalImage');
  const compareImage = document.getElementById('modalCompareImage');
  
  slider.style.left = `${percentage}%`;
  
  // Clip the main image to show only the left portion
  modalImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
  
  // Clip the comparison image to show only the right portion
  compareImage.style.clipPath = `inset(0 0 0 ${percentage}%)`;
}

function startMuseumMode() {
  showNotification('Starting museum mode slideshow...', 'success');
  
  // In production, this would start a fullscreen slideshow
  const items = document.querySelectorAll('.gallery-item');
  let currentIndex = 0;
  
  const slideshow = setInterval(() => {
    items[currentIndex].style.transform = 'scale(1)';
    currentIndex = (currentIndex + 1) % items.length;
    items[currentIndex].style.transform = 'scale(1.1)';
  }, 5000);
  
  // Store interval ID to stop later
  window.museumslideshowInterval = slideshow;
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  const colors = {
    'success': '#10b981',
    'error': '#ef4444',
    'info': '#3b82f6',
    'warning': '#f59e0b'
  };
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type]};
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideInRight 0.3s ease;
    font-weight: 600;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize on load
window.addEventListener('load', () => {
  // Set default module
  switchModule('home');
});