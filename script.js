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

// 2. LÓGICA DE LAS PROVINCIAS Y FILTRADO
function mostrarTodosLosMarcadores() {
    markersLayer.clearLayers();
    todosLosLugares.forEach(lugar => {
        if (lugar.lat && lugar.lng) {
            L.marker([lugar.lat, lugar.lng])
                .addTo(markersLayer)
                .bindPopup(`
                    <img src="${lugar.imagen}" alt="Imagen de ${lugar.nombre}" width="150px" style="border-radius: 5px; margin-bottom: 5px;"/>
                    <br><b style="font-size: 14px;">${lugar.nombre}</b><br>${lugar.info}
                `);
        }
    });
}

function mostrarMarcadoresDeProvincia(nombreProvincia) {
    markersLayer.clearLayers();
    const lugaresDeLaProvincia = todosLosLugares.filter(lugar => lugar.provincia === nombreProvincia);
    lugaresDeLaProvincia.forEach(lugar => {
        if (lugar.lat && lugar.lng) {
            L.marker([lugar.lat, lugar.lng])
                .addTo(markersLayer)
                .bindPopup(`
                    <img src="${lugar.imagen}" alt="Imagen de ${lugar.nombre}" width="150px" style="border-radius: 5px; margin-bottom: 5px;"/>
                    <br><b style="font-size: 14px;">${lugar.nombre}</b><br>${lugar.info}
                `);
        }
    });
}

function onProvinceClick(e) {
    const layer = e.target;
    const nombreProvincia = layer.feature.properties.nombre;
    map.fitBounds(layer.getBounds());
    mostrarMarcadoresDeProvincia(nombreProvincia);
}

function onEachFeature(feature, layer) {
    const nombreProvincia = feature.properties.nombre;
    capasProvincias[nombreProvincia.toLowerCase()] = layer;
    layer.on({ click: onProvinceClick });
}

fetch('https://apis.datos.gob.ar/georef/api/v2.0/provincias.geojson')
    .then(response => response.json())
    .then(data => {
        const geojsonData = { "type": "FeatureCollection", "features": data.features };
        L.geoJSON(geojsonData, {
            onEachFeature: onEachFeature,
            style: { color: "#1f599e", weight: 2, opacity: 0.8 }
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
        
        // --- NUEVA LÓGICA PARA POBLAR EL BUSCADOR ---
        const dataList = document.getElementById('province-list');
        // Extraemos los nombres de las provincias que tienen datos, sin repetirlos
        const provinciasConDatos = [...new Set(todosLosLugares.map(lugar => lugar.provincia))];
        
        provinciasConDatos.forEach(nombreProvincia => {
            if (nombreProvincia) { // Asegurarnos de no añadir opciones vacías
                const option = document.createElement('option');
                option.value = nombreProvincia;
                dataList.appendChild(option);
            }
        });
    }
});

// 4. LÓGICA DEL BUSCADOR
const searchButton = document.getElementById('search-button');
const searchInput = document.getElementById('province-search');

function buscarProvincia() {
    const searchTerm = searchInput.value.toLowerCase();
    // Buscamos la capa de la provincia usando el nombre en minúsculas
    const provinciaLayer = capasProvincias[searchTerm];

    if (provinciaLayer) {
        provinciaLayer.fire('click'); // Simulamos un clic si la encontramos
        searchInput.value = ''; // Opcional: limpiar el buscador después de la búsqueda
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
