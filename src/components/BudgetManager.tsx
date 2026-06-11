import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Edit3, 
  Save, 
  X, 
  Info, 
  Layout, 
  Download, 
  Plus, 
  Trash2, 
  RotateCcw,
  Eye,
  EyeOff,
  Layers,
  Wrench,
  TrendingDown,
  ClipboardCheck
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

  // State to toggle between Support, Billboard, or Unified list views
  const [activeTab, setActiveTab] = useState<'support' | 'billboard' | 'consolidated'>('support');

  // Local persistence of complete manually edited materials
  const [editedMaterials, setEditedMaterials] = useState<Record<string, { 
    name?: string; 
    quantity?: number; 
    unit?: string; 
    details?: string; 
    supplier?: string;
    deleted?: boolean;
  }>>(() => {
    try {
      const stored = localStorage.getItem("constracad_edited_materials");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Local persistence of completely custom added materials
  const [customMaterials, setCustomMaterials] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem("constracad_custom_materials");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // State management for manual editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editQuantity, setEditQuantity] = useState<string>("");
  const [editUnit, setEditUnit] = useState<string>("");
  const [editDetails, setEditDetails] = useState<string>("");
  const [editSupplier, setEditSupplier] = useState<string>("");

  // State to manage the "Add Custom Item" UI
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormName, setAddFormName] = useState("");
  const [addFormCategory, setAddFormCategory] = useState<'marco' | 'skeleton' | 'chapa' | 'postes' | 'cimentacion' | 'anclajes'>('marco');
  const [addFormQty, setAddFormQty] = useState("1");
  const [addFormUnit, setAddFormUnit] = useState<string>("u");
  const [addFormDetails, setAddFormDetails] = useState("");
  const [addFormSupplier, setAddFormSupplier] = useState("");

  const [isCopied, setIsCopied] = useState(false);
  const [htmlTab, setHtmlTab] = useState<'visual' | 'code'>('visual');
  const [croquisViewSupport, setCroquisViewSupport] = useState<'superior' | 'lateral' | 'placa' | 'escuadra'>('superior');
  const [croquisViewBillboard, setCroquisViewBillboard] = useState<'bastidor' | 'estructura' | 'acabado'>('bastidor');
  const [isHtmlCopied, setIsHtmlCopied] = useState(false);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("constracad_edited_materials", JSON.stringify(editedMaterials));
    } catch (e) {
      console.error("No se pudo guardar la planilla de materiales editada:", e);
    }
  }, [editedMaterials]);

  useEffect(() => {
    try {
      localStorage.setItem("constracad_custom_materials", JSON.stringify(customMaterials));
    } catch (e) {
      console.error("No se pudo guardar la planilla de materiales personalizados:", e);
    }
  }, [customMaterials]);

  // Siderurgical reference cover details
  const getDefaultCoverageDetails = (item: MaterialItem) => {
    const totalAreaM2 = ((structureConfig.width / 100) * (structureConfig.height / 100)).toFixed(2);
    const qty = item.quantity;
    
    if (item.id === 'mat_chapa') {
      return `Superficie del frente real del cartel: ${totalAreaM2} m². Cubierto por cómputo nominal con ${qty} chapas de 1.00m x 2.00m (Total cubierto: ${qty * 2}m² para considerar solapes, cortes y desperdicios de taller).`;
    }
    if (item.id === 'mat_marco') {
      const outerPerimeter = (2 * (structureConfig.width / 100) + 2 * (structureConfig.height / 100)).toFixed(2);
      return `Cálculo real de marco exterior: ${outerPerimeter} metros lineales M/R. Equivalente a ${qty} barras comerciales de 6.0m (Total nominal cubierto: ${qty * 6}m).`;
    }
    if (item.id === 'mat_skeleton') {
      const r = Math.max(0, structureConfig.gridRows - 2); 
      const co = Math.max(0, structureConfig.gridCols - 2);
      const gridLen = (co * (structureConfig.height / 100) + r * (structureConfig.width / 100)).toFixed(2);
      return `Cálculo de cuadrícula interior: ${gridLen} metros lineales. Equivalente a ${qty} barras de 6.0m de caño estruct. delgado (Total nominal cubierto: ${qty * 6}m).`;
    }
    if (item.id === 'mat_postes') {
      const colHeightTotal = ((structureConfig.clearanceHeight / 100) + (structureConfig.columnBuriedDepth / 100)) * structureConfig.columnCount;
      return `Cálculo real de postes petroleros: ${colHeightTotal.toFixed(2)} metros lineales para ${structureConfig.columnCount} postes. Material cotizado nominal: ${qty} caños de taller.`;
    }
    if (item.id === 'mat_cimentacion') {
      const cementVol = (structureConfig.columnCount * (structureConfig.foundationWidth/100) * (structureConfig.foundationWidth/100) * (structureConfig.foundationDepth / 100)).toFixed(2);
      return `Cubicación de pozo de zapata: volumen real neto de excavación: ${cementVol} m³ de hormigón elaborado clase H21/H25 sismorresistente.`;
    }
    return item.description || "";
  };

  // Generate baseline procedural calculations
  const baselineMaterialsList = calculateMaterials(structureConfig, customSuppliers);

  // Merge dynamic calculations with user manual edits and deleted state
  const mergedStandardList = baselineMaterialsList.map(item => {
    const edit = editedMaterials[item.id];
    if (edit) {
      return {
        ...item,
        name: edit.name !== undefined ? edit.name : item.name,
        quantity: edit.quantity !== undefined ? edit.quantity : item.quantity,
        unit: edit.unit !== undefined ? edit.unit : item.unit as any,
        description: edit.details !== undefined ? edit.details : item.description,
        supplier: edit.supplier !== undefined ? edit.supplier : item.supplier,
        deleted: !!edit.deleted
      };
    }
    return {
      ...item,
      description: getDefaultCoverageDetails(item),
      deleted: false
    };
  });

  // Append fully custom components added by the user
  const finalUnifiedMaterialsList = [
    ...mergedStandardList,
    ...customMaterials.map(c => ({
      ...c,
      deleted: false,
      isCustom: true
    }))
  ];

  // Group helpers
  const isSupportItem = (item: any) => {
    return (item.category === 'postes' || item.category === 'anclajes') && item.id !== 'mat_cimentacion';
  };

  const isBillboardItem = (item: any) => {
    return (item.category === 'marco' || item.category === 'skeleton' || item.category === 'chapa') && item.id !== 'mat_cimentacion';
  };

  // Filter lists based on active tab (concrete is excluded as it is provided directly by HORMISERV SRL)
  const getRenderableList = () => {
    if (activeTab === 'support') {
      return finalUnifiedMaterialsList.filter(item => isSupportItem(item) && !item.deleted && item.category !== 'cimentacion');
    }
    if (activeTab === 'billboard') {
      return finalUnifiedMaterialsList.filter(item => isBillboardItem(item) && !item.deleted && item.category !== 'cimentacion');
    }
    return finalUnifiedMaterialsList.filter(item => !item.deleted && item.category !== 'cimentacion'); // unified consolidated without concrete
  };

  const getDeletedItemsForTab = () => {
    if (activeTab === 'support') {
      return finalUnifiedMaterialsList.filter(item => isSupportItem(item) && item.deleted && item.category !== 'cimentacion');
    }
    if (activeTab === 'billboard') {
      return finalUnifiedMaterialsList.filter(item => isBillboardItem(item) && item.deleted && item.category !== 'cimentacion');
    }
    return finalUnifiedMaterialsList.filter(item => item.deleted && item.category !== 'cimentacion');
  };

  // Statistics trackers for visual cards
  const activeItems = getRenderableList();
  const deletedItems = getDeletedItemsForTab();
  const customizedCount = Object.keys(editedMaterials).filter(k => {
    const edit = editedMaterials[k];
    return edit.name !== undefined || edit.quantity !== undefined || edit.unit !== undefined || edit.details !== undefined || edit.supplier !== undefined || edit.deleted;
  }).length + customMaterials.length;

  // Global Estimated Steel Weight logic
  const calculateEstimatedWeight = (listToSum: any[]) => {
    let totalWeight = 0;
    listToSum.forEach(item => {
      if (item.deleted) return;
      
      const qty = item.quantity;
      let estWeight = 0;
      
      // Attempt to map category to realistic steel weight
      if (item.category === 'marco') estWeight = qty * 3.1;
      else if (item.category === 'skeleton') estWeight = qty * 2.3;
      else if (item.category === 'chapa') estWeight = qty * 8.5;
      else if (item.category === 'postes') estWeight = qty * 11.5;
      else if (item.category === 'cimentacion') estWeight = qty * 90; // small contribution for steel bars inside
      else estWeight = qty * 0.4;
      
      totalWeight += estWeight;
    });
    return Math.round(totalWeight);
  };

  const currentTabWeight = calculateEstimatedWeight(activeItems);
  const totalGlobalWeight = calculateEstimatedWeight(finalUnifiedMaterialsList.filter(i => !i.deleted));

  // Edit actions handlers
  const handleStartEdit = (item: any) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditQuantity(String(item.quantity));
    setEditUnit(item.unit);
    setEditDetails(item.description || item.details || "");
    setEditSupplier(item.supplier || "");
  };

  const handleSaveEdit = (itemId: string, isCustom?: boolean) => {
    const qtyNum = parseFloat(editQuantity);
    const parsedQty = isNaN(qtyNum) ? 0 : qtyNum;

    if (isCustom) {
      setCustomMaterials(prev => prev.map(c => {
        if (c.id === itemId) {
          return {
            ...c,
            name: editName.trim(),
            quantity: parsedQty,
            unit: editUnit.trim(),
            description: editDetails.trim(),
            supplier: editSupplier.trim()
          };
        }
        return c;
      }));
    } else {
      setEditedMaterials(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          name: editName.trim(),
          quantity: parsedQty,
          unit: editUnit.trim(),
          details: editDetails.trim(),
          supplier: editSupplier.trim()
        }
      }));
    }
    setEditingId(null);
  };

  const handleDeleteItem = (itemId: string, isCustom?: boolean) => {
    if (isCustom) {
      setCustomMaterials(prev => prev.filter(c => c.id !== itemId));
    } else {
      setEditedMaterials(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          deleted: true
        }
      }));
    }
  };

  const handleRestoreItem = (itemId: string) => {
    setEditedMaterials(prev => {
      const updated = { ...prev };
      if (updated[itemId]) {
        updated[itemId] = { ...updated[itemId], deleted: false };
      }
      return updated;
    });
  };

  const handleAddCustomMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormName.trim()) return;

    const newItem = {
      id: `custom_${Date.now()}`,
      name: addFormName.trim(),
      category: addFormCategory,
      quantity: parseFloat(addFormQty) || 1,
      unit: addFormUnit,
      unitPrice: 0,
      supplier: addFormSupplier.trim() || "Proveedor Local",
      totalPrice: 0,
      description: addFormDetails.trim() || "Insumo personalizado agregado en obra."
    };

    setCustomMaterials(prev => [...prev, newItem]);
    
    // Reset Form
    setAddFormName("");
    setAddFormQty("1");
    setAddFormDetails("");
    setAddFormSupplier("");
    setShowAddForm(false);
  };

  const handleResetAllQuotes = () => {
    setEditedMaterials({});
    setCustomMaterials([]);
    localStorage.removeItem("constracad_edited_materials");
    localStorage.removeItem("constracad_custom_materials");
  };

  // Dimensions formatted labels
  const plateThick = structureConfig.anchorPlateThickness || 12;
  const colProfile = structureConfig.columnProfile;
  const isTubing3_5 = colProfile === "tubing_3_1_2";
  const plateSize = isTubing3_5 ? "500 x 500" : "400 x 400";
  const profileLabel = isTubing3_5 ? "Tubing 3 ½\" (ø 88.9 mm)" : "Tubing 2 ⅞\" (ø 73 mm)";
  const concreteVolume = (structureConfig.columnCount * (structureConfig.foundationWidth/100) * (structureConfig.foundationWidth/100) * (structureConfig.foundationDepth / 100)).toFixed(2);
  const concreteGrade = structureConfig.foundationConcreteGrade;

  // HTML TEMPLATE 1: Estructura de anclaje, postes e infraestructura (activeTab = support)
  const htmlSupportTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Pliego de Fabricación: Kit de Anclaje de Viento y Soporte Columnas</title>
