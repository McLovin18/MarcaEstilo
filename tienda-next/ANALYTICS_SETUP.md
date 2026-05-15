# 📊 ANALYTICS SETUP & CONFIGURATION

## Overview
El sistema de analytics rastrea:
- **Page Views**: Cuántas personas entraron a la página
- **Total Clicks**: Interacciones totales en la página
- **Click Breakdown**: Desglose por tipo (productos, categorías, botones, enlaces)

Los datos se muestran en el dashboard del admin y se reinician diariamente alrededor de las 11 PM.

---

## 🚀 Quick Start

### 1. **Tracking está automático**
- Page views: Se rastrea automáticamente cuando alguien entra a ANY página (LayoutContentClient)
- Clicks de productos: Se rastrea cuando hacen click en un ProductoCard
- Otros clicks: Se pueden rastrear usando el hook `useTracking()`

### 2. **Ver los datos en el Admin**
1. Accede a `https://tudominio.com/admin`
2. Mira la primera sección "Análisis del Día" con:
   - Número de visitantes
   - Total de clicks
   - Indicador de engagement (%)
   - Desglose de interacciones

---

## 🔧 Configuración del Reseteo Automático (11 PM)

### Opción A: Usar Vercel Cron Jobs (RECOMENDADO)

Si tu app está en Vercel, es la forma más fácil.

**1. Actualiza tu `next.config.ts`:**

```typescript
// Agrupa esto en tu next.config.ts
export async function crons? {
  return {
    rule: "0 23 * * *", // Todos los días a las 11 PM (23:00 UTC)
    path: "/api/admin/reset-analytics",
    secret: process.env.CRON_SECRET,
  };
}
```

**2. En tu `.env.local` (o varibles de Vercel):**
```
CRON_SECRET=tu_cron_secret_aleatorio_muy_seguro
```

**3. Actualiza el endpoint `/api/admin/reset-analytics.ts`:**
Cambia la verificación de token por:

```typescript
function verifyCronSecret(req: NextRequest): boolean {
  const secret = req.headers.get("x-vercel-cron-secret");
  return secret === process.env.CRON_SECRET;
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... resto del código
}
```

**Documentación oficial:** https://vercel.com/docs/cron-jobs

---

### Opción B: Usar EasyCron (Servicios externos)

Si no estás en Vercel o prefieres un servicio externo.

**1. Ve a https://www.easycron.com/**

**2. Login/Signup y crea un nuevo cron:**
- **URL**: `https://tudominio.com/api/admin/reset-analytics`
- **Method**: POST
- **HTTP Auth Username**: (déjalo vacío)
- **HTTP Auth Password**: (déjalo vacío)
- **Execution Schedule**: `0 23 * * *` (23:00 = 11 PM UTC)
- **Timezone**: Tu zona horaria

**3. En headers de la solicitud, agrega:**
```
x-admin-token: tu_ADMIN_MAINTENANCE_TOKEN
```

---

### Opción C: Usar Railway, AWS Lambda, Google Cloud Functions

Crea una función serverless que llame al endpoint cada día a las 11 PM.

---

## 📝 Usar Analytics en tus componentes

### Rastrear Page Views
```typescript
"use client";
import { useTrackPageView } from "@/lib/useAnalytics";

export default function MyComponent() {
  // Automáticamente rastrea cuando el componente se monta
  useTrackPageView();
  
  return <div>Mi componente</div>;
}
```

### Rastrear Clicks
```typescript
"use client";
import { useTracking } from "@/lib/useAnalytics";

export default function MyComponent() {
  const { 
    trackProductClick, 
    trackCategoryClick, 
    trackButtonClick, 
    trackLinkClick 
  } = useTracking();
  
  return (
    <button onClick={() => {
      trackButtonClick();
      // tu lógica
    }}>
      Haz click en mí
    </button>
  );
}
```

---

## 🔄 API Endpoints

### GET Analytics de Hoy
```bash
# Usa la función en tu código
import { getTodayAnalytics } from "@/lib/analytics-db";
const data = await getTodayAnalytics();
```

### Manual Reset Analytics
```bash
curl -X POST https://tudominio.com/api/admin/reset-analytics \
  -H "x-admin-token: tu_ADMIN_MAINTENANCE_TOKEN"
```

---

## 📊 Estructura de Datos en Firestore

**Colección:** `analytics`
**Documento ID:** `YYYY-MM-DD` (ej: `2024-04-17`)

```json
{
  "date": "2024-04-17",
  "pageViews": 145,
  "totalClicks": 832,
  "clicksByType": {
    "productClick": 320,
    "categoryClick": 120,
    "buttonClick": 280,
    "linkClick": 112
  },
  "lastUpdated": Timestamp
}
```

---

## ⚠️ Notas importantes

1. **Timezone UTC**: Los cron jobs están configurados en UTC. 11 PM UTC puede no ser 11 PM en tu hora local.
   - Para ajustar: USA UTC-5 = 4 AM del día siguiente en UTC = `0 4 * * *`
   - Verifica tu zona horaria

2. **Reseteo automático**: Se resetea a las 11 PM, no a las 12 AM. Puedes cambiar la hora editando `0 23 * * *` a tu preferencia.

3. **Datos históricos**: Los datos NO se borran automáticamente. Si quieres ver histórico, puedes guardar en otra colección antes de resetear.

4. **Token seguro**: Mantén `ADMIN_MAINTENANCE_TOKEN` seguro. Úsalo en variables de entorno, no en código público.

---

## 🐛 Debugging

Ver logs de analytics en Firebase Console:
```bash
# En tu navegador, abre Firebase Console y busca:
# - /analytics/[fecha_actual]
# - Documentos recientemente modificados
```

---

## 📞 Soporte

Si hay problemas:
1. Verifica que `ADMIN_MAINTENANCE_TOKEN` esté configurado
2. Asegúrate que la colección `analytics` existe en Firestore
3. Revisa los logs del servidor para errores de conexión
4. Confirma que el endpoint es accesible públicamente
