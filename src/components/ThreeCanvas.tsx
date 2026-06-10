import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { StructureConfig, SelectedComponent3D } from '../types';
import { Camera, Eye, Layers, Compass, Move3d, ShieldAlert, Search, Maximize2 } from 'lucide-react';

interface ThreeCanvasProps {
  config: StructureConfig;
  selectedComponent: SelectedComponent3D;
  onSelectComponent: (component: SelectedComponent3D) => void;
  showSkeletonTransparent: boolean;
  showSubterranean: boolean;
  isARMode: boolean;
}

export default function ThreeCanvas({
  config,
  selectedComponent,
  onSelectComponent,
  showSkeletonTransparent,
  showSubterranean,
  isARMode
}: ThreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadingCamera, setLoadingCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [webglError, setWebglError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // AR settings
  const [arScale, setArScale] = useState(1);
  const [arRotation, setArRotation] = useState(0);
  const [arZOffset, setArZOffset] = useState(0); // Simulated distance
  const [arYOffset, setArYOffset] = useState(-100); // Simulated vertical offset

  // Persistent WebGL Context Helpers to stop context loss permanent error
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const assemblyGroupRef = useRef<THREE.Group | null>(null);
  const lastStateRef = useRef<{
    w: number;
    h: number;
    clearance: number;
    buried: number;
    isARMode: boolean;
  } | null>(null);

  const setZoomPreset = (type: 'default' | 'esqueleto' | 'cimientos') => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    // Dimensions in meters
    const w = config.width / 100;
    const h = config.height / 100;
    const clearance = config.clearanceHeight / 100;
    const signYCenter = clearance + h / 2;

    if (type === 'default') {
      controls.target.set(0, signYCenter, 0);
      camera.position.set(0, signYCenter, Math.max(w, h, clearance) * 1.8);
    } else if (type === 'esqueleto') {
      // Zoom close to the center skeleton bracing
      controls.target.set(0, signYCenter, 0);
      camera.position.set(0, signYCenter, Math.max(w, h) * 0.7);
    } else if (type === 'cimientos') {
      // Zoom close to footing under the ground
      controls.target.set(0, -0.3, 0);
      camera.position.set(2, 0.4, Math.max(w, h) * 0.6);
    }
    controls.update();
  };

  // Initialize camera for real AR background
  useEffect(() => {
    if (isARMode) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isARMode]);

  async function startCamera() {
    setLoadingCamera(true);
    try {
      if (streamRef.current) {
        stopCamera();
      }
      
      const constraints = {
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      const video = document.createElement('video');
      video.autoplay = true;
      video.playsInline = true;
      video.srcObject = stream;
      videoRef.current = video;
      
      setCameraActive(true);
    } catch (err) {
      console.warn('Webcam / AR Camera access refused or unavailable. Using virtual fallback scene instead.', err);
      setCameraActive(false);
    } finally {
      setLoadingCamera(false);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }
    setCameraActive(false);
  }

  // Absolute unmount cleanup effect to avoid WebGL leakages
  useEffect(() => {
    return () => {
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss();
        rendererRef.current = null;
      }
      sceneRef.current = null;
      cameraRef.current = null;
      assemblyGroupRef.current = null;
    };
  }, []);

  // Live ThreeJS Engine Hook
  useEffect(() => {
    if (webglError) return;
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;

    // Dimensions in meters for Three.js (1 unit = 1 meter)
    const w = config.width / 100;
    const h = config.height / 100;
    const clearance = config.clearanceHeight / 100;
    const buried = config.columnBuriedDepth / 100;
    const colCount = config.columnCount;
    const fW = config.foundationWidth / 100;
    const fD = config.foundationDepth / 100;

    // 1. SAFE LAZY WEBGL RENDERER INITIALIZATION
    let renderer = rendererRef.current;
    if (!renderer) {
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        rendererRef.current = renderer;
      } catch (err) {
        console.warn('Could not create WebGL context safely', err);
        setWebglError(true);
        return;
      }
    }
    
    // Always adjust sizing to match parent component bounds dynamically
    renderer.setSize(container.clientWidth, container.clientHeight);

    // 2. SAFE LAZY SCENE INITIALIZATION
    let scene = sceneRef.current;
    if (!scene) {
      scene = new THREE.Scene();
      sceneRef.current = scene;
    }

    // Background handling based on mode
    if (isARMode) {
      scene.background = null; // transparent to show camera feeds behind
    } else {
      scene.background = new THREE.Color(0x0f172a); // Premium sleek slate-900 back for maximum engineering vibe
      scene.fog = new THREE.FogExp2(0x0f172a, 0.015);
    }

    // 3. SAFE LAZY CAMERA INITIALIZATION
    let camera = cameraRef.current;
    if (!camera) {
      camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        100
      );
      cameraRef.current = camera;
    }

    // 4. SAFE LAZY ORBIT CONTROLS INITIALIZATION
    let controls = controlsRef.current;
    if (!controls) {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controlsRef.current = controls;
    }

    // Apply limits and targets to controls on dynamic changes
    controls.maxPolarAngle = Math.PI / 2 + (showSubterranean ? 0.3 : 0.0); // Allow seeing underground foundations
    controls.minDistance = 2;
    controls.maxDistance = 50;
    controls.enablePan = true;
    controls.screenSpacePanning = true; // Allows panning vertically and horizontally relative to screen
    
    // Check if structural params / camera reset is warranted
    const last = lastStateRef.current;
    const didChange = !last ||
      last.w !== w ||
      last.h !== h ||
      last.clearance !== clearance ||
      last.buried !== buried ||
      last.isARMode !== isARMode;

    if (didChange) {
      if (isARMode) {
        controls.target.set(0, arYOffset / 100, arZOffset / 100);
        camera.position.set(0, 0, 15);
      } else {
        controls.target.set(0, clearance + h / 2, 0);
        camera.position.set(0, clearance + h / 2, Math.max(w, h, clearance) * 1.8);
      }
      lastStateRef.current = { w, h, clearance, buried, isARMode };
    }

    // 5. CLEAR MAIN SCENE OBJECTS TO FRESHLY RE-RENDER
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    // 6. ADD RICH HIGH-CONTRAST LIGHTING SPECS
    const ambientLight = new THREE.AmbientLight(0xffffff, isARMode ? 0.8 : 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(15, 25, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    const d = 20;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Accent backing light (cyan backlight for beautiful engineering schematic glow)
    const backLight = new THREE.DirectionalLight(0x06b6d4, 0.6);
    backLight.position.set(-15, -10, -20);
    scene.add(backLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.4);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    // 7. BUILD INTEGRATED DESIGN GROUP
    const assemblyGroup = new THREE.Group();
    scene.add(assemblyGroup);
    assemblyGroupRef.current = assemblyGroup;

    if (isARMode) {
      assemblyGroup.scale.set(arScale, arScale, arScale);
      assemblyGroup.rotation.y = arRotation;
      assemblyGroup.position.set(0, arYOffset / 100, arZOffset / 100);
    }

    // 8. COHESIVE TECHNICAL MATERIAL SCHEMA
    const steelMaterial = new THREE.MeshStandardMaterial({
      color: 0x64748b, // Galvanized metal gray
      metalness: 0.9,
      roughness: 0.25,
      name: 'marco'
    });

    const innerSkeletonMaterial = new THREE.MeshStandardMaterial({
      color: 0x475569, // Slightly dark slate square tubes
      metalness: 0.8,
      roughness: 0.35,
      name: 'skeleton'
    });

    const activeBlueSheetMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Structural cobalt blue sheet
      metalness: 0.5,
      roughness: 0.3,
      name: 'chapa',
      transparent: showSkeletonTransparent,
      opacity: showSkeletonTransparent ? 0.22 : 0.95
    });

    const tubingMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155, // Heavy oilfield Tubing dark steel
      metalness: 0.95,
      roughness: 0.2,
      name: 'columns'
    });

    const concreteMaterial = new THREE.MeshStandardMaterial({
      color: 0x78716c, // Textured stone gray
      roughness: 0.95,
      metalness: 0.05,
      name: 'foundation'
    });

    const anchorPlatesMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Carbon steel anchor backing bases
      metalness: 0.9,
      roughness: 0.3,
      name: 'anchors'
    });

    const boltsMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Silver zinc threaded rods
      metalness: 0.9,
      roughness: 0.1,
      name: 'anchors'
    });

    // Raycast Glow Highlights
    const highlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xf97316, // Orange fire glowing feedback
      emissive: 0xf97316,
      emissiveIntensity: 0.5,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85
    });

    const hoverMaterial = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Cyan blueprint glowing feedback
      emissive: 0x06b6d4,
      emissiveIntensity: 0.4,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.8
    });

    const getMaterialForPart = (partType: SelectedComponent3D, defaultMat: THREE.Material) => {
      if (selectedComponent === partType) return highlightMaterial;
      if (hoveredPart === partType) return hoverMaterial;
      return defaultMat;
    };

    const registerPartMesh = (mesh: THREE.Mesh, partType: SelectedComponent3D) => {
      mesh.userData = { partType };
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    };

    // 9. VIRTUAL GROUND SCHEMATICS
    if (!isARMode) {
      // Grass / Asphalt technical grid plane
      const gridHelper = new THREE.GridHelper(100, 100, 0x334155, 0x1e293b);
      gridHelper.position.y = 0;
      scene.add(gridHelper);

      // Soil layer slab
      const slabGeo = new THREE.PlaneGeometry(100, 100);
      const slabMat = new THREE.MeshStandardMaterial({
        color: 0x0f171c,
        roughness: 0.99,
        metalness: 0.0
      });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.rotation.x = -Math.PI / 2;
      slab.position.y = -0.005;
      slab.receiveShadow = true;
      scene.add(slab);

      if (showSubterranean) {
        // Red structural depth guidance line at exactly 1.0m underground
        const subHelper = new THREE.GridHelper(30, 30, 0xef4444, 0x7f1d1d);
        subHelper.position.y = -1.0; 
        scene.add(subHelper);
      }
    }

    // 10. REINFORCED CLAMP BACKING MOUNTING RAILS (VINCULACIÓN TRASERA)
    // Heavy square bars behind the frame that physically interface with the circular Tubing support pillars
    const pipeThick = config.marcoProfile === '50x50x2' ? 0.05 
                    : config.marcoProfile === '60x60x2' ? 0.06 
                    : 0.08;
    const signYCenter = clearance + h/2;


    // 11. BUILD INTEGRATED CHASSIS SUPPORT COLUMNS (TUBING PETROQUÍMICO REFORZADO)
    // Sized to rise up from subterranean foundations (-buried) and end EXACTLY at half sign height (clearance + h / 2)
    // Aligning horizontally with the 6 vertical lines of the grid system for clean symmetric support
    const insertMeters = (config.columnInsertHeight !== undefined ? config.columnInsertHeight : (config.height / 2)) / 100;
    const colTotalLength = clearance + insertMeters + buried;
    const pipeDiameter = config.columnProfile === 'tubing_2_7_8' ? 0.073  // 2 7/8 inches
                       : config.columnProfile === 'tubing_3_1_2' ? 0.089  // 3 1/2 inches
                       : 0.114; // 4 1/2 inches

    // Align columns horizontally exactly with the horizontal layout grids
    const totalVertLines = config.gridCols; // N vertical caños in total
    const colHorizontalPositions: number[] = [];
    
    if (totalVertLines <= 2) {
      // Fallback if cols count not enough
      const startX = -w / 2;
      const endX = w / 2;
      const distStep = colCount > 1 ? w / (colCount - 1) : w;
      for (let i = 0; i < colCount; i++) {
        colHorizontalPositions.push(startX + i * distStep);
      }
    } else {
      // Calculate exactly matching the vertical struts lines of frame
      const stepVerticalStrut = w / (totalVertLines - 1);
      
      // We need to place colCount columns on those vertical lines!
      // If we have 6 lines and 6 columns, they match line-by-line.
      // If colCount differs, distribute across lines indices
      for (let i = 0; i < colCount; i++) {
        const lineIndex = Math.min(
          totalVertLines - 1,
          Math.round(i * (totalVertLines - 1) / (colCount - 1))
        );
        colHorizontalPositions.push(-w/2 + lineIndex * stepVerticalStrut);
      }
    }

    const colMat = getMaterialForPart('columns', tubingMaterial);
    
    colHorizontalPositions.forEach((colX) => {
      // Vertical Column cylinder
      const colGeo = new THREE.CylinderGeometry(pipeDiameter/2, pipeDiameter/2, colTotalLength, 24);
      const colMesh = new THREE.Mesh(colGeo, colMat);
      
      // Bottom rests buried (y = -buried), top climbs up to (clearance + insertMeters).
      // Center of this length is exactly (clearance + insertMeters - buried) / 2
      const colYCenter = (clearance + insertMeters - buried) / 2;
      // Position column directly touching the back face of client mounting rails
      const colZ = -pipeThick - (pipeDiameter/2);
      colMesh.position.set(colX, colYCenter, colZ);
      registerPartMesh(colMesh, 'columns');
      assemblyGroup.add(colMesh);

      // BASE INTERFACES: Heavy Structural Weld Steel Baseplates
      const plateW = fW * 0.70;
      const plateH = fW * 0.70;
      const plateThick = config.anchorPlateThickness / 1000; // millimeters to meters
      
      const plateGeo = new THREE.BoxGeometry(plateW, plateThick, plateH);
      const plateMat = getMaterialForPart('anchors', anchorPlatesMaterial);
      const plateMesh = new THREE.Mesh(plateGeo, plateMat);
      
      // Anchoring base interface situated at exactly -buried depth
      const anchorY = -buried;
      plateMesh.position.set(colX, anchorY, colZ);
      registerPartMesh(plateMesh, 'anchors');
      assemblyGroup.add(plateMesh);

      // WELDED STIFFENERS (CARTELAS DE ARRIOSTRAMIENTO)
      // 4 heavy triangular gusset plates welded between column wall and anchor plate to safeguard torque and wind shear.
      const gussetWidth = 0.01; // 10mm thick plates
      const gussetHeight = 0.16; // 160mm tall
      const gussetDepth = 0.08;  // 80mm structural protrusion
      const gussetMat = getMaterialForPart('anchors', anchorPlatesMaterial);
      
      const gNorthGeo = new THREE.BoxGeometry(gussetWidth, gussetHeight, gussetDepth);
      const gNorth = new THREE.Mesh(gNorthGeo, gussetMat);
      gNorth.position.set(colX, anchorY + gussetHeight/2, colZ + pipeDiameter/2 + gussetDepth/2);
      registerPartMesh(gNorth, 'anchors');
      assemblyGroup.add(gNorth);

      const gSouth = new THREE.Mesh(gNorthGeo, gussetMat);
      gSouth.position.set(colX, anchorY + gussetHeight/2, colZ - pipeDiameter/2 - gussetDepth/2);
      registerPartMesh(gSouth, 'anchors');
      assemblyGroup.add(gSouth);

      const gEastGeo = new THREE.BoxGeometry(gussetDepth, gussetHeight, gussetWidth);
      const gEast = new THREE.Mesh(gEastGeo, gussetMat);
      gEast.position.set(colX + pipeDiameter/2 + gussetDepth/2, anchorY + gussetHeight/2, colZ);
      registerPartMesh(gEast, 'anchors');
      assemblyGroup.add(gEast);

      const gWest = new THREE.Mesh(gEastGeo, gussetMat);
      gWest.position.set(colX - pipeDiameter/2 - gussetDepth/2, anchorY + gussetHeight/2, colZ);
      registerPartMesh(gWest, 'anchors');
      assemblyGroup.add(gWest);

      // HIGH RESISTANCE ASTM ADHESIVE J-BOLTS (PERNOS DE ANCLAJE ACERO ZINCADO)
      // 4 threaded foundation rods per column embedded into concrete footings
      const boltLength = 0.50; // 50cm pernos anchor
      for (let bx = -1; bx <= 1; bx += 2) {
        for (let bz = -1; bz <= 1; bz += 2) {
          const boltGeo = new THREE.CylinderGeometry(0.014, 0.014, boltLength, 8);
          const boltMat = getMaterialForPart('anchors', boltsMaterial);
          const boltMesh = new THREE.Mesh(boltGeo, boltMat);
          boltMesh.position.set(
            colX + bx * (plateW/2 - 0.035),
            anchorY + 0.12, // bolts head protrude above plate
            colZ + bz * (plateH/2 - 0.035)
          );
          registerPartMesh(boltMesh, 'anchors');
          assemblyGroup.add(boltMesh);
        }
      }

      // SUBTERRANEAN CONCRETE FOUNDATION FOOTINGS (ZAPATAS DE HORMIGÓN ARMADO)
      if (showSubterranean || isARMode) {
        const footingGeo = new THREE.BoxGeometry(fW, fD, fW);
        const footingMat = getMaterialForPart('foundation', concreteMaterial);
        const footingMesh = new THREE.Mesh(footingGeo, footingMat);
        footingMesh.position.set(colX, -fD/2, colZ);
        registerPartMesh(footingMesh, 'foundation');
        assemblyGroup.add(footingMesh);
      }
    });


    // 12. BUILD FRONT SHEETING PANEL (REVESTIMIENTO DE CHAPA FRONTAL SIDERCHAP)
    const frontW = w;
    const frontH = h;
    const frontThick = 0.003; // Calibre 18 lisa (approx 1.2mm visual sheet)
    
    const sheetGeo = new THREE.BoxGeometry(frontW, frontH, frontThick);
    const sheetMat = getMaterialForPart('chapa', activeBlueSheetMat);
    const sheetMesh = new THREE.Mesh(sheetGeo, sheetMat);
    // Sit cleanly at front face (Z=0.0)
    sheetMesh.position.set(0, signYCenter, 0);
    registerPartMesh(sheetMesh, 'chapa');
    assemblyGroup.add(sheetMesh);


    // 13. OUTER STRUCTURAL SKELETON FRAME (MARCO PERIMETRAL ESQUELETO)
    // Always 4 sides (2 horizontal + 2 vertical)
    const hBarGeo = new THREE.BoxGeometry(w, pipeThick, pipeThick);
    const vBarGeo = new THREE.BoxGeometry(pipeThick, h - 2 * pipeThick, pipeThick);
    const marcoMat = getMaterialForPart('marco', steelMaterial);

    // Render horizontal frame bars (top and bottom)
    const topBar = new THREE.Mesh(hBarGeo, marcoMat);
    topBar.position.set(0, signYCenter + h/2 - pipeThick/2, -pipeThick/2);
    registerPartMesh(topBar, 'marco');
    assemblyGroup.add(topBar);

    const bottomBar = new THREE.Mesh(hBarGeo, marcoMat);
    bottomBar.position.set(0, signYCenter - h/2 + pipeThick/2, -pipeThick/2);
    registerPartMesh(bottomBar, 'marco');
    assemblyGroup.add(bottomBar);

    // Render vertical frame bars (left and right)
    const leftBar = new THREE.Mesh(vBarGeo, marcoMat);
    leftBar.position.set(-w/2 + pipeThick/2, signYCenter, -pipeThick/2);
    registerPartMesh(leftBar, 'marco');
    assemblyGroup.add(leftBar);

    const rightBar = new THREE.Mesh(vBarGeo, marcoMat);
    rightBar.position.set(w/2 - pipeThick/2, signYCenter, -pipeThick/2);
    registerPartMesh(rightBar, 'marco');
    assemblyGroup.add(rightBar);


    // 14. INTERNAL BRACING GRID ESQUELETO (CUADRÍCULA INTERNA 40x40x2)
    const innerPipeWCount = Math.max(0, config.gridCols - 2); 
    const innerPipeHCount = Math.max(0, config.gridRows - 2); 
    const skeletonMat = getMaterialForPart('skeleton', innerSkeletonMaterial);
    
    const innerPipeThick = config.skeletonProfile === '40x40x2' ? 0.04 
                         : config.skeletonProfile === '40x40x2.5' ? 0.04 
                         : 0.03;

    // A. Vertical Struts
    if (innerPipeWCount > 0) {
      const stepVerticalStrut = w / (innerPipeWCount + 1);
      const strutHeight = h - 2 * pipeThick; // inside clearance heights
      const vertStrutGeo = new THREE.BoxGeometry(innerPipeThick, strutHeight, innerPipeThick);

      for (let vi = 1; vi <= innerPipeWCount; vi++) {
        const strutX = -w/2 + vi * stepVerticalStrut;
        const vertStrut = new THREE.Mesh(vertStrutGeo, skeletonMat);
        // Pack inside the frame thickness
        vertStrut.position.set(strutX, signYCenter, -pipeThick/2);
        registerPartMesh(vertStrut, 'skeleton');
        assemblyGroup.add(vertStrut);
      }
    }

    // B. Horizontal Struts
    if (innerPipeHCount > 0) {
      const stepHorizontalStrut = h / (innerPipeHCount + 1);
      const strutWidth = w - 2 * pipeThick; // inside clearance width
      const horizStrutGeo = new THREE.BoxGeometry(strutWidth, innerPipeThick, innerPipeThick);

      for (let hi = 1; hi <= innerPipeHCount; hi++) {
        const strutY = signYCenter - h/2 + hi * stepHorizontalStrut;
        const horizStrut = new THREE.Mesh(horizStrutGeo, skeletonMat);
        // Offset slightly behind the vertical struts inside frame to represent weld joint overlap realistically!
        horizStrut.position.set(0, strutY, -pipeThick/2 - 0.002);
        registerPartMesh(horizStrut, 'skeleton');
        assemblyGroup.add(horizStrut);
      }
    }

    // C. Wind Braces (Cruz de San Andrés)
    if (config.gridPattern === 'diagonal_cross' && innerPipeWCount > 0) {
      const stepVert = w / (innerPipeWCount + 1);
      const stepHoriz = h / (innerPipeHCount + 1);
      
      const beamGeo = (len: number, angle: number, posX: number, posY: number, isRight: boolean) => {
        const geo = new THREE.BoxGeometry(innerPipeThick * 0.70, len, innerPipeThick * 0.60);
        const mesh = new THREE.Mesh(geo, skeletonMat);
        mesh.rotation.z = isRight ? -angle : angle;
        // place on the interior pocket
        mesh.position.set(posX, posY, -pipeThick/2 - 0.005);
        registerPartMesh(mesh, 'skeleton');
        assemblyGroup.add(mesh);
      };

      for (let vi = 0; vi <= innerPipeWCount; vi++) {
        const cellLeft = -w/2 + vi * stepVert;
        const cellRight = cellLeft + stepVert;
        const cellCenterX = (cellLeft + cellRight) / 2;
        
        for (let hi = 0; hi <= innerPipeHCount; hi++) {
          const cellBottom = signYCenter - h/2 + hi * stepHoriz;
          const cellTop = cellBottom + stepHoriz;
          const cellCenterY = (cellBottom + cellTop) / 2;
          
          const widthSec = stepVert;
          const heightSec = stepHoriz;
          const diagLen = Math.sqrt(widthSec * widthSec + heightSec * heightSec);
          const angle = Math.atan2(widthSec, heightSec);

          beamGeo(diagLen, angle, cellCenterX, cellCenterY, true);
          beamGeo(diagLen, angle, cellCenterX, cellCenterY, false);
        }
      }
    }


    // 15. INTERACTIVE RAYCASTING EVENTS HANDLING
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onCanvasClick = (event: MouseEvent) => {
      if (!rendererRef.current || !cameraRef.current) return;
      
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(assemblyGroup.children, true);

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object as THREE.Mesh;
        const partType = clickedMesh.userData?.partType as SelectedComponent3D;
        if (partType && partType !== 'none') {
          let unifiedPart = partType;
          if ((partType as string) === 'marcos') unifiedPart = 'marco';
          onSelectComponent(unifiedPart);
        }
      }
    };

    const onCanvasPointerMove = (event: PointerEvent) => {
      if (!rendererRef.current || !cameraRef.current) return;
      
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(assemblyGroup.children, true);

      if (intersects.length > 0) {
        const pathObj = intersects[0].object as THREE.Mesh;
        let pName = pathObj.userData?.partType as string;
        if (pName === 'marcos') pName = 'marco';
        if (pName) {
          setHoveredPart(pName);
          rendererRef.current.domElement.style.cursor = 'pointer';
          return;
        }
      }
      setHoveredPart(null);
      rendererRef.current.domElement.style.cursor = 'default';
    };

    canvas.addEventListener('click', onCanvasClick);
    canvas.addEventListener('pointermove', onCanvasPointerMove);


    // 16. CONTINUALLY RUN ANIMATION FRAME LOOP (reusing references cleanly)
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();


    // 17. MULTI-DEVICE SCREEN RESYNC (RESIZE OBSERVER TARGETING THE CANVAS BOUNDS)
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);


    // 18. EFFORTLESS CLEANUP TO PROTECT GPU METRICS
    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      canvas.removeEventListener('click', onCanvasClick);
      canvas.removeEventListener('pointermove', onCanvasPointerMove);
    };
  }, [config, selectedComponent, hoveredPart, showSkeletonTransparent, showSubterranean, isARMode, arScale, arRotation, arYOffset, arZOffset, webglError]);

  return (
    <div className="relative w-full h-[480px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl">
      {webglError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/80 backdrop-blur-sm z-30">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 mb-4 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2">Simulador 3D en Modo de Respaldo</h3>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
            El entorno de previsualización de su navegador restringió el hardware de aceleración WebGL. ¡No se preocupe! Constracad ha habilitado la actualización en vivo de los <strong>Planos CAD Interactivos en 2D abajo</strong> y del calculador estructural y de presupuestos.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => {
                setWebglError(false);
              }}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              Reintentar Renderizado 3D
            </button>
            <a
              href={window.location.href}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all border border-slate-700/60 text-center"
            >
              Abrir App en Nueva Pestaña ↗
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* Real Live Camera Video Element underneath canvas for true client-side Web AR! */}
          {isARMode && cameraActive && videoRef.current && (
            <video
              ref={(el) => {
                if (el && videoRef.current && el.srcObject !== videoRef.current.srcObject) {
                  el.srcObject = videoRef.current.srcObject;
                  el.play().catch(e => console.log('Video autoplay error', e));
                }
              }}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1] brightness-90 index-0"
            />
          )}

          {/* AR Virtual street fallback background when webcam is requested but disabled */}
          {isARMode && !cameraActive && (
            <div 
              className="absolute inset-0 bg-cover bg-center index-0 brightness-[0.7] opacity-90 transition-opacity"
              style={{ 
                backgroundImage: "url('https://images.unsplash.com/photo-1542362567-b07eac79094f?auto=format&fit=crop&q=80&w=1600')" 
              }}
            />
          )}

          {/* THREE.js main canvas wrapper */}
          <div ref={containerRef} className="absolute inset-0 z-10 w-full h-full">
            <canvas ref={canvasRef} className="w-full h-full select-none" />
          </div>
        </>
      )}

      {/* Canvas Top overlay HUD panel */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 max-w-[280px]">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/95 backdrop-blur-md rounded-lg text-xs font-medium text-slate-100 border border-slate-700 shadow-lg">
          <Layers className="w-3.5 h-3.5 text-orange-500" />
          <span>Vista {isARMode ? 'de Realidad Aumentada (RA)' : '3D Estructural'}</span>
        </div>
        
        {selectedComponent !== 'none' && (
          <div className="flex flex-col gap-1 p-2.5 bg-orange-600/95 backdrop-blur-md rounded-lg text-xs text-white border border-orange-500 shadow-lg animate-pulse">
            <span className="font-bold uppercase tracking-wider text-[10px]">Pieza Seleccionada:</span>
            <span className="font-semibold text-sm">
              {selectedComponent === 'marco' ? `Marco Estructural (${config.marcoProfile.replace(/x[0-9]+$/, '').replace(/x/g, 'x')})` :
               selectedComponent === 'skeleton' ? `Esqueleto / Cuadrícula (${config.skeletonProfile.replace(/x[0-9.]+$/, '').replace(/x/g, 'x')})` :
               selectedComponent === 'chapa' ? 'Revestimiento de Chapas N-18' :
               selectedComponent === 'columns' ? `Postes Caño Tubing (${config.columnProfile === 'tubing_2_7_8' ? '2 7/8"' : config.columnProfile === 'tubing_3_1_2' ? '3 1/2"' : '114 mm'})` :
               selectedComponent === 'foundation' ? 'Cimentación de Hormigón' :
               'Anclajes y Pernos de Viento'}
            </span>
            <span className="text-[11px] text-orange-200">
              Haz cambios en el panel derecho para editar este elemento en vivo.
            </span>
          </div>
        )}
      </div>

      {/* AR HUD Control Panel at the bottom of 3D frame when ARMode is active */}
      {isARMode && (
        <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-700 shadow-xl">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-slate-100 text-xs font-semibold">
              <Move3d className="w-4 h-4 text-cyan-400" />
              <span>Controles de Ubicación Espacial</span>
            </div>
            <p className="text-[10px] text-slate-400">Posiciona el cartel de {config.width/100}x{config.height/100}m sobre el entorno</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 justify-around w-full sm:w-auto">
            {/* Scale Slider */}
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>Escala:</span>
              <input 
                type="range" 
                min="0.2" 
                max="2.5" 
                step="0.05"
                value={arScale} 
                onChange={(e) => setArScale(parseFloat(e.target.value))}
                className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400">{Math.round(arScale * 100)}%</span>
            </div>

            {/* Rotation Slider */}
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Compass className="w-3.5 h-3.5 text-slate-400" />
              <span>Giro:</span>
              <input 
                type="range" 
                min="-3.14" 
                max="3.14" 
                step="0.05"
                value={arRotation} 
                onChange={(e) => setArRotation(parseFloat(e.target.value))}
                className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400">{Math.round((arRotation * 180) / Math.PI)}°</span>
            </div>

            {/* Depth Slider */}
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>Distancia:</span>
              <input 
                type="range" 
                min="-300" 
                max="800" 
                step="10"
                value={arZOffset} 
                onChange={(e) => setArZOffset(parseInt(e.target.value))}
                className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400">{(arZOffset/100).toFixed(1)}m</span>
            </div>
            
            {/* Height Slider */}
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>Altura:</span>
              <input 
                type="range" 
                min="-600" 
                max="200" 
                step="10"
                value={arYOffset} 
                onChange={(e) => setArYOffset(parseInt(e.target.value))}
                className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400">{(arYOffset/100).toFixed(1)}m</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom control buttons on standard view */}
      {!isARMode && (
        <>
          <div className="absolute bottom-4 left-4 z-20 flex gap-2">
            {!showSubterranean && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-600/90 text-white rounded-md text-[10px] font-bold border border-amber-500 shadow animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Bases cimentadas ocultas bajo tierra</span>
              </div>
            )}
          </div>
          
          <div className="absolute bottom-4 right-4 z-20 flex flex-wrap gap-1.5 bg-slate-900/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-xl pointer-events-auto">
            <button
              type="button"
              onClick={() => setZoomPreset('default')}
              className="px-2 py-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded flex items-center gap-1 cursor-pointer transition-colors"
              title="Restablecer vista a plano general completo"
            >
              <Maximize2 className="w-3 h-3 text-cyan-400" />
              <span>Vista General</span>
            </button>
            <button
              type="button"
              onClick={() => setZoomPreset('esqueleto')}
              className="px-2 py-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded flex items-center gap-1 cursor-pointer transition-colors"
              title="Hacer zoom al esqueleto y cuadrícula de bracing interno"
            >
              <Search className="w-3 h-3 text-violet-400" />
              <span>Zoom Esqueleto</span>
            </button>
            <button
              type="button"
              onClick={() => setZoomPreset('cimientos')}
              className="px-2 py-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded flex items-center gap-1 cursor-pointer transition-colors"
              title="Hacer zoom a los bloques de cimientos subterráneos"
            >
              <Search className="w-3 h-3 text-amber-500" />
              <span>Zoom Cimientos</span>
            </button>
          </div>
        </>
      )}

      {/* Quick Instrucción Overlay */}
      <div className="absolute top-4 right-4 z-20 pointer-events-none">
        <div className="px-3 py-1.5 bg-slate-900/95 backdrop-blur-md rounded-lg text-[11px] font-medium text-slate-300 border border-slate-700/80 shadow-md">
          {selectedComponent === 'none' ? '💡 Haz Click en el diseño 3D para editar piezas' : '✨ Ajusta valores a la derecha'}
        </div>
      </div>
    </div>
  );
}
