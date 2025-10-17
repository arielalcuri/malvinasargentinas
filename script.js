// 1. INICIALIZAR EL MAPA
const map = L.map('map');

const southWest = L.latLng(-57, -75);
const northEast = L.latLng(-20, -52);
const bounds = L.latLngBounds(southWest, northEast);

map.fitBounds(bounds);
map.setMaxBounds(bounds);
map.setMinZoom(4);

L.tileLayer('https://wms.ign.gob.ar/geoserver/gwc/service/tms/1.0.0/capabaseargenmap@EPSG%3A3857@png/{z}/{x}/{-y}.png', {
    attribution: '<a href="http://www.ign.gob.ar" target="_blank">Instituto Geográfico Nacional</a>'
}).addTo(map);

const markersLayer = L.layerGroup().addTo(map);
let todosLosLugares = [];
let capasProvincias = {};
let provinciaSeleccionada = null;

// Paleta de colores: Azul petróleo suave y un acento ámbar
const defaultStyle = { color: "#083D77", weight: 1.5, opacity: 1, fillColor: "#2E628F", fillOpacity: 0.4 };
const highlightStyle = { color: "#F9A620", weight: 3, opacity: 1, fillColor: "#F9A620", fillOpacity: 0.6 };

// 2. LÓGICA DE LAS PROVINCIAS Y FILTRADO
function mostrarTodosLosMarcadores() {
    markersLayer.clearLayers();
    todosLosLugares.forEach(lugar => {
        if (lugar.lat && lugar.lng) {
            L.marker([lugar.lat, lugar.lng])
                .addTo(markersLayer)
                .bindPopup(`
                    <img src="${lugar.imagen}" alt="Imagen de ${lugar.nombre}" />
                    <b>${lugar.nombre}</b><br>${lugar.info}
                `, { className: 'custom-popup' });
        }
    });
}

function mostrarMarcadoresDeProvincia(nombreProvincia) {
    markersLayer.clearLayers();
    const lugaresDeLaProvincia = todosLosLugares.filter(lugar => lugar.provincia && lugar.provincia.trim() === nombreProvincia);
    lugaresDeLaProvincia.forEach(lugar => {
        if (lugar.lat && lugar.lng) {
            L.marker([lugar.lat, lugar.lng])
                .addTo(markersLayer)
                .bindPopup(`
                    <img src="${lugar.imagen}" alt="Imagen de ${lugar.nombre}" />
                    <b>${lugar.nombre}</b><br>${lugar.info}
                `, { className: 'custom-popup' });
        }
    });
}

function onProvinceClick(e) {
    const layer = e.target;
    const nombreProvincia = layer.feature.properties.nombre;

    if (provinciaSeleccionada) {
        provinciaSeleccionada.setStyle(defaultStyle);
    }
    layer.setStyle(highlightStyle);
    provinciaSeleccionada = layer;

    map.fitBounds(layer.getBounds());
    mostrarMarcadoresDeProvincia(nombreProvincia);
}

function onEachFeature(feature, layer) {
    const nombreProvincia = feature.properties.nombre;
    capasProvincias[nombreProvincia.toLowerCase().trim()] = layer;
    layer.on({
        click: onProvinceClick,
        mouseover: function (e) {
            const hoveredLayer = e.target;
            if (hoveredLayer !== provinciaSeleccionada) {
                hoveredLayer.setStyle({ weight: 3, color: '#F9A620', fillOpacity: 0.6 });
            }
        },
        mouseout: function (e) {
            const hoveredLayer = e.target;
            if (hoveredLayer !== provinciaSeleccionada) {
                hoveredLayer.setStyle(defaultStyle);
            }
        }
    });
}

fetch('provincias.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            onEachFeature: onEachFeature,
            style: defaultStyle
        }).addTo(map);
    })
    .catch(error => console.error('Error al cargar las provincias:', error));

// 3. CARGAR DATOS Y POBLAR EL BUSCADOR
const googleSheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTozxVh-G1pmH5SPMY3GTizIK1I8l_a6PX6ZE5z3J0Gq3r9-xAmh8_9YmyIkvx3CwAXCCWC6zHmt3pU/pub?gid=0&single=true&output=csv';

Papa.parse(googleSheetURL, {
    download: true,
    header: true,
    complete: function(results) {
        todosLosLugares = results.data;
        mostrarTodosLosMarcadores();
        
        const dataList = document.getElementById('province-list');
        const todasLasProvincias = todosLosLugares
            .map(lugar => lugar.provincia ? lugar.provincia.trim() : null)
            .filter(Boolean);
        const provinciasUnicas = [...new Set(todasLasProvincias)];
        
        provinciasUnicas.forEach(nombreProvincia => {
            const option = document.createElement('option');
            option.value = nombreProvincia;
            dataList.appendChild(option);
        });
    }
});

// 4. LÓGICA DEL BUSCADOR
const searchButton = document.getElementById('search-button');
const searchInput = document.getElementById('province-search');

function buscarProvincia() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const provinciaLayer = capasProvincias[searchTerm];
    if (provinciaLayer) {
        provinciaLayer.fire('click');
        searchInput.value = '';
    } else {
        alert("Provincia no encontrada. Por favor, selecciona un nombre de la lista.");
    }
}

searchButton.addEventListener('click', buscarProvincia);
searchInput.addEventListener('keyup', function(event) {
    if (event.key === "Enter") {
        buscarProvincia();
    }
});
