import { SupplierPreset, StructureConfig, MaterialItem, EsqueletoPattern } from './types';

export const SUPPLIER_PRESETS: SupplierPreset[] = [
  {
    id: 'saldana',
    name: 'Saldana S.A.',
    city: 'Coquimbito, Mendoza',
    caño50_50_2: 35294.51,
    caño40_40_2: 28192.68,
    caño40_40_25: 32665.43,
    caño60_60_2: 42500.00,
    tubing2_7_8: 142181.20,
    tubing3_1_2: 0,
    chapa18_1x2: 39782.06,
    chapa18_122x244: 59800.00,
    platina560: 25900.00,
    platinaEscuadra: 1520.00,
    electrodo25: 8900.00,
    esmalte4l: 39000.00,
    tornilloHex: 42.00
  },
  {
    id: 'solimet',
    name: 'Solimet de Grupo Camin S.A.',
    city: 'Carrodilla, Luján de Cuyo, Mendoza',
    caño50_50_2: 34144.11,
    caño40_40_2: 27019.61, // Actualized per latest invoice ($27,019.607 net)
    caño40_40_25: 32665.43,
    caño60_60_2: 41037.62, // Actualized per latest invoice ($41,037.622 net)
    tubing2_7_8: 0, // No cotizó Tubing!
    tubing3_1_2: 0,
    chapa18_1x2: 37440.04, // Actualized per latest invoice ($37,440.036 net)
    chapa18_122x244: 56500.00,
    platina560: 24820.00, // Actualized per latest invoice ($24,820.00)
    platinaEscuadra: 1460.00, // Actualized per latest invoice ($1,460.00)
    electrodo25: 8509.79, // Actualized per latest invoice ($8,509.785)
    esmalte4l: 37711.41, // Actualized per latest invoice ($37,711.410)
    tornilloHex: 39.61 // Actualized per latest invoice ($39.613)
  },
  {
    id: 'siderchap',
    name: 'Siderchap S.A.',
    city: 'Guaymallén, Mendoza',
    caño50_50_2: 36781.62,
    caño40_40_2: 29340.44,
    caño40_40_25: 33900.00,
    caño60_60_2: 43900.00,
    tubing2_7_8: 148000.00,
    tubing3_1_2: 0,
    chapa18_1x2: 39847.91,
    chapa18_122x244: 59900.00,
    platina560: 26500.00,
    platinaEscuadra: 1590.00,
    electrodo25: 9200.00,
    esmalte4l: 41000.00,
    tornilloHex: 44.00
  },
  {
    id: 'cuenca_sur',
    name: 'Cuenca del Sur (Especialista Tubing)',
    city: 'Luján de Cuyo, Mendoza',
    caño50_50_2: 35800.00,
    caño40_40_2: 28900.00,
    caño40_40_25: 33100.00,
    caño60_60_2: 42900.00,
    tubing2_7_8: 128900.00, // Quote value for rezago tubing 2 7/8" x 9 metros!
    tubing3_1_2: 0,
    chapa18_1x2: 39000.00,
    chapa18_122x244: 58800.00,
    platina560: 25000.00,
    platinaEscuadra: 1490.00,
    electrodo25: 8700.00,
    esmalte4l: 38500.00,
    tornilloHex: 41.00
  },
  {
    id: 'vhg_petroleros',
    name: 'VHG Insumos y Equipos Petroleros',
    city: 'Maipú, Mendoza',
    caño50_50_2: 36200.00,
    caño40_40_2: 28800.00,
    caño40_40_25: 33400.00,
    caño60_60_2: 43500.00,
    tubing2_7_8: 160000.00, // Quoted 2 7/8" Tubing @ $160.000 (x 9.5m bars)
    tubing3_1_2: 0,
    chapa18_1x2: 39500.00,
    chapa18_122x244: 59300.00,
    platina560: 26000.00,
    platinaEscuadra: 1550.00,
    electrodo25: 9000.00,
    esmalte4l: 40000.00,
    tornilloHex: 43.00
  },
  {
    id: 'tubing_ok',
    name: 'Tubing OK',
    city: 'Godoy Cruz, Mendoza',
    caño50_50_2: 37000.00,
    caño40_40_2: 29500.00,
    caño40_40_25: 34000.00,
    caño60_60_2: 44500.00,
    tubing2_7_8: 0,
    tubing3_1_2: 135000.00, // Quoted 3 1/2" Tubing @ $135.000 (6mm thickness x 9m bars!)
    chapa18_1x2: 41000.00,
    chapa18_122x244: 61500.00,
    platina560: 27000.00,
    platinaEscuadra: 1620.00,
    electrodo25: 9500.00,
    esmalte4l: 42000.00,
    tornilloHex: 45.00
  },
  {
    id: 'chacarita',
    name: 'Chacarita Aceros',
    city: 'Mendoza, Argentina',
    caño50_50_2: 36000.00,
    caño40_40_2: 28500.00,
    caño40_40_25: 33000.00,
    caño60_60_2: 43000.00,
    tubing2_7_8: 0,
    tubing3_1_2: 90000.00, // Promo de Tubing de 3.5" a $10.000 el metro ($90.000 para barra de 9m) - Contacto Iván: +54 9 2615 26-5792
    chapa18_1x2: 39000.00,
    chapa18_122x244: 58500.00,
    platina560: 25500.00,
    platinaEscuadra: 1500.00,
    electrodo25: 8800.00,
    esmalte4l: 39500.00,
    tornilloHex: 40.00
  },
  {
    id: 'proforma_imb',
    name: 'Hierros Maldonado S.A.',
    city: 'Godoy Cruz, Mendoza',
    caño50_50_2: 36458.40,
    caño40_40_2: 29146.69,
    caño40_40_25: 33500.00,
    caño60_60_2: 43800.00,
    tubing2_7_8: 145000.00,
    tubing3_1_2: 0,
    chapa18_1x2: 42989.98,
    chapa18_122x244: 64345.18,
    platina560: 26400.00,
    platinaEscuadra: 1580.00,
    electrodo25: 9100.00,
    esmalte4l: 41500.00,
    tornilloHex: 44.00
  }
];

