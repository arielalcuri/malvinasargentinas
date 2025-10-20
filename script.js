/* =================================
  PARTE 1: CÓDIGO DE SUBIDA DE FORMULARIO
  (No toques nada aquí, excepto la URL)
 =================================
*/

// ⬇️ PEGA AQUÍ LA URL DE TU SCRIPT DE GOOGLE (termina en /exec)
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxQTtEPpn1Yrm0NeSDvmxMrNhjZOv27K73ofRrnyH60x8VtCxglui3G7i9FWf2kXpLM/exec";

// Espera a que todo el HTML esté cargado
document.addEventListener('DOMContentLoaded', (event) => {

    // Busca el formulario por su ID "uploadForm"
    const form = document.getElementById("uploadForm");

    // Solo si el formulario existe, le añade el "listener"
    if (form) {
        form.addEventListener("submit", function(e) {
          e.preventDefault(); // Evita que la página se recargue

          // Leemos todos los campos del formulario
          const nombre = document.getElementById("nombre").value;
          const info = document.getElementById("info").value;
          const provincia = document.getElementById("provincia").value;
          const lat = document.getElementById("lat").value;
          const lon = document.getElementById("lon").value; // ID es "lon"
          const fileInput = document.getElementById("file");
          const file = fileInput.files[0];

          const statusDiv = document.getElementById("status");
          statusDiv.innerHTML = "Subiendo, por favor espera...";

          if (!file || !lat || !lon || !nombre || !info || !provincia) {
            statusDiv.innerHTML = "Por favor, completa todos los campos.";
            return;
          }

          // 2. Usar FileReader para convertir la imagen a Base64
          const reader = new FileReader();
          reader.readAsDataURL(file);

          // 3. Cuando el archivo esté leído...
          reader.onload = function() {
            const fileData = reader.result;
            const fileName = file.name;

            // 4. Preparamos el objeto con TODOS los datos
            const dataToSend = {
              lat: lat,
              lon: lon,
              fileName: fileName,
              fileData: fileData,
              nombre: nombre,
              info: info,
              provincia: provincia
            };

            // 5. Enviar los datos a Google Apps Script
            fetch(GAS_WEB_APP_URL, {
              method: 'POST',
              body: JSON.stringify(dataToSend),
              headers: {
                'Content-Type': 'text/plain;charset=utf-8',
              }
            })
            .then(response => response.json())
            .then(result => {
              console.log(result);
              if (result.status === "success") {
                statusDiv.innerHTML = `¡Éxito! Punto agregado.`;
                document.getElementById("uploadForm").reset(); // Limpia el formulario

                // Opcional: Llama a tu función para recargar los puntos del mapa aquí
                // ej: cargarDatosDelSheet();

              } else {
                statusDiv.innerHTML = "Error: " + result.message;
              }
            })
            .catch(error => {
              console.error('Error de conexión:', error);
              statusDiv.innerHTML = "Error grave en la conexión: " + error;
            });
          };

          reader.onerror = function(error) {
              console.error('Error leyendo el archivo:', error);
              statusDiv.innerHTML = "Error al leer el archivo.";
          };
        });
    } else {
        console.error("Error: No se encontró el formulario con id 'uploadForm'.");
    }


    /* =================================
      PARTE 2: TU CÓDIGO DE MAPA
      ¡PEGA TU CÓDIGO ANTIGUO (el que inicializa el mapa,
      carga los datos, el geocoder, etc.) AQUÍ ABAJO!
     =================================
    */

    // Ejemplo:
    // const map = L.map('map').setView([-40.76, -65.0], 4);
    //
    // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    // }).addTo(map);
    //
    // function cargarDatosDelSheet() {
    //    ...tu código de PapaParse...
    // }
    //
    // ...tu código de geocoder...
    // ...tu código del buscador de provincias...
    // ...tu código del botón de reset...
    // ...etc...


}); // <-- Fin del document.addEventListener('DOMContentLoaded')
