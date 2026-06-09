import React, { useState, useEffect } from 'react';
import { StructureConfig, SelectedComponent3D, MaterialItem } from '../types';
import { Anchor, HelpCircle, HardHat, Layers, Copy, Check, Info, TrendingUp, ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';
import { formatPrice } from '../data';

interface PieceDetailViewerProps {
  config: StructureConfig;
  selectedComponent3D: SelectedComponent3D;
  onSelectComponent3D?: (component: SelectedComponent3D) => void;
  activeMaterials?: MaterialItem[];
  baselineMaterials?: MaterialItem[];
}

type PieceTab = 'marco' | 'skeleton' | 'bracing' | 'columns' | 'chapa' | 'anchors' | 'foundation' | 'complementos';

export default function PieceDetailViewer({
  config,
  selectedComponent3D,
  onSelectComponent3D,
  activeMaterials,
  baselineMaterials
}: PieceDetailViewerProps) {
  const [activeTab, setActiveTab] = useState<PieceTab>('anchors');
  const [copied, setCopied] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset zoom and pan on tab changes
  useEffect(() => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  }, [activeTab]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const nextX = e.clientX - dragStart.x;
    const nextY = e.clientY - dragStart.y;
    
    // Bounds check to avoid dragging into infinity
    const boxLimit = 350 * zoomScale;
    const clampedX = Math.max(-boxLimit, Math.min(boxLimit, nextX));
    const clampedY = Math.max(-boxLimit, Math.min(boxLimit, nextY));
    
    setPanOffset({ x: clampedX, y: clampedY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }
  };

  // Sync active tab with 3D clicked component selection
  useEffect(() => {
    if (selectedComponent3D !== 'none') {
      if (selectedComponent3D === 'marco') setActiveTab('marco');
      else if (selectedComponent3D === 'skeleton') setActiveTab('skeleton');
      else if (selectedComponent3D === 'chapa') setActiveTab('chapa');
      else if (selectedComponent3D === 'columns') setActiveTab('columns');
      else if (selectedComponent3D === 'foundation') setActiveTab('foundation');
      else if (selectedComponent3D === 'anchors') setActiveTab('anchors');
    }
  }, [selectedComponent3D]);

  const h = config.height / 100;
  const w = config.width / 100;
  const c = config.clearanceHeight / 100;

  // Profile dimensions mapped for visual rendering details
  const getMarcoDimensions = () => {
    if (config.marcoProfile === '50x50x2') return { size: 50, thick: 2, r: 4 };
    if (config.marcoProfile === '60x60x2') return { size: 60, thick: 2, r: 5 };
    return { size: 80, thick: 3, r: 6 }; // 80x80x3
  };

  const getSkeletonDimensions = () => {
    if (config.skeletonProfile === '40x40x2') return { size: 40, thick: 2.0 };
    if (config.skeletonProfile === '40x40x2.5') return { size: 40, thick: 2.5 };
    return { size: 30, thick: 2.0 }; // 30x30x2
  };

  const getColumnDimensions = () => {
    if (config.columnProfile === 'tubing_2_7_8') return { label: 'Tubing 2 7/8" Rezago', od: 73.0, id: 62.0, thick: 5.51, type: 'Acero de pozo sin costura (Siderca/API)' };
    if (config.columnProfile === 'tubing_3_1_2') return { label: 'Tubing 3 1/2" Pesado', od: 88.9, id: 75.9, thick: 6.49, type: 'Acero estructural petrolero grueso' };
    return { label: 'Caño Redondo 114mm', od: 114.0, id: 107.6, thick: 3.2, type: 'Caño negro estructural para herrería' };
  };

  const handleCopyQuoteText = () => {
    const colCount = config.columnCount;
    const odLabel = config.columnProfile === 'tubing_2_7_8' ? '2 7/8" (Ø 73.0 mm)' : config.columnProfile === 'tubing_3_1_2' ? '3 1/2" (Ø 88.9 mm)' : 'Ø 114 mm';
    const boltDia = config.anchorBoltDiameter;
    const plateThick = config.anchorPlateThickness;
    const basePlateWidth = Math.round(config.foundationWidth * 0.70 * 10); // mm

    // Calculate approx quantities dynamically
    const signArea = (config.width / 100) * (config.height / 100);
    const estimatedScrews = Math.ceil(signArea * 12);
    
    // Structure lengths for consumable estimation
    const perimeter = ((config.width / 100) + (config.height / 100)) * 2;
    const gridCols = config.gridCols || 3;
    const gridRows = config.gridRows || 2;
    const skeletonLeters = (config.width / 100) * (gridCols + 1) + (config.height / 100) * (gridRows + 1);
    const paintLiters = Math.ceil((perimeter + skeletonLeters) * 0.05 + 1);
    const estimatedElectrodesKg = Math.ceil((perimeter + skeletonLeters) * 0.12 + 1);

    const quoteTemplate = `Estimado/a, solicito cotización para la compra y provisión de los siguientes materiales para cartel estructural de herrería pesada:

1) KITS DE ANCLAJE DE VIENTO (Fijación de Columnas de Soporte):
- Cantidad: ${colCount} Kits Completos (aptos para resistir fatiga por flexión bajo ráfagas de viento).
- Cada kit debe contener:
  * 1 Placa Base de acero estructural de ${basePlateWidth}x${basePlateWidth} mm de chapa lisa de ${plateThick}mm de espesor, provista de orificio concéntrico calibrado para insertar el poste de Tubing y perforada en las 4 esquinas con ojales para pernos de ${boltDia}".
  * 4 Escuadras Triangulares de refuerzo cortadas en chapa de 9.5 mm (3/8") de espesor, medidas de 80 mm de base por 160 mm de altura vertical, para soldadura continua perpendicular que impida la flexión y fatiga del cordón de unión.
  * 4 Pernos de cimentación roscados tipo J-Bolt de diámetro de rosca ${boltDia}" x 500 mm de longitud lineal, fabricados en acero grado comercial ASTM A307 / F-24, provistos con tuerca hexagonal pesada y arandela de presión Grover cada uno.

2) MATERIALES CONSUMIBLES Y DE PROTECCIÓN:
- Tornillos Autoperforantes de 1" de longitud con arandela vulcanizada de metal-neopreno (sello EPDM): ${estimatedScrews} unidades.
- Electrodos marca Conarco E6013 Punta Azul (diámetro de 2.5 mm) para soldadura de caños tubulares: ${estimatedElectrodesKg} kg.
- Esmalte Sintético con Antióxido incorporado 3 en 1 Negro Satinado para herrería exterior: ${paintLiters} Litros.

Se solicita cotización con desglose individual de los ítems con entrega en Mendoza (se prefiere proveedor unificado Solimet de Grupo Camin S.A.). Indicar plazos y formas de pago habilitadas. Atentamente.`;

    navigator.clipboard.writeText(quoteTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getTabMaterials = (): MaterialItem[] => {
    if (!activeMaterials) return [];
    switch (activeTab) {
      case 'anchors':
        return activeMaterials.filter(m => m.id === 'mat_anclajes');
      case 'columns':
        return activeMaterials.filter(m => m.id === 'mat_postes' || m.id === 'mat_sujecion');
      case 'marco':
        return activeMaterials.filter(m => m.id === 'mat_marco');
      case 'skeleton':
        return activeMaterials.filter(m => m.id === 'mat_skeleton' || m.id === 'mat_electrodos');
      case 'bracing':
        return activeMaterials.filter(m => m.id === 'mat_skeleton');
      case 'chapa':
        return activeMaterials.filter(m => m.id === 'mat_chapa' || m.id === 'mat_tornillos');
      case 'foundation':
        return activeMaterials.filter(m => m.id === 'mat_cimentacion');
      case 'complementos':
        return activeMaterials.filter(m => ['mat_tornillos', 'mat_electrodos', 'mat_pintura'].includes(m.id));
      default:
        return [];
    }
  };

  const tabLabels: { value: PieceTab; label: string; icon: string }[] = [
    { value: 'anchors', label: 'Kit de Anclaje', icon: '⚓' },
    { value: 'columns', label: 'Postes Tubing', icon: '🪵' },
    { value: 'marco', label: 'Caños Marco', icon: '🔲' },
    { value: 'skeleton', label: 'Caños Internos', icon: '🟩' },
    { value: 'bracing', label: 'Cortes Bracing', icon: '❌' },
    { value: 'chapa', label: 'Chapa Lisa', icon: '📄' },
    { value: 'foundation', label: 'Fundación', icon: '🧱' },
    { value: 'complementos', label: 'Insumos', icon: '🔩' }
  ];

  const marcoDim = getMarcoDimensions();
  const skelDim = getSkeletonDimensions();
  const colDim = getColumnDimensions();

  return (
    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800/80 shadow-lg" id="detalle-piezas-panel">
      {/* Header section */}
      <div className="border-b border-slate-800 pb-4 mb-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="text-cyan-400 w-5.5 h-5.5" />
          Especificación de Detalles y Secciones de Materiales
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Visualiza la sección transversal, espesores reales de soldadura y forma constructiva de cada parte del cartel.
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl mb-6 border border-slate-850">
        {tabLabels.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setActiveTab(tab.value);
              if (onSelectComponent3D) {
                // Sync back to 3D if applicable
                const compMap: Record<PieceTab, SelectedComponent3D> = {
                  marco: 'marco',
                  skeleton: 'skeleton',
                  columns: 'columns',
                  chapa: 'chapa',
                  foundation: 'foundation',
                  anchors: 'anchors',
                  bracing: 'skeleton',
                  complementos: 'none'
                };
                onSelectComponent3D(compMap[tab.value]);
              }
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === tab.value
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Dynamic Content Details Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: SVG Cross Section / 2D Part illustration (With Live Loupe / Zoom Controls) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-between bg-slate-950/40 border border-slate-800 rounded-xl p-4 min-h-[380px] relative overflow-hidden">
          
          <div className="w-full flex items-center justify-between border-b border-slate-850 pb-2 mb-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full shadow-sm">
              Corte Transversal / Sección Detalle
            </span>
            {/* Lente Zoom Lupa interactiva */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg shadow-sm">
              {(zoomScale > 1 || panOffset.x !== 0 || panOffset.y !== 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setZoomScale(1);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className="p-1 px-1.5 text-cyan-400 hover:text-cyan-350 rounded hover:bg-slate-800 cursor-pointer transition-colors text-[9px] font-extrabold uppercase tracking-wide flex items-center gap-1 border-r border-slate-800 mr-0.5"
                  title="Restaurar escala y posición original"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Centrar</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setZoomScale(z => Math.max(1, z - 0.2))}
                disabled={zoomScale <= 1}
                className="p-1 px-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-800 cursor-pointer transition-colors"
                title="Disminuir Zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-black text-cyan-400 min-w-[28px] text-center select-none">
                {zoomScale.toFixed(1)}x
              </span>
              <button
                type="button"
                onClick={() => setZoomScale(z => Math.min(2.6, z + 0.2))}
                disabled={zoomScale >= 2.6}
                className="p-1 px-1.5 text-slate-440 hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-800 cursor-pointer transition-colors"
                title="Aumentar Zoom / Lupa"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Scalable Canvas with Overflow handling */}
          <div 
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`flex-1 w-full flex items-center justify-center overflow-hidden max-h-[290px] py-4 bg-slate-950/60 rounded-lg relative select-none touch-none ${
              isDragging ? 'cursor-grabbing' : zoomScale > 1 ? 'cursor-grab' : 'cursor-default'
            }`}
          >
            {/* Draggable instructions overlay */}
            {zoomScale > 1 && (
              <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 backdrop-blur-xs text-white text-[9.5px] py-1 px-2.5 rounded-lg flex items-center justify-between pointer-events-none select-none z-10 animate-fade-in">
                <span className="flex items-center gap-1.5 font-sans font-medium text-slate-200">
                  <Move className="w-3 h-3 text-blue-400 shrink-0" />
                  <span>Arrastra con el ratón o táctil para mover</span>
                </span>
                <span className="bg-blue-600 text-white text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded-md font-mono">
                  {zoomScale.toFixed(1)}x
                </span>
              </div>
            )}

            <div 
              style={{ 
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              className="flex flex-col items-center justify-center transform-gpu"
              id="draggable_svg_canvas"
            >
              {/* MARCO PROFILE SPECIFIC SVG */}
              {activeTab === 'marco' && (
                <div className="text-center space-y-4">
                  <svg width="180" height="180" viewBox="0 0 100 100" className="drop-shadow-md">
                    {/* Outer metal square */}
                    <rect x="10" y="10" width="80" height="80" rx="3" ry="3" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
                    {/* Inner metal square (hollow pocket) */}
                    <rect x="16" y="16" width="68" height="68" rx="2" ry="2" fill="#f8fafc" stroke="#64748b" strokeWidth="1" />
                    {/* Measurements arrows */}
                    <line x1="10" y1="94" x2="90" y2="94" stroke="#3b82f6" strokeWidth="1" />
                    <path d="M 10 94 L 14 91 L 14 97 Z M 90 94 L 86 91 L 86 97 Z" fill="#3b82f6" />
                    {/* Thickness indicators */}
                    <path d="M 12 50 L 5 50" stroke="#ef4444" strokeWidth="1" />
                    <text x="3" y="46" fill="#ef4444" fontSize="5" fontWeight="bold">e: {marcoDim.thick}mm</text>
                    <text x="50" y="99" fill="#2563eb" fontSize="6.5" fontWeight="black" textAnchor="middle">{marcoDim.size} mm</text>
                    <text x="50" y="52" fill="#64748b" fontSize="6" textAnchor="middle" fontWeight="bold">ESPACIO HUECO</text>
                  </svg>
                  <div className="text-xs font-semibold text-slate-300">
                    Caño Estructural de {marcoDim.size} x {marcoDim.size} x {marcoDim.thick} mm
                  </div>
                </div>
              )}

              {/* SKELETON PROFILE SPECIFIC SVG */}
              {activeTab === 'skeleton' && (
                <div className="text-center space-y-4">
                  <svg width="180" height="180" viewBox="0 0 100 100" className="drop-shadow-md">
                    {/* Outer metal square */}
                    <rect x="15" y="15" width="70" height="70" rx="2" ry="2" fill="#cbd5e1" stroke="#334155" strokeWidth="1.5" />
                    {/* Inner metal square */}
                    <rect x="20" y="20" width="60" height="60" rx="1.5" ry="1.5" fill="#f8fafc" stroke="#475569" strokeWidth="1" />
                    {/* Arrow */}
                    <line x1="15" y1="91" x2="85" y2="91" stroke="#3b82f6" strokeWidth="0.8" />
                    <path d="M 15 91 L 18 89 L 18 93 Z M 85 91 L 82 89 L 82 93 Z" fill="#3b82f6" />
                    
                    <path d="M 17.5 50 L 8 50" stroke="#ef4444" strokeWidth="0.8" />
                    <text x="6" y="47" fill="#ef4444" fontSize="4.5" fontWeight="bold">e: {skelDim.thick.toFixed(1)}mm</text>
                    <text x="50" y="96" fill="#2563eb" fontSize="6" fontWeight="bold" textAnchor="middle">{skelDim.size} mm</text>
                  </svg>
                  <div className="text-xs font-semibold text-slate-300">
                    Caño Interno de {skelDim.size} x {skelDim.size} x {skelDim.thick.toFixed(1)} mm
                  </div>
                </div>
              )}

              {/* DESIGN ESQUELETO BRACING DIAGS SPECIFIC SVG */}
              {activeTab === 'bracing' && (
                <div className="text-center space-y-4">
                  <svg width="180" height="180" viewBox="0 0 100 100" className="bg-[#0f172a] rounded-lg p-2">
                    {/* Representing the weld cross joint */}
                    <line x1="10" y1="10" x2="90" y2="90" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
                    <line x1="90" y1="10" x2="10" y2="90" stroke="#475569" strokeWidth="6" strokeLinecap="round" />
                    {/* Weld bead effects */}
                    <circle cx="50" cy="50" r="7" fill="rgba(6,182,212,0.15)" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2,2" />
                    <path d="M 50 35 L 50 65" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="50" y="32" fill="#38bdf8" fontSize="5" fontWeight="bold" textAnchor="middle">CORTE ESCUADRA 45°</text>
                    <text x="50" y="73" fill="#22d3ee" fontSize="4.5" fontWeight="bold" textAnchor="middle">SOLDADURA CONTINUA</text>
                  </svg>
                  <div className="text-xs font-semibold text-slate-300">
                    Unión Diagonal Cruz de San Andrés / Esqueleto Bracing
                  </div>
                </div>
              )}

              {/* POSTES SUPPORT TUBING SPECIFIC SVG */}
              {activeTab === 'columns' && (
                <div className="text-center space-y-4">
                  <svg width="180" height="180" viewBox="0 0 100 100" className="drop-shadow-md">
                    {/* Ground pipe shadow */}
                    <circle cx="50" cy="50" r="40" fill="#94a3b8" stroke="#1e293b" strokeWidth="2.5" />
                    {/* Inner sleeve hole */}
                    <circle cx="50" cy="50" r="34" fill="#f8fafc" stroke="#475569" strokeWidth="1" />
                    
                    {/* Dimensions markings */}
                    <line x1="10" y1="50" x2="90" y2="50" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="2,2" />
                    <text x="50" y="44" fill="#ef4444" fontSize="5" fontWeight="bold" textAnchor="middle">OD = {colDim.od} mm</text>
                    <text x="50" y="60" fill="#334155" fontSize="4.5" fontWeight="bold" textAnchor="middle">ID = {colDim.id} mm</text>
                    
                    {/* Thickness detail arrows */}
                    <line x1="10" y1="50" x2="16" y2="50" stroke="#2563eb" strokeWidth="1.2" />
                    <text x="24" y="52" fill="#2563eb" fontSize="5" fontWeight="black">e = {colDim.thick} mm</text>
                  </svg>
                  <div className="text-xs font-semibold text-slate-700">
                    {colDim.label} • Espesor: {colDim.thick} mm
                  </div>
                </div>
              )}

              {/* ANCHOR KITS SPECIFIC CUSTOM ASSEMBLY DETAILED VIEW */}
              {activeTab === 'anchors' && (
                <div className="text-center space-y-4">
                  <svg width="200" height="200" viewBox="0 0 120 120" className="bg-[#1e293b] rounded-xl border border-slate-700 p-2 shadow-inner">
                    {/* Concrete pad outline */}
                    <path d="M 10 95 L 110 95" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
                    <text x="60" y="113" fill="#94a3b8" fontSize="5" textAnchor="middle">BLOQUE FUNDACIÓN HORMIGÓN</text>

                    {/* Base Plate Cut */}
                    <rect x="25" y="70" width="70" height="6" rx="1.5" ry="1.5" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
                    <text x="98" y="74" fill="#38bdf8" fontSize="4" fontWeight="bold">Placa {config.anchorPlateThickness}mm</text>
                    
                    {/* Column Tubing fitting center */}
                    <rect x="47" y="10" width="26" height="60" fill="#334155" stroke="#cbd5e1" strokeWidth="1.2" />
                    
                    {/* Triangular Stiffening Escuadras (triangles) */}
                    <path d="M 47 70 L 37 70 L 47 38 Z" fill="#475569" stroke="#cbd5e1" strokeWidth="0.8" />
                    <path d="M 73 70 L 83 70 L 73 38 Z" fill="#475569" stroke="#cbd5e1" strokeWidth="0.8" />
                    <text x="18" y="44" fill="#38bdf8" fontSize="4.5" fontWeight="bold">Escuadras (4u)</text>
                    
                    {/* Threaded Foundation bolts J-bolts (J shape) */}
                    {/* Bolt Left */}
                    <path d="M 31 62 L 31 100 A 4 4 0 0 1 23 100" fill="none" stroke="#f1f5f9" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="31" cy="62" r="2.5" fill="#fbbf24" />
                    
                    {/* Bolt Right */}
                    <path d="M 89 62 L 89 100 A 4 4 0 0 1 81 100" fill="none" stroke="#f1f5f9" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="89" cy="62" r="2.5" fill="#fbbf24" />
                    
                    {/* Nuts labels */}
                    <text x="60" y="86" fill="#fbbf24" fontSize="4.5" fontWeight="black" textAnchor="middle">Pernos J-bolts Ø{config.anchorBoltDiameter}&quot;</text>
                    <text x="60" y="24" fill="#f1f5f9" fontSize="6.5" fontWeight="black" textAnchor="middle" opacity="0.9">POSTE TUBING</text>
                  </svg>
                  <div className="text-xs font-semibold text-slate-700">
                    Pernos J-Bolt {config.anchorBoltDiameter}&quot; • Baseplate de {config.anchorPlateThickness}mm
                  </div>
                </div>
              )}

              {/* CHAPA PROFILE DETAILS */}
              {activeTab === 'chapa' && (
                <div className="text-center space-y-4">
                  <svg width="180" height="180" viewBox="0 0 100 100" className="drop-shadow-md">
                    {/* Flat metal sheet profile with some rivets */}
                    <rect x="5" y="47" width="90" height="6" fill="#94a3b8" rx="1" ry="1" />
                    {/* Screws entering standard sheet */}
                    <path d="M 25 35 L 25 55 M 20 35 L 30 35" stroke="#ef4444" strokeWidth="1.5" />
                    <path d="M 75 35 L 75 55 M 70 35 L 80 35" stroke="#ef4444" strokeWidth="1.5" />
                    <text x="50" y="30" fill="#ef4444" fontSize="5.5" fontWeight="bold" textAnchor="middle">Tornillo Autoperforante</text>
                    <text x="50" y="65" fill="#475569" fontSize="6.5" fontWeight="bold" textAnchor="middle">Espesor BWG Nº18 (1.25 mm)</text>
                  </svg>
                  <div className="text-xs font-semibold text-slate-700">
                    Chapa Lisa de Revestimiento Galvanizada BWG 18
                  </div>
                </div>
              )}

              {/* FOUNDATION CONCRETE PROFILE */}
              {activeTab === 'foundation' && (
                <div className="text-center space-y-4">
                  <svg width="180" height="180" viewBox="0 0 100 100" className="drop-shadow-md">
                    <rect x="25" y="15" width="50" height="75" fill="rgba(148,163,184,0.2)" stroke="#94a3b8" strokeWidth="2.5" />
                    {/* Rebar lines */}
                    <rect x="32" y="22" width="36" height="60" fill="none" stroke="#2563eb" strokeWidth="1" strokeDasharray="3,3" />
                    {/* Central Tubing Core */}
                    <rect x="45" y="1" width="10" height="70" fill="gray" stroke="darkgray" strokeWidth="0.8" />
                    <text x="50" y="55" fill="#1e3a8a" fontSize="5.5" fontWeight="black" textAnchor="middle">Hormigón Elaborado</text>
                    <text x="50" y="62" fill="#1e3a8a" fontSize="5.5" fontWeight="bold" textAnchor="middle">{config.foundationConcreteGrade} Certificado</text>
                    <text x="50" y="80" fill="#2563eb" fontSize="5" textAnchor="middle">ARMADURA FIERROS 12mm</text>
                  </svg>
                  <div className="text-xs font-semibold text-slate-700">
                    Pozo de Cimentación de {config.foundationWidth}x{config.foundationWidth} cm
                  </div>
                </div>
              )}

              {/* INSUMOS DETAILS SUMMARY */}
              {activeTab === 'complementos' && (
                <div className="text-center space-y-4">
                  <svg width="180" height="180" viewBox="0 0 100 100" className="drop-shadow-md">
                    {/* Screw detailed sketch */}
                    <path d="M 20 40 L 50 40 M 35 30 L 35 50" stroke="#475569" strokeWidth="3" />
                    <rect x="45" y="36" width="30" height="8" rx="1.5" ry="1.5" fill="#94a3b8" />
                    <path d="M 75 36 L 85 40 L 75 44 Z" fill="#475569" />
                    <circle cx="45" cy="40" r="5" fill="#0284c7" /> {/* EPDM seal rubber */}
                    <text x="50" y="24" fill="#0284c7" fontSize="5.5" fontWeight="bold" textAnchor="middle">AUTOPERFORANTE 1&quot;</text>
                    <text x="50" y="70" fill="#475569" fontSize="5.5" fontWeight="bold" textAnchor="middle">ELECTRODOS E6013</text>
                    <text x="50" y="77" fill="#64748b" fontSize="4.5" textAnchor="middle">Punta Azul de Alto Rendimiento</text>
                  </svg>
                  <div className="text-xs font-semibold text-slate-700">
                    Tornillos c/Sello EPDM Vulcanizado & Electrodos
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="w-full text-center mt-1 border-t border-slate-100/80 pt-1">
            <span className="text-[9px] font-bold text-slate-400 select-none uppercase tracking-wider">
              Usa los controles de lupa para ver los detalles de espesores
            </span>
          </div>

        </div>

        {/* Right Side: Descriptive parameters, sizing metrics, and HOW TO QUOTE block */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          
          {/* Piece Descriptive specifications card */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-extrabold rounded-lg">
                Ficha Técnica
              </span>
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-tight">
                {activeTab === 'marco' ? 'Marco Perimetral Exterior del Cartel' :
                 activeTab === 'skeleton' ? 'Esqueleto de Grilla de Soporte' :
                 activeTab === 'bracing' ? 'Refuerzo Contra Viento (Cruz De San Andrés)' :
                 activeTab === 'columns' ? 'Columnas Postes de Soporte Tubing' :
                 activeTab === 'chapa' ? 'Revestimiento de Placas de Chapa Frente' :
                 activeTab === 'foundation' ? 'Fundaciones Terrestres de Hormigón' :
                 activeTab === 'complementos' ? 'Complementos y Consumibles de Herrería' :
                 'Kit de Anclaje de Alta Resistencia (Arriostramiento)'}
              </h4>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs text-slate-300 leading-relaxed">
              {activeTab === 'marco' && (
                <>
                  <p>Es el esqueleto perimetral cuadricular externo que conforma los 4 costados rígidos del cartel publicitario. Recibe la tensión torsional periférica del viento y los impactos directos.</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400">
                    <li><strong>Sección del caño:</strong> Caño estructural cuadrado de {marcoDim.size} x {marcoDim.size} mm en acero dulce.</li>
                    <li><strong>Espesores recomendados:</strong> {marcoDim.thick} mm (para vientos severos en Mendoza).</li>
                    <li><strong>Largo comercial de barra:</strong> 6.0 metros lineales.</li>
                    <li><strong>Mano de obra:</strong> Requiere corte a inglete a 45º y soldadura continua con costura estanca para evitar infiltración de humedad.</li>
                  </ul>
                </>
              )}

              {activeTab === 'skeleton' && (
                <>
                  <p>Es la cuadrícula de caños interiores soldados en el espacio hueco del marco que rigidizan la chapa. Evitan que las placas de chapa sufran pandeo o deformación (efecto tambor) por las ráfagas.</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400">
                    <li><strong>Viga recomendada:</strong> Caño cuadrado de {skelDim.size} x {skelDim.size} mm de pared.</li>
                    <li><strong>Espesor nominal:</strong> {skelDim.thick.toFixed(1)} mm.</li>
                    <li><strong>Formación:</strong> Distribuida en {config.gridRows - 2} caños horizontales e {config.gridCols - 2} caños verticales internos.</li>
                    <li><strong>Mapeo de fuerza:</strong> Divide el cartel en paños menores de 1.5 metros para repartir la presión uniforme.</li>
                  </ul>
                </>
              )}

              {activeTab === 'bracing' && (
                <>
                  <p>El sistema de Bracing inclinado o <strong>Cruces de San Andrés / Contra-viento</strong> agrega arriostramiento triangular rígido al chasis metálico. El triángulo es la única figura geométrica indeformable.</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400">
                    <li><strong>Efecto mecánico:</strong> Absorbe esfuerzos de corte provocados por vientos cruzados, impidiendo que el marco se transforme en paralelogramo y colapse.</li>
                    <li><strong>Material:</strong> Caño estructural cuadrado de 40x40x2.0 mm (o 3% del peso general).</li>
                    <li><strong>Geometría:</strong> Cruces diagonales perfectas cruzando cada cuadrante interno formado por los caños ortogonales.</li>
                  </ul>
                </>
              )}

              {/* POSTES SUPPORT TUBING SPECIFIC SVG WITH OVERLAP AND GRID MOUNTING */}
              {activeTab === 'columns' && (
                <div className="text-center space-y-4">
                  <svg width="280" height="180" viewBox="0 0 220 110" className="bg-[#0f172a] rounded-xl border border-slate-800 p-2 shadow-inner drop-shadow-md mx-auto">
                    {/* Left view border divider */}
                    <line x1="110" y1="5" x2="110" y2="105" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
                    
                    {/* SUB-VIEW 1: CIRCULAR TUBING SECTION */}
                    <g transform="translate(10, 0)">
                      <circle cx="45" cy="55" r="32" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
                      <circle cx="45" cy="55" r="26" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                      
                      {/* Dimensions markings */}
                      <line x1="13" y1="55" x2="77" y2="55" stroke="#f43f5e" strokeWidth="0.8" strokeDasharray="2,2" />
                      <text x="45" y="48" fill="#f43f5e" fontSize="5" fontWeight="bold" textAnchor="middle">OD {colDim.od} mm</text>
                      <text x="45" y="64" fill="#94a3b8" fontSize="4.5" fontWeight="bold" textAnchor="middle">ID {colDim.id} mm</text>
                      
                      {/* Thickness detail arrows */}
                      <line x1="13" y1="55" x2="19" y2="55" stroke="#38bdf8" strokeWidth="1.2" />
                      <text x="18" y="77" fill="#38bdf8" fontSize="4.5" fontWeight="black" textAnchor="middle">e = {colDim.thick} mm</text>
                      <text x="45" y="16" fill="#cbd5e1" fontSize="6" fontWeight="extrabold" textAnchor="middle">CORTE SECCIÓN</text>
                    </g>
                    
                    {/* SUB-VIEW 2: CONNECTION ASSEMBLY SCHEMATIC */}
                    <g transform="translate(115, 0)">
                      {/* Suelo ground line */}
                      <line x1="5" y1="85" x2="90" y2="85" stroke="#475569" strokeWidth="2" strokeDasharray="3,1" />
                      <text x="48" y="92" fill="#64748b" fontSize="4" textAnchor="middle" fontWeight="bold">SUELO / CIMIENTO</text>
                      
                      {/* Concrete Pozo outline */}
                      <rect x="25" y="85" width="46" height="20" fill="rgba(148,163,184,0.1)" stroke="#475569" strokeWidth="1" strokeDasharray="1,2" />
                      
                      {/* Tubing vertical column */}
                      {/* Underground block */}
                      <rect x="42" y="85" width="12" height="20" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                      {/* Above ground part */}
                      <rect x="42" y="25" width="12" height="60" fill="#334155" stroke="#94a3b8" strokeWidth="1.2" />
                      
                      {/* Billboard sign bottom frame (represented at y=45) */}
                      {/* Vertical grid costilla (C.C. 40x40) */}
                      <rect x="54" y="10" width="8" height="40" fill="#1e293b" stroke="#38bdf8" strokeWidth="0.8" opacity="0.8" />
                      {/* Horizontal Marco Inferior (C.C. 60x60) */}
                      <rect x="54" y="45" width="12" height="12" fill="#1e293b" stroke="#e2e8f0" strokeWidth="1.5" />
                      
                      {/* OVERLAP LABEL (Sube 150 cm) */}
                      <path d="M 38 45 L 38 25" stroke="#f59e0b" strokeWidth="0.8" />
                      <path d="M 38 25 L 38 45" stroke="#f59e0b" strokeWidth="0.8" />
                      <line x1="35" y1="45" x2="42" y2="45" stroke="#f59e0b" strokeWidth="0.8" />
                      <line x1="35" y1="25" x2="42" y2="25" stroke="#f59e0b" strokeWidth="0.8" />
                      <text x="32" y="38" fill="#f59e0b" fontSize="4.5" fontWeight="bold" textAnchor="end">Sube 1.5m</text>
                      
                      {/* Abrazadera U-Bolt / Placa clamps at y=32 and y=49 */}
                      {/* Top bracket clamp */}
                      <rect x="39" y="28" width="18" height="3" fill="#f59e0b" rx="0.5" />
                      {/* Bottom bracket clamp */}
                      <rect x="39" y="49" width="18" height="4" fill="#fbbf24" rx="0.5" />
                      
                      {/* Annotations */}
                      <text x="88" y="31" fill="#f59e0b" fontSize="4" fontWeight="bold" textAnchor="end">Grampa U 1/2"</text>
                      <text x="88" y="53" fill="#fbbf24" fontSize="4" fontWeight="bold" textAnchor="end">Placa Sujeción</text>
                      
                      <text x="48" y="16" fill="#cbd5e1" fontSize="6" fontWeight="extrabold" textAnchor="middle">UNIÓN A GRILLA</text>
                      
                      {/* Free height label */}
                      <text x="8" y="65" fill="#10b981" fontSize="4" fontWeight="black">Luz 4.0m</text>
                    </g>
                  </svg>
                  <div className="text-xs font-semibold text-slate-700">
                    {colDim.label} • Espesor: {colDim.thick} mm • Montaje con Doble Placa y Grapas U
                  </div>
                  <div className="text-left mt-4 border-t border-slate-100 pt-3 space-y-2 text-xs">
                    <p className="text-slate-600 font-medium leading-relaxed">
                      Los postes son los pilares maestros que transfieren todo el torque del cartel hacia abajo en los bloques de hormigón. Se prefiere caño tubing de rezago petrolero pesado sin costura debido a su formidable espesor de pared y tolerancia contra fatiga elástica.
                    </p>
                    <ul className="list-disc pl-4 space-y-1.5 text-slate-500 text-[11.5px] leading-relaxed">
                      <li><strong>Tipo de Caño:</strong> {colDim.label} ({colDim.type}).</li>
                      <li><strong>Dimensiones reales:</strong> Diámetro exterior {colDim.od} mm (OD {config.columnProfile === 'tubing_2_7_8' ? '2 7/8"' : config.columnProfile === 'tubing_3_1_2' ? '3 1/2"' : '4.5"'}) con pared de {colDim.thick} mm.</li>
                      <li><strong>Fijación y Montaje a la Cuadrícula:</strong> Se implementa montaje mecánico solidario de alta resistencia mediante 12 kits de abrazaderas U-Bolt pesadas de 1/2&quot; y placas de ajuste contra-puestas en chapa de 1/4&quot;. Cada poste tubing sube 150 cm desde la base del marco inferior, quedando abrazado y soldado tanto al marco perimetral de {config.marcoProfile} mm como a las costillas de la cuadrícula interna ({config.skeletonProfile} mm), conformando una transmisión de cargas rígida e indeformable.</li>
                      <li><strong>Luz Libre y Cimiento (Largo de Barra Cotizado: 9.0 m):</strong> Con los caños de 9 metros de largo cotizados, se obtiene una <strong>optimización perfecta sin desperdicios</strong>. Si enterramos 3.00 m en el pozo de hormigón y cubrimos 1.50 m dentro de la cuadrícula del cartel, la <strong>Altura Libre real del suelo resulta de 4.50 metros (450 cm)</strong>.</li>
                    </ul>

                    {/* COMPARACIÓN TÉCNICA TUBING */}
                    <div className="mt-4 bg-slate-900 text-slate-100 rounded-xl p-4 border border-slate-800 space-y-3 shadow-md leading-normal">
                      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                        <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
                          Análisis Técnico-Económico: ¿Qué Tubing Elegir?
                        </h4>
                      </div>
                      
                      <div className="space-y-2.5 text-[11px]">
                        <p className="text-slate-300">
                          Analizamos y contrastamos las cotizaciones de mercado recibidas para las columnas de este cartel (24 m² expuestos a ráfagas de <strong>viento Zonda de 130 km/h</strong> en Mendoza) tomando como base barras de 9.0 metros:
                        </p>

                        <div className="grid grid-cols-1 gap-2.5">
                          {/* Opción 3 1/2" Promocional - Chacarita Aceros */}
                          <div className="bg-slate-950 p-2.5 rounded-lg border border-cyan-500/40 space-y-1">
                            <div className="flex justify-between items-center flex-wrap gap-1">
                              <span className="font-bold text-cyan-400 text-[11.5px]">Tubing 3 1/2&quot; PROMO (Chacarita Aceros / Iván: +54 9 2615 26-5792)</span>
                              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">
                                ★ RECOMENDACIÓN GANADORA ★
                              </span>
                            </div>
                            <p className="text-slate-300 text-[10.5px]">
                              ¡Oferta imbatible de promoción! Ofrece barras de <strong>3.5&quot; a solo $10.000 ARS por metro lineal</strong>, disponibles en largos de 9 a 14 metros. Para nuestra optimización de 9.0 metros, cada caño masivo sale a solo <strong>$90.000 ARS final</strong>. Esto resulta incluso <strong>más económico</strong> que las opciones estándar de 2 7/8&quot; de otros proveedores, aportando la máxima seguridad estructural por menor costo total.
                            </p>
                          </div>

                          {/* Opción 3 1/2" de Tubing OK (ELIAS YAMIN) */}
                          <div className="bg-slate-950 p-2.5 rounded-lg border border-emerald-500/20 space-y-1">
                            <div className="flex justify-between items-center-wrap gap-1">
                              <span className="font-bold text-emerald-400 text-[11.5px]">Tubing 3 1/2&quot; 6mm (Tubing OK / Elias Yamin: $135.000 ARS final)</span>
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">
                                Alternativa Reforzada
                              </span>
                            </div>
                            <p className="text-slate-400 text-[10.5px]">
                              Ofrece barras de 9.0 m con espesor real de 6.00 mm. Sigue siendo una gran alternativa de respaldo, pero a $135.000 ARS resulta un 50% más costosa por caño que la promoción especial de Chacarita Aceros.
                            </p>
                          </div>

                          {/* Opción 2 7/8" de Cuenca del Sur */}
                          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-300 text-[11.5px]">Tubing 2 7/8&quot; rezago (Cuenca del Sur: $128.900 ARS + IVA)</span>
                              <span className="bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">
                                Estándar Económico
                              </span>
                            </div>
                            <p className="text-slate-400 text-[10.5px]">
                              Es un caño de rezago petrolero fuerte con diámetro de 73 mm y pared de 5.51 mm. Brinda una buena rigidez, pero habiendo existido la promo de 3 1/2&quot; de Chacarita de Aceros, queda obsoleto en rendimiento/precio.
                            </p>
                          </div>

                          {/* Opción 2 7/8" de Saldaña */}
                          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-400 text-[11.5px]">Tubing 2 7/8&quot; (Saldaña S.A.: $142.181 ARS + IVA)</span>
                              <span className="text-slate-500 text-[9px]">Cotización oficial S10563</span>
                            </div>
                            <p className="text-slate-400 text-[10.5px]">
                              Representa la alternativa de distribuidor integral pero resulta costosa frente a la propuesta directa de rezago petrolero y promociones de Mendoza.
                            </p>
                          </div>
                        </div>

                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[10.5px] text-amber-300 font-semibold space-y-1">
                          <p>💡 Conclusión del Asesor Técnico:</p>
                          <p className="text-slate-300 font-normal leading-relaxed">
                            No caben dudas: la nueva oferta de <strong>Tubing 3 1/2&quot; de Chacarita Aceros (Contacto Iván: +54 9 2615 26-5792) a $10.000 ARS el metro es insuperable</strong>. Nos entrega un chasis maestro prácticamente indestructible (3.5 pulgadas de diámetro, ideal para tolerar los momentos flectores extremos del viento Zonda Cuyano de 130 km/h) a un precio final estimado de <strong>$90.000 ARS por barra de 9 metros</strong>, logrando un ahorro sustancial frente a proveedores tradicionales. ¡Se recomienda encarecidamente esta opción!
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {activeTab === 'chapa' && (
                <>
                  <p>Constituye la chapa de acero lisa frontal sobre la que se fijan las lonas o vinilos publicitarios. Cubre la totalidad de la superficie frontal y se monta sobre la grilla interna del esqueleto.</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-500">
                    <li><strong>Calidad recomendada:</strong> Chapa lisa galvanizada BWG Nº 18 (Espesor real de 1.25 mm) para máxima durabilidad ante granizo.</li>
                    <li><strong>Tamaño seleccionado:</strong> {config.chapaSheetSize === '1.0x2.0' ? 'Placa estándar de 1.00m x 2.00m' : 'Placa grande de 1.22m x 2.44m (Maldonado S.A.)'}.</li>
                    <li><strong>Superficie a cubrir:</strong> {(w*h).toFixed(1)} m² de cartelera con fijaciones autoperforantes cada 30 cm.</li>
                    <li><strong>Solapado de viento:</strong> Requiere solape lateral de 5 cm orientado contra la dirección principal de viento predominante.</li>
                  </ul>
                </>
              )}

              {activeTab === 'foundation' && (
                <>
                  <p>Consiste en bases pesadas de hormigón elaboradas in-situ que alojan la parte inferior de las columnas soporte. Actúan como anclas de gravedad masivas e impiden el vuelco y deslizamiento.</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-500">
                    <li><strong>Fracción volumétrica:</strong> {config.foundationWidth}x{config.foundationWidth} cm de ancho, excavado hasta {config.foundationDepth} cm de profundidad.</li>
                    <li><strong>Calidad recomendada:</strong> Hormigón elaborado {config.foundationConcreteGrade} normalizado estructural (mínimo 21 Mpa).</li>
                    <li><strong>Densidad de peso:</strong> ~2,400 kg por cada m³ de volumen, conformando un contrapeso de gravedad inamovible.</li>
                    <li><strong>Tiempo curado óptimo:</strong> 28 días para máxima resistencia elástica antes del tensado de lonas.</li>
                  </ul>
                </>
              )}

              {activeTab === 'complementos' && (
                <>
                  <p>Representa todos los insumos críticos para la terminación del cartel: tornillería autoperforante, electrodos de soldadura profesionales y protección de esmalte sintético anticorrosión.</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-500">
                    <li><strong>Tornillos AUT:</strong> Tornillo hexagonal de 1&quot; con arandela vulcanizada de neoprene EPDM para evitar ruidos de chapa y filtraciones.</li>
                    <li><strong>Soldadura:</strong> Electrodos punta azul Conarco E6013 (2.5mm) de arco suave para fijaciones perfectas.</li>
                    <li><strong>Tratamiento:</strong> Esmalte anticorrosivo 3-en-1 Negro Satinado para detener la radiación UV e intemperie cuyana.</li>
                  </ul>
                </>
              )}

              {activeTab === 'anchors' && (
                <>
                  <p>Es el sistema de anclaje de viento (Baseplate &amp; J-Bolts). El cartel se fija mediante una **placa base de acero al carbono de {config.anchorPlateThickness}mm** de espesor y **pernos J-Bolt roscados de alta resistencia** para evitar la torsión por ráfagas intensas.</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-500">
                    <li><strong>Pernos anclaje:</strong> Pernos roscados curvados de {config.anchorBoltDiameter}&quot; de diámetro por 500 mm.</li>
                    <li><strong>Placa de acero:</strong> Chapa de base de {config.anchorPlateThickness} mm de espesor soldada al extremo del poste.</li>
                    <li><strong>Refuerzos estructurales:</strong> 4 escuadras triangulares de refuerzo para impedir flexión y fatiga de la soldadura de unión.</li>
                  </ul>
                </>
              )}
            </div>

            {/* LIVE COMPUTED MATERIAL QUANTITIES AND PRICING FOR SIDEROMETALURGICOS */}
            {activeMaterials && getTabMaterials().length > 0 && (() => {
              // Real-time grid vs bracing breakdown
              const rows = Math.max(0, config.gridRows - 2);
              const cols = Math.max(0, config.gridCols - 2);
              const baseGridMeters = (cols * h) + (rows * w);
              const baseGridBars = Math.ceil(baseGridMeters / 6.0);

              let bracingMeters = 0;
              let bracingBars = 0;
              if (config.gridPattern === 'diagonal_cross') {
                const quadW = w / (cols + 1);
                const quadH = h / (rows + 1);
                const quadDiag = Math.sqrt(quadW * quadW + quadH * quadH);
                const diagCount = (cols + 1) * (rows + 1);
                bracingMeters = diagCount * quadDiag;
                bracingBars = Math.ceil(bracingMeters / 6.0);
              }

              return (
                <div className="bg-slate-950/25 p-4 rounded-xl border border-slate-800 mt-1 space-y-3 animate-fade-in w-full">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-black text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse shrink-0" />
                      Cómputo en Vivo de este Elemento
                    </span>
                    <span className="bg-cyan-500/10 text-cyan-400 text-[9px] font-black px-2 py-0.5 rounded-full uppercase border border-cyan-500/20">
                      Ajuste Actual & Comparación
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {getTabMaterials().map((mat) => {
                      // Let's customize labels for anchors when rendering inside PieceDetailViewer
                      let customName = mat.name;
                      let customDesc = mat.description;
                      
                      if (mat.id === 'mat_anclajes') {
                        customName = `Kits de Anclaje de Viento (Inmunes a Fatiga y Torsión)`;
                        const basePlateWidth = Math.round(config.foundationWidth * 0.70 * 10);
                        customDesc = `Kit de Arriostramiento Completo que contiene:\n• Placas Base de ${config.anchorPlateThickness}mm de espesor (sección de ${basePlateWidth}x${basePlateWidth} mm).\n• Refuerzos de unión: 4 escuadras triangulares para impedir flexión y fatiga de la soldadura (espesor 9.5 mm / 3/8", medidas de 80 mm de base por 160 mm de altura, para soldar perpendicularmente al tubo y base).\n• Pernos de cimentación: 4 pernos roscados curvados tipo J-Bolt de diámetro ${config.anchorBoltDiameter}" x 500 mm de longitud lineal, fabricados en acero grado ASTM A307/F-24, con rosca provista de tuerca y arandela de presión cada uno.`;
                      }

                      const baselineItem = baselineMaterials?.find(b => b.id === mat.id);
                      const baselineQty = baselineItem ? baselineItem.quantity : 0;
                      const qtyDiff = mat.quantity - baselineQty;
                      const costDiff = mat.totalPrice - (baselineItem ? (baselineQty * baselineItem.unitPrice) : 0);
                      
                      return (
                        <div key={mat.id} className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-sm space-y-2.5 transition-all hover:border-slate-700">
                          <div className="flex justify-between items-start gap-3">
                            <div className="space-y-1">
                              <span className="text-xs font-black text-slate-100 block leading-tight">
                                {customName}
                              </span>
                              <span className="inline-block bg-slate-950 text-slate-400 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wide border border-slate-800">
                                {mat.id === 'mat_cimentacion' ? 'Suministrado por:' : 'Distribuidor sugerido:'} <strong className="text-cyan-450 font-extrabold">{mat.supplier}</strong>
                              </span>
                            </div>
                            
                            <div className="text-right shrink-0">
                              <span className="block text-[9px] font-black text-slate-500 font-mono select-none">
                                {formatPrice(mat.unitPrice)} c/u
                              </span>
                            </div>
                          </div>

                          {/* HIGH-CONTRAST SIDE-BY-SIDE COMPARATOR TABLE */}
                          <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-slate-950/60 p-2 rounded-xl border border-slate-850/80 my-1">
                            <div className="bg-slate-900 py-1.5 px-1 rounded-lg border border-slate-800 shadow-sm">
                              <span className="block text-[8px] text-slate-400 uppercase font-black tracking-wider">Ajuste Actual</span>
                              <span className="font-mono font-bold text-slate-100 text-xs">
                                {mat.quantity} {mat.unit}
                              </span>
                            </div>
                            <div className="bg-slate-900 py-1.5 px-1 rounded-lg border border-slate-800 shadow-sm">
                              <span className="block text-[8px] text-slate-400 uppercase font-black tracking-wider">Cotizado Base</span>
                              <span className="font-mono font-bold text-slate-500 text-xs">
                                {baselineQty > 0 ? `${baselineQty} ${mat.unit}` : '0 (No cotizado)'}
                              </span>
                            </div>
                            <div className={`py-1.5 px-1 rounded-lg border font-bold text-xs shadow-sm ${
                              baselineQty === 0
                                ? 'bg-amber-500/5 border-amber-500/20 text-amber-600'
                                : qtyDiff > 0
                                  ? 'bg-rose-500/5 border-rose-500/20 text-rose-500'
                                  : qtyDiff < 0
                                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600'
                                    : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}>
                              <span className="block text-[8px] text-slate-400 uppercase font-black tracking-wider">Diferencia</span>
                              <span className="font-mono">
                                {baselineQty === 0
                                  ? 'NUEVO'
                                  : qtyDiff > 0
                                    ? `+${qtyDiff} ${mat.unit}`
                                    : qtyDiff < 0
                                      ? `${qtyDiff} ${mat.unit}`
                                      : 'Sin cambio'}
                              </span>
                            </div>
                          </div>

                          {/* Bracing vs Grid detailed Breakdown of Cortes for 40x40 caño */}
                          {mat.id === 'mat_skeleton' && (
                            <div className="bg-cyan-500/5 border border-cyan-500/10 p-3 rounded-xl space-y-1.5 my-2">
                              <span className="text-[9.5px] font-black text-cyan-400 uppercase tracking-wider block flex items-center gap-1">
                                <span>⚙️ Desglose Técnico de Cortes (Grilla vs Bracing Cruz)</span>
                              </span>
                              <div className="text-[10px] text-slate-350 space-y-1 leading-relaxed">
                                <p>• <strong>Cuadrícula Interna Ortogonal:</strong> Requiere aproximado de <strong>{baseGridBars} caños</strong> de 6m (~{baseGridMeters.toFixed(1)} metros lineales para {rows} horizontales y {cols} verticales internos).</p>
                                <p>• <strong>Cruz de San Andrés Contra-viento:</strong> Requiere aproximado de <strong>{bracingBars} caños</strong> de 6m (~{bracingMeters.toFixed(1)} metros lineales útiles para {config.gridPattern === 'diagonal_cross' ? `${(cols + 1) * (rows + 1)} cortes de diagonal` : '0 cortes (Desactivado)'} de {config.gridPattern === 'diagonal_cross' ? `${Math.sqrt((w / (cols + 1))**2 + (h / (rows + 1))**2).toFixed(2)}m c/u` : '—'}).</p>
                                <p className="pt-1.5 border-t border-slate-800 text-[10.5px] font-bold text-slate-200 flex justify-between items-center bg-slate-950/40 px-2 rounded mt-1.5">
                                  <span>Pedido Total de Caño 40x40:</span>
                                  <span className="font-mono text-cyan-400">{mat.quantity} barras de 6.0m</span>
                                </p>
                                <p className="text-[8.5px] text-slate-450 italic pt-1 leading-tight">
                                  * Nota de Taller: El presupuesto cotizó originalmente <strong className="font-semibold text-slate-400">6 caños</strong> de 40x40 (suficientes para la grilla ortogonal sola). Al activar el patrón Cruz de San Andrés (arriostramiento de viento completo) se adicionan {bracingBars} barras, sumando {mat.quantity} caños en total.
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-800 pt-2 whitespace-pre-wrap leading-normal font-sans">
                            {customDesc}
                          </div>
                          
                          <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 font-mono mt-1 w-full">
                            <span className="text-[9px] text-slate-450 uppercase font-black tracking-normal">Cómputo en Vivo de Costo:</span>
                            <div className="text-right space-y-0.5">
                              <div className="text-slate-200 text-xs">Ajuste Neto: <strong className="text-cyan-450 font-extrabold">{formatPrice(mat.totalPrice)}</strong></div>
                              {qtyDiff !== 0 && baselineQty > 0 && (
                                <div className={`text-[9.5px] ${costDiff > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                  {costDiff > 0 ? `Adicional: +${formatPrice(costDiff)}` : `Ahorro: -${formatPrice(Math.abs(costDiff))}`}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 text-[9.5px] text-slate-400 leading-relaxed font-sans space-y-1">
                      <p className="font-bold text-slate-200 uppercase flex items-center gap-1">
                        <span>📌 Declaración de Origen de Precios y Proveedores</span>
                      </p>
                      <p>
                        • <strong>Hormigón elaborado ({config.foundationConcreteGrade}):</strong> Se cotiza de planta propia <strong>HORMISERV SRL</strong>.
                      </p>
                      <p>
                        • <strong>Siderúrgicos y bulonería:</strong> Los precios que figuran en pesos (ARS) son valores estimados netos de referencia obtenidos de relevamientos comerciales y listas de distribución mayoristas de Mendoza (Guaymallén, Coquimbito y Luján de Cuyo) de **Solimet de Grupo Camin S.A.** actualizados a Junio 2026.
                      </p>
                      <p>
                        • <strong>Recomendación técnica:</strong> Dado el contexto inflacionario de plaza, use los textos técnicos de pedido generados para remitirlos a las distribuidoras indicadas o de su confianza para recibir una cotización formal.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* CRITICAL FEATURE: "CÓMO PEDIR EN PROVEEDOR PARA COTIZAR" SECTION */}
          {activeTab === 'anchors' ? (
            <div className="bg-amber-950/20 rounded-xl border border-amber-900/40 p-4.5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold">
                  <Anchor className="w-4 h-4 text-amber-400" />
                  <span>Guía Práctica: ¿Cómo pedir y cotizar estos kits?</span>
                </div>
                
                <button
                  type="button"
                  onClick={handleCopyQuoteText}
                  className={`px-3 py-1 text-[10.5px] font-bold rounded-lg border flex items-center gap-1 transition-all ${
                    copied 
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' 
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200 hover:text-white shadow-sm cursor-pointer'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copiar Plantilla de Pedido</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs text-amber-200/90 leading-relaxed space-y-2">
                <p>Las herrerías de obra o distribuidores de chapa (como <strong>Hierros Maldonado</strong> o talleres de tornería locales) cortan a pantógrafo o guillotina estas piezas. Para pedir cotización exacta sin dar vueltas, envíales la planilla prediseñada presionando el botón superior. Te asegurará recibir el precio correcto sin errores técnicos.</p>
                <div className="bg-slate-950 p-3 rounded-lg border border-amber-900/30 font-mono text-[9.5px] text-amber-100 max-h-[110px] overflow-y-auto selection:bg-amber-900/40 leading-normal">
                  <p className="font-bold border-b border-amber-900/30 pb-1 mb-1 text-[10px] text-amber-300">MENSAJE PARA COTIZAR KITS DE ANCLAJE:</p>
                  <p className="whitespace-pre-line text-slate-300">
                    Estimado/a, solicito cotización para la fabricación de los siguientes elementos de anclaje para cartel exterior:
                    <br />- {config.columnCount} unidades de KITS DE ANCLAJE DE VIENTO para columnas Tubing de {config.columnProfile === 'tubing_2_7_8' ? '2 7/8"' : '3 1/2"'}.
                    <br />- Cada kit debe incluir:
                    <br />  * 1 Placa Base de acero estructural de {Math.round(config.foundationWidth * 0.70 * 10)}x{Math.round(config.foundationWidth * 0.70 * 10)} mm x {config.anchorPlateThickness}mm de espesor, perforada para pernos de {config.anchorBoltDiameter}&quot;.
                    <br />  * 4 escuadras triangulares de refuerzo de e: 9.5 mm (3/8&quot;), medidas 80x160mm para soldar.
                    <br />  * 4 Pernos roscados tipo J-Bolt de {config.anchorBoltDiameter}&quot; x 500 mm de largo en acero ASTM A307 con tuerca y arandela.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <p className="font-bold text-slate-200">Sugerencia Herrería de Obra:</p>
                <p className="mt-0.5">Para {activeTab === 'marco' ? 'los marcos perimetrales exteriores' : activeTab === 'columns' ? 'los postes Tubing pesados' : 'este material'}, selecciona la pestaña <strong className="text-slate-300 font-bold">⚓ Kit de Anclaje</strong> arriba para copiar el texto técnico definitivo de pedido con el que cotizar de inmediato en carnicerías de metales de Mendoza.</p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
