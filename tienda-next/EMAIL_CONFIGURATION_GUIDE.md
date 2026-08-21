# Guía de Configuración de Email - MarcaEstilo

## 📧 Sistema Unificado de Email con Resend

**Simplificación:** Ahora usamos **solo Resend** para todos los envíos de email:
- ✅ Notificaciones al dueño después de pago Datafast
- ✅ Confirmaciones de orden a clientes
- ✅ Cualquier otro email del sistema

---

## 🚀 **Configuración de Resend**

### Variables de Entorno Requeridas

```env
# API Key de Resend (obligatorio)
RESEND_API_KEY=re_xxxxxxxxxxxxxx

# Email desde el cual se envían los correos
RESEND_FROM_EMAIL=MarcaEstilo <pedidos@marcaestilo.com>

# Email del dueño de la tienda (recibe notificaciones de pedidos)
STORE_OWNER_EMAIL=marcaestilo593@gmail.com

# Dominio público (opcional, para links en emails)
NEXT_PUBLIC_DOMAIN=https://marcaestilo.com
```

### Pasos para Configurar Resend

1. **Crear cuenta en Resend:**
   - Ve a [resend.com](https://resend.com) y regístrate
   - Es gratis para hasta 3,000 emails/mes

2. **Obtener API Key:**
   - Ve a Settings → API Keys
   - Crea una nueva API Key
   - Copia la key (comienza con `re_`)

3. **Configurar dominio (recomendado):**
   - Ve a Settings → Domains
   - Agrega tu dominio (ej: marcaestilo.com)
   - Resend te dará los registros DNS que debes agregar
   - Esto mejora la entrega de emails y evita spam

4. **Configurar remitente:**
   - Una vez verificado el dominio, puedes usar emails como `pedidos@marcaestilo.com`
   - Si no verificas dominio, puedes usar el dominio por defecto de Resend

---

## 📋 **Configuración Completa Recomendada**

### Archivo `.env.local` (Desarrollo)

```env
# === DATAFAST ===
DATAFAST_BASE_URL=https://test.oppwa.com
NEXT_PUBLIC_DATAFAST_SCRIPT_URL=https://test.oppwa.com/v1/paymentWidgets.js?checkoutId=
DATAFAST_TEST_MODE=1
DATAFAST_ENTITY_ID=tu-id-entidad-testing
DATAFAST_AUTH_TOKEN=tu-token-testing
DATAFAST_CURRENCY=USD
DATAFAST_MID=1000000406
DATAFAST_TID=PD100406

# === EMAIL UNIFICADO (Resend) ===
RESEND_API_KEY=re_xxxxxxxxxxxxxx
RESEND_FROM_EMAIL=MarcaEstilo <pedidos@marcaestilo.com>
STORE_OWNER_EMAIL=marcaestilo593@gmail.com
NEXT_PUBLIC_DOMAIN=https://marcaestilo.vercel.app

# === FIREBASE ===
FIREBASE_PROJECT_ID=tu-proyecto-firebase
FIREBASE_CLIENT_EMAIL=tu-service-account@firebase...
FIREBASE_PRIVATE_KEY=tu-private-key
FIREBASE_DATABASE_URL=https://tu-proyecto.firebaseio.com
```

### Variables en Vercel (Producción)

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega todas las variables anteriores
4. Marca las sensibles como secretas:
   - `RESEND_API_KEY`
   - `DATAFAST_AUTH_TOKEN`
   - `FIREBASE_PRIVATE_KEY`

---

## 🎯 **Flujo de Email con Datafast**

**Flujo simplificado:**
1. Cliente paga con Datafast ✅
2. Datafast confirma el pago
3. Sistema actualiza orden en Firebase
4. **Resend envía email al dueño** ← Notificación automática
5. **Resend envía email al cliente** ← Confirmación de pedido

**Conclusión:** Para que funcionen los emails automáticos después del pago Datafast, **solo necesitas configurar Resend**.

---

## 🧪 **Prueba de Configuración**

### Script de Prueba para Resend

```javascript
// test-resend-config.mjs
const { Resend } = require('resend');

async function testResendConfig() {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: process.env.STORE_OWNER_EMAIL,
      subject: '🧪 Prueba de Email - MarcaEstilo',
      html: '<strong>Este es un correo de prueba desde MarcaEstilo usando Resend.</strong>',
    });

    console.log('✅ Email de prueba enviado exitosamente:', result);
  } catch (error) {
    console.error('❌ Error en configuración Resend:', error);
  }
}

testResendConfig();
```

**Ejecutar prueba:**
```bash
node test-resend-config.mjs
```

---

## ⚠️ **Solución de Problemas Comunes**

### **Resend: API Key inválida**
- Verificar que la API Key comience con `re_`
- Verificar que la API Key esté activa en el dashboard de Resend

### **Dominio no verificado**
- Si usas un dominio personalizado, verifícalo en Resend
- Si no verificas dominio, usa el dominio por defecto de Resend

### **Email no llega**
- Revisar carpeta SPAM
- Verificar que el email del destinatario sea correcto
- Revisar logs del servidor para errores
- Verificar el dashboard de Resend para ver el estado del envío

### **Límites de Resend**
- Plan gratuito: 3,000 emails/mes
- Si excedes el límite, los emails fallarán
- Monitorea el uso en el dashboard de Resend

---

## 📝 **Resumen**

**Mínimo requerido para Datafast:**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxx
RESEND_FROM_EMAIL=MarcaEstilo <pedidos@marcaestilo.com>
STORE_OWNER_EMAIL=marcaestilo593@gmail.com
```

**Ventajas de usar solo Resend:**
- ✅ Configuración más simple (una sola API Key)
- ✅ Mejor entrega de emails
- ✅ Dashboard para monitorear envíos
- ✅ Dominios personalizados fáciles de configurar
- ✅ Integración moderna y robusta
- ✅ Gratis hasta 3,000 emails/mes

**¿Necesitas ayuda para configurar tu dominio en Resend?**