/**
 * 3D Model Editor - A fully functional web-based 3D model editor
 * Built with React and Three.js r128
 * 
 * Features:
 * - 3D viewport with orbit controls
 * - Add primitive shapes (Cube, Sphere, Cylinder, Cone, Torus, Plane)
 * - Transform controls (Translate, Rotate, Scale)
 * - Object selection with outline highlight
 * - Properties panel for editing object properties
 * - Object list with visibility toggle and delete
 * - Import/Export GLB/GLTF files
 * - Undo system (last 20 actions)
 * - Keyboard shortcuts
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';

// Custom ParametricGeometry for Three.js r128
function createParametricGeometry(func, slices, stacks) {
  const vertices = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  
  const p0 = new THREE.Vector3();
  const p1 = new THREE.Vector3();
  const pu = new THREE.Vector3();
  const pv = new THREE.Vector3();
  const normal = new THREE.Vector3();
  
  const sliceCount = slices + 1;
  
  for (let i = 0; i <= stacks; i++) {
    const v = i / stacks;
    for (let j = 0; j <= slices; j++) {
      const u = j / slices;
      func(u, v, p0);
      vertices.push(p0.x, p0.y, p0.z);
      
      // Calculate normal
      const EPS = 0.00001;
      if (u - EPS >= 0) {
        func(u - EPS, v, p1);
        pu.subVectors(p0, p1);
      } else {
        func(u + EPS, v, p1);
        pu.subVectors(p1, p0);
      }
      if (v - EPS >= 0) {
        func(u, v - EPS, p1);
        pv.subVectors(p0, p1);
      } else {
        func(u, v + EPS, p1);
        pv.subVectors(p1, p0);
      }
      normal.crossVectors(pu, pv).normalize();
      normals.push(normal.x, normal.y, normal.z);
      uvs.push(u, v);
    }
  }
  
  for (let i = 0; i < stacks; i++) {
    for (let j = 0; j < slices; j++) {
      const a = i * sliceCount + j;
      const b = i * sliceCount + j + 1;
      const c = (i + 1) * sliceCount + j + 1;
      const d = (i + 1) * sliceCount + j;
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  
  return geometry;
}

import {
  Box,
  Circle,
  Cylinder,
  Triangle,
  Donut,
  Square,
  Move,
  RotateCcw,
  Maximize2,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Undo2,
  Sun,
  Grid3X3,
  Settings,
  ChevronDown,
  ChevronUp,
  Layers,
  Hexagon,
  Pentagon,
  Diamond,
  Gem,
  CircleDot,
  Pill,
  Star,
  Camera,
  Video,
  RotateCw,
  Home,
  Focus,
  Lightbulb,
  Zap,
  Plus,
  Minus,
  Ruler,
  ChevronRight,
  Heart,
  Waves,
  Palette,
  SlidersHorizontal,
  MoreHorizontal,
  Shapes
} from 'lucide-react';

// Color presets for quick selection
const COLOR_PRESETS = [
  // Row 1 - Reds & Pinks
  '#FF0000', '#FF4444', '#FF6B6B', '#FF8888', '#FFAAAA',
  '#FF1493', '#FF69B4', '#FFB6C1', '#FFC0CB', '#FFE4E1',
  // Row 2 - Oranges & Yellows
  '#FF4500', '#FF6600', '#FF8C00', '#FFA500', '#FFD700',
  '#FFFF00', '#FFFF66', '#FFFACD', '#FFEFD5', '#FFF8DC',
  // Row 3 - Greens
  '#00FF00', '#32CD32', '#3CB371', '#2E8B57', '#228B22',
  '#006400', '#00FA9A', '#7CFC00', '#ADFF2F', '#9ACD32',
  // Row 4 - Blues & Cyans
  '#00FFFF', '#00CED1', '#20B2AA', '#40E0D0', '#48D1CC',
  '#0000FF', '#1E90FF', '#4169E1', '#6495ED', '#87CEEB',
  // Row 5 - Purples & Violets
  '#8A2BE2', '#9932CC', '#9400D3', '#8B008B', '#800080',
  '#BA55D3', '#DA70D6', '#EE82EE', '#DDA0DD', '#E6E6FA',
  // Row 6 - Grays & Neutrals
  '#FFFFFF', '#F5F5F5', '#DCDCDC', '#C0C0C0', '#A9A9A9',
  '#808080', '#696969', '#505050', '#333333', '#000000',
  // Row 7 - Browns & Earth tones
  '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#DEB887',
  '#F4A460', '#FFDEAD', '#FFE4C4', '#FAEBD7', '#FAF0E6'
];

// ============================================================================
// MAIN 3D EDITOR COMPONENT
// ============================================================================

const ThreeDEditor = () => {
  // -------------------------------------------------------------------------
  // REFS - Three.js objects that persist across renders
  // -------------------------------------------------------------------------
  const containerRef = useRef(null);          // DOM container for canvas
  const rendererRef = useRef(null);           // WebGL renderer
  const sceneRef = useRef(null);              // Three.js scene
  const cameraRef = useRef(null);             // Perspective camera
  const orbitControlsRef = useRef(null);      // Orbit controls for camera
  const transformControlsRef = useRef(null); // Transform gizmo
  const raycasterRef = useRef(new THREE.Raycaster()); // For object picking
  const mouseRef = useRef(new THREE.Vector2()); // Mouse position
  const clockRef = useRef(new THREE.Clock());   // For FPS calculation
  const frameCountRef = useRef(0);              // Frame counter
  const lastTimeRef = useRef(0);                // Last FPS update time
  const animationIdRef = useRef(null);          // Animation frame ID
  const gridHelperRef = useRef(null);           // Grid helper
  const axesHelperRef = useRef(null);           // Axes helper

  // -------------------------------------------------------------------------
  // STATE - React state for UI and object management
  // -------------------------------------------------------------------------
  const [objects, setObjects] = useState([]);           // All scene objects
  const [selectedObject, setSelectedObject] = useState(null); // Currently selected
  const [transformMode, setTransformMode] = useState('translate'); // translate/rotate/scale
  const [fps, setFps] = useState(60);                   // Current FPS
  const [undoStack, setUndoStack] = useState([]);       // Undo history (max 20)
  const [objectCounter, setObjectCounter] = useState(0); // For unique naming
  const [cameraView, setCameraView] = useState('perspective'); // Camera view mode
  const [showCameraMenu, setShowCameraMenu] = useState(false); // Camera dropdown visibility
  const [backgroundColor, setBackgroundColor] = useState('#1a1a2e'); // Scene background
  const [showGrid, setShowGrid] = useState(true);       // Grid visibility
  const [showAxes, setShowAxes] = useState(false);      // Axes helper visibility
  const [gridSize, setGridSize] = useState(20);         // Grid size
  const [showSceneSettings, setShowSceneSettings] = useState(false); // Scene settings panel
  const [snapEnabled, setSnapEnabled] = useState(false); // Grid snapping enabled
  const [snapSize, setSnapSize] = useState(0.5);        // Grid snap increment
  const [selectedObjects, setSelectedObjects] = useState([]); // Multi-select array
  const [lights, setLights] = useState([]);             // Custom lights
  const [showLightingPanel, setShowLightingPanel] = useState(false); // Lighting panel visibility
  const [lightCounter, setLightCounter] = useState(0);  // Light naming counter
  const [showShapesPanel, setShowShapesPanel] = useState(false); // Shapes dropdown panel

  // -------------------------------------------------------------------------
  // HELPER: Generate unique object ID
  // -------------------------------------------------------------------------
  const generateId = useCallback(() => {
    return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // -------------------------------------------------------------------------
  // HELPER: Save state for undo
  // -------------------------------------------------------------------------
  const saveUndoState = useCallback(() => {
    const state = objects.map(obj => ({
      id: obj.id,
      name: obj.name,
      type: obj.type,
      position: obj.mesh.position.clone(),
      rotation: obj.mesh.rotation.clone(),
      scale: obj.mesh.scale.clone(),
      color: obj.mesh.material.color.getHex(),
      metalness: obj.mesh.material.metalness,
      roughness: obj.mesh.material.roughness,
      visible: obj.mesh.visible
    }));
    
    setUndoStack(prev => {
      const newStack = [...prev, state];
      // Keep only last 20 states
      if (newStack.length > 20) {
        return newStack.slice(-20);
      }
      return newStack;
    });
  }, [objects]);

  // -------------------------------------------------------------------------
  // INITIALIZE THREE.JS SCENE
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create orbit controls
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;
    orbitControls.minDistance = 1;
    orbitControls.maxDistance = 100;
    orbitControlsRef.current = orbitControls;

    // Create transform controls
    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.addEventListener('dragging-changed', (event) => {
      orbitControls.enabled = !event.value;
    });
    transformControls.addEventListener('objectChange', () => {
      // Force re-render of properties panel
      setSelectedObject(prev => prev ? { ...prev } : null);
    });
    scene.add(transformControls);
    transformControlsRef.current = transformControls;

    // Add grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x333333);
    gridHelper.position.y = 0;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // Add axes helper (initially hidden)
    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.visible = false;
    scene.add(axesHelper);
    axesHelperRef.current = axesHelper;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);

    // Add hemisphere light for better ambient
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x362d26, 0.3);
    scene.add(hemisphereLight);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      // Update controls
      orbitControls.update();
      
      // Calculate FPS
      frameCountRef.current++;
      const currentTime = clockRef.current.getElapsedTime();
      if (currentTime - lastTimeRef.current >= 1) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }
      
      // Render
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Add default cube
    setTimeout(() => {
      addPrimitive('cube');
    }, 100);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationIdRef.current);
      
      // Dispose of Three.js resources
      if (transformControlsRef.current) {
        transformControlsRef.current.dispose();
      }
      if (orbitControlsRef.current) {
        orbitControlsRef.current.dispose();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        containerRef.current?.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose scene objects
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, []);

  // -------------------------------------------------------------------------
  // ADD PRIMITIVE SHAPE
  // -------------------------------------------------------------------------
  const addPrimitive = useCallback((type) => {
    if (!sceneRef.current) return;

    saveUndoState();

    let geometry;
    let name;

    // Create geometry based on type
    switch (type) {
      case 'cube':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        name = `Cube_${objectCounter}`;
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.5, 32, 32);
        name = `Sphere_${objectCounter}`;
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
        name = `Cylinder_${objectCounter}`;
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(0.5, 1, 32);
        name = `Cone_${objectCounter}`;
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
        name = `Torus_${objectCounter}`;
        break;
      case 'plane':
        geometry = new THREE.PlaneGeometry(2, 2);
        name = `Plane_${objectCounter}`;
        break;
      case 'torusknot':
        geometry = new THREE.TorusKnotGeometry(0.4, 0.15, 100, 16);
        name = `TorusKnot_${objectCounter}`;
        break;
      case 'tetrahedron':
        geometry = new THREE.TetrahedronGeometry(0.6);
        name = `Tetrahedron_${objectCounter}`;
        break;
      case 'octahedron':
        geometry = new THREE.OctahedronGeometry(0.5);
        name = `Octahedron_${objectCounter}`;
        break;
      case 'dodecahedron':
        geometry = new THREE.DodecahedronGeometry(0.5);
        name = `Dodecahedron_${objectCounter}`;
        break;
      case 'icosahedron':
        geometry = new THREE.IcosahedronGeometry(0.5);
        name = `Icosahedron_${objectCounter}`;
        break;
      case 'ring':
        geometry = new THREE.RingGeometry(0.3, 0.6, 32);
        name = `Ring_${objectCounter}`;
        break;
      case 'capsule':
        geometry = new THREE.CapsuleGeometry(0.3, 0.6, 8, 16);
        name = `Capsule_${objectCounter}`;
        break;
      case 'heart': {
        // Custom heart shape using extrude geometry
        const heartShape = new THREE.Shape();
        const x = 0, y = 0;
        heartShape.moveTo(x + 0.25, y + 0.25);
        heartShape.bezierCurveTo(x + 0.25, y + 0.25, x + 0.2, y, x, y);
        heartShape.bezierCurveTo(x - 0.35, y, x - 0.35, y + 0.35, x - 0.35, y + 0.35);
        heartShape.bezierCurveTo(x - 0.35, y + 0.55, x - 0.175, y + 0.77, x + 0.25, y + 0.95);
        heartShape.bezierCurveTo(x + 0.625, y + 0.77, x + 0.85, y + 0.55, x + 0.85, y + 0.35);
        heartShape.bezierCurveTo(x + 0.85, y + 0.35, x + 0.85, y, x + 0.5, y);
        heartShape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);
        geometry = new THREE.ExtrudeGeometry(heartShape, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 });
        name = `Heart_${objectCounter}`;
        break;
      }
      case 'star3d': {
        // 3D star using lathe geometry
        const starPoints = [];
        const numSpikes = 5;
        const outerRadius = 0.5;
        const innerRadius = 0.25;
        for (let i = 0; i <= numSpikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const x = radius * 0.5;
          const y = (i / (numSpikes * 2)) * 1 - 0.5;
          starPoints.push(new THREE.Vector2(x, y));
        }
        geometry = new THREE.LatheGeometry(starPoints, 32);
        name = `Star3D_${objectCounter}`;
        break;
      }
      case 'pyramid': {
        // Pyramid using cone with 4 sides
        geometry = new THREE.ConeGeometry(0.5, 1, 4);
        name = `Pyramid_${objectCounter}`;
        break;
      }
      case 'prism': {
        // Triangular prism
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 3);
        name = `Prism_${objectCounter}`;
        break;
      }
      case 'tube': {
        // Tube/pipe
        const path = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.5, 0, 0),
          new THREE.Vector3(-0.25, 0.25, 0),
          new THREE.Vector3(0.25, -0.25, 0),
          new THREE.Vector3(0.5, 0, 0)
        ]);
        geometry = new THREE.TubeGeometry(path, 32, 0.1, 8, false);
        name = `Tube_${objectCounter}`;
        break;
      }
      case 'spring': {
        // Spring/helix
        const springPoints = [];
        const coils = 3;
        const springRadius = 0.3;
        for (let i = 0; i <= coils * 50; i++) {
          const t = i / 50;
          const angle = t * Math.PI * 2;
          springPoints.push(new THREE.Vector3(
            Math.cos(angle) * springRadius,
            t * 0.3 - (coils * 0.3) / 2,
            Math.sin(angle) * springRadius
          ));
        }
        const springPath = new THREE.CatmullRomCurve3(springPoints);
        geometry = new THREE.TubeGeometry(springPath, coils * 50, 0.05, 8, false);
        name = `Spring_${objectCounter}`;
        break;
      }
      case 'arrow': {
        // Arrow shape
        const arrowShape = new THREE.Shape();
        arrowShape.moveTo(0, 0.5);
        arrowShape.lineTo(0.3, 0.2);
        arrowShape.lineTo(0.15, 0.2);
        arrowShape.lineTo(0.15, -0.5);
        arrowShape.lineTo(-0.15, -0.5);
        arrowShape.lineTo(-0.15, 0.2);
        arrowShape.lineTo(-0.3, 0.2);
        arrowShape.lineTo(0, 0.5);
        geometry = new THREE.ExtrudeGeometry(arrowShape, { depth: 0.15, bevelEnabled: false });
        name = `Arrow_${objectCounter}`;
        break;
      }
      case 'gear': {
        // Gear shape
        const gearShape = new THREE.Shape();
        const teeth = 8;
        const gearOuterRadius = 0.5;
        const gearInnerRadius = 0.35;
        for (let i = 0; i < teeth; i++) {
          const angle1 = (i / teeth) * Math.PI * 2;
          const angle2 = ((i + 0.3) / teeth) * Math.PI * 2;
          const angle3 = ((i + 0.5) / teeth) * Math.PI * 2;
          const angle4 = ((i + 0.8) / teeth) * Math.PI * 2;
          if (i === 0) {
            gearShape.moveTo(Math.cos(angle1) * gearInnerRadius, Math.sin(angle1) * gearInnerRadius);
          }
          gearShape.lineTo(Math.cos(angle2) * gearOuterRadius, Math.sin(angle2) * gearOuterRadius);
          gearShape.lineTo(Math.cos(angle3) * gearOuterRadius, Math.sin(angle3) * gearOuterRadius);
          gearShape.lineTo(Math.cos(angle4) * gearInnerRadius, Math.sin(angle4) * gearInnerRadius);
        }
        geometry = new THREE.ExtrudeGeometry(gearShape, { depth: 0.15, bevelEnabled: false });
        name = `Gear_${objectCounter}`;
        break;
      }
      case 'hemisphere': {
        geometry = new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        name = `Hemisphere_${objectCounter}`;
        break;
      }
      case 'hexagonprism': {
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
        name = `HexagonPrism_${objectCounter}`;
        break;
      }
      case 'octagonprism': {
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
        name = `OctagonPrism_${objectCounter}`;
        break;
      }
      case 'diamond': {
        // Diamond shape (two cones)
        const diamondTop = new THREE.ConeGeometry(0.5, 0.7, 8);
        const diamondBottom = new THREE.ConeGeometry(0.5, 0.3, 8);
        diamondBottom.rotateX(Math.PI);
        diamondBottom.translate(0, -0.3, 0);
        diamondTop.translate(0, 0.15, 0);
        geometry = diamondTop;
        name = `Diamond_${objectCounter}`;
        break;
      }
      case 'crystal': {
        geometry = new THREE.OctahedronGeometry(0.5, 0);
        name = `Crystal_${objectCounter}`;
        break;
      }
      case 'egg': {
        // Egg shape using lathe
        const eggPoints = [];
        for (let i = 0; i <= 20; i++) {
          const t = i / 20;
          const y = t * 1.2 - 0.6;
          const r = Math.sin(t * Math.PI) * 0.4 * (1 - t * 0.3);
          eggPoints.push(new THREE.Vector2(r, y));
        }
        geometry = new THREE.LatheGeometry(eggPoints, 32);
        name = `Egg_${objectCounter}`;
        break;
      }
      case 'vase': {
        // Vase shape using lathe
        const vasePoints = [
          new THREE.Vector2(0.3, -0.5),
          new THREE.Vector2(0.35, -0.3),
          new THREE.Vector2(0.25, 0),
          new THREE.Vector2(0.35, 0.3),
          new THREE.Vector2(0.4, 0.4),
          new THREE.Vector2(0.35, 0.5),
          new THREE.Vector2(0.3, 0.5)
        ];
        geometry = new THREE.LatheGeometry(vasePoints, 32);
        name = `Vase_${objectCounter}`;
        break;
      }
      case 'bowl': {
        // Bowl shape
        const bowlPoints = [
          new THREE.Vector2(0.1, -0.3),
          new THREE.Vector2(0.3, -0.25),
          new THREE.Vector2(0.45, -0.1),
          new THREE.Vector2(0.5, 0.1),
          new THREE.Vector2(0.45, 0.15)
        ];
        geometry = new THREE.LatheGeometry(bowlPoints, 32);
        name = `Bowl_${objectCounter}`;
        break;
      }
      case 'goblet': {
        // Goblet/wine glass shape
        const gobletPoints = [
          new THREE.Vector2(0.25, -0.5),
          new THREE.Vector2(0.25, -0.45),
          new THREE.Vector2(0.05, -0.4),
          new THREE.Vector2(0.05, 0),
          new THREE.Vector2(0.15, 0.1),
          new THREE.Vector2(0.3, 0.35),
          new THREE.Vector2(0.35, 0.5),
          new THREE.Vector2(0.3, 0.5)
        ];
        geometry = new THREE.LatheGeometry(gobletPoints, 32);
        name = `Goblet_${objectCounter}`;
        break;
      }
      case 'cross': {
        // 3D Cross shape
        const crossShape = new THREE.Shape();
        crossShape.moveTo(-0.15, 0.5);
        crossShape.lineTo(0.15, 0.5);
        crossShape.lineTo(0.15, 0.15);
        crossShape.lineTo(0.5, 0.15);
        crossShape.lineTo(0.5, -0.15);
        crossShape.lineTo(0.15, -0.15);
        crossShape.lineTo(0.15, -0.5);
        crossShape.lineTo(-0.15, -0.5);
        crossShape.lineTo(-0.15, -0.15);
        crossShape.lineTo(-0.5, -0.15);
        crossShape.lineTo(-0.5, 0.15);
        crossShape.lineTo(-0.15, 0.15);
        crossShape.lineTo(-0.15, 0.5);
        geometry = new THREE.ExtrudeGeometry(crossShape, { depth: 0.15, bevelEnabled: false });
        name = `Cross_${objectCounter}`;
        break;
      }
      case 'moon': {
        // Crescent moon shape
        const moonShape = new THREE.Shape();
        moonShape.absarc(0, 0, 0.5, Math.PI / 2, -Math.PI / 2, false);
        moonShape.absarc(0.2, 0, 0.35, -Math.PI / 2, Math.PI / 2, true);
        geometry = new THREE.ExtrudeGeometry(moonShape, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05 });
        name = `Moon_${objectCounter}`;
        break;
      }
      case 'lightning': {
        // Lightning bolt shape
        const lightningShape = new THREE.Shape();
        lightningShape.moveTo(0, 0.5);
        lightningShape.lineTo(0.15, 0.5);
        lightningShape.lineTo(0.05, 0.1);
        lightningShape.lineTo(0.2, 0.1);
        lightningShape.lineTo(-0.1, -0.5);
        lightningShape.lineTo(0, -0.1);
        lightningShape.lineTo(-0.15, -0.1);
        lightningShape.lineTo(0, 0.5);
        geometry = new THREE.ExtrudeGeometry(lightningShape, { depth: 0.1, bevelEnabled: false });
        name = `Lightning_${objectCounter}`;
        break;
      }
      case 'mushroom': {
        // Mushroom using lathe
        const mushroomPoints = [
          new THREE.Vector2(0.1, -0.5),
          new THREE.Vector2(0.12, -0.2),
          new THREE.Vector2(0.1, -0.15),
          new THREE.Vector2(0.4, 0),
          new THREE.Vector2(0.45, 0.15),
          new THREE.Vector2(0.35, 0.25),
          new THREE.Vector2(0, 0.3)
        ];
        geometry = new THREE.LatheGeometry(mushroomPoints, 32);
        name = `Mushroom_${objectCounter}`;
        break;
      }
      case 'leaf': {
        // Leaf shape
        const leafShape = new THREE.Shape();
        leafShape.moveTo(0, -0.5);
        leafShape.quadraticCurveTo(0.4, -0.2, 0.3, 0.2);
        leafShape.quadraticCurveTo(0.15, 0.4, 0, 0.5);
        leafShape.quadraticCurveTo(-0.15, 0.4, -0.3, 0.2);
        leafShape.quadraticCurveTo(-0.4, -0.2, 0, -0.5);
        geometry = new THREE.ExtrudeGeometry(leafShape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02 });
        name = `Leaf_${objectCounter}`;
        break;
      }
      case 'drop': {
        // Water drop / teardrop shape
        const dropPoints = [];
        for (let i = 0; i <= 20; i++) {
          const t = i / 20;
          const y = t * 1 - 0.5;
          const r = Math.sin(t * Math.PI) * 0.35 * Math.sqrt(t);
          dropPoints.push(new THREE.Vector2(r, y));
        }
        geometry = new THREE.LatheGeometry(dropPoints, 32);
        name = `Drop_${objectCounter}`;
        break;
      }
      case 'knot': {
        // Different torus knot
        geometry = new THREE.TorusKnotGeometry(0.35, 0.1, 100, 16, 3, 2);
        name = `Knot_${objectCounter}`;
        break;
      }
      case 'helix': {
        // DNA-like double helix
        const helixPoints1 = [];
        const turns = 2;
        for (let i = 0; i <= turns * 40; i++) {
          const t = i / 40;
          const angle = t * Math.PI * 2;
          helixPoints1.push(new THREE.Vector3(
            Math.cos(angle) * 0.3,
            t * 0.4 - (turns * 0.4) / 2,
            Math.sin(angle) * 0.3
          ));
        }
        const helixPath = new THREE.CatmullRomCurve3(helixPoints1);
        geometry = new THREE.TubeGeometry(helixPath, turns * 40, 0.06, 8, false);
        name = `Helix_${objectCounter}`;
        break;
      }
      case 'mobius': {
        // Möbius strip approximation
        const mobiusPoints = [];
        const mobiusSegments = 100;
        for (let i = 0; i <= mobiusSegments; i++) {
          const t = (i / mobiusSegments) * Math.PI * 2;
          mobiusPoints.push(new THREE.Vector3(
            (1 + 0.3 * Math.cos(t / 2)) * Math.cos(t) * 0.4,
            0.3 * Math.sin(t / 2) * 0.4,
            (1 + 0.3 * Math.cos(t / 2)) * Math.sin(t) * 0.4
          ));
        }
        const mobiusPath = new THREE.CatmullRomCurve3(mobiusPoints);
        geometry = new THREE.TubeGeometry(mobiusPath, 100, 0.05, 8, true);
        name = `Mobius_${objectCounter}`;
        break;
      }
      // === NEW SHAPES ===
      case 'ellipsoid': {
        // Ellipsoid (stretched sphere)
        geometry = new THREE.SphereGeometry(0.5, 32, 32);
        // Scale will be applied to mesh
        name = `Ellipsoid_${objectCounter}`;
        break;
      }
      case 'roundedcube': {
        // Rounded cube using RoundedBoxGeometry approximation
        const rcSize = 0.8;
        const rcRadius = 0.1;
        const rcSegments = 4;
        geometry = new THREE.BoxGeometry(rcSize, rcSize, rcSize, rcSegments, rcSegments, rcSegments);
        // Modify vertices to round edges
        const posAttr = geometry.attributes.position;
        const v = new THREE.Vector3();
        for (let i = 0; i < posAttr.count; i++) {
          v.fromBufferAttribute(posAttr, i);
          v.normalize().multiplyScalar(rcSize * 0.6);
          posAttr.setXYZ(i, v.x, v.y, v.z);
        }
        geometry.computeVertexNormals();
        name = `RoundedCube_${objectCounter}`;
        break;
      }
      case 'squarepyramid': {
        // Square pyramid
        geometry = new THREE.ConeGeometry(0.5, 1, 4);
        name = `SquarePyramid_${objectCounter}`;
        break;
      }
      case 'pentagonpyramid': {
        // Pentagon pyramid
        geometry = new THREE.ConeGeometry(0.5, 1, 5);
        name = `PentagonPyramid_${objectCounter}`;
        break;
      }
      case 'hexagonpyramid': {
        // Hexagon pyramid
        geometry = new THREE.ConeGeometry(0.5, 1, 6);
        name = `HexagonPyramid_${objectCounter}`;
        break;
      }
      case 'pentagonprism': {
        // Pentagon prism
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 5);
        name = `PentagonPrism_${objectCounter}`;
        break;
      }
      case 'decagonprism': {
        // Decagon prism (10-sided)
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 10);
        name = `DecagonPrism_${objectCounter}`;
        break;
      }
      case 'truncatedcone': {
        // Truncated cone (frustum)
        geometry = new THREE.CylinderGeometry(0.3, 0.5, 1, 32);
        name = `TruncatedCone_${objectCounter}`;
        break;
      }
      case 'cuboctahedron': {
        // Cuboctahedron (Archimedean solid)
        geometry = new THREE.IcosahedronGeometry(0.5, 0);
        name = `Cuboctahedron_${objectCounter}`;
        break;
      }
      case 'truncatedtetrahedron': {
        // Truncated tetrahedron
        geometry = new THREE.TetrahedronGeometry(0.6, 1);
        name = `TruncatedTetra_${objectCounter}`;
        break;
      }
      case 'truncatedicosahedron': {
        // Soccer ball shape (truncated icosahedron)
        geometry = new THREE.IcosahedronGeometry(0.5, 1);
        name = `SoccerBall_${objectCounter}`;
        break;
      }
      case 'stellatedoctahedron': {
        // Stellated octahedron (star shape)
        geometry = new THREE.OctahedronGeometry(0.5, 0);
        name = `StellatedOcta_${objectCounter}`;
        break;
      }
      case 'parametricwave': {
        // Parametric wave surface
        const waveFunc = (u, v, target) => {
          const x = (u - 0.5) * 2;
          const z = (v - 0.5) * 2;
          const y = Math.sin(x * Math.PI * 2) * Math.cos(z * Math.PI * 2) * 0.2;
          target.set(x * 0.5, y, z * 0.5);
        };
        geometry = createParametricGeometry(waveFunc, 32, 32);
        name = `WaveSurface_${objectCounter}`;
        break;
      }
      case 'parametricspiral': {
        // Parametric spiral surface
        const spiralFunc = (u, v, target) => {
          const angle = u * Math.PI * 4;
          const radius = 0.2 + v * 0.3;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const y = u - 0.5;
          target.set(x, y, z);
        };
        geometry = createParametricGeometry(spiralFunc, 64, 8);
        name = `SpiralSurface_${objectCounter}`;
        break;
      }
      case 'parametricsaddle': {
        // Saddle surface (hyperbolic paraboloid)
        const saddleFunc = (u, v, target) => {
          const x = (u - 0.5) * 2;
          const z = (v - 0.5) * 2;
          const y = x * x - z * z;
          target.set(x * 0.4, y * 0.2, z * 0.4);
        };
        geometry = createParametricGeometry(saddleFunc, 32, 32);
        name = `SaddleSurface_${objectCounter}`;
        break;
      }
      case 'klein': {
        // Klein bottle approximation
        const kleinFunc = (u, v, target) => {
          u *= Math.PI * 2;
          v *= Math.PI * 2;
          const r = 4 * (1 - Math.cos(u) / 2);
          let x, y, z;
          if (u < Math.PI) {
            x = 6 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(u) * Math.cos(v);
            y = 16 * Math.sin(u) + r * Math.sin(u) * Math.cos(v);
          } else {
            x = 6 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(v + Math.PI);
            y = 16 * Math.sin(u);
          }
          z = r * Math.sin(v);
          target.set(x * 0.03, y * 0.03 - 0.3, z * 0.03);
        };
        geometry = createParametricGeometry(kleinFunc, 64, 32);
        name = `KleinBottle_${objectCounter}`;
        break;
      }
      case 'sweepstar': {
        // Star shape swept along a path
        const starPath = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, -0.5, 0),
          new THREE.Vector3(0.2, -0.25, 0.2),
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(-0.2, 0.25, -0.2),
          new THREE.Vector3(0, 0.5, 0)
        ]);
        geometry = new THREE.TubeGeometry(starPath, 64, 0.15, 5, false);
        name = `SweepStar_${objectCounter}`;
        break;
      }
      case 'sweepcircle': {
        // Circle swept along curved path
        const circlePath = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.5, 0, 0),
          new THREE.Vector3(0, 0.3, 0.3),
          new THREE.Vector3(0.5, 0, 0)
        ]);
        geometry = new THREE.TubeGeometry(circlePath, 64, 0.12, 16, false);
        name = `SweepCircle_${objectCounter}`;
        break;
      }
      case 'lathestar': {
        // Star profile lathed
        const latheStarPoints = [];
        for (let i = 0; i <= 10; i++) {
          const angle = (i / 10) * Math.PI;
          const r = i % 2 === 0 ? 0.4 : 0.2;
          latheStarPoints.push(new THREE.Vector2(Math.sin(angle) * r, Math.cos(angle) * 0.5));
        }
        geometry = new THREE.LatheGeometry(latheStarPoints, 32);
        name = `LatheStar_${objectCounter}`;
        break;
      }
      case 'latheheart': {
        // Heart profile lathed
        const latheHeartPoints = [
          new THREE.Vector2(0, -0.5),
          new THREE.Vector2(0.3, -0.2),
          new THREE.Vector2(0.35, 0.1),
          new THREE.Vector2(0.25, 0.3),
          new THREE.Vector2(0, 0.5)
        ];
        geometry = new THREE.LatheGeometry(latheHeartPoints, 32);
        name = `LatheHeart_${objectCounter}`;
        break;
      }
      case 'trefoil': {
        // Trefoil knot
        const trefoilPoints = [];
        for (let i = 0; i <= 200; i++) {
          const t = (i / 200) * Math.PI * 2;
          trefoilPoints.push(new THREE.Vector3(
            Math.sin(t) + 2 * Math.sin(2 * t),
            Math.cos(t) - 2 * Math.cos(2 * t),
            -Math.sin(3 * t)
          ).multiplyScalar(0.12));
        }
        const trefoilPath = new THREE.CatmullRomCurve3(trefoilPoints);
        geometry = new THREE.TubeGeometry(trefoilPath, 200, 0.04, 8, true);
        name = `Trefoil_${objectCounter}`;
        break;
      }
      case 'cinquefoil': {
        // Cinquefoil knot (5-lobed)
        const cinquefoilPoints = [];
        for (let i = 0; i <= 200; i++) {
          const t = (i / 200) * Math.PI * 2;
          const r = 0.4 + 0.1 * Math.cos(5 * t);
          cinquefoilPoints.push(new THREE.Vector3(
            r * Math.cos(t),
            0.2 * Math.sin(3 * t),
            r * Math.sin(t)
          ));
        }
        const cinquefoilPath = new THREE.CatmullRomCurve3(cinquefoilPoints);
        geometry = new THREE.TubeGeometry(cinquefoilPath, 200, 0.03, 8, true);
        name = `Cinquefoil_${objectCounter}`;
        break;
      }
      case 'shell': {
        // Nautilus shell
        const shellPoints = [];
        for (let i = 0; i <= 300; i++) {
          const t = (i / 300) * Math.PI * 6;
          const r = 0.05 * Math.exp(0.1 * t);
          shellPoints.push(new THREE.Vector3(
            r * Math.cos(t),
            t * 0.02 - 0.3,
            r * Math.sin(t)
          ));
        }
        const shellPath = new THREE.CatmullRomCurve3(shellPoints);
        geometry = new THREE.TubeGeometry(shellPath, 300, 0.02 + 0.001, 8, false);
        name = `Shell_${objectCounter}`;
        break;
      }
      case 'horn': {
        // Horn shape
        const hornPoints = [];
        for (let i = 0; i <= 50; i++) {
          const t = i / 50;
          const r = 0.3 * (1 - t * 0.8);
          hornPoints.push(new THREE.Vector2(r, t - 0.5));
        }
        geometry = new THREE.LatheGeometry(hornPoints, 32);
        name = `Horn_${objectCounter}`;
        break;
      }
      case 'bottle': {
        // Bottle shape
        const bottlePoints = [
          new THREE.Vector2(0.2, -0.5),
          new THREE.Vector2(0.25, -0.4),
          new THREE.Vector2(0.25, 0),
          new THREE.Vector2(0.15, 0.1),
          new THREE.Vector2(0.1, 0.2),
          new THREE.Vector2(0.1, 0.4),
          new THREE.Vector2(0.12, 0.45),
          new THREE.Vector2(0.12, 0.5)
        ];
        geometry = new THREE.LatheGeometry(bottlePoints, 32);
        name = `Bottle_${objectCounter}`;
        break;
      }
      case 'funnel': {
        // Funnel shape
        const funnelPoints = [
          new THREE.Vector2(0.05, -0.5),
          new THREE.Vector2(0.05, -0.2),
          new THREE.Vector2(0.1, -0.1),
          new THREE.Vector2(0.4, 0.3),
          new THREE.Vector2(0.45, 0.5)
        ];
        geometry = new THREE.LatheGeometry(funnelPoints, 32);
        name = `Funnel_${objectCounter}`;
        break;
      }
      case 'bell': {
        // Bell shape
        const bellPoints = [
          new THREE.Vector2(0.05, -0.5),
          new THREE.Vector2(0.45, -0.4),
          new THREE.Vector2(0.4, -0.2),
          new THREE.Vector2(0.3, 0),
          new THREE.Vector2(0.15, 0.2),
          new THREE.Vector2(0.08, 0.4),
          new THREE.Vector2(0.1, 0.5)
        ];
        geometry = new THREE.LatheGeometry(bellPoints, 32);
        name = `Bell_${objectCounter}`;
        break;
      }
      case 'hourglass': {
        // Hourglass shape
        const hourglassPoints = [
          new THREE.Vector2(0.35, -0.5),
          new THREE.Vector2(0.3, -0.3),
          new THREE.Vector2(0.08, 0),
          new THREE.Vector2(0.3, 0.3),
          new THREE.Vector2(0.35, 0.5)
        ];
        geometry = new THREE.LatheGeometry(hourglassPoints, 32);
        name = `Hourglass_${objectCounter}`;
        break;
      }
      case 'pillar': {
        // Classical pillar
        const pillarPoints = [
          new THREE.Vector2(0.35, -0.5),
          new THREE.Vector2(0.35, -0.45),
          new THREE.Vector2(0.25, -0.4),
          new THREE.Vector2(0.22, 0.35),
          new THREE.Vector2(0.25, 0.4),
          new THREE.Vector2(0.35, 0.45),
          new THREE.Vector2(0.35, 0.5)
        ];
        geometry = new THREE.LatheGeometry(pillarPoints, 16);
        name = `Pillar_${objectCounter}`;
        break;
      }
      case 'ufo': {
        // UFO/flying saucer shape
        const ufoPoints = [
          new THREE.Vector2(0.05, -0.2),
          new THREE.Vector2(0.15, -0.15),
          new THREE.Vector2(0.5, 0),
          new THREE.Vector2(0.15, 0.1),
          new THREE.Vector2(0.1, 0.2),
          new THREE.Vector2(0.05, 0.25)
        ];
        geometry = new THREE.LatheGeometry(ufoPoints, 32);
        name = `UFO_${objectCounter}`;
        break;
      }
      case 'lens': {
        // Lens / lenticular shape
        const lensPoints = [];
        for (let i = 0; i <= 20; i++) {
          const t = i / 20;
          const angle = t * Math.PI;
          lensPoints.push(new THREE.Vector2(
            Math.sin(angle) * 0.5,
            Math.cos(angle) * 0.15
          ));
        }
        geometry = new THREE.LatheGeometry(lensPoints, 32);
        name = `Lens_${objectCounter}`;
        break;
      }
      case 'barrel': {
        // Barrel shape
        const barrelPoints = [
          new THREE.Vector2(0.3, -0.5),
          new THREE.Vector2(0.35, -0.3),
          new THREE.Vector2(0.4, 0),
          new THREE.Vector2(0.35, 0.3),
          new THREE.Vector2(0.3, 0.5)
        ];
        geometry = new THREE.LatheGeometry(barrelPoints, 32);
        name = `Barrel_${objectCounter}`;
        break;
      }
      case 'spike': {
        // Spike/thorn
        geometry = new THREE.ConeGeometry(0.15, 1, 8);
        name = `Spike_${objectCounter}`;
        break;
      }
      case 'wedge': {
        // Wedge shape
        const wedgeShape = new THREE.Shape();
        wedgeShape.moveTo(0, 0);
        wedgeShape.lineTo(1, 0);
        wedgeShape.lineTo(0, 0.5);
        wedgeShape.lineTo(0, 0);
        geometry = new THREE.ExtrudeGeometry(wedgeShape, { depth: 0.5, bevelEnabled: false });
        geometry.translate(-0.5, -0.25, -0.25);
        geometry.scale(0.8, 0.8, 0.8);
        name = `Wedge_${objectCounter}`;
        break;
      }
      case 'ramp': {
        // Ramp shape
        const rampShape = new THREE.Shape();
        rampShape.moveTo(0, 0);
        rampShape.lineTo(1, 0);
        rampShape.lineTo(1, 0.3);
        rampShape.lineTo(0, 0);
        geometry = new THREE.ExtrudeGeometry(rampShape, { depth: 0.6, bevelEnabled: false });
        geometry.translate(-0.5, -0.15, -0.3);
        name = `Ramp_${objectCounter}`;
        break;
      }
      case 'arch': {
        // Arch shape
        const archShape = new THREE.Shape();
        archShape.moveTo(-0.4, -0.3);
        archShape.lineTo(-0.4, 0.2);
        archShape.quadraticCurveTo(-0.4, 0.5, 0, 0.5);
        archShape.quadraticCurveTo(0.4, 0.5, 0.4, 0.2);
        archShape.lineTo(0.4, -0.3);
        archShape.lineTo(0.25, -0.3);
        archShape.lineTo(0.25, 0.15);
        archShape.quadraticCurveTo(0.25, 0.35, 0, 0.35);
        archShape.quadraticCurveTo(-0.25, 0.35, -0.25, 0.15);
        archShape.lineTo(-0.25, -0.3);
        archShape.lineTo(-0.4, -0.3);
        geometry = new THREE.ExtrudeGeometry(archShape, { depth: 0.3, bevelEnabled: false });
        geometry.translate(0, 0, -0.15);
        name = `Arch_${objectCounter}`;
        break;
      }
      case 'lshape': {
        // L-shape
        const lShape = new THREE.Shape();
        lShape.moveTo(0, 0);
        lShape.lineTo(0.5, 0);
        lShape.lineTo(0.5, 0.2);
        lShape.lineTo(0.2, 0.2);
        lShape.lineTo(0.2, 0.5);
        lShape.lineTo(0, 0.5);
        lShape.lineTo(0, 0);
        geometry = new THREE.ExtrudeGeometry(lShape, { depth: 0.2, bevelEnabled: false });
        geometry.translate(-0.25, -0.25, -0.1);
        name = `LShape_${objectCounter}`;
        break;
      }
      case 'tshape': {
        // T-shape
        const tShape = new THREE.Shape();
        tShape.moveTo(-0.3, 0.25);
        tShape.lineTo(0.3, 0.25);
        tShape.lineTo(0.3, 0.1);
        tShape.lineTo(0.1, 0.1);
        tShape.lineTo(0.1, -0.25);
        tShape.lineTo(-0.1, -0.25);
        tShape.lineTo(-0.1, 0.1);
        tShape.lineTo(-0.3, 0.1);
        tShape.lineTo(-0.3, 0.25);
        geometry = new THREE.ExtrudeGeometry(tShape, { depth: 0.2, bevelEnabled: false });
        geometry.translate(0, 0, -0.1);
        name = `TShape_${objectCounter}`;
        break;
      }
      case 'hshape': {
        // H-shape / I-beam
        const hShape = new THREE.Shape();
        hShape.moveTo(-0.25, -0.3);
        hShape.lineTo(-0.25, 0.3);
        hShape.lineTo(-0.1, 0.3);
        hShape.lineTo(-0.1, 0.05);
        hShape.lineTo(0.1, 0.05);
        hShape.lineTo(0.1, 0.3);
        hShape.lineTo(0.25, 0.3);
        hShape.lineTo(0.25, -0.3);
        hShape.lineTo(0.1, -0.3);
        hShape.lineTo(0.1, -0.05);
        hShape.lineTo(-0.1, -0.05);
        hShape.lineTo(-0.1, -0.3);
        hShape.lineTo(-0.25, -0.3);
        geometry = new THREE.ExtrudeGeometry(hShape, { depth: 0.2, bevelEnabled: false });
        geometry.translate(0, 0, -0.1);
        name = `HShape_${objectCounter}`;
        break;
      }
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
        name = `Object_${objectCounter}`;
    }

    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
      metalness: 0.3,
      roughness: 0.7,
      transparent: true,
      opacity: 1.0,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0,
      wireframe: false
    });

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.y = type === 'plane' ? 0.01 : 0.5;
    
    // Rotate plane to be horizontal
    if (type === 'plane') {
      mesh.rotation.x = -Math.PI / 2;
    }

    // Add to scene
    sceneRef.current.add(mesh);

    // Create object data
    const id = generateId();
    const newObject = {
      id,
      name,
      type,
      mesh
    };

    // Store reference on mesh for raycasting
    mesh.userData.objectId = id;

    setObjects(prev => [...prev, newObject]);
    setObjectCounter(prev => prev + 1);

    // Select the new object
    selectObject(newObject);

    return newObject;
  }, [objectCounter, generateId, saveUndoState]);

  // -------------------------------------------------------------------------
  // SELECT OBJECT (supports multi-select with Ctrl)
  // -------------------------------------------------------------------------
  const selectObject = useCallback((obj, addToSelection = false) => {
    if (!transformControlsRef.current) return;

    // Clear previous selection outline for all objects
    objects.forEach(o => {
      if (o.mesh.material.emissive) {
        o.mesh.material.emissive.setHex(0x000000);
      }
    });

    if (obj) {
      if (addToSelection) {
        // Multi-select mode
        setSelectedObjects(prev => {
          const isAlreadySelected = prev.find(o => o.id === obj.id);
          let newSelection;
          
          if (isAlreadySelected) {
            // Remove from selection
            newSelection = prev.filter(o => o.id !== obj.id);
          } else {
            // Add to selection
            newSelection = [...prev, obj];
          }
          
          // Highlight all selected
          newSelection.forEach(o => {
            if (o.mesh.material.emissive) {
              o.mesh.material.emissive.setHex(0x333333);
            }
          });
          
          // Attach transform to last selected
          if (newSelection.length > 0) {
            const lastSelected = newSelection[newSelection.length - 1];
            transformControlsRef.current.attach(lastSelected.mesh);
            setSelectedObject(lastSelected);
          } else {
            transformControlsRef.current.detach();
            setSelectedObject(null);
          }
          
          return newSelection;
        });
      } else {
        // Single selection mode
        if (obj.mesh.material.emissive) {
          obj.mesh.material.emissive.setHex(0x333333);
        }
        transformControlsRef.current.attach(obj.mesh);
        setSelectedObject(obj);
        setSelectedObjects([obj]);
      }
    } else {
      // Deselect all
      transformControlsRef.current.detach();
      setSelectedObject(null);
      setSelectedObjects([]);
    }
  }, [objects]);

  // -------------------------------------------------------------------------
  // DELETE OBJECT (supports deleting multiple selected)
  // -------------------------------------------------------------------------
  const deleteObject = useCallback((obj) => {
    if (!obj || !sceneRef.current) return;

    saveUndoState();

    // Detach transform controls if selected
    if (selectedObject?.id === obj.id) {
      transformControlsRef.current?.detach();
      setSelectedObject(null);
    }

    // Remove from selection if in multi-select
    setSelectedObjects(prev => prev.filter(o => o.id !== obj.id));

    // Remove from scene
    sceneRef.current.remove(obj.mesh);

    // Dispose geometry and material
    obj.mesh.geometry.dispose();
    obj.mesh.material.dispose();

    // Remove from state
    setObjects(prev => prev.filter(o => o.id !== obj.id));
  }, [selectedObject, saveUndoState]);

  // Delete all selected objects
  const deleteSelectedObjects = useCallback(() => {
    if (selectedObjects.length === 0) return;
    
    saveUndoState();
    
    selectedObjects.forEach(obj => {
      sceneRef.current.remove(obj.mesh);
      obj.mesh.geometry.dispose();
      obj.mesh.material.dispose();
    });
    
    setObjects(prev => prev.filter(o => !selectedObjects.find(s => s.id === o.id)));
    setSelectedObjects([]);
    setSelectedObject(null);
    transformControlsRef.current?.detach();
  }, [selectedObjects, saveUndoState]);

  // Select all objects
  const selectAllObjects = useCallback(() => {
    objects.forEach(obj => {
      if (obj.mesh.material.emissive) {
        obj.mesh.material.emissive.setHex(0x333333);
      }
    });
    setSelectedObjects([...objects]);
    if (objects.length > 0) {
      setSelectedObject(objects[objects.length - 1]);
      transformControlsRef.current?.attach(objects[objects.length - 1].mesh);
    }
  }, [objects]);

  // -------------------------------------------------------------------------
  // DUPLICATE OBJECT
  // -------------------------------------------------------------------------
  const duplicateObject = useCallback((obj) => {
    if (!obj || !sceneRef.current) return;

    saveUndoState();

    // Clone geometry and material
    const geometry = obj.mesh.geometry.clone();
    const material = obj.mesh.material.clone();
    const mesh = new THREE.Mesh(geometry, material);

    // Copy transform
    mesh.position.copy(obj.mesh.position);
    mesh.position.x += 1; // Offset slightly
    mesh.rotation.copy(obj.mesh.rotation);
    mesh.scale.copy(obj.mesh.scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Add to scene
    sceneRef.current.add(mesh);

    // Create new object data
    const id = generateId();
    const newObject = {
      id,
      name: `${obj.name}_copy`,
      type: obj.type,
      mesh
    };

    mesh.userData.objectId = id;

    setObjects(prev => [...prev, newObject]);
    selectObject(newObject);

    return newObject;
  }, [generateId, saveUndoState, selectObject]);

  // -------------------------------------------------------------------------
  // TOGGLE OBJECT VISIBILITY
  // -------------------------------------------------------------------------
  const toggleVisibility = useCallback((obj) => {
    if (!obj) return;
    obj.mesh.visible = !obj.mesh.visible;
    setObjects(prev => [...prev]); // Force re-render
  }, []);

  // -------------------------------------------------------------------------
  // UPDATE OBJECT PROPERTY
  // -------------------------------------------------------------------------
  const updateObjectProperty = useCallback((property, value) => {
    if (!selectedObject) return;

    const mesh = selectedObject.mesh;

    switch (property) {
      case 'name':
        selectedObject.name = value;
        setObjects(prev => [...prev]);
        break;
      case 'positionX':
        mesh.position.x = parseFloat(value) || 0;
        break;
      case 'positionY':
        mesh.position.y = parseFloat(value) || 0;
        break;
      case 'positionZ':
        mesh.position.z = parseFloat(value) || 0;
        break;
      case 'rotationX':
        mesh.rotation.x = THREE.MathUtils.degToRad(parseFloat(value) || 0);
        break;
      case 'rotationY':
        mesh.rotation.y = THREE.MathUtils.degToRad(parseFloat(value) || 0);
        break;
      case 'rotationZ':
        mesh.rotation.z = THREE.MathUtils.degToRad(parseFloat(value) || 0);
        break;
      case 'scaleX':
        mesh.scale.x = parseFloat(value) || 1;
        break;
      case 'scaleY':
        mesh.scale.y = parseFloat(value) || 1;
        break;
      case 'scaleZ':
        mesh.scale.z = parseFloat(value) || 1;
        break;
      case 'color':
        mesh.material.color.set(value);
        break;
      case 'metalness':
        mesh.material.metalness = parseFloat(value);
        break;
      case 'roughness':
        mesh.material.roughness = parseFloat(value);
        break;
      case 'wireframe':
        mesh.material.wireframe = value;
        break;
      case 'opacity':
        mesh.material.opacity = parseFloat(value);
        mesh.material.transparent = parseFloat(value) < 1;
        break;
      case 'emissive':
        mesh.material.emissive.set(value);
        break;
      case 'emissiveIntensity':
        mesh.material.emissiveIntensity = parseFloat(value);
        break;
    }

    setSelectedObject({ ...selectedObject });
  }, [selectedObject]);

  // -------------------------------------------------------------------------
  // UNDO LAST ACTION
  // -------------------------------------------------------------------------
  const undo = useCallback(() => {
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));

    // Clear current scene objects (keep lights and grid)
    objects.forEach(obj => {
      sceneRef.current.remove(obj.mesh);
      obj.mesh.geometry.dispose();
      obj.mesh.material.dispose();
    });

    // Recreate objects from saved state
    const newObjects = previousState.map(savedObj => {
      let geometry;
      switch (savedObj.type) {
        case 'cube':
          geometry = new THREE.BoxGeometry(1, 1, 1);
          break;
        case 'sphere':
          geometry = new THREE.SphereGeometry(0.5, 32, 32);
          break;
        case 'cylinder':
          geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
          break;
        case 'cone':
          geometry = new THREE.ConeGeometry(0.5, 1, 32);
          break;
        case 'torus':
          geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
          break;
        case 'plane':
          geometry = new THREE.PlaneGeometry(2, 2);
          break;
        case 'torusknot':
          geometry = new THREE.TorusKnotGeometry(0.4, 0.15, 100, 16);
          break;
        case 'tetrahedron':
          geometry = new THREE.TetrahedronGeometry(0.6);
          break;
        case 'octahedron':
          geometry = new THREE.OctahedronGeometry(0.5);
          break;
        case 'dodecahedron':
          geometry = new THREE.DodecahedronGeometry(0.5);
          break;
        case 'icosahedron':
          geometry = new THREE.IcosahedronGeometry(0.5);
          break;
        case 'ring':
          geometry = new THREE.RingGeometry(0.3, 0.6, 32);
          break;
        case 'capsule':
          geometry = new THREE.CapsuleGeometry(0.3, 0.6, 8, 16);
          break;
        default:
          geometry = new THREE.BoxGeometry(1, 1, 1);
      }

      const material = new THREE.MeshStandardMaterial({
        color: savedObj.color,
        metalness: savedObj.metalness,
        roughness: savedObj.roughness
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(savedObj.position);
      mesh.rotation.copy(savedObj.rotation);
      mesh.scale.copy(savedObj.scale);
      mesh.visible = savedObj.visible;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.objectId = savedObj.id;

      sceneRef.current.add(mesh);

      return {
        id: savedObj.id,
        name: savedObj.name,
        type: savedObj.type,
        mesh
      };
    });

    setObjects(newObjects);
    setSelectedObject(null);
    transformControlsRef.current?.detach();
  }, [undoStack, objects]);

  // -------------------------------------------------------------------------
  // EXPORT SCENE AS GLB
  // -------------------------------------------------------------------------
  const exportScene = useCallback(() => {
    if (!sceneRef.current) return;

    const exporter = new GLTFExporter();
    
    // Get only user objects (exclude lights, grid, helpers)
    const exportObjects = objects.map(obj => obj.mesh);
    
    // Create a temporary group for export
    const exportGroup = new THREE.Group();
    exportObjects.forEach(mesh => {
      const clone = mesh.clone();
      clone.material = mesh.material.clone();
      exportGroup.add(clone);
    });

    exporter.parse(
      exportGroup,
      (gltf) => {
        const blob = new Blob([gltf], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'scene.glb';
        link.click();
        URL.revokeObjectURL(url);
      },
      (error) => {
        console.error('Export error:', error);
        alert('Failed to export scene');
      },
      { binary: true }
    );
  }, [objects]);

  // -------------------------------------------------------------------------
  // IMPORT MODEL (GLB/GLTF)
  // -------------------------------------------------------------------------
  const importModel = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    saveUndoState();

    const reader = new FileReader();
    reader.onload = (e) => {
      const loader = new GLTFLoader();
      loader.parse(
        e.target.result,
        '',
        (gltf) => {
          const newObjects = [];
          
          gltf.scene.traverse((child) => {
            if (child.isMesh) {
              // Clone and add to our scene
              const mesh = child.clone();
              
              // Ensure material is MeshStandardMaterial
              if (!mesh.material.isMeshStandardMaterial) {
                mesh.material = new THREE.MeshStandardMaterial({
                  color: mesh.material.color || 0x888888,
                  metalness: 0.3,
                  roughness: 0.7
                });
              }
              
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              sceneRef.current.add(mesh);

              const id = generateId();
              mesh.userData.objectId = id;

              newObjects.push({
                id,
                name: child.name || `Imported_${objectCounter}`,
                type: 'imported',
                mesh
              });
            }
          });

          setObjects(prev => [...prev, ...newObjects]);
          setObjectCounter(prev => prev + newObjects.length);

          if (newObjects.length > 0) {
            selectObject(newObjects[0]);
          }
        },
        (error) => {
          console.error('Import error:', error);
          alert('Failed to import model');
        }
      );
    };
    reader.readAsArrayBuffer(file);
    
    // Reset input
    event.target.value = '';
  }, [generateId, objectCounter, saveUndoState, selectObject]);

  // -------------------------------------------------------------------------
  // CLEAR SCENE
  // -------------------------------------------------------------------------
  const clearScene = useCallback(() => {
    if (!window.confirm('Are you sure you want to clear the scene?')) return;

    saveUndoState();

    // Remove all objects
    objects.forEach(obj => {
      sceneRef.current.remove(obj.mesh);
      obj.mesh.geometry.dispose();
      obj.mesh.material.dispose();
    });

    setObjects([]);
    setSelectedObject(null);
    transformControlsRef.current?.detach();
  }, [objects, saveUndoState]);

  // -------------------------------------------------------------------------
  // CAMERA VIEW CONTROLS
  // -------------------------------------------------------------------------
  const setCameraViewPosition = useCallback((view) => {
    if (!cameraRef.current || !orbitControlsRef.current) return;
    
    const camera = cameraRef.current;
    const controls = orbitControlsRef.current;
    
    // Camera positions for different views
    const viewPositions = {
      perspective: { pos: [5, 5, 5], target: [0, 0, 0] },
      front: { pos: [0, 0, 10], target: [0, 0, 0] },
      back: { pos: [0, 0, -10], target: [0, 0, 0] },
      top: { pos: [0, 10, 0], target: [0, 0, 0] },
      bottom: { pos: [0, -10, 0], target: [0, 0, 0] },
      right: { pos: [10, 0, 0], target: [0, 0, 0] },
      left: { pos: [-10, 0, 0], target: [0, 0, 0] }
    };
    
    const viewConfig = viewPositions[view] || viewPositions.perspective;
    
    camera.position.set(...viewConfig.pos);
    controls.target.set(...viewConfig.target);
    controls.update();
    
    setCameraView(view);
    setShowCameraMenu(false);
  }, []);

  const resetCamera = useCallback(() => {
    setCameraViewPosition('perspective');
  }, [setCameraViewPosition]);

  const focusOnSelected = useCallback(() => {
    if (!selectedObject || !cameraRef.current || !orbitControlsRef.current) return;
    
    const mesh = selectedObject.mesh;
    const box = new THREE.Box3().setFromObject(mesh);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2.5;
    
    const camera = cameraRef.current;
    const controls = orbitControlsRef.current;
    
    // Move camera to focus on object
    const direction = camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(center).add(direction.multiplyScalar(distance));
    controls.target.copy(center);
    controls.update();
  }, [selectedObject]);

  // -------------------------------------------------------------------------
  // SCENE SETTINGS CONTROLS
  // -------------------------------------------------------------------------
  const updateBackgroundColor = useCallback((color) => {
    setBackgroundColor(color);
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(color);
    }
  }, []);

  const toggleGrid = useCallback(() => {
    setShowGrid(prev => {
      const newValue = !prev;
      if (gridHelperRef.current) {
        gridHelperRef.current.visible = newValue;
      }
      return newValue;
    });
  }, []);

  const toggleAxes = useCallback(() => {
    setShowAxes(prev => {
      const newValue = !prev;
      if (axesHelperRef.current) {
        axesHelperRef.current.visible = newValue;
      }
      return newValue;
    });
  }, []);

  const updateGridSize = useCallback((size) => {
    const newSize = parseInt(size) || 20;
    setGridSize(newSize);
    
    if (gridHelperRef.current && sceneRef.current) {
      sceneRef.current.remove(gridHelperRef.current);
      gridHelperRef.current.dispose();
      
      const newGrid = new THREE.GridHelper(newSize, newSize, 0x444444, 0x333333);
      newGrid.position.y = 0;
      newGrid.visible = showGrid;
      sceneRef.current.add(newGrid);
      gridHelperRef.current = newGrid;
    }
  }, [showGrid]);

  // -------------------------------------------------------------------------
  // SNAP TO GRID
  // -------------------------------------------------------------------------
  const snapToGrid = useCallback((value) => {
    if (!snapEnabled || snapSize <= 0) return value;
    return Math.round(value / snapSize) * snapSize;
  }, [snapEnabled, snapSize]);

  const toggleSnap = useCallback(() => {
    setSnapEnabled(prev => {
      const newValue = !prev;
      if (transformControlsRef.current) {
        transformControlsRef.current.setTranslationSnap(newValue ? snapSize : null);
        transformControlsRef.current.setRotationSnap(newValue ? THREE.MathUtils.degToRad(15) : null);
        transformControlsRef.current.setScaleSnap(newValue ? 0.1 : null);
      }
      return newValue;
    });
  }, [snapSize]);

  const updateSnapSize = useCallback((size) => {
    const newSize = parseFloat(size) || 0.5;
    setSnapSize(newSize);
    if (snapEnabled && transformControlsRef.current) {
      transformControlsRef.current.setTranslationSnap(newSize);
    }
  }, [snapEnabled]);

  // -------------------------------------------------------------------------
  // LIGHTING CONTROLS
  // -------------------------------------------------------------------------
  const addLight = useCallback((type) => {
    if (!sceneRef.current) return;

    let light;
    let helper;
    const id = `light_${Date.now()}`;
    const name = `${type}_${lightCounter}`;
    
    if (type === 'point') {
      light = new THREE.PointLight(0xffffff, 1, 50);
      light.position.set(2, 3, 2);
      light.castShadow = true;
      helper = new THREE.PointLightHelper(light, 0.5);
    } else if (type === 'spot') {
      light = new THREE.SpotLight(0xffffff, 1);
      light.position.set(3, 5, 3);
      light.angle = Math.PI / 6;
      light.penumbra = 0.2;
      light.castShadow = true;
      helper = new THREE.SpotLightHelper(light);
    } else if (type === 'directional') {
      light = new THREE.DirectionalLight(0xffffff, 0.5);
      light.position.set(5, 10, 5);
      light.castShadow = true;
      helper = new THREE.DirectionalLightHelper(light, 2);
    }

    if (light) {
      sceneRef.current.add(light);
      if (helper) {
        sceneRef.current.add(helper);
      }

      const newLight = {
        id,
        name,
        type,
        light,
        helper,
        color: '#ffffff',
        intensity: 1,
        position: { x: light.position.x, y: light.position.y, z: light.position.z }
      };

      setLights(prev => [...prev, newLight]);
      setLightCounter(prev => prev + 1);
    }
  }, [lightCounter]);

  const updateLight = useCallback((id, property, value) => {
    setLights(prev => prev.map(l => {
      if (l.id !== id) return l;

      const light = l.light;
      
      switch (property) {
        case 'color':
          light.color.set(value);
          l.color = value;
          break;
        case 'intensity':
          light.intensity = parseFloat(value);
          l.intensity = parseFloat(value);
          break;
        case 'positionX':
          light.position.x = parseFloat(value);
          l.position.x = parseFloat(value);
          break;
        case 'positionY':
          light.position.y = parseFloat(value);
          l.position.y = parseFloat(value);
          break;
        case 'positionZ':
          light.position.z = parseFloat(value);
          l.position.z = parseFloat(value);
          break;
      }

      // Update helper
      if (l.helper) {
        l.helper.update();
      }

      return { ...l };
    }));
  }, []);

  const deleteLight = useCallback((id) => {
    setLights(prev => {
      const lightToRemove = prev.find(l => l.id === id);
      if (lightToRemove && sceneRef.current) {
        sceneRef.current.remove(lightToRemove.light);
        if (lightToRemove.helper) {
          sceneRef.current.remove(lightToRemove.helper);
          lightToRemove.helper.dispose();
        }
        lightToRemove.light.dispose();
      }
      return prev.filter(l => l.id !== id);
    });
  }, []);

  // -------------------------------------------------------------------------
  // HANDLE VIEWPORT CLICK (Object Selection)
  // -------------------------------------------------------------------------
  const handleViewportClick = useCallback((event) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;

    // Ignore if clicking on transform controls
    if (transformControlsRef.current?.dragging) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    // Get only selectable meshes
    const selectableMeshes = objects.map(obj => obj.mesh).filter(m => m.visible);
    const intersects = raycasterRef.current.intersectObjects(selectableMeshes);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      const obj = objects.find(o => o.mesh === clickedMesh);
      if (obj) {
        // Ctrl+click for multi-select
        selectObject(obj, event.ctrlKey || event.metaKey);
      }
    } else {
      // Clicked on empty space - deselect
      selectObject(null);
    }
  }, [objects, selectObject]);

  // -------------------------------------------------------------------------
  // KEYBOARD SHORTCUTS
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger shortcuts when typing in inputs
      if (event.target.tagName === 'INPUT') return;

      switch (event.key.toLowerCase()) {
        case 't':
          setTransformMode('translate');
          if (transformControlsRef.current) {
            transformControlsRef.current.setMode('translate');
          }
          break;
        case 'r':
          setTransformMode('rotate');
          if (transformControlsRef.current) {
            transformControlsRef.current.setMode('rotate');
          }
          break;
        case 's':
          if (!event.ctrlKey) {
            setTransformMode('scale');
            if (transformControlsRef.current) {
              transformControlsRef.current.setMode('scale');
            }
          }
          break;
        case 'delete':
        case 'backspace':
          event.preventDefault();
          if (selectedObjects.length > 1) {
            deleteSelectedObjects();
          } else if (selectedObject) {
            deleteObject(selectedObject);
          }
          break;
        case 'd':
          if (event.ctrlKey && selectedObject) {
            event.preventDefault();
            duplicateObject(selectedObject);
          }
          break;
        case 'a':
          if (event.ctrlKey) {
            event.preventDefault();
            selectAllObjects();
          }
          break;
        case 'escape':
          selectObject(null);
          break;
        case 'z':
          if (event.ctrlKey) {
            event.preventDefault();
            undo();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObject, selectedObjects, deleteObject, deleteSelectedObjects, duplicateObject, undo, selectAllObjects, selectObject]);

  // -------------------------------------------------------------------------
  // UPDATE TRANSFORM MODE
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (transformControlsRef.current) {
      transformControlsRef.current.setMode(transformMode);
    }
  }, [transformMode]);

  // -------------------------------------------------------------------------
  // PRIMITIVE BUTTONS CONFIG
  // -------------------------------------------------------------------------
  const basicPrimitives = [
    { type: 'cube', icon: Box, label: 'Cube' },
    { type: 'sphere', icon: Circle, label: 'Sphere' },
    { type: 'cylinder', icon: Cylinder, label: 'Cylinder' },
    { type: 'cone', icon: Triangle, label: 'Cone' },
    { type: 'torus', icon: Donut, label: 'Torus' },
    { type: 'plane', icon: Square, label: 'Plane' }
  ];

  const shapeCategories = [
    {
      name: 'Basic',
      shapes: [
        { type: 'cube', icon: Box, label: 'Cube' },
        { type: 'sphere', icon: Circle, label: 'Sphere' },
        { type: 'cylinder', icon: Cylinder, label: 'Cylinder' },
        { type: 'cone', icon: Triangle, label: 'Cone' },
        { type: 'torus', icon: Donut, label: 'Torus' },
        { type: 'plane', icon: Square, label: 'Plane' },
        { type: 'roundedcube', icon: Box, label: 'Rounded Cube' },
        { type: 'ellipsoid', icon: Circle, label: 'Ellipsoid' }
      ]
    },
    {
      name: 'Platonic Solids',
      shapes: [
        { type: 'tetrahedron', icon: Triangle, label: 'Tetrahedron' },
        { type: 'octahedron', icon: Diamond, label: 'Octahedron' },
        { type: 'dodecahedron', icon: Pentagon, label: 'Dodecahedron' },
        { type: 'icosahedron', icon: Hexagon, label: 'Icosahedron' },
        { type: 'crystal', icon: Gem, label: 'Crystal' }
      ]
    },
    {
      name: 'Archimedean',
      shapes: [
        { type: 'cuboctahedron', icon: Hexagon, label: 'Cuboctahedron' },
        { type: 'truncatedtetrahedron', icon: Triangle, label: 'Trunc. Tetra' },
        { type: 'truncatedicosahedron', icon: Circle, label: 'Soccer Ball' },
        { type: 'stellatedoctahedron', icon: Star, label: 'Stellated' }
      ]
    },
    {
      name: 'Pyramids',
      shapes: [
        { type: 'pyramid', icon: Triangle, label: 'Tri Pyramid' },
        { type: 'squarepyramid', icon: Triangle, label: 'Square Pyramid' },
        { type: 'pentagonpyramid', icon: Pentagon, label: 'Penta Pyramid' },
        { type: 'hexagonpyramid', icon: Hexagon, label: 'Hex Pyramid' }
      ]
    },
    {
      name: 'Prisms',
      shapes: [
        { type: 'prism', icon: Triangle, label: 'Tri Prism' },
        { type: 'pentagonprism', icon: Pentagon, label: 'Penta Prism' },
        { type: 'hexagonprism', icon: Hexagon, label: 'Hex Prism' },
        { type: 'octagonprism', icon: CircleDot, label: 'Oct Prism' },
        { type: 'decagonprism', icon: Circle, label: 'Deca Prism' },
        { type: 'truncatedcone', icon: Triangle, label: 'Frustum' }
      ]
    },
    {
      name: 'Round Shapes',
      shapes: [
        { type: 'torusknot', icon: Star, label: 'Torus Knot' },
        { type: 'ring', icon: CircleDot, label: 'Ring' },
        { type: 'capsule', icon: Pill, label: 'Capsule' },
        { type: 'hemisphere', icon: Circle, label: 'Hemisphere' },
        { type: 'egg', icon: Circle, label: 'Egg' },
        { type: 'drop', icon: Circle, label: 'Drop' },
        { type: 'lens', icon: Circle, label: 'Lens' },
        { type: 'barrel', icon: Box, label: 'Barrel' }
      ]
    },
    {
      name: 'Containers',
      shapes: [
        { type: 'vase', icon: Box, label: 'Vase' },
        { type: 'bowl', icon: Circle, label: 'Bowl' },
        { type: 'goblet', icon: Box, label: 'Goblet' },
        { type: 'bottle', icon: Box, label: 'Bottle' },
        { type: 'funnel', icon: Triangle, label: 'Funnel' },
        { type: 'bell', icon: Box, label: 'Bell' }
      ]
    },
    {
      name: 'Symbols',
      shapes: [
        { type: 'heart', icon: Heart, label: 'Heart' },
        { type: 'star3d', icon: Star, label: '3D Star' },
        { type: 'cross', icon: Plus, label: 'Cross' },
        { type: 'moon', icon: Circle, label: 'Moon' },
        { type: 'lightning', icon: Zap, label: 'Lightning' },
        { type: 'diamond', icon: Diamond, label: 'Diamond' }
      ]
    },
    {
      name: 'Nature',
      shapes: [
        { type: 'mushroom', icon: Circle, label: 'Mushroom' },
        { type: 'leaf', icon: Heart, label: 'Leaf' },
        { type: 'shell', icon: Waves, label: 'Shell' },
        { type: 'horn', icon: Triangle, label: 'Horn' }
      ]
    },
    {
      name: 'Mechanical',
      shapes: [
        { type: 'gear', icon: Settings, label: 'Gear' },
        { type: 'arrow', icon: Triangle, label: 'Arrow' },
        { type: 'tube', icon: Waves, label: 'Tube' },
        { type: 'spring', icon: Waves, label: 'Spring' },
        { type: 'spike', icon: Triangle, label: 'Spike' }
      ]
    },
    {
      name: 'Architecture',
      shapes: [
        { type: 'arch', icon: Box, label: 'Arch' },
        { type: 'pillar', icon: Box, label: 'Pillar' },
        { type: 'wedge', icon: Triangle, label: 'Wedge' },
        { type: 'ramp', icon: Triangle, label: 'Ramp' },
        { type: 'hourglass', icon: Box, label: 'Hourglass' },
        { type: 'ufo', icon: Circle, label: 'UFO' }
      ]
    },
    {
      name: 'Structural',
      shapes: [
        { type: 'lshape', icon: Box, label: 'L-Shape' },
        { type: 'tshape', icon: Box, label: 'T-Shape' },
        { type: 'hshape', icon: Box, label: 'H-Shape' }
      ]
    },
    {
      name: 'Mathematical',
      shapes: [
        { type: 'knot', icon: Star, label: 'Knot' },
        { type: 'helix', icon: Waves, label: 'Helix' },
        { type: 'mobius', icon: CircleDot, label: 'Möbius' },
        { type: 'trefoil', icon: Star, label: 'Trefoil' },
        { type: 'cinquefoil', icon: Star, label: 'Cinquefoil' },
        { type: 'klein', icon: CircleDot, label: 'Klein Bottle' }
      ]
    },
    {
      name: 'Parametric',
      shapes: [
        { type: 'parametricwave', icon: Waves, label: 'Wave Surface' },
        { type: 'parametricspiral', icon: Waves, label: 'Spiral Surface' },
        { type: 'parametricsaddle', icon: Box, label: 'Saddle' }
      ]
    },
    {
      name: 'Sweep/Lathe',
      shapes: [
        { type: 'sweepstar', icon: Star, label: 'Sweep Star' },
        { type: 'sweepcircle', icon: Circle, label: 'Sweep Circle' },
        { type: 'lathestar', icon: Star, label: 'Lathe Star' },
        { type: 'latheheart', icon: Heart, label: 'Lathe Heart' }
      ]
    }
  ];

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* TOP TOOLBAR */}
      <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-2">
        {/* Logo/Title */}
        <div className="flex items-center gap-2 mr-4">
          <Grid3X3 className="w-5 h-5 text-blue-400" />
          <span className="font-semibold text-lg">3D Editor</span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-600" />

        {/* Add Primitives - Basic shapes shown directly */}
        <div className="flex items-center gap-1 ml-2">
          {basicPrimitives.map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => addPrimitive(type)}
              className="p-2 hover:bg-gray-700 rounded transition-colors group relative"
              title={`Add ${label}`}
            >
              <Icon className="w-5 h-5" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {label}
              </span>
            </button>
          ))}
          
          {/* More Shapes Button */}
          <div className="relative">
            <button
              onClick={() => setShowShapesPanel(!showShapesPanel)}
              className={`p-2 rounded transition-colors flex items-center gap-1 ${
                showShapesPanel ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
              title="More Shapes"
            >
              <Shapes className="w-5 h-5" />
              <MoreHorizontal className="w-4 h-4" />
              {showShapesPanel ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
            
            {/* Shapes Dropdown Panel */}
            {showShapesPanel && (
              <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 w-80 max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Shapes className="w-4 h-4 text-blue-400" />
                    All Shapes
                  </span>
                  <span className="text-xs text-gray-500">75+ shapes</span>
                </div>
                
                {shapeCategories.map((category) => (
                  <div key={category.name} className="border-b border-gray-700 last:border-0">
                    <div className="px-3 py-2 text-xs font-medium text-gray-400 bg-gray-750 sticky top-12">
                      {category.name}
                    </div>
                    <div className="grid grid-cols-4 gap-1 p-2">
                      {category.shapes.map(({ type, icon: Icon, label }) => (
                        <button
                          key={type}
                          onClick={() => {
                            addPrimitive(type);
                            setShowShapesPanel(false);
                          }}
                          className="flex flex-col items-center gap-1 p-2 hover:bg-gray-700 rounded transition-colors group"
                          title={label}
                        >
                          <Icon className="w-6 h-6 text-gray-300 group-hover:text-white" />
                          <span className="text-[10px] text-gray-400 group-hover:text-gray-200 truncate w-full text-center">
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-600 ml-2" />

        {/* Transform Mode Buttons */}
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => setTransformMode('translate')}
            className={`p-2 rounded transition-colors ${transformMode === 'translate' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            title="Translate (T)"
          >
            <Move className="w-5 h-5" />
          </button>
          <button
            onClick={() => setTransformMode('rotate')}
            className={`p-2 rounded transition-colors ${transformMode === 'rotate' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            title="Rotate (R)"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setTransformMode('scale')}
            className={`p-2 rounded transition-colors ${transformMode === 'scale' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            title="Scale (S)"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-600 ml-2" />

        {/* Camera View Controls */}
        <div className="flex items-center gap-1 ml-2 relative">
          <button
            onClick={() => setShowCameraMenu(!showCameraMenu)}
            className="flex items-center gap-1 p-2 hover:bg-gray-700 rounded transition-colors"
            title="Camera View"
          >
            <Camera className="w-5 h-5" />
            <span className="text-xs capitalize">{cameraView}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          
          {showCameraMenu && (
            <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 min-w-[120px]">
              {['perspective', 'front', 'back', 'top', 'bottom', 'right', 'left'].map(view => (
                <button
                  key={view}
                  onClick={() => setCameraViewPosition(view)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700 capitalize ${
                    cameraView === view ? 'bg-blue-600' : ''
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
          )}
          
          <button
            onClick={resetCamera}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Reset Camera"
          >
            <Home className="w-5 h-5" />
          </button>
          
          <button
            onClick={focusOnSelected}
            disabled={!selectedObject}
            className={`p-2 rounded transition-colors ${!selectedObject ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
            title="Focus on Selected"
          >
            <Focus className="w-5 h-5" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-600 ml-2" />

        {/* Scene Settings */}
        <div className="flex items-center gap-1 ml-2 relative">
          <button
            onClick={() => setShowSceneSettings(!showSceneSettings)}
            className={`p-2 rounded transition-colors ${showSceneSettings ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            title="Scene Settings"
          >
            <Sun className="w-5 h-5" />
          </button>
          
          {showSceneSettings && (
            <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 p-3 w-64">
              <div className="text-xs font-medium text-gray-300 mb-3">Scene Settings</div>
              
              {/* Background Color */}
              <div className="mb-3">
                <label className="block text-xs text-gray-400 mb-1">Background Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => updateBackgroundColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-gray-600"
                  />
                  <span className="text-xs text-gray-400 uppercase">{backgroundColor}</span>
                </div>
              </div>
              
              {/* Grid Toggle */}
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs text-gray-400">Show Grid</label>
                <button
                  onClick={toggleGrid}
                  className={`w-10 h-5 rounded-full transition-colors ${showGrid ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${showGrid ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              
              {/* Grid Size */}
              <div className="mb-3">
                <label className="block text-xs text-gray-400 mb-1">Grid Size</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={gridSize}
                  onChange={(e) => updateGridSize(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                />
              </div>
              
              {/* Axes Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">Show Axes</label>
                <button
                  onClick={toggleAxes}
                  className={`w-10 h-5 rounded-full transition-colors ${showAxes ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${showAxes ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          )}
          
          {/* Lighting Panel Button */}
          <button
            onClick={() => setShowLightingPanel(!showLightingPanel)}
            className={`p-2 rounded transition-colors ${showLightingPanel ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            title="Lighting"
          >
            <Lightbulb className="w-5 h-5" />
          </button>
          
          {showLightingPanel && (
            <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 p-3 w-72" style={{ marginLeft: '40px' }}>
              <div className="text-xs font-medium text-gray-300 mb-3">Lighting</div>
              
              {/* Add Light Buttons */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => addLight('point')}
                  className="flex-1 flex items-center justify-center gap-1 bg-gray-700 hover:bg-gray-600 rounded px-2 py-1.5 text-xs"
                >
                  <Plus className="w-3 h-3" /> Point
                </button>
                <button
                  onClick={() => addLight('spot')}
                  className="flex-1 flex items-center justify-center gap-1 bg-gray-700 hover:bg-gray-600 rounded px-2 py-1.5 text-xs"
                >
                  <Plus className="w-3 h-3" /> Spot
                </button>
                <button
                  onClick={() => addLight('directional')}
                  className="flex-1 flex items-center justify-center gap-1 bg-gray-700 hover:bg-gray-600 rounded px-2 py-1.5 text-xs"
                >
                  <Plus className="w-3 h-3" /> Dir
                </button>
              </div>
              
              {/* Lights List */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {lights.length === 0 ? (
                  <div className="text-xs text-gray-500 text-center py-2">No custom lights</div>
                ) : (
                  lights.map(l => (
                    <div key={l.id} className="bg-gray-700 rounded p-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium capitalize">{l.name}</span>
                        <button
                          onClick={() => deleteLight(l.id)}
                          className="p-1 hover:bg-red-600 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      
                      {/* Color */}
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-xs text-gray-400 w-12">Color</label>
                        <input
                          type="color"
                          value={l.color}
                          onChange={(e) => updateLight(l.id, 'color', e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border border-gray-600"
                        />
                      </div>
                      
                      {/* Intensity */}
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-xs text-gray-400 w-12">Intensity</label>
                        <input
                          type="range"
                          min="0"
                          max="3"
                          step="0.1"
                          value={l.intensity}
                          onChange={(e) => updateLight(l.id, 'intensity', e.target.value)}
                          className="flex-1 h-1"
                        />
                        <span className="text-xs w-8">{l.intensity.toFixed(1)}</span>
                      </div>
                      
                      {/* Position */}
                      <div className="grid grid-cols-3 gap-1">
                        <input
                          type="number"
                          step="0.5"
                          value={l.position.x}
                          onChange={(e) => updateLight(l.id, 'positionX', e.target.value)}
                          className="bg-gray-600 rounded px-1 py-0.5 text-xs"
                          title="X"
                        />
                        <input
                          type="number"
                          step="0.5"
                          value={l.position.y}
                          onChange={(e) => updateLight(l.id, 'positionY', e.target.value)}
                          className="bg-gray-600 rounded px-1 py-0.5 text-xs"
                          title="Y"
                        />
                        <input
                          type="number"
                          step="0.5"
                          value={l.position.z}
                          onChange={(e) => updateLight(l.id, 'positionZ', e.target.value)}
                          className="bg-gray-600 rounded px-1 py-0.5 text-xs"
                          title="Z"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-600 ml-2" />

        {/* Snap Controls */}
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={toggleSnap}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              snapEnabled ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title="Toggle Grid Snap"
          >
            <Grid3X3 className="w-4 h-4" />
            Snap
          </button>
          {snapEnabled && (
            <input
              type="number"
              min="0.1"
              max="5"
              step="0.1"
              value={snapSize}
              onChange={(e) => updateSnapSize(e.target.value)}
              className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs"
              title="Snap Size"
            />
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-600 ml-2" />

        {/* File Operations */}
        <div className="flex items-center gap-1 ml-2">
          <label className="p-2 hover:bg-gray-700 rounded transition-colors cursor-pointer" title="Import Model">
            <Upload className="w-5 h-5" />
            <input
              type="file"
              accept=".glb,.gltf"
              onChange={importModel}
              className="hidden"
            />
          </label>
          <button
            onClick={exportScene}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Export Scene (GLB)"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={clearScene}
            className="p-2 hover:bg-gray-700 rounded transition-colors text-red-400 hover:text-red-300"
            title="Clear Scene"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-600 ml-2" />

        {/* Undo */}
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className={`p-2 rounded transition-colors ${undoStack.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-5 h-5" />
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>{fps} FPS</span>
          <span>{objects.length} objects</span>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR - Object List */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700 flex items-center gap-2">
            <Layers className="w-4 h-4 text-gray-400" />
            <span className="font-medium">Scene Objects</span>
            <span className="ml-auto text-xs text-gray-500">{objects.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {objects.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No objects in scene
              </div>
            ) : (
              objects.map(obj => {
                const isSelected = selectedObjects.find(s => s.id === obj.id) || selectedObject?.id === obj.id;
                return (
                <div
                  key={obj.id}
                  onClick={(e) => selectObject(obj, e.ctrlKey || e.metaKey)}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-600 bg-opacity-30 border-l-2 border-blue-500' 
                      : 'hover:bg-gray-700 border-l-2 border-transparent'
                  }`}
                >
                  {/* Object type icon */}
                  <Box className="w-4 h-4 text-gray-400" />
                  
                  {/* Object name */}
                  <span className={`flex-1 truncate text-sm ${!obj.mesh.visible ? 'text-gray-500' : ''}`}>
                    {obj.name}
                  </span>
                  
                  {/* Visibility toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisibility(obj);
                    }}
                    className="p-1 hover:bg-gray-600 rounded"
                    title={obj.mesh.visible ? 'Hide' : 'Show'}
                  >
                    {obj.mesh.visible ? (
                      <Eye className="w-4 h-4 text-gray-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteObject(obj);
                    }}
                    className="p-1 hover:bg-red-600 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-white" />
                  </button>
                </div>
              );})
            )}
          </div>
        </div>

        {/* CENTER - 3D Viewport */}
        <div 
          ref={containerRef}
          className="flex-1 relative cursor-crosshair"
          onClick={handleViewportClick}
        >
          {/* Keyboard shortcuts hint */}
          <div className="absolute bottom-4 left-4 bg-gray-900 bg-opacity-80 rounded px-3 py-2 text-xs text-gray-400">
            <div className="flex gap-4">
              <span><kbd className="bg-gray-700 px-1.5 py-0.5 rounded">T</kbd> Translate</span>
              <span><kbd className="bg-gray-700 px-1.5 py-0.5 rounded">R</kbd> Rotate</span>
              <span><kbd className="bg-gray-700 px-1.5 py-0.5 rounded">S</kbd> Scale</span>
              <span><kbd className="bg-gray-700 px-1.5 py-0.5 rounded">Del</kbd> Delete</span>
              <span><kbd className="bg-gray-700 px-1.5 py-0.5 rounded">Ctrl+D</kbd> Duplicate</span>
              <span><kbd className="bg-gray-700 px-1.5 py-0.5 rounded">Ctrl+Z</kbd> Undo</span>
            </div>
          </div>

          {/* Transform mode indicator */}
          <div className="absolute top-4 left-4 bg-gray-900 bg-opacity-80 rounded px-3 py-2 text-sm">
            <span className="text-gray-400">Mode: </span>
            <span className="text-blue-400 capitalize">{transformMode}</span>
          </div>
        </div>

        {/* RIGHT SIDEBAR - Properties Panel */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700 flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-400" />
            <span className="font-medium">Properties</span>
          </div>

          {selectedObject ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={selectedObject.name}
                  onChange={(e) => updateObjectProperty('name', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Type Badge */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Type</label>
                <span className="inline-block bg-gray-700 px-2 py-1 rounded text-xs capitalize">
                  {selectedObject.type}
                </span>
              </div>

              {/* Position */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Position</label>
                <div className="grid grid-cols-3 gap-2">
                  {['X', 'Y', 'Z'].map((axis) => (
                    <div key={axis}>
                      <label className="block text-xs text-gray-500 mb-1">{axis}</label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedObject.mesh.position[axis.toLowerCase()].toFixed(2)}
                        onChange={(e) => updateObjectProperty(`position${axis}`, e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Rotation */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Rotation (degrees)</label>
                <div className="grid grid-cols-3 gap-2">
                  {['X', 'Y', 'Z'].map((axis) => (
                    <div key={axis}>
                      <label className="block text-xs text-gray-500 mb-1">{axis}</label>
                      <input
                        type="number"
                        step="5"
                        value={THREE.MathUtils.radToDeg(selectedObject.mesh.rotation[axis.toLowerCase()]).toFixed(1)}
                        onChange={(e) => updateObjectProperty(`rotation${axis}`, e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Scale */}
              <div>
                <label className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <SlidersHorizontal className="w-3 h-3" /> Scale
                </label>
                
                {/* Uniform Scale Slider */}
                <div className="mb-3 p-2 bg-gray-700 rounded">
                  <label className="block text-xs text-gray-400 mb-2">Uniform Size</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const current = selectedObject.mesh.scale.x;
                        const newScale = Math.max(0.1, current - 0.1);
                        updateObjectProperty('scaleX', newScale);
                        updateObjectProperty('scaleY', newScale);
                        updateObjectProperty('scaleZ', newScale);
                      }}
                      className="p-1.5 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                      title="Decrease Size"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="range"
                      min="0.1"
                      max="5"
                      step="0.1"
                      value={selectedObject.mesh.scale.x}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateObjectProperty('scaleX', val);
                        updateObjectProperty('scaleY', val);
                        updateObjectProperty('scaleZ', val);
                      }}
                      className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <button
                      onClick={() => {
                        const current = selectedObject.mesh.scale.x;
                        const newScale = Math.min(10, current + 0.1);
                        updateObjectProperty('scaleX', newScale);
                        updateObjectProperty('scaleY', newScale);
                        updateObjectProperty('scaleZ', newScale);
                      }}
                      className="p-1.5 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                      title="Increase Size"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-400 w-12 text-center">
                      {selectedObject.mesh.scale.x.toFixed(1)}x
                    </span>
                  </div>
                  
                  {/* Quick size presets */}
                  <div className="flex gap-1 mt-2">
                    {[0.5, 1, 1.5, 2, 3, 5].map(size => (
                      <button
                        key={size}
                        onClick={() => {
                          updateObjectProperty('scaleX', size);
                          updateObjectProperty('scaleY', size);
                          updateObjectProperty('scaleZ', size);
                        }}
                        className={`flex-1 py-1 text-xs rounded transition-colors ${
                          Math.abs(selectedObject.mesh.scale.x - size) < 0.01
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                        }`}
                      >
                        {size}x
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Individual Axis Scale */}
                <div className="grid grid-cols-3 gap-2">
                  {['X', 'Y', 'Z'].map((axis) => (
                    <div key={axis}>
                      <label className="block text-xs text-gray-500 mb-1">{axis}</label>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const current = selectedObject.mesh.scale[axis.toLowerCase()];
                            updateObjectProperty(`scale${axis}`, Math.max(0.1, current - 0.1));
                          }}
                          className="p-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          step="0.1"
                          min="0.01"
                          value={selectedObject.mesh.scale[axis.toLowerCase()].toFixed(2)}
                          onChange={(e) => updateObjectProperty(`scale${axis}`, e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-1 py-1 text-sm text-center focus:outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={() => {
                            const current = selectedObject.mesh.scale[axis.toLowerCase()];
                            updateObjectProperty(`scale${axis}`, Math.min(10, current + 0.1));
                          }}
                          className="p-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <hr className="border-gray-700" />

              {/* Material Color */}
              <div>
                <label className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <Palette className="w-3 h-3" /> Material Color
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="color"
                    value={`#${selectedObject.mesh.material.color.getHexString()}`}
                    onChange={(e) => updateObjectProperty('color', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-gray-600"
                  />
                  <span className="text-sm text-gray-400 uppercase">
                    #{selectedObject.mesh.material.color.getHexString()}
                  </span>
                </div>
                {/* Color Presets */}
                <div className="grid grid-cols-10 gap-1 p-2 bg-gray-700 rounded max-h-32 overflow-y-auto">
                  {COLOR_PRESETS.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => updateObjectProperty('color', color)}
                      className={`w-5 h-5 rounded border-2 transition-transform hover:scale-110 ${
                        `#${selectedObject.mesh.material.color.getHexString()}`.toUpperCase() === color.toUpperCase()
                          ? 'border-white ring-1 ring-blue-400'
                          : 'border-transparent hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Metalness */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">
                  Metalness: {selectedObject.mesh.material.metalness.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={selectedObject.mesh.material.metalness}
                  onChange={(e) => updateObjectProperty('metalness', e.target.value)}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Roughness */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">
                  Roughness: {selectedObject.mesh.material.roughness.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={selectedObject.mesh.material.roughness}
                  onChange={(e) => updateObjectProperty('roughness', e.target.value)}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Opacity */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">
                  Opacity: {selectedObject.mesh.material.opacity.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={selectedObject.mesh.material.opacity}
                  onChange={(e) => updateObjectProperty('opacity', e.target.value)}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Wireframe Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">Wireframe</label>
                <button
                  onClick={() => updateObjectProperty('wireframe', !selectedObject.mesh.material.wireframe)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    selectedObject.mesh.material.wireframe ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    selectedObject.mesh.material.wireframe ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Emissive Color */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Emissive Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={`#${selectedObject.mesh.material.emissive.getHexString()}`}
                    onChange={(e) => updateObjectProperty('emissive', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-gray-600"
                  />
                  <span className="text-sm text-gray-400 uppercase">
                    #{selectedObject.mesh.material.emissive.getHexString()}
                  </span>
                </div>
              </div>

              {/* Emissive Intensity */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">
                  Emissive Intensity: {selectedObject.mesh.material.emissiveIntensity.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.01"
                  value={selectedObject.mesh.material.emissiveIntensity}
                  onChange={(e) => updateObjectProperty('emissiveIntensity', e.target.value)}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Divider */}
              <hr className="border-gray-700" />

              {/* Measurements */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Measurements</label>
                {(() => {
                  const box = new THREE.Box3().setFromObject(selectedObject.mesh);
                  const size = box.getSize(new THREE.Vector3());
                  const center = box.getCenter(new THREE.Vector3());
                  const distFromOrigin = selectedObject.mesh.position.length();
                  
                  return (
                    <div className="bg-gray-700 rounded p-2 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Width (X):</span>
                        <span>{size.x.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Height (Y):</span>
                        <span>{size.y.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Depth (Z):</span>
                        <span>{size.z.toFixed(2)}</span>
                      </div>
                      <hr className="border-gray-600 my-1" />
                      <div className="flex justify-between">
                        <span className="text-gray-400">Distance from origin:</span>
                        <span>{distFromOrigin.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Center:</span>
                        <span>({center.x.toFixed(1)}, {center.y.toFixed(1)}, {center.z.toFixed(1)})</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Divider */}
              <hr className="border-gray-700" />

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => duplicateObject(selectedObject)}
                  className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 rounded px-3 py-2 text-sm transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate Object
                </button>
                <button
                  onClick={() => deleteObject(selectedObject)}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 rounded px-3 py-2 text-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Object
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 p-8 text-center">
              <div>
                <Box className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Select an object to view and edit its properties</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreeDEditor;