export const PROFILE_DETAILS = {
  marco: [
    { value: '50x50x2', label: 'C.C. 50x50x2.0 mm (Estándar)', weight: 2.87 }, // kg por metro
    { value: '60x60x2', label: 'C.C. 60x60x2.0 mm (Reforzado)', weight: 3.5 },
    { value: '80x80x3', label: 'C.C. 80x80x3.0 mm (Extremo)', weight: 6.8 }
  ],
  skeleton: [
    { value: '40x40x2', label: 'C.C. 40x40x2.0 mm (Solicitado)', weight: 2.25 },
    { value: '30x30x2', label: 'C.C. 30x30x2.0 mm (Liviano)', weight: 1.63 }
  ],
  columns: [
    { value: 'tubing_2_7_8', label: 'Tubing 2 7/8" (OD 73 mm - Pesado)', weight: 9.67 }, // 6.5 lb/ft = 9.67 kg/m
    { value: 'tubing_3_1_2', label: 'Tubing 3 1/2" (OD 89 mm - Muy robusto)', weight: 13.7 },
    { value: 'column_114', label: 'Caño Redondo 114 mm x 3.2 mm', weight: 8.75 }
  ],
  chapa: [
    { value: 'chapa_18', label: 'Chapa BWG Nº 18 (1.25 mm)', weight: 10.0 }, // kg/m2
    { value: 'chapa_20', label: 'Chapa BWG Nº 20 (0.90 mm)', weight: 7.2 },
    { value: 'chapa_22', label: 'Chapa BWG Nº 22 (0.70 mm)', weight: 5.6 }
  ]
};

