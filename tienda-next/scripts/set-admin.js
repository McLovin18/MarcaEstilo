#!/usr/bin/env node

/**
 * Script para establecer un usuario como admin
 * Uso: node scripts/set-admin.js hectorcobea03@gmail.com
 */

import 'dotenv/config';
import admin from 'firebase-admin';

// Verificar que las variables de entorno existan
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  console.error('❌ Error: Faltan variables de entorno en .env.local');
  console.error('Necesitas: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  process.exit(1);
}

// Inicializar Firebase Admin
const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
});

const adminAuth = admin.auth();

async function setAdmin(email) {
  try {
    console.log(`🔍 Buscando usuario: ${email}`);
    
    // Obtener usuario por email
    const user = await adminAuth.getUserByEmail(email);
    console.log(`✓ Usuario encontrado: ${user.uid}`);
    
    // Establecer custom claim
    console.log(`⚙️  Estableciendo claim admin...`);
    await adminAuth.setCustomUserClaims(user.uid, { admin: true });
    
    console.log(`✅ ¡ÉXITO! ${email} ahora es ADMIN`);
    console.log(`   UID: ${user.uid}`);
    
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    process.exit(1);
  } finally {
    // Cerrar la app de Firebase
    await admin.app().delete();
    process.exit(0);
  }
}

// Obtener email del argumento o usar el default
const email = process.argv[2] || 'hectorcobea03@gmail.com';
setAdmin(email);
