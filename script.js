/* =================================
  NUEVA FUNCIÓN doPost - ACTUALIZADA
  Esta versión acepta los campos: nombre, info, provincia
 =================================
*/

// IDs de tu Sheet y Drive (los mismos de antes)
const SPREADSHEET_ID = "1UIowFWfCqv3v3AZbGkRJhrRNk520_8mxzAtAyraUX6A";
const DRIVE_FOLDER_ID = "12cEmLYJQvyIZyStKF-YymZIl-7bRikMf";
const SHEET_NAME = "Hoja 1"; // ¡Asegúrate que este nombre sea correcto!

function doPost(e) {

  try {
    const data = JSON.parse(e.postData.contents);

    // --- NUEVO: Leemos los campos adicionales ---
    const nombre = data.nombre;
    const info = data.info;
    const provincia = data.provincia;
    // --- Fin de lo nuevo ---

    // Campos que ya teníamos
    const lat = data.lat;
    const lon = data.lon;
    const fileName = data.fileName;
    const fileData = data.fileData;

    // 2. Decodificar la imagen
    const contentType = fileData.substring(fileData.indexOf(':') + 1, fileData.indexOf(';'));
    const base64Data = fileData.substring(fileData.indexOf(',') + 1);
    const fileBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, fileName);

    // 3. Guardar en Google Drive
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const driveFile = folder.createFile(fileBlob);
    driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const imageUrl = driveFile.getUrl();

    // 4. Guardar en Google Sheet
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);

    // --- ACTUALIZADO: Añadimos las nuevas columnas ---
    // ¡ASEGÚRATE DE QUE ESTE ORDEN (A, B, C, D, E, F) COINCIDA CON TU GOOGLE SHEET!
    sheet.appendRow([lat, lon, imageUrl, nombre, info, provincia]);

    // 5. Enviar respuesta de ÉXITO
    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", message: "Punto guardado" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log(error);
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
