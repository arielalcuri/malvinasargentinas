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
    // Usamos .trim() aquí también por seguridad
    const lugaresDeLaProvincia = todosLosLugares.filter(lugar => lugar.provincia && lugar.provincia.trim() === nombreProvincia);
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

fetch('provincias.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
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
        
        const dataList = document.getElementById('province-list');
        
        // --- LÓGICA MEJORADA PARA ELIMINAR DUPLICADOS Y ESPACIOS ---
        // 1. Creamos un array con los nombres de provincia, eliminando espacios invisibles.
        const todasLasProvincias = todosLosLugares
            .map(lugar => lugar.provincia ? lugar.provincia.trim() : null) // .trim() elimina espacios
            .filter(Boolean); // .filter(Boolean) elimina valores nulos o vacíos
        
        // 2. Usamos 'Set' para obtener una lista de valores únicos.
        const provinciasUnicas = [...new Set(todasLasProvincias)];
        
        // 3. Creamos las opciones del buscador.
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
    // Usamos .trim() en la búsqueda también
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