// Computes the materials list based on architectural definitions, automatically selecting the cheapest supplier per item
export function calculateMaterials(config: StructureConfig, customSuppliers?: SupplierPreset[]): MaterialItem[] {
  // Dimensions in meters
  const w = config.width / 100;
  const h = config.height / 100;
  const c = config.clearanceHeight / 100;
  const colCount = config.columnCount;
  const buried = config.columnBuriedDepth / 100;
  
  let presetsToUse = customSuppliers;
  const isDataCleared = typeof window !== 'undefined' && localStorage.getItem('billboard_data_cleared') === 'true';
  
  if (!presetsToUse || (presetsToUse.length === 0 && !isDataCleared)) {
    presetsToUse = SUPPLIER_PRESETS;
  }
  
  // If we have an empty list and data IS cleared, use a zero-filled fallback preset
  if (presetsToUse.length === 0) {
    presetsToUse = [{
      id: 'vacio',
      name: 'Sin Proveedor (Cargar Cotización)',
      city: 'Mendoza',
      caño50_50_2: 0,
      caño40_40_2: 0,
      caño40_40_25: 0,
      caño60_60_2: 0,
      tubing2_7_8: 0,
      tubing3_1_2: 0,
      chapa18_1x2: 0,
      chapa18_122x244: 0,
      platina560: 0,
      platinaEscuadra: 0,
      electrodo25: 0,
      esmalte4l: 0,
      tornilloHex: 0
    }];
  }

  const isCleared = presetsToUse[0]?.id === 'vacio';
  
  // Find Solimet preset
  const solimetPreset = presetsToUse.find(s => s.id === 'solimet') || presetsToUse[1] || (isCleared ? presetsToUse[0] : SUPPLIER_PRESETS[1]);
  
  // Helper to obtain the price and supplier name for a specific material key.
  // It handles both single-supplier evaluation (e.g. matrix totals)
  // and multi-supplier evaluation (finding the cheapest among active suppliers).
  const getMaterialProvider = (
    key: keyof SupplierPreset, 
    fallbackPreset: SupplierPreset
  ): { price: number; supplierName: string; preset: SupplierPreset } => {
    // If we only have ONE supplier to evaluate, use it exclusively
    if (presetsToUse!.length === 1) {
      const p = presetsToUse![0];
      const val = Number(p[key]);
      return { 
        price: val && val > 0 ? val : (Number(fallbackPreset[key]) || 0), 
        supplierName: p.name, 
        preset: p 
      };
    }
    
    // Otherwise, find the CHEAPEST active supplier who actually quotes this material
    let bestPreset = fallbackPreset;
    let bestPrice = Number(fallbackPreset[key]) || Infinity;
    
    for (const p of presetsToUse!) {
      const val = Number(p[key]);
      if (val && val > 0 && val < bestPrice) {
        bestPrice = val;
        bestPreset = p;
      }
    }
    
    return {
      price: bestPrice === Infinity ? 0 : bestPrice,
      supplierName: bestPreset.name,
      preset: bestPreset
    };
  };

  // 1. MARCO (50x50x2 default, but can be scaled or adjusted)
  const mRows = 2;
  const mCols = 2;
  const perimeter = (mRows * w) + (mCols * h);
  
  let bestMarcoPrice = 0;
  let bestMarcoSupplierName = '';
  let marcoBarLength = 6.0;
  let marcoBarsCountNeeded = 0;

  if (config.marcoProfile === '60x60x2') {
    const frame60Res = getMaterialProvider('caño60_60_2', solimetPreset);
    bestMarcoPrice = isCleared ? 0 : frame60Res.price;
    bestMarcoSupplierName = frame60Res.supplierName;
    marcoBarLength = Number(frame60Res.preset.caño60_60_2_largo) || 6.0;
    marcoBarsCountNeeded = Math.ceil(perimeter / marcoBarLength);
  } else if (config.marcoProfile === '80x80x3') {
    const frame50Res = getMaterialProvider('caño50_50_2', solimetPreset);
    bestMarcoPrice = isCleared ? 0 : frame50Res.price * 2.2;
    bestMarcoSupplierName = frame50Res.supplierName;
    marcoBarLength = Number(frame50Res.preset.caño50_50_2_largo) || 6.0;
    marcoBarsCountNeeded = Math.ceil(perimeter / marcoBarLength);
  } else {
    const frame50Res = getMaterialProvider('caño50_50_2', solimetPreset);
    bestMarcoPrice = isCleared ? 0 : frame50Res.price;
    bestMarcoSupplierName = frame50Res.supplierName;
    marcoBarLength = Number(frame50Res.preset.caño50_50_2_largo) || 6.0;
    marcoBarsCountNeeded = Math.ceil(perimeter / marcoBarLength);
  }

  const marcoItem: MaterialItem = {
    id: 'mat_marco',
    name: `Caño Estructural Cuadrado ${config.marcoProfile} mm`,
    category: 'marco',
    quantity: marcoBarsCountNeeded,
    unit: 'u',
    unitPrice: bestMarcoPrice,
    supplier: bestMarcoSupplierName,
    totalPrice: marcoBarsCountNeeded * bestMarcoPrice,
    description: `Para el marco perimetral exterior del cartel (${mRows} perfiles horizontales de ${w.toFixed(2)}m + ${mCols} perfiles verticales de ${h.toFixed(2)}m = ${perimeter.toFixed(2)}m totales). Largo de barra: ${marcoBarLength.toFixed(1)} metros.`
  };
  
  // 2. ESQUELETO / CUADRÍCULA (40x40x2 default)
  const rows = Math.max(0, config.gridRows - 2); 
  const cols = Math.max(0, config.gridCols - 2);
  let skeletonLeters = 0;
  
  if (config.gridPattern === 'standard' || config.gridPattern === 'double_reinforcement') {
    skeletonLeters = (cols * h) + (rows * w);
    if (config.gridPattern === 'double_reinforcement') {
      skeletonLeters += (cols * h * 0.4);
    }
  } else if (config.gridPattern === 'diagonal_cross') {
    const baseGrid = (cols * h) + (rows * w);
    const quadW = w / (cols + 1);
    const quadH = h / (rows + 1);
    const quadDiag = Math.sqrt(quadW * quadW + quadH * quadH);
    const diagCount = (cols + 1) * (rows + 1);
    const diagonals = diagCount * quadDiag;
    skeletonLeters = baseGrid + diagonals;
  } else if (config.gridPattern === 'v_bracing') {
    const baseGrid = (cols * h) + (rows * w);
    const quadW = w / (cols + 1);
    const quadH = h / (rows + 1);
    const diagL = Math.sqrt((quadW/2)*(quadW/2) + quadH*quadH);
    const diagonals = 2 * (cols + 1) * (rows + 1) * diagL;
    skeletonLeters = baseGrid + diagonals;
  } else if (config.gridPattern === 'horizontal_trusses') {
    skeletonLeters = (cols * h) + (rows * w) * 1.5;
  }
  
  let bestSkeletonPrice = 0;
  let bestSkeletonSupplierName = '';
  let skeletonBarLength = 6.0;

  if (!isCleared) {
    if (config.skeletonProfile === '40x40x2.5') {
      const res = getMaterialProvider('caño40_40_25', solimetPreset);
      bestSkeletonPrice = res.price;
      bestSkeletonSupplierName = res.supplierName;
      skeletonBarLength = Number(res.preset.caño40_40_25_largo) || 6.0;
    } else if (config.skeletonProfile === '30x30x2') {
      const res = getMaterialProvider('caño40_40_2', solimetPreset);
      bestSkeletonPrice = res.price * 0.72;
      bestSkeletonSupplierName = res.supplierName;
      skeletonBarLength = Number(res.preset.caño40_40_2_largo) || 6.0;
    } else {
      const res = getMaterialProvider('caño40_40_2', solimetPreset);
      bestSkeletonPrice = res.price;
      bestSkeletonSupplierName = res.supplierName;
      skeletonBarLength = Number(res.preset.caño40_40_2_largo) || 6.0;
    }
  } else {
    bestSkeletonSupplierName = solimetPreset.name;
  }
  const skeletonBarsCountNeeded = Math.ceil(skeletonLeters / skeletonBarLength);
  
  const skeletonItem: MaterialItem = {
    id: 'mat_skeleton',
    name: `Caño Estructural Cuadrado ${config.skeletonProfile} mm`,
    category: 'skeleton',
    quantity: skeletonBarsCountNeeded,
    unit: 'u',
    unitPrice: bestSkeletonPrice,
    supplier: bestSkeletonSupplierName,
    totalPrice: skeletonBarsCountNeeded * bestSkeletonPrice,
    description: `Para la cuadrícula estructural del esqueleto interno. Total metros lineales ideal: ${skeletonLeters.toFixed(1)}m. Largo de barra: ${skeletonBarLength.toFixed(1)}m.`
  };
  
  // 3. CHAPAS (N-18 Galvanized default covering 24m2)
  const signArea = w * h;
  let sheetsCount = 0;
  let sheetName = '';
  
  if (config.chapaSheetSize === '1.0x2.0') {
    const singleSheetArea = 2.0;
    sheetsCount = Math.ceil((signArea * 1.08) / singleSheetArea);
    sheetName = `Placas Chapa Lisa BWG Nº ${config.chapaProfile.split('_')[1]} (1.00 x 2.00 mts)`;
  } else {
    const singleSheetArea = 2.977;
    sheetsCount = Math.ceil((signArea * 1.08) / singleSheetArea);
    sheetName = `Placas Chapa Lisa BWG Nº ${config.chapaProfile.split('_')[1]} (1.22 x 2.44 mts)`;
  }
  
  let bestChapaPrice = 0;
  let bestChapaSupplierName = '';
  
  if (!isCleared) {
    if (config.chapaSheetSize === '1.0x2.0') {
      const res = getMaterialProvider('chapa18_1x2', solimetPreset);
      bestChapaSupplierName = res.supplierName;
      bestChapaPrice = (config.chapaProfile === 'chapa_18') ? res.price
         : (config.chapaProfile === 'chapa_20') ? res.price * 0.75 : res.price * 0.65;
    } else {
      const res = getMaterialProvider('chapa18_122x244', solimetPreset);
      bestChapaSupplierName = res.supplierName;
      bestChapaPrice = (config.chapaProfile === 'chapa_18') ? res.price
         : (config.chapaProfile === 'chapa_20') ? res.price * 0.75 : res.price * 0.65;
    }
  } else {
    bestChapaSupplierName = solimetPreset.name;
  }
  
  const chapaItem: MaterialItem = {
    id: 'mat_chapa',
    name: sheetName,
    category: 'chapa',
    quantity: sheetsCount,
    unit: 'u',
    unitPrice: bestChapaPrice,
    supplier: bestChapaSupplierName,
    totalPrice: sheetsCount * bestChapaPrice,
    description: `Chapa de revestimiento frontal para cubrir los ${signArea.toFixed(1)} m² de cartelera publicitaria.`
  };
  
  // 4. POSTES (Tubing / Round / Lattice / IPN)
  const insertM = (config.columnInsertHeight !== undefined ? config.columnInsertHeight : 150) / 100;
  const postLength = c + insertM + buried; // Sube insertM sobre base de marco, clearance c, con enterrado de buried.
  let tubingPieceLength = 9.0;
  let tubingPrice = 0;
  let tubingSupplier = '';
  let labelColumnProd = '';
  
  const cuencaPresetFallback = presetsToUse.find(s => s.id === 'cuenca_sur') || SUPPLIER_PRESETS[3];
  const chacaritaPresetFallback = presetsToUse.find(s => s.id === 'chacarita') || SUPPLIER_PRESETS[6];
  const activeColType = config.columnType || 'tubing';

  if (isCleared) {
    tubingPrice = 0;
    tubingSupplier = solimetPreset.name;
    tubingPieceLength = 9.0;
    labelColumnProd = 'Caño Tubing';
  } else if (activeColType === 'lattice_antenna') {
    // Lattice tower module from Taller Mendoza
    tubingPrice = 168000;
    tubingSupplier = 'TALLER MENDOZA: DESPIECE CAD';
    tubingPieceLength = 6.0;
    labelColumnProd = 'Torre Reticulada Antena Corrugada (Módulo 6m)';
  } else if (activeColType === 'ipn') {
    // IPN 120 structural steel I-beam
    tubingPrice = 145000;
    tubingSupplier = chacaritaPresetFallback.name;
    tubingPieceLength = 6.0;
    labelColumnProd = 'Perfil de Acero Doble T (IPN 120)';
  } else if (activeColType === 'round_pipe') {
    // Heavy duty steel pipe
    tubingPrice = 108000;
    tubingSupplier = solimetPreset.name;
    tubingPieceLength = 6.0;
    labelColumnProd = 'Caño Redondo Estructural con Costura Ø114mm';
  } else {
    // Classic oil tubing scrap
    if (config.columnProfile === 'tubing_3_1_2') {
      const res = getMaterialProvider('tubing3_1_2' as any, chacaritaPresetFallback);
      tubingPrice = res.price || 90000.00;
      tubingSupplier = res.supplierName;
      tubingPieceLength = Number(res.preset.tubing3_1_2_largo) || 9.0;
      labelColumnProd = 'Caño Tubing Petrolero Rezago 3 1/2"';
    } else {
      const res = getMaterialProvider('tubing2_7_8', cuencaPresetFallback);
      tubingPrice = res.price;
      tubingSupplier = res.supplierName;
      tubingPieceLength = Number(res.preset.tubing2_7_8_largo) || 9.0;
      labelColumnProd = 'Caño Tubing Petrolero Rezago 2 7/8"';
    }
  }
  
  let tubesToBuyCount = 0;
  for (let idx = 0; idx < colCount; idx++) {
    tubesToBuyCount += Math.ceil(postLength / tubingPieceLength);
  }
  
  const angleBarsQty = Math.ceil((4 * postLength * colCount) / 6.0);
  const roundBarsQty = Math.ceil((6.5 * postLength * colCount) / 6.0);
                        
  const postesItem: MaterialItem = {
    id: 'mat_postes',
    name: activeColType === 'lattice_antenna' ? `Perfiles de Acero Ángulo L 1 1/2" x 1/8" x 6m (Cordones para Torres Celosía)` : `${labelColumnProd}`,
    category: 'postes',
    quantity: activeColType === 'lattice_antenna' ? angleBarsQty : tubesToBuyCount,
    unit: 'u',
    unitPrice: activeColType === 'lattice_antenna' ? (isCleared ? 0 : 34800) : tubingPrice,
    supplier: activeColType === 'lattice_antenna' ? 'TALLER MENDOZA: ACEROS GENERALES' : tubingSupplier,
    totalPrice: (activeColType === 'lattice_antenna' ? angleBarsQty : tubesToBuyCount) * (activeColType === 'lattice_antenna' ? (isCleared ? 0 : 34800) : tubingPrice),
    description: activeColType === 'lattice_antenna'
      ? `Perfiles de hierro ángulo laminados en caliente para las 4 patas (cordones principales) de las columnas reticuladas. Total de metros requeridos: ${(postLength * 4 * colCount).toFixed(1)}m para las ${colCount} columnas.`
      : `Postes de soporte de obra tipo ${labelColumnProd}. Sube ${Math.round(insertM * 100)} cm desde la base del marco del cartel, dejando libre ${(postLength - insertM - buried).toFixed(2)} m, más ${buried.toFixed(2)} m en el cimiento. Largo de barra comercial: ${tubingPieceLength.toFixed(1)}m. Largo total de corte por poste: ${postLength.toFixed(2)} metros.`
  };

  // 4b. LOGICA DE SUJECIÓN Y MONTAJE (Placas de Vinculación y Enganches de Tubing a la Grilla)
  const sujecionCount = colCount * 2; // Dual-node clamp connection per support pillar
  const sujecionUnitPrice = isCleared ? 0 : 18500; // Price for 1 heavy bracket clamp + plate kit from Solimet
  
  const sujecionItem: MaterialItem = {
    id: 'mat_sujecion',
    name: `Kits de Sujeción y Montaje de Doble Placa (Postes a Marco/Cuadrícula)`,
    category: 'postes',
    quantity: sujecionCount,
    unit: 'u',
    unitPrice: sujecionUnitPrice,
    supplier: bestMarcoSupplierName, // Use the selected framework/chasis supplier to supply connection parts!
    totalPrice: sujecionCount * sujecionUnitPrice,
    description: `Abrazaderas pesadas de media caña plegadas a medida en chapa de 1/4" + de acople U-Bolt de 1/2" roscadas con tuercas dobles para vincular solidariamente cada poste Tubing con el marco de 60x60mm y costillas horizontales de 40x40mm de la cuadrícula.`
  };
  
  // 5. CIMENTACIÓN (Base de hormigón: mezcla H21/H25)
  const footingW = config.foundationWidth / 100;
  const footingD = config.foundationDepth / 100;
  const footingVol = footingW * footingW * footingD;
  const totalConcreteVolume = colCount * footingVol;
  
  const concreteBaseCostPerM3Map = {
    'H15': 88000,
    'H21': 96000,
    'H25': 108000,
  };
  
  // Use Planta Propia - HORMISERV SRL as concrete supplier as requested
  const bestConcretePrice = isCleared ? 0 : concreteBaseCostPerM3Map[config.foundationConcreteGrade];
  
  const cimentacionItem: MaterialItem = {
    id: 'mat_cimentacion',
    name: `Hormigón Elaborado ${config.foundationConcreteGrade === 'H25' ? 'H-H25' : config.foundationConcreteGrade} Estructural`,
    category: 'cimentacion',
    quantity: Number(totalConcreteVolume.toFixed(2)),
    unit: 'm3',
    unitPrice: bestConcretePrice,
    supplier: 'HORMISERV SRL (Planta Propia)',
    totalPrice: Number((totalConcreteVolume * bestConcretePrice).toFixed(2)),
    description: `Dosificación de hormigón requerida para verter en pozos de cimentación para los postes de soporte. Cada pozo de fuste requiere sección de ${config.foundationWidth}x${config.foundationWidth} cm y profundidad de ${config.foundationDepth} cm. Cantidad exacta y necesaria calculada para los ${colCount} postes totales: ${Number(totalConcreteVolume.toFixed(2))} m³.`
  };
  
  // 6. ANCLAJES (Steel Plates & Pernos de anclaje)
  const isLattice = activeColType === 'lattice_antenna';
  const boltsCount = isLattice ? (colCount * 16) : (colCount * 4);
  const platinasCount = isLattice ? (colCount * 4) : colCount;
  const escuadrasCount = isLattice ? (colCount * 16) : (colCount * 4);

  const platina560Res = getMaterialProvider('platina560', solimetPreset);
  const platinaEscuadraRes = getMaterialProvider('platinaEscuadra', solimetPreset);
  
  const anchorPlateUnitPrice = isCleared ? 0 : (platina560Res.price || 24820);
  const escuadraPlateUnitPrice = isCleared ? 0 : (platinaEscuadraRes.price || 1460);
  const boltUnitPrice = 5200;

  const pernosItem: MaterialItem = {
    id: 'mat_anclajes_pernos',
    name: `Pernos de Anclaje de Alta Resistencia J-Bolt ø 7/8"`,
    category: 'anclajes',
    quantity: boltsCount,
    unit: 'u',
    unitPrice: boltUnitPrice,
    supplier: platina560Res.supplierName,
    totalPrice: boltsCount * boltUnitPrice,
    description: `Pernos de cimentación roscados curvados tipo J-Bolt de diámetro 7/8" x 500 mm de longitud lineal, fabricados en acero grado ASTM A307 / F-24, con rosca provista de tuerca hexagonal pesada y arandela de presión Grover cada uno.`
  };

  const platinasItem: MaterialItem = {
    id: 'mat_anclajes_platinas',
    name: isLattice 
      ? `Placas Bases de Acero e:12mm (e:12mm, 200x200 mm) para Patas de Torre` 
      : `Platinas de Acero Base de Columnas e:12mm (e:12mm, 560x560 mm)`,
    category: 'anclajes',
    quantity: platinasCount,
    unit: 'u',
    unitPrice: isLattice ? Math.round(anchorPlateUnitPrice * 0.4) : anchorPlateUnitPrice,
    supplier: platina560Res.supplierName,
    totalPrice: platinasCount * (isLattice ? Math.round(anchorPlateUnitPrice * 0.4) : anchorPlateUnitPrice),
    description: isLattice
      ? `Placas bases cuadradas de acero estructural de 200x200 mm cortadas de chapa de 12 mm (1/2") para soldadura individual de las 4 patas principales de cada Torre Celosía.`
      : `Chapas bases cuadradas de acero estructural de 560x560 mm cortadas de chapa de 12 mm (1/2") de espesor, provistas de orificio concéntrico calibrado para insertar el poste de Tubing.`
  };

  const escuadrasItem: MaterialItem = {
    id: 'mat_anclajes_escuadras',
    name: `Rigidizadores Triangulares de rigidización de Brida (e:9.5mm, 80x160 mm)`,
    category: 'anclajes',
    quantity: escuadrasCount,
    unit: 'u',
    unitPrice: escuadraPlateUnitPrice,
    supplier: platinaEscuadraRes.supplierName,
    totalPrice: escuadrasCount * escuadraPlateUnitPrice,
    description: `Rigidizadores triangulares de refuerzo cortados en chapa de 9.5 mm (3/8") de espesor, de 80 mm de base por 160 mm de altura, para soldar perpendicularmente al tubo y platina base.`
  };
  
  // 7. COMPLEMENTOS Y CONSUMIBLES (Tornillos, Electrodos y Pintura)
  const screwsCount = Math.ceil(signArea * 12);
  const screwRes = getMaterialProvider('tornilloHex', solimetPreset);
  const finalScrewsPrice = isCleared ? 0 : (screwRes.price || 65);
  
  const tornillosItem: MaterialItem = {
    id: 'mat_tornillos',
    name: 'Tornillos Autoperforantes Hex c/Arandela Vulcanizada #14 x 1"',
    category: 'chapa',
    quantity: screwsCount,
    unit: 'u',
    unitPrice: finalScrewsPrice,
    supplier: screwRes.supplierName,
    totalPrice: screwsCount * finalScrewsPrice,
    description: `Para fijación de chapas (aprox. 12 tornillos por m²).`
  };
  
  const electrodesWeight = Math.ceil((marcoBarsCountNeeded + skeletonBarsCountNeeded) * 0.5);
  const electrodesRes = getMaterialProvider('electrodo25', solimetPreset);
  const finalElectrodesPrice = isCleared ? 0 : (electrodesRes.price || 7200);
  
  const electrodosItem: MaterialItem = {
    id: 'mat_electrodos',
    name: 'Electrodos Conarco E6013 Punta Azul (2.5 mm)',
    category: 'skeleton',
    quantity: electrodesWeight,
    unit: 'kg',
    unitPrice: finalElectrodesPrice,
    supplier: electrodesRes.supplierName,
    totalPrice: electrodesWeight * finalElectrodesPrice,
    description: `Para la soldadura de unión del marco estructural y cuadrulado.`
  };
  
  const paintLiters = Math.ceil((perimeter + skeletonLeters) * 0.05 + 1);
  const paintRes = getMaterialProvider('esmalte4l', solimetPreset);
  // Latas de 4 Litros, calculamos proporcional por litro
  const finalPaintPrice = isCleared ? 0 : (paintRes.price ? Math.round(paintRes.price / 4) : 8200);
  
  const pinturaItem: MaterialItem = {
    id: 'mat_pintura',
    name: 'Esmalte Sintético + Antióxido 3 en 1 Negro Satinado (Sinteplast)',
    category: 'marco',
    quantity: paintLiters,
    unit: 'Litros',
    unitPrice: finalPaintPrice,
    supplier: paintRes.supplierName,
    totalPrice: paintLiters * finalPaintPrice,
    description: `Para el acabado y protección contra la corrosión de todos los caños de la estructura (valuado proporcional por litro sobre lata de 4L).`
  };
  
  const baseList = [marcoItem, skeletonItem, chapaItem, postesItem, sujecionItem, cimentacionItem, pernosItem, platinasItem, escuadrasItem, tornillosItem, electrodosItem, pinturaItem];
  
  if (activeColType === 'lattice_antenna') {
    const celosiaItem: MaterialItem = {
      id: 'mat_postes_celosia',
      name: `Hierro Redondo Liso Macizo Ø12 mm x 6m (Celosías para Torres Reticuladas)`,
      category: 'postes',
      quantity: roundBarsQty,
      unit: 'u',
      unitPrice: isCleared ? 0 : 18400,
      supplier: 'TALLER MENDOZA: ACEROS GENERALES',
      totalPrice: roundBarsQty * (isCleared ? 0 : 18400),
      description: `Hierro macizo redondo de ø12 mm para la costura transversal en zigzag en las 4 caras de la torre celosía. Total de metros requeridos en obra: ${(postLength * 6.5 * colCount).toFixed(1)}m aproximados.`
    };
    
    // Insert after mat_postes
    const idx = baseList.findIndex(item => item.id === 'mat_postes');
    if (idx !== -1) {
      baseList.splice(idx + 1, 0, celosiaItem);
    }
  }
  
  return baseList;
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export interface StructureWeightResult {
  marcoWeightKg: number;
  skeletonWeightKg: number;
  chapaWeightKg: number;
  columnsWeightKg: number;
  concreteWeightKg: number;
  totalStructureWeightKg: number; // excluding concrete
  totalWeightWithConcreteKg: number;
  footingVolumeM3: number;
  totalConcreteVolumeM3: number;
  skeletonLinearMeters: number;
  perimeterLinearMeters: number;
}

export function calculateStructureWeightAndVols(config: StructureConfig): StructureWeightResult {
  const w = config.width / 100;
  const h = config.height / 100;
  const c = config.clearanceHeight / 100;
  const colCount = config.columnCount;
  const buried = config.columnBuriedDepth / 100;
  
  // Marco Profile Weight
  const mRows = 2;
  const mCols = 2;
  const marcoDetails = PROFILE_DETAILS.marco.find(m => m.value === config.marcoProfile) || PROFILE_DETAILS.marco[0];
  const perimeter = (mRows * w) + (mCols * h);
  const marcoWeightKg = perimeter * marcoDetails.weight;
  
  // Skeleton Profile Weight
  const rows = Math.max(0, config.gridRows - 2); 
  const cols = Math.max(0, config.gridCols - 2);
  let skeletonMeters = 0;
  if (config.gridPattern === 'standard' || config.gridPattern === 'double_reinforcement') {
    skeletonMeters = (cols * h) + (rows * w);
    if (config.gridPattern === 'double_reinforcement') {
      skeletonMeters += (cols * h * 0.4);
    }
  } else if (config.gridPattern === 'diagonal_cross') {
    const baseGrid = (cols * h) + (rows * w);
    const quadW = w / (cols + 1);
    const quadH = h / (rows + 1);
    const quadDiag = Math.sqrt(quadW * quadW + quadH * quadH);
    const diagCount = (cols + 1) * (rows + 1);
    skeletonMeters = baseGrid + (diagCount * quadDiag);
  } else if (config.gridPattern === 'v_bracing') {
    const baseGrid = (cols * h) + (rows * w);
    const quadW = w / (cols + 1);
    const quadH = h / (rows + 1);
    const diagL = Math.sqrt((quadW/2)*(quadW/2) + quadH*quadH);
    const diagonals = 2 * (cols + 1) * (rows + 1) * diagL;
    skeletonMeters = baseGrid + diagonals;
  } else if (config.gridPattern === 'horizontal_trusses') {
    skeletonMeters = (cols * h) + (rows * w) * 1.5;
  }
  const skeletonDetails = PROFILE_DETAILS.skeleton.find(s => s.value === config.skeletonProfile) || PROFILE_DETAILS.skeleton[0];
  const skeletonWeightKg = skeletonMeters * skeletonDetails.weight;
  
  // Chapa Sheet Weight
  const chapaDetails = PROFILE_DETAILS.chapa.find(ch => ch.value === config.chapaProfile) || PROFILE_DETAILS.chapa[0];
  const signArea = w * h;
  const chapaWeightKg = signArea * chapaDetails.weight;
  
  // Columns Weight
  let colWeightPerM = 9.67;
  const activeColType = config.columnType || 'tubing';
  if (activeColType === 'lattice_antenna') {
    colWeightPerM = 12.5; // celosía module average kg per linear meter
  } else if (activeColType === 'ipn') {
    colWeightPerM = 11.1; // IPN 120 (11.1 kg/m)
  } else if (activeColType === 'round_pipe') {
    colWeightPerM = 8.75; // round pipe Ø114 (8.75 kg/m)
  } else {
    const columnDetails = PROFILE_DETAILS.columns.find(col => col.value === config.columnProfile) || PROFILE_DETAILS.columns[0];
    colWeightPerM = columnDetails.weight;
  }
  
  const postLength = c + 1.5 + buried; // Sube exactly 1.5m (150 cm) from bottom frame border
  const sujecionWeightKg = colCount * 2 * 4.5; // 4.5 kg per plate/U-bolt mounting node (12 nodes total)
  const columnsWeightKg = (colCount * postLength * colWeightPerM) + sujecionWeightKg;
  
  // Footing Volumes & Weight
  const footingW = config.foundationWidth / 100;
  const footingD = config.foundationDepth / 100;
  const footingVolumeM3 = footingW * footingW * footingD;
  const totalConcreteVolumeM3 = colCount * footingVolumeM3;
  const concreteWeightKg = totalConcreteVolumeM3 * 2400; // 2400 kg/m3 concrete density
  
  const totalStructureWeightKg = marcoWeightKg + skeletonWeightKg + chapaWeightKg + columnsWeightKg;
  const totalWeightWithConcreteKg = totalStructureWeightKg + concreteWeightKg;
  
  return {
    marcoWeightKg,
    skeletonWeightKg,
    chapaWeightKg,
    columnsWeightKg,
    concreteWeightKg,
    totalStructureWeightKg,
    totalWeightWithConcreteKg,
    footingVolumeM3,
    totalConcreteVolumeM3,
    skeletonLinearMeters: skeletonMeters,
    perimeterLinearMeters: perimeter
  };
}

export interface SafetyPreset {
  id: string;
  name: string;
  tagline: string;
  windSpeed: number;
  config: Partial<StructureConfig>;
}

export const SUGGESTED_SAFETY_PRESETS: SafetyPreset[] = [
  {
    id: 'standard',
    name: 'Estándar Regulado (100 km/h)',
    tagline: 'Ideal para vientos moderados y entornos urbanos resguardados.',
    windSpeed: 100,
    config: {
      columnProfile: 'tubing_2_7_8',
      columnBuriedDepth: 100,
      foundationWidth: 70,
      foundationDepth: 100,
      foundationConcreteGrade: 'H15',
      gridPattern: 'standard',
      marcoProfile: '50x50x2',
      skeletonProfile: '30x30x2'
    }
  },
  {
    id: 'zonda_mendoza',
    name: 'Zonda Mendoza (130 km/h)',
    tagline: 'Cumple exigencias locales con ráfagas secas severas de viento Zonda.',
    windSpeed: 130,
    config: {
      columnProfile: 'tubing_2_7_8',
      columnBuriedDepth: 130,
      foundationWidth: 85,
      foundationDepth: 130,
      foundationConcreteGrade: 'H21',
      gridPattern: 'diagonal_cross',
      marcoProfile: '50x50x2',
      skeletonProfile: '40x40x2'
    }
  },
  {
    id: 'cordillerano_high',
    name: 'Alta Cordillera (160 km/h)',
    tagline: 'Soporte y rigidez máxima para tormentas de alta montaña cordilleranas.',
    windSpeed: 160,
    config: {
      columnProfile: 'tubing_3_1_2',
      columnBuriedDepth: 160,
      foundationWidth: 105,
      foundationDepth: 160,
      foundationConcreteGrade: 'H25',
      gridPattern: 'diagonal_cross',
      marcoProfile: '60x60x2',
      skeletonProfile: '40x40x2'
    }
  },
  {
    id: 'super_solido',
    name: 'Tornado / Campo Abierto (180 km/h)',
    tagline: 'Cimentación extrema y postes ultra reforzados para zonas rurales desprotegidas.',
    windSpeed: 180,
    config: {
      columnProfile: 'tubing_3_1_2',
      columnBuriedDepth: 180,
      foundationWidth: 125,
      foundationDepth: 180,
      foundationConcreteGrade: 'H25',
      gridPattern: 'diagonal_cross',
      marcoProfile: '80x80x3',
      skeletonProfile: '40x40x2'
    }
  }
];
