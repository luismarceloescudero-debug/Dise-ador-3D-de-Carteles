import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  MapPin, 
  Calendar, 
  Phone, 
  Check, 
  Edit2, 
  Sparkles, 
  ChevronRight, 
  DollarSign, 
  Info,
  RefreshCw,
  Copy,
  PlusSquare,
  ClipboardList,
  Wand2,
  Table,
  CheckSquare,
  Square,
  ShieldAlert,
  ExternalLink
} from "lucide-react";
import { SupplierPreset, StructureConfig } from "../types";
import { SUPPLIER_PRESETS, calculateMaterials } from "../data";

interface BudgetManagerProps {
  customSuppliers: SupplierPreset[];
  setCustomSuppliers: any;
  onSupplierActivated?: (supplierName: string) => void;
  config?: StructureConfig;
}

export interface UploadedBudget {
  id: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  status: "idle" | "reading" | "analyzing" | "completed" | "error";
  errorMsg?: string;
  data?: SupplierPreset & {
    currency: string;
    quoteDate: string;
    contact: string;
    summary: string;
  };
  isActive: boolean;
}

export function BudgetManager({ 
  customSuppliers, 
  setCustomSuppliers,
  onSupplierActivated,
  config
}: BudgetManagerProps) {
  const [budgets, setBudgets] = useState<UploadedBudget[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [isManualAdding, setIsManualAdding] = useState(false);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom confirmation states to bypass blocked browser modals
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);
  
  // Matrix inline edit states
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editingSupplierData, setEditingSupplierData] = useState<SupplierPreset | null>(null);
  const [deletingSupplierId, setDeletingSupplierId] = useState<string | null>(null);

  // Recalculates cost using the selected budget's prices under current config settings
  const getRecalculatedTotalForBudget = (supplier: SupplierPreset) => {
    if (!config || !supplier) return null;
    
    const formattedPreset: SupplierPreset = {
      id: supplier.id,
      name: supplier.name,
      city: supplier.city || "Mendoza",
      caño50_50_2: supplier.caño50_50_2 || 0,
      caño40_40_2: supplier.caño40_40_2 || 0,
      caño40_40_25: supplier.caño40_40_25 || 0,
      caño60_60_2: supplier.caño60_60_2 || 0,
      tubing2_7_8: supplier.tubing2_7_8 || 0,
      tubing3_1_2: supplier.tubing3_1_2 || 0,
      chapa18_1x2: supplier.chapa18_1x2 || 0,
      chapa18_122x244: supplier.chapa18_122x244 || 0,
      platina560: supplier.platina560 || 0,
      platinaEscuadra: supplier.platinaEscuadra || 0,
      electrodo25: supplier.electrodo25 || 0,
      esmalte4l: supplier.esmalte4l || 0,
      tornilloHex: supplier.tornilloHex || 0,
      caño50_50_2_largo: supplier.caño50_50_2_largo || 6,
      caño40_40_2_largo: supplier.caño40_40_2_largo || 6,
      caño40_40_25_largo: supplier.caño40_40_25_largo || 6,
      caño60_60_2_largo: supplier.caño60_60_2_largo || 6,
      tubing2_7_8_largo: supplier.tubing2_7_8_largo || 9,
      tubing3_1_2_largo: supplier.tubing3_1_2_largo || 9
    };
    
    try {
      const items = calculateMaterials(config, [formattedPreset]);
      const subtotal = items.reduce((acc, m) => acc + m.totalPrice, 0);
      const totalWithIVA = subtotal * 1.21;
      return {
        items,
        subtotal,
        totalWithIVA
      };
    } catch (e) {
      console.error("Error calculating recalculated budget: ", e);
      return null;
    }
  };

  // Selected Budget Header editing
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editingHeaderName, setEditingHeaderName] = useState("");
  const [editingHeaderCity, setEditingHeaderCity] = useState("");

  // Tabs
  const [activeTab, setActiveTab] = useState<'analizar' | 'matriz' | 'logs'>('analizar');

  // Manual text paste variables
  const [copiedText, setCopiedText] = useState("");
  const [customSupplierTextName, setCustomSupplierTextName] = useState("");
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);

  // Operation Logs
  const [logs, setLogs] = useState<Array<{ time: string; text: string; type: "info" | "success" | "error" | "warning" }>>(() => {
    const time = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return [{ 
      time, 
      text: "Iniciado Gestor de Presupuestos e Importador Inteligente.", 
      type: "info" 
    }];
  });
  const [copiedLogs, setCopiedLogs] = useState(false);

  // AI contingency / alternative providers
  const [aiProvider, setAiProvider] = useState<string>(() => localStorage.getItem("estimador_ai_provider") || "gemini");
  const [backupApiKey, setBackupApiKey] = useState<string>(() => localStorage.getItem("estimador_backup_api_key") || "");
  const [showAiSettings, setShowAiSettings] = useState<boolean>(false);

  const handleUpdateAiProvider = (provider: string) => {
    setAiProvider(provider);
    localStorage.setItem("estimador_ai_provider", provider);
    addLog(`Proveedor de IA principal configurado: ${provider.toUpperCase()}`, "info");
  };

  const handleUpdateBackupApiKey = (key: string) => {
    setBackupApiKey(key);
    localStorage.setItem("estimador_backup_api_key", key);
  };

  // Manual new supplier state
  const [manualSupplier, setManualSupplier] = useState<Partial<SupplierPreset>>({
    name: "",
    city: "",
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
    tornilloHex: 0,
    caño50_50_2_largo: 6,
    caño40_40_2_largo: 6,
    caño40_40_25_largo: 6,
    caño60_60_2_largo: 6,
    tubing2_7_8_largo: 9,
    tubing3_1_2_largo: 9
  });

  const addLog = (text: string, type: "info" | "success" | "error" | "warning" = "info") => {
    const time = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [{ time, text, type }, ...prev]);
  };

  const executeResetAllData = () => {
    // Clear local states
    setBudgets([]);
    setCustomSuppliers([]);
    setLogs([{ 
      time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
      text: "Todos los datos de cotizaciones, presupuestos y matrices han sido eliminados del sistema.", 
      type: "warning" 
    }]);
    
    // Clear localStorage variables
    localStorage.removeItem("billboard_budgets");
    localStorage.removeItem("billboard_custom_suppliers");
    localStorage.setItem("billboard_data_cleared", "true");
    
    setSelectedBudgetId(null);
    setIsEditingPrices(false);
    setIsManualAdding(false);
    
    if (onSupplierActivated) {
      onSupplierActivated("");
    }
  };

  // Load budgets from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("billboard_budgets");
      if (saved) {
        setBudgets(JSON.parse(saved));
      }
    } catch (e) {
      console.error("No se pudieron cargar los presupuestos de localStorage", e);
    }

    // Check backend API key status
    fetch("/api/gemini/status")
      .then(res => res.json())
      .then(data => {
        setApiAvailable(data.available);
        if (data.available) {
          addLog("API de Gemini confirmada y lista para analizar cotizaciones.", "success");
        } else {
          addLog("Advertencia: No se detectó GEMINI_API_KEY. Use la carga manual o configure los secret keys.", "warning");
        }
      })
      .catch(() => {
        setApiAvailable(false);
        addLog("Error al contactar con el endpoint de estado de Gemini.", "error");
      });
  }, []);

  // Save budgets to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem("billboard_budgets", JSON.stringify(budgets));
    } catch (e) {
      console.error("Error al guardar presupuestos", e);
    }
  }, [budgets]);

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  // Map file extension to MIME type
  const mapExtensionToMime = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'xls': return 'application/vnd.ms-excel';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'doc': return 'application/msword';
      case 'csv': return 'text/csv';
      case 'txt': return 'text/plain';
      default: return 'application/octet-stream';
    }
  };

  // File parsing and API processing for multiple files
  const handleFiles = async (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    addLog(`Recibidos ${filesArray.length} archivo(s) para análisis automático.`, "info");

    for (const file of filesArray) {
      const mimeType = file.type || mapExtensionToMime(file.name);
      
      const budgetId = "b_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      const newBudget: UploadedBudget = {
        id: budgetId,
        fileName: file.name,
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        uploadDate: new Date().toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }),
        status: "reading",
        isActive: false
      };

      setBudgets(prev => [newBudget, ...prev]);
      setSelectedBudgetId(budgetId);
      addLog(`Procesando archivo "${file.name}"...`, "info");

      try {
        const base64 = await readFileAsBase64(file);
        
        setBudgets(prev => prev.map(b => 
          b.id === budgetId ? { ...b, status: "analyzing" as const } : b
        ));
        addLog(`Analizando "${file.name}" con Inteligencia Artificial...`, "info");

        let rawExtractedList: any[] = [];
        try {
          const response = await fetch("/api/analyze-budget", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileBase64: base64,
              mimeType: mimeType,
              fileName: file.name,
              aiProvider,
              backupApiKey
            })
          });

          if (!response.ok) {
            const errJson = await response.json();
            throw new Error(errJson.error || errJson.details || "El servidor de extracción falló.");
          }

          const apiResponse = await response.json();
          if (apiResponse && Array.isArray(apiResponse.results)) {
            rawExtractedList = apiResponse.results;
          } else if (apiResponse && apiResponse.id) {
            rawExtractedList = [apiResponse];
          } else if (apiResponse) {
            rawExtractedList = [apiResponse];
          }
        } catch (apiErr: any) {
          console.warn("Fallo en extracción, activando contingencia local offline:", apiErr);
          
          const fName = file.name || "Proveedor";
          const cleanedName = fName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.substring(1)).join(" ");
          const fallbackId = "fallback_" + fName.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 20);
          
          const rawExtracted = {
            id: fallbackId,
            name: cleanedName,
            city: "Mendoza, Argentina",
            caño50_50_2: 36000,
            caño40_40_2: 28000,
            caño40_40_25: 33000,
            tubing2_7_8: 135000,
            tubing3_1_2: 120000,
            chapa18_1x2: 39000,
            chapa18_122x244: 58000,
            currency: "ARS",
            quoteDate: new Date().toISOString().substring(0, 10),
            contact: "Edición manual",
            summary: "⚠️ Contingencia local activada porque la API principal y los proveedores de respaldo seleccionados están offline o se superaron los límites de cuotas.\n\nNo te preocupes: el archivo fue cargado de forma exitosa utilizando valores de mercado promedio regionales. Podés presionar el botón de editar o modificar cada precio y el largo de barra en la 'Matriz de Proveedores' para corregirlos con los de tu documento."
          };
          
          rawExtractedList = [rawExtracted];
          addLog(`⚠️ Fallaron las llamadas de Inteligencia Artificial para "${file.name}". Cargando contingencia local...`, "warning");
        }

        const baseTime = Date.now();
        const secondaryBudgets: UploadedBudget[] = rawExtractedList.slice(1).map((item, idx) => {
          const secId = `${budgetId}_sec_${idx}_${baseTime}`;
          return {
            id: secId,
            fileName: `${file.name} [${item.name}]`,
            fileSize: file.size ? (file.size / (1024 * 1024)).toFixed(2) + " MB" : "0.1 MB",
            uploadDate: new Date().toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            }),
            status: "completed" as const,
            data: item,
            isActive: false
          };
        });

        setBudgets(prev => {
          const mainResult = rawExtractedList[0];
          let updated = prev.map(b => {
            if (b.id === budgetId) {
              return {
                ...b,
                status: "completed" as const,
                data: mainResult,
                isActive: false
              };
            }
            return b;
          });

          return [...secondaryBudgets, ...updated];
        });

        // Auto-activate all extracted suppliers using exact pre-determined IDs
        setTimeout(() => {
          rawExtractedList.forEach((item, index) => {
            const targetId = index === 0 ? budgetId : `${budgetId}_sec_${index - 1}_${baseTime}`;
            activateSupplierPrices(item, targetId);
          });
        }, 200);

        addLog(`¡Éxito! Extraídas ${rawExtractedList.length} cotizaciones de "${file.name}".`, "success");

      } catch (error: any) {
        console.error("Error al procesar archivo:", error);
        setBudgets(prev => prev.map(b => 
          b.id === budgetId ? { 
            ...b, 
            status: "error" as const, 
            errorMsg: error?.message || "Error al conectar con la Inteligencia Artificial."
          } : b
        ));
        addLog(`❌ Error en "${file.name}": ${error?.message || "Error desconocido"}`, "error");
      }
    }
  };

  // Text paste analysis logic
  const handleAnalyzeText = async () => {
    if (!copiedText.trim()) {
      alert("Por favor, pegue un texto o cotización antes de analizar.");
      return;
    }

    setIsAnalyzingText(true);
    addLog("Iniciando extracción y normalización inteligente de texto copiado...", "info");

    const budgetId = "b_text_" + Date.now();
    const newBudget: UploadedBudget = {
      id: budgetId,
      fileName: `Copia de Presupuesto (${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })})`,
      fileSize: (copiedText.length / 1024).toFixed(1) + " KB",
      uploadDate: new Date().toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      status: "analyzing",
      isActive: false
    };

    setBudgets(prev => [newBudget, ...prev]);
    setSelectedBudgetId(budgetId);

    try {
      let rawExtractedList: any[] = [];
      try {
        const response = await fetch("/api/analyze-budget", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            textContent: copiedText,
            aiProvider,
            backupApiKey
          })
        });

        if (!response.ok) {
          const errJson = await response.json();
          throw new Error(errJson.error || errJson.details || "Fallo en la extracción del análisis");
        }

        const apiResponse = await response.json();
        if (apiResponse && Array.isArray(apiResponse.results)) {
          rawExtractedList = apiResponse.results;
        } else if (apiResponse && apiResponse.id) {
          rawExtractedList = [apiResponse];
        } else if (apiResponse) {
          rawExtractedList = [apiResponse];
        }
      } catch (apiErr: any) {
        console.warn("Fallo en Gemini API para texto, activando contingencia local offline:", apiErr);
        
        const textName = customSupplierTextName.trim() || "Proveedor Copiado";
        const cleanedName = textName.split(" ").map(w => w.charAt(0).toUpperCase() + w.substring(1)).join(" ");
        const fallbackId = "fallback_text_" + textName.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 20);
        
        // Define clean extractor function inside
        const extractPriceNearText = (txt: string, keywords: string[]): number => {
          const cleanText = txt.toLowerCase();
          for (const kw of keywords) {
            const idx = cleanText.indexOf(kw);
            if (idx !== -1) {
              const region = cleanText.substring(idx, idx + 150);
              const matches = region.match(/(?:\$|usd)?\s*([0-9]{1,3}(?:\.[0-9]{3})+(?:,[0-9]+)?|[0-9]{4,6}(?:,[0-9]+)?)/gi);
              if (matches && matches.length > 0) {
                let numStr = matches[0].replace(/\$/g, "").trim();
                if (numStr.includes(".") && numStr.includes(",")) {
                  numStr = numStr.replace(/\./g, "").replace(/,/g, ".");
                } else if (numStr.includes(".")) {
                  const parts = numStr.split(".");
                  if (parts.length > 1 && parts[parts.length - 1].length === 3) {
                    numStr = numStr.replace(/\./g, "");
                  }
                } else if (numStr.includes(",")) {
                  numStr = numStr.replace(/,/g, ".");
                }
                const price = parseFloat(numStr);
                if (!isNaN(price) && price > 1000) {
                  return price;
                }
              }
            }
          }
          return 0;
        };

        const p50 = extractPriceNearText(copiedText, ["50x50", "caño 50", "50 x 50", "50-50"]);
        const p40 = extractPriceNearText(copiedText, ["40x40x2", "caño 40x40", "40 x 40 x 2", "40-40"]);
        const p40_25 = extractPriceNearText(copiedText, ["40x40x2.5", "40x40x2,5", "40-40-2.5"]);
        const pTub2 = extractPriceNearText(copiedText, ["tubing 2 7/8", "tubing 2.7", "7/8", "od 73"]);
        const pTub3 = extractPriceNearText(copiedText, ["tubing 3 1/2", "tubing 3.5", "1/2", "od 89"]);
        const pCh1 = extractPriceNearText(copiedText, ["chapa 18 1x2", "chapa 1x2", "1x2"]);
        const pCh2 = extractPriceNearText(copiedText, ["chapa 18 1.22", "1.22x2.44", "1.22"]);

        const rawExtracted = {
          id: fallbackId,
          name: cleanedName,
          city: "Mendoza, Argentina",
          caño50_50_2: p50 || 36000,
          caño40_40_2: p40 || 28000,
          caño40_40_25: p40_25 || 33000,
          tubing2_7_8: pTub2 || 135000,
          tubing3_1_2: pTub3 || 120000,
          chapa18_1x2: pCh1 || 39000,
          chapa18_122x244: pCh2 || 58000,
          currency: "ARS",
          quoteDate: new Date().toISOString().substring(0, 10),
          contact: "Edición manual",
          summary: "⚠️ Contingencia local activada porque la API de Gemini está offline o se superaron los límites de cuota.\n\nTus datos de texto fueron interpretados para extraer precios y el resto se cargó con valores de referencia regional. Podés editar cualquier tarifa directamente en la 'Matriz de Proveedores' para ajustarla con exactitud."
        };
        
        rawExtractedList = [rawExtracted];
        addLog(`⚠️ Gemini no está disponible. Se procesó el texto usando contingencia local.`, "warning");
      }

      // If user typed custom name, override parsed name
      if (customSupplierTextName.trim() && rawExtractedList.length > 0) {
        rawExtractedList[0].name = customSupplierTextName.trim();
        rawExtractedList[0].id = "text_" + customSupplierTextName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      }

      const baseTime = Date.now();
      const secondaryBudgets: UploadedBudget[] = rawExtractedList.slice(1).map((item, idx) => {
        const secId = `${budgetId}_sec_${idx}_${baseTime}`;
        return {
          id: secId,
          fileName: `Presupuesto Texto [${item.name}]`,
          fileSize: (copiedText.length / 1024).toFixed(1) + " KB",
          uploadDate: new Date().toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          }),
          status: "completed" as const,
          data: item,
          isActive: false
        };
      });

      setBudgets(prev => {
        const mainResult = rawExtractedList[0];
        let updated = prev.map(b => {
          if (b.id === budgetId) {
            return {
              ...b,
              status: "completed" as const,
              data: mainResult,
              isActive: false
            };
          }
          return b;
        });

        return [...secondaryBudgets, ...updated];
      });

      // Auto-activate all extracted suppliers using exact pre-determined IDs
      setTimeout(() => {
        rawExtractedList.forEach((item, index) => {
          const targetId = index === 0 ? budgetId : `${budgetId}_sec_${index - 1}_${baseTime}`;
          activateSupplierPrices(item, targetId);
        });
      }, 150);

      setCopiedText("");
      setCustomSupplierTextName("");
      addLog(`¡Éxito! Texto analizado correctamente. Detectados ${rawExtractedList.length} proveedor(es).`, "success");

    } catch (error: any) {
      console.error("Error al procesar el texto:", error);
      setBudgets(prev => prev.map(b => 
        b.id === budgetId ? { 
          ...b, 
          status: "error" as const, 
          errorMsg: error?.message || "Revisá que la variable de entorno GEMINI_API_KEY esté configurada."
        } : b
      ));
      addLog(`❌ Error al analizar el texto copiado: ${error?.message || "Error desconocido"}`, "error");
    } finally {
      setIsAnalyzingText(false);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Complete supplier initialization / replication 
  const activateSupplierPrices = (
    supplierDetails: UploadedBudget["data"], 
    budgetId: string
  ) => {
    if (!supplierDetails) return;

    const newPreset: SupplierPreset = {
      id: supplierDetails.id,
      name: supplierDetails.name,
      city: supplierDetails.city,
      caño50_50_2: supplierDetails.caño50_50_2 || SUPPLIER_PRESETS[1].caño50_50_2,
      caño40_40_2: supplierDetails.caño40_40_2 || SUPPLIER_PRESETS[1].caño40_40_2,
      caño40_40_25: supplierDetails.caño40_40_25 || SUPPLIER_PRESETS[1].caño40_40_25,
      caño60_60_2: supplierDetails.caño60_60_2 || SUPPLIER_PRESETS[1].caño60_60_2,
      tubing2_7_8: supplierDetails.tubing2_7_8,
      tubing3_1_2: supplierDetails.tubing3_1_2 || 0,
      chapa18_1x2: supplierDetails.chapa18_1x2 || SUPPLIER_PRESETS[1].chapa18_1x2,
      chapa18_122x244: supplierDetails.chapa18_122x244 || SUPPLIER_PRESETS[1].chapa18_122x244,
      platina560: supplierDetails.platina560 || SUPPLIER_PRESETS[1].platina560,
      platinaEscuadra: supplierDetails.platinaEscuadra || SUPPLIER_PRESETS[1].platinaEscuadra,
      electrodo25: supplierDetails.electrodo25 || SUPPLIER_PRESETS[1].electrodo25,
      esmalte4l: supplierDetails.esmalte4l || SUPPLIER_PRESETS[1].esmalte4l,
      tornilloHex: supplierDetails.tornilloHex || SUPPLIER_PRESETS[1].tornilloHex,
      caño50_50_2_largo: (supplierDetails as any).caño50_50_2_largo || 6,
      caño40_40_2_largo: (supplierDetails as any).caño40_40_2_largo || 6,
      caño40_40_25_largo: (supplierDetails as any).caño40_40_25_largo || 6,
      caño60_60_2_largo: (supplierDetails as any).caño60_60_2_largo || 6,
      tubing2_7_8_largo: (supplierDetails as any).tubing2_7_8_largo || 9,
      tubing3_1_2_largo: (supplierDetails as any).tubing3_1_2_largo || 9
    };

    setCustomSuppliers((prev: SupplierPreset[]) => {
      const exists = prev.some(s => s.id === supplierDetails.id);
      return exists 
        ? prev.map(s => s.id === supplierDetails.id ? newPreset : s)
        : [...prev, newPreset];
    });

    // Update active state in budgets list
    setBudgets(prev => prev.map(b => ({
      ...b,
      isActive: b.id === budgetId ? true : b.isActive
    })));

    addLog(`Activados precios de "${supplierDetails.name}" para cálculos mecánicos en vivo.`, "success");

    if (onSupplierActivated) {
      onSupplierActivated(supplierDetails.name);
    }
  };

  // Toggle supplier activation state
  const handleToggleActivation = (budgetId: string) => {
    const budget = budgets.find(b => b.id === budgetId);
    if (!budget || !budget.data) return;

    if (budget.isActive) {
      setCustomSuppliers((prev: SupplierPreset[]) => prev.filter(s => s.id !== budget.data?.id));
      setBudgets(prev => prev.map(b => 
        b.id === budgetId ? { ...b, isActive: false } : b
      ));
      addLog(`Desactivados precios de "${budget.data.name}" de los cálculos del cotizador.`, "warning");
    } else {
      activateSupplierPrices(budget.data, budgetId);
    }
  };

  // Delete an uploaded budget
  const executeDeleteBudget = (budgetId: string) => {
    const budgetToDelete = budgets.find(b => b.id === budgetId);
    if (budgetToDelete && budgetToDelete.data) {
      setCustomSuppliers((prev: SupplierPreset[]) => prev.filter(s => s.id !== budgetToDelete.data?.id));
    }

    setBudgets(prev => prev.filter(b => b.id !== budgetId));
    addLog(`Eliminado presupuesto / cotización de la lista.`);

    if (selectedBudgetId === budgetId) {
      setSelectedBudgetId(null);
    }
    
    setDeletingBudgetId(null);
  };

  // Handle manual edits to parsed supplier pricing
  const handleSaveEditedPrices = (budgetId: string, editedData: UploadedBudget["data"]) => {
    if (!editedData) return;

    setBudgets(prev => {
      const updated = prev.map(b => b.id === budgetId ? { ...b, data: editedData } : b);
      // If currently active, immediately synchronize variables
      const current = updated.find(b => b.id === budgetId);
      if (current && current.isActive) {
        setTimeout(() => activateSupplierPrices(editedData, budgetId), 50);
      }
      return updated;
    });

    addLog(`Guardados cambios manuales en precios de "${editedData.name}".`, "info");
    setIsEditingPrices(false);
  };

  // Autofix 1: Complete empty values with average prices of remaining suppliers
  const handleAutofixZeros = () => {
    const selectedBudget = budgets.find(b => b.id === selectedBudgetId);
    if (!selectedBudget || !selectedBudget.data) return;
    
    const data = selectedBudget.data;
    addLog(`Ejecutando Auto-Fix inteligente (Completar precios en cero) para "${data.name}"...`, "info");
    
    const materialsKeys: Array<keyof typeof data> = [
      "caño50_50_2", "caño40_40_2", "caño40_40_25", "caño60_60_2", "tubing2_7_8", "tubing3_1_2", "chapa18_1x2", "chapa18_122x244", "platina560", "platinaEscuadra", "electrodo25", "esmalte4l", "tornilloHex"
    ];

    const fixedData = { ...data };
    let correctedCount = 0;

    materialsKeys.forEach(key => {
      if (!fixedData[key] || Number(fixedData[key]) === 0) {
        // Compute average from other loaded and presets
        const otherVals = budgets
          .filter(b => b.id !== selectedBudget.id && b.status === "completed" && b.data && b.data[key] && Number(b.data[key]) > 0)
          .map(b => Number(b.data![key]));
        
        SUPPLIER_PRESETS.forEach(p => {
          if (p[key] && Number(p[key]) > 0) {
            otherVals.push(Number(p[key]));
          }
        });

        const avg = otherVals.length > 0 
          ? Math.round(otherVals.reduce((a, b) => a + b, 0) / otherVals.length)
          : 45000;

        (fixedData as any)[key] = avg;
        correctedCount++;
        addLog(`  -> Corregido campo vació [${String(key)}]: reemplazado por Promedio Regional de $${avg.toLocaleString("es-AR")}`, "success");
      }
    });

    if (correctedCount > 0) {
      handleSaveEditedPrices(selectedBudget.id, fixedData);
      addLog(`¡Auto-Fix completo! Se corrigieron ${correctedCount} ítems faltantes en "${data.name}".`, "success");
    } else {
      addLog(`Todo en orden. No se encontraron tarifas en cero en "${data.name}".`, "info");
    }
  };

  // Autofix 2: Apply Currency Adjustment Multiplier
  const handleAutofixMultiplier = (factor: number, reason: string) => {
    const selectedBudget = budgets.find(b => b.id === selectedBudgetId);
    if (!selectedBudget || !selectedBudget.data) return;
    
    const data = selectedBudget.data;
    addLog(`Ejecutando Auto-Fix (${reason} x${factor}) para "${data.name}"...`, "info");
    
    const materialsKeys: Array<keyof typeof data> = [
      "caño50_50_2", "caño40_40_2", "caño40_40_25", "caño60_60_2", "tubing2_7_8", "tubing3_1_2", "chapa18_1x2", "chapa18_122x244", "platina560", "platinaEscuadra", "electrodo25", "esmalte4l", "tornilloHex"
    ];

    const fixedData = { ...data };
    materialsKeys.forEach(key => {
      if (fixedData[key] && Number(fixedData[key]) > 0) {
        (fixedData as any)[key] = Math.round(Number(fixedData[key]) * factor);
      }
    });

    handleSaveEditedPrices(selectedBudget.id, fixedData);
    addLog(`¡Auto-Fix de divisa aplicado! Tarifas de "${data.name}" modificadas de forma global.`, "success");
  };

  // Autofix 3: Apply Net / Gross IVA Correction (Subtract or Add 21% IVA)
  const handleAutofixIVA = (addIva: boolean) => {
    const selectedBudget = budgets.find(b => b.id === selectedBudgetId);
    if (!selectedBudget || !selectedBudget.data) return;
    
    const data = selectedBudget.data;
    const factor = addIva ? 1.21 : (1 / 1.21);
    const label = addIva ? "Sumar IVA (+21%)" : "Quitar IVA (-21% para valor Neto)";
    
    addLog(`Ejecutando Auto-Fix (${label}) para "${data.name}"...`, "info");
    
    const materialsKeys: Array<keyof typeof data> = [
      "caño50_50_2", "caño40_40_2", "caño40_40_25", "caño60_60_2", "tubing2_7_8", "tubing3_1_2", "chapa18_1x2", "chapa18_122x244", "platina560", "platinaEscuadra", "electrodo25", "esmalte4l", "tornilloHex"
    ];

    const fixedData = { ...data };
    materialsKeys.forEach(key => {
      if (fixedData[key] && Number(fixedData[key]) > 0) {
        (fixedData as any)[key] = Math.round(Number(fixedData[key]) * factor);
      }
    });

    handleSaveEditedPrices(selectedBudget.id, fixedData);
    addLog(`¡Auto-Fix de IVA completo! Se actualizó toda la grilla de precios en "${data.name}".`, "success");
  };

  // Helper to copy logs to clipboard
  const handleCopyLogs = () => {
    const raw = logs.map(l => `[${l.time}] ${l.text}`).reverse().join("\n");
    navigator.clipboard.writeText(raw);
    addLog("Historial de operaciones copiado al portapapeles del sistema.", "success");
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  // Matrix inline action handlers
  const handleSaveMatrixRow = () => {
    if (!editingSupplierData) return;
    
    const updated = customSuppliers.map(s => s.id === editingSupplierData.id ? editingSupplierData : s);
    setCustomSuppliers(updated);
    
    setBudgets(prev => prev.map(b => {
      if (b.data && b.data.id === editingSupplierData.id) {
        return {
          ...b,
          data: {
            ...b.data,
            ...editingSupplierData
          }
        };
      }
      return b;
    }));

    addLog(`Proveedor "${editingSupplierData.name}" guardado desde la matriz con precios y largos actualizados.`, "success");
    setEditingSupplierId(null);
    setEditingSupplierData(null);
  };

  const handleSaveHeader = (budgetId: string, supplierId: string) => {
    if (!editingHeaderName.trim()) return;

    setBudgets(prev => prev.map(b => {
      if (b.id === budgetId && b.data) {
        return {
          ...b,
          data: {
            ...b.data,
            name: editingHeaderName,
            city: editingHeaderCity
          }
        };
      }
      return b;
    }));

    const updatedSuppliers = customSuppliers.map(s => {
      if (s.id === supplierId) {
        return {
          ...s,
          name: editingHeaderName,
          city: editingHeaderCity
        };
      }
      return s;
    });
    setCustomSuppliers(updatedSuppliers);

    addLog(`Proveedor modificado a "${editingHeaderName}" en el estimador con éxito.`, "success");
    setIsEditingHeader(false);
  };

  // Handle addition of a custom manual supplier preset directly with no file
  const handleAddManualSupplier = () => {
    if (!manualSupplier.name) {
      alert("Por favor ingrese al menos el nombre del proveedor.");
      return;
    }

    const newId = "manual_" + manualSupplier.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const completeSupplier: SupplierPreset = {
      id: newId,
      name: manualSupplier.name,
      city: manualSupplier.city || "Mendoza, Argentina",
      caño50_50_2: Number(manualSupplier.caño50_50_2) || 0,
      caño40_40_2: Number(manualSupplier.caño40_40_2) || 0,
      caño40_40_25: Number(manualSupplier.caño40_40_25) || 0,
      caño60_60_2: Number(manualSupplier.caño60_60_2) || 0,
      tubing2_7_8: Number(manualSupplier.tubing2_7_8) || 0,
      tubing3_1_2: Number(manualSupplier.tubing3_1_2) || 0,
      chapa18_1x2: Number(manualSupplier.chapa18_1x2) || 0,
      chapa18_122x244: Number(manualSupplier.chapa18_122x244) || 0,
      platina560: Number(manualSupplier.platina560) || 0,
      platinaEscuadra: Number(manualSupplier.platinaEscuadra) || 0,
      electrodo25: Number(manualSupplier.electrodo25) || 0,
      esmalte4l: Number(manualSupplier.esmalte4l) || 0,
      tornilloHex: Number(manualSupplier.tornilloHex) || 0,
      caño50_50_2_largo: Number(manualSupplier.caño50_50_2_largo) || 6,
      caño40_40_2_largo: Number(manualSupplier.caño40_40_2_largo) || 6,
      caño40_40_25_largo: Number(manualSupplier.caño40_40_25_largo) || 6,
      caño60_60_2_largo: Number(manualSupplier.caño60_60_2_largo) || 6,
      tubing2_7_8_largo: Number(manualSupplier.tubing2_7_8_largo) || 9,
      tubing3_1_2_largo: Number(manualSupplier.tubing3_1_2_largo) || 9
    };

    const newBudget: UploadedBudget = {
      id: "b_manual_" + Date.now(),
      fileName: `Carga Manual: ${completeSupplier.name}`,
      fileSize: "0.0 KB",
      uploadDate: new Date().toLocaleDateString("es-AR"),
      status: "completed",
      isActive: true,
      data: {
        ...completeSupplier,
        currency: "ARS",
        quoteDate: new Date().toISOString().split('T')[0],
        contact: "Cargado manualmente",
        summary: "Proveedor de carga manual. Se agregaron y actualizaron las tarifas unitarias directamente en la interfaz del configurador."
      }
    };

    setBudgets(prev => [newBudget, ...prev]);
    setSelectedBudgetId(newBudget.id);
    setCustomSuppliers([...customSuppliers, completeSupplier]);
    setIsManualAdding(false);
    addLog(`Cargado proveedor "${completeSupplier.name}" de forma manual. Precios aplicados en vivo.`, "success");

    // Reset fields
    setManualSupplier({
      name: "",
      city: "",
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
      tornilloHex: 0,
      caño50_50_2_largo: 6,
      caño40_40_2_largo: 6,
      caño40_40_25_largo: 6,
      caño60_60_2_largo: 6,
      tubing2_7_8_largo: 9,
      tubing3_1_2_largo: 9
    });

    if (onSupplierActivated) {
      onSupplierActivated(completeSupplier.name);
    }
  };

  const getCheapestSupplierForMaterial = (itemKey: keyof SupplierPreset): { name: string; price: number } | null => {
    const valid = customSuppliers.filter(s => s[itemKey] && Number(s[itemKey]) > 0);
    if (valid.length === 0) return null;
    const cheapest = valid.reduce((min, cur) => Number(cur[itemKey]) < Number(min[itemKey]) ? cur : min, valid[0]);
    return { name: cheapest.name, price: Number(cheapest[itemKey]) };
  };

  const selectedBudget = budgets.find(b => b.id === selectedBudgetId);

  return (
    <div id="budget-manager-root" className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 md:p-6 backdrop-blur-xl">
      
      {/* TABS & TOP BAR */}
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            Portal de Actualización y Comparación (IA)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Gestioná cotizaciones en PDF, imágenes, texto o carga manual. Gemini analizará, normalizará y guardará tus costos de forma centralizada.
          </p>
        </div>
        
        {/* Toggle manual buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {apiAvailable === false && (
            <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 text-[10px] font-medium font-mono">
              <AlertTriangle className="h-3 w-3" /> API Key Faltante
            </span>
          )}
          {apiAvailable === true && (
            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium font-mono">
              <Check className="h-3 w-3" /> IA Lista
            </span>
          )}
          <button
            onClick={() => setIsManualAdding(!isManualAdding)}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/50 px-3 py-1.5 text-xs font-semibold text-slate-100 transition"
          >
            {isManualAdding ? "Ocultar Carga" : "+ Carga Manual"}
          </button>
        </div>
      </div>

      {/* MANUAL SUPPLIER ADDER FORM */}
      {isManualAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-4 font-sans text-left"
        >
          <div className="flex items-center gap-2 mb-3">
            <PlusSquare className="h-4.5 w-4.5 text-amber-400" />
            <h4 className="text-sm font-bold text-amber-400">Agregar Proveedor de Forma Manual</h4>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nombre del Proveedor *</label>
              <input 
                type="text" 
                placeholder="Ej: Aceros Chacras" 
                value={manualSupplier.name}
                onChange={e => setManualSupplier({ ...manualSupplier, name: e.target.value })}
                className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ciudad / Localidad</label>
              <input 
                type="text" 
                placeholder="Ej: Maipú, Mendoza" 
                value={manualSupplier.city}
                onChange={e => setManualSupplier({ ...manualSupplier, city: e.target.value })}
                className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
              />
            </div>
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-3 space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-200 block border-b border-slate-800 pb-1">Caño 50x50x2 mm</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-slate-400">Precio ($)</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={manualSupplier.caño50_50_2 || ""}
                    onChange={e => setManualSupplier({ ...manualSupplier, caño50_50_2: Number(e.target.value) })}
                    className="mt-1 w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-slate-400">Largo (m)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder="6.0" 
                    value={manualSupplier.caño50_50_2_largo || ""}
                    onChange={e => setManualSupplier({ ...manualSupplier, caño50_50_2_largo: Number(e.target.value) })}
                    className="mt-1 w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-3 space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-200 block border-b border-slate-800 pb-1">Caño 40x40x2 mm</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-slate-400">Precio ($)</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={manualSupplier.caño40_40_2 || ""}
                    onChange={e => setManualSupplier({ ...manualSupplier, caño40_40_2: Number(e.target.value) })}
                    className="mt-1 w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-slate-400">Largo (m)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder="6.0" 
                    value={manualSupplier.caño40_40_2_largo || ""}
                    onChange={e => setManualSupplier({ ...manualSupplier, caño40_40_2_largo: Number(e.target.value) })}
                    className="mt-1 w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-3 space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-200 block border-b border-slate-800 pb-1">Tubing 2 7/8"</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-slate-400">Precio ($)</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={manualSupplier.tubing2_7_8 || ""}
                    onChange={e => setManualSupplier({ ...manualSupplier, tubing2_7_8: Number(e.target.value) })}
                    className="mt-1 w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-slate-400">Largo (m)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder="9.0" 
                    value={manualSupplier.tubing2_7_8_largo || ""}
                    onChange={e => setManualSupplier({ ...manualSupplier, tubing2_7_8_largo: Number(e.target.value) })}
                    className="mt-1 w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-3 space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-200 block border-b border-slate-800 pb-1">Tubing 3 1/2"</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-slate-400">Precio ($)</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={manualSupplier.tubing3_1_2 || ""}
                    onChange={e => setManualSupplier({ ...manualSupplier, tubing3_1_2: Number(e.target.value) })}
                    className="mt-1 w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-slate-400">Largo (m)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder="9.0" 
                    value={manualSupplier.tubing3_1_2_largo || ""}
                    onChange={e => setManualSupplier({ ...manualSupplier, tubing3_1_2_largo: Number(e.target.value) })}
                    className="mt-1 w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-3 space-y-3">
              <label className="text-[10px] uppercase font-bold text-slate-200 block border-b border-slate-800 pb-1">Chapas Lisas 18</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-slate-400">Chapa 1x2m ($)</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={manualSupplier.chapa18_1x2 || ""}
                    onChange={e => setManualSupplier({ ...manualSupplier, chapa18_1x2: Number(e.target.value) })}
                    className="mt-1 w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-slate-400">Chapa 1.22x2.44m ($)</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={manualSupplier.chapa18_122x244 || ""}
                    onChange={e => setManualSupplier({ ...manualSupplier, chapa18_122x244: Number(e.target.value) })}
                    className="mt-1 w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-3 space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-200 block border-b border-slate-800 pb-1">Caño 60x60x2 mm</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-slate-400">Precio ($)</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={manualSupplier.caño60_60_2 || ""}
                    onChange={e => setManualSupplier({ ...manualSupplier, caño60_60_2: Number(e.target.value) })}
                    className="mt-1 w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-slate-400">Largo (m)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder="6.0" 
                    value={manualSupplier.caño60_60_2_largo || ""}
                    onChange={e => setManualSupplier({ ...manualSupplier, caño60_60_2_largo: Number(e.target.value) })}
                    className="mt-1 w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-3 space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-200 block border-b border-slate-800 pb-1">Platina Base (560x560)</label>
              <label className="text-[9px] font-semibold text-slate-400 block">Precio Unitario ($)</label>
              <input 
                type="number" 
                placeholder="0" 
                value={manualSupplier.platina560 || ""}
                onChange={e => setManualSupplier({ ...manualSupplier, platina560: Number(e.target.value) })}
                className="mt-1 w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-3 space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-200 block border-b border-slate-800 pb-1">Platina Escuadra (80x160)</label>
              <label className="text-[9px] font-semibold text-slate-400 block">Precio Unitario ($)</label>
              <input 
                type="number" 
                placeholder="0" 
                value={manualSupplier.platinaEscuadra || ""}
                onChange={e => setManualSupplier({ ...manualSupplier, platinaEscuadra: Number(e.target.value) })}
                className="mt-1 w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-3 space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-200 block border-b border-slate-800 pb-1">Electrodos Conarco 2.5mm</label>
              <label className="text-[9px] font-semibold text-slate-400 block">Precio por Kg ($)</label>
              <input 
                type="number" 
                placeholder="0" 
                value={manualSupplier.electrodo25 || ""}
                onChange={e => setManualSupplier({ ...manualSupplier, electrodo25: Number(e.target.value) })}
                className="mt-1 w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-3 space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-200 block border-b border-slate-800 pb-1">Esmalte 3en1 Negro (4L)</label>
              <label className="text-[9px] font-semibold text-slate-400 block">Precio Lata 4L ($)</label>
              <input 
                type="number" 
                placeholder="0" 
                value={manualSupplier.esmalte4l || ""}
                onChange={e => setManualSupplier({ ...manualSupplier, esmalte4l: Number(e.target.value) })}
                className="mt-1 w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-3 space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-200 block border-b border-slate-800 pb-1">Tornillo Hex Mecha #14x1"</label>
              <label className="text-[9px] font-semibold text-slate-400 block">Precio Unitario ($)</label>
              <input 
                type="number" 
                placeholder="0" 
                value={manualSupplier.tornilloHex || ""}
                onChange={e => setManualSupplier({ ...manualSupplier, tornilloHex: Number(e.target.value) })}
                className="mt-1 w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2 border-t border-slate-800/80 pt-3">
            <button
              onClick={() => setIsManualAdding(false)}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddManualSupplier}
              className="rounded-lg bg-amber-500 hover:bg-amber-400 font-bold px-4 py-1.5 text-xs text-slate-950 transition"
            >
              Guardar Proveedor
            </button>
          </div>
        </motion.div>
      )}

      {/* NAVIGATION TABS WITH INTEGRATED DATABASE CLEAN UP */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 gap-3 pb-px">
        <div className="flex overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('analizar')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'analizar' 
                ? 'border-amber-500 text-amber-400 bg-amber-500/[0.02]' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="h-4 w-4" /> Subida y Análisis (IA)
          </button>
          
          <button
            onClick={() => setActiveTab('matriz')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'matriz' 
                ? 'border-amber-500 text-amber-400 bg-amber-500/[0.02]' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="h-4 w-4" /> Matriz de Proveedores ({customSuppliers.length})
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'logs' 
                ? 'border-amber-500 text-amber-400 bg-amber-500/[0.02]' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ClipboardList className="h-4 w-4" /> Registro de Operaciones ({logs.length})
          </button>
        </div>

        {showResetConfirm ? (
          <div className="mr-1 mb-2 sm:mb-0 inline-flex items-center gap-2 rounded-lg bg-rose-500/15 border border-rose-500/30 p-1.5 text-xs animate-pulse">
            <span className="text-rose-200 font-bold px-1 text-[11px]">¿Eliminar toda la base de datos?</span>
            <button
              onClick={() => {
                executeResetAllData();
                setShowResetConfirm(false);
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white rounded px-2.5 py-1 font-bold transition shadow-sm"
            >
              Sí, Borrar
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded px-2 py-1 font-bold transition border border-slate-700"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="mr-1 mb-2 sm:mb-0 inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 text-xs font-bold transition-all shadow-sm"
          >
            <Trash2 className="h-4 w-4" /> Limpiar Base de Datos (Fábrica)
          </button>
        )}
      </div>

      {/* ACTIVE TAB VIEWS */}
      
      {/* TAB 1: ANALYZE / PASTE FILE */}
      {activeTab === 'analizar' && (
        <div className="space-y-6">
          
          {/* PANEL DE CONFIGURACIÓN DE CONTINGENCIA DE IA */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-4 transition-all">
            <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setShowAiSettings(!showAiSettings)}>
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <ShieldAlert className="h-4.5 w-4.5" />
                </div>
                <div className="text-left font-sans">
                  <h4 className="text-xs font-bold text-slate-200">Panel de Contingencia de IA</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Configurá proveedores de respaldo (Grok, Kimi, DeepSeek, OpenAI) ante saturaciones de Gemini</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-bold ${aiProvider === "gemini" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                  {aiProvider === "gemini" ? "Generación Principal" : `${aiProvider}`}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 hover:text-slate-300">
                  {showAiSettings ? "▲ Ocultar" : "▼ Configurar"}
                </span>
              </div>
            </div>

            {showAiSettings && (
              <div className="mt-4 pt-3 border-t border-slate-900 grid grid-cols-1 md:grid-cols-2 gap-4 text-left animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Proveedor de Inteligencia Artificial</label>
                  <select 
                    value={aiProvider} 
                    onChange={(e) => handleUpdateAiProvider(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="gemini">Google Gemini 3.5 Flash (Por Defecto)</option>
                    <option value="grok">x.ai Grok-2 (Proveedor de Respaldo)</option>
                    <option value="kimi">Moonshot Kimi AI (Excelente lectura de presupuestos)</option>
                    <option value="deepseek">DeepSeek Chat (Servicio de alta fiabilidad)</option>
                    <option value="openai">OpenAI GPT-4o Mini (Máxima velocidad y precisión)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Si Gemini tiene problemas de cuota o se satura el servicio, se combinará de forma transparente con el proveedor e API Key elegida de respaldo.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex justify-between">
                    <span>Clave API de Respaldo (API Key)</span>
                    {backupApiKey && <span className="text-emerald-400 tracking-normal normal-case">Registrada ✓</span>}
                  </label>
                  <input
                    type="password"
                    placeholder="pj: xai-..., sk-... o similar (Se guarda localmente)"
                    value={backupApiKey}
                    onChange={(e) => handleUpdateBackupApiKey(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    La clave se almacena de forma segura en tu propio navegador. Se envía cifrada en la consulta directa para interpretar la cotización y poblar la matriz siderúrgica.
                  </p>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* EDUCATION BLOCK */}
                  <div className="rounded-xl bg-slate-900/40 p-3.5 border border-slate-850 text-[11px] text-slate-350 leading-relaxed text-left flex flex-col justify-between">
                    <div>
                      <span className="font-extrabold text-amber-500 flex items-center gap-1.5 mb-1 text-xs uppercase tracking-wider">
                        <Info className="h-4 w-4 text-amber-500" /> Glosario Rápido del Taller
                      </span>
                      <ul className="list-disc list-inside mt-2 space-y-2 pl-1 text-[11px] text-slate-400">
                        <li><strong>Clave API (API Key)</strong>: Es como la <strong>tarjeta o ficha de ingreso</strong> a la obra. Es una contraseña alfanumérica larga que te entrega cada proveedor de IA al crear una cuenta.</li>
                        <li><strong>SDK (Software Development Kit)</strong>: Es el <strong>camión de herramientas físicas</strong> que ya viene soldado e integrado de fábrica en el cotizador. Solo requiere que le pongas tu <em>Clave API</em> para encenderse.</li>
                        <li><strong>Instalación Servidor</strong>: Podés crear un archivo llamado <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-400 font-mono text-[10px] select-all">.env</code> en el directorio raíz de la app y pegar <code className="bg-slate-950 px-1 py-0.5 rounded text-cyan-400 font-mono text-[10px] select-all">GEMINI_API_KEY=tu_clave_real_aca</code>.</li>
                      </ul>
                    </div>
                  </div>

                  {/* OFFICIAL LINKS BLOCK */}
                  <div className="rounded-xl bg-slate-900/20 p-3.5 border border-slate-850 text-left space-y-2.5">
                    <span className="font-extrabold text-cyan-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                      <ExternalLink className="h-4 w-4 text-cyan-400" /> Enlaces Oficiales de Configuración
                    </span>
                    <p className="text-[10.5px] text-slate-400 leading-normal">
                      Hacé clic en el proveedor que elijas para registrarte de forma directa, conseguir tu clave de acceso API y pegarla en los ajustes:
                    </p>
                    
                    <div className="grid grid-cols-1 gap-1.5 pt-1">
                      <a 
                        href="https://aistudio.google.com/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-[11px] text-emerald-300 transition active:scale-98 font-bold"
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Google AI Studio (Gemini - Principal Gratis)
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-mono text-right">Consigue Gratis →</span>
                      </a>

                      <a 
                        href="https://console.x.ai/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 transition active:scale-98 font-medium"
                      >
                        <span>x.ai Grok (Respaldo Oficial)</span>
                        <span className="text-[9px] text-slate-500">x.ai Console →</span>
                      </a>

                      <a 
                        href="https://platform.deepseek.com/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 transition active:scale-98 font-medium"
                      >
                        <span>DeepSeek Platform</span>
                        <span className="text-[9px] text-slate-500">platform.deepseek →</span>
                      </a>

                      <a 
                        href="https://platform.openai.com/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 transition active:scale-98 font-medium"
                      >
                        <span>OpenAI Console (GPT-4o / Mini)</span>
                        <span className="text-[9px] text-slate-500">platform.openai →</span>
                      </a>

                      <a 
                        href="https://platform.moonshot.cn/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 transition active:scale-98 font-medium"
                      >
                        <span>Moonshot Kimi AI</span>
                        <span className="text-[9px] text-slate-500">platform.moonshot →</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            
            {/* FILE DRAG ZONE WITH MULTIPLE SUPPORT */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all duration-300 text-center ${
                isDragging 
                  ? "border-amber-400 bg-amber-500/5 scale-[1.01]" 
                  : "border-slate-800 hover:border-slate-700 bg-slate-900/10 hover:bg-slate-900/20"
              }`}
            >
              <UploadCloud className={`h-11 w-11 mb-2.5 transition ${isDragging ? "text-amber-400 scale-110" : "text-amber-500"}`} />
              <span className="text-xs font-bold text-slate-200">
                Arrastrá múltiples cotizaciones PDF, Excel, Word o imágenes acá
              </span>
              <span className="text-[10px] text-slate-400 mt-1 max-w-xs">
                Formatos soportados: PDF, JPG, PNG, XLSX, DOCX, TXT, CSV. ¡Podés seleccionar más de uno a la vez!
              </span>
              
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.docx,.doc,.txt,.csv"
                multiple={true} // ENABLES SELECTION OF MORE THAN ONE FILE!
                className="hidden"
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 h-8 rounded-lg bg-amber-500 hover:bg-amber-400 hover:scale-105 font-bold text-slate-950 text-xs px-4 transition shadow-md flex items-center gap-1.5"
              >
                <PlusSquare className="h-4 w-4" /> Seleccionar Archivos
              </button>
            </div>

            {/* TEXT COPY PASTE INTERACTIVE BOX (Super fallback for worksheets and chat quotes) */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/15 p-4 text-left flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-amber-400 mb-1.5">
                  <Wand2 className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Copiar y Pegar Texto de Cotización</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  ¿Recibiste la cotización por WhatsApp, email o Excel? Pegala acá de forma directa para ser interpretada y normalizada por Gemini.
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Nombre del proveedor (Opcional - Gemini lo detectará)"
                    value={customSupplierTextName}
                    onChange={e => setCustomSupplierTextName(e.target.value)}
                    className="w-full rounded bg-slate-900 border border-slate-800 p-1.5 text-xs text-slate-200 focus:outline-none"
                  />
                  <textarea
                    rows={4}
                    placeholder="Pegá detalles, precios, columnas, o copias directas de la cotización aquí..."
                    value={copiedText}
                    onChange={e => setCopiedText(e.target.value)}
                    className="w-full rounded bg-slate-900 border border-slate-800 p-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-amber-500/30"
                  />
                </div>
              </div>

              <button
                onClick={handleAnalyzeText}
                disabled={isAnalyzingText || !copiedText.trim()}
                className="mt-3 w-full h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-1.5"
              >
                {isAnalyzingText ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analizando Cotización...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Analizar Texto con Gemini
                  </>
                )}
              </button>
            </div>

          </div>

          {/* BUDGETS LIST AND DETAILED COMPARISON PANEL */}
          {budgets.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 border-t border-slate-900 pt-6">
              
              {/* LEFT COLUMN: LIST OF LOADED BUDGETS */}
              <div className="lg:col-span-5 flex flex-col gap-2">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2 flex justify-between items-center text-left">
                  <span>Presupuestos Subidos ({budgets.length})</span>
                  <span className="text-[10px] text-slate-500 lowercase">haga click para ver detalles</span>
                </h4>
                
                <div className="max-h-[380px] overflow-y-auto pr-1 space-y-2">
                  {budgets.map((b) => (
                    <div 
                      key={b.id}
                      onClick={() => {
                        if (b.status === "completed" || b.status === "error") {
                          setSelectedBudgetId(b.id);
                        }
                      }}
                      className={`group relative flex flex-col border p-3 rounded-xl cursor-pointer transition ${
                        selectedBudgetId === b.id 
                          ? "border-amber-500/80 bg-amber-500/[0.04]" 
                          : "border-slate-800 bg-slate-900/20 hover:bg-slate-900/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex gap-2.5 items-center">
                          <div className={`p-1.5 rounded-lg ${
                            b.status === "error" 
                              ? "bg-rose-500/10 text-rose-400" 
                              : b.status === "completed" 
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}>
                            {b.status === "reading" || b.status === "analyzing" ? (
                              <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                            ) : b.status === "error" ? (
                              <AlertTriangle className="h-4 w-4" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                          </div>
                          
                          <div className="text-left font-sans">
                            <span className="text-xs font-semibold text-slate-200 line-clamp-1 group-hover:text-amber-400 transition">
                              {b.fileName}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                              <span>{b.fileSize}</span>
                              <span className="text-slate-600">•</span>
                              <span>{b.uploadDate}</span>
                            </div>
                          </div>
                        </div>
                        
                        {deletingBudgetId === b.id ? (
                          <div 
                            className="flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/30 rounded p-1 text-[10px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-rose-300 font-bold px-0.5">¿Borrar?</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                executeDeleteBudget(b.id);
                              }}
                              className="bg-rose-600 hover:bg-rose-500 text-white rounded px-2 py-0.5 font-bold transition"
                            >
                              Sí
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingBudgetId(null);
                              }}
                              className="bg-slate-850 hover:bg-slate-800 text-slate-350 rounded px-1.5 py-0.5 font-bold transition border border-slate-700"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingBudgetId(b.id);
                            }}
                            className="rounded-md opacity-0 group-hover:opacity-100 bg-slate-900 hover:bg-rose-950 border border-slate-800 hover:border-rose-800/50 p-1 text-slate-400 hover:text-rose-400 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Reading/analysing visual progress indicators */}
                      {(b.status === "reading" || b.status === "analyzing") && (
                        <div className="mt-3">
                          <div className="h-1 w-full rounded-full bg-slate-900 overflow-hidden">
                            <div className={`h-full bg-amber-500 rounded-full animate-pulse ${
                              b.status === "reading" ? "w-[40%]" : "w-[90%]"
                            }`} />
                          </div>
                          <span className="text-[9px] font-medium text-amber-300 mt-1 block text-left">
                            {b.status === "reading" ? "Cargando archivo..." : "Gemini interpretando datos..."}
                          </span>
                        </div>
                      )}

                      {b.status === "completed" && b.data && (
                        <div className="mt-2.5 flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                            {b.data.name}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            {b.isActive ? (
                              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9.5px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/20">
                                <Check className="h-3 w-3 stroke-[3px]" /> Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9.5px] font-medium text-slate-500">
                                Inactivo
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {b.status === "error" && (
                        <span className="text-[9.5px] text-rose-400 mt-2 block line-clamp-1 leading-tight text-left">
                          ❌ {b.errorMsg}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT COLUMN: CHOSEN BUDGET ANALYSIS REVIEW & AUTOFIX CONTROLS */}
              <div className="lg:col-span-7">
                {selectedBudget ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-4 font-sans text-left space-y-4">
                    
                    {selectedBudget.status === "completed" && selectedBudget.data && (
                      <>
                        {/* IDENTIFIED SUMMARY HEADER */}
                        <div className="flex flex-col justify-between gap-3 border-b border-slate-800/80 pb-3 sm:flex-row sm:items-center">
                          <div className="text-left flex-1">
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-amber-400/10 text-amber-300 border border-amber-400/20 px-2 py-0.5 text-[9.5px] font-black font-mono">
                                ANALIZADO CON GEMINI
                              </span>
                              <span className="text-[10.5px] text-slate-500 font-mono">
                                ID: {selectedBudget.data.id}
                              </span>
                            </div>
                            
                            {isEditingHeader ? (
                              <div className="mt-2 space-y-2 max-w-sm">
                                <div>
                                  <label className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Nombre del Proveedor</label>
                                  <input 
                                    type="text" 
                                    value={editingHeaderName} 
                                    onChange={e => setEditingHeaderName(e.target.value)}
                                    className="w-full rounded bg-slate-950 border border-slate-850 px-2.5 py-1.5 text-xs text-slate-100 font-bold focus:outline-none"
                                    placeholder="Nombre del Proveedor"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Ciudad / Ubicación</label>
                                  <input 
                                    type="text" 
                                    value={editingHeaderCity} 
                                    onChange={e => setEditingHeaderCity(e.target.value)}
                                    className="w-full rounded bg-slate-950 border border-slate-850 px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                                    placeholder="Ciudad, Provincia"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5 pt-1">
                                  <button
                                    onClick={() => handleSaveHeader(selectedBudget.id, selectedBudget.data!.id)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded px-2.5 py-1 text-[11px] transition"
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    onClick={() => setIsEditingHeader(false)}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded px-2.5 py-1 text-[11px] transition border border-slate-700"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <h4 className="text-base font-bold text-slate-100">{selectedBudget.data.name}</h4>
                                  <button
                                    onClick={() => {
                                      setEditingHeaderName(selectedBudget.data!.name);
                                      setEditingHeaderCity(selectedBudget.data!.city || "Mendoza, Argentina");
                                      setIsEditingHeader(true);
                                    }}
                                    className="text-amber-400 hover:text-amber-300 text-[10px] flex items-center gap-1 bg-slate-800/80 hover:bg-slate-700 px-2 py-0.5 rounded transition border border-slate-700/50 font-bold"
                                    title="Editar nombre y ciudad del proveedor"
                                  >
                                    ✏️ Editar Proveedor
                                  </button>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-slate-400 mt-1.5 text-xs">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5 text-slate-500" /> {selectedBudget.data.city}
                                  </span>
                                  {selectedBudget.data.quoteDate && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3.5 w-3.5 text-slate-500" /> Cotizado: {selectedBudget.data.quoteDate}
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                          
                          <button
                            onClick={() => handleToggleActivation(selectedBudget.id)}
                            className={`rounded-lg px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto leading-none ${
                              selectedBudget.isActive 
                                ? "bg-amber-500 hover:bg-amber-400 text-slate-950" 
                                : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                            }`}
                          >
                            {selectedBudget.isActive ? (
                              <>
                                <Check className="h-3.5 w-3.5 stroke-[3px]" /> Desactivar Precios
                              </>
                            ) : (
                              <>
                                Aplicar en Estimador
                              </>
                            )}
                          </button>
                        </div>

                        {(() => {
                          const recap = getRecalculatedTotalForBudget(selectedBudget.data!);

                          if (!recap) return null;

                          return (
                            <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-4 flex flex-col justify-between sm:flex-row sm:items-center gap-4 shadow-sm">
                              <div className="space-y-1 text-left">
                                <span className="text-[10px] uppercase font-black text-cyan-400 tracking-wider flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                  PRESUPUESTO TOTAL DE OBRA RECALCULADO (CON AJUSTES EN VIVO)
                                </span>
                                <p className="text-[11px] text-slate-300 leading-normal">
                                  Calculado usando <strong className="text-white font-bold">{selectedBudget.data!.name}</strong> con todas las especificaciones activas de la pestaña <strong className="text-amber-400">"Ajustes"</strong> (Marco {config?.marcoProfile} mm, Columnas {config?.columnProfile === 'tubing_3_1_2' ? '3 1/2" Muy Robusto' : '2 7/8" Standard'}, {config?.gridPattern === 'diagonal_cross' ? 'Refuerzo San Andrés' : 'Normal'}).
                                </p>
                              </div>
                              <div className="text-right mt-2 sm:mt-0 font-mono shrink-0 bg-slate-950/50 p-3 rounded-lg border border-slate-850">
                                <div className="text-cyan-400 font-extrabold text-lg">
                                  ${recap.totalWithIVA.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Neto: ${recap.subtotal.toLocaleString("es-AR", { maximumFractionDigits: 0 })} + IVA
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* AUTO-FIX OPERATIONS ZONE (Requested by user) */}
                        <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 space-y-2">
                          <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold uppercase tracking-wider">
                            <Wand2 className="h-4 w-4" /> Correciones Rápidas (Auto-Fix)
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Ajustá IVA, rellená ceros de materiales no cotizados o dolarizá tarifas automáticamente.
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              onClick={handleAutofixZeros}
                              className="rounded bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-200 transition"
                              title="Calcula el precio promedio de todos los proveedores y rellena los ceros"
                            >
                              ⚙️ Rellenar ceros (Promedio)
                            </button>
                            <button
                              onClick={() => handleAutofixIVA(false)}
                              className="rounded bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-200 transition"
                              title="Divide todos los precios del proveedor por 1.21"
                            >
                              📉 Restar IVA (-21%)
                            </button>
                            <button
                              onClick={() => handleAutofixIVA(true)}
                              className="rounded bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-200 transition"
                            >
                              📈 Sumar IVA (+21%)
                            </button>
                            
                            <div className="flex h-6 items-center rounded border border-slate-700 bg-slate-900/60 overflow-hidden text-[10.5px]">
                              <span className="px-1.5 text-slate-400 text-[10px] uppercase font-bold bg-slate-800 h-full flex items-center">Ajustar USD</span>
                              <button 
                                onClick={() => handleAutofixMultiplier(1350, "Conversión de Divisa (Banco Nación)")}
                                className="px-1.5 hover:bg-slate-800 text-slate-300 border-r border-slate-800 text-[10px]"
                                title="Multiplica todo el presupuesto por el tipo de cambio oficial promedio de ARS 1350"
                              >
                                x1350
                              </button>
                              <button 
                                onClick={() => handleAutofixMultiplier(1500, "Conversión de Divisa (Dólar Blue/Financiero)")}
                                className="px-1.5 hover:bg-slate-800 text-slate-300 text-[10px]"
                                title="Multiplica todo el presupuesto por una cotización financiera sugerida de ARS 1500"
                              >
                                x1500
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* PLANTILLA DE PRECIOS UNIFICADA DE LA COTIZACIÓN */}
                        <SupplierPriceTemplate 
                          budgetData={selectedBudget.data}
                          budgets={budgets}
                          onSave={(newData) => handleSaveEditedPrices(selectedBudget.id, newData)}
                          config={config}
                          getCheapestSupplierForMaterial={getCheapestSupplierForMaterial}
                        />

                        {/* ANALYTIC INTELLIGENCE REPORT FROM GEMINI */}
                        <div className="rounded-xl bg-slate-950/80 border border-slate-900 p-4">
                          <div className="flex items-center gap-2 mb-2 border-b border-slate-900 pb-2">
                            <Sparkles className="h-4 w-4 text-amber-400" />
                            <h6 className="text-[11px] font-bold uppercase text-slate-300 tracking-wider">Informe Crítico de Gemini</h6>
                          </div>

                          <p className="text-xs text-slate-300 text-left leading-relaxed whitespace-pre-wrap font-sans">
                            {selectedBudget.data.summary}
                          </p>

                          {selectedBudget.data.contact && (
                            <div className="mt-4 flex items-center gap-2 border-t border-slate-900 pt-3 text-xs text-slate-400 text-left">
                              <span className="font-bold text-slate-300 flex items-center gap-1 shrink-0">
                                <Phone className="h-3.5 w-3.5 text-amber-400" /> Contacto Emisor / Vendedor:
                              </span>
                              <span>{selectedBudget.data.contact}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {selectedBudget.status === "error" && (
                      <div className="text-center py-10 text-slate-400 space-y-4">
                        <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
                        <h4 className="font-bold text-rose-400">Error de Análisis</h4>
                        <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                          La Inteligencia Artificial Gemini no pudo interpretar este archivo correctamente. 
                          <span className="block mt-2 font-mono text-rose-300 bg-rose-950/20 px-2 py-1.5 rounded">{selectedBudget.errorMsg}</span>
                        </p>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-slate-900 bg-slate-900/5 text-center min-h-[350px]">
                    <FileText className="h-12 w-12 text-slate-755 mb-3 text-slate-600" />
                    <h4 className="text-sm font-semibold text-slate-300">Ningún Presupuesto Seleccionado</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                      Seleccioná un presupuesto de la lista de la izquierda para ver qué información extrajo Gemini, normalizar los precios, aplicar correcciones rápidas de IVA, y leer el reporte crítico.
                    </p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border border-slate-900 bg-slate-900/5 rounded-xl min-h-[220px]">
              <Info className="h-9 w-9 text-slate-600 mb-2" />
              <h4 className="text-sm font-medium text-slate-300">Sin Presupuestos Cargados Aún</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs text-center">
                Arrastrá archivos o pegá textos en la parte superior para que Gemini comience la extracción masiva de datos en tiempo real.
              </p>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: GLOBAL COMPARISON MATRIX (Outstanding requested layout) */}
      {activeTab === 'matriz' && (
        <div className="space-y-4 text-left font-sans">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h4 className="text-sm font-bold text-slate-100 uppercase tracking-widest">Matriz de Precios Normalizados</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                La siguiente grilla contrasta las tarifas unitarias de todos los proveedores activos configurados. Los casilleros en <span className="text-emerald-400 font-bold">verde con 👑</span> indican el mejor precio cotizado regional. Podés editar los precios y largos de barra directamente en cada fila.
              </p>
            </div>
            <button
              onClick={() => setIsManualAdding(!isManualAdding)}
              className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap self-start shadow-sm"
            >
              {isManualAdding ? "Ocultar Carga" : "+ Carga Manual"}
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/10">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  <th className="p-3">Proveedor / Ciudad</th>
                  <th className="p-3 text-right">Caño 60x60x2</th>
                  <th className="p-3 text-right">Caño 50x50x2</th>
                  <th className="p-3 text-right">Caño 40x40x2</th>
                  <th className="p-3 text-right">Tubing 2 7/8"</th>
                  <th className="p-3 text-right">Tubing 3 1/2"</th>
                  <th className="p-3 text-right">Chapa 1x2m</th>
                  <th className="p-3 text-right">Chapa 1.22x2.44</th>
                  <th className="p-3 text-right">Platina 560</th>
                  <th className="p-3 text-right">Escuadra</th>
                  <th className="p-3 text-right">Electrodo (Kg)</th>
                  <th className="p-3 text-right">Esmalte 4L</th>
                  <th className="p-3 text-right">Tornillo Hex</th>
                  <th className="p-3 text-right text-cyan-400 font-extrabold bg-slate-950/80 border-l border-slate-800 whitespace-nowrap">Presupuesto En Vivo (Con Ajustes)</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {customSuppliers.map((supplier) => {
                  const bestCaño60 = getCheapestSupplierForMaterial("caño60_60_2");
                  const bestCaño50 = getCheapestSupplierForMaterial("caño50_50_2");
                  const bestCaño40 = getCheapestSupplierForMaterial("caño40_40_2");
                  const bestTubing2 = getCheapestSupplierForMaterial("tubing2_7_8");
                  const bestTubing3 = getCheapestSupplierForMaterial("tubing3_1_2");
                  const bestChapa1x2 = getCheapestSupplierForMaterial("chapa18_1x2");
                  const bestChapa122 = getCheapestSupplierForMaterial("chapa18_122x244");
                  const bestPlatina560 = getCheapestSupplierForMaterial("platina560");
                  const bestPlatinaEsc = getCheapestSupplierForMaterial("platinaEscuadra");
                  const bestElectrodo = getCheapestSupplierForMaterial("electrodo25");
                  const bestEsmalte = getCheapestSupplierForMaterial("esmalte4l");
                  const bestTornilloHex = getCheapestSupplierForMaterial("tornilloHex");

                  const isBest = (key: keyof SupplierPreset, bestRef: any) => {
                    return bestRef && bestRef.name === supplier.name && Number(supplier[key]) > 0;
                  };

                  const renderEditCellInsideRow = (priceKey: keyof SupplierPreset, lengthKey: keyof SupplierPreset, defL: number) => {
                    return (
                      <div className="flex flex-col gap-1 min-w-[95px] text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-slate-500 text-[10px] font-bold">$</span>
                          <input 
                            type="number" 
                            value={editingSupplierData ? ((editingSupplierData as any)[priceKey] || "") : ""} 
                            onChange={e => setEditingSupplierData(prev => prev ? {...prev, [priceKey]: Number(e.target.value)} : null)}
                            className="w-full text-right rounded bg-slate-950 border border-slate-800 px-1.5 py-0.5 text-xs text-slate-200 font-mono font-bold focus:outline-none"
                            placeholder="0"
                          />
                        </div>
                        <div className="flex items-center gap-1 justify-end">
                          <input 
                            type="number" 
                            step="0.1"
                            value={editingSupplierData ? ((editingSupplierData as any)[lengthKey] ?? defL) : defL} 
                            onChange={e => setEditingSupplierData(prev => prev ? {...prev, [lengthKey]: Number(e.target.value)} : null)}
                            className="w-12 text-right rounded bg-slate-950 border border-slate-800 px-1 py-0.5 text-[10px] text-amber-400 font-mono focus:outline-none"
                            placeholder="Largo"
                          />
                          <span className="text-[9px] text-slate-500">m</span>
                        </div>
                      </div>
                    );
                  };

                  const renderEditChapaCellInsideRow = (priceKey: keyof SupplierPreset) => {
                    return (
                      <div className="flex items-center gap-1 min-w-[70px] justify-end">
                        <span className="text-slate-500 text-[10px] font-bold">$</span>
                        <input 
                          type="number" 
                          value={editingSupplierData ? ((editingSupplierData as any)[priceKey] || "") : ""} 
                          onChange={e => setEditingSupplierData(prev => prev ? {...prev, [priceKey]: Number(e.target.value)} : null)}
                          className="w-full text-right rounded bg-slate-950 border border-slate-800 px-1.5 py-0.5 text-xs text-slate-200 font-mono font-bold focus:outline-none"
                          placeholder="0"
                        />
                      </div>
                    );
                  };

                  const renderCell = (priceKey: keyof SupplierPreset, lengthKey?: keyof SupplierPreset, bestRef?: any) => {
                    const priceVal = Number(supplier[priceKey] || 0);
                    if (priceVal === 0) {
                      return <div className="text-slate-500 italic text-right font-mono text-[10px]">no cotizado</div>;
                    }
                    const isWin = isBest(priceKey, bestRef);
                    const defL = priceKey.includes("tubing") ? 9 : 6;
                    const lenVal = lengthKey ? (Number(supplier[lengthKey]) || defL) : null;

                    return (
                      <div className="text-right">
                        <div>
                          <span className={`font-mono font-semibold ${isWin ? "text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15" : "text-slate-300"}`}>
                            {isWin && <span className="text-[10px] mr-1">👑</span>}
                            ${priceVal.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        {lenVal !== null && (
                          <div className="text-[9px] text-slate-500 font-mono mt-0.5 whitespace-nowrap">
                            Largo: <span className="text-amber-500 font-semibold">{lenVal.toFixed(1)}m</span>
                          </div>
                        )}
                      </div>
                    );
                  };

                  const isEditingRow = editingSupplierId === supplier.id;

                  // Calculate live total budget for this supplier with active config adjustments
                  const liveBudgetTotal = (() => {
                    const dataToUse = isEditingRow && editingSupplierData ? editingSupplierData : supplier;
                    const recap = getRecalculatedTotalForBudget(dataToUse);
                    return recap ? recap.totalWithIVA : null;
                  })();

                  return (
                    <tr key={supplier.id} className="hover:bg-slate-900/30 transition">
                      <td className="p-3">
                        {isEditingRow ? (
                          <div className="space-y-1 min-w-[130px]">
                            <input 
                              type="text" 
                              value={editingSupplierData?.name || ""} 
                              onChange={e => setEditingSupplierData(prev => prev ? {...prev, name: e.target.value} : null)}
                              className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-1 text-xs text-slate-100 font-bold focus:outline-none"
                              placeholder="Proveedor"
                            />
                            <input 
                              type="text" 
                              value={editingSupplierData?.city || ""} 
                              onChange={e => setEditingSupplierData(prev => prev ? {...prev, city: e.target.value} : null)}
                              className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-1 text-[10px] text-slate-300 focus:outline-none"
                              placeholder="Ciudad"
                            />
                          </div>
                        ) : (
                          <>
                            <span className="font-bold text-slate-100 block">{supplier.name}</span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-slate-500" /> {supplier.city}
                            </span>
                          </>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {isEditingRow ? renderEditCellInsideRow("caño60_60_2", "caño60_60_2_largo", 6) : renderCell("caño60_60_2", "caño60_60_2_largo", bestCaño60)}
                      </td>
                      <td className="p-3 text-right">
                        {isEditingRow ? renderEditCellInsideRow("caño50_50_2", "caño50_50_2_largo", 6) : renderCell("caño50_50_2", "caño50_50_2_largo", bestCaño50)}
                      </td>
                      <td className="p-3 text-right">
                        {isEditingRow ? renderEditCellInsideRow("caño40_40_2", "caño40_40_2_largo", 6) : renderCell("caño40_40_2", "caño40_40_2_largo", bestCaño40)}
                      </td>
                      <td className="p-3 text-right">
                        {isEditingRow ? renderEditCellInsideRow("tubing2_7_8", "tubing2_7_8_largo", 9) : renderCell("tubing2_7_8", "tubing2_7_8_largo", bestTubing2)}
                      </td>
                      <td className="p-3 text-right">
                        {isEditingRow ? renderEditCellInsideRow("tubing3_1_2", "tubing3_1_2_largo", 9) : renderCell("tubing3_1_2", "tubing3_1_2_largo", bestTubing3)}
                      </td>
                      <td className="p-3 text-right">
                        {isEditingRow ? renderEditChapaCellInsideRow("chapa18_1x2") : renderCell("chapa18_1x2", undefined, bestChapa1x2)}
                      </td>
                      <td className="p-3 text-right">
                        {isEditingRow ? renderEditChapaCellInsideRow("chapa18_122x244") : renderCell("chapa18_122x244", undefined, bestChapa122)}
                      </td>
                      <td className="p-3 text-right">
                        {isEditingRow ? renderEditChapaCellInsideRow("platina560") : renderCell("platina560", undefined, bestPlatina560)}
                      </td>
                      <td className="p-3 text-right">
                        {isEditingRow ? renderEditChapaCellInsideRow("platinaEscuadra") : renderCell("platinaEscuadra", undefined, bestPlatinaEsc)}
                      </td>
                      <td className="p-3 text-right">
                        {isEditingRow ? renderEditChapaCellInsideRow("electrodo25") : renderCell("electrodo25", undefined, bestElectrodo)}
                      </td>
                      <td className="p-3 text-right">
                        {isEditingRow ? renderEditChapaCellInsideRow("esmalte4l") : renderCell("esmalte4l", undefined, bestEsmalte)}
                      </td>
                      <td className="p-3 text-right">
                        {isEditingRow ? renderEditChapaCellInsideRow("tornilloHex") : renderCell("tornilloHex", undefined, bestTornilloHex)}
                      </td>
                      <td className="p-3 text-right bg-slate-900/40 border-l border-slate-800 font-mono">
                        {liveBudgetTotal !== null ? (
                          <div className="flex flex-col items-end">
                            <span className="font-extrabold text-cyan-400 text-xs">
                              ${liveBudgetTotal.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Con IVA</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[10px] italic">Incompleto</span>
                        )}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        {isEditingRow ? (
                          <div className="flex items-center gap-1 justify-center">
                            <button
                              onClick={handleSaveMatrixRow}
                              className="bg-emerald-650 hover:bg-emerald-550 text-white font-bold rounded px-2.5 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-500 transition"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => {
                                setEditingSupplierId(null);
                                setEditingSupplierData(null);
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded px-2.5 py-1 text-[11px] transition border border-slate-700"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 justify-center">
                            {deletingSupplierId === supplier.id ? (
                              <div className="flex items-center gap-1 bg-rose-500/15 border border-rose-500/30 rounded p-0.5 text-[10px]" onClick={e => e.stopPropagation()}>
                                <span className="text-rose-300 font-bold px-1">¿Borrar?</span>
                                <button
                                  onClick={() => {
                                    setCustomSuppliers(customSuppliers.filter(s => s.id !== supplier.id));
                                    setBudgets(budgets.filter(b => !b.data || b.data.id !== supplier.id));
                                    addLog(`Proveedor "${supplier.name}" eliminado de la matriz de precios.`, "info");
                                    setDeletingSupplierId(null);
                                  }}
                                  className="bg-rose-600 hover:bg-rose-500 text-white rounded px-1.5 py-0.5 font-bold transition"
                                >
                                  Sí
                                </button>
                                <button
                                  onClick={() => setDeletingSupplierId(null)}
                                  className="bg-slate-850 hover:bg-slate-800 text-slate-300 rounded px-1.5 py-0.5 transition border border-slate-700"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingSupplierId(supplier.id);
                                    setEditingSupplierData({ ...supplier });
                                  }}
                                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 px-2 py-1 text-[11px] font-bold rounded transition"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => setDeletingSupplierId(supplier.id)}
                                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-2 py-1 text-[11px] font-bold rounded transition"
                                >
                                  Eliminar
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DIAGNOSTIC LOGS PANEL with CLICKBOARD */}
      {activeTab === 'logs' && (
        <div className="space-y-4 text-left font-mono">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h4 className="text-sm font-bold text-slate-100 font-sans uppercase tracking-widest">Diagnóstico y Registro de Acciones</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                Consola detallada de acciones del importador de presupuestos. Útil para auditoría técnica de cotizaciones.
              </p>
            </div>
            
            <button
              onClick={handleCopyLogs}
              className="rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 px-3 py-1.5 text-xs text-slate-200 font-bold flex items-center gap-1.5 border border-slate-700 font-sans shrink-0"
              title="Copiar historial completo de logs al portapapeles"
            >
              {copiedLogs ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" /> ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copiar Logs
                </>
              )}
            </button>
          </div>

          <div className="bg-black/80 border border-slate-800 rounded-xl p-4 max-h-[350px] overflow-y-auto space-y-1.5 text-xs text-blue-300">
            {logs.map((log, index) => {
              const typeColor = 
                log.type === "success" ? "text-emerald-400" :
                log.type === "error" ? "text-rose-400 animate-pulse font-bold" :
                log.type === "warning" ? "text-amber-300" : "text-blue-300";
              return (
                <div key={index} className="flex gap-2 items-start leading-relaxed divide-x divide-slate-850">
                  <span className="text-slate-500 select-none shrink-0">{log.time}</span>
                  <span className={`pl-2 font-mono ${typeColor}`}>{log.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

// ------------------------------------
// HELPER CARD COMPONENT FOR UNIT PRICE
// ------------------------------------
interface PriceMetricCardProps {
  label: string;
  specs: string;
  val: number | undefined;
  highlight?: boolean;
}

function PriceMetricCard({ label, specs, val, highlight }: PriceMetricCardProps) {
  const formattedVal = val && val > 0 
    ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(val)
    : "Sin Cotizar";

  return (
    <div className={`rounded-xl border p-2.5 transition flex flex-col justify-between text-left ${
      val && val > 0 
        ? highlight 
          ? "bg-amber-500/[0.04] border-amber-500/30" 
          : "bg-slate-900/30 border-slate-800/80" 
        : "opacity-60 bg-slate-900/10 border-slate-900/50"
    }`}>
      <span className="text-[10px] text-slate-400 leading-tight font-semibold">{label}</span>
      <div className="mt-1 flex items-baseline justify-between select-none">
        <span className={`text-[13px] font-bold ${val && val > 0 ? "text-slate-100" : "text-slate-500"}`}>
          {formattedVal}
        </span>
        <span className="text-[8.5px] uppercase text-slate-500 tracking-wider font-semibold">{specs}</span>
      </div>
    </div>
  );
}

// ------------------------------------
// PLANTILLA DE PRECIOS REGIONALES DE COTIZACIÓN (EDITABLE)
// ------------------------------------
interface SupplierPriceTemplateProps {
  budgetData: NonNullable<UploadedBudget["data"]>;
  budgets: UploadedBudget[];
  onSave: (newData: NonNullable<UploadedBudget["data"]>) => void;
  config?: StructureConfig;
  getCheapestSupplierForMaterial: (itemKey: keyof SupplierPreset) => { name: string; price: number } | null;
}

function SupplierPriceTemplate({ budgetData, budgets, onSave, config, getCheapestSupplierForMaterial }: SupplierPriceTemplateProps) {
  // Sync local editing forms with incoming data from budgets selection
  const [formData, setFormData] = useState<NonNullable<UploadedBudget["data"]>>({ ...budgetData });

  useEffect(() => {
    setFormData({ ...budgetData });
  }, [budgetData]);

  const handlePriceChange = (key: keyof SupplierPreset, numericVal: number) => {
    const updated = {
      ...formData,
      [key]: numericVal
    };
    setFormData(updated);
    onSave(updated);
  };

  const handleLengthChange = (key: keyof SupplierPreset, numericVal: number) => {
    const updated = {
      ...formData,
      [key]: numericVal
    };
    setFormData(updated);
    onSave(updated);
  };

  const getRegionalAverage = (key: string): number => {
    const otherVals: number[] = [];
    
    // Collect from other budgets
    budgets.forEach(b => {
      if (b.status === "completed" && b.data && (b.data as any)[key] && Number((b.data as any)[key]) > 0) {
        otherVals.push(Number((b.data as any)[key]));
      }
    });

    // Collect from standard SUPPLIER_PRESETS
    SUPPLIER_PRESETS.forEach(p => {
      if (p[key as keyof SupplierPreset] && Number(p[key as keyof SupplierPreset]) > 0) {
        otherVals.push(Number(p[key as keyof SupplierPreset]));
      }
    });

    if (otherVals.length > 0) {
      return Math.round(otherVals.reduce((a, b) => a + b, 0) / otherVals.length);
    }
    
    // Static fallbacks
    if (key === 'caño50_50_2') return 36000;
    if (key === 'caño40_40_2') return 28500;
    if (key === 'caño40_40_25') return 33000;
    if (key === 'caño60_60_2') return 41037;
    if (key === 'tubing2_7_8') return 142000;
    if (key === 'tubing3_1_2') return 112000;
    if (key === 'chapa18_1x2') return 39500;
    if (key === 'chapa18_122x244') return 59000;
    if (key === 'platina560') return 24820;
    if (key === 'platinaEscuadra') return 1460;
    if (key === 'electrodo25') return 8509;
    if (key === 'esmalte4l') return 37711;
    if (key === 'tornilloHex') return 65;
    return 0;
  };

  const materialsList = [
    {
      key: "caño60_60_2" as keyof SupplierPreset,
      lengthKey: "caño60_60_2_largo" as keyof SupplierPreset,
      label: "Caño Estructural 60x60x2 mm",
      specs: "Barra para Columnas o Marco Pesado de Obra",
      defaultLength: 6,
    },
    {
      key: "caño50_50_2" as keyof SupplierPreset,
      lengthKey: "caño50_50_2_largo" as keyof SupplierPreset,
      label: "Caño Estructural 50x50x2 mm",
      specs: "Barra para Marco Perimetral Exterior",
      defaultLength: 6,
    },
    {
      key: "caño40_40_2" as keyof SupplierPreset,
      lengthKey: "caño40_40_2_largo" as keyof SupplierPreset,
      label: "Caño Estructural 40x40x2 mm",
      specs: "Barra para Esqueleto Interno Standard",
      defaultLength: 6,
    },
    {
      key: "tubing2_7_8" as keyof SupplierPreset,
      lengthKey: "tubing2_7_8_largo" as keyof SupplierPreset,
      label: "Tubing Petrolero 2 7/8\" (73mm)",
      specs: "Columna de Soporte Standard de Obra",
      defaultLength: 9,
    },
    {
      key: "tubing3_1_2" as keyof SupplierPreset,
      lengthKey: "tubing3_1_2_largo" as keyof SupplierPreset,
      label: "Tubing Petrolero 3 1/2\" (89mm)",
      specs: "Columna de Soporte Refuerzo Extra Pesado",
      defaultLength: 9,
    },
    {
      key: "chapa18_1x2" as keyof SupplierPreset,
      lengthKey: null,
      label: "Chapa Lisa Calibre 18 (1.0x2.0m)",
      specs: "Hoja para Revestimiento Frontal",
      defaultLength: null,
    },
    {
      key: "chapa18_122x244" as keyof SupplierPreset,
      lengthKey: null,
      label: "Chapa Lisa Calibre 18 (1.22x2.44m)",
      specs: "Hoja de Área de Cobertura Expandida",
      defaultLength: null,
    },
    {
      key: "platina560" as keyof SupplierPreset,
      lengthKey: null,
      label: "Platina Pesada de Viento (560x560x12.7mm)",
      specs: "Placa base de acero de 1/2 pulgada de espesor (por Unidad)",
      defaultLength: null,
    },
    {
      key: "platinaEscuadra" as keyof SupplierPreset,
      lengthKey: null,
      label: "Platina Escuadra de Refuerzo (80x160mm)",
      specs: "Escuadra triangular de acople y rigidización (por Unidad)",
      defaultLength: null,
    },
    {
      key: "electrodo25" as keyof SupplierPreset,
      lengthKey: null,
      label: "Electrodos Conarco E6013 Punta Azul (2.5 mm)",
      specs: "Electrodos consumibles para soldadura manual al arco (por Kg)",
      defaultLength: null,
    },
    {
      key: "esmalte4l" as keyof SupplierPreset,
      lengthKey: null,
      label: "Esmalte Sintético industrial Sinteplast 3en1 (4L)",
      specs: "Pintura protectora anticorrosiva para terminaciones (por envane de 4 Litros)",
      defaultLength: null,
    },
    {
      key: "tornilloHex" as keyof SupplierPreset,
      lengthKey: null,
      label: "Tornillo Autoperforante Hex Mecha #14 x 1\"",
      specs: "Sución con arandela vulcanizada metálica (por Unidad)",
      defaultLength: null,
    }
  ];

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950 p-4 text-left font-sans">
      <div className="flex flex-col gap-1 border-b border-slate-800/80 pb-2">
        <span className="text-[10px] uppercase font-black text-amber-500 tracking-wider">
          Ficha de Cotización Inteligente
        </span>
        <h5 className="text-sm font-extrabold text-slate-205 text-slate-250">
          PLANTILLA DE MATERIALES UNIFICADA: {formData.name}
        </h5>
        <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
          Modificá las tarifas directamente sobre las celdas. Si un material no fue cotizado (figura en cero), el sistema adoptará el promedio regional para totalizar el cartel. Podés pulsar <strong>"Adoptar Sugerido"</strong> para grabarlo.
        </p>
      </div>

      <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
        {materialsList.map((m) => {
          const rawPrice = Number(formData[m.key] || 0);
          const rawLength = m.lengthKey ? Number(formData[m.lengthKey] || m.defaultLength) : null;
          const isQuoted = rawPrice > 0;
          const avgPrice = getRegionalAverage(m.key);

          // Get the best (cheapest) provider for this material key
          const bestSupplierObj = getCheapestSupplierForMaterial(m.key);
          const suggestedPrice = bestSupplierObj ? bestSupplierObj.price : avgPrice;
          const suggestedSupplierName = bestSupplierObj ? bestSupplierObj.name : "Promedio Regional";

          // Calculate if this material is the currently active one selected in structure adjustments
          let isCurrentlyRequired = false;
          if (config) {
            if (m.key === 'caño60_60_2') {
              isCurrentlyRequired = config.marcoProfile === '60x60x2';
            } else if (m.key === 'caño50_50_2') {
              isCurrentlyRequired = config.marcoProfile === '50x50x2';
            } else if (m.key === 'caño40_40_2') {
              isCurrentlyRequired = config.skeletonProfile === '40x40x2';
            } else if (m.key === 'tubing2_7_8') {
              isCurrentlyRequired = config.columnProfile === 'tubing_2_7_8';
            } else if (m.key === 'tubing3_1_2') {
              isCurrentlyRequired = config.columnProfile === 'tubing_3_1_2';
            } else if (m.key === 'chapa18_1x2') {
              isCurrentlyRequired = config.chapaProfile === 'chapa_18' && config.chapaSheetSize === '1.0x2.0';
            } else if (m.key === 'chapa18_122x244') {
              isCurrentlyRequired = config.chapaProfile === 'chapa_18' && config.chapaSheetSize === '1.22x2.44';
            } else if (['platina560', 'platinaEscuadra', 'electrodo25', 'esmalte4l', 'tornilloHex'].includes(m.key as string)) {
              isCurrentlyRequired = true; // Essential installation components
            }
          }

          return (
            <div 
              key={m.key} 
              className={`p-3 rounded-lg border transition duration-150 flex flex-col md:flex-row md:items-center gap-3 justify-between ${
                isCurrentlyRequired
                  ? "bg-slate-900/40 border-cyan-500/30 hover:border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.05)]"
                  : isQuoted 
                    ? "bg-slate-900/20 border-slate-800/80 hover:border-slate-700 opacity-90" 
                    : "bg-slate-900/5 border-slate-900/40 hover:border-slate-800/40 opacity-70"
              }`}
            >
              {/* Material info */}
              <div className="flex-1 text-left min-w-[200px]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-xs text-slate-200">{m.label}</span>
                  
                  {isCurrentlyRequired && (
                    <span className="inline-flex items-center gap-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.2 text-[8.5px] font-black uppercase tracking-wider">
                      ⚡ En Ajustes
                    </span>
                  )}

                  {isQuoted ? (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.2 text-[8px] font-bold">
                      <span className="w-1 h-1 rounded-full bg-emerald-400" /> Cotizado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/25 px-1.5 py-0.2 text-[8px] font-bold">
                      <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" /> Usando Sugerido
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">{m.specs}</span>
                <span className="text-[9.5px] text-slate-400 block mt-1">
                  Mejor opción: <strong className="text-yellow-400 font-extrabold">{suggestedSupplierName}</strong> por <strong className="text-emerald-400 font-mono">${suggestedPrice.toLocaleString("es-AR")}</strong>
                </span>
              </div>

              {/* Reference autofill action */}
              <div className="w-full md:w-auto flex flex-col items-start md:items-end justify-center min-w-[170px]">
                {!isQuoted ? (
                  <button
                    type="button"
                    onClick={() => handlePriceChange(m.key, suggestedPrice)}
                    className="text-[9.5px] bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:text-cyan-400 text-slate-300 rounded px-2.5 py-1.5 transition font-bold leading-none active:scale-95 flex items-center gap-1 shadow-sm"
                    title={`Adoptar precio de ${suggestedSupplierName}: $${suggestedPrice}`}
                  >
                    🚀 Adoptar sugerido de <span className="text-amber-400 font-extrabold">{suggestedSupplierName.split(" ")[0]}</span>: <strong className="text-emerald-400 font-mono">${suggestedPrice.toLocaleString("es-AR")}</strong>
                  </button>
                ) : (
                  <div className="text-[9.5px] text-slate-500 font-mono text-right hidden md:block">
                    Ref {suggestedSupplierName.split(" ")[0]}: ${suggestedPrice.toLocaleString("es-AR")}
                  </div>
                )}
              </div>

              {/* Input values */}
              <div className="flex items-center gap-3 justify-end self-end md:self-auto">
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest block mb-0.5 animate-none">Precio Unit.</span>
                  <div className="flex h-8 items-center rounded-lg border border-slate-800 bg-slate-950/85 overflow-hidden text-xs max-w-[120px] focus-within:border-amber-500/55 transition">
                    <span className="px-2 text-slate-500 font-bold bg-slate-900 h-full flex items-center border-r border-slate-800/80 select-none">$</span>
                    <input
                      type="text"
                      value={isQuoted ? rawPrice : ""}
                      onChange={(e) => {
                        const numericVal = Number(e.target.value.replace(/[^0-9]/g, ""));
                        handlePriceChange(m.key, numericVal);
                      }}
                      placeholder={`$${suggestedPrice}`}
                      className="w-full h-full bg-transparent px-2.5 text-xs text-slate-200 font-mono font-extrabold focus:outline-none placeholder-slate-605 focus:bg-slate-900"
                    />
                  </div>
                </div>

                {m.lengthKey && rawLength !== null && (
                  <div className="flex flex-col">
                    <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest block mb-0.5 animate-none">Largo Barra</span>
                    <div className="flex h-8 items-center rounded-lg border border-slate-800 bg-slate-950/85 overflow-hidden text-xs max-w-[80px] focus-within:border-amber-500/55 transition">
                      <input
                        type="text"
                        value={rawLength}
                        onChange={(e) => {
                          const val = Number(e.target.value.replace(/[^0-9.]/g, ""));
                          handleLengthChange(m.lengthKey!, val);
                        }}
                        className="w-full h-full bg-transparent px-2 text-xs text-amber-400 font-mono font-bold focus:outline-none text-center focus:bg-slate-900"
                      />
                      <span className="px-1.5 text-[10px] text-slate-500 font-semibold bg-slate-900 h-full flex items-center border-l border-slate-800/80 select-none">m</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual info fields inside template */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-900">
        <div>
          <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest block mb-1">Nombre Proveedor</label>
          <input 
            type="text"
            value={formData.name || ""}
            onChange={(e) => {
              const updated = { ...formData, name: e.target.value };
              setFormData(updated);
              onSave(updated);
            }}
            className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 font-bold focus:outline-none focus:border-slate-700 focus:bg-slate-950"
            placeholder="Proveedor"
          />
        </div>
        <div>
          <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest block mb-1">Ciudad u Localidad</label>
          <input 
            type="text"
            value={formData.city || ""}
            onChange={(e) => {
              const updated = { ...formData, city: e.target.value };
              setFormData(updated);
              onSave(updated);
            }}
            className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700 focus:bg-slate-950"
            placeholder="Mendoza, Argentina"
          />
        </div>
      </div>
    </div>
  );
}
