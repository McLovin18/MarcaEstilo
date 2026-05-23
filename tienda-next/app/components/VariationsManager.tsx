"use client";

import React, { useMemo, useCallback } from "react";
import VariationSelector from "./VariationSelector";

interface StockVariant {
  cantidad: number;
  precio?: number;
  attributes?: Record<string, string>;
  label?: string;
  variantKey?: string;
  talla?: string;
  color?: string;
}

interface VariationsManagerProps {
  stockVariants: StockVariant[];
  variationAttributeIds: string[];
  attributeNames: Record<string, string>; // Mapeo de ID -> nombre del atributo
  selectedVariations: Record<string, string>; // Mapeo de atributoId -> valor seleccionado
  onVariationChange: (attrId: string, value: string) => void;
  onStockChange?: (stock: number) => void;
}

export default function VariationsManager({
  stockVariants,
  variationAttributeIds,
  attributeNames,
  selectedVariations,
  onVariationChange,
  onStockChange,
}: VariationsManagerProps) {
  // Calcular opciones disponibles para cada atributo
  const availableOptions = useMemo(() => {
    const result: Record<string, Set<string>> = {};

    // Inicializar con todas las opciones para cada atributo
    variationAttributeIds.forEach((attrId) => {
      result[attrId] = new Set<string>();
    });

    // Llenar opciones basadas en variantes compatibles y con stock disponible
    stockVariants.forEach((variant) => {
      // Solo considerar variantes con stock disponible
      if (variant.cantidad <= 0) {
        return;
      }

      const attrs = variant.attributes || {};
      let isCompatible = true;

      // Verificar si esta variante es compatible con las selecciones actuales
      variationAttributeIds.forEach((attrId) => {
        if (selectedVariations[attrId] && attrs[attrId] !== selectedVariations[attrId]) {
          isCompatible = false;
        }
      });

      if (isCompatible) {
        // Agregar opciones de esta variante
        variationAttributeIds.forEach((attrId) => {
          if (attrs[attrId]) {
            result[attrId].add(attrs[attrId]);
          }
        });
      }
    });

    // Convertir a arrays y ordenar
    const formatted: Record<string, string[]> = {};
    Object.entries(result).forEach(([attrId, values]) => {
      formatted[attrId] = Array.from(values).sort();
    });

    return formatted;
  }, [stockVariants, variationAttributeIds, selectedVariations]);

  // Calcular stock disponible
  const currentStock = useMemo(() => {
    // Verificar si todas las variaciones requeridas están seleccionadas
    const allSelected = variationAttributeIds.every(
      (attrId) => selectedVariations[attrId]
    );

    if (!allSelected) {
      return 0;
    }

    // Encontrar la variante que coincida
    const matchingVariant = stockVariants.find((variant) => {
      const attrs = variant.attributes || {};
      return variationAttributeIds.every(
        (attrId) => attrs[attrId] === selectedVariations[attrId]
      );
    });

    return matchingVariant?.cantidad || 0;
  }, [stockVariants, variationAttributeIds, selectedVariations]);

  // Notificar cambio de stock
  React.useEffect(() => {
    onStockChange?.(currentStock);
  }, [currentStock, onStockChange]);

  // Seleccionar por defecto la primera opción de la primera variación cuando exista.
  React.useEffect(() => {
    const firstAttrId = variationAttributeIds[0];
    if (!firstAttrId) return;

    const firstOption = availableOptions[firstAttrId]?.[0];
    if (!firstOption) return;

    if (!selectedVariations[firstAttrId]) {
      onVariationChange(firstAttrId, firstOption);
    }
  }, [variationAttributeIds, availableOptions, selectedVariations, onVariationChange]);

  // Manejar cambio de variación - limpiar opciones dependientes
  const handleVariationChange = useCallback(
    (attrId: string, value: string) => {
      // Encontrar el índice del atributo actual
      const currentIndex = variationAttributeIds.indexOf(attrId);

      // Limpiar valores de atributos posteriores
      const newSelections = { ...selectedVariations };
      newSelections[attrId] = value;

      variationAttributeIds.slice(currentIndex + 1).forEach((laterAttrId) => {
        delete newSelections[laterAttrId];
      });

      // Aplicar cambios uno por uno
      onVariationChange(attrId, value);
      variationAttributeIds.slice(currentIndex + 1).forEach((laterAttrId) => {
        onVariationChange(laterAttrId, "");
      });
    },
    [variationAttributeIds, selectedVariations, onVariationChange]
  );

  return (
    <div className="space-y-4 border-t border-slate-100 dark:border-white/6 pt-4">
      {variationAttributeIds.map((attrId, index) => {
        const attrName = attributeNames[attrId] || attrId;
        const options = availableOptions[attrId] || [];
        const isEnabled = index === 0 || selectedVariations[variationAttributeIds[index - 1]];

        return (
          <VariationSelector
            key={attrId}
            label={attrName}
            options={options}
            selectedValue={selectedVariations[attrId] || ""}
            onSelect={(value) => handleVariationChange(attrId, value)}
            disabled={!isEnabled || options.length === 0}
          />
        );
      })}

      {/* Mostrar stock disponible */}
      {variationAttributeIds.every((attrId) => selectedVariations[attrId]) && (
        <div className="pt-2 border-t border-slate-100 dark:border-white/6">
          <p className="text-xs text-slate-600 dark:text-white/50">
            <span className="font-semibold">Stock disponible:</span>{" "}
            <span className={currentStock > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
              {currentStock} unidades
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