</head>
<body style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 20px; line-height: 1.5;">
  <div style="max-width: 650px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);">
    <div style="background: linear-gradient(135deg, #0ea5e9, #0f172a); padding: 24px; border-bottom: 3px solid #0ea5e9;">
      <h2 style="margin: 0; color: #ffffff; font-size: 20px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800;">
        📐 PLIEGO TÉCNICO DE INFRAESTRUCTURA
      </h2>
      <p style="margin: 6px 0 0 0; color: #38bdf8; font-size: 13px; font-weight: 600;">
        Kit de Anclajes, Postes y Elementos de Sub-Estructura (Taller - Planilla A)
      </p>
    </div>
    <div style="padding: 24px;">
      <!-- HORMISERV SRL ABSTRACT BANNER -->
      <div style="background-color: rgba(245, 158, 11, 0.08); border: 1.5px solid #d97706; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 11px; color: #fbbf24; line-height: 1.5;">
        🏗️ <strong>Suministro Autónomo Previsto (HORMISERV SRL):</strong> El hormigón estructural para fundaciones (${concreteVolume} m³) es provisto por planta propia de <strong>HORMISERV SRL</strong>. Se excluye de las cotizaciones comerciales de acero para el taller.
      </div>

      <h3 style="color: #38bdf8; font-size: 15px; border-bottom: 1px solid #1f2937; padding-bottom: 8px; margin-top: 0;">1. Especificaciones de Carga (Zona: Mendoza s/ CIRSOC 102)</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12.5px; text-align: left;">
        <tr style="border-bottom: 1px solid #1f2937;">
          <td style="padding: 8px 0; color: #94a3b8;">Placa Base de Acero:</td>
          <td style="padding: 8px 0; color: #ffffff; font-weight: bold;">e:12mm en Acero Estructural F-24 (${plateSize} mm) s/ plano</td>
        </tr>
        <tr style="border-bottom: 1px solid #1f2937;">
          <td style="padding: 8px 0; color: #94a3b8;">Columnas de Soporte:</td>
          <td style="padding: 8px 0; color: #ffffff; font-weight: bold;">${structureConfig.columnCount} postes de ${profileLabel}</td>
        </tr>
        <tr style="border-bottom: 1px solid #1f2937;">
          <td style="padding: 8px 0; color: #94a3b8;">Hormigón de Excavación:</td>
          <td style="padding: 8px 0; color: #ffffff; font-weight: bold;">Clase ${structureConfig.foundationConcreteGrade} (${structureConfig.foundationWidth}x${structureConfig.foundationWidth}x${structureConfig.foundationDepth} cm) - HORMISERV SRL</td>
        </tr>
      </table>

      <h3 style="color: #38bdf8; font-size: 15px; border-bottom: 1px solid #1f2937; padding-bottom: 8px; margin-top: 24px;">2. Cómputo Métrico de Materiales de Soporte de Viento</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
        <thead>
          <tr style="border-bottom: 2px solid #374151; color: #38bdf8;">
            <th style="padding: 8px;">Insumo</th>
            <th style="padding: 8px; text-align: center;">Cantidad</th>
            <th style="padding: 8px;">Proveedor / Fabricación</th>
          </tr>
        </thead>
        <tbody>
          ${activeItems.map(item => `
            <tr style="border-bottom: 1px solid #1f2937;">
              <td style="padding: 10px 8px; color: #e2e8f0; font-weight: bold;">${item.name}</td>
              <td style="padding: 10px 8px; color: #34d399; font-weight: bold; text-align: center;">${item.quantity} ${item.unit}</td>
              <td style="padding: 10px 8px; color: #94a3b8;">${item.supplier}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <p style="margin-top: 24px; padding: 12px; background-color: #1e293b; border-left: 4px solid #f59e0b; font-size: 11px; color: #cbd5e1; border-radius: 4px;">
        ⚠️ <strong>Guía de Tolerancia de Taller:</strong> Los agujeros pasantes para J-Bolts de anclaje se deben punzonar a un diámetro mínimo de 1" (25.4 mm) a efectos de absorber derivaciones térmicas y errores mínimos en el hormigonado y alineación de bases.
      </p>
    </div>
    <div style="background-color: #111827; padding: 12px; border-top: 1px solid #1f2937; text-align: center; font-size: 10px; color: #4b5563;">
      Generado electrónicamente por Constracad de Mendoza — Ingeniería Certificada
    </div>
  </div>
</body>
</html>`;

  // HTML TEMPLATE 2: Cuerpo, Bastidor, Chasis y Frente del Cartel (activeTab = billboard)
  const htmlBillboardTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Pliego de Fabricación: Marco Bastidor y Revestimiento de Cartelera</title>
</head>
<body style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 20px; line-height: 1.5;">
  <div style="max-width: 650px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);">
    <div style="background: linear-gradient(135deg, #10b981, #0f172a); padding: 24px; border-bottom: 3px solid #10b981;">
      <h2 style="margin: 0; color: #ffffff; font-size: 20px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800;">
        🖼️ PLIEGO TÉCNICO DE BASTIDOR Y REVESTIMIENTO
      </h2>
      <p style="margin: 6px 0 0 0; color: #34d399; font-size: 13px; font-weight: 600;">
        Bastidor Estructural de Caños, Cuadrícula Interna y Frente de Chapas Lisas
      </p>
    </div>
    <div style="padding: 24px;">
      <h3 style="color: #34d399; font-size: 15px; border-bottom: 1px solid #1f2937; padding-bottom: 8px; margin-top: 0;">1. Configuración de Bastidor del Cartel</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12.5px; text-align: left;">
        <tr style="border-bottom: 1px solid #1f2937;">
          <td style="padding: 8px 0; color: #94a3b8;">Superficie Frontal:</td>
          <td style="padding: 8px 0; color: #ffffff; font-weight: bold;">${(structureConfig.width/100).toFixed(2)} m (ancho) x ${(structureConfig.height/100).toFixed(2)} m (alto) = ${((structureConfig.width/100)*(structureConfig.height/100)).toFixed(1)} m²</td>
        </tr>
        <tr style="border-bottom: 1px solid #1f2937;">
          <td style="padding: 8px 0; color: #94a3b8;">Perfil del Marco:</td>
          <td style="padding: 8px 0; color: #ffffff; font-weight: bold;">Caño Estructural Cuadrado ${structureConfig.marcoProfile} mm</td>
        </tr>
        <tr style="border-bottom: 1px solid #1f2937;">
          <td style="padding: 8px 0; color: #94a3b8;">Cuadrícula Interna:</td>
          <td style="padding: 8px 0; color: #ffffff; font-weight: bold;">Patrón ${structureConfig.gridPattern} con perfil ${structureConfig.skeletonProfile} mm (${structureConfig.gridRows} filas x ${structureConfig.gridCols} columnas)</td>
        </tr>
        <tr style="border-bottom: 1px solid #1f2937;">
          <td style="padding: 8px 0; color: #94a3b8;">Chapa Frontal:</td>
          <td style="padding: 8px 0; color: #ffffff; font-weight: bold;">Resistencia BWG Nº ${structureConfig.chapaProfile.split('_')[1]} (Ancho: ${structureConfig.chapaSheetSize}m)</td>
        </tr>
      </table>

      <h3 style="color: #34d399; font-size: 15px; border-bottom: 1px solid #1f2937; padding-bottom: 8px; margin-top: 24px;">2. Cómputo de Materiales Metalúrgicos y Montaje</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
        <thead>
          <tr style="border-bottom: 2px solid #374151; color: #34d399;">
            <th style="padding: 8px;">Insumo</th>
            <th style="padding: 8px; text-align: center;">Cantidad</th>
            <th style="padding: 8px;">Proveedor Seleccionado</th>
          </tr>
        </thead>
        <tbody>
          ${activeItems.map(item => `
            <tr style="border-bottom: 1px solid #1f2937;">
              <td style="padding: 10px 8px; color: #e2e8f0; font-weight: bold;">${item.name}</td>
              <td style="padding: 10px 8px; color: #34d399; font-weight: bold; text-align: center;">${item.quantity} ${item.unit}</td>
              <td style="padding: 10px 8px; color: #94a3b8;">${item.supplier}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <p style="margin-top: 24px; padding: 12px; background-color: #065f46; border-left: 4px solid #34d399; font-size: 11px; color: #d1fae5; border-radius: 4px;">
        💡 <strong>Recomendación Técnica:</strong> Se deben fijar las chapas en taller mediante tornillos autoperforantes de 1" con arandelas de goma vulcanizadas de neoprene para absorber dilataciones térmicas severas y evitar filtraciones corrosivas internas.
      </p>
    </div>
    <div style="background-color: #111827; padding: 12px; border-top: 1px solid #1f2937; text-align: center; font-size: 10px; color: #4b5563;">
      Generado electrónicamente por Constracad de Mendoza — Sistema de Panelización de Bastidor
    </div>
  </div>
</body>
</html>`;

  // HTML TEMPLATE 3: Planilla Consolidada Completa (activeTab = consolidated)
  const htmlConsolidatedTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Cómputo Métrico Consolidado de Obra: Estructura de Gran Mendoza</title>
</head>
<body style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 25px; line-height: 1.5;">
  <div style="max-width: 800px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);">
    <div style="background: linear-gradient(135deg, #6366f1, #1e1b4b); padding: 30px; border-bottom: 4px solid #6366f1; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 style="margin: 0; color: #ffffff; font-size: 22px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 950;">
          📊 CÓMPUTO MÉTRICO GLOBAL HOMOLOGADO
        </h1>
        <p style="margin: 6px 0 0 0; color: #c7d2fe; font-size: 13px; font-weight: 500;">
          Ingeniería de Estructuras Constracad — Dirección Técnica de Vientos Mendoza
        </p>
      </div>
      <div style="text-align: right; background-color: rgba(99, 102, 241, 0.2); padding: 8px 12px; border-radius: 8px; border: 1.5px solid #6366f1;">
        <span style="font-size: 9.5px; text-transform: uppercase; color: #a5b4fc; display: block; font-weight: bold;">PESO ESTIMADO</span>
        <strong style="font-size: 18px; color: #ffffff; font-family: monospace;">${totalGlobalWeight} kg</strong>
      </div>
    </div>
    
    <div style="padding: 30px;">
      <!-- HORMISERV SRL ABSTRACT BANNER -->
      <div style="background-color: rgba(245, 158, 11, 0.08); border: 1.5px solid #d97706; border-radius: 8px; padding: 15px; margin-bottom: 25px; font-size: 12px; color: #fbbf24; line-height: 1.5;">
        🏗️ <strong>SUMINISTRO AUTÓNOMO DE HORMIGÓN (HORMISERV SRL):</strong> Se han contemplado ${concreteVolume} m³ de mezcla dosificada clase ${concreteGrade} para la base sismorresistente del cartel (${structureConfig.columnCount} pozos de excavación de ${structureConfig.foundationWidth}x${structureConfig.foundationWidth}x${structureConfig.foundationDepth} cm). Este volumen es aportado por planta propia de <strong>HORMISERV SRL</strong>, por lo tanto ha sido excluido de las planillas de cotización comerciales para aceros de taller.
      </div>

      <p style="margin: 0 0 20px 0; font-size: 13px; color: #a5b4fc;">
        Este cómputo representa el consolidado definitivo de materiales para la fabricación propia de la estructura en taller y el anclaje de columnas en el terreno de obra.
      </p>

      <!-- SECCIÓN A -->
      <h3 style="color: #818cf8; font-size: 14px; border-bottom: 2px solid #312e81; padding-bottom: 5px; margin-top: 10px; text-transform: uppercase; letter-spacing: 0.05em;">🧪 PLANILLA A: SOPORTES Y PIEZAS DE FABRICACIÓN PROPIA (TALLER)</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px; text-align: left;">
        <thead>
          <tr style="border-bottom: 1.5px solid #4338ca; color: #a5b4fc;">
            <th style="padding: 8px; width: 45%;">Componente</th>
            <th style="padding: 8px; text-align: center; width: 20%;">Copia/Cantidad</th>
            <th style="padding: 8px;">Especificaciones / Proveedor</th>
          </tr>
        </thead>
        <tbody>
          ${finalUnifiedMaterialsList.filter(item => isSupportItem(item) && !item.deleted).map(item => `
            <tr style="border-bottom: 1px solid #1f2937;">
              <td style="padding: 8px; color: #e2e8f0; font-weight: bold;">${item.name}</td>
              <td style="padding: 8px; color: #34d399; font-weight: bold; text-align: center;">${item.quantity} ${item.unit}</td>
              <td style="padding: 8px; color: #cbd5e1; font-size: 11px;">${item.supplier} - ${item.description || item.details}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- SECCIÓN B -->
      <h3 style="color: #34d399; font-size: 14px; border-bottom: 2px solid #064e3b; padding-bottom: 5px; margin-top: 30px; text-transform: uppercase; letter-spacing: 0.05em;">🖼️ PLANILLA B: BASTIDOR, CUADRÍCULA Y REVESTIMIENTO (COTIZACIÓN GENERAL)</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; text-align: left;">
        <thead>
          <tr style="border-bottom: 1.5px solid #047857; color: #a7f3d0;">
            <th style="padding: 8px; width: 45%;">Componente</th>
            <th style="padding: 8px; text-align: center; width: 20%;">Copia/Cantidad</th>
            <th style="padding: 8px;">Especificaciones / Proveedor</th>
          </tr>
        </thead>
        <tbody>
          ${finalUnifiedMaterialsList.filter(item => isBillboardItem(item) && !item.deleted).map(item => `
            <tr style="border-bottom: 1px solid #1f2937;">
              <td style="padding: 8px; color: #e2e8f0; font-weight: bold;">${item.name}</td>
              <td style="padding: 8px; color: #34d399; font-weight: bold; text-align: center;">${item.quantity} ${item.unit}</td>
              <td style="padding: 8px; color: #cbd5e1; font-size: 11px;">${item.supplier} - ${item.description || item.details}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- COMENTARIOS ADICIONALES -->
      <div style="margin-top: 35px; border: 1.5px dashed #4b5563; padding: 15px; border-radius: 8px; background-color: rgba(17, 24, 39, 0.5);">
         <h4 style="margin: 0 0 5px 0; font-size: 12px; color: #ffffff;">✍️ Certificación y Aprobación de Planilla de Cómputo:</h4>
         <p style="margin: 0; font-size: 11px; color: #94a3b8; font-style: italic; line-height: 1.6;">
           Esta planilla ha sido recalculada dinámicamente según la reingeniería paramétrica de soporte de Constracad 3D. Mendoza, Argentina. Apta para pedido directo de presupuestos y remites de materiales siderúrgicos pesados bajo normativas locales.
         </p>
         <div style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 11px; color: #cbd5e1;">
           <div style="width: 45%; border-top: 1px solid #4b5563; text-align: center; padding-top: 5px;">Aprobación de Ingeniería Constracad</div>
           <div style="width: 45%; border-top: 1px solid #4b5563; text-align: center; padding-top: 5px;">Firma dpto. Técnico Sideromedalurgico</div>
         </div>
      </div>
    </div>
    <div style="background-color: #111827; padding: 15px; border-top: 1px solid #1f2937; text-align: center; font-size: 11px; color: #4b5563;">
      Constracad Estructuras Metálicas Multiclamp — Mendoza, Cuyo
    </div>
  </div>
</body>
</html>`;

  // Pick correct HTML based on active view tab
  const getActiveHtmlTemplate = () => {
    if (activeTab === 'support') return htmlSupportTemplate;
    if (activeTab === 'billboard') return htmlBillboardTemplate;
    return htmlConsolidatedTemplate;
  };

  const getActiveFileName = () => {
    if (activeTab === 'support') return `planilla_fabricacion_soporte_infraestructura.html`;
    if (activeTab === 'billboard') return `planilla_fabricacion_bastidor_cartelera.html`;
    return `computo_metrico_consolidado_completo.html`;
  };

  const handleCopyHtmlCode = () => {
    const code = getActiveHtmlTemplate();
    navigator.clipboard.writeText(code);
    setIsHtmlCopied(true);
    setTimeout(() => setIsHtmlCopied(false), 3000);
  };

  const handleDownloadHtml = () => {
    const element = document.createElement("a");
    const file = new Blob([getActiveHtmlTemplate()], { type: "text/html;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = getActiveFileName();
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div id="budget-manager-root" className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 md:p-6 backdrop-blur-xl space-y-6">
      
      {/* MASTER PANEL HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="text-left space-y-1">
          <span className="text-[10px] uppercase font-black text-cyan-400 tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
            Cómputos Metálicos y Planos de Taller Mendoza
          </span>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            Hojas Técnicas y Plantillas de Prefabricación Totalmente Editables
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Calcula automáticamente el despiece mecánico en base a la geometría elegida. Las plantillas están divididas por sectores y son <strong>100% editables</strong>: puede ocultar o añadir insumos alternativos directamente sobre las listas de compra.
          </p>
        </div>

        {/* RESET & RECOVER CONTROLS */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-900/10"
            title="Agregar un nuevo insumo de metalurgia o ferretería a la planilla actual"
          >
            <Plus className="h-4 w-4" />
            Agregar Insumo
          </button>

          {customizedCount > 0 && (
            <button
              onClick={handleResetAllQuotes}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-950/20 text-rose-450 border border-rose-900/30 hover:bg-rose-900/20 transition cursor-pointer flex items-center gap-1"
              title="Borra todos los cambios analógicos y compras introducidas volviendo al cálculo nominal"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restablecer Planilla
            </button>
          )}
        </div>
      </div>

      {/* METALS SYSTEM SELECTOR TABS ("unificar o separar vista") */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 p-2 rounded-xl border border-slate-850">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => { setActiveTab('support'); setHtmlTab('visual'); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-md cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'support' 
                ? 'bg-cyan-600 text-white font-extrabold shadow' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Fabricación Propia (Soportes)</span>
            <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.2 rounded font-mono">Planilla A</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('billboard'); setHtmlTab('visual'); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-md cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'billboard' 
                ? 'bg-emerald-600 text-white font-extrabold shadow' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layout className="h-3.5 w-3.5" />
            <span>Bastidor & Revestimiento</span>
            <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.2 rounded font-mono">Planilla B</span>
          </button>

          <button
            onClick={() => { setActiveTab('consolidated'); setHtmlTab('visual'); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-md cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'consolidated' 
                ? 'bg-violet-600 text-white font-extrabold shadow' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Consolidado de Cotización</span>
            <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.2 rounded font-mono">Consolidado</span>
          </button>
        </div>

        {/* ESTIMATED SUB-WEIGHT AND METADATA */}
        <div className="flex items-center gap-4 text-xs font-medium font-sans px-2">
          {activeTab !== 'consolidated' && (
            <div className="hidden sm:block text-slate-500">
              Peso de este sector: <span className="text-slate-300 font-bold font-mono">{currentTabWeight} kg</span>
            </div>
          )}
          <div className="text-slate-400">
            Cómputo Total Siderúrgico: <strong className="text-cyan-400 font-black font-mono">{totalGlobalWeight} kg</strong>
          </div>
        </div>
      </div>

      {/* AUTONOMOUS CIMIENTOS / HORMISERV SRL ABSTRACT BANNER */}
      <div id="hormiserv-concrete-banner" className="bg-slate-900/40 rounded-xl border border-amber-500/20 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 select-none animate-fade-in animate-duration-150">
        <div className="flex items-start gap-3.5 text-left">
          <div className="bg-amber-500/10 border border-amber-500/25 px-2.5 py-3 rounded-lg text-amber-500 shrink-0 flex flex-col items-center justify-center font-mono font-black text-xs leading-none">
            <span>CONC</span>
            <span className="text-[11px] font-bold text-amber-400/90 mt-1">{concreteGrade}</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5 flex-wrap">
              <span>Suministro y Dosificación: HORMISERV SRL (Planta Propia)</span>
              <span className="text-[9px] bg-amber-500/15 text-amber-400 px-1.5 py-0.2 rounded font-black border border-amber-500/20 uppercase tracking-normal">Excluido de Pliego de Cotización</span>
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Mezcla de hormigón elaborado tipo estructural <strong className="text-slate-100 font-extrabold font-mono">{concreteGrade}</strong> requerida para las fundaciones: <strong className="font-mono text-amber-400 font-extrabold">{concreteVolume} m³</strong> netos totales para excavaciones para postes en las <strong className="text-slate-100 font-extrabold font-mono">{structureConfig.columnCount} bases</strong> con pozos de <strong className="text-slate-100 font-extrabold font-mono">{structureConfig.foundationWidth}x{structureConfig.foundationWidth} cm</strong> de sección y <strong className="text-slate-100 font-extrabold font-mono">{structureConfig.foundationDepth} cm</strong> de profundidad enterrado. Peso total estimado de fraguado: <strong className="text-slate-100 font-extrabold font-mono font-sans">{(parseFloat(concreteVolume) * 2400).toLocaleString('es-AR')} kg</strong> (densidad de obra 2.4 t/m³).
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-center bg-slate-950/80 px-4 py-2 border border-slate-850 rounded-lg text-right shrink-0">
          <span className="text-[9.5px] font-bold text-slate-500 uppercase leading-none">Volumen Cimiento</span>
          <span className="text-xl font-black text-amber-400 font-mono leading-normal mt-0.5">{concreteVolume} m³</span>
          <span className="text-[10px] font-black text-amber-550/85 tracking-wider mt-0.5">HORMISERV SRL</span>
        </div>
      </div>

      {/* INLINE POPUP DRAWER: ADD CUSTOM MATERIAL */}
      {showAddForm && (
        <form onSubmit={handleAddCustomMaterial} className="bg-slate-900 border border-dashed border-cyan-500/40 p-4 rounded-xl space-y-4 text-left animate-fade-in animate-duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-sm font-extrabold text-cyan-400 flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Nuevo Insumo Metalúrgico Técnico de Fabricación
            </span>
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)}
              className="text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
            <div className="md:col-span-4 flex flex-col gap-1">
              <label className="text-slate-400 font-bold">Concepto / Nombre del Insumo</label>
              <input
                type="text"
                required
                value={addFormName}
                onChange={e => setAddFormName(e.target.value)}
                placeholder="Ej: Tensor de vientos galvanizado de 1/2&quot;, Caño estructural..."
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 outline-none focus:border-cyan-500 w-full"
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="text-slate-400 font-bold">Grupo / Destino</label>
              <select
                value={addFormCategory}
                onChange={e => setAddFormCategory(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 outline-none focus:border-cyan-500 w-full cursor-pointer"
              >
                <option value="postes">Postes Tubing (Soporte)</option>
                <option value="anclajes">Anclajes & Platinas (Soporte)</option>
                <option value="cimentacion">Hormigones & Excavación</option>
                <option value="marco">Marco Exterior (Cartel)</option>
                <option value="skeleton">Refuerzos / Esqueleto (Cartel)</option>
                <option value="chapa">Chapa / Sujeciones frontal (Cartel)</option>
              </select>
            </div>

            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="text-slate-400 font-bold">Cantidad x Unidad</label>
              <div className="flex bg-slate-950 border border-slate-800 rounded-lg">
                <input
                  type="number"
                  step="0.1"
                  required
                  value={addFormQty}
                  onChange={e => setAddFormQty(e.target.value)}
                  className="bg-transparent text-center p-2 text-slate-200 font-mono font-bold w-16 outline-none"
                />
                <input
                  type="text"
                  value={addFormUnit}
                  onChange={e => setAddFormUnit(e.target.value)}
                  placeholder="u"
                  className="bg-transparent text-center p-2 text-slate-400 w-12 outline-none border-l border-slate-800 text-[11px]"
                />
              </div>
            </div>

            <div className="md:col-span-4 flex flex-col gap-1">
              <label className="text-slate-400 font-bold">Proveedor / Fabricación</label>
              <input
                type="text"
                value={addFormSupplier}
                onChange={e => setAddFormSupplier(e.target.value)}
                placeholder="Ej: Solimet S.A., Chacarita, Propios..."
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 outline-none focus:border-cyan-500 w-full"
              />
            </div>

            <div className="md:col-span-12 flex flex-col gap-1">
              <label className="text-slate-400 font-bold">Detalle Técnico de Rendimiento o Tolerancia</label>
              <textarea
                value={addFormDetails}
                onChange={e => setAddFormDetails(e.target.value)}
                placeholder="Indique cortes, solapes, biselados mandatorios en taller o especificaciones ASTM específicas..."
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 outline-none focus:border-cyan-500 w-full min-h-[50px] resize-y"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer"
            >
              Guardar Insumo en Planilla
            </button>
          </div>
        </form>
      )}

      {/* TWO SEPARATED DYNAMIC WORKSHOP TEMPLATES VISUALIZERS */}
      {activeTab !== 'consolidated' && (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 space-y-4 animate-fade-in animate-duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Layout className="h-5 w-5 text-cyan-400" />
              <div className="text-left">
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-500 block">Oficina Técnica Mendoza</span>
                <h3 className="text-sm font-extrabold text-slate-100">
                  {activeTab === 'support' 
                    ? "Planilla A: Ficha de Prefabricación de Kit de Anclaje de Viento"
                    : "Planilla B: Ficha de Fabricación de Marco Bastidor y Chasis Frontal"
                  }
                </h3>
              </div>
            </div>
            
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-center gap-1">
              <button
                onClick={() => setHtmlTab('visual')}
                className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition ${
                  htmlTab === 'visual' ? 'bg-cyan-600 text-white font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Vista Didáctica
              </button>
              <button
                onClick={handleDownloadHtml}
                className="px-3 py-1 text-xs font-bold rounded cursor-pointer transition text-teal-400 hover:text-teal-300 flex items-center gap-1"
                title="Descargar Ficha Técnica como archivo HTML autónomo"
              >
                <Download className="h-3 w-3" />
                Descargar Pliego HTML
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
              
              {/* COMPONENT DRAWING FOR PLANILLA A (SUPPORT INFRA) */}
              {activeTab === 'support' && (
                <>
                  <div className="lg:col-span-6 bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-4">
                    <div className="text-left space-y-1">
                      <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest leading-none">
                        {croquisViewSupport === 'superior' ? "Diagrama Superior del Kit de Acero" :
                         croquisViewSupport === 'lateral' ? "Corte de Elevación Lateral del Anclaje" :
                         croquisViewSupport === 'placa' ? "Plano de Perforación de Placa Base" :
                         "Esquema de Fabricación Escuadra / Rigidizador"}
                      </span>
                      <p className="text-xs text-slate-400">
                        {croquisViewSupport === 'superior' ? "Croquis didáctico de vista superior para el taller con agujeros en las esquinas." :
                         croquisViewSupport === 'lateral' ? "Detalle vertical indicando empotramiento del poste tubing, escuadras de refuerzo y zapa." :
                         croquisViewSupport === 'placa' ? `Placa base de ${plateSize} mm con boca central calibrada y perforaciones para pernos de anclaje.` :
                         "Rigidizador de arriostramiento de espesor 9.5 mm (3/8\") con despunte de esquina y rincón de soldadura."}
                      </p>
                    </div>

                    {/* Sub-Tabs Switcher for support sketches */}
                    <div className="flex flex-wrap gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                      {(['superior', 'lateral', 'placa', 'escuadra'] as const).map((view) => (
                        <button
                          key={view}
                          type="button"
                          onClick={() => setCroquisViewSupport(view)}
                          className={`flex-1 py-1.5 px-1 text-[9px] uppercase font-black rounded-lg transition-all cursor-pointer ${
                            croquisViewSupport === view
                              ? 'bg-cyan-500 text-slate-950'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                          }`}
                        >
                          {view}
                        </button>
                      ))}
                    </div>

                    {/* Dynamic SVG Blueprint A */}
                    <div className="bg-slate-900 rounded-lg p-2 border border-slate-850 flex items-center justify-center min-h-[260px]">
                      {croquisViewSupport === 'superior' && (
                        <svg viewBox="0 0 400 300" className="w-full max-w-[340px] h-auto outline-none">
                          <rect width="400" height="300" fill="#030712" rx="6" />
                          <path d="M 0,150 L 400,150" stroke="#1e293b" strokeWidth={1} strokeDasharray="3,3" />
                          <path d="M 200,0 L 200,300" stroke="#1e293b" strokeWidth={1} strokeDasharray="3,3" />
                          <rect x="90" y="40" width="220" height="220" rx="3" fill="none" stroke="#22d3ee" strokeWidth={2.5} />
                          <circle cx="115" cy="65" r="8" fill="#030712" stroke="#ffffff" strokeWidth={1.2} />
                          <circle cx="285" cy="65" r="8" fill="#030712" stroke="#ffffff" strokeWidth={1.2} />
                          <circle cx="115" cy="235" r="8" fill="#030712" stroke="#ffffff" strokeWidth={1.2} />
                          <circle cx="285" cy="235" r="8" fill="#030712" stroke="#ffffff" strokeWidth={1.2} />
                          <circle cx="200" cy="150" r="35" fill="#1f2937" stroke="#ffffff" strokeWidth={2} />
                          <path d="M 194,115 L 200,40 L 206,115 Z" fill="#22d3ee" fillOpacity={0.35} stroke="#22d3ee" strokeWidth={1.5} />
                          <path d="M 194,185 L 200,260 L 206,185 Z" fill="#22d3ee" fillOpacity={0.35} stroke="#22d3ee" strokeWidth={1.5} />
                          <path d="M 235,144 L 310,150 L 235,156 Z" fill="#22d3ee" fillOpacity={0.35} stroke="#22d3ee" strokeWidth={1.5} />
                          <path d="M 165,144 L 90,150 L 165,156 Z" fill="#22d3ee" fillOpacity={0.35} stroke="#22d3ee" strokeWidth={1.5} />
                          <text x="96" y="58" fill="#22d3ee" fontSize="10" fontWeight="extrabold">PLACA BASE: ep {plateThick}mm</text>
                          <text x="96" y="248" fill="#475569" fontSize="9">Lado: {plateSize} mm</text>
                          <text x="200" y="153" fill="#ffffff" fontSize="8" textAnchor="middle" fontWeight="bold">{isTubing3_5 ? "TUBING 3 ½\"" : "TUBING 2 ⅞\""}</text>
                        </svg>
                      )}

                      {croquisViewSupport === 'lateral' && (
                        <svg viewBox="0 0 400 300" className="w-full max-w-[340px] h-auto outline-none">
                          <rect width="400" height="300" fill="#030712" rx="6" />
                          <rect x="65" y="210" width="270" height="75" fill="#1e293b" fillOpacity={0.8} stroke="#475569" strokeWidth={1.5} rx="4" />
                          <path d="M 115,190 L 115,255 A 8 8 0 0 1 101,255" fill="none" stroke="#94a3b8" strokeWidth={2.5} />
                          <path d="M 285,190 L 285,255 A 8 8 0 0 1 271,255" fill="none" stroke="#94a3b8" strokeWidth={2.5} />
                          <rect x="80" y="202" width="240" height="8" fill="#38bdf8" stroke="#0ea5e9" strokeWidth={1} rx="1" />
                          <rect x="182" y="20" width="36" height="182" fill="#0f172a" stroke="#cbd5e1" strokeWidth={2} />
                          <path d="M 182,202 L 142,202 L 182,102 Z" fill="#22d3ee" fillOpacity={0.4} stroke="#22d3ee" strokeWidth={1.5} />
                          <path d="M 218,202 L 258,202 L 218,102 Z" fill="#22d3ee" fillOpacity={0.4} stroke="#22d3ee" strokeWidth={1.5} />
                          <text x="200" y="255" fill="#cbd5e1" fontSize="9.5" textAnchor="middle" fontWeight="bold">PEDESTAL DE TRINCHERA DE HORMIGÓN</text>
                        </svg>
                      )}

                      {croquisViewSupport === 'placa' && (
                        <svg viewBox="0 0 400 300" className="w-full max-w-[340px] h-auto outline-none">
                          <rect width="400" height="300" fill="#030712" rx="6" />
                          <rect x="90" y="40" width="220" height="220" rx="4" fill="#0f172a" stroke="#22d3ee" strokeWidth={2} />
                          <circle cx="200" cy="150" r="35" fill="#030712" stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="3,2" />
                          <circle cx="120" cy="70" r="10" fill="#030712" stroke="#fbbf24" strokeWidth={1.5} />
                          <circle cx="280" cy="70" r="10" fill="#030712" stroke="#fbbf24" strokeWidth={1.5} />
                          <circle cx="120" cy="230" r="10" fill="#030712" stroke="#fbbf24" strokeWidth={1.5} />
                          <circle cx="280" cy="230" r="10" fill="#030712" stroke="#fbbf24" strokeWidth={1.5} />
                          <text x="200" y="153" fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="middle">Ø {isTubing3_5 ? "90" : "74"} mm</text>
                          <text x="200" y="280" fill="#fbbf24" fontSize="8" textAnchor="middle" fontWeight="bold">4 Agujeros Pasantes Ø 1" (25.4 mm) s/J-Bolts</text>
                        </svg>
                      )}

                      {croquisViewSupport === 'escuadra' && (
                        <svg viewBox="0 0 400 300" className="w-full max-w-[340px] h-auto outline-none">
                          <rect width="400" height="300" fill="#030712" rx="6" />
                          <path d="M 120,60 L 135,60 L 260,225 L 260,240 L 140,240 L 140,225 L 120,225 Z" fill="#0f172a" stroke="#22d3ee" strokeWidth={2.5} />
                          <path d="M 120,60 L 120,225 M 140,240 L 260,240" stroke="#f43f5e" strokeWidth={2.5} strokeDasharray="3,2" />
                          <text x="80" y="155" fill="#fbbf24" fontSize="10" fontWeight="extrabold">H: 160 mm</text>
                          <text x="190" y="280" fill="#fbbf24" fontSize="10" fontWeight="extrabold" textAnchor="middle">Base: 80 mm</text>
                          <text x="210" y="120" fill="#cbd5e1" fontSize="9">Espesor: 9.5 mm (3/8&quot;) Chapa F-24</text>
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Dynamic Spec card */}
                  <div className="lg:col-span-6 bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-3.5 text-left">
                    <div className="space-y-1">
                      <span className="text-[10px] text-cyan-400 font-black uppercase tracking-wider block">✓ DESPIECE AUTORIZADO DE INSUMOS DE BASE</span>
                      <p className="text-xs text-slate-400">Pautas mandatorias para la ingeniería de bases en el Gran Mendoza:</p>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-850">
                        <div className="flex justify-between text-xs border-b border-slate-800 pb-1">
                          <span className="font-extrabold text-slate-200">Placas de Base de Acero e:12mm:</span>
                          <strong className="text-cyan-400 font-mono font-black">{structureConfig.columnCount} unidades</strong>
                        </div>
                        <p className="text-[10.5px] text-slate-500 leading-normal mt-1.5">
                          Placa pesada cuadrangular de {plateSize} mm. Soportan la torsión inducida por vientos transversales del Zonda de hasta 130 km/h.
                        </p>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-850">
                        <div className="flex justify-between text-xs border-b border-slate-800 pb-1">
                          <span className="font-extrabold text-slate-200">Refuerzos / Rigidizadores Triangulares:</span>
                          <strong className="text-cyan-400 font-mono font-black">{structureConfig.columnCount * 4} unidades</strong>
                        </div>
                        <p className="text-[10.5px] text-slate-500 leading-normal mt-1.5">
                          Rigidizadores triangulares soldados a 90º alrededor de la columna. Chaflán de seguridad superior de 15 mm y un rincón de despunte de 15x15 mm que permite el vaciado y soldadura limpia de costura perimetral.
                        </p>
                      </div>
                    </div>

                    <div className="bg-amber-950/20 border-l-2 border-amber-500 p-3 rounded-lg">
                      <div className="text-xs font-bold text-amber-300 uppercase flex items-center gap-1 mb-1">
                        <Info className="h-3.5 w-3.5 text-amber-400" />
                        <span>Hormigonado In Situ</span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 leading-relaxed">
                        Para las bases portantes se exige un fraguado de al menos 21 días (Hormigón H21 o superior) antes de someter las columnas tubing a cargas flectoras por empuje transversal de viento.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* COMPONENT DRAWING FOR PLANILLA B (BILLBOARD FRAME & SHEETS) */}
              {activeTab === 'billboard' && (
                <>
                  <div className="lg:col-span-6 bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-4">
                    <div className="text-left space-y-1">
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">
                        {croquisViewBillboard === 'bastidor' ? "Estructura del Bastidor de Frente" :
                         croquisViewBillboard === 'estructura' ? "Cuadrícula y Refuerzos Internos s/ Patrón" :
                         "Alineación y Solape de Chapas en Taller"}
                      </span>
                      <p className="text-xs text-slate-400">
                        {croquisViewBillboard === 'bastidor' ? `Chasis exterior de ${(structureConfig.width/100).toFixed(1)}m x ${(structureConfig.height/100).toFixed(1)}m realizado con caño perfil ${structureConfig.marcoProfile} mm.` :
                         croquisViewBillboard === 'estructura' ? `Distribución interna de refuerzos autoportantes del patrón: ${structureConfig.gridPattern.toUpperCase()}` :
                         "Distribución técnica de chapas de alta especificación siderúrgica con tolerancias de solape perimetral."}
                      </p>
                    </div>

                    {/* Sub-Tabs Switcher for billboard sketches */}
                    <div className="flex flex-wrap gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                      {(['bastidor', 'estructura', 'acabado'] as const).map((view) => (
                        <button
                          key={view}
                          type="button"
                          onClick={() => setCroquisViewBillboard(view)}
                          className={`flex-1 py-1.5 px-1 text-[9px] uppercase font-black rounded-lg transition-all cursor-pointer ${
                            croquisViewBillboard === view
                              ? 'bg-emerald-500 text-slate-950'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                          }`}
                        >
                          {view === 'bastidor' ? 'Bastidor General' : view === 'estructura' ? 'Patrón Cuadrícula' : 'Montaje Placas'}
                        </button>
                      ))}
                    </div>

                    {/* Dynamic SVG Blueprint B */}
                    <div className="bg-slate-900 rounded-lg p-2 border border-slate-850 flex items-center justify-center min-h-[260px]">
                      {croquisViewBillboard === 'bastidor' && (
                        <svg viewBox="0 0 400 300" className="w-full max-w-[340px] h-auto outline-none">
                          <rect width="400" height="300" fill="#030712" rx="6" />
                          <rect x="50" y="40" width="300" height="150" fill="none" stroke="#10b981" strokeWidth={3} />
                          
                          {/* Draw dynamic poles underneath */}
                          {Array.from({ length: structureConfig.columnCount }).map((_, i) => {
                            const xSpacing = structureConfig.columnCount > 1 ? (300 / (structureConfig.columnCount - 1)) : 0;
                            const xPos = 50 + i * xSpacing;
                            return (
                              <line 
                                key={i} 
                                x1={xPos} 
                                y1="130" 
                                x2={xPos} 
                                y2="280" 
                                stroke="#cbd5e1" 
                                strokeWidth={2.5} 
                                strokeOpacity={0.8}
                              />
                            );
                          })}

                          {/* Ground horizontal line */}
                          <line x1="20" y1="280" x2="380" y2="280" stroke="#475569" strokeWidth={1} strokeDasharray="3,3" />
                          <text x="200" y="293" fill="#475569" fontSize="8" textAnchor="middle">RAS DE SUELO NATURAL / EXCAVACIÓN</text>

                          {/* Dimension labels */}
                          <text x="200" y="32" fill="#10b981" fontSize="10.5" fontWeight="bold" textAnchor="middle">Ancho de Cartel: {(structureConfig.width / 100).toFixed(2)} m</text>
                          <text x="358" y="115" fill="#10b981" fontSize="10.5" fontWeight="bold" textAnchor="start" transform="rotate(90 358 115)">Alto: {(structureConfig.height / 100).toFixed(2)} m</text>
                        </svg>
                      )}

                      {croquisViewBillboard === 'estructura' && (
                        <svg viewBox="0 0 400 300" className="w-full max-w-[340px] h-auto outline-none">
                          <rect width="400" height="300" fill="#030712" rx="6" />
                          
                          {/* Inner frame */}
                          <rect x="50" y="40" width="300" height="150" fill="#0b1329" stroke="#10b981" strokeWidth={2} />
                          
                          {/* Rows & Columns subdivisions */}
                          {Array.from({ length: Math.max(1, structureConfig.gridRows - 1) }).map((_, i) => {
                            const ySpacing = 150 / Math.max(1, structureConfig.gridRows - 1);
                            const yPos = 40 + (i + 1) * ySpacing;
                            if (yPos < 190) {
                              return <line key={`r-${i}`} x1="50" y1={yPos} x2="350" y2={yPos} stroke="#3b82f6" strokeWidth={1} strokeOpacity={0.6} />;
                            }
                            return null;
                          })}

                          {Array.from({ length: Math.max(1, structureConfig.gridCols - 1) }).map((_, i) => {
                            const xSpacing = 300 / Math.max(1, structureConfig.gridCols - 1);
                            const xPos = 50 + (i + 1) * xSpacing;
                            if (xPos < 350) {
                              return <line key={`c-${i}`} x1={xPos} y1="40" x2={xPos} y2="190" stroke="#3b82f6" strokeWidth={1} strokeOpacity={0.6} />;
                            }
                            return null;
                          })}

                          {/* Dynamic patterned reinforcements */}
                          {structureConfig.gridPattern === 'diagonal_cross' && (
                            <>
                              <line x1="50" y1="40" x2="350" y2="190" stroke="#fb7185" strokeWidth={1} strokeDasharray="2,2" />
                              <line x1="350" y1="40" x2="50" y2="190" stroke="#fb7185" strokeWidth={1} strokeDasharray="2,2" />
                            </>
                          )}

                          {structureConfig.gridPattern === 'v_bracing' && (
                            <path d="M 50,40 L 200,190 L 350,40" fill="none" stroke="#fb7185" strokeWidth={1.5} strokeDasharray="4,2" />
                          )}

                          {structureConfig.gridPattern === 'double_reinforcement' && (
                            <rect x="65" y="55" width="270" height="120" fill="none" stroke="#fb7185" strokeWidth={1} strokeDasharray="3,1" />
                          )}

                          <text x="200" y="278" fill="#fb7185" fontSize="9" fontWeight="bold" textAnchor="middle">Patrón: {structureConfig.gridPattern.toUpperCase()} (Tiras de {structureConfig.skeletonProfile}mm)</text>
                        </svg>
                      )}

                      {croquisViewBillboard === 'acabado' && (
                        <svg viewBox="0 0 400 300" className="w-full max-w-[340px] h-auto outline-none">
                          <rect width="400" height="300" fill="#030712" rx="6" />
                          {/* Sheets assembly */}
                          <rect x="50" y="40" width="145" height="150" fill="#1e293b" stroke="#475569" strokeWidth={1} />
                          <rect x="200" y="40" width="150" height="150" fill="#1e293b" stroke="#475569" strokeWidth={1} />
                          
                          {/* Overlap highlight */}
                          <rect x="195" y="40" width="10" height="150" fill="#10b981" fillOpacity={0.3} />
                          <line x1="200" y1="40" x2="200" y2="190" stroke="#10b981" strokeWidth={1.5} strokeDasharray="5,2" />
                          
                          {/* Little screw indicators */}
                          <circle cx="100" cy="50" r="2.5" fill="#f59e0b" />
                          <circle cx="100" cy="120" r="2.5" fill="#f59e0b" />
                          <circle cx="100" cy="180" r="2.5" fill="#f59e0b" />
                          <circle cx="200" cy="50" r="2.5" fill="#f1f5f9" />
                          <circle cx="200" cy="120" r="2.5" fill="#f1f5f9" />
                          <circle cx="200" cy="180" r="2.5" fill="#f1f5f9" />

                          <text x="200" y="255" fill="#10b981" fontSize="9.5" fontWeight="bold" textAnchor="middle">Solape Mandatario Mínimo de Chapas: 50 mm</text>
                          <text x="200" y="275" fill="#f59e0b" fontSize="8" textAnchor="middle">Fijaciones en los bordes cada 20 cm con tornillos autoperforantes #14 x 1"</text>
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Dynamic Spec card */}
                  <div className="lg:col-span-6 bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-3.5 text-left">
                    <div className="space-y-1">
                      <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider block">✓ ESPECIFICACIÓN DE COBERTURA FRONTAL</span>
                      <p className="text-xs text-slate-400">Pautas mandatorias para bastidor de taller en Mendoza:</p>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-850">
                        <div className="flex justify-between text-xs border-b border-slate-800 pb-1">
                          <span className="font-extrabold text-slate-200">Caño Estructural de Marco:</span>
                          <strong className="text-emerald-400 font-mono font-black">{activeItems.find(i => i.id === 'mat_marco')?.quantity || 0} barras de 6.0m</strong>
                        </div>
                        <p className="text-[10.5px] text-slate-500 leading-normal mt-1.5">
                          Marco confeccionado en caño {structureConfig.marcoProfile} mm. Aporta la inercia flectora externa ante empujes dinámicos de ráfagas severas.
                        </p>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-850">
                        <div className="flex justify-between text-xs border-b border-slate-800 pb-1">
                          <span className="font-extrabold text-slate-200">Chapas Lisas Siderúrgicas BWG:</span>
                          <strong className="text-emerald-400 font-mono font-black">{activeItems.find(i => i.id === 'mat_chapa')?.quantity || 0} chapas</strong>
                        </div>
                        <p className="text-[10.5px] text-slate-500 leading-normal mt-1.5">
                          Para revestir la superficie. Se calculan con {structureConfig.chapaSheetSize}m de medida comercial. El cálculo nominal contempla solape perimetral del 8%.
                        </p>
                      </div>
                    </div>

                    <div className="bg-emerald-950/20 border-l-2 border-emerald-500 p-3 rounded-lg">
                      <div className="text-xs font-bold text-emerald-300 uppercase flex items-center gap-1 mb-1">
                        <Info className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Tratamiento de Acabado</span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 leading-relaxed">
                        Es indispensable la aplicación de base antióxido y esmalte de protección satinado de 3 en 1, con un rendimiento mínimo de 2 manos de soplete en cruz para evitar corrosión bajo ráfagas de lluvia mendocinas.
                      </p>
                    </div>
                  </div>
                </>
              )}

            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Código para correo de oficina de compras y solicitudes de taller:</span>
                <button
                  onClick={handleCopyHtmlCode}
                  className="bg-slate-950 hover:bg-slate-850 hover:text-white px-2.5 py-1 rounded border border-slate-800 flex items-center gap-1 text-[11px] font-bold cursor-pointer transition text-cyan-400"
                >
                  {isHtmlCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{isHtmlCopied ? '¡Código Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>
              
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-left">
                <pre className="text-[11px] font-mono leading-relaxed text-slate-300 max-h-[260px] overflow-y-auto overflow-x-auto pr-1">
                  {getActiveHtmlTemplate()}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONSOLIDATED TAB HEADER METADATA (Displays if in Consolidated mode) */}
      {activeTab === 'consolidated' && (
        <div className="bg-violet-950/20 border-l-4 border-violet-500 p-4 rounded-xl text-left animate-fade-in animate-duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-black text-violet-300 uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-violet-400" />
              Vista Consolidada del Cómputo Completo de Obra
            </h4>
            <p className="text-[11px] text-slate-400 max-w-2xl">
              Aquí se integran transversalmente las planillas A (Infraestructura) y B (Bastidores del cartel frontal), ofreciendo una cotización global consolidada de materiales siderúrgicos para el taller de pre-moldeado.
            </p>
          </div>
          <button
            onClick={handleDownloadHtml}
            className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-550 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1.5 transition self-start md:self-auto shrink-0"
          >
            <Download className="h-4 w-4" />
            Descargar Hoja Consolidada
          </button>
        </div>
      )}

      {/* DYNAMIC AND INTERACTIVE MATERIALS ROAD/GRID TABLE */}
      <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-950/40 shadow-inner">
        <table className="w-full text-left text-xs text-slate-300 border-collapse">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-850 text-slate-400 text-[10px] font-black uppercase tracking-wider">
              <th className="py-3 px-4 min-w-[200px]">Concepto Siderúrgico / Insumo</th>
              <th className="py-3 px-3 text-center min-w-[100px]">Cantidad</th>
              <th className="py-3 px-4 min-w-[120px]">Sector / Destino</th>
              <th className="py-3 px-4">Rendimiento y Tolerancias en Taller</th>
              <th className="py-3 px-4 text-center min-w-[130px]">Proveedor / Notas</th>
              <th className="py-3 px-4 text-right min-w-[140px]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/60">
            {getRenderableList().map(item => {
              const isEditing = editingId === item.id;
              
              // Get category display badge styling
              const getCategoryBadge = (cat: string) => {
                if (cat === 'postes') return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
                if (cat === 'cimentacion') return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
                if (cat === 'anclajes') return 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400';
                if (cat === 'marco') return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
                if (cat === 'skeleton') return 'bg-sky-500/10 border-sky-500/20 text-sky-400';
                return 'bg-teal-500/10 border-teal-500/20 text-teal-400';
              };

              const getCategoryLabel = (cat: string) => {
                if (cat === 'postes') return 'Postes Petroleros';
                if (cat === 'cimentacion') return 'Excavación / Base';
                if (cat === 'anclajes') return 'Kit de Anclajes';
                if (cat === 'marco') return 'Marco Externo';
                if (cat === 'skeleton') return 'Refuerzo Interno';
                return 'Chapas / Fijación';
              };

              return (
                <tr key={item.id} className={`hover:bg-slate-900/20 transition-colors ${isEditing ? "bg-cyan-950/20" : ""}`}>
                  
                  {/* Name column */}
                  <td className="py-3 px-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 outline-none w-full text-xs font-bold focus:border-cyan-500"
                        placeholder="Nombre descriptivo del insumo"
                      />
                    ) : (
                      <div className="font-extrabold text-slate-150 text-xs flex items-center gap-1.5">
                        {item.isCustom && <span className="text-[9.5px] bg-emerald-500/25 text-emerald-400 px-1 py-0.2 rounded font-black uppercase">Obra</span>}
                        <span>{item.name}</span>
                      </div>
                    )}
                  </td>

                  {/* Quantity and Unit */}
                  <td className="py-3 px-3 text-center font-mono">
                    {isEditing ? (
                      <div className="flex items-center gap-1 justify-center">
                        <input
                          type="number"
                          step="0.1"
                          value={editQuantity}
                          onChange={e => setEditQuantity(e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1 text-slate-100 outline-none w-14 text-center text-xs font-mono font-bold focus:border-cyan-500"
                        />
                        <input
                          type="text"
                          value={editUnit}
                          onChange={e => setEditUnit(e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-1 py-1 text-slate-400 outline-none w-10 text-center text-[10.5px] focus:border-cyan-500"
                        />
                      </div>
                    ) : (
                      <div className="text-slate-100 text-xs font-bold leading-none">
                        {item.quantity} <span className="text-[10px] text-slate-500 font-medium font-sans">{item.unit}</span>
                      </div>
                    )}
                  </td>

                  {/* Sector Category Label */}
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold leading-none ${getCategoryBadge(item.category)}`}>
                      {getCategoryLabel(item.category)}
                    </span>
                  </td>

                  {/* Render details and tolerances */}
                  <td className="py-3 px-4">
                    {isEditing ? (
                      <textarea
                        value={editDetails}
                        onChange={e => setEditDetails(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none w-full text-[11px] leading-normal font-sans min-h-[50px] resize-y focus:border-cyan-500"
                        placeholder="Detalles sobre superficie real, cortes, solapes o desperdicios de taller..."
                      />
                    ) : (
                      <div className="text-[11px] text-slate-400 leading-normal font-sans whitespace-pre-wrap max-w-sm md:max-w-md lg:max-w-xl">
                        {item.description || item.details}
                      </div>
                    )}
                  </td>

                  {/* Supplier & Notes */}
                  <td className="py-3 px-4 text-center">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editSupplier}
                        onChange={e => setEditSupplier(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 outline-none w-full text-xs text-center focus:border-cyan-500"
                        placeholder="Proveedor/Contratista"
                      />
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold leading-none inline-flex items-center ${
                        item.supplier 
                          ? "bg-slate-900 border border-slate-800 text-slate-405" 
                          : "bg-slate-900/40 border border-slate-850/60 text-slate-500 italic"
                      }`}>
                        {item.supplier || "Sin Cotizar"}
                      </span>
                    )}
                  </td>

                  {/* Actions buttons */}
                  <td className="py-3 px-4 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleSaveEdit(item.id, item.isCustom)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-2.5 py-1.5 text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                          title="Guardar modificaciones de este insumo"
                        >
                          <Save className="h-3 w-3" />
                          <span>Guardar</span>
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg p-1.5 cursor-pointer transition"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="text-cyan-400 hover:text-cyan-300 border border-cyan-500/10 hover:bg-cyan-500/5 rounded-lg px-2 py-1 text-[10.5px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                          title="Editar nombre, cantidad, tolerancias o remite"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Editar</span>
                        </button>
                        
                        <button
                          onClick={() => handleDeleteItem(item.id, item.isCustom)}
                          className="text-rose-400 hover:text-rose-350 border border-rose-500/10 hover:bg-rose-500/5 rounded-lg p-1 cursor-pointer transition-all"
                          title="Ocultar de la planilla y pliegos de taller"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </td>

                </tr>
              );
            })}

            {/* WEIGHT CONSOLIDATED TOTAL FOR THE TAB VIEW */}
            <tr className="bg-slate-950/80 font-bold border-t border-slate-850 text-slate-400">
              <td className="py-3.5 px-4 text-slate-200 font-black text-xs text-left">Resumen del Sub-Cómputo</td>
              <td className="py-3.5 px-3 text-center">-</td>
              <td className="py-3.5 px-4">-</td>
              <td className="py-3.5 px-4 text-left font-normal italic text-[11px] text-slate-500 leading-normal">
                {activeTab === 'support' 
                  ? `Peso bruto estimado de infraestructura: ` 
                  : activeTab === 'billboard' 
                  ? `Peso bruto estimado de bastidor y chapas: ` 
                  : `Peso total consolidado de cómputo siderúrgico de obra: `
                }
                <strong className="text-cyan-400 font-extrabold pr-1">
                  {activeTab === 'consolidated' ? totalGlobalWeight : currentTabWeight} kg
                </strong>
                (Calculado en base a barras nominales sin costos comerciales).
              </td>
              <td className="py-3.5 px-4 text-center text-xs font-bold text-slate-500">Peso Estimado</td>
              <td className="py-3.5 px-4 text-right text-cyan-400 font-mono font-black text-xs">
                {activeTab === 'consolidated' ? totalGlobalWeight : currentTabWeight} kg
              </td>
            </tr>

          </tbody>
        </table>
      </div>

      {/* FOOTER HIDDEN ITEMS (Allows restoring any deleted/hidden item) */}
      {deletedItems.length > 0 && (
        <div className="bg-slate-900/50 p-4 rounded-xl border border-dashed border-slate-800 text-left space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <EyeOff className="h-4 w-4" />
            <span>Insumos Ocultados del Selector Activo ({deletedItems.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {deletedItems.map(item => (
              <div 
                key={item.id} 
                className="bg-slate-950 border border-slate-850/85 rounded-lg px-2.5 py-1.5 flex items-center gap-2 text-slate-400 text-left leading-normal"
              >
                <span>{item.name}</span>
                <span className="font-mono text-[9px] text-slate-500">({item.quantity} {item.unit})</span>
                <button
                  onClick={() => handleRestoreItem(item.id)}
                  className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/15 rounded px-1.5 py-0.5 text-[10px] font-bold cursor-pointer transition-all"
                  title="Restaurar de vuelta a la planilla"
                >
                  Restaurar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER AUDITING RECONCILIATION */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/20 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
        <div className="space-y-1 max-w-2xl">
          <h4 className="font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
            <ClipboardCheck className="h-4.5 w-4.5 text-cyan-400" />
            Integridad de Cómputos bajo Normas CIRSOC
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Las modificaciones realizadas se conservan de forma persistente. Al re-escalar la cartelera en el diseñador 3D, los coeficientes de barras y placas se recalculan automáticamente manteniendo vigentes sus insumos personalizados y compras registradas.
          </p>
        </div>

        {customizedCount > 0 && (
          <button
            onClick={handleResetAllQuotes}
            className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold rounded-lg text-[10.5px] uppercase tracking-wider transition-all cursor-pointer self-start md:self-auto shrink-0 flex items-center gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restablecer Todo
          </button>
        )}
      </div>

    </div>
  );
}

export default BudgetManager;
