import React, { useState, useEffect } from 'react';
import { StructureConfig, SelectedComponent3D, MaterialItem } from '../types';
import { Anchor, HelpCircle, HardHat, Layers, Copy, Check, Info, TrendingUp, ZoomIn, ZoomOut, RotateCcw, Move, Download, FileCode } from 'lucide-react';
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
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  // Reset zoom and pan on tab changes
  useEffect(() => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  }, [activeTab]);

  const handleDownloadHTML = (onlyCopy: boolean = false) => {
    const dateStr = new Date().toLocaleDateString('es-AR');
    const colCount = config.columnCount;
    const basePlateWidth = Math.round(config.foundationWidth * 0.70 * 10); // mm
    const plateThick = config.anchorPlateThickness;
    const boltDia = config.anchorBoltDiameter;
    const totalAreaM2 = ((config.width / 100) * (config.height / 100)).toFixed(2);
    
    // Wind coefficients
    const windSpeedV = config.windSpeed ?? 160;
    const qPressure = 0.0053 * windSpeedV * windSpeedV;
    const fForceTotalKg = qPressure * Number(totalAreaM2) * 1.2;

    // Load manual overrides from local storage
    let savedEdits: Record<string, any> = {};
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("constracad_edited_materials");
      if (saved) {
        try {
          savedEdits = JSON.parse(saved);
        } catch (e) {
          console.error("Error parsing materials edits from local storage in viewer:", e);
        }
      }
    }

    let materialsListRows = '';
    let totalWeight = 0;
    
    if (activeMaterials) {
      activeMaterials.forEach((item) => {
        // Retrieve manual overrides if any
        const edit = savedEdits[item.id] || {};
        const itemName = edit.name !== undefined ? edit.name : item.name;
        const itemQty = edit.quantity !== undefined ? edit.quantity : item.quantity;
        const itemUnit = edit.unit !== undefined ? edit.unit : item.unit;
        
        let defaultDetails = '';
        if (item.id === 'mat_chapa') {
          defaultDetails = `Superficie del frente real del cartel: ${totalAreaM2} m². Cubierto por cómputo siderúrgico nominal con ${itemQty} chapas de 1.00m x 2.00m (Total cubierto: ${itemQty * 2}m² para considerar solapes, cortes y desperdicios de taller).`;
        } else if (item.id === 'mat_marco') {
          const outerPerimeter = (2 * (config.width / 100) + 2 * (config.height / 100)).toFixed(2);
          defaultDetails = `Cálculo real de marco: ${outerPerimeter} metros lineales M/R. Material cotizado equivalente a ${itemQty} barras de 6.0m de largo (Total cubierto nominal: ${itemQty * 6}m).`;
        } else if (item.id === 'mat_skeleton') {
          const r = Math.max(0, config.gridRows - 2); 
          const co = Math.max(0, config.gridCols - 2);
          const gridLen = (co * (config.height / 100) + r * (config.width / 100)).toFixed(2);
          defaultDetails = `Cálculo real de cuadrícula de refuerzo: ${gridLen} metros lineales. Material cotizado equivalente a ${itemQty} tiras de 6.0m de caño (Total nominal cubierto: ${itemQty * 6}m).`;
        } else if (item.id === 'mat_postes') {
          const colHeightTotal = ((config.clearanceHeight / 100) + (config.columnBuriedDepth / 100)) * config.columnCount;
          defaultDetails = `Cálculo real de postes tubing: ${colHeightTotal.toFixed(2)} metros lineales para ${config.columnCount} columnas. Material cotizado nominal: ${itemQty} postes enteros de taller.`;
        } else if (item.id === 'mat_cimentacion') {
          const cementVol = (config.columnCount * 0.4 * 0.4 * (config.columnBuriedDepth / 100)).toFixed(2);
          defaultDetails = `Cubicación de pozo: volumen real neto de excavación: ${cementVol} m³ de hormigón elaborado clase H21/H25 sismorresistente.`;
        } else {
          defaultDetails = item.description || '';
        }

        const itemDetails = edit.details !== undefined ? edit.details : defaultDetails;
        const itemSupplier = edit.supplier !== undefined ? edit.supplier : (item.supplier || 'Solimet S.A.');

        let estWeight = 0;
        if (item.category === 'marco') estWeight = itemQty * 3.1;
        else if (item.category === 'skeleton') estWeight = itemQty * 2.3;
        else if (item.category === 'chapa') estWeight = itemQty * 8.5;
        else if (item.category === 'postes') estWeight = itemQty * 11.5;
        else if (item.category === 'cimentacion') estWeight = itemQty * 120;
        else estWeight = itemQty * 0.4;
        totalWeight += estWeight;

        materialsListRows += `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #334155; font-weight: bold; color: #ffffff;">${itemName}</td>
            <td style="padding: 12px; border-bottom: 1px solid #334155; text-align: center; font-weight: 700; color: #38bdf8;">${itemQty} ${itemUnit}</td>
            <td style="padding: 12px; border-bottom: 1px solid #334155; color: #cbd5e1; font-size: 12.5px;">${itemDetails}</td>
            <td style="padding: 12px; border-bottom: 1px solid #334155; text-align: right; font-family: monospace; color: #94a3b8;">${Math.round(estWeight)} kg</td>
            <td style="padding: 12px; border-bottom: 1px solid #334155; font-size: 12px; color: #38bdf8; font-weight: 600; text-align: right;">${itemSupplier}</td>
          </tr>
        `;
      });
    }

    let columnSvgCenterPic = '';
    if (config.columnType === 'lattice_antenna') {
      columnSvgCenterPic = `
        <!-- Outer limits square -->
        <rect x="140" y="140" width="120" height="120" fill="none" stroke="#475569" stroke-width="1.5" stroke-dasharray="2,2" />
        <!-- Corner angles (L-shapes) -->
        <path d="M 140,154 L 140,140 L 154,140" fill="none" stroke="#22d3ee" stroke-width="5" stroke-linecap="square" />
        <path d="M 246,140 L 260,140 L 260,154" fill="none" stroke="#22d3ee" stroke-width="5" stroke-linecap="square" />
        <path d="M 140,246 L 140,260 L 154,260" fill="none" stroke="#22d3ee" stroke-width="5" stroke-linecap="square" />
        <path d="M 246,260 L 260,260 L 260,246" fill="none" stroke="#22d3ee" stroke-width="5" stroke-linecap="square" />
        <!-- Zigzag diagonals (X-brace design in center) -->
        <line x1="141" y1="141" x2="259" y2="259" stroke="#f43f5e" stroke-width="2" />
        <line x1="259" y1="141" x2="141" y2="259" stroke="#f43f5e" stroke-width="2" />
        <!-- Dimensions label -->
        <text x="200" y="275" font-family="monospace" font-size="11" fill="#38bdf8" text-anchor="middle" font-weight="extrabold">Sección Celosía (44x44 cm)</text>
      `;
    } else if (config.columnType === 'ipn') {
      columnSvgCenterPic = `
        <rect x="175" y="150" width="50" height="12" rx="1" fill="#1e293b" stroke="#2563eb" stroke-width="2" />
        <rect x="175" y="238" width="50" height="12" rx="1" fill="#1e293b" stroke="#2563eb" stroke-width="2" />
        <rect x="194" y="162" width="12" height="76" fill="#1e293b" stroke="#2563eb" stroke-width="2" />
        <text x="200" y="265" font-family="monospace" font-size="11" fill="#38bdf8" text-anchor="middle" font-weight="bold">Viga IPN 120 Doble T</text>
      `;
    } else {
      const label = config.columnType === 'round_pipe' ? 'Caño Redondo 114mm' : 'Tubo Tubing Petrolero';
      columnSvgCenterPic = `
        <circle cx="200" cy="200" r="50" fill="none" stroke="#2563eb" stroke-width="8" />
        <text x="200" y="265" font-family="monospace" font-size="11" fill="#38bdf8" text-anchor="middle" font-weight="bold">${label}</text>
      `;
    }

    let dynamicBaseplateSpecsText = '';
    const totalPernosQty = config.columnType === 'lattice_antenna' ? colCount * 16 : colCount * 4;
    const totalPlatinasQty = config.columnType === 'lattice_antenna' ? colCount * 4 : colCount;
    const totalEscuadrasQty = config.columnType === 'lattice_antenna' ? colCount * 16 : colCount * 4;

    if (config.columnType === 'lattice_antenna') {
      dynamicBaseplateSpecsText = `
        <p><strong>Configuraci&oacute;n del Kit de Anclaje de Viento:</strong></p>
        <p>• <strong>Pernos de Anclaje Suministrados en Kit:</strong> S&oacute;lo ${totalPernosQty} Pernos de alta resistencia tipo J-Bolt de &Oslash; 7/8" x 500mm.</p>
        <br/>
        <p><strong>PUNTO 2: Materiales para Fabricaci&oacute;n Propia en Taller (Especificaci&oacute;n de Dise&ntilde;o):</strong></p>
        <p>• <strong>Placas por Columna:</strong> ${totalPlatinasQty} Placas de base cuadradas de 200x200 mm cortadas de chapa estructural de ${plateThick} mm de espesor.</p>
        <p>• <strong>Rigidizadores Triangulares:</strong> ${totalEscuadrasQty} Rigidizadores triangulares soldados en escuadra para rigidizar la Torre Reticulada contra la torsi&oacute;n s&iacute;smica (espesor 9.5 mm / 3/8").</p>
      `;
    } else {
      dynamicBaseplateSpecsText = `
        <p><strong>Configuraci&oacute;n del Kit de Anclaje de Viento de Alta Resistencia:</strong></p>
        <p>• <strong>Pernos de Anclaje Suministrados en Kit:</strong> S&oacute;lo ${totalPernosQty} Pernos de alta resistencia tipo J-Bolt de de rosca &Oslash; 7/8" x 500 mm.</p>
        <br/>
        <p><strong>PUNTO 2: Materiales para Fabricaci&oacute;n Propia (Insumos Incluidos en el Listado de Materiales):</strong></p>
        <p>• <strong>Medidas de Placa Base:</strong> ${totalPlatinasQty} Placas Bases de ${basePlateWidth} mm x ${basePlateWidth} mm, con Chapa Base Pesada de ${plateThick} mm de espesor.</p>
        <p>• <strong>Escuadras de Refuerzo / Rigidizadores de Arriostramiento:</strong> ${totalEscuadrasQty} Unidades soldadas perpendicularmente al tubo tubing (medidas: 80 mm base x 160 mm altura x 9.5 mm / 3/8" espesor) para soldadura de filete continuo.</p>
      `;
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>CONSTRACAD - Ficha Tecnica de Fabricacion</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, sans-serif;
            background-color: #0f172a;
            color: #cbd5e1;
            margin: 0;
            padding: 40px 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 950px;
            margin: 0 auto;
            background-color: #1e293b;
            border-radius: 20px;
            border: 1px solid #334155;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            padding: 40px;
        }
        .header-strip {
            border-bottom: 2px solid #06b6d4;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header-title {
            font-size: 26px;
            font-weight: 800;
            margin: 0;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .header-subtitle {
            font-size: 13px;
            color: #38bdf8;
            margin: 5px 0 0 0;
            font-weight: 600;
        }
        .meta-grid {
            display: grid;
            grid-template-cols: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
            background-color: #0f172a;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #334155;
        }
        .meta-item {
            display: flex;
            flex-direction: column;
        }
        .meta-label {
            font-size: 9px;
            color: #94a3b8;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.5px;
        }
        .meta-value {
            font-size: 14px;
            font-weight: 700;
            color: #ffffff;
            margin-top: 3px;
        }
        .section-title {
            font-size: 16px;
            font-weight: 800;
            color: #38bdf8;
            border-bottom: 1px solid #475569;
            padding-bottom: 8px;
            margin-top: 35px;
            margin-bottom: 15px;
            text-transform: uppercase;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 13px;
        }
        th {
            background-color: #0f172a;
            padding: 12px;
            text-align: left;
            font-size: 11px;
            font-weight: 800;
            color: #38bdf8;
            text-transform: uppercase;
            border-bottom: 2px solid #334155;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid #334155;
        }
        .blueprint-container {
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 30px;
            background-color: #0f172a;
            border: 1px dashed #475569;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
        }
        .blueprint-specs {
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .blueprint-specs p {
            margin: 6px 0;
            font-size: 13px;
        }
        .blueprint-specs strong {
            color: #ffffff;
        }
        .footer {
            margin-top: 40px;
            border-top: 1px solid #334155;
            padding-top: 20px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
        }
        .btn-print {
            background-color: #06b6d4;
            color: #0f172a;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            float: right;
            transition: all 0.2s;
            text-transform: uppercase;
        }
        .btn-print:hover {
            background-color: #22d3ee;
        }
        @media print {
            body {
                background-color: #ffffff !important;
                color: #000000 !important;
                padding: 0;
            }
            .container {
                background-color: #ffffff !important;
                color: #000000 !important;
                border: none;
                box-shadow: none;
                padding: 0;
            }
            .section-title {
                color: #000000 !important;
                border-bottom: 2px solid #000000 !important;
            }
            td, th {
                border-bottom: 1px solid #cccccc !important;
                color: #000000 !important;
            }
            .btn-print, .no-print {
                display: none !important;
            }
            .blueprint-container {
                background-color: #ffffff !important;
                border: 2px solid #000000 !important;
            }
            .meta-grid {
                background-color: #f1f5f9 !important;
                border: 1px solid #cccccc !important;
            }
            .meta-value {
                color: #000000 !important;
            }
        }
    </style>
</head>
<body>

<div class="container">
    <div class="header-strip">
        <button class="btn-print" onclick="window.print()">Imprimir PDF / Hoja de Taller</button>
        <h1 class="header-title">📄 PLANILLA TÉCNICA DE FABRICACIÓN</h1>
        <p class="header-subtitle">TALLER MENDOZA — INFORME MECÁNICO DE KITS DE ANCLAJE Y COMPONENTES</p>
    </div>

    <div class="meta-grid">
        <div class="meta-item">
            <span class="meta-label">Fecha del Informe</span>
            <span class="meta-value">${dateStr}</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">Geometría Cartel</span>
            <span class="meta-value">${config.width / 100}m x ${config.height / 100}m (Luz ${config.clearanceHeight / 100}m)</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">Carga Crítica Viento</span>
            <span class="meta-value">${windSpeedV} km/h (Mendoza)</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">Presión Estructural</span>
            <span class="meta-value">${qPressure.toFixed(1)} kgf/m² (Empuje: ${fForceTotalKg.toFixed(0)} kg)</span>
        </div>
    </div>

    <div class="section-title">1. Plantilla de Materiales y Cómputo de Acero</div>
    <table>
        <thead>
            <tr>
                <th style="color: #38bdf8; width: 250px;">Componente de Obra</th>
                <th style="text-align: center; color: #38bdf8; width: 100px;">Cantidad</th>
                <th style="color: #38bdf8;">Detalle de Rendimiento y Cobertura (Cálculo Real vs. Material Nominal)</th>
                <th style="text-align: right; color: #38bdf8; width: 120px;">Peso Estimado</th>
                <th style="text-align: right; color: #38bdf8; width: 160px; padding-right: 15px;">Proveedor / Notas</th>
            </tr>
        </thead>
        <tbody>
            ${materialsListRows}
            <tr style="background-color: #0f172a; font-weight: 800; border-top: 2px solid #38bdf8;">
                <td style="padding: 12px; font-weight: 800; color: #ffffff;">Totales de Obra Siderometalúrgica</td>
                <td style="color: #ffffff; text-align: center;">-</td>
                <td style="color: #94a3b8; font-style: italic; font-size: 11.5px;">Materiales optimizados para zona sísmica de Mendoza s/ CIRSOC 102. Sin visualización de importes comerciales.</td>
                <td style="text-align: right; font-family: monospace; color: #38bdf8; padding: 12px;">${Math.round(totalWeight)} kg</td>
                <td style="color: #ffffff; text-align: right; padding-right: 15px;">Cómputo Certificado</td>
            </tr>
        </tbody>
    </table>

    <div class="section-title">2. Planos Técnicos y Fabricación de Bridas de Anclaje de Viento</div>
    <div class="blueprint-container">
        <div style="display: flex; justify-content: center; align-items: center; background-color: #0b1329; border-radius: 8px; padding: 15px; border: 1px solid #334155;">
            <svg width="280" height="280" viewBox="0 0 400 400" style="background-color: #0b1329;">
                <!-- Blueprint Grid Lines -->
                <defs>
                    <pattern id="whitegrid_html" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" stroke-width="0.7" />
                    </pattern>
                </defs>
                <rect width="400" height="400" fill="url(#whitegrid_html)" />
                
                <!-- Main baseplate contour -->
                <rect x="80" y="80" width="240" height="240" rx="8" fill="none" stroke="#22d3ee" stroke-width="3" />
                
                <!-- Center column cross section profile drawing -->
                ${columnSvgCenterPic}
                
                <!-- Anchor bolt holes (4 corner holes) -->
                <circle cx="110" cy="110" r="14" fill="#0f172a" stroke="#ffffff" stroke-width="2" />
                <circle cx="110" cy="110" r="4" fill="#ffffff" />
                
                <circle cx="290" cy="110" r="14" fill="#0f172a" stroke="#ffffff" stroke-width="2" />
                <circle cx="290" cy="110" r="4" fill="#ffffff" />
                
                <circle cx="110" cy="290" r="14" fill="#0f172a" stroke="#ffffff" stroke-width="2" />
                <circle cx="110" cy="290" r="4" fill="#ffffff" />
                
                <circle cx="290" cy="290" r="14" fill="#0f172a" stroke="#ffffff" stroke-width="2" />
                <circle cx="290" cy="290" r="4" fill="#ffffff" />
                
                <!-- Cartelas triangular stiffener lines -->
                <line x1="200" y1="80" x2="200" y2="150" stroke="#f43f5e" stroke-width="5" />
                <line x1="200" y1="250" x2="200" y2="320" stroke="#f43f5e" stroke-width="5" />
                <line x1="80" y1="200" x2="150" y2="200" stroke="#f43f5e" stroke-width="5" />
                <line x1="250" y1="200" x2="320" y2="200" stroke="#f43f5e" stroke-width="5" />
                
                <!-- Guidelines and dimension labels -->
                <line x1="80" y1="60" x2="320" y2="60" stroke="#94a3b8" stroke-width="1.5" />
                <line x1="80" y1="50" x2="80" y2="70" stroke="#94a3b8" stroke-width="1.5" />
                <line x1="320" y1="50" x2="320" y2="70" stroke="#94a3b8" stroke-width="1.5" />
                <text x="200" y="52" font-family="'Space Grotesk', monospace" font-size="11" fill="#22d3ee" text-anchor="middle" font-weight="900">${basePlateWidth} mm</text>
                
                <path d="M 290,110 L 330,150 L 360,150" fill="none" stroke="#94a3b8" stroke-width="1" />
                <text x="365" y="153" font-family="monospace" font-size="10" fill="#22d3ee" text-anchor="start">Perfore &Oslash;${boltDia}" J-Bolt</text>
                
                <path d="M 200,100 L 230,120 L 270,120" fill="none" stroke="#f43f5e" stroke-width="1" />
                <text x="275" y="123" font-family="monospace" font-size="9" fill="#f43f5e" text-anchor="start">Escuadra 160x80mm chapa 3/8"</text>
            </svg>
        </div>
        <div class="blueprint-specs">
            <h4 style="margin-top: 0; color: #38bdf8; font-size: 15px; text-transform: uppercase;">Especificaciones de Montaje y Soldadura:</h4>
            ${dynamicBaseplateSpecsText}
            <p>• <strong>Cimentación de Bases:</strong> Colado de hormigón elaborado tipo estructural sismorresistente clase H21/H25, vibrado mecánicamente en pozos de sección cuadrangular.</p>
            <p>• <strong>Rigidez por Viento:</strong> Las soldaduras en las baseplates deben ser continuas en filete de 6 mm con electrodo de alta penetración básica E6013 Punta Azul.</p>
            <p>• <strong>Recomendación del Taller Constracad:</strong> Roscar pernos con arandela plana de ala ancha y arandela Grower para prevenir deformación por ráfagas continuas de Zonda.</p>
        </div>
    </div>

    <!-- NEW SECTION: ESQUEMA DE FABRICACIÓN RIGIDIZADOR DE ARRIOSTRAMIENTO STIFFENER DRAWING -->
    <div class="section-title">3. EX-01: Esquema de Fabricación Escuadra / Rigidizador de Arriostramiento (Rigidizador de Brida)</div>
    <div class="blueprint-container">
        <div style="display: flex; justify-content: center; align-items: center; background-color: #0b1329; border-radius: 8px; padding: 15px; border: 1px solid #334155;">
            <svg width="280" height="280" viewBox="0 0 400 400" style="background-color: #0b1329;">
                <rect width="400" height="400" fill="url(#whitegrid_html)" />
                
                <!-- Main Gusset Shape representing actual size with holes step outs -->
                <path d="M 120,80 L 135,80 L 260,280 L 260,300 L 140,300 L 140,280 L 120,280 Z" fill="#030712" stroke="#22d3ee" stroke-width="3" />
                <path d="M 120,80 L 120,280 M 140,300 L 260,300" stroke="#f43f5e" stroke-width="3" stroke-dasharray="4,3" />
                
                <!-- Dimension Lines -->
                <line x1="90" y1="80" x2="90" y2="300" stroke="#fbbf24" stroke-width="1.5" />
                <line x1="85" y1="80" x2="95" y2="80" stroke="#fbbf24" stroke-width="1.5" />
                <line x1="85" y1="300" x2="95" y2="300" stroke="#fbbf24" stroke-width="1.5" />
                <text x="75" y="195" font-family="monospace" font-size="11" fill="#fbbf24" font-weight="bold" text-anchor="end">Alt: 160 mm</text>
                
                <line x1="120" y1="330" x2="260" y2="330" stroke="#fbbf24" stroke-width="1.5" />
                <line x1="120" y1="325" x2="120" y2="335" stroke="#fbbf24" stroke-width="1.5" />
                <line x1="260" y1="325" x2="260" y2="335" stroke="#fbbf24" stroke-width="1.5" />
                <text x="190" y="350" font-family="monospace" font-size="11" fill="#fbbf24" font-weight="bold" text-anchor="middle">Base: 80 mm</text>
                
                <!-- Guidelines and dimension labels -->
                <path d="M 128,70 L 165,50" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2" />
                <text x="170" y="48" font-family="sans-serif" font-size="9.5" fill="#38bdf8">Bisel superior 15mm (Punta roma)</text>
                
                <path d="M 125,285 L 180,265" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2" />
                <text x="185" y="263" font-family="sans-serif" font-size="9.5" fill="#38bdf8">Despunte de esquina 15x15mm (Pase corona)</text>
                
                <!-- Notes label -->
                <text x="240" y="160" font-family="sans-serif" font-size="11" fill="#22d3ee" font-weight="extrabold">Acero Estructural</text>
                <text x="240" y="178" font-family="monospace" font-size="10" fill="#cbd5e1">Espesor eP: 9.5 mm (3/8")</text>
                <text x="240" y="195" font-family="sans-serif" font-size="9" fill="#fbbf24" font-weight="bold">Corte por Plasma CNC</text>
            </svg>
        </div>
        <div class="blueprint-specs">
            <h4 style="margin-top: 0; color: #38bdf8; font-size: 15px; text-transform: uppercase;">Detalle de Fabricación de Rigidizadores en Taller:</h4>
            <p>• <strong>Ubicación Cruzada Sismorresistente:</strong> Dispuestas a 90 grados alrededor de la columna para evitar oscilaciones flectantes transversales ante ráfagas severas.</p>
            <p>• <strong>Despunte de Esquina Interior (Pase de Corona):</strong> El recorte de 15x15mm es mandatorio para evitar pintar o soldar encima de la zona térmica afectada, protegiendo la raíz de la unión brida-poste.</p>
            <p>• <strong>Biselado Técnico:</strong> Doble biselado en V en las caras de contacto para asegurar el 100% de penetración del filete de soldadura.</p>
        </div>
    </div>

    <div class="footer">
        <p>Informe Técnico Constracad S.A. Mendoza, Argentina. Desarrollado de acuerdo con la norma de vientos CIRSOC 102.</p>
        <p style="font-weight: bold; margin-top: 10px; color: #38bdf8;">Planos Certificados y Listos para Distribución de Taller &bull; Ing. Marcelo Escudero</p>
    </div>
</div>

</body>
</html>
`;

    if (onlyCopy) {
      navigator.clipboard.writeText(htmlContent);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2500);
    } else {
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `constracad_ficha_tecnica_${config.width}x${config.height}_mendoza.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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
        return activeMaterials.filter(m => m.category === 'anclajes');
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
    { value: 'foundation', label: 'Fundación', icon: '🧱' },
    { value: 'complementos', label: 'Insumos', icon: '🔩' }
  ];

  const marcoDim = getMarcoDimensions();
  const skelDim = getSkeletonDimensions();
  const colDim = getColumnDimensions();

  return (
    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800/80 shadow-lg" id="detalle-piezas-panel">
      {/* Header section */}
      <div className="border-b border-slate-800 pb-4 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="text-cyan-400 w-5.5 h-5.5" />
            Especificación de Detalles y Secciones de Materiales
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Visualiza la sección transversal, espesores reales de soldadura y forma constructiva de cada parte del cartel.
          </p>
        </div>
        
        {/* EXPORT FICHA TÉCNICA HTML BUTTONS */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => handleDownloadHTML(false)}
            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[10.5px] rounded-lg uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer border-none"
            title="Genera y descarga un archivo .html completo con plano interactivo de anclaje de viento y plantilla de materiales para el taller"
          >
            <Download className="w-3.5 h-3.5 text-emerald-200" />
            <span>Descargar Ficha HTML</span>
          </button>
          
          <button
            type="button"
            onClick={() => handleDownloadHTML(true)}
            className={`px-3 py-1.5 border font-extrabold text-[10.5px] rounded-lg uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              copiedHtml
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 animate-pulse'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-750 text-slate-350 hover:text-white'
            }`}
            title="Copia el código fuente HTML estructurado al portapapeles"
          >
            {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileCode className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{copiedHtml ? '¡Copiado!' : 'Copiar Código HTML'}</span>
          </button>
        </div>
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
                  {config.columnType === 'lattice_antenna' ? (
                    /* HIGHLY DETAILED BLUEPRINT DRAWING FOR RETICULADA LATTICE COLUMN */
                    <svg width="280" height="180" viewBox="0 0 220 110" className="bg-[#0f172a] rounded-xl border border-slate-800 p-2 shadow-inner drop-shadow-md mx-auto">
                      {/* Left view border divider */}
                      <line x1="110" y1="5" x2="110" y2="105" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
                      
                      {/* SUB-VIEW 1: RETICULADA CROSS SECTION (440x440 mm) */}
                      <g transform="translate(10, 0)">
                        {/* Outer Square indicating 44x44 cm limits */}
                        <rect x="15" y="25" width="60" height="60" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2,2" />
                        
                        {/* Corner angles (Perfiles Ángulo 1 1/2" x 1/8") representation as thick L-shapes */}
                        {/* Top Left Angle */}
                        <path d="M 15,33 L 15,25 L 23,25" fill="none" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="square" />
                        {/* Top Right Angle */}
                        <path d="M 67,25 L 75,25 L 75,33" fill="none" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="square" />
                        {/* Bottom Left Angle */}
                        <path d="M 15,67 L 15,75 L 23,75" fill="none" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="square" />
                        {/* Bottom Right Angle */}
                        <path d="M 67,75 L 75,75 L 75,67" fill="none" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="square" />
                        
                        {/* Diagonal round bars inside the square (Hierro Redondo ø12mm) */}
                        <line x1="16" y1="26" x2="74" y2="74" stroke="#f43f5e" strokeWidth="1.2" />
                        <line x1="74" y1="26" x2="16" y2="74" stroke="#f43f5e" strokeWidth="1.2" />
                        
                        {/* Dimensions label */}
                        <line x1="10" y1="25" x2="10" y2="75" stroke="#fbbf24" strokeWidth="0.8" />
                        <line x1="7" y1="25" x2="13" y2="25" stroke="#fbbf24" strokeWidth="0.8" />
                        <line x1="7" y1="75" x2="13" y2="75" stroke="#fbbf24" strokeWidth="0.8" />
                        <text x="4" y="53" fill="#fbbf24" fontSize="4.5" fontWeight="bold" textAnchor="end">44 cm</text>
                        
                        <line x1="15" y1="83" x2="75" y2="83" stroke="#fbbf24" strokeWidth="0.8" />
                        <line x1="15" y1="80" x2="15" y2="86" stroke="#fbbf24" strokeWidth="0.8" />
                        <line x1="75" y1="80" x2="75" y2="86" stroke="#fbbf24" strokeWidth="0.8" />
                        <text x="45" y="90" fill="#fbbf24" fontSize="4.5" fontWeight="bold" textAnchor="middle">44 cm</text>
                        
                        <text x="45" y="16" fill="#cbd5e1" fontSize="6.5" fontWeight="black" textAnchor="middle">SECCIÓN TORRE</text>
                        <text x="45" y="47" fill="#22d3ee" fontSize="3.8" fontWeight="bold" textAnchor="middle">Ángulos 1 1/2"</text>
                        <text x="45" y="54" fill="#f43f5e" fontSize="3.8" fontWeight="bold" textAnchor="middle">Celosía ø12mm</text>
                      </g>
                      
                      {/* SUB-VIEW 2: VERTICAL TOWER LATTICE GEOMETRY (fabricación propia) */}
                      <g transform="translate(115, 0)">
                        {/* Foundation Concrete ground line */}
                        <line x1="5" y1="85" x2="90" y2="85" stroke="#475569" strokeWidth="2" strokeDasharray="3,1" />
                        <text x="85" y="94" fill="#64748b" fontSize="4.2" textAnchor="end" fontWeight="bold">SUELO / CIMIENTO</text>
                        
                        {/* Concrete Pozo Block */}
                        <rect x="20" y="85" width="46" height="20" fill="rgba(34,211,238,0.06)" stroke="#475569" strokeWidth="0.8" strokeDasharray="1,2" />
                        
                        {/* Lattice Vertical Columns - Two main legs representation */}
                        <line x1="32" y1="5" x2="32" y2="100" stroke="#22d3ee" strokeWidth="2" />
                        <line x1="56" y1="5" x2="56" y2="100" stroke="#22d3ee" strokeWidth="2" />
                        
                        {/* Zigzag celosía bars (fabricación propia) */}
                        <polyline points="32,15 56,25 32,35 56,45 32,55 56,65 32,75 56,85 32,95" fill="none" stroke="#f43f5e" strokeWidth="1" />
                        
                        {/* Base plates and weld nodes */}
                        <rect x="28" y="81" width="8" height="2" fill="#fbbf24" />
                        <rect x="52" y="81" width="8" height="2" fill="#fbbf24" />
                        
                        <text x="48" y="16" fill="#cbd5e1" fontSize="6.5" fontWeight="extrabold" textAnchor="middle">VISTA ELEVACIÓN</text>
                        <text x="60" y="45" fill="#f43f5e" fontSize="4.1" fontWeight="bold" textAnchor="start">Celosía Zigzag</text>
                        <text x="60" y="53" fill="#22d3ee" fontSize="3.8" textAnchor="start">Patas Perfil L</text>
                        <text x="44" y="103" fill="#fbbf24" fontSize="4.5" textAnchor="middle" fontWeight="black">Bases J-Bolt</text>
                      </g>
                    </svg>
                  ) : (
                    /* EXISTING TUBING SVG DRAWING */
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
                  )}
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
                      
                      if (mat.id === 'mat_anclajes_pernos') {
                        customName = `Pernos J-Bolt de Alta Resistencia ø 7/8" (Fijación de Viento)`;
                      } else if (mat.id === 'mat_anclajes_platinas') {
                        customName = `Platinas de Acero Base de Columnas e:12mm (Fabricación Propia)`;
                      } else if (mat.id === 'mat_anclajes_escuadras') {
                        customName = `Rigidizadores Triangulares de Refuerzo e:3/8" (Fabricación Propia)`;
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
                            <span className="text-[9px] text-slate-450 uppercase font-black tracking-normal">Estado del Balance Cómputo:</span>
                            <div className="text-right space-y-0.5">
                              <span className={`text-xs font-bold ${qtyDiff > 0 ? 'text-amber-450' : qtyDiff < 0 ? 'text-emerald-450' : 'text-slate-450'}`}>
                                {baselineQty === 0 
                                  ? "NUEVA ESPECIFICACIÓN EN OBRA" 
                                  : qtyDiff === 0 
                                    ? "Cantidad Alineada con Diseño Base" 
                                    : qtyDiff > 0 
                                      ? `Requires Adicional: +${qtyDiff} ${mat.unit}`
                                      : `Ahorro en Obra: ${qtyDiff} ${mat.unit}`
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 text-[9.5px] text-slate-400 leading-relaxed font-sans space-y-1">
                      <p className="font-bold text-slate-200 uppercase flex items-center gap-1">
                        <span>📌 Declaración de Cómputo de Estructura</span>
                      </p>
                      <p>
                        • <strong>Hormigón elaborado ({config.foundationConcreteGrade}):</strong> Volumen geométrico de excavación estimado por Constracad. Se aconseja sobredimensionar un 10% por pérdidas de excavación.
                      </p>
                      <p>
                        • <strong>Siderúrgicos y bulonería:</strong> Cantidades mecánicas netas obtenidas de las longitudes y áreas configuradas en el simulador 3D para fabricación en Mendoza.
                      </p>
                      <p>
                        • <strong>Recomendación técnica:</strong> Utilice los textos técnicos de pedido generados a continuación para remitirlos a las distribuidoras siderúrgicas a fin de recibir cotizaciones formales.
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
                    Estimado/a, solicito cotización para la provisión de materiales de anclaje para cartel exterior en Mendoza:
                    <br />• Kit de Anclaje de Viento: {config.columnType === 'lattice_antenna' ? config.columnCount * 16 : config.columnCount * 4} unidades de Pernos de anclaje de alta resistencia roscados J-Bolt de ø 7/8" x 500 mm de largo en acero grado comercial ASTM A307 / F-24 (provistos con tuercas hexagonales pesadas y arandelas Grower).
                    <br />• Insumos de Acero para Platinas y Escuadras (para Fabricación Propia - planos s/ Punto 2):
                    <br />  - Placas Brida: {config.columnType === 'lattice_antenna' ? config.columnCount * 4 : config.columnCount} chapa lisa pesada de espesor 12 mm (1/2") cortada a medida.
                    <br />  - Rigidizadores / Escuadras: {config.columnType === 'lattice_antenna' ? config.columnCount * 16 : config.columnCount * 4} escuadras triangulares de refuerzo de chapa de 3/8" (9.5 mm), medidas de 80 mm de base por 160 mm de altura vertical.
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
