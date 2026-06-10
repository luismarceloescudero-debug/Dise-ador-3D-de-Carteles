import React, { useState } from "react";
import { StructureConfig, MaterialItem, SupplierPreset } from "../types";
import { UploadedBudget } from "./BudgetManager";
import { Copy, Check, MessageSquare, Phone, MapPin, Sparkles, AlertCircle, ShoppingCart } from "lucide-react";

interface SmartPurchaseAnalyzerProps {
  config: StructureConfig;
  selectedBudget: UploadedBudget;
  budgets: UploadedBudget[];
  customSuppliers: SupplierPreset[];
  calculateMaterials: (config: StructureConfig, customSuppliers?: SupplierPreset[]) => MaterialItem[];
  onSaveContact: (budgetId: string, contact: string) => void;
}

export function getSupplierPresetKeyForMaterial(item: MaterialItem, config: StructureConfig): keyof SupplierPreset {
  if (item.category === 'marco') {
    return config.marcoProfile === '60x60x2' ? 'caño60_60_2' : 'caño50_50_2';
  }
  if (item.category === 'skeleton') {
    return config.skeletonProfile === '40x40x2.5' ? 'caño40_40_25' : 'caño40_40_2';
  }
  if (item.category === 'chapa') {
    return config.chapaSheetSize === '1.22x2.44' ? 'chapa18_122x244' : 'chapa18_1x2';
  }
  if (item.category === 'postes') {
    return config.columnProfile === 'tubing_3_1_2' ? 'tubing3_1_2' : 'tubing2_7_8';
  }
  
  const nameLower = item.name.toLowerCase();
  if (nameLower.includes('platina pesada') || nameLower.includes('pandeo') || nameLower.includes('560x560') || item.category === 'anclajes') {
    return 'platina560';
  }
  if (nameLower.includes('escuadra') || nameLower.includes('rigidiz') || nameLower.includes('refuerzo')) {
    return 'platinaEscuadra';
  }
  if (nameLower.includes('electrodo')) {
    return 'electrodo25';
  }
  if (nameLower.includes('esmalte') || nameLower.includes('pintura')) {
    return 'esmalte4l';
  }
  if (nameLower.includes('tornillo')) {
    return 'tornilloHex';
  }
  
  return 'caño50_50_2'; // fallback
}

