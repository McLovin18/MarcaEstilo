// diagnostico.js
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, "firebase-adminsdk.json"), "utf-8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "marcaestilodb.firebasestorage.app"
});

const bucket = admin.storage().bucket();
const db = admin.firestore();

async function diagnosticar() {
  // 1. Listar TODOS los archivos en productos/
  console.log("=== ARCHIVOS EN STORAGE (productos/) ===");
  const [files] = await bucket.getFiles({ prefix: "productos/" });
  files.filter(f => !f.name.endsWith("/")).forEach(f => console.log(" STORAGE:", f.name));

  // 2. Listar todas las URLs guardadas en Firestore
  console.log("\n=== URLs EN FIRESTORE (productos) ===");
  const snap = await db.collection("productos").get();
  for (const doc of snap.docs) {
    const imagenes = doc.data().imagenes || [];
    imagenes.forEach(url => {
      const match = url.match(/\/o\/(.+?)\?/);
      const filePath = match ? decodeURIComponent(match[1]) : "NO SE PUDO EXTRAER";
      console.log(" FIRESTORE path:", filePath);
      console.log(" FIRESTORE url: ", url.substring(0, 80) + "...");
    });
  }

  // 3. Verificar colección landingpage
  console.log("\n=== COLECCIONES EN FIRESTORE ===");
  const collections = await db.listCollections();
  collections.forEach(c => console.log(" Colección:", c.id));
}

diagnosticar().catch(console.error);