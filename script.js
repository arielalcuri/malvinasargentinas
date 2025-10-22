// 1. INICIALIZAR EL MAPA
const map = L.map('map');

// ++ ESTAS LÍNEAS FALTABAN EN LA RESPUESTA ANTERIOR ++
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
let geojsonLayer = null;

// Variable global para guardar los polígonos
let provinciasGeoJSONData = null;

const defaultStyle = { color: "#083D77", weight: 1.5, opacity: 1, fillColor: "#2E628F", fillOpacity: 0.4, "interactive": true };
const highlightStyle = { color: "#F9A620", weight: 3, opacity: 1, fillColor: "#F9A620", fillOpacity: 0.6, "interactive": true };
const hiddenStyle = { opacity: 0, fillOpacity: 0, "interactive": false }; // Estilo para ocultar

// Lista maestra de jurisdicciones
const JURISDICCIONES_ARG = [
    "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Ciudad Autónoma de Buenos Aires",
    "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja",
    "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis",
    "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego, Antártida e Islas del Atlántico Sur", "Tucumán"
];

// Función para poblar el datalist del formulario
function popularListaProvinciasForm() {
    const dataListForm = document.getElementById('province-list-form');
    dataListForm.innerHTML = ''; 
    JURISDICCIONES_ARG.forEach(nombreProvincia => {
        const option = document.createElement('option');
        option.value = nombreProvincia;
        dataListForm.appendChild(option);
    });
}
popularListaProvinciasForm();


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

// Ruta corregida para GitHub Pages
fetch('./provincias.geojson')
    .then(response => response.json())
    .then(data => {
        // Guardamos los datos del GeoJSON en la variable global
        provinciasGeoJSONData = data; 

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


// --- 5. LÓGICA DEL FORMULARIO DE CARGA (EXIF, CLOUDINARY y GOOGLE SCRIPT) ---

const CLOUD_NAME = "dm11xhsaq";
const UPLOAD_PRESET = "mapa-interactivo-malvinas";
const urlApiCloudinary = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby7Qfv-fl4uifXiL8edLPkHIZXyrpjKvlWmsuYKtLF9ncp6WdWKxJooLWBM46TZUIWA/exec';

// --- Referencias a los elementos del formulario ---
const newPointForm = document.getElementById('new-point-form');
const archivoInput = document.getElementById('punto-imagen-upload');
const hiddenImagenInput = document.getElementById('imagen-url-hidden');
const inputLat = document.getElementById('form-lat');
const inputLng = document.getElementById('form-lng');
const exifStatus = document.getElementById('exif-status');
const inputProvincia = document.getElementById('form-provincia');

// --- Referencias para el Login (se usan en Sección 6) ---
const loginModal = document.getElementById('login-modal-overlay');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const loginCancelButton = document.getElementById('login-cancel-button');
const formContainer = document.getElementById('form-container');
const formHeader = formContainer.querySelector('h3');


// --- Función Helper para EXIF ---
function dmsToDd(grados, minutos, segundos, direccion) {
    let dd = grados + minutos / 60 + segundos / 3600;
    if (direccion === "S" || direccion === "W") {
        dd = dd * -1;
    }
    return dd;
}

// --- Listener para leer EXIF al seleccionar imagen ---
archivoInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) { return; }

    // Reseteamos los campos
    inputLat.value = '';
    inputLng.value = '';
    inputProvincia.value = '';
    exifStatus.style.display = 'none';
    inputProvincia.readOnly = false; // Lo reseteamos a editable
    inputProvincia.placeholder = "Provincia (automática)";

    EXIF.getData(file, function() {
        const lat = EXIF.getTag(this, "GPSLatitude");
        const lng = EXIF.getTag(this, "GPSLongitude");
        const latRef = EXIF.getTag(this, "GPSLatitudeRef");
        const lngRef = EXIF.getTag(this, "GPSLongitudeRef");

        if (lat && lng && latRef && lngRef) {
            const decimalLat = dmsToDd(lat[0], lat[1], lat[2], latRef);
            const decimalLng = dmsToDd(lng[0], lng[1], lng[2], lngRef);

            inputLat.value = decimalLat.toFixed(6);
            inputLng.value = decimalLng.toFixed(6);

            exifStatus.textContent = "¡Coordenadas GPS encontradas!";
            exifStatus.style.color = "#083D77";
            exifStatus.style.display = 'block';
            inputLat.readOnly = true;
            inputLng.readOnly = true;

            map.flyTo([decimalLat, decimalLng], 12);

            // Llamamos a la función de búsqueda de provincia
            findProvinciaFromCoords(decimalLat, decimalLng);

        } else {
            exifStatus.textContent = "La imagen no tiene datos GPS. Debe añadirlos manualmente.";
            exifStatus.style.color = "red";
            exifStatus.style.display = 'block';
            inputLat.readOnly = false;
            inputLng.readOnly = false;
            inputProvincia.readOnly = false;
            inputLat.placeholder = "Latitud (manual)";
            inputLng.placeholder = "Longitud (manual)";
            inputProvincia.placeholder = "Provincia (manual)";
        }
    });
});

