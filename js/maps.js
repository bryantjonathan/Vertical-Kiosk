// Telkom University coordinates (Bandung)
const telkomUniversityCoords = [-6.9734, 107.6297];

// Initialize map
const map = L.map('map').setView(telkomUniversityCoords, 16);

// Map layers
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
});

const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri'
});

// Add default layer
osmLayer.addTo(map);

// Telkom University Campus Boundary
const campusBoundary = [
    [-6.969461460528802, 107.62671614911287],
    [-6.971362208731384, 107.62665184868938],
    [-6.971351559214333, 107.62803586851369],
    [-6.977658402001896, 107.62804174202729],
    [-6.977829974610846, 107.63131667809208],
    [-6.975931507140401, 107.63290001095994],
    [-6.974109173542487, 107.63253071559024],
    [-6.972506209996909, 107.63391105706928],
    [-6.968449523579628, 107.62888589233754],
    [-6.968592806683974, 107.62725745025443]
];

// Draw polygon for campus boundary
const campusPolygon = L.polygon(campusBoundary, {
    color: 'blue',
    fillColor: '#3388ff',
    fillOpacity: 0.2,
    weight: 2
}).addTo(map);

// Optional: popup for polygon
campusPolygon.bindPopup("Telkom University Campus Area");

// Map controls
document.getElementById('centerMap').addEventListener('click', () => {
    map.setView(telkomUniversityCoords, 16);
});

document.getElementById('toggleSatellite').addEventListener('click', () => {
    if (map.hasLayer(osmLayer)) {
        map.removeLayer(osmLayer);
        map.addLayer(satelliteLayer);
    } else {
        map.removeLayer(satelliteLayer);
        map.addLayer(osmLayer);
    }
});