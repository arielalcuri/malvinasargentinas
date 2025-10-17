// 1. INICIALIZAR EL MAPA
// Definimos las esquinas del rectángulo que enmarcará a Argentina
const southWest = L.latLng(-56, -74); // Esquina inferior izquierda (Sudoeste)
const northEast = L.latLng(-21, -53); // Esquina superior derecha (Noreste)
const bounds = L.latLngBounds(southWest, northEast);

// Inicializamos el mapa con los límites definidos
const map = L.map('map', {
    center: [-40, -63],
    zoom: 4,
    maxBounds: bounds, // Aplicamos el marco invisible
    minZoom: 4 // Opcional: evita que se aleje demasiado y vea bordes vacíos
});

L.tileLayer('https://wms.ign.gob.ar/geoserver/gwc/service/tms/1.0.0/capabaseargenmap@EPSG%3A3857@png/{z}/{x}/{-y}.png', {
    attribution: '<a href="http://www.ign.gob.ar" target="_blank">Instituto Geográfico Nacional</a>'
}).addTo(map);

const markersLayer = L.layerGroup().addTo(map);
let todosLosLugares = [];
let capasProvincias = {}; // Objeto para guardar las capas de las provincias por su nombre

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
    capasProvincias[nombreProvincia.toLowerCase()] = layer; // Guardamos la capa con el nombre en minúsculas
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

// 3. CARGAR DATOS DESDE GOOGLE SHEETS
const googleSheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTozxVh-G1pmH5SPMY3GTizIK1I8l_a6PX6ZE5z3J0Gq3r9-xAmh8_9YmyIkvx3CwAXCCWC6zHmt3pU/pub?gid=0&single=true&output=csv';

Papa.parse(googleSheetURL, {
    download: true,
    header: true,
    complete: function(results) {
        todosLosLugares = results.data;
        mostrarTodosLosMarcadores();
    }
});

// 4. LÓGICA DEL BUSCADOR
const searchButton = document.getElementById('search-button');
const searchInput = document.getElementById('province-search');

function buscarProvincia() {
    const searchTerm = searchInput.value.toLowerCase();
    const provinciaLayer = capasProvincias[searchTerm];

    if (provinciaLayer) {
        provinciaLayer.fire('click'); // Simulamos un clic en la provincia encontrada
    } else {
        alert("Provincia no encontrada. Asegúrate de escribir el nombre completo y correctamente.");
    }
}

searchButton.addEventListener('click', buscarProvincia);
searchInput.addEventListener('keyup', function(event) {
    if (event.key === "Enter") {
        buscarProvincia();
    }
});
