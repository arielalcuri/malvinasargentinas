// 1. INICIALIZAR EL MAPA
const map = L.map('map').setView([-40, -63], 4);

L.tileLayer('https://wms.ign.gob.ar/geoserver/gwc/service/tms/1.0.0/capabaseargenmap@EPSG%3A3857@png/{z}/{x}/{-y}.png', {
    attribution: '<a href="http://www.ign.gob.ar" target="_blank">Instituto Geográfico Nacional</a>'
}).addTo(map);

// Capa especial para los marcadores, permite borrarlos y añadirlos fácilmente.
const markersLayer = L.layerGroup().addTo(map);
// Variable para guardar todos los lugares que carguemos del Sheet.
let todosLosLugares = [];

// 2. LÓGICA DE LAS PROVINCIAS Y FILTRADO DE MARCADORES

// Esta función muestra TODOS los marcadores en el mapa.
function mostrarTodosLosMarcadores() {
    markersLayer.clearLayers(); // Limpiamos por si acaso
    todosLosLugares.forEach(lugar => {
        if (lugar.lat && lugar.lng) {
            L.marker([lugar.lat, lugar.lng])
                .addTo(markersLayer)
                .bindPopup(`
                    <img src="${lugar.imagen}" alt="Imagen de ${lugar.nombre}" width="150px" style="border-radius: 5px; margin-bottom: 5px;"/>
                    <br>
                    <b style="font-size: 14px;">${lugar.nombre}</b>
                    <br>
                    ${lugar.info}
                `);
        }
    });
}

// Esta función filtra y muestra solo los marcadores de una provincia específica.
function mostrarMarcadoresDeProvincia(nombreProvincia) {
    markersLayer.clearLayers(); // Borramos todos los marcadores actuales
    const lugaresDeLaProvincia = todosLosLugares.filter(lugar => lugar.provincia === nombreProvincia);

    lugaresDeLaProvincia.forEach(lugar => {
        if (lugar.lat && lugar.lng) {
            L.marker([lugar.lat, lugar.lng])
                .addTo(markersLayer)
                .bindPopup(`
                    <img src="${lugar.imagen}" alt="Imagen de ${lugar.nombre}" width="150px" style="border-radius: 5px; margin-bottom: 5px;"/>
                    <br>
                    <b style="font-size: 14px;">${lugar.nombre}</b>
                    <br>
                    ${lugar.info}
                `);
        }
    });
}

// Función que se ejecuta al hacer clic en una provincia.
function onProvinceClick(e) {
    const layer = e.target;
    const nombreProvincia = layer.feature.properties.nombre;

    map.fitBounds(layer.getBounds()); // Hacemos zoom a la provincia
    mostrarMarcadoresDeProvincia(nombreProvincia); // Filtramos y mostramos solo sus marcadores
}

function onEachFeature(feature, layer) {
    layer.on({
        click: onProvinceClick
    });
}

// Cargamos el GeoJSON de las provincias.
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


// 3. CARGAR DATOS DESDE GOOGLE SHEETS Y MOSTRARLOS
const googleSheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTozxVh-G1pmH5SPMY3GTizIK1I8l_a6PX6ZE5z3J0Gq3r9-xAmh8_9YmyIkvx3CwAXCCWC6zHmt3pU/pub?gid=0&single=true&output=csv';

Papa.parse(googleSheetURL, {
    download: true,
    header: true,
    complete: function(results) {
        todosLosLugares = results.data; // Guardamos todos los lugares
        mostrarTodosLosMarcadores();   // ¡Mostramos todos los marcadores inmediatamente!
    }
});
