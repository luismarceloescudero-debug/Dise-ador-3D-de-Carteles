/**
 * Types & Interfaces for Billboard 3D Designer
 */

export type EsqueletoPattern = 'standard' | 'double_reinforcement' | 'diagonal_cross' | 'horizontal_trusses';

export interface StructureConfig {
  width: number; // in cm, e.g., 800
  height: number; // in cm, e.g., 300
  clearanceHeight: number; // in cm, distance from ground to bottom of sign, e.g., 400
  gridPattern: EsqueletoPattern;
  gridRows: number;
  gridCols: number;
  
  // Materials profile
  marcoProfile: string; // "50x50x2" | "60x60x2" | "80x80x3"
  skeletonProfile: string; // "40x40x2" | "40x40x2.5" | "30x30x2"
  chapaProfile: string; // "chapa_18" | "chapa_20" | "chapa_22"
  chapaSheetSize: '1.0x2.0' | '1.22x2.44'; // Sheet dimensions in meters
  columnProfile: string; // "tubing_2_7_8" | "tubing_3_1_2" | "tubing_4"
  columnCount: number; // default 6, as requested (6 tubing caños)
  columnBuriedDepth: number; // in cm, default 100 (1 meter)
  columnInsertHeight?: number; // in cm, default 150 (height the tubing overlaps/inserts into frame)
  windSpeed?: number; // in km/h, default 120 or 160 depending on zone
  
  // Foundation Concrete Blocks
  foundationWidth: number; // in cm, default 80
  foundationDepth: number; // in cm, default 120
  foundationConcreteGrade: 'H15' | 'H21' | 'H25'; // concrete types
  
  // Anchors
  anchorBoltDiameter: string; // "3/4" | "7/8" | "1"
  anchorPlateThickness: number; // in mm, e.g. 12
}

export interface MaterialItem {
  id: string;
  name: string;
  category: 'marco' | 'skeleton' | 'chapa' | 'postes' | 'cimentacion' | 'anclajes';
  quantity: number;
  unit: 'u' | 'm' | 'm3' | 'kg' | 'Litros';
  unitPrice: number;
  supplier: string;
  totalPrice: number;
  description: string;
}

export type SelectedComponent3D = 'none' | 'marco' | 'skeleton' | 'chapa' | 'columns' | 'foundation' | 'anchors';

export interface SupplierPreset {
  id: string;
  name: string;
  city: string;
  caño50_50_2: number; // unit price
  caño40_40_2: number; // unit price
  caño40_40_25: number; // unit price
  caño60_60_2: number; // unit price
  tubing2_7_8: number; // unit price
  tubing3_1_2?: number; // unit price
  chapa18_1x2: number; // unit price
  chapa18_122x244: number; // unit price
  platina560: number; // unit price
  platinaEscuadra: number; // unit price
  electrodo25: number; // unit price
  esmalte4l: number; // unit price
  tornilloHex: number; // unit price
  
  // Custom lengths/largos for calculating bars needed
  caño50_50_2_largo?: number; // length of bar in meters, default: 6
  caño40_40_2_largo?: number; // length of bar in meters, default: 6
  caño40_40_25_largo?: number; // length of bar in meters, default: 6
  caño60_60_2_largo?: number; // length of bar in meters, default: 6
  tubing2_7_8_largo?: number; // length of tubing in meters, default: 9
  tubing3_1_2_largo?: number; // length of tubing in meters, default: 9
}
