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
let geojsonLayer = null; // Variable para guardar la capa de provincias

const defaultStyle = { color: "#083D77", weight: 1.5, opacity: 1, fillColor: "#2E628F", fillOpacity: 0.4, "interactive": true };
const highlightStyle = { color: "#F9A620", weight: 3, opacity: 1, fillColor: "#F9A620", fillOpacity: 0.6, "interactive": true };
const hiddenStyle = { opacity: 0, fillOpacity: 0, "interactive": false }; // Estilo para ocultar

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

    geojsonLayer.eachLayer(l => l.setStyle(hiddenStyle));
    layer.setStyle(highlightStyle);
    layer.bringToFront();
    provinciaSeleccionada = layer;

    map.flyToBounds(layer.getBounds());
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

// *** IMPORTANTE: Asegúrate de que la ruta tenga './' al principio ***
fetch('./provincias.geojson')
    .then(response => response.json())
    .then(data => {
        geojsonLayer = L.geoJSON(data, {
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
        const dataListForm = document.getElementById('province-list-form');
        const todasLasProvincias = todosLosLugares
            .map(lugar => lugar.provincia ? lugar.provincia.trim() : null)
            .filter(Boolean);
        const provinciasUnicas = [...new Set(todasLasProvincias)];
        
        provinciasUnicas.forEach(nombreProvincia => {
            const option = document.createElement('option');
            option.value = nombreProvincia;
            dataList.appendChild(option);
            dataListForm.appendChild(option.cloneNode(true));
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

// --- 5. LÓGICA DEL FORMULARIO DE CARGA (EXIF, CLOUDINARY y GOOGLE SCRIPT) ---

// *** ¡REEMPLAZA ESTOS VALORES! ***
const CLOUD_NAME = "dm11xhsaq"; // (¡Este es tu Cloud Name!)
const UPLOAD_PRESET = "mapa-interactivo-malvinas"; // (¡Este es tu Preset!)
// **********************************

const urlApiCloudinary = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby7Qfv-fl4uifXiL8edLPkHIZXyrpjKvlWmsuYKtLF9ncp6WdWKxJooLWBM46TZUIWA/exec'; // URL del usuario

// Referencias a los elementos del formulario
const newPointForm = document.getElementById('new-point-form');
const archivoInput = document.getElementById('punto-imagen-upload');
const hiddenImagenInput = document.getElementById('imagen-url-hidden');
const inputLat = document.getElementById('form-lat');
const inputLng = document.getElementById('form-lng');
const exifStatus = document.getElementById('exif-status');

// --- Función Helper para EXIF ---
// Convierte Grados, Minutos, Segundos (DMS) a Grados Decimales (DD)
function dmsToDd(grados, minutos, segundos, direccion) {
    let dd = grados + minutos / 60 + segundos / 3600;
    // Las latitudes Sur (S) y longitudes Oeste (W) son negativas
    if (direccion === "S" || direccion === "W") {
        dd = dd * -1;
    }
    return dd;
}

// --- Listener para leer EXIF al seleccionar imagen ---
archivoInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }

    // Reseteamos los campos y el estado
    inputLat.value = '';
    inputLng.value = '';
    exifStatus.style.display = 'none';

    // Usamos la librería EXIF.js
    EXIF.getData(file, function() {
        const lat = EXIF.getTag(this, "GPSLatitude");
        const lng = EXIF.getTag(this, "GPSLongitude");
        const latRef = EXIF.getTag(this, "GPSLatitudeRef");
        const lngRef = EXIF.getTag(this, "GPSLongitudeRef");

        if (lat && lng && latRef && lngRef) {
            // ¡Éxito! Convertimos los datos
            const decimalLat = dmsToDd(lat[0], lat[1], lat[2], latRef);
            const decimalLng = dmsToDd(lng[0], lng[1], lng[2], lngRef);

            // Rellenamos los campos del formulario
            inputLat.value = decimalLat.toFixed(6); // .toFixed(6) para 6 decimales
            inputLng.value = decimalLng.toFixed(6);

            // Mostramos un mensaje de éxito
            exifStatus.textContent = "¡Coordenadas GPS encontradas!";
            exifStatus.style.color = "#083D77";
            exifStatus.style.display = 'block';

            // Movemos el mapa a esa ubicación y añadimos un marcador temporal
            map.flyTo([decimalLat, decimalLng], 12); // Zoom 12

        } else {
            // No se encontraron datos GPS
            exifStatus.textContent = "La imagen no tiene datos GPS. Debe añadirlos manualmente.";
            exifStatus.style.color = "red";
            exifStatus.style.display = 'block';
            
            // Hacemos los campos editables si no hay GPS
            inputLat.readOnly = false;
            inputLng.readOnly = false;
            inputLat.placeholder = "Latitud (manual)";
            inputLng.placeholder = "Longitud (manual)";
        }
    });
});


// --- Listener para ENVIAR el formulario (SUBMIT) ---
newPointForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const submitButton = newPointForm.querySelector('button[type="submit"]');
    const archivo = archivoInput.files[0];

    // Verificamos que los campos de lat/lng no estén vacíos
    if (!inputLat.value || !inputLng.value) {
        alert("Por favor, asegúrese de que la imagen tenga GPS o rellene la latitud y longitud manualmente.");
        return;
    }

    // --- 1. PROCESO DE SUBIDA A CLOUDINARY ---
    if (archivo) {
        submitButton.disabled = true;
        submitButton.textContent = "Subiendo imagen...";

        const formDataCloudinary = new FormData();
        formDataCloudinary.append('file', archivo);
        formDataCloudinary.append('upload_preset', UPLOAD_PRESET);

        try {
            const respuesta = await fetch(urlApiCloudinary, {
                method: 'POST',
                body: formDataCloudinary
            });
            
            if (!respuesta.ok) throw new Error('Error al subir a Cloudinary');
            
            const dataCloudinary = await respuesta.json();
            
            // ¡Éxito! Ponemos la URL obtenida en el input oculto
            hiddenImagenInput.value = dataCloudinary.secure_url; 
            console.log("Imagen subida:", hiddenImagenInput.value);

        } catch (error) {
            console.error('Error en Cloudinary:', error);
            alert("Hubo un error al subir la imagen. Intenta de nuevo.");
            submitButton.disabled = false;
            submitButton.textContent = "Añadir al Mapa";
            return; // Detenemos la función si falla la subida de imagen
        }
    } else {
        // Esto no debería pasar por el 'required' del HTML, pero es una validación extra
        alert("Por favor, selecciona un archivo de imagen.");
        return;
    }

    // --- 2. PROCESO DE ENVÍO A GOOGLE SCRIPT ---
    
    console.log("Enviando a Google Script...");
    submitButton.textContent = "Guardando punto...";

    fetch(SCRIPT_URL, {
        method: 'POST',
        body: new FormData(newPointForm) 
    })
    .then(response => response.json())
    .then(data => {
        if (data.result === 'success') {
            alert('¡Punto añadido con éxito! El mapa se actualizará en 1-2 minutos. Por favor, recarga la página.');
            newPointForm.reset();
            // Reseteamos el estado del formulario EXIF
            exifStatus.style.display = 'none';
            inputLat.readOnly = true;
            inputLng.readOnly = true;
            inputLat.placeholder = "Latitud (automática)";
            inputLng.placeholder = "Longitud (automática)";
        } else {
            alert('Hubo un error al añadir el punto.');
        }
    })
    .catch(error => {
        console.error('Error en Google Script:', error);
        alert('Hubo un error al guardar el punto.');
    })
    .finally(() => {
        // Reactivamos el botón al finalizar (éxito o error)
        submitButton.disabled = false;
        submitButton.textContent = "Añadir al Mapa";
    });
});


// 6. LÓGICA DEL FORMULARIO COLAPSABLE
const formContainer = document.getElementById('form-container');
const formHeader = formContainer.querySelector('h3');
formHeader.addEventListener('click', () => {
    formContainer.classList.toggle('expanded');
});

// --- 7. LÓGICA DEL BOTÓN DE RESET ---
const resetButton = document.getElementById('reset-button');

function resetMap() {
    // 1. Mostramos todas las provincias
    if (geojsonLayer) {
        geojsonLayer.eachLayer(l => l.setStyle(defaultStyle));
    }
    
    // 2. Reseteamos el zoom
    map.flyToBounds(bounds);
    
    // 3. Mostramos todos los marcadores
    mostrarTodosLosMarcadores();
    
    // 4. Limpiamos la selección
    provinciaSeleccionada = null;
}

resetButton.addEventListener('click', resetMap);
