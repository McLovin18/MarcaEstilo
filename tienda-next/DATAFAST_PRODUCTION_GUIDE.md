# Guía de Despliegue a Producción - Datafast

## Paso 1: Archivo .env.local (desarrollo) y Variables de Entorno en Vercel (producción)

### Variables de Entorno
Crea/actualiza tu archivo `.env.local` en desarrollo y configura las mismas variables en Vercel (Settings → Environment Variables):

```env
# Datafast
# Para TESTING (desarrollo):
DATAFAST_BASE_URL=https://test.oppwa.com
NEXT_PUBLIC_DATAFAST_SCRIPT_URL=https://test.oppwa.com/v1/paymentWidgets.js?checkoutId=
DATAFAST_TEST_MODE=1

# Para PRODUCCIÓN:
# DATAFAST_BASE_URL=https://oppwa.com
# NEXT_PUBLIC_DATAFAST_SCRIPT_URL=https://oppwa.com/v1/paymentWidgets.js?checkoutId=
# DATAFAST_TEST_MODE=0

# Credenciales Datafast (actualiza con las de producción cuando las tengas)
DATAFAST_ENTITY_ID=tu-id-entidad-produccion
DATAFAST_AUTH_TOKEN=tu-token-acceso-produccion
DATAFAST_CURRENCY=USD
```

## Paso 2: Configurar Variables en Vercel
1. Ve a tu proyecto en Vercel
2. Navega a Settings → Environment Variables
3. Agrega todas las variables del paso 1 (sin el `#` para producción)
4. Asegúrate de marcar las variables sensibles (DATAFAST_AUTH_TOKEN, etc.) como secretas

## Paso 3: Actualizar Credenciales de Producción
Espera a que Datafast te proporcione:
- ID de entidad de producción
- Access Token de producción
- MID y TID de producción

Y actualiza las variables de entorno en Vercel.

## Paso 4: Verificar el Widget
- El widget ya tiene la imagen de certificación de Datafast
- Tiene la configuración `style: "card"`, `locale: "es"` y los labels correctos
- El botón debería mostrar la imagen "Powered by Datafast"

## Paso 5: Probar en Producción
1. Haz un deploy en Vercel
2. Realiza una compra de prueba con una tarjeta real (o de prueba si Datafast lo permite)
3. Verifica que la transacción se procese correctamente
4. Verifica que la orden se guarde en Firebase
5. Verifica que recibas la confirmación por email

## Notas Importantes
- `DATAFAST_TEST_MODE`: en producción, asegúrate de configurarlo en `0` o quítalo (el código revisa si la URL es de test o la variable existe)
- El código ya está preparado para usar variables de entorno, solo hay que actualizarlas
- La imagen de certificación ya está agregada en el widget
