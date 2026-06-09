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
  
  // 4. POSTES (Tubing)
  const postLength = c + 1.5 + buried; // Sube 150 cm sobre base de marco, clearance c, con enterrado de buried.
  let tubingPieceLength = 9.0;
  let tubingPrice = 0;
  let tubingSupplier = '';
  
  const cuencaPresetFallback = presetsToUse.find(s => s.id === 'cuenca_sur') || SUPPLIER_PRESETS[3];
  const chacaritaPresetFallback = presetsToUse.find(s => s.id === 'chacarita') || SUPPLIER_PRESETS[6];

  if (isCleared) {
    tubingPrice = 0;
    tubingSupplier = solimetPreset.name;
    tubingPieceLength = 9.0;
  } else if (config.columnProfile === 'tubing_2_7_8') {
    const res = getMaterialProvider('tubing2_7_8', cuencaPresetFallback);
    tubingPrice = res.price;
    tubingSupplier = res.supplierName;
    tubingPieceLength = Number(res.preset.tubing2_7_8_largo) || 9.0;
  } else if (config.columnProfile === 'tubing_3_1_2') {
    const res = getMaterialProvider('tubing3_1_2' as any, chacaritaPresetFallback);
    tubingPrice = res.price || 90000.00;
    tubingSupplier = res.supplierName;
    tubingPieceLength = Number(res.preset.tubing3_1_2_largo) || 9.0;
  } else {
    const res = getMaterialProvider('tubing2_7_8', cuencaPresetFallback);
    tubingPrice = res.price * 0.85;
    tubingSupplier = res.supplierName;
    tubingPieceLength = Number(res.preset.tubing2_7_8_largo) || 9.0;
  }
  
  let tubesToBuyCount = 0;
  for (let idx = 0; idx < colCount; idx++) {
    tubesToBuyCount += Math.ceil(postLength / tubingPieceLength);
  }
  
  const labelColumnProd = config.columnProfile === 'tubing_2_7_8' ? 'Tubing 2 7/8"'
                        : config.columnProfile === 'tubing_3_1_2' ? 'Tubing 3 1/2"'
                        : 'Caño Estructural Redondo Ø114mm';
                        
  const postesItem: MaterialItem = {
    id: 'mat_postes',
    name: `Caño de Acero Sin Costura ${labelColumnProd} Rezago`,
    category: 'postes',
    quantity: tubesToBuyCount,
    unit: 'u',
    unitPrice: tubingPrice,
    supplier: tubingSupplier,
    totalPrice: tubesToBuyCount * tubingPrice,
    description: `Postes de soporte principal tipo Tubing. Sube 150 cm desde la base del marco del cartel, dejando libre ${(postLength - 1.5 - buried).toFixed(2)} m, más ${buried.toFixed(2)} m en el cimiento. Largo comercial de barra tubing: ${tubingPieceLength.toFixed(1)}m. Largo total por caño requerido de obra: ${postLength.toFixed(2)} metros.`
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
  
  // 5. CIMENTACIÓN (Base de hormigón: mezcla H21)
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
    name: `Hormigón Elaborado ${config.foundationConcreteGrade} Estructural`,
    category: 'cimentacion',
    quantity: Number(totalConcreteVolume.toFixed(2)),
    unit: 'm3',
    unitPrice: bestConcretePrice,
    supplier: 'HORMISERV SRL (Planta Propia)',
    totalPrice: Number((totalConcreteVolume * bestConcretePrice).toFixed(2)),
    description: `Para cimentar los postes. Bases de sección de ${config.foundationWidth}x${config.foundationWidth} cm y profundidad de ${config.foundationDepth} cm. Total de ${colCount} pozos.`
  };
  
  // 6. ANCLAJES (Steel Plates & Pernos de anclaje)
  const boltsCount = colCount * 4;
  const platina560Res = getMaterialProvider('platina560', solimetPreset);
  const platinaEscuadraRes = getMaterialProvider('platinaEscuadra', solimetPreset);
  
  const anchorPlateUnitPrice = isCleared ? 0 : (platina560Res.price || 24820);
  const escuadraPlateUnitPrice = isCleared ? 0 : (platinaEscuadraRes.price || 1460);
  const boltUnitPrice = 5200;
  const totalAnchorBaseCost = anchorPlateUnitPrice + (4 * escuadraPlateUnitPrice) + (4 * boltUnitPrice);
  
  // Prefer framework/chasis supplier for Anchor Kits (has 5% off list price)
  const finalAnchorPrice = isCleared ? 0 : totalAnchorBaseCost * 0.95;
  
  const anchorItem: MaterialItem = {
    id: 'mat_anclajes',
    name: `Kits de Anclaje de Viento (Placa Base de ${config.anchorPlateThickness}mm x 560x560 + 4 Escuadras 80x160 + Perno J-Bolt ${config.anchorBoltDiameter}")`,
    category: 'anclajes',
    quantity: colCount,
    unit: 'u',
    unitPrice: finalAnchorPrice,
    supplier: platina560Res.supplierName,
    totalPrice: colCount * finalAnchorPrice,
    description: `Placas base de acero de 560x560mm soldadas en postes con 4 escuadras triangulares de refuerzo de 80x160mm + ${boltsCount} pernos de cimentación.`
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
  
  return [marcoItem, skeletonItem, chapaItem, postesItem, sujecionItem, cimentacionItem, anchorItem, tornillosItem, electrodosItem, pinturaItem];
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
  const columnDetails = PROFILE_DETAILS.columns.find(col => col.value === config.columnProfile) || PROFILE_DETAILS.columns[0];
  const postLength = c + 1.5 + buried; // Sube exactly 1.5m (150 cm) from bottom frame border
  const sujecionWeightKg = colCount * 2 * 4.5; // 4.5 kg per plate/U-bolt mounting node (12 nodes total)
  const columnsWeightKg = (colCount * postLength * columnDetails.weight) + sujecionWeightKg;
  
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
