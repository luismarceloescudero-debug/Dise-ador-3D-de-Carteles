import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Edit3, 
  Save, 
  X, 
  Info, 
  ExternalLink, 
  ClipboardCheck, 
  Coins, 
  Settings, 
  FileText,
  Layout
} from "lucide-react";
import { SupplierPreset, StructureConfig, MaterialItem } from "../types";
import { calculateMaterials } from "../data";

interface BudgetManagerProps {
  customSuppliers: SupplierPreset[];
  setCustomSuppliers: any;
  onSupplierActivated?: (supplierName: string) => void;
  config?: StructureConfig;
}

export function BudgetManager({ 
  customSuppliers, 
  setCustomSuppliers,
  onSupplierActivated,
  config 
}: BudgetManagerProps) {
  // If no config is passed, we use standard defaults so it never crashes
  const structureConfig = config || {
    width: 800,
    height: 300,
    clearanceHeight: 400,
    gridPattern: "standard",
    gridRows: 6,
    gridCols: 6,
    marcoProfile: "50x50x2",
    skeletonProfile: "40x40x2",
    chapaProfile: "chapa_18",
    chapaSheetSize: "1.0x2.0",
    columnProfile: "tubing_2_7_8",
    columnCount: 6,
    columnBuriedDepth: 100,
    foundationWidth: 80,
    foundationDepth: 120,
    foundationConcreteGrade: "H21",
    anchorBoltDiameter: "3/4",
    anchorPlateThickness: 12
  };

  // Re-calculate quantities live as user changes parameters
  const activeMaterialsList = calculateMaterials(structureConfig);

  // local persistence of user manually input values
  const [manualQuotes, setManualQuotes] = useState<Record<string, { unitPrice: number; supplier: string }>>(() => {
    try {
      const stored = localStorage.getItem("constracad_manual_quotes");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // State management for manual editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");
  const [editSupplier, setEditSupplier] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);

  // Save manual inputs to localStorage upon changes
  useEffect(() => {
    try {
      localStorage.setItem("constracad_manual_quotes", JSON.stringify(manualQuotes));
    } catch (e) {
      console.error("No se pudo guardar la cotización manual en localStorage:", e);
    }
  }, [manualQuotes]);

  const handleStartEdit = (item: MaterialItem) => {
    setEditingId(item.id);
    const existing = manualQuotes[item.id];
    setEditPrice(existing?.unitPrice ? String(existing.unitPrice) : "");
    setEditSupplier(existing?.supplier || "");
  };

  const handleSaveEdit = (itemId: string) => {
    const numericPrice = parseFloat(editPrice);
    setManualQuotes(prev => {
      const updated = { ...prev };
      if (!editPrice.trim() && !editSupplier.trim()) {
        delete updated[itemId];
      } else {
        updated[itemId] = {
          unitPrice: isNaN(numericPrice) || numericPrice < 0 ? 0 : numericPrice,
          supplier: editSupplier.trim()
        };
      }
      return updated;
    });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleResetAllQuotes = () => {
    setManualQuotes({});
    localStorage.removeItem("constracad_manual_quotes");
  };

  const [htmlTab, setHtmlTab] = useState<'visual' | 'code'>('visual');
  const [isHtmlCopied, setIsHtmlCopied] = useState(false);

  // Dynamic parameters for the Kit de Anclaje
  const columnCount = structureConfig.columnCount;
  const plateThick = structureConfig.anchorPlateThickness || 12;
  const colProfile = structureConfig.columnProfile;
  const isTubing3_5 = colProfile === "tubing_3_1_2";
  const plateSize = isTubing3_5 ? "500 x 500" : "400 x 400";
  const profileLabel = isTubing3_5 ? "Tubing 3 ½\" (ø 88.9 mm)" : "Tubing 2 ⅞\" (ø 73 mm)";

  // Complete HTML template to copy (didactic and styled for emails or workspace logs)
  const generatedHtmlCode = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ficha Técnica Homologada de Prefabricación de Kit de Anclaje de Viento</title>
</head>
<body style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 20px; line-height: 1.5;">
  <div style="max-width: 650px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);">
    
    <!-- Encabezado corporativo/ingeniería -->
    <div style="background: linear-gradient(135deg, #0284c7, #1e1b4b); padding: 24px; border-bottom: 3px solid #0ea5e9; text-align: left;">
      <h2 style="margin: 0; color: #ffffff; font-size: 20px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800;">
        📐 Ficha Homologada de Pre-Fabricación
      </h2>
      <p style="margin: 6px 0 0 0; color: #38bdf8; font-size: 13px; font-weight: 600; letter-spacing: 0.05em;">
        Kit de Anclaje de Viento de Alta Resistencia — Autotensado
      </p>
    </div>

    <!-- Contenido y Especificación de Materiales de Obra -->
    <div style="padding: 24px;">
      <p style="margin: 0 0 16px 0; font-size: 12.5px; color: #94a3b8;">
        Ficha técnica interactiva optimizada para el Ingeniero de Obra en Gran Mendoza, Argentina. Describe los requerimientos mecánicos necesarios para resistir vientos críticos de montaña y ráfagas del viento Zonda.
      </p>

      <!-- Resumen Mecánico -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; text-align: left;">
        <thead>
          <tr style="border-bottom: 2px solid #374151;">
            <th style="padding: 8px; color: #38bdf8; font-weight: bold; width: 50%;">PARÁMETRO REQUERIDO</th>
            <th style="padding: 8px; color: #38bdf8; font-weight: bold;">ESPECIFICACIÓN DE PLANOS</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #1f2937;">
            <td style="padding: 10px 8px; color: #cbd5e1; font-weight: 500;">Espesor de la Placa Base:</td>
            <td style="padding: 10px 8px; color: #e2e8f0; font-weight: bold;">${plateThick} mm de Acero Estructural F-24</td>
          </tr>
          <tr style="border-bottom: 1px solid #1f2937;">
            <td style="padding: 10px 8px; color: #cbd5e1; font-weight: 500;">Medidas de la Placa:</td>
            <td style="padding: 10px 8px; color: #e2e8f0; font-weight: bold;">${plateSize} mm x ${plateSize} mm</td>
          </tr>
          <tr style="border-bottom: 1px solid #1f2937;">
            <td style="padding: 10px 8px; color: #cbd5e1; font-weight: 500;">Escuadras Triangulares (Rigidizadores):</td>
            <td style="padding: 10px 8px; color: #e2e8f0; font-weight: bold;">4 Unidades de 80 mm (base) x 160 mm (altura)</td>
          </tr>
          <tr style="border-bottom: 1px solid #1f2937;">
            <td style="padding: 10px 8px; color: #cbd5e1; font-weight: 500;">Espesor de las Escuadras:</td>
            <td style="padding: 10px 8px; color: #e2e8f0; font-weight: bold;">9,5 mm (3/8") para evitar fatiga por flexión</td>
          </tr>
          <tr style="border-bottom: 1px solid #1f2937;">
            <td style="padding: 10px 8px; color: #cbd5e1; font-weight: 500;">Poste Petrolero Soportado:</td>
            <td style="padding: 10px 8px; color: #fbbf24; font-weight: bold;">${profileLabel}</td>
          </tr>
          <tr style="border-bottom: 1px solid #1f2937;">
            <td style="padding: 10px 8px; color: #cbd5e1; font-weight: 500;">Cantidad de Juegos de Obra:</td>
            <td style="padding: 10px 8px; color: #34d399; font-weight: bold;">${columnCount} Juegos de Anclaje de Viento en Altura</td>
          </tr>
          <tr style="border-bottom: 2px solid #374151;">
            <td style="padding: 10px 8px; color: #f87171; font-weight: bold; font-style: italic;">Pernos de Anclaje de 7/8":</td>
            <td style="padding: 10px 8px; color: #f87171; font-weight: bold; font-style: italic;">EXCLUIDOS de este Kit de Fabricación</td>
          </tr>
        </tbody>
      </table>

      <!-- Dibujo Técnico en SVG - Didáctico -->
      <div style="background-color: #030712; padding: 20px; border-radius: 12px; border: 1px solid #1f2937; text-align: center; margin-bottom: 24px;">
        <span style="display: block; font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 800; margin-bottom: 12px; letter-spacing: 0.1em;">
          📐 CROQUIS TÉCNICO INTERACTIVO — VISTA SUPERIOR DE TALLER
        </span>
        <svg viewBox="0 0 400 300" style="max-width: 100%; height: auto; display: block; margin: 0 auto; outline: none;">
          <!-- Plano Cartesiano de Fondo -->
          <rect width="400" height="300" fill="#030712" />
          <path d="M 0,150 L 400,150" stroke="#1f2937" stroke-width="1" stroke-dasharray="2,2" />
          <path d="M 200,0 L 200,300" stroke="#1f2937" stroke-width="1" stroke-dasharray="2,2" />

          <!-- Placa de Acero Estructural -->
          <rect x="80" y="30" width="240" height="240" rx="3" fill="none" stroke="#0ea5e9" stroke-width="3" />
          
          <!-- Círculo del Tubo Central (Poste) -->
          <circle cx="200" cy="150" r="40" fill="#1f2937" stroke="#cbd5e1" stroke-width="2.5" />
          
          <!-- 4 Cartelas / Escuadras Triangulares de Resistencia (80mm x 160mm) -->
          <!-- Escuadra Superior -->
          <path d="M 194,110 L 200,30 L 206,110 Z" fill="#06b6d4" fill-opacity="0.3" stroke="#06b6d4" stroke-width="1.5" />
          <!-- Escuadra Inferior -->
          <path d="M 194,190 L 200,270 L 206,190 Z" fill="#06b6d4" fill-opacity="0.3" stroke="#06b6d4" stroke-width="1.5" />
          <!-- Escuadra Derecha -->
          <path d="M 240,144 L 320,150 L 240,156 Z" fill="#06b6d4" fill-opacity="0.3" stroke="#06b6d4" stroke-width="1.5" />
          <!-- Escuadra Izquierda -->
          <path d="M 160,144 L 80,150 L 160,156 Z" fill="#06b6d4" fill-opacity="0.3" stroke="#06b6d4" stroke-width="1.5" />

          <!-- Acotación de Altura (160 mm) de las Escuadras -->
          <line x1="215" y1="30" x2="235" y2="30" stroke="#e2e8f0" stroke-width="1" />
          <line x1="215" y1="110" x2="235" y2="110" stroke="#e2e8f0" stroke-width="1" />
          <line x1="230" y1="30" x2="230" y2="110" stroke="#e2e8f0" stroke-width="1" />
          <text x="240" y="75" fill="#e2e8f0" font-size="10" font-weight="bold">Alt: 160mm</text>

          <!-- Acotación de Base (80 mm) de las Escuadras -->
          <line x1="240" y1="165" x2="240" y2="185" stroke="#e2e8f0" stroke-width="1" />
          <line x1="320" y1="165" x2="320" y2="185" stroke="#e2e8f0" stroke-width="1" />
          <line x1="240" y1="180" x2="320" y2="180" stroke="#e2e8f0" stroke-width="1" />
          <text x="280" y="195" fill="#e2e8f0" font-size="10" font-weight="bold" text-anchor="middle">Base: 80mm</text>

          <!-- Etiquetas del Croquis -->
          <text x="88" y="50" fill="#0ea5e9" font-size="9" font-weight="bold">PLACA BASE: Espesor ${plateThick} mm</text>
          <text x="88" y="260" fill="#94a3b8" font-size="9">Acotación Exterior: ${plateSize} x ${plateSize} mm</text>
          <text x="200" y="153" fill="#ffffff" font-size="8" text-anchor="middle" font-weight="bold">POSTE TUBO</text>
        </svg>
      </div>

      <!-- Logística de Soldadura y Ensamblaje -->
      <div style="background-color: #1e293b; border-left: 4px solid #10b981; padding: 18px; border-radius: 8px;">
        <h4 style="margin: 0 0 8px 0; color: #10b981; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">
          📦 DETALLE DE MATERIALES SIDERÚRGICOS (Para Fabricación)
        </h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #cbd5e1;">
          <li style="margin-bottom: 6px;"><strong>${columnCount} Placas Base</strong> rectangulares cortadas a guillotina de <strong>${plateSize} mm x ${plateSize} mm</strong> de lado en chapa espesor <strong>${plateThick} mm</strong>.</li>
          <li style="margin-bottom: 6px;"><strong>${columnCount * 4} Unidades de Escuadras rigidizadoras</strong> de <strong>80 mm x 160 mm</strong> de catetos, de espesor 9,5 mm (3/8").</li>
          <li style="margin-bottom: 6px;">Unión continua de filete perimetral mediante proceso de electrodo revestido AWS E6011/E7018 para soportar cargas de fatiga estructural.</li>
        </ul>
        <p style="margin: 10px 0 0 0; font-size: 11px; color: #94a3b8; font-style: italic; border-top: 1px dashed #334155; padding-top: 8px;">
          ⚠️ *Nota para Oficina Técnica:* Los pernos de sujeción 7/8" que se hormigonan en la zapata han sido explícitamente excluidos del listado de los kits para evitar errores de doble imputación de existencias en el cómputo final de materiales de obra.
        </p>
      </div>

    </div>

    <!-- Pie corporativo -->
    <div style="background-color: #111827; padding: 16px; border-top: 1px solid #1f2937; text-align: center; font-size: 10.5px; color: #4b5563;">
      Generado con el Sistema de Prefabricación de Estructuras Constracad 3D — Mendoza
    </div>
  </div>
</body>
</html>`;

  const handleCopyHtmlCode = () => {
    navigator.clipboard.writeText(generatedHtmlCode);
    setIsHtmlCopied(true);
    setTimeout(() => setIsHtmlCopied(false), 3000);
  };


  // Compute total cost based strict on user's manually assigned prices
  let manualSubtotal = 0;
  let filledItemsCount = 0;

  activeMaterialsList.forEach(item => {
    const quote = manualQuotes[item.id];
    if (quote && quote.unitPrice > 0) {
      manualSubtotal += item.quantity * quote.unitPrice;
      filledItemsCount++;
    }
  });

  const manualIVA = manualSubtotal * 0.21;
  const manualTotalWithIVA = manualSubtotal + manualIVA;

  return (
    <div id="budget-manager-root" className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 md:p-6 backdrop-blur-xl space-y-6">
      
      {/* HEADER SECTION WITH ACTIVE SPEC SUMMARY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="text-left space-y-1">
          <span className="text-[10px] uppercase font-black text-cyan-400 tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            Plantilla y Pedido de Cotización de Materiales
          </span>
          <h2 className="text-lg font-bold text-slate-100">
            Cómputo Métrico Dinámico (Sin Precios por Defecto)
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Esta plantilla calcula y organiza las cantidades exactas de materiales requeridas en base a los parámetros físicos elegidos. Puede copiar la plantilla sin costos para solicitar presupuestos a proveedores y, a continuación, registrar los precios manuales que le coticen para auditar su presupuesto.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            onClick={handleCopyHtmlCode}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              isHtmlCopied 
                ? "bg-emerald-600 text-white font-black animate-scale-up" 
                : "bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-500"
            }`}
          >
            {isHtmlCopied ? (
              <>
                <ClipboardCheck className="h-4 w-4" />
                ¡Código HTML Copiado! ✓
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar Ficha Técnica en Código HTML
              </>
            )}
          </button>

          {filledItemsCount > 0 && (
            <button
              onClick={handleResetAllQuotes}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-950/10 text-rose-450 border border-rose-900/30 hover:bg-rose-900/10 transition cursor-pointer"
            >
              Restablecer Precios Manuales
            </button>
          )}
        </div>
      </div>

      {/* SECCIÓN INTEGRADORA PRESTOSA: FICHA DE TALLER HOMOLOGADA (KITS DE VIENTO Y ANCLAJE) */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-cyan-400" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 block">Especificaciones y Oficina Técnica</span>
              <h3 className="text-sm font-extrabold text-slate-100">Ficha Técnica Homologada de Prefabricación de Kit de Anclaje de Viento</h3>
            </div>
          </div>
          
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-center">
            <button
              onClick={() => setHtmlTab('visual')}
              className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition ${
                htmlTab === 'visual' ? 'bg-cyan-600 text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Vista Didáctica
            </button>
            <button
              onClick={() => setHtmlTab('code')}
              className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition ${
                htmlTab === 'code' ? 'bg-cyan-600 text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Código HTML
            </button>
          </div>
        </div>

        {htmlTab === 'visual' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left Column: Didactic Technical Drawing */}
            <div className="lg:col-span-6 bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-4">
              <div className="text-left space-y-1">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest leading-none">Diagrama Superior del Kit de Acero</span>
                <p className="text-xs text-slate-400">Croquis didáctico de soldadura y rigidización por columna en obra.</p>
              </div>

              {/* Dynamic SVG Blueprint */}
              <div className="bg-slate-900 rounded-lg p-2 border border-slate-850 flex items-center justify-center">
                <svg viewBox="0 0 400 300" className="w-full max-w-[360px] h-auto outline-none transition-all">
                  <defs>
                    <pattern id="cardGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.03" />
                    </pattern>
                  </defs>
                  <rect width="400" height="300" fill="#030712" rx="6" />
                  <rect width="400" height="300" fill="url(#cardGrid)" rx="6" />
                  
                  <path d="M 0,150 L 400,150" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
                  <path d="M 200,0 L 200,300" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />

                  {/* Outer Steel Base Plate */}
                  <rect x="90" y="40" width="220" height="220" rx="3" fill="none" stroke="#22d3ee" strokeWidth="2.5" />
                  
                  {/* Central post tube */}
                  <circle cx="200" cy="150" r="35" fill="#1e293b" stroke="#ffffff" strokeWidth="2" />
                  
                  {/* 4 triangular gussets/escuadras (80x160mm represented visually proportionate) */}
                  <path d="M 194,115 L 200,40 L 206,115 Z" fill="#22d3ee" fillOpacity="0.35" stroke="#22d3ee" strokeWidth="1.5" />
                  <path d="M 194,185 L 200,260 L 206,185 Z" fill="#22d3ee" fillOpacity="0.35" stroke="#22d3ee" strokeWidth="1.5" />
                  <path d="M 235,144 L 310,150 L 235,156 Z" fill="#22d3ee" fillOpacity="0.35" stroke="#22d3ee" strokeWidth="1.5" />
                  <path d="M 165,144 L 90,150 L 165,156 Z" fill="#22d3ee" fillOpacity="0.35" stroke="#22d3ee" strokeWidth="1.5" />

                  {/* Dimension Annotations */}
                  <line x1="220" y1="40" x2="245" y2="40" stroke="#fbbf24" strokeWidth="1" />
                  <line x1="220" y1="115" x2="245" y2="115" stroke="#fbbf24" strokeWidth="1" />
                  <line x1="240" y1="40" x2="240" y2="115" stroke="#fbbf24" strokeWidth="1" />
                  <text x="250" y="82" fill="#fbbf24" fontSize="10" fontWeight="bold">Alt: 160 mm</text>

                  <line x1="235" y1="165" x2="235" y2="190" stroke="#fbbf24" strokeWidth="1" />
                  <line x1="310" y1="165" x2="310" y2="190" stroke="#fbbf24" strokeWidth="1" />
                  <line x1="235" y1="180" x2="310" y2="180" stroke="#fbbf24" strokeWidth="1" />
                  <text x="272" y="196" fill="#fbbf24" fontSize="10" fontWeight="bold" textAnchor="middle">Base: 80 mm</text>

                  {/* Overlay values */}
                  <text x="96" y="58" fill="#22d3ee" fontSize="10" fontWeight="extrabold">PLACA BASE: Ep {plateThick}mm</text>
                  <text x="96" y="248" fill="#475569" fontSize="9">Dim. Externa: {plateSize} mm</text>
                  <text x="200" y="153" fill="#ffffff" fontSize="8" textAnchor="middle" fontWeight="bold">{isTubing3_5 ? "TUBING 3 ½\"" : "TUBING 2 ⅞\""}</text>
                </svg>
              </div>
            </div>

            {/* Right Column: Didactic Material Checklist with Warnings */}
            <div className="lg:col-span-6 bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-3.5 text-left">
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">✓ MATERIALES A COTIZAR DEL KIT DE VIENTO (Placa + Escuadras)</span>
                <p className="text-xs text-slate-400">Total calculado para suministrar a las {columnCount} columnas:</p>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-850 space-y-2">
                  <div className="flex justify-between text-xs border-b border-slate-800 pb-1">
                    <span className="font-extrabold text-slate-200">Placas Base de Hierro ({plateSize} mm):</span>
                    <strong className="text-cyan-400 font-mono font-black">{columnCount} unidades</strong>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Chapas cuadradas espesor nominal de <strong>{plateThick} mm</strong> (espesor reforzado para absorber momentos flectores por zonda).
                  </p>
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-850 space-y-2">
                  <div className="flex justify-between text-xs border-b border-slate-800 pb-1">
                    <span className="font-extrabold text-slate-200">Escuadras de Arriostramiento (80x160mm):</span>
                    <strong className="text-cyan-400 font-mono font-black">{columnCount * 4} unidades</strong>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Triángulos rigidizadores mecanizados con chapa de hierro espesor 9,5 mm (3/8" resistente). Evitan deformación permanente de la base ante ráfagas dinámicas.
                  </p>
                </div>
              </div>

              {/* Bolt exclusion alert */}
              <div className="bg-rose-950/20 border-l-2 border-rose-500/80 p-3 rounded-lg text-left">
                <div className="text-xs font-bold text-rose-300 uppercase flex items-center gap-1.5 mb-1">
                  <Info className="h-3.5 w-3.5 text-rose-400" />
                  <span>Exclusión de Pernos de Anclaje ø 7/8"</span>
                </div>
                <p className="text-[10.5px] text-slate-400 leading-relaxed">
                  Para fines de cotización transparente, los pernos de anclaje se excluyen de la compra del kit individual de chapa para evitar la compra duplicada, ya que la ferretería y pernos pesados se detallan independientemente en el cómputo métrico general de bases de zapata.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Código fuente HTML completo y listo para sistemas y correos:</span>
              <button
                onClick={handleCopyHtmlCode}
                className="bg-slate-950 hover:bg-slate-850 hover:text-white px-2.5 py-1 rounded border border-slate-800 flex items-center gap-1 text-[11px] font-bold cursor-pointer transition text-cyan-400"
              >
                {isHtmlCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{isHtmlCopied ? '¡Código Copiado!' : 'Copiar Código'}</span>
              </button>
            </div>
            
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-left">
              <pre className="text-[11px] font-mono leading-relaxed text-slate-300 max-h-[300px] overflow-y-auto overflow-x-auto pr-1">
                {generatedHtmlCode}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* DETAILED MATERIALS LIST TABLE */}
      <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-950/40 shadow-inner">
        <table className="w-full text-left text-xs text-slate-300 border-collapse">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-850 text-slate-400 text-[10px] font-black uppercase tracking-wider">
              <th className="py-3 px-4">Material de Ingeniería Requerido</th>
              <th className="py-3 px-3 text-center">Cant. Obra</th>
              <th className="py-3 px-4 text-center">Precio Unitario ($)</th>
              <th className="py-3 px-4 text-center">Proveedor Elegido</th>
              <th className="py-3 px-3 text-right">Total Acumulado</th>
              <th className="py-3 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {activeMaterialsList.map(item => {
              const quote = manualQuotes[item.id];
              const isEditing = editingId === item.id;
              
              const hasQuoteValue = quote && quote.unitPrice > 0;
              const hasSupplierValue = quote && quote.supplier;
              
              const rowTotal = hasQuoteValue ? item.quantity * quote.unitPrice : 0;

              return (
                <tr key={item.id} className={`hover:bg-slate-900/30 transition-colors ${isEditing ? "bg-cyan-950/10" : ""}`}>
                  {/* description block */}
                  <td 
                    onClick={() => !isEditing && handleStartEdit(item)}
                    className={`py-3.5 px-4 max-w-sm ${!isEditing ? "cursor-pointer hover:bg-slate-900/40 rounded transition" : ""}`}
                    title={!isEditing ? "Clic en cualquier parte de la fila para editarlos" : undefined}
                  >
                    <div className="font-extrabold text-slate-200 text-xs sm:text-xs flex items-center gap-1.5">
                      {item.name}
                      {!isEditing && (
                        <Edit3 className="h-3 w-3 text-slate-600 opacity-30 group-hover:opacity-100 transition" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-normal mt-0.5 whitespace-pre-wrap">{item.description}</div>
                  </td>

                  {/* Quantity */}
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-100 text-xs shrink-0 select-none">
                    {item.quantity} <span className="text-[10px] text-slate-500 font-medium font-sans">{item.unit}</span>
                  </td>

                  {/* Unit price (editable) */}
                  <td className="py-3.5 px-4 text-center">
                    {isEditing ? (
                      <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg max-w-[110px] mx-auto px-2 py-1">
                        <span className="text-[10px] text-slate-400 font-mono pr-1 font-bold">$</span>
                        <input
                          type="number"
                          value={editPrice}
                          onChange={e => setEditPrice(e.target.value)}
                          className="bg-transparent text-slate-100 font-mono text-center outline-none w-full text-xs"
                          placeholder="0.00"
                          min="0"
                        />
                      </div>
                    ) : (
                      <div 
                        onClick={() => handleStartEdit(item)}
                        className="cursor-pointer group flex items-center justify-center gap-1 py-1 px-1 hover:bg-slate-900 rounded-lg transition"
                        title="Clic para registrar o cambiar precio"
                      >
                        <span className={`font-mono text-xs ${hasQuoteValue ? "text-emerald-450 font-bold" : "text-slate-550 italic"}`}>
                          {hasQuoteValue 
                            ? `$ ${quote.unitPrice.toLocaleString("es-AR", { maximumFractionDigits: 0 })}` 
                            : "Pendiente"
                          }
                        </span>
                        <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100 text-cyan-400 transition" />
                      </div>
                    )}
                  </td>

                  {/* Supplier (editable) */}
                  <td className="py-3.5 px-4 text-center max-w-[140px]">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editSupplier}
                        onChange={e => setEditSupplier(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 outline-none w-full text-xs text-center font-sans"
                        placeholder="Ej: Solimet, Chacarita"
                      />
                    ) : (
                      <div 
                        onClick={() => handleStartEdit(item)}
                        className="cursor-pointer group flex items-center justify-center gap-1 py-1 px-1 hover:bg-slate-900 rounded-lg transition"
                        title="Clic para registrar o cambiar de proveedor"
                      >
                        <span className={`px-2 py-0.5 rounded text-[10.5px] font-medium leading-none flex items-center gap-1 ${
                          hasSupplierValue 
                            ? "bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 font-bold" 
                            : "bg-slate-900 border border-slate-850 text-slate-500 italic"
                        }`}>
                          {hasSupplierValue ? quote.supplier : "Sin asignar"}
                          <Edit3 className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-cyan-400 transition ml-0.5" />
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Total Accumulation */}
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-100 text-xs">
                    {hasQuoteValue ? (
                      <span className="text-cyan-400">
                        $ {(item.quantity * quote.unitPrice).toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                      </span>
                    ) : (
                      <span className="text-slate-600 font-normal">—</span>
                    )}
                  </td>

                  {/* Edit Controls */}
                  <td className="py-3.5 px-4 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded p-1.5 cursor-pointer flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold font-sans"
                          title="Guardar cotización manual"
                        >
                          <Save className="h-3.5 w-3.5" />
                          Guardar
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-slate-800 hover:bg-slate-755 text-slate-300 rounded p-1.5 cursor-pointer"
                          title="Cancelar edición"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="text-cyan-400 hover:text-cyan-300 border border-cyan-500/10 hover:bg-cyan-500/5 hover:border-cyan-500/20 rounded px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 ml-auto cursor-pointer"
                        title="Editar costos y proveedores"
                      >
                        <Edit3 className="h-3 w-3" />
                        Editar Línea
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* GRAND TOTALS OF MANUALLY ENTERED VALUES */}
      <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Coins className="h-4 w-4 text-emerald-400" />
            Presupuesto Auditado de Materiales (Valores Propios)
          </h4>
          <p className="text-[11px] text-slate-400 font-sans">
            Muestra el resultado acumulado de los costos cargados manualmente por el usuario arriba.
            {filledItemsCount > 0 ? (
              <span> Se cargaron cotizaciones para un total de <strong className="text-emerald-400 font-extrabold">{filledItemsCount} de {activeMaterialsList.length}</strong> tipos de materiales.</span>
            ) : (
              <span> Complete los valores unitarios cotizados por su proveedor usando el botón de edición para auditar el total de su obra.</span>
            )}
          </p>
        </div>

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 px-5 text-right space-y-1 min-w-[200px] w-full md:w-auto shrink-0 font-mono">
          <div className="text-[10px] text-slate-500 uppercase font-black">Total Manual Estimado Cuyo:</div>
          <div className="text-xl font-black text-emerald-400 leading-none">
            ${manualTotalWithIVA.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[9px] text-slate-500 leading-tight">
            (Subtotal: ${manualSubtotal.toLocaleString("es-AR", { maximumFractionDigits: 0 })} + IVA 21%)
          </div>
        </div>
      </div>

    </div>
  );
}
export default BudgetManager;
