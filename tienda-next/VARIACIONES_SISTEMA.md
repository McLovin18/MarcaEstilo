# Sistema Dinámico de Variaciones de Productos

## Descripción General

El nuevo sistema permite gestionar variaciones de productos (como talla, color, tamaño, etc.) de forma completamente dinámica. En lugar de selects tradicionales, los clientes seleccionan opciones mediante botones atractivos.

## Componentes Principales

### 1. VariationSelector.tsx
Componente individual que muestra un atributo con sus opciones disponibles como botones.

**Uso:**
```tsx
<VariationSelector
  label="Talla"
  options={["S", "M", "L", "XL"]}
  selectedValue="M"
  onSelect={(value) => handleSelect(value)}
/>
```

**Características:**
- Botones con feedback visual
- Selección y deselección
- Puede deshabilitarse

### 2. VariationsManager.tsx
Gestor inteligente que:
- Filtra opciones disponibles dinámicamente
- Calcula stock automáticamente
- Limpia selecciones posteriores cuando cambia una opción anterior
- Soporta N variaciones

**Uso:**
```tsx
<VariationsManager
  stockVariants={producto.stockVariants}
  variationAttributeIds={["attr_id_1", "attr_id_2"]}
  attributeNames={{"attr_id_1": "Talla", "attr_id_2": "Color"}}
  selectedVariations={{attr_id_1: "M", attr_id_2: "Rojo"}}
  onVariationChange={(attrId, value) => handleChange(attrId, value)}
  onStockChange={(stock) => setCurrentStock(stock)}
/>
```

**Características:**
- Filtrado en cascada: si cambia la talla, solo muestra colores disponibles para esa talla
- Cálculo automático de stock
- Callback cuando cambia el stock
- Interfaz limpia con separadores visuales

## Flujo de Compra

### Para Productos sin Variaciones
1. Usuario ve el ProductoCard
2. Hace clic en "Añadir al carrito"
3. Se agrega directamente al carrito

### Para Productos con Variaciones
1. Usuario ve el ProductoCard
2. Hace clic en "Añadir al carrito"
3. Se redirige a la página de detalle
4. Ve los selectores de variaciones como botones
5. Selecciona cada opción secuencialmente:
   - Primero selecciona Talla (ve todas)
   - Luego selecciona Color (solo ve colores disponibles para esa talla)
6. El stock se actualiza automáticamente
7. Selecciona cantidad
8. Presiona "Añadir al carrito"

## Datos en Base de Datos

### Estructura de Producto con Variaciones

```typescript
{
  id: "prod_123",
  nombre: "Camiseta Premium",
  hasVariations: true,
  variationAttributeIds: ["attr_talla", "attr_color"],
  stockVariants: [
    {
      attributes: {
        "attr_talla": "S",
        "attr_color": "Rojo"
      },
      cantidad: 10,
      precio: 29.99
    },
    {
      attributes: {
        "attr_talla": "S",
        "attr_color": "Azul"
      },
      cantidad: 5,
      precio: 29.99
    },
    // ... más variantes
  ],
  precio: 29.99, // precio base
  stock: 0 // para productos sin variaciones
}
```

### Atributos
Se guardan en la colección `atributos`:
```typescript
{
  id: "attr_talla",
  nombre: "Talla",
  valores: ["XS", "S", "M", "L", "XL", "2XL"]
}
```

## Carrito

Cada item en el carrito ahora puede incluir variaciones:

```typescript
{
  id: "prod_123",
  nombre: "Camiseta Premium",
  cantidad: 2,
  cartKey: "prod_123:attr_talla:S:attr_color:Rojo", // Identifica la variante
  selectedVariations: {
    "attr_talla": "S",
    "attr_color": "Rojo"
  },
  variationAttributeIds: ["attr_talla", "attr_color"],
  precioUnitario: 29.99,
  stock: 10
}
```

## Características del Sistema

✅ **Escalable**: Soporta cualquier número de variaciones
✅ **Dinámico**: Las opciones se filtran según selecciones previas
✅ **Solo Disponibles**: Solo muestra opciones con stock > 0
✅ **UX Mejorada**: Botones en lugar de selects
✅ **Flexible**: Soporta precios diferentes por variante
✅ **Preciso**: Solo permite selecciones disponibles

## Próximas Implementaciones

- [ ] Mostrar variaciones en el carrito (página de carrito)
- [ ] Mostrar variaciones en el checkout
- [ ] Mostrar variaciones en historial de órdenes
- [ ] Filtros de búsqueda por variaciones
- [ ] Comparador de variaciones

## Ejemplo Completo

Ver en:
- Página de detalle: `app/product-detail/page.tsx`
- ProductoCard: `app/components/ProductoCard.tsx`
- VariationsManager: `app/components/VariationsManager.tsx`
- VariationSelector: `app/components/VariationSelector.tsx`
