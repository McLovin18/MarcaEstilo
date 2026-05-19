# Registro de Cambios - Sistema Dinámico de Variaciones

## Fecha: Mayo 17, 2026
## Versión: 1.0

### Archivos Creados

1. **app/components/VariationSelector.tsx** (Nuevo)
   - Componente para mostrar opciones como botones
   - Botones con estados seleccionado/no-seleccionado
   - Soporte para deshabilitación

2. **app/components/VariationsManager.tsx** (Nuevo)
   - Gestor inteligente de variaciones
   - Filtrado dinámico de opciones
   - Cálculo automático de stock
   - Lógica de cascada para atributos

3. **VARIACIONES_SISTEMA.md** (Nuevo)
   - Documentación completa del sistema
   - Ejemplos de uso
   - Estructura de datos

### Archivos Modificados

#### app/product-detail/page.tsx
**Cambios principales:**
- Importar `obtenerAtributos` para cargar atributos
- Importar `VariationsManager` y reemplazar selects
- Cambiar estado de `selectedTalla` y `selectedColor` a `selectedVariations` (genérico)
- Agregación de estado `currentStock` para stock dinámico
- Agregación de estado `atributos` para mapeo ID -> nombre
- Reemplazar lógica de cálculo de stock
- Reemplazar `handleAddCart` para soportar variaciones genéricas
- Reemplazar UI de selects por VariationsManager
- Actualizar indicador de disponibilidad

**Líneas afectadas:**
- Imports (líneas 1-15)
- Estados (líneas 20-25)
- UseEffect para cargar atributos (líneas 49-58)
- Lógica de derivados (líneas 165-195)
- handleAddCart (líneas 223-245)
- UI de stock (líneas 474-485)
- UI de selectores (líneas 487-530)
- UI de botón de compra (líneas 531-550)

#### app/components/ProductoCard.tsx
**Cambios principales:**
- Cambiar lógica de detección de "camiseta" a genérica `hasVariations`
- Agregar `variationAttributeIds` para detectar si realmente tiene variaciones
- Redirigir a detalle si `hasVariations && variationAttributeIds.length > 0`
- Soportar agregar directamente al carrito si no tiene variaciones
- Toast mejorado "Selecciona las opciones en el detalle del producto"

**Líneas afectadas:**
- Variables (líneas 37-48)
- handleCart (líneas 72-98)

### Comportamiento Antes vs Después

#### Antes
- Solo soportaba talla y color (hardcoded)
- Usaba selects HTML nativos
- Stock solo se calculaba para talla/color
- No era escalable

#### Después
- Soporta N variaciones dinámicamente
- Botones interactivos en lugar de selects
- Filtrado inteligente: al cambiar una opción, se limpian las posteriores
- Cálculo automático de stock y precios
- Interfaz consistente y moderna
- Escalable a cualquier tipo de variación

### Testing Recomendado

1. **Producto sin variaciones**
   - Agregar al carrito desde card ✓ (debe funcionar directamente)

2. **Producto con 1 variación (talla)**
   - Agregar desde card → redirige a detalle
   - Ver solo botones de talla
   - Seleccionar talla
   - Agregar al carrito

3. **Producto con 2 variaciones (talla + color)**
   - Agregar desde card → redirige a detalle
   - Ver botones de talla
   - Seleccionar talla
   - Ver solo colores disponibles para esa talla
   - Seleccionar color
   - Stock se actualiza
   - Agregar al carrito

4. **Verificar carrito**
   - Item tiene cartKey con variaciones
   - Item tiene selectedVariations
   - Se puede quitar del carrito

### Notas Importantes

- El sistema mantiene compatibilidad con productos legados (isCamiseta)
- Todos los componentes nuevos usan `dark:` classes para modo oscuro
- Los estilos están optimizados con Tailwind CSS
- Se preserva la misma experiencia visual que el resto del sitio

### Próximas Fases Recomendadas

1. **Fase 2**: Actualizar carrito para mostrar variaciones
2. **Fase 3**: Actualizar checkout para capturar variaciones en orden
3. **Fase 4**: Actualizar admin panel para mostrar variaciones en órdenes
4. **Fase 5**: Agregar filtros dinámicos de búsqueda por variaciones
