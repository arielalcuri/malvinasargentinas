// 1. INICIALIZAR EL MAPA
// Centramos el mapa en Argentina con un nivel de zoom inicial
const map = L.map('map').setView([-40, -63], 4);

// Añadimos una capa de mapa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


// 2. AÑADIR PROVINCIAS Y ZOOM
// Función que se ejecuta al hacer clic en una provincia
function onProvinceClick(e) {
    map.fitBounds(e.target.getBounds());
}

// Función que se aplica a cada provincia cargada
function onEachFeature(feature, layer) {
    layer.on({
        click: onProvinceClick // Llama a la función de zoom al hacer clic
    });
}

// Cargamos el GeoJSON directamente desde la API del gobierno
fetch('https://apis.datos.gob.ar/georef/api/v2.0/provincias.geojson')
    .then(response => response.json())
    .then(data => {
        // La API devuelve los datos dentro de una propiedad "features"
        // así que creamos un objeto GeoJSON válido
        const geojsonData = {
            "type": "FeatureCollection",
            "features": data.features
        };

        L.geoJSON(geojsonData, {
            onEachFeature: onEachFeature,
            style: { // Estilos básicos para las provincias
                color: "#1f599e",
                weight: 2,
                opacity: 0.8
            }
        }).addTo(map);
    })
    .catch(error => console.error('Error al cargar las provincias:', error));


// 3. AÑADIR MARCADORES DESDE TU GOOGLE SHEET
// Este es el enlace a tu hoja de cálculo
const googleSheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTozxVh-G1pmH5SPMY3GTizIK1I8l_a6PX6ZE5z3J0Gq3r9-xAmh8_9YmyIkvx3CwAXCCWC6zHmt3pU/pub?gid=0&single=true&output=csv';

Papa.parse(googleSheetURL, {
    download: true,
    header: true,
    complete: function(results) {
        // La función se ejecuta cuando los datos se han cargado y procesado
        results.data.forEach(lugar => {
            // Solo añade el marcador si las columnas 'lat' y 'lng' tienen datos
            if (lugar.lat && lugar.lng) { 
                L.marker([lugar.lat, lugar.lng])
                    .addTo(map)
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
});
