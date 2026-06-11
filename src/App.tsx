import React, { useState, useEffect } from 'react';
import { StructureConfig, SelectedComponent3D, MaterialItem, SupplierPreset } from './types';
import { calculateMaterials, SUPPLIER_PRESETS, PROFILE_DETAILS, calculateStructureWeightAndVols, formatPrice } from './data';
import ThreeCanvas from './components/ThreeCanvas';
import PieceDetailViewer from './components/PieceDetailViewer';
import { BudgetManager } from './components/BudgetManager';
import { 
  Building2, 
  Settings2, 
  Sparkles, 
  HelpCircle, 
  Ruler, 
  FileSpreadsheet, 
  Info, 
  Eye, 
  EyeOff, 
  Camera, 
  Anchor, 
  CheckCircle2,
  HardHat,
  MapPin,
  Maximize2,
  TrendingDown,
  TrendingUp,
  Scale,
  Mail,
  Play,
  Pause,
  RotateCcw,
  Layout
} from 'lucide-react';

export default function App() {
  // Main state defining the full architectural design configuration
  const [config, setConfig] = useState<StructureConfig>({
    width: 800, // 800 cm (8 meters)
    height: 300, // 300 cm (3 meters)
    clearanceHeight: 300, // distance ground to bottom of sign (3.00 meters)
    gridPattern: 'diagonal_cross', // "San Andrés" default
    gridRows: 6, // 6 horizontal braces
    gridCols: 6, // 6 vertical braces
    marcoProfile: '60x60x2', // "reforzado"
    skeletonProfile: '40x40x2', // standard solicited
    chapaProfile: 'chapa_18', // gauge 18 structural sheeting
    chapaSheetSize: '1.0x2.0', // standard sheet dimension
    columnProfile: 'tubing_3_1_2', // "muy robusto" Tubing 3 1/2"
    columnCount: 6, // default 6 support poles
    columnBuriedDepth: 300, // 300 cm de profundidad (3 meters)
    columnInsertHeight: 300, // 300 cm overlapping insert depth
    windSpeed: 160,       // 160 km/h default for Cordillera
    foundationWidth: 100, // square concrete base width in cm
    foundationDepth: 300, // concrete depth matches 300 cm buried depth
    foundationConcreteGrade: 'H25', // "fuerte" H25
    anchorBoltDiameter: '7/8', // diameter in inches (reforzado)
    anchorPlateThickness: 12 // thickness in mm
  });

  const [selectedComponent, setSelectedComponent] = useState<SelectedComponent3D>('none');
  const [customSuppliers, setCustomSuppliers] = useState<SupplierPreset[]>(() => {
    try {
      const isCleared = localStorage.getItem('billboard_data_cleared') === 'true';
      if (isCleared) return [];
      const saved = localStorage.getItem('billboard_custom_suppliers');
      return saved ? JSON.parse(saved) : SUPPLIER_PRESETS;
    } catch {
      return SUPPLIER_PRESETS;
    }
  });

  const handleSetCustomSuppliers = (suppliers: SupplierPreset[]) => {
    setCustomSuppliers(suppliers);
    try {
      if (suppliers.length > 0) {
        localStorage.removeItem('billboard_data_cleared');
      } else {
        localStorage.setItem('billboard_data_cleared', 'true');
      }
      localStorage.setItem('billboard_custom_suppliers', JSON.stringify(suppliers));
    } catch (e) {
      console.error(e);
    }
  };
  const [sidebarTab, setSidebarTab] = useState<'parametros' | 'computo'>('parametros');
  const [isQuoteCopied, setIsQuoteCopied] = useState(false);
  const [purchaseStrategy, setPurchaseStrategy] = useState<'optimal' | 'individual' | 'monoproveedor'>('optimal');
  
  // Custom states for 3D viewer toggle controls
  const [showSkeletonTransparent, setShowSkeletonTransparent] = useState(false);
  const [showSubterranean, setShowSubterranean] = useState(true);
  const [isARMode, setIsARMode] = useState(false);
  const [canvasMode, setCanvasMode] = useState<'standard' | 'cinema' | 'theater' | 'fullscreen'>('theater');
  const [assemblyLevel, setAssemblyLevel] = useState<number>(100);
  const [isAssembling, setIsAssembling] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isAssembling) {
      interval = setInterval(() => {
        setAssemblyLevel(prev => {
          if (prev >= 100) {
            setIsAssembling(false);
            return 100;
          }
          return Math.min(100, prev + 5);
        });
      }, 120);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAssembling]);

  // Define a constant baseline configuration representational of the starter state (8m x 3m standard quoted sign on 6 posts)
  const BASELINE_CONFIG: StructureConfig = {
    width: 800,
    height: 300,
    clearanceHeight: 400,
    gridPattern: 'standard',
    gridRows: 6,
    gridCols: 6,
    marcoProfile: '50x50x2',
    skeletonProfile: '40x40x2',
    chapaProfile: 'chapa_18',
    chapaSheetSize: '1.0x2.0',
    columnProfile: 'tubing_2_7_8',
    columnCount: 6,
    columnBuriedDepth: 100,
    foundationWidth: 80,
    foundationDepth: 120, // matching buried depth 100 (original baseline design)
    foundationConcreteGrade: 'H21',
    anchorBoltDiameter: '3/4',
    anchorPlateThickness: 12
  };

  // Calculates totals
  const currentMaterials = calculateMaterials(config, customSuppliers);
  const weightsRes = calculateStructureWeightAndVols(config);
  const totalWeightKg = Math.round(weightsRes.totalStructureWeightKg);

  const isDataCleared = customSuppliers.length === 0;

  // Dynamic Procurement Strategy Optimization
  // Find the cheapest suppliers for each specialized subclass
  const tubingKey = config.columnProfile === 'tubing_3_1_2' ? 'tubing3_1_2' : 'tubing2_7_8';

  let bestChasisSupplierObj = customSuppliers[0];
  let minChasisCost = Infinity;

  // Let's set a healthy default preset fallback first (Chacarita for 3.5" and Cuenca del Sur for 2 7/8")
  let bestTubingSupplierObj = customSuppliers.find(s => s.id === (config.columnProfile === 'tubing_3_1_2' ? 'chacarita' : 'cuenca_sur')) || customSuppliers[0];
  let minTubingPrice = Infinity;

  let bestSingleSupplierObj = customSuppliers[0];
  let minSingleTotal = Infinity;

  if (!isDataCleared) {
    customSuppliers.forEach(s => {
      try {
        const mList = calculateMaterials(config, [s]);
        
        // Calculate Chasis, Chapas e Insumos package cost
        const chasisCost = mList
          .filter(m => m.id !== 'mat_postes' && m.id !== 'mat_cimentacion')
          .reduce((sum, m) => sum + m.totalPrice, 0);

        // Save if cheapest
        if (chasisCost > 0 && chasisCost < minChasisCost) {
          minChasisCost = chasisCost;
          bestChasisSupplierObj = s;
        }

        // Calculate Tubing cost only - MUST check direct non-zero quote to prevent falling back to other suppliers' prices!
        const val = Number(s[tubingKey]);
        if (val && val > 0 && val < minTubingPrice) {
          minTubingPrice = val;
          bestTubingSupplierObj = s;
        }

        // Calculate Single total (everything except concrete)
        const singleTotal = mList
          .filter(m => m.id !== 'mat_cimentacion')
          .reduce((sum, m) => sum + m.totalPrice, 0);
        if (singleTotal > 0 && singleTotal < minSingleTotal) {
          minSingleTotal = singleTotal;
          bestSingleSupplierObj = s;
        }
      } catch (e) {
        console.error("Error calculating dynamic suppliers", e);
      }
    });
  }

  // Fallbacks if no valid pricing matched
  if (!bestChasisSupplierObj && customSuppliers.length > 0) {
    bestChasisSupplierObj = customSuppliers[0];
  }
  if (!bestTubingSupplierObj && customSuppliers.length > 0) {
    bestTubingSupplierObj = customSuppliers.find(s => s.id === (config.columnProfile === 'tubing_3_1_2' ? 'chacarita' : 'cuenca_sur')) || customSuppliers[0];
  }
  if (!bestSingleSupplierObj && customSuppliers.length > 0) {
    bestSingleSupplierObj = customSuppliers[0];
  }

  // Define dynamic display suppliers for the header widget:
  const chasisSupplier = isDataCleared 
    ? '— (Sin datos)' 
    : (bestChasisSupplierObj ? bestChasisSupplierObj.name : 'SOLIMET de Grupo Camin S.A.');

  const tubingSupplierLive = isDataCleared 
    ? '— (Sin datos)' 
    : (bestTubingSupplierObj ? bestTubingSupplierObj.name : 'Solimet');

  const concreteSupplier = isDataCleared 
    ? '— (Sin datos)' 
    : 'HORMISERV SRL (Planta Propia)';

  // Now calculate activeMaterials under chosen purchaseStrategy
  let activeMaterials: MaterialItem[] = [];
  if (purchaseStrategy === 'individual' || isDataCleared) {
    activeMaterials = currentMaterials;
  } else if (purchaseStrategy === 'optimal') {
    const chasisMList = calculateMaterials(config, [bestChasisSupplierObj]);
    const tubingMList = calculateMaterials(config, [bestTubingSupplierObj]);
    const defaultMList = currentMaterials;

    activeMaterials = defaultMList.map(item => {
      if (item.id === 'mat_postes') {
        const match = tubingMList.find(t => t.id === 'mat_postes');
        return match || item;
      } else if (item.id === 'mat_cimentacion') {
        return item; // concrete HORMISERV
      } else {
        const match = chasisMList.find(c => c.id === item.id);
        return match || item;
      }
    });
  } else {
    // monoproveedor
    const singleMList = calculateMaterials(config, [bestSingleSupplierObj]);
    const defaultMList = currentMaterials;

    activeMaterials = defaultMList.map(item => {
      if (item.id === 'mat_cimentacion') {
        return item; // concrete HORMISERV
      } else {
        const match = singleMList.find(s => s.id === item.id);
        return match || item;
      }
    });
  }

  const activeSubtotal = activeMaterials.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const activeGrandTotal = activeSubtotal * 1.21;

  // Baseline materials calculations (using the same supplier)
  const baselineMaterialsRaw = calculateMaterials(BASELINE_CONFIG, customSuppliers);
  // Apply any custom pricing from user activeMaterials to baselineMaterials to keep comparison fair
  const baselineMaterials = baselineMaterialsRaw.map(m => {
    // Override with EXACT quoted baseline units from user
    let quantity = 0;
    if (m.id === 'mat_marco') quantity = 7;
    else if (m.id === 'mat_skeleton') quantity = 6;
    else if (m.id === 'mat_postes') quantity = 6;
    else if (m.id === 'mat_chapa') quantity = 13;
    else {
      // Concrete, anchor kit, screws, welding electrodes and paint were not in the original baseline quote
      quantity = 0;
    }

    const customMatch = activeMaterials.find(c => c.id === m.id);
    if (customMatch) {
      return {
        ...m,
        quantity: quantity,
        unitPrice: customMatch.unitPrice,
        totalPrice: quantity * customMatch.unitPrice
      };
    }
    return {
      ...m,
      quantity: quantity,
      totalPrice: quantity * m.unitPrice
    };
  });
  const baselineWeights = calculateStructureWeightAndVols(BASELINE_CONFIG);
  const baselineWeightKg = Math.round(baselineWeights.totalStructureWeightKg);

  const baselineSubtotal = baselineMaterials.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const baselineGrandTotal = baselineSubtotal * 1.21;

  // Diffs
  const budgetDiff = activeGrandTotal - baselineGrandTotal;
  const weightDiff = totalWeightKg - baselineWeightKg;

  const subtotal = currentMaterials.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalIva = subtotal * 0.21;
  const grandTotal = subtotal + totalIva;

  // Handler for direct component updates from sidebar or 3D clicks
  const updateConfig = (key: keyof StructureConfig | Partial<StructureConfig>, value?: any) => {
    setConfig(prev => {
      let updated: StructureConfig;
      if (typeof key === 'object') {
        updated = { ...prev, ...key };
      } else {
        updated = { ...prev, [key]: value };
      }
      
      // Auto-validate aspect ratio or dimensions if needed
      const isWidthChanged = typeof key === 'object' ? 'width' in key : key === 'width';
      if (isWidthChanged) {
        const widthVal = typeof key === 'object' ? (key as any).width : value;
        const widthMeters = Number(widthVal) / 100;
        // Keep columns count proportional to safeguard structural collapse
        let colCount = 6;
        if (widthMeters <= 4) colCount = 3;
        else if (widthMeters <= 6) colCount = 4;
        else if (widthMeters <= 9) colCount = 6;
        else colCount = 8;
        updated.columnCount = colCount;
        updated.gridCols = colCount; // match vertical grids line up
      }

      // Keep concrete foundation depth in sync with column buried depth (structural requirement)
      const isBuriedChanged = typeof key === 'object' ? 'columnBuriedDepth' in key : key === 'columnBuriedDepth';
      if (isBuriedChanged) {
        const buriedVal = typeof key === 'object' ? (key as any).columnBuriedDepth : value;
        updated.foundationDepth = Number(buriedVal);
      }
      
      return updated;
    });
  };

  const selectComponentFrom3D = (part: SelectedComponent3D) => {
    setSelectedComponent(part);
    
    // Auto-scroll to view details tab on mobile if a component gets selected
    const el = document.getElementById('configurator-controls');
    if (el && window.innerWidth < 1024) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const canvasHeightClass = 
    canvasMode === 'standard' ? 'h-[480px]' :
    canvasMode === 'cinema' ? 'h-[380px]' :
    canvasMode === 'theater' ? 'h-[580px]' :
    'h-[750px]';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased pb-12">
      {/* Upper Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo / Title Area */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2.5 rounded-xl shadow-lg ring-1 ring-cyan-400/30">
              <HardHat className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  CONSTRUCAD <span className="text-cyan-400">3D</span>
                </h1>
                <span className="bg-cyan-500/10 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-500/20">
                  v3.2 PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Diseñador Estructural de Carteles por <strong className="text-cyan-400 font-bold">Marcelo Escudero</strong>
              </p>
            </div>
          </div>

          {/* Quick Stats Header Bar */}
          <div className="flex items-center gap-4 text-xs font-semibold overflow-x-auto w-full sm:w-auto justify-end">
            <div className="bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-1.5 flex flex-col shrink-0 min-w-[95px]">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Superficie Total</span>
              <span className="text-cyan-400 font-mono text-xs font-bold">{(config.width * config.height / 10000).toFixed(1)} m²</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-1.5 flex flex-col shrink-0 min-w-[95px]">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Peso Acero Est.</span>
              <span className="text-indigo-400 font-mono text-xs font-bold">~ {Math.round(totalWeightKg).toLocaleString()} kg</span>
            </div>

             <div className="bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-1.5 flex flex-col shrink-0 min-w-[130px]">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Postes de Soporte</span>
              <span className="text-emerald-400 font-mono text-xs font-bold">
                {config.columnCount} un. {config.columnProfile === 'tubing_3_1_2' ? 'Tubing 3 ½"' : 'Tubing 2 ⅞"'}
              </span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-1.5 flex flex-col shrink-0 min-w-[130px]">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Cimentación (Vol.)</span>
              <span className="text-amber-400 font-mono text-xs font-bold">
                ~ {(weightsRes.totalConcreteVolumeM3 || 0).toFixed(2)} m³ ({config.foundationConcreteGrade})
              </span>
            </div>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
        
        {/* Upper Layout Columns: 3D interactive stage + Quick Control Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT PANEL: The 3D Engine Frame & Viewer Filters */}
          <div className={`${
            canvasMode === 'standard' ? 'lg:col-span-8' : 'lg:col-span-12'
          } flex flex-col gap-4 transition-all duration-300`}>
            
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800/60 shadow-xl flex flex-col gap-4">
              
              {/* Filter controls layer */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-ping" />
                  <h2 className="text-sm font-bold text-slate-200">Simulación Espacial Tridimensional Interactiva</h2>
                </div>
                
                {/* Visualizer toggles */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-800 p-1 rounded-lg">
                  <button
                    onClick={() => setShowSkeletonTransparent(!showSkeletonTransparent)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded flex items-center gap-1.5 transition-colors ${
                      showSkeletonTransparent 
                        ? 'bg-cyan-600 text-white' 
                        : 'text-slate-400 hover:text-slate-100'
                    }`}
                    title="Permite ver las barras estructurales internas haciendo la chapa semitransparente"
                  >
                    <span>Transparencia:</span>
                    <span className="font-mono text-[10px]">{showSkeletonTransparent ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    onClick={() => setShowSubterranean(!showSubterranean)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded flex items-center gap-1.5 transition-colors ${
                      showSubterranean 
                        ? 'bg-amber-600 text-white' 
                        : 'text-slate-400 hover:text-slate-100'
                    }`}
                    title="Muestra el pozo de hormigón y bloque de cimientos enterrados"
                  >
                    <span>Cimientos Subterráneos:</span>
                    <span className="font-mono text-[10px]">{showSubterranean ? 'SÍ' : 'NO'}</span>
                  </button>

                  <button
                    onClick={() => setIsARMode(!isARMode)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded flex items-center gap-1.5 transition-colors ${
                      isARMode 
                        ? 'bg-indigo-600 text-white' 
                        : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Modo Realidad Aumentada (RA):</span>
                    <span className="font-mono text-[10px]">{isARMode ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* THREEJS CANVAS EMBED */}
              <div className={`${canvasHeightClass} w-full transition-all duration-300 relative`}>
                <ThreeCanvas
                  config={config}
                  onChangeConfig={setConfig}
                  selectedComponent={selectedComponent}
                  onSelectComponent={selectComponentFrom3D}
                  showSkeletonTransparent={showSkeletonTransparent}
                  showSubterranean={showSubterranean}
                  isARMode={isARMode}
                  assemblyLevel={assemblyLevel}
                  setAssemblyLevel={setAssemblyLevel}
                />
              </div>
                   {/* DOCK MULTIFUNCIÓN: CONTROLES DE PANTALLA Y SIMULACIÓN DE ARMADO */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4 animate-fade-in text-slate-300">
                <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
                  {/* Vis Mode Controls */}
                  <div className="space-y-1.5 shrink-0">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-cyan-400">
                      📐 Tamaño de Visualización del Escenario
                    </span>
                    <div className="flex flex-wrap items-center gap-1">
                      {[
                        { id: 'theater', label: 'Teatro (Expandido)', desc: 'Espacio colosal extendido' },
                        { id: 'fullscreen', label: 'Excelente Inmersivo', desc: 'Viewport completo de 750px' }
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setCanvasMode(mode.id as any)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded border cursor-pointer transition-all ${
                            canvasMode === mode.id
                              ? 'bg-cyan-600 text-white border-cyan-500 shadow-md'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                          }`}
                          title={mode.desc}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preloaded Designs */}
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-amber-400">
                      📂 Diseños Estructurales Precargados (Templates)
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        {
                          name: 'Diseño Mendoza Solicitado',
                          desc: 'Default con bases de 1x1x3m, H25, 6 postes Tubing 3 1/2 y arriostramiento Cruz de San Andrés para alta resistencia.',
                          setup: {
                            columnCount: 6,
                            columnBuriedDepth: 300,
                            foundationDepth: 300,
                            foundationWidth: 100,
                            foundationConcreteGrade: 'H25',
                            anchorPlateThickness: 12,
                            anchorBoltDiameter: '7/8',
                            width: 1200,
                            height: 450,
                            clearanceHeight: 400,
                            gridPattern: 'diagonal_cross',
                            gridRows: 6,
                            gridCols: 6,
                            columnProfile: 'tubing_3_1_2',
                            structureShape: 'flat',
                            columnType: 'tubing'
                          }
                        },
                        {
                          name: 'Torre Reticulada Antena',
                          desc: 'Pórtico doble con torres de andamije reticulado tipo celosía de antena de telecomunicación.',
                          setup: {
                            columnCount: 2,
                            columnBuriedDepth: 250,
                            foundationDepth: 250,
                            foundationWidth: 90,
                            foundationConcreteGrade: 'H25',
                            anchorPlateThickness: 12,
                            anchorBoltDiameter: '7/8',
                            width: 800,
                            height: 350,
                            clearanceHeight: 350,
                            gridPattern: 'diagonal_cross',
                            gridRows: 5,
                            gridCols: 5,
                            columnProfile: 'tubing_2_7_8',
                            structureShape: 'flat',
                            columnType: 'lattice_antenna'
                          }
                        }
                      ].map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setConfig(prev => ({
                              ...prev,
                              ...tmpl.setup
                            }));
                            setAssemblyLevel(100);
                          }}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white rounded text-[10.5px] font-medium transition-all cursor-pointer"
                          title={tmpl.desc}
                        >
                          {tmpl.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Assembly simulation controller (Removed by user choice) */}
                <div className="hidden">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                       <HardHat className="w-4 h-4 text-amber-500 shrink-0" />
                       <span className="text-xs font-black tracking-wider uppercase text-slate-200">
                         🔬 Simulador de Proceso de Armado y Despiece de Obra
                       </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (isAssembling) {
                            setIsAssembling(false);
                          } else {
                            if (assemblyLevel >= 100) {
                              setAssemblyLevel(0);
                            }
                            setIsAssembling(true);
                          }
                        }}
                        className={`px-3 py-1 text-[11px] font-black uppercase rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                          isAssembling
                            ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 px-3'
                        }`}
                      >
                        {isAssembling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{isAssembling ? 'Pausar Simulación' : 'Animar Armado'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsAssembling(false);
                          setAssemblyLevel(100);
                        }}
                        className="p-1 text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-950 rounded border border-slate-800 cursor-pointer transition-colors"
                        title="Restablecer a ensamblado completo (100%)"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-6">
                      <span className="text-[12px] font-extrabold text-cyan-400 font-mono w-14 shrink-0 text-right">
                        {assemblyLevel}%
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={assemblyLevel}
                        onChange={(e) => {
                          setIsAssembling(false);
                          setAssemblyLevel(Number(e.target.value));
                        }}
                        className="w-full accent-cyan-500 h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Step descriptions */}
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11.5px] leading-relaxed">
                      {assemblyLevel < 15 ? (
                        <div className="space-y-1">
                          <p className="font-bold text-slate-300 uppercase tracking-tight">📌 Fase 0: Preparación del Terreno (0% - 14%)</p>
                          <p className="text-slate-400">Replanteo, nivelación del terreno lineal y trazado de los ejes centrales donde se ubicarán los {config.columnCount} postes de soporte.</p>
                        </div>
                      ) : assemblyLevel < 35 ? (
                        <div className="space-y-1">
                          <p className="font-extrabold text-amber-500 uppercase tracking-tight flex items-center gap-1">🛠️ Fase 1: Pozos y Fundaciones de Hormigón ({assemblyLevel}%)</p>
                          <p className="text-slate-200">
                            Excavación de <strong>{config.columnCount} pozos de {config.foundationWidth}x{config.foundationWidth}x{config.columnBuriedDepth} cm</strong>. Armado y colado de <strong>Hormigón {config.foundationConcreteGrade}</strong>.
                          </p>
                          <p className="text-slate-400 mt-1">
                            Volumen total requerido para {config.columnCount} bases: <strong className="text-cyan-400 font-mono">{(config.columnCount * (config.foundationWidth/100) * (config.foundationWidth/100) * (config.columnBuriedDepth/100)).toFixed(2)} m³</strong> de hormigón elaborado.
                          </p>
                        </div>
                      ) : assemblyLevel < 55 ? (
                        <div className="space-y-1">
                          <p className="font-extrabold text-indigo-400 uppercase tracking-tight">🏗️ Fase 2: Izamiento de Postes y Kit de Anclaje ({assemblyLevel}%)</p>
                          <p className="text-slate-200">
                            Colocación de tubos <strong>Tubing {config.columnProfile === 'tubing_3_1_2' ? '3 1/2"' : '2 7/8"'}</strong> y Kits de Anclaje de Viento de Alta Resistencia.
                          </p>
                          <div className="text-slate-400 space-y-0.5 pl-3 mt-1 text-[11px] border-l border-slate-700/60 font-mono">
                            <p>• {config.columnCount} Placas Base (acero estructural de {config.columnCount === 6 ? '560x560' : '450x450'} mm, chapa de {config.anchorPlateThickness} mm de espesor).</p>
                            <p>• {config.columnCount * 4} Escuadras triangulares de refuerzo para impedir fatiga de unión ({config.columnCount === 6 ? '80x160mm, espesor 9.5 mm / 3/8"' : '60x120mm'}).</p>
                            <p>• Pernos de anclaje de alta resistencia zincados ø {config.anchorBoltDiameter}" ({config.columnCount * 4} unidades de 50 cm de largo).</p>
                          </div>
                        </div>
                      ) : assemblyLevel < 75 ? (
                        <div className="space-y-1">
                          <p className="font-extrabold text-purple-400 uppercase tracking-tight">📐 Fase 3: Soldadura de Marco Perimetral ({assemblyLevel}%)</p>
                          <p className="text-slate-200">
                            Armado y soldadura horizontal/vertical del marco exterior de soporte en caño estructural de perfil {config.marcoProfile}.
                          </p>
                          <p className="text-slate-400">
                            Brinda rigidez general inicial para la parrilla interna y las conexiones a los postes principales.
                          </p>
                        </div>
                      ) : assemblyLevel < 95 ? (
                        <div className="space-y-1">
                          <p className="font-extrabold text-cyan-400 uppercase tracking-tight">📐 Fase 4: Enrejado Interno y Bridas Cruz San Andrés ({assemblyLevel}%)</p>
                          <p className="text-slate-200">
                            Soldadura de las costillas y cuadrícula interna con caño {config.skeletonProfile}, reforzado con tensores diagonales tipo "Cruz de San Andrés" para contener torsión por ráfagas intensas de Zonda.
                          </p>
                          <p className="text-slate-400/90 text-[10.5px] font-mono">
                            Estructura cuadriculada optimizada con {config.gridCols} montantes verticales y {config.gridRows} rigidizadores transversales.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="font-extrabold text-emerald-500 uppercase tracking-tight">✨ Fase 5: Revestimiento de Chapa Siderchap Final ({assemblyLevel}%)</p>
                          <p className="text-slate-200">
                            Fijación mediante remaches rápidos o tornillos autoperforantes de las chapas lisas calibre {config.chapaProfile === 'chapa_18' ? '18 (muy robusto)' : '20'} formando la gran superficie plana final del cartel.
                          </p>
                          <p className="text-emerald-400/90 font-bold mt-1">
                            ¡Estructura Constracad terminada con éxito según especificaciones técnicas de Marcelo Escudero!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* COMPONENT SPECIFICATION POPUP (HIGH CONTRAST / TO IMPROVE ACCESSIBILITY AND COMPREHENSIVE DETAIL DISPLAY) */}
              {selectedComponent !== 'none' && (
                <div className="bg-slate-900 border-2 border-cyan-400 rounded-2xl p-5 space-y-4 shadow-2xl animate-fade-in text-white transition-all">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                      <h3 className="text-xs font-black tracking-wider uppercase text-cyan-400">
                        Especificaciones del Elemento Seleccionado en 3D
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectComponentFrom3D('none')}
                      className="text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded cursor-pointer transition-all uppercase font-medium"
                    >
                      Cerrar indicación ✕
                    </button>
                  </div>

                  {selectedComponent === 'columns' && (() => {
                    const colDetails = PROFILE_DETAILS.columns.find(col => col.value === config.columnProfile) || PROFILE_DETAILS.columns[0];
                    const insertHeight = config.columnInsertHeight !== undefined ? config.columnInsertHeight : (config.height / 2);
                    const postLength = (config.clearanceHeight + insertHeight + config.columnBuriedDepth) / 100;
                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                          <div className="space-y-1.5">
                            <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                              <span className="text-cyan-400">🪵</span> Postes de Soporte Estructurales
                            </h4>
                            <p className="text-[11.5px] text-slate-300 leading-snug">
                              Columnas verticales de soporte principal y anclaje sobre zapatas de fundación de hormigón.
                            </p>
                            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Diseño Actual:</span>
                                <span className="font-extrabold text-cyan-400 font-mono uppercase">
                                  {config.columnType === 'lattice_antenna' ? 'Torre Reticulada Celosía' 
                                   : config.columnType === 'ipn' ? 'Perfil Doble T IPN 120'
                                   : config.columnType === 'round_pipe' ? 'Caño Redondo Industrial'
                                   : 'Tubing Petrolero estándar'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Perfil:</span>
                                <span className="font-bold text-white font-mono">{colDetails.label}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Largo Total Postes:</span>
                                <span className="font-bold text-cyan-400 font-mono">{postLength.toFixed(2)} m</span>
                              </div>
                              <div className="flex justify-between border-t border-slate-900 pt-1 mt-1">
                                <span className="text-slate-500 font-medium whitespace-nowrap">↳ Altura Libre (Luz de suelo):</span>
                                <span className="font-bold text-slate-300 font-mono">{(config.clearanceHeight / 100).toFixed(2)} m</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-medium whitespace-nowrap">↳ Tramo dentro (Inserto):</span>
                                <span className="font-bold text-slate-300 font-mono">{(insertHeight / 100).toFixed(2)} m</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-center text-xs">
                              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                                <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-black">Cantidad total</span>
                                <span className="text-sm font-extrabold text-cyan-400 font-mono">{config.columnCount} u</span>
                              </div>
                              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                                <span className="block text-[8px] uppercase tracking-wider text-slate-405 font-black">Peso estimado</span>
                                <span className="text-sm font-extrabold text-indigo-400 font-mono">~{Math.round(weightsRes.columnsWeightKg)} kg</span>
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById('detalle-piezas-panel');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-[10.5px] rounded-xl uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer border-none"
                            >
                              <span>Ver ficha de cortes tubing y anclaje abajo ↓</span>
                            </button>
                          </div>
                        </div>

                        {/* INTERACTIVE COMPONENT EDITOR FOR COLUMNS */}
                        <div className="border-t border-slate-800/80 pt-3 mt-1 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                              Configurar Tipo de Estructura de Columnas:
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            {[
                              { value: 'tubing', label: '🪨 Tubing petrolero', desc: 'Columnas de caño redondo de pozo petrolero sin costura.' },
                              { value: 'lattice_antenna', label: '🗼 Torre Reticulada', desc: 'Trusses metálicos triangulares enrejados de antena.' },
                              { value: 'round_pipe', label: '⚪ Caño Redondo', desc: 'Tubería industrial de acero redondo laminado Ø114mm Ø4.5".' },
                              { value: 'ipn', label: '工 Perfil IPN', desc: 'Viga estructural IPN 120 pesada de alta resistencia.' }
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setConfig(prev => ({ ...prev, columnType: opt.value as any }))}
                                className={`p-2 rounded-xl text-left border cursor-pointer transition-all ${
                                  (config.columnType || 'tubing') === opt.value
                                    ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                                    : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:text-white hover:border-slate-700'
                                }`}
                                title={opt.desc}
                              >
                                <div className="text-[10px] font-extrabold tracking-tight leading-tight uppercase mb-0.5">{opt.label}</div>
                                <p className="text-[8px] text-slate-400 leading-tight line-clamp-2">{opt.desc}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {selectedComponent === 'marco' && (() => {
                    const marcoDetails = PROFILE_DETAILS.marco.find(m => m.value === config.marcoProfile) || PROFILE_DETAILS.marco[0];
                    const perimeter = (2 * config.width + 2 * config.height) / 100;
                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                          <div className="space-y-1.5">
                            <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                              <span className="text-cyan-400">🖼️</span> Marco Estructural Externo
                            </h4>
                            <p className="text-[11.5px] text-slate-300 leading-snug">
                              Bastidor perimetral externo donde se asienta y fija el entramado de chapa. Brinda la rigidez de contorno indispensable para evitar flexiones mecánicas.
                            </p>
                            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Geometría de Cara:</span>
                                <span className="font-bold text-cyan-400 font-mono uppercase">
                                  {(config.structureShape || 'flat') === 'curved' ? 'Curva Aerodinámica' 
                                   : (config.structureShape || 'flat') === 'v_shaped' ? 'Doble Faz en V' 
                                   : 'Plana Convencional'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Perfil requerido:</span>
                                <span className="font-bold text-white font-mono">{marcoDetails.label}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Medida de bastidor:</span>
                                <span className="font-bold text-white font-mono">{(config.width / 100).toFixed(2)}m x {(config.height / 100).toFixed(2)}m</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-center text-xs">
                              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                                <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-black">Barras de 6m</span>
                                <span className="text-sm font-extrabold text-cyan-400 font-mono">
                                  {Math.ceil(perimeter / 6)} u
                                </span>
                              </div>
                              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                                <span className="block text-[8px] uppercase tracking-wider text-slate-405 font-black">Peso estimado</span>
                                <span className="text-sm font-extrabold text-indigo-400 font-mono">~{Math.round(weightsRes.marcoWeightKg)} kg</span>
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById('detalle-piezas-panel');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-[10.5px] rounded-xl uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer border-none"
                            >
                              <span>Ver Ficha de Materiales abajo ↓</span>
                            </button>
                          </div>
                        </div>

                        {/* INTERACTIVE COMPONENT EDITOR FOR WALLS / SHAPES */}
                        <div className="border-t border-slate-800/80 pt-3 mt-1 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                              Configurar la Forma Estructural y Disposición del Cartel:
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {[
                              { value: 'flat', label: '🎴 Plano Recto simple', desc: 'Bastidor clásico de una fila plana y una sola cara rotulada.' },
                              { value: 'curved', label: '🍃 Curvo Aerodinámico', desc: 'Panel en 3 planos angulados en arco para mitigar la fuerza del viento.' },
                              { value: 'v_shaped', label: '📐 Doble Faz en V', desc: 'Doble cara angulada, ideal para autopistas bidireccionales.' }
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setConfig(prev => ({ ...prev, structureShape: opt.value as any }))}
                                className={`p-2.5 rounded-xl text-left border cursor-pointer transition-all ${
                                  (config.structureShape || 'flat') === opt.value
                                    ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                                    : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:text-white hover:border-slate-700'
                                }`}
                                title={opt.desc}
                              >
                                <div className="text-[11px] font-extrabold tracking-tight leading-tight uppercase mb-0.5">{opt.label}</div>
                                <p className="text-[9px] text-slate-400 leading-normal line-clamp-2">{opt.desc}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {selectedComponent === 'skeleton' && (() => {
                    const skDetails = PROFILE_DETAILS.skeleton.find(s => s.value === config.skeletonProfile) || PROFILE_DETAILS.skeleton[0];
                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                          <div className="space-y-1.5">
                            <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                              <span className="text-cyan-400">🕸️</span> Esqueleto Interior (Grilla / Arriostramiento)
                            </h4>
                            <p className="text-[11.5px] text-slate-300 leading-snug">
                              Entramado estructural de reparto interior soldado. Impide el flameo y la fatiga de las chapas frontales frente a la succión de vientos cruzados.
                            </p>
                            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Perfil:</span>
                                <span className="font-bold text-white font-mono">{skDetails.label}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Arriostramiento contra-viento:</span>
                                <span className="font-bold text-cyan-400 font-mono uppercase">
                                  {config.gridPattern === 'diagonal_cross' ? 'Cruz de San Andrés' 
                                   : config.gridPattern === 'v_bracing' ? 'Mecánico en V (Zonda)'
                                   : config.gridPattern === 'horizontal_trusses' ? 'Puntales Horizontales'
                                   : 'Grilla Recta Tradicional'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Metros de perfil lineal:</span>
                                <span className="font-bold text-white font-mono">{weightsRes.skeletonLinearMeters.toFixed(2)} m</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Disposición estructural:</span>
                                <span className="font-bold text-slate-300 font-mono">{config.gridRows - 2} horiz. x {config.gridCols - 2} vert.</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-center text-xs">
                              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                                <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-black">Barras de 6m</span>
                                <span className="text-sm font-extrabold text-cyan-400 font-mono">
                                  {Math.ceil(weightsRes.skeletonLinearMeters / 6)} u
                                </span>
                              </div>
                              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                                <span className="block text-[8px] uppercase tracking-wider text-slate-405 font-black">Peso estimado</span>
                                <span className="text-sm font-extrabold text-indigo-400 font-mono">~{Math.round(weightsRes.skeletonWeightKg)} kg</span>
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById('detalle-piezas-panel');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-[10.5px] rounded-xl uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer border-none"
                            >
                              <span>Ver Detalle de Grilla abajo ↓</span>
                            </button>
                          </div>
                        </div>

                        {/* INTERACTIVE COMPONENT EDITOR FOR SKELETON */}
                        <div className="border-t border-slate-800/80 pt-3 mt-1 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                              Configurar Patrones de Arriostramiento de la Estructura:
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            {[
                              { value: 'standard', label: '📏 Grilla Recta', desc: 'Entramado reticular recto estándar de caño estructural.' },
                              { value: 'diagonal_cross', label: '❌ Cruz de San Andrés', desc: 'Arriostramiento en equis (X) para máxima resistencia contra ráfagas Zonda.' },
                              { value: 'v_bracing', label: '📐 Mecánico en V', desc: 'Arriostramiento especial en forma de V invertida para rigidez superior.' },
                              { value: 'horizontal_trusses', label: '⛓️ Puntal Horiz.', desc: 'Rigidizadores transversales continuos anti-flameo.' }
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setConfig(prev => ({ ...prev, gridPattern: opt.value as any }))}
                                className={`p-2 rounded-xl text-left border cursor-pointer transition-all ${
                                  config.gridPattern === opt.value
                                    ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                                    : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:text-white hover:border-slate-700'
                                }`}
                                title={opt.desc}
                              >
                                <div className="text-[10px] font-extrabold tracking-tight leading-tight uppercase mb-0.5">{opt.label}</div>
                                <p className="text-[8px] text-slate-400 leading-tight line-clamp-2">{opt.desc}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {selectedComponent === 'chapa' && (() => {
                    const textCh = PROFILE_DETAILS.chapa.find(c => c.value === config.chapaProfile) || PROFILE_DETAILS.chapa[0];
                    const numChapas = activeMaterials.find(m => m.id === 'mat_chapa')?.quantity || 0;
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="space-y-1.5">
                          <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                            <span className="text-cyan-400">💿</span> Chapas Lisas Revestimiento
                          </h4>
                          <p className="text-[11.5px] text-slate-300 leading-snug">
                            Placas de revestimiento de acero galvanizado calibre industrial BWG 18. Son las encargadas de conformar el plano frontal liso y limpio ideal para rotulación publicitaria de alta adherencia.
                          </p>
                          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-805 space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Calibre de Chapa:</span>
                              <span className="font-bold text-white font-mono">{textCh.label}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Espesor real:</span>
                              <span className="font-bold text-cyan-400 font-mono">1.25 mm (Nº 18)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Medida por Pliego:</span>
                              <span className="font-bold text-slate-300 font-mono">
                                {config.chapaSheetSize === '1.0x2.0' ? '1.00m x 2.00m' : '1.22m x 2.44m'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Superficie Total:</span>
                              <span className="font-bold text-white font-mono">{(config.width * config.height / 10000).toFixed(2)} m²</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-center text-xs">
                            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                              <span className="block text-[8px] uppercase tracking-wider text-slate-405 font-black">Cantidad pliegos</span>
                              <span className="text-sm font-extrabold text-cyan-400 font-mono">{numChapas} u</span>
                            </div>
                            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                              <span className="block text-[8px] uppercase tracking-wider text-slate-405 font-black">Peso estimado</span>
                              <span className="text-sm font-extrabold text-indigo-400 font-mono">~{Math.round(weightsRes.chapaWeightKg)} kg</span>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              const el = document.getElementById('detalle-piezas-panel');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-[10.5px] rounded-xl uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer border-none"
                          >
                            <span>Ver Modulaciones de Chapa abajo ↓</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {selectedComponent === 'foundation' && (() => {
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="space-y-1.5">
                          <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                            <span className="text-cyan-400">🧱</span> Cimentación: Pozos de Hormigón
                          </h4>
                          <p className="text-[11.5px] text-slate-300 leading-snug">
                            Bases pesadas ejecutadas in-situ. El contrapeso y masa del hormigón impide físicamente el vuelco por momentos de empuje de viento en el cartel. Producido por nuestra planta de hormigón.
                          </p>
                          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-805 space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Hormigón elaborado:</span>
                              <span className="font-bold text-cyan-400 font-mono">Clase H-{config.foundationConcreteGrade.toUpperCase().replace('H', '')} Estructural</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Planta Logística:</span>
                              <span className="font-bold text-amber-400 font-sans">HORMISERV SRL (Planta Propia)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Pozos e:</span>
                              <span className="font-bold text-white font-mono">{config.columnCount} bases individuales</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Sección x Profundidad:</span>
                              <span className="font-bold text-slate-300 font-mono">{config.foundationWidth}x{config.foundationWidth} cm (Ancho) x {config.foundationDepth} cm (Profundidad)</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-center text-xs">
                            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                              <span className="block text-[8px] uppercase tracking-wider text-slate-405 font-black">Volumen hormigón</span>
                              <span className="text-sm font-extrabold text-cyan-400 font-mono">{weightsRes.totalConcreteVolumeM3.toFixed(2)} m³</span>
                            </div>
                            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                              <span className="block text-[8px] uppercase tracking-wider text-slate-405 font-black">Masa zapata total</span>
                              <span className="text-sm font-extrabold text-indigo-400 font-mono">~{Math.round(weightsRes.concreteWeightKg).toLocaleString()} kg</span>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              const el = document.getElementById('detalle-piezas-panel');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-[10.5px] rounded-xl uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer border-none"
                          >
                            <span>Ver detalles de cimentación abajo ↓</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {selectedComponent === 'anchors' && (() => {
                    const basePlateWidth = Math.round(config.foundationWidth * 0.70 * 10);
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="space-y-1.5">
                          <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                            <span className="text-cyan-400">⚓</span> Kit de Anclaje de Viento (Placa + Pernos)
                          </h4>
                          <p className="text-[11.5px] text-slate-300 leading-snug">
                            Kit de rigidez soldada e inserto. Combina una placa de gran espesor, espárragos tipo J-Bolt de gran diámetro y escuadras triangulares de refuerzo para impedir el vuelco y la fatiga por fluencia cíclica (viento Zonda).
                          </p>
                          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-850 space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Placas Base:</span>
                              <span className="font-bold text-white font-mono">{config.columnCount} placas de {basePlateWidth}x{basePlateWidth} mm x {config.anchorPlateThickness}mm</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Escuadras Triangulares:</span>
                              <span className="font-bold text-cyan-400 font-mono">{config.columnCount * 4} escuadras de refuerzo (9.5mm / 3/8")</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Pernos de Anclaje:</span>
                              <span className="font-bold text-white font-mono">{config.columnCount * 4} pernos J-Bolt Ø {config.anchorBoltDiameter}" x 500 mm</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-center text-xs">
                            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                              <span className="block text-[8px] uppercase tracking-wider text-slate-405 font-black">Placas de base</span>
                              <span className="text-sm font-extrabold text-cyan-400 font-mono">{config.columnCount} u ({config.anchorPlateThickness}mm)</span>
                            </div>
                            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                              <span className="block text-[8px] uppercase tracking-wider text-slate-450 font-black">Escuadras soldar</span>
                              <span className="text-sm font-extrabold text-indigo-400 font-mono">{config.columnCount * 4} u</span>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              const el = document.getElementById('detalle-piezas-panel');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-[10.5px] rounded-xl uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer border-none"
                          >
                            <span>Generar Plantilla de Pedido abajo ↓</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                </div>
              )}

              {/* Instructions on AR or camera */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2.5">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-200">Herramientas de navegación 3D:</p>
                  <p>Mantén presionado el <strong>Click Izquierdo</strong> para rotar el cartel. Mantén presionado el <strong>Click Derecho / Dos dedos</strong> para arrastrar la cámara. Usa la <strong>Rueda de ratón / Pellizcar</strong> para hacer Zoom.</p>
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT PANEL: Live Parameter Editor Sidebar */}
          <div className={`${
            canvasMode === 'standard' ? 'lg:col-span-4' : 'lg:col-span-12'
          } flex flex-col gap-6 transition-all duration-300`} id="configurator-controls">
            
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800/60 shadow-xl space-y-5 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-2 pb-4 border-b border-slate-800 mb-4">
                  <Settings2 className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Sintonización Estructural y Parámetros</h3>
                </div>

                {/* Dynamic Notification of clicked part */}
                {selectedComponent !== 'none' ? (
                  <div className="p-3 mb-4 bg-orange-600/10 border border-orange-500/20 rounded-xl text-xs space-y-1 text-slate-300">
                    <p className="font-bold text-orange-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Edición Rápida enfocada:
                    </p>
                    <p>Focalizado en: <strong className="text-white capitalize">{selectedComponent}</strong>. Haz cambios abajo para verlos reflejados al instante.</p>
                    <button 
                      onClick={() => setSelectedComponent('none')}
                      className="text-[10px] text-cyan-400 underline hover:text-cyan-300 block mt-1"
                    >
                      Limpiar enfoque de pieza
                    </button>
                  </div>
                ) : (
                  <div className="p-3 mb-4 bg-slate-950 rounded-xl text-xs text-slate-400 leading-snug">
                    💡 <span className="text-slate-200 font-medium">Tip de diseño:</span> Haz click directamente sobre cualquier componente visible del cartel en el render 3D izquierdo para preseleccionar y focalizar su sección.
                  </div>
                )}

                <div className={`${canvasMode === 'standard' ? 'space-y-4 max-h-[640px]' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'} overflow-y-auto pr-1 animate-fade-in`}>
                    
                    {/* WIND CALCULATION BLOCK AND QUICK CONFIG PRESETS */}
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-amber-500 tracking-wider block uppercase border-l-2 border-amber-500 pl-2">
                          🌪️ Zonas de Viento y Carga de Mendoza
                        </span>
                      </div>
                      
                      <p className="text-[10.5px] text-slate-400 leading-normal">
                        Mendoza exige cálculos estructurales estrictos debido a ráfagas severas. Elegí uno de los diseños típicos certificados para Mendoza o ajustá el viento de forma manual:
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Button Cordillera */}
                        <button
                          type="button"
                          onClick={() => {
                            setConfig(prev => ({
                              ...prev,
                              columnProfile: 'tubing_3_1_2',
                              columnBuriedDepth: 300,
                              columnInsertHeight: 300,
                              foundationWidth: 100,
                              foundationDepth: 300,
                              foundationConcreteGrade: 'H25',
                              gridPattern: 'diagonal_cross',
                              marcoProfile: '60x60x2',
                              skeletonProfile: '40x40x2',
                              clearanceHeight: 300,
                              windSpeed: 160
                            }));
                          }}
                          className={`text-left p-2 rounded-lg border text-xs flex flex-col justify-between transition relative overflow-hidden cursor-pointer active:scale-98 h-[105px] ${
                            config.columnBuriedDepth === 300 && config.columnInsertHeight === 300 && config.columnProfile === 'tubing_3_1_2'
                              ? 'bg-cyan-600/15 border-cyan-500/80 text-cyan-100 ring-1 ring-cyan-500/25'
                              : 'bg-slate-950 border-slate-850 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <span className="font-extrabold flex items-center gap-1 text-[11px] text-cyan-400">
                            🏔️ Zona Cordillerana
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5 line-clamp-2 leading-snug">
                            Alta Montaña. Estructura robustecida. Tubing 3 1/2&quot;, cimiento integral y 300cm inserto/libre.
                          </span>
                          <div className="text-[8.5px] font-mono text-cyan-400 bg-cyan-500/15 py-0.5 px-1.5 rounded self-start mt-1">
                            160 km/h (Cordillera)
                          </div>
                        </button>

                        {/* Button Zonda */}
                        <button
                          type="button"
                          onClick={() => {
                            setConfig(prev => ({
                              ...prev,
                              columnProfile: 'tubing_2_7_8',
                              columnBuriedDepth: 300,
                              columnInsertHeight: 300,
                              foundationWidth: 90,
                              foundationDepth: 300,
                              foundationConcreteGrade: 'H21',
                              gridPattern: 'diagonal_cross',
                              marcoProfile: '50x50x2',
                              skeletonProfile: '40x40x2',
                              clearanceHeight: 300,
                              windSpeed: 120
                            }));
                          }}
                          className={`text-left p-2 rounded-lg border text-xs flex flex-col justify-between transition relative overflow-hidden cursor-pointer active:scale-98 h-[105px] ${
                            config.columnBuriedDepth === 300 && config.columnInsertHeight === 300 && config.columnProfile === 'tubing_2_7_8' && config.clearanceHeight === 300
                              ? 'bg-amber-600/15 border-amber-500/80 text-amber-100 ring-1 ring-amber-500/25'
                              : 'bg-slate-950 border-slate-850 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <span className="font-extrabold flex items-center gap-1 text-[11px] text-amber-400">
                            🌪️ Viento Zonda
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5 line-clamp-2 leading-snug">
                            Valles mendocinos. Tubing 2 7/8&quot; optimizado, base de cemento reforzada de 300cm, inserto y altura libre de 3m.
                          </span>
                          <div className="text-[8.5px] font-mono text-amber-400 bg-amber-500/15 py-0.5 px-1.5 rounded self-start mt-1">
                            120 km/h (Zonda)
                          </div>
                        </button>
                      </div>

                      {/* Manual Wind speed slider control */}
                      <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-850 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider block">
                            🎚️ Control Manual de Ráfaga
                          </span>
                          <span className="text-[10px] font-black font-mono text-amber-400">
                            {(config.windSpeed ?? 160)} km/h
                          </span>
                        </div>
                        <input
                          type="range"
                          min="80"
                          max="200"
                          step="5"
                          value={config.windSpeed ?? 160}
                          onChange={(e) => updateConfig('windSpeed', Number(e.target.value))}
                          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                      </div>

                      {/* Real-Time Wind Load Dynamic Calculation Panel */}
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-2">
                        <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest block">
                          📊 Cálculo Dinámico de Fuerzas en Tiempo Real
                        </span>
                        {(() => {
                          const v = config.windSpeed ?? 160;
                          const wM = config.width / 100;
                          const hM = config.height / 100;
                          const area = wM * hM;
                          const colType = config.columnType || 'tubing';
                          
                          // Wind pressure q = 0.0053 * V^2 (kg/m2)
                          const q = 0.0053 * v * v;
                          // Force F = q * A * Cf (drag coeff Cf = 1.2)
                          const cf = 1.2;
                          const forceTotalKg = q * area * cf;
                          const forceTons = forceTotalKg / 1000;

                          // Overturning Moment (Momento de Volcamiento) F * lever_arm [clearanceHeight + height/2]
                          const leverArmM = (config.clearanceHeight + (config.height / 2)) / 100;
                          const momentKgm = forceTotalKg * leverArmM;
                          const momentTonm = momentKgm / 1000;

                          // Structural stability factor evaluation based on selected column type and mechanical bracing
                          let columnResilienceIndex = 5000;
                          if (config.columnType === 'lattice_antenna') {
                            columnResilienceIndex = 11500; // Torre Reticulada
                          } else if (config.columnType === 'ipn') {
                            columnResilienceIndex = 9600; // Perfil Doble T IPN
                          } else if (config.columnType === 'round_pipe') {
                            columnResilienceIndex = 4800; // Caño Redondo Ø114mm
                          } else {
                            // Tubing post profiles
                            columnResilienceIndex = config.columnProfile === 'tubing_3_1_2' ? 5200 : config.columnProfile === 'tubing_2_7_8' ? 2600 : 3500;
                          }

                          let bracingFactor = 1.0;
                          if (config.gridPattern === 'v_bracing') {
                            bracingFactor = 1.45; // Mechanical V bracing high wind load
                          } else if (config.gridPattern === 'diagonal_cross') {
                            bracingFactor = 1.30; // Cruz de San Andrés
                          } else if (config.gridPattern === 'horizontal_trusses') {
                            bracingFactor = 1.15; // Horizontal trusses
                          }

                          const concreteStabilityFactor = (config.columnBuriedDepth / 300) * (config.columnBuriedDepth / 300);
                          const totalStructuralStrength = config.columnCount * columnResilienceIndex * concreteStabilityFactor * bracingFactor;
                          const safetyFactor = Math.max(0.1, totalStructuralStrength / (momentKgm || 1));

                          let stabilityStatus = "ÓPTIMO 🛡️";
                          let stabilityColor = "text-emerald-400";
                          let stabilityBg = "bg-emerald-500/10 border-emerald-500/30";

                          if (safetyFactor < 1.0) {
                            stabilityStatus = "CRÍTICO 🚨 (Riesgo de Vuelco)";
                            stabilityColor = "text-rose-400 font-extrabold";
                            stabilityBg = "bg-rose-500/10 border-rose-500/30";
                          } else if (safetyFactor < 1.5) {
                            stabilityStatus = "MODERADO ⚠️ (Reforzar Cimiento/Perfil)";
                            stabilityColor = "text-amber-400";
                            stabilityBg = "bg-amber-500/10 border-amber-500/30";
                          }

                          return (
                            <div className="space-y-1.5">
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                                <div className="text-left">
                                  <span className="text-slate-500 block text-[8px] uppercase">Ráfaga de Diseño:</span>
                                  <span className="font-mono font-bold text-slate-300">{v} km/h</span>
                                </div>
                                <div className="text-left">
                                  <span className="text-slate-500 block text-[8px] uppercase">Presión de diseño (q):</span>
                                  <span className="font-mono font-bold text-slate-300">{q.toFixed(1)} kg/m²</span>
                                </div>
                                <div className="text-left mt-1 border-t border-slate-900 pt-1">
                                  <span className="text-slate-500 block text-[8px] uppercase">Superficie Vélica:</span>
                                  <span className="font-mono font-bold text-slate-300">{area.toFixed(2)} m² ({config.width}x{config.height} cm)</span>
                                </div>
                                <div className="text-left mt-1 border-t border-slate-900 pt-1">
                                  <span className="text-slate-500 block text-[8px] uppercase">Empuje Horizontal F:</span>
                                  <span className="font-mono font-extrabold text-rose-400">
                                    {forceTotalKg.toFixed(0)} kg ({forceTons.toFixed(2)} Tn)
                                  </span>
                                </div>
                                <div className="text-left mt-1 border-t border-slate-900 pt-1">
                                  <span className="text-slate-500 block text-[8px] uppercase">Brazo de Palanca:</span>
                                  <span className="font-mono font-bold text-slate-300">{leverArmM.toFixed(2)} metros</span>
                                </div>
                                <div className="text-left mt-1 border-t border-slate-900 pt-1">
                                  <span className="text-slate-500 block text-[8px] uppercase">Momento Volcador (M):</span>
                                  <span className="font-mono font-extrabold text-amber-400">
                                    {momentKgm.toFixed(0)} kgf·m ({momentTonm.toFixed(2)} Tn·m)
                                  </span>
                                </div>
                              </div>

                              <div className={`mt-1 border p-1.5 rounded flex items-center justify-between text-[9px] ${stabilityBg}`}>
                                <span className="text-slate-400 font-medium whitespace-nowrap">Estabilidad Estructural:</span>
                                <span className={`font-mono font-bold capitalize ${stabilityColor}`}>
                                  {stabilityStatus} (cs: {safetyFactor.toFixed(2)})
                                </span>
                              </div>

                              {/* RECOMENDACIÓN DINÁMICA CIRSOC MENDOZA */}
                              <div className="mt-2 bg-slate-950/90 p-2 rounded border border-slate-800 text-[9px] text-slate-300 space-y-1">
                                <div className="font-extrabold text-[9px] text-amber-500 uppercase tracking-wider flex items-center gap-1">
                                  <span>📋 Dictamen de Ingeniería (Mendoza CIRSOC):</span>
                                </div>
                                <div className="space-y-1.5 text-[8.5px] leading-relaxed text-slate-400">
                                  {/* Recomendación según Column Type */}
                                  <div className="flex items-start gap-1">
                                    <span className="text-cyan-400 font-mono">▸</span>
                                    <span>
                                      {colType === 'lattice_antenna' ? (
                                        <>Soporte <strong>Torre Reticulada</strong>: Excelente distribución de esfuerzos torsionales y baja carga de viento propia. Apto para ráfagas severas en Alta Montaña.</>
                                      ) : colType === 'ipn' ? (
                                        <>Perfil <strong>IPN Doble T</strong>: Elevada inercia flexional. Asegure la perpendicularidad de las alas principales frente al plano del cartel para mitigar flexotorsión.</>
                                      ) : (
                                        <>Pilares de <strong>{config.columnProfile === 'tubing_3_1_2' ? 'Tubing 3 1/2"' : 'Tubing 2 7/8"'} (Petróleo)</strong>: Acero de alta elasticidad. Los manguitos (casing) en la base absorben la fatiga cíclica en la unión con la platea.</>
                                      )}
                                    </span>
                                  </div>

                                  {/* Recomendación según Bracing / Cuadrícula */}
                                  <div className="flex items-start gap-1">
                                    <span className="text-violet-400 font-mono">▸</span>
                                    <span>
                                      {config.gridPattern === 'diagonal_cross' ? (
                                        <>Entramado en <strong>Cruz de San Andrés</strong>: Rigidez óptima ante esfuerzos cortantes alternantes provocados por succión trasera del viento Zonda.</>
                                      ) : config.gridPattern === 'v_bracing' ? (
                                        <>Arriostramiento en <strong>V Invertida</strong>: Minimiza la deflexión local en chapas, impidiendo el efecto de flameo de perfiles frontales.</>
                                      ) : (
                                        <>⚠️ Se aconseja cambiar a <strong>Cruz de San Andrés / V</strong> para evitar deformaciones permanentes del esqueleto interno.</>
                                      )}
                                    </span>
                                  </div>

                                  {/* Validación según área y velocidad */}
                                  <div className="flex items-start gap-1 border-t border-slate-900 pt-1">
                                    <span className="text-rose-400 font-mono">▸</span>
                                    <span>
                                      {area > 12 ? (
                                        <><span className="text-rose-400 font-bold uppercase">Riesgo Escala:</span> Formato grande ({area.toFixed(1)} m²). Exige coeficiente de seguridad &gt; <strong>1.50</strong> y base profunda con Hormigón <strong>H25</strong>.</>
                                      ) : (
                                        <>Formato compacto ({area.toFixed(1)} m²). Baja resistencia de arrastre. Coeficiente de seguridad aconsejable: &gt; 1.20.</>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    
                    {/* Category A: Dimensiones Generales del Cartel */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-bold text-cyan-400 tracking-wider block uppercase border-l-2 border-cyan-500 pl-2">1. Geometría y Alturas</span>
                      
                      {/* Width and Height in CM */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Ancho (cm):</label>
                          <input
                            type="number"
                            value={config.width}
                            min="300"
                            max="1500"
                            step="50"
                            onChange={(e) => updateConfig('width', Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Altura (cm):</label>
                          <input
                            type="number"
                            value={config.height}
                            min="150"
                            max="600"
                            step="50"
                            onChange={(e) => updateConfig('height', Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Ground clearance Height */}
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Altura Libre del Suelo (cm):</label>
                        <input
                          type="number"
                          value={config.clearanceHeight}
                          min="200"
                          max="800"
                          step="50"
                          onChange={(e) => updateConfig('clearanceHeight', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Category B: Perfiles de Materiales */}
                    <div className="space-y-3 pt-2">
                      <span className="text-[10px] font-bold text-violet-400 tracking-wider block uppercase border-l-2 border-violet-500 pl-2">2. Especificación de Perfiles</span>

                      {/* Marco profile dropdown */}
                      <div className={selectedComponent === 'marco' ? 'ring-1 ring-orange-500 p-1.5 rounded bg-orange-600/5' : ''}>
                        <label className="block text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                          <span>Perfil Marco Perimetral:</span>
                          <span className="text-[9px] text-slate-500 font-mono">Solicitado: 50x50x2</span>
                        </label>
                        <select
                          value={config.marcoProfile}
                          onChange={(e) => updateConfig('marcoProfile', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 cursor-pointer focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                        >
                          {PROFILE_DETAILS.marco.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
   
                       {/* Esqueleto interior grid count & profile */}
                       <div className={selectedComponent === 'skeleton' ? 'ring-1 ring-orange-500 p-2 rounded bg-orange-600/5 space-y-3' : 'space-y-3'}>
                         <div>
                           <label className="block text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                             <span>Perfil Cuadrícula Esqueleto:</span>
                             <span className="text-[9px] text-slate-500 font-mono">Solicitado: 40x40x2</span>
                           </label>
                           <select
                             value={config.skeletonProfile}
                             onChange={(e) => updateConfig('skeletonProfile', e.target.value)}
                             className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 cursor-pointer focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                           >
                             {PROFILE_DETAILS.skeleton.map(o => (
                               <option key={o.value} value={o.value}>{o.label}</option>
                             ))}
                           </select>
                         </div>
                         
                         {/* Grid internal counts (Rows and Cols without frame) */}
                         <div className="grid grid-cols-2 gap-2">
                           <div>
                             <label className="block text-[9.5px] text-slate-400 font-medium">Caños Horiz. (sin marco):</label>
                             <input
                               type="number"
                               value={config.gridRows - 2}
                               min="0"
                               max="12"
                               onChange={(e) => updateConfig('gridRows', Math.max(0, Number(e.target.value)) + 2)}
                               className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-cyan-500 text-slate-200"
                             />
                             <p className="text-[8.5px] text-slate-500 mt-0.5">({config.gridRows - 2} internos + 2 marco = {config.gridRows} totales)</p>
                           </div>
                           <div>
                             <label className="block text-[9.5px] text-slate-400 font-medium">Caños Vert. (sin marco):</label>
                             <input
                               type="number"
                               value={config.gridCols - 2}
                               min="0"
                               max="12"
                               onChange={(e) => updateConfig('gridCols', Math.max(0, Number(e.target.value)) + 2)}
                               className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-cyan-500 text-slate-200"
                             />
                             <p className="text-[8.5px] text-slate-500 mt-0.5">({config.gridCols - 2} internos + 2 marco = {config.gridCols} totales)</p>
                           </div>
                         </div>
   
                         {/* Wind structural grid spacing template options grouped under Esqueleto */}
                         <div className="pt-1.5 border-t border-slate-800/40">
                           <label className="block text-[10px] text-slate-400 mb-1 font-semibold uppercase tracking-wider">Diseño Esqueleto Bracing:</label>
                           <div className="grid grid-cols-3 gap-1">
                             {[
                               { val: 'standard', label: 'Estándar' },
                               { val: 'double_reinforcement', label: 'Doble' },
                               { val: 'diagonal_cross', label: 'San Andrés' }
                             ].map((p) => (
                               <button
                                 key={p.val}
                                 type="button"
                                 onClick={() => updateConfig('gridPattern', p.val)}
                                 className={`py-1 px-1.5 text-center rounded text-[9px] border font-bold truncate cursor-pointer ${
                                   config.gridPattern === p.val
                                     ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                                     : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                 }`}
                               >
                                 {p.label}
                               </button>
                             ))}
                           </div>
                         </div>

                  </div>
                       {/* Chapa Coverage properties */}
                      <div className={selectedComponent === 'chapa' ? 'ring-1 ring-orange-500 p-1.5 rounded bg-orange-600/5' : ''}>
                        <label className="block text-[11px] text-slate-400 mb-1">Revestimiento Chapa Frontal:</label>
                        <select
                          value={config.chapaProfile}
                          onChange={(e) => updateConfig('chapaProfile', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 cursor-pointer focus:outline-none"
                        >
                          {PROFILE_DETAILS.chapa.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>

                        <div className="mt-1.5">
                          <label className="block text-[9.5px] text-slate-500 mb-0.5">Tamaño de Placa Chapa:</label>
                          <select
                            value={config.chapaSheetSize}
                            onChange={(e) => updateConfig('chapaSheetSize', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 cursor-pointer"
                          >
                            <option value="1.0x2.0">Placa Estándar Siderchap (1.00m x 2.00m)</option>
                            <option value="1.22x2.44">Placa Mayor Maldonado (1.22m x 2.44m)</option>
                          </select>
                        </div>
                      </div>

                      {/* Columns Postes / Tubing structure variables */}
                      <div className={selectedComponent === 'columns' ? 'ring-1 ring-orange-500 p-1.5 rounded bg-orange-600/5' : ''}>
                        <span className="text-[10px] font-bold text-amber-400 tracking-wider block uppercase border-l-2 border-amber-500 pl-2 mt-4 mb-2">3. Postes y Cimentación</span>
                        
                        <label className="block text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                          <span>Perfil de Soporte principal:</span>
                          <span className="text-[9px] text-slate-500 font-mono">6 caños Tubing 2 7/8&quot;</span>
                        </label>
                        <select
                          value={config.columnProfile}
                          onChange={(e) => updateConfig('columnProfile', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 cursor-pointer focus:outline-none"
                        >
                          {PROFILE_DETAILS.columns.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>

                        <div className="grid grid-cols-3 gap-1.5 mt-2">
                          <div>
                            <label className="block text-[9px] text-slate-500 font-medium whitespace-nowrap">Cant. Postes:</label>
                            <input
                              type="number"
                              value={config.columnCount}
                              min="2"
                              max="10"
                              onChange={(e) => updateConfig('columnCount', Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-slate-500 font-medium whitespace-nowrap">Enterrado (cm):</label>
                            <input
                              type="number"
                              value={config.columnBuriedDepth}
                              min="50"
                              max="450"
                              step="10"
                              onChange={(e) => updateConfig('columnBuriedDepth', Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-slate-500 font-medium whitespace-nowrap">Inserto (cm):</label>
                            <input
                              type="number"
                              value={config.columnInsertHeight !== undefined ? config.columnInsertHeight : 150}
                              min="50"
                              max="300"
                              step="10"
                              onChange={(e) => updateConfig('columnInsertHeight', Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Anchor Diameter & Base blocks */}
                      <div className={selectedComponent === 'foundation' || selectedComponent === 'anchors' ? 'ring-1 ring-orange-500 p-1.5 rounded bg-orange-600/5' : ''}>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <label className="block text-[9.5px] text-slate-500">Hormigón Base:</label>
                            <select
                              value={config.foundationConcreteGrade}
                              onChange={(e) => updateConfig('foundationConcreteGrade', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200"
                            >
                              <option value="H15">H15 (Baja)</option>
                              <option value="H21">H21 (Normativo)</option>
                              <option value="H25">H25 (Fuerte)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9.5px] text-slate-500">Ancho Base (cm):</label>
                            <input
                              type="number"
                              value={config.foundationWidth}
                              min="50"
                              max="200"
                              step="10"
                              onChange={(e) => updateConfig('foundationWidth', Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs focus:ring-1 text-slate-200"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <label className="block text-[9.5px] text-slate-500">Anclaje Perno Ø:</label>
                            <select
                              value={config.anchorBoltDiameter}
                              onChange={(e) => updateConfig('anchorBoltDiameter', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200"
                            >
                              <option value="5/8">5/8&quot; (Fino)</option>
                              <option value="3/4">3/4&quot; (Solicitado)</option>
                              <option value="7/8">7/8&quot; (Robusto)</option>
                              <option value="1">1&quot; (Extremo)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9.5px] text-slate-500">Espesor Placa (mm):</label>
                            <input
                              type="number"
                              value={config.anchorPlateThickness}
                              min="8"
                              max="32"
                              step="2"
                              onChange={(e) => updateConfig('anchorPlateThickness', Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs focus:ring-1 text-slate-200"
                            />
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>
                </div>

              {/* Reset to initial configuration Button */}
              <div className="pt-4 border-t border-slate-800 mt-4">
                <button
                  onClick={() => setConfig({
                    width: 800,
                    height: 300,
                    clearanceHeight: 300,
                    gridPattern: 'diagonal_cross',
                    gridRows: 6,
                    gridCols: 6,
                    marcoProfile: '60x60x2',
                    skeletonProfile: '40x40x2',
                    chapaProfile: 'chapa_18',
                    chapaSheetSize: '1.0x2.0',
                    columnProfile: 'tubing_3_1_2',
                    columnCount: 6,
                    columnBuriedDepth: 300,
                    columnInsertHeight: 300,
                    windSpeed: 160,
                    foundationWidth: 100,
                    foundationDepth: 300,
                    foundationConcreteGrade: 'H25',
                    anchorBoltDiameter: '7/8',
                    anchorPlateThickness: 12
                  })}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white rounded-xl font-bold transition-all border border-slate-700/60 cursor-pointer"
                >
                  Restablecer Medidas Estándar (8x3m)
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* LOWER SECTION: Technical Blueprints Drafting and Part Details */}
        <div className="space-y-6">
          {/* Dynamic Piece Section Detail & Materials Specification (Replaces Blueprint AutoCAD drawings) */}
          <PieceDetailViewer 
            config={config} 
            selectedComponent3D={selectedComponent} 
            onSelectComponent3D={(comp) => setSelectedComponent(comp)} 
            activeMaterials={activeMaterials}
            baselineMaterials={baselineMaterials}
          />
        </div>

        {/* AI-Powered Budget Extraction & Live Material Cost Balancing */}
        <BudgetManager 
          customSuppliers={customSuppliers}
          setCustomSuppliers={handleSetCustomSuppliers}
          onSupplierActivated={(name) => console.log("Proveedor activado en los cálculos dinámicos:", name)}
          config={config}
        />

      </main>

      {/* Footer copyright */}
      <footer className="mt-16 text-center text-slate-600 text-xs leading-relaxed max-w-xl mx-auto px-4">
        <p>© 2026 Constracad S.A. Mendoza, Argentina. Sistema desarrollado bajo normativa CIRSOC 102 con cotizaciones de distribuidores siderúrgicos certificados en Cuyo.</p>
      </footer>
    </div>
  );
}

function generateQuotationText(config: StructureConfig, items: MaterialItem[]): string {
  const dateStr = new Date().toLocaleDateString('es-AR');
  let text = `SOLICITUD DE COTIZACIÓN DE ADICIONALES/FALTANTES
Fecha: ${dateStr}
Obra: Cartel Mendoza (${(config.width / 100).toFixed(2)}m x ${(config.height / 100).toFixed(2)}m)

Estimado Proveedor Siderometalúrgico,
Le solicito cotización para la provisión de los siguientes materiales adicionales/faltantes según la re-ingeniería de diseño ajustada por Constracad S.A.:

`;

  items.forEach(item => {
    let specLabel = '';
    let detailedDescription = '';

    if (item.id === 'mat_cimentacion') {
      specLabel = `Hormigón Elaborado Estructural Clase H-${config.foundationConcreteGrade.toUpperCase().replace('H', '')}`;
      detailedDescription = `Hormigón elaborado normalizado para el llenado de ${config.columnCount} pozos de cimentación de ${config.foundationWidth}x${config.foundationWidth} cm de sección y ${config.foundationDepth} cm de profundidad.`;
    } else if (item.id === 'mat_anclajes_pernos') {
      specLabel = `Pernos de Anclaje de Alta Resistencia J-Bolt ø 7/8"`;
      detailedDescription = `Pernos de cimentación roscados curvados de 7/8" x 500 mm, grado ASTM A307 / F-24, provistos con tuerca hexagonal pesada de ajuste y arandela Grower de presión.`;
    } else if (item.id === 'mat_anclajes_platinas') {
      const basePlateWidth = Math.round(config.foundationWidth * 0.70 * 10);
      const isLatt = config.columnType === 'lattice_antenna';
      specLabel = isLatt ? `Placas Bases de Acero e:12mm (200x200 mm) para Patas de Torre` : `Platinas de Acero Base de Columnas de Soporte e:12mm`;
      detailedDescription = isLatt
        ? `Placas de chapa lisa de espesor 12 mm (1/2") cortadas a 200x200 mm para soldadura individual de las patas de las torres de celosía.`
        : `Placa base de acero de ${basePlateWidth}x${basePlateWidth} mm de chapa de 12 mm de espesor (1/2"), perforada en las esquinas con ojales de pase para pernos de anclaje.`;
    } else if (item.id === 'mat_anclajes_escuadras') {
      specLabel = `Rigidizadores Triangulares de rigidización de Brida (e:9.5mm / 3/8")`;
      detailedDescription = `Rigidizadores triangulares de 80x160 mm cortados de chapa pesada de 9.5 mm, a soldar perpendicularmente al rededor de los postes de soporte.`;
    } else if (item.id === 'mat_tornillos') {
      specLabel = `Tornillos Autoperforantes 1" c/Arandela Vulcanizada`;
      detailedDescription = `Tornillos autoperforantes de cabeza hexagonal de 1" de largo provistos de arandela vulcanizada de neoprene EPDM para fijación estanca de chapa sobre perfiles.`;
    } else if (item.id === 'mat_electrodos') {
      specLabel = `Electrodos Conarco E6013 Punta Azul (2.5 mm)`;
      detailedDescription = `Aporte de electrodos Conarco de 2.5 mm de diámetro tipo E6013 para soldadura de arco manual continua de alta penetración en perfiles estructurales de chasis.`;
    } else if (item.id === 'mat_pintura') {
      specLabel = `Esmalte Sintético Convertidor de Óxido 3-en-1`;
      detailedDescription = `Acabado de alta protección anticorrosiva 3-en-1 (Fondo + convertidor + esmalte), color negro satinado para durabilidad de cara a la intemperie mendozina con radiación UV extrema.`;
    } else if (item.id === 'mat_marco') {
      specLabel = `Caño Estructural Cuadrado [Marco] de ${config.marcoProfile} mm`;
      detailedDescription = `Barras de acero de 6.0 metros de longitud comercial destinadas al chasis perimetral rigidizador externo del cartel.`;
    } else if (item.id === 'mat_skeleton') {
      specLabel = `Caño Estructural Cuadrado [Esqueleto] de ${config.skeletonProfile} mm`;
      detailedDescription = `Barras de acero de 6.0 metros de longitud destinadas a la grilla y entramado interior rigidizador anti-vibración.`;
    } else if (item.id === 'mat_chapa') {
      specLabel = `Placas de Chapa Lisa para Frente BWG Nº 18`;
      detailedDescription = `Placas lisas de acero galvanizado calibre BWG 18 (1.25 mm de espesor real) de dimensiones ${config.chapaSheetSize === '1.0x2.0' ? '1.00m x 2.00m' : '1.22m x 2.44m'} para revestimiento del plano frontal publicitario.`;
    } else if (item.id === 'mat_postes') {
      const labelColumn = config.columnProfile === 'tubing_2_7_8' ? 'Tubing 2 7/8"' : config.columnProfile === 'tubing_3_1_2' ? 'Tubing 3 1/2"' : 'Caño de acero redondo Ø 114 mm';
      specLabel = `Caño de Acero de Rezago Petrolero [Poste Maestro] ${labelColumn}`;
      const insertHeight = config.columnInsertHeight !== undefined ? config.columnInsertHeight : (config.height / 2);
      detailedDescription = `Postes principales tipo Tubing pesado sin costura para fijación y herraje subterráneo de soporte del cartel, longitud unitaria de corte de ${( (config.clearanceHeight + insertHeight + config.columnBuriedDepth) / 100 ).toFixed(2)} m.`;
    } else {
      specLabel = item.name;
      detailedDescription = item.description;
    }

    text += `• ${specLabel}:
  - Cantidad requerida: ${item.quantity} ${item.unit}
  - Detalle técnico: ${detailedDescription}
`;
  });

  text += `\nLugar de entrega: Mendoza, Argentina. Agradezco incluir cotización detallada de flete, plazos de entrega e indicar si los precios informados incluyen IVA (10.5% / 21%). Quedo a disposición.`;
  return text;
}