// --- Nueva Función "Punto en Polígono" con Turf.js ---
function findProvinciaFromCoords(lat, lng) {
    if (!provinciasGeoJSONData) {
        console.error("Los datos de provincias aún no se han cargado.");
        exifStatus.textContent += " Error: No se pudieron cargar los límites de provincias.";
        exifStatus.style.color = "red";
        return;
    }

    // Creamos un punto usando Turf (Turf usa [Longitud, Latitud])
    const point = turf.point([lng, lat]);
    let foundProvincia = null;

    for (const feature of provinciasGeoJSONData.features) {
        const isInside = turf.booleanPointInPolygon(point, feature.geometry);
        
        if (isInside) {
            foundProvincia = feature.properties.nombre;
            break;
        }
    }

    if (foundProvincia) {
        inputProvincia.value = foundProvincia;
        inputProvincia.readOnly = true; // La bloqueamos
        exifStatus.textContent = `¡Coordenadas y provincia encontradas: ${foundProvincia}!`;
        exifStatus.style.color = "#083D77";
    } else {
        exifStatus.textContent += " Punto fuera de los límites de Argentina.";
        exifStatus.style.color = "red";
        inputProvincia.readOnly = false;
        inputProvincia.placeholder = "Provincia (no se encontró)";
    }
}


// --- Listener para ENVIAR el formulario (SUBMIT) ---
newPointForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const submitButton = newPointForm.querySelector('button[type="submit"]');
    const archivo = archivoInput.files[0];

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
            const respuesta = await fetch(urlApiCloudinary, { method: 'POST', body: formDataCloudinary });
            if (!respuesta.ok) throw new Error('Error al subir a Cloudinary');
            const dataCloudinary = await respuesta.json();
            hiddenImagenInput.value = dataCloudinary.secure_url;
            console.log("Imagen subida:", hiddenImagenInput.value);
        } catch (error) {
            console.error('Error en Cloudinary:', error);
            alert("Hubo un error al subir la imagen. Intenta de nuevo.");
            submitButton.disabled = false;
            submitButton.textContent = "Añadir al Mapa";
            return;
        }
    } else {
        alert("Por favor, selecciona un archivo de imagen.");
        return;
    }

    // --- 2. PROCESO DE ENVÍO A GOOGLE SCRIPT ---
    console.log("Enviando a Google Script...");
    submitButton.textContent = "Guardando punto...";
    const pointFormData = new FormData(newPointForm);
    pointFormData.append('action', 'addPoint');
    fetch(SCRIPT_URL, { method: 'POST', body: pointFormData })
    .then(response => response.json())
    .then(data => {
        if (data.result === 'success') {
            alert('¡Punto añadido con éxito! El mapa se actualizará en 1-2 minutos. Por favor, recarga la página.');
            newPointForm.reset();
            exifStatus.style.display = 'none';
            inputLat.readOnly = true;
            inputLng.readOnly = true;
            inputProvincia.readOnly = false; // Reseteamos
            inputLat.placeholder = "Latitud (automática)";
            inputLng.placeholder = "Longitud (automática)";
            inputProvincia.placeholder = "Provincia (automática)";
            formContainer.classList.remove('expanded');
        } else {
            alert('Hubo un error al añadir el punto.');
        }
    })
    .catch(error => {
        console.error('Error en Google Script:', error);
        alert('Hubo un error al guardar el punto.');
    })
    .finally(() => {
        submitButton.disabled = false;
        submitButton.textContent = "Añadir al Mapa";
    });
});


// 6. LÓGICA DEL LOGIN Y FORMULARIO
let isLoggedIn = false; 
formHeader.addEventListener('click', () => {
    if (isLoggedIn) {
        formContainer.classList.toggle('expanded');
    } else {
        loginModal.classList.add('visible');
    }
});
loginCancelButton.addEventListener('click', () => {
    loginModal.classList.remove('visible');
    loginError.style.display = 'none';
    loginForm.reset();
});
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const cuil = document.getElementById('login-cuil').value;
    const pass = document.getElementById('login-pass').value;
    const loginButton = document.getElementById('login-button');
    loginButton.disabled = true;
    loginButton.textContent = "Verificando...";
    loginError.style.display = 'none';
    const formData = new FormData();
    formData.append('action', 'login');
    formData.append('cuil', cuil);
    formData.append('pass', pass);
    fetch(SCRIPT_URL, { method: 'POST', body: formData })
    .then(response => response.json())
    .then(data => {
        if (data.result === 'success') {
            isLoggedIn = true;
            loginModal.classList.remove('visible');
            formContainer.classList.add('expanded');
        } else {
            loginError.textContent = data.message || "CUIL o contraseña incorrectos";
            loginError.style.display = 'block';
        }
    })
    .catch(error => {
        console.error('Error en Login:', error);
        loginError.textContent = "Error de conexión con el servidor.";
        loginError.style.display = 'block';
    })
    .finally(() => {
        loginButton.disabled = false;
        loginButton.textContent = "Ingresar";
        if (!isLoggedIn) {
            loginForm.reset();
        }
    });
});

// --- 7. LÓGICA DEL BOTÓN DE RESET ---
const resetButton = document.getElementById('reset-button');

function resetMap() {
    if (geojsonLayer) {
        geojsonLayer.eachLayer(l => l.setStyle(defaultStyle));
    }
    map.flyToBounds(bounds);
    mostrarTodosLosMarcadores();
    provinciaSeleccionada = null;
}

resetButton.addEventListener('click', resetMap);