export default function SmartPurchaseAnalyzer({
  config,
  selectedBudget,
  budgets,
  customSuppliers,
  calculateMaterials,
  onSaveContact
}: SmartPurchaseAnalyzerProps) {
  const [purchaseStrategy, setPurchaseStrategy] = useState<"combined" | "single">("combined");
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [tempContact, setTempContact] = useState(selectedBudget.data?.contact || "");
  const [copiedSupplierId, setCopiedSupplierId] = useState<string | null>(null);

  const budgetData = selectedBudget.data;
  if (!budgetData) return null;

  // Calculate live config requirements using the selected budget's prices
  const formattedPreset: SupplierPreset = {
    ...budgetData,
    id: selectedBudget.id,
    name: budgetData.name,
    city: budgetData.city
  };
  const neededItems = calculateMaterials(config, [formattedPreset]);

  // Helper to find the cheapest provider/price for a material key in Mendoza
  const getCheapestAlternative = (presetKey: keyof SupplierPreset) => {
    let cheapestPrice = Infinity;
    let cheapestSupplierName = "";

    // Check default active custom suppliers
    customSuppliers.forEach(s => {
      const val = Number(s[presetKey]);
      if (val && val > 0 && val < cheapestPrice) {
        cheapestPrice = val;
        cheapestSupplierName = s.name;
      }
    });

    // Check other uploaded budgets
    budgets.forEach(b => {
      if (b.status === "completed" && b.data && b.id !== selectedBudget.id) {
        const val = Number(b.data[presetKey]);
        if (val && val > 0 && val < cheapestPrice) {
          cheapestPrice = val;
          cheapestSupplierName = b.data.name;
        }
      }
    });

    if (cheapestPrice === Infinity) return null;
    return { price: cheapestPrice, supplierName: cheapestSupplierName };
  };

  // Compile detailed information for each required item
  const analyzedItems = neededItems.map(item => {
    const presetKey = getSupplierPresetKeyForMaterial(item, config);
    const selectedPrice = Number(budgetData[presetKey] || 0);
    const isQuoted = selectedPrice > 0;
    const bestAlt = getCheapestAlternative(presetKey);

    // If unquoted (price = 0), we must buy from the best alt
    const bestPrice = isQuoted ? selectedPrice : (bestAlt?.price || 0);
    const bestSupplier = isQuoted ? budgetData.name : (bestAlt?.supplierName || "Promedio Regional");

    // Check if buying combined could save us money (excluding fallback regional average)
    const canSave = isQuoted && bestAlt && bestAlt.price < selectedPrice && bestAlt.supplierName !== budgetData.name;

    return {
      ...item,
      presetKey,
      selectedPrice,
      isQuoted,
      bestPrice,
      bestSupplier,
      canSave,
      altOption: bestAlt,
      totalSelectedPrice: item.quantity * selectedPrice,
      totalBestPrice: item.quantity * bestPrice
    };
  });

  // Totals for Single Supplier strategy (with regional averages rerooting the unquoted)
  const singleSupplierSubtotal = neededItems.reduce((acc, m) => acc + m.totalPrice, 0);
  const singleSupplierTotalWithIVA = singleSupplierSubtotal * 1.21;

  // Totals for Combined optimized strategy (Selected supplier + cheapest options for unquoted/cheaper items)
  const combinedSupplierSubtotal = analyzedItems.reduce((acc, m) => {
    if (purchaseStrategy === "combined") {
      return acc + (m.quantity * (m.canSave ? (m.altOption?.price || m.selectedPrice) : m.bestPrice));
    } else {
      return acc + m.totalSelectedPrice;
    }
  }, 0);
  const combinedSupplierTotalWithIVA = combinedSupplierSubtotal * 1.21;

  const totalSavings = singleSupplierTotalWithIVA - combinedSupplierTotalWithIVA;

  // Group items for purchase order generation
  const groupedPurchases: Record<string, { items: typeof analyzedItems; subtotal: number }> = {};

  analyzedItems.forEach(item => {
    let targetSupplier = budgetData.name;
    let targetPrice = item.selectedPrice;

    if (purchaseStrategy === "combined") {
      // Sourced from best supplier if unquoted or if alternative is cheaper
      if (!item.isQuoted && item.altOption) {
        targetSupplier = item.altOption.supplierName;
        targetPrice = item.altOption.price;
      } else if (item.canSave && item.altOption) {
        targetSupplier = item.altOption.supplierName;
        targetPrice = item.altOption.price;
      }
    }

    if (!groupedPurchases[targetSupplier]) {
      groupedPurchases[targetSupplier] = { items: [], subtotal: 0 };
    }

    groupedPurchases[targetSupplier].items.push({
      ...item,
      bestPrice: targetPrice,
      totalBestPrice: item.quantity * targetPrice
    });
    groupedPurchases[targetSupplier].subtotal += item.quantity * targetPrice;
  });

  // Generate copyable Purchase Order Text
  const handleCopyOrderText = (supplierName: string, subtotal: number, items: typeof analyzedItems) => {
    const isPrimarySelected = supplierName === budgetData.name;
    const contactName = isPrimarySelected ? (selectedBudget.data?.contact || "Vendedor") : "Responsable de Ventas";

    const dateStr = new Date().toLocaleDateString('es-AR');
    let text = `Estimado/a ${contactName},\n\n`;
    text += `Nos comunicamos de Constracad S.A. en relación a su cotización de materiales. Nos interesa avanzar con la compra de los siguientes ítems para nuestra obra de cartelera en Mendoza:\n\n`;
    text += `📄 DETALLE DEL PEDIDO DE MATERIALES:\n`;
    text += `---------------------------------------------------------\n`;
    
    items.forEach(it => {
      text += `• ${it.name}: ${it.quantity} ${it.unit} x $${it.bestPrice.toLocaleString("es-AR", { maximumFractionDigits: 0 })}/u | Subtotal: $${it.totalBestPrice.toLocaleString("es-AR", { maximumFractionDigits: 0 })}\n`;
    });
    
    text += `---------------------------------------------------------\n`;
    text += `Subtotal Neto: $${subtotal.toLocaleString("es-AR", { maximumFractionDigits: 0 })}\n`;
    text += `IVA (21%): $${(subtotal * 0.21).toLocaleString("es-AR", { maximumFractionDigits: 0 })}\n`;
    text += `Total Estimado con IVA: $${(subtotal * 1.21).toLocaleString("es-AR", { maximumFractionDigits: 0 })}\n\n`;
    text += `Por favor, le solicitamos que nos avise lo siguiente:\n`;
    text += `1. Si las cantidades y valores cotizados continúan vigentes al día de hoy.\n`;
    text += `2. Plazo estimado de entrega para retiro inmediato de local o despacho en Mendoza.\n`;
    text += `3. Si es posible aplicar alguna mejora en las opciones de pago, financiación o bonificación por bulto.\n\n`;
    text += `Quedamos a su atenta espera para coordinar la facturación.\n\n`;
    text += `Sello de control de Constracad S.A. Mendoza | Generado: ${dateStr}`;

    navigator.clipboard.writeText(text);
    setCopiedSupplierId(supplierName);
    setTimeout(() => setCopiedSupplierId(null), 3050);
  };

  const handleUpdateContact = () => {
    onSaveContact(selectedBudget.id, tempContact);
    setIsEditingContact(false);
  };

  return (
    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-4 text-slate-100">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="text-left space-y-1">
          <span className="text-[10px] uppercase font-black text-amber-400 tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Optimización y Logística de Compra Combinada
          </span>
          <h5 className="text-sm font-bold text-slate-200">
            Alineación de Ajustes en Vivo vs. Presupuesto Adjunto
          </h5>
          <p className="text-[11px] text-slate-400">
            Comparamos las medidas vigentes de la pestaña <strong className="text-amber-500">"Ajustes"</strong> contra los precios unitarios cotizados por <strong className="text-white">{budgetData.name}</strong> para decidir compras inteligentes.
          </p>
        </div>

        {/* STRATEGY SWITCHER */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850 text-xs shrink-0 self-start md:self-auto">
          <button
            onClick={() => setPurchaseStrategy("combined")}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
              purchaseStrategy === "combined"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Compra Combinada (Ahorro)
          </button>
          <button
            onClick={() => setPurchaseStrategy("single")}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
              purchaseStrategy === "single"
                ? "bg-slate-800 text-slate-200"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Suministro Único
          </button>
        </div>
      </div>

      {/* STRATEGY INSIGHT BANNERS */}
      {purchaseStrategy === "combined" && totalSavings > 0 ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3 text-left animate-fade-in">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h6 className="text-[11.5px] font-bold text-emerald-300">¡Estrategia de Compra Óptima Mendoza Detectada!</h6>
            <p className="text-[10.5px] text-emerald-400/90 leading-relaxed">
              Combinando tu cotización con materiales de proveedores alternativos más económicos ahorrás un total de <strong className="text-white font-extrabold">${totalSavings.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</strong> con IVA en la estructura actual.
            </p>
          </div>
        </div>
      ) : purchaseStrategy === "combined" ? (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3 text-left">
          <div className="p-2 rounded-lg bg-slate-800 text-slate-400 shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h6 className="text-[11px] font-bold text-slate-300">Suministro Principal de {budgetData.name} es Óptimo</h6>
            <p className="text-[10.5px] text-slate-400 leading-normal">
              Para los materiales seleccionados, este proveedor ofrece excelentes valores de mercado. Se derivan a continuación los faltantes u otros precios sugeridos regionales.
            </p>
          </div>
        </div>
      ) : null}

      {/* MATERIAL LIST COMPARATIVE DATA */}
      <div className="overflow-x-auto rounded-lg border border-slate-850 bg-slate-950/40">
        <table className="w-full text-left text-xs text-slate-300 border-collapse">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-850 text-slate-400 text-[10px] font-black uppercase tracking-wider">
              <th className="py-2.5 px-3">Material Requerido</th>
              <th className="py-2.5 px-2 text-center">Cant. Obra</th>
              <th className="py-2.5 px-2 text-right">Cotizado ({budgetData.name})</th>
              {purchaseStrategy === "combined" && <th className="py-2.5 px-2 text-right text-amber-400 border-l border-slate-900/50">Alternativa Sugerida</th>}
              <th className="py-2.5 px-3 text-right">Proveedor de Destino</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {analyzedItems.map(item => {
              const isMissingInSelected = !item.isQuoted;
              const hasAlternativeCheaper = item.canSave;
              const unitPriceToDisplay = isMissingInSelected ? "Sin cotizar ⚠️" : `$${item.selectedPrice.toLocaleString("es-AR")}`;

              // Determine display values for selected strategy
              let finalPrice = item.selectedPrice;
              let finalSupplierName = budgetData.name;
              let highlightRowStyle = "";

              if (purchaseStrategy === "combined") {
                if (isMissingInSelected || hasAlternativeCheaper) {
                  finalPrice = item.altOption?.price || 0;
                  finalSupplierName = item.altOption?.supplierName || "Promedio Regional";
                  highlightRowStyle = hasAlternativeCheaper ? "bg-amber-500/[0.015]" : "bg-blue-500/[0.01]";
                }
              }

              return (
                <tr key={item.id} className={`hover:bg-slate-900/30 transition-colors ${highlightRowStyle}`}>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-200 text-xs">{item.name}</div>
                    <div className="text-[9.5px] text-slate-500 truncate max-w-sm">{item.description}</div>
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold font-mono">
                    {item.quantity} <span className="text-[10px] text-slate-500 font-normal">{item.unit}</span>
                  </td>
                  <td className={`py-2.5 px-2 text-right font-mono ${isMissingInSelected ? "text-rose-400 font-bold" : "text-slate-300"}`}>
                    {unitPriceToDisplay}
                  </td>
                  {purchaseStrategy === "combined" && (
                    <td className="py-2.5 px-2 text-right font-mono text-emerald-400 border-l border-slate-900/50">
                      {item.altOption ? (
                        <div className="leading-none space-y-0.5">
                          <div className="font-extrabold font-mono">${item.altOption.price.toLocaleString("es-AR")}</div>
                          <div className="text-[8.5px] text-slate-500 truncate max-w-[110px] inline-block">{item.altOption.supplierName}</div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                  )}
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        finalSupplierName === budgetData.name 
                          ? "bg-slate-800 border border-slate-700 text-slate-200" 
                          : "bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black"
                      }`}>
                        {finalSupplierName}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* COMBINED PURCHASE SPLIT SECTIONS (THE GROUPS TO PURCHASE) */}
      <div className="space-y-4 pt-2">
        <h6 className="text-[11px] font-bold uppercase text-slate-300 tracking-wider text-left flex items-center gap-1.5">
          <ShoppingCart className="h-4 w-4 text-cyan-400" />
          Grupos de Adquisición Sugeridos ({Object.keys(groupedPurchases).length})
        </h6>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(groupedPurchases).map(([supplier, details]) => {
            const isOriginal = supplier === budgetData.name;
            const itemQty = details.items.reduce((acc, i) => acc + i.quantity, 0);
            const totalWithIVA = details.subtotal * 1.21;
            const isPrimaryCopied = copiedSupplierId === supplier;

            return (
              <div 
                key={supplier} 
                className={`p-3.5 rounded-xl border flex flex-col justify-between text-left space-y-3.5 ${
                  isOriginal 
                    ? "bg-slate-950 border-cyan-500/20 shadow-md"
                    : "bg-slate-950/60 border-slate-850 hover:border-slate-800"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2 flex-wrap gap-2">
                    <div className="text-left">
                      <span className={`text-[8.5px] uppercase font-black px-1.5 py-0.5 rounded mr-1.5 ${isOriginal ? "bg-cyan-500/10 text-cyan-400" : "bg-amber-500/10 text-amber-400"}`}>
                        {isOriginal ? "Proveedor Elegido" : "Desvío Faltante / Ahorro"}
                      </span>
                      <h6 className="font-extrabold text-slate-100 text-xs inline-block mt-1 sm:mt-0">{supplier}</h6>
                    </div>
                    <div className="font-mono text-right shrink-0">
                      <div className="text-cyan-400 font-bold text-xs">${totalWithIVA.toLocaleString("es-AR", { maximumFractionDigits: 0 })} c/IVA</div>
                      <div className="text-[10px] text-slate-500">({details.items.length} ítems)</div>
                    </div>
                  </div>

                  {/* Bullet material review */}
                  <ul className="mt-2 space-y-1.5 text-[10.5px] text-slate-400 pl-1 list-none">
                    {details.items.map(it => (
                      <li key={it.id} className="flex justify-between items-center gap-2">
                        <span className="truncate max-w-[200px]" title={it.name}>🔹 {it.name}</span>
                        <span className="font-mono text-slate-300 font-medium shrink-0">
                          {it.quantity}{it.unit} x ${it.bestPrice.toLocaleString("es-AR")}/u
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Sourcing Contact & Generate Purchase Order Button */}
                <div className="pt-2 border-t border-slate-900 space-y-2">
                  {isOriginal && (
                    <div className="flex flex-col gap-1 px-1 py-1.5 rounded bg-slate-900/60 border border-slate-850/60 text-[11px] text-slate-400 mb-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300 flex items-center gap-1 shrink-0">
                          <Phone className="h-3 w-3 text-amber-400" /> Contacto Vendedor:
                        </span>
                        {!isEditingContact && (
                          <button
                            onClick={() => {
                              setTempContact(selectedBudget.data?.contact || "");
                              setIsEditingContact(true);
                            }}
                            className="text-amber-400 hover:text-amber-300 underline font-semibold text-[10px] leading-none shrink-0"
                          >
                            ✏️ Editar contacto
                          </button>
                        )}
                      </div>
                      {isEditingContact ? (
                        <div className="flex gap-1.5 items-center mt-1">
                          <input
                            type="text"
                            value={tempContact}
                            onChange={e => setTempContact(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[10.5px] text-slate-200 outline-none flex-1 font-mono"
                            placeholder="Nombre / Teléfono"
                          />
                          <button
                            onClick={handleUpdateContact}
                            className="bg-emerald-600 hover:bg-emerald-500 font-bold px-2 py-0.5 text-[9.5px] rounded text-white"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => setIsEditingContact(false)}
                            className="bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 text-[9.5px] rounded text-slate-300"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-300 truncate pl-4">
                          {selectedBudget.data?.contact || "(Sin contacto - Hace click para editar)"}
                        </span>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => handleCopyOrderText(supplier, details.subtotal, details.items)}
                    className={`w-full py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                      isPrimaryCopied
                        ? "bg-emerald-600 text-white shadow-sm scale-98"
                        : "bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-200 hover:text-white hover:border-slate-700 border border-slate-800/40"
                    }`}
                  >
                    {isPrimaryCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> ¡Pedido Copiado para Whatsapp! ✓
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Generar Mensaje de Pedido
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
