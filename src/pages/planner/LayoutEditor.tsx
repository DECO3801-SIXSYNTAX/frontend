import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Text, Transformer, Group, Line, Star, RegularPolygon, Ellipse, Arc } from 'react-konva';
import Konva from 'konva';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  Save,
  Download,
  Users,
  Search,
  Plus,
  Eye,
  Edit,
  FileText,
  Map,
  Utensils,
  Accessibility,
  Crown,
  Mic,
  Menu,
  X,
  Trash2,
  Square,
  Hexagon,
  Triangle,
  Presentation,
  DoorOpen,
  UtensilsCrossed,
  Sparkles,
  Ruler,
  Settings,
  Maximize,
  MoreVertical,
  UserPlus,
  Move,
  Circle as CircleIcon
} from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import Layout from '../../components/layout/Layout';
import { FloorPlanService } from '../../services/FloorPlanService';
import { GuestService, Guest as FirebaseGuest } from '../../services/GuestService';

// Configuration-based element types with realistic dimensions
interface ElementConfig {
  id: string;
  shape: 'rectangle' | 'circle' | 'hexagon' | 'triangle' | 'star' | 'ellipse' | 'rounded-rect' | 'stage' | 'door';
  icon: any;
  label: string;
  color: string;
  textColor: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultRadius?: number;
  description: string;
}

const ELEMENT_CONFIGS: ElementConfig[] = [
  {
    id: 'table',
    shape: 'rounded-rect',
    icon: Square,
    label: 'Rectangular Table',
    color: '#8B5CF6',
    textColor: '#FFFFFF',
    defaultWidth: 180,
    defaultHeight: 90,
    description: '6-8 person dining table'
  },
  {
    id: 'round-table',
    shape: 'circle',
    icon: CircleIcon,
    label: 'Round Table',
    color: '#3B82F6',
    textColor: '#FFFFFF',
    defaultWidth: 120,
    defaultHeight: 120,
    defaultRadius: 60,
    description: '8-10 person round table'
  },
  {
    id: 'cocktail-table',
    shape: 'circle',
    icon: CircleIcon,
    label: 'Cocktail Table',
    color: '#06B6D4',
    textColor: '#FFFFFF',
    defaultWidth: 60,
    defaultHeight: 60,
    defaultRadius: 30,
    description: 'Standing cocktail table'
  },
  {
    id: 'vip',
    shape: 'rounded-rect',
    icon: Crown,
    label: 'VIP Lounge',
    color: '#F59E0B',
    textColor: '#000000',
    defaultWidth: 240,
    defaultHeight: 160,
    description: 'VIP seating area'
  },
  {
    id: 'stage',
    shape: 'stage',
    icon: Presentation,
    label: 'Stage',
    color: '#EF4444',
    textColor: '#FFFFFF',
    defaultWidth: 400,
    defaultHeight: 200,
    description: 'Presentation stage'
  },
  {
    id: 'dance-floor',
    shape: 'rounded-rect',
    icon: Sparkles,
    label: 'Dance Floor',
    color: '#EC4899',
    textColor: '#FFFFFF',
    defaultWidth: 300,
    defaultHeight: 300,
    description: 'Dancing area'
  },
  {
    id: 'entrance',
    shape: 'door',
    icon: DoorOpen,
    label: 'Entrance',
    color: '#6B7280',
    textColor: '#FFFFFF',
    defaultWidth: 120,
    defaultHeight: 40,
    description: 'Entry/exit door'
  },
  {
    id: 'catering',
    shape: 'rounded-rect',
    icon: UtensilsCrossed,
    label: 'Buffet Station',
    color: '#F97316',
    textColor: '#FFFFFF',
    defaultWidth: 200,
    defaultHeight: 100,
    description: 'Food service area'
  },
  {
    id: 'bar',
    shape: 'rounded-rect',
    icon: Utensils,
    label: 'Bar',
    color: '#A855F7',
    textColor: '#FFFFFF',
    defaultWidth: 250,
    defaultHeight: 80,
    description: 'Bar counter'
  },
  {
    id: 'demo-zone',
    shape: 'hexagon',
    icon: Mic,
    label: 'Demo Zone',
    color: '#10B981',
    textColor: '#FFFFFF',
    defaultWidth: 180,
    defaultHeight: 180,
    description: 'Product demonstration area'
  },
  {
    id: 'lounge',
    shape: 'ellipse',
    icon: Users,
    label: 'Lounge Area',
    color: '#14B8A6',
    textColor: '#FFFFFF',
    defaultWidth: 200,
    defaultHeight: 150,
    description: 'Casual seating'
  }
];

interface LayoutElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  capacity: number;
  name: string;
  assignedGuests: string[];
  config: ElementConfig;
  radius?: number;
}

interface Guest {
  id: string;
  name: string;
  email: string;
  role: 'VIP' | 'Speaker' | 'CEO' | 'Director' | 'Manager' | 'Employee' | 'Guest';
  dietaryRestrictions: string[];
  accessibilityNeeds: string[];
  avatar?: string;
  tableId?: string;
  seatNumber?: number;
}

interface RoomBoundary {
  vertices: { x: number; y: number }[];
  closed: boolean;
}

interface FloorPlan {
  id?: string;
  eventId?: string;
  canvasSize: { width: number; height: number };
  pixelsPerMeter: number;
  elements: LayoutElement[];
  roomBoundary: RoomBoundary | null;
  createdAt?: string;
  updatedAt?: string;
}

interface LayoutEditorProps {
  eventId?: string;
}

const LayoutEditor: React.FC<LayoutEditorProps> = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  console.log('LayoutEditor - eventId from URL params:', eventId);
  
  const { setCurrentPage } = useDashboard();
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas state
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [isDraggingFromSidebar, setIsDraggingFromSidebar] = useState(false);
  const [dragElementType, setDragElementType] = useState<string | null>(null);
  const [isPanMode, setIsPanMode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isMiddleMouseDown, setIsMiddleMouseDown] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 2000, height: 1500 });
  const [tempCanvasSize, setTempCanvasSize] = useState({ width: 2000, height: 1500 });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pixelsPerMeter, setPixelsPerMeter] = useState(50);
  const [showRuler, setShowRuler] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [floorPlanId, setFloorPlanId] = useState<string | null>(null);
  const [showCanvasSettings, setShowCanvasSettings] = useState(false);

  // Room boundary state
  const [roomBoundary, setRoomBoundary] = useState<RoomBoundary | null>(null);
  const [isDrawingRoom, setIsDrawingRoom] = useState(false);
  const [tempVertex, setTempVertex] = useState<{ x: number; y: number } | null>(null);

  // Layout state
  const [layoutElements, setLayoutElements] = useState<LayoutElement[]>([]);

  // Guest management state - Start with empty, load from Firebase
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loadingGuests, setLoadingGuests] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuestFilter, setSelectedGuestFilter] = useState('all');
  const [activeGuestDropdown, setActiveGuestDropdown] = useState<string | null>(null);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [guestForm, setGuestForm] = useState({
    name: '',
    email: '',
    role: 'Guest' as Guest['role'],
    dietaryRestrictions: '',
    accessibilityNeeds: ''
  });
  const [assigningGuestId, setAssigningGuestId] = useState<string | null>(null);

  // Collaboration state
  const [onlineUsers] = useState([
    { id: 'user1', name: 'Alice Chen', avatar: '', color: '#EF4444' },
    { id: 'user2', name: 'Bob Smith', avatar: '', color: '#10B981' }
  ]);

  // Initialize FloorPlanService
  const floorPlanService = new FloorPlanService();
  const guestService = new GuestService();

  // Load floor plan on mount
  useEffect(() => {
    if (eventId) {
      loadFloorPlan();
      loadGuests();
    }
  }, [eventId]);

  // Debug: Log guests whenever they change
  useEffect(() => {
    console.log('Guests state updated:', guests);
    console.log('Number of guests:', guests.length);
  }, [guests]);

  // Keyboard listener for pan mode (spacebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isPanMode) {
        e.preventDefault();
        setIsPanMode(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPanMode(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPanMode]);

  const loadGuests = async () => {
    try {
      if (!eventId) {
        setLoadingGuests(false);
        return;
      }

      setLoadingGuests(true);
      console.log('Loading guests for event:', eventId);
      const firebaseGuests = await guestService.getGuestsByEvent(eventId);
      console.log('Loaded guests from Firebase:', firebaseGuests);
      
      // Convert Firebase guests to Layout Editor format
      const convertedGuests: Guest[] = firebaseGuests.map(fbGuest => ({
        id: fbGuest.id,
        name: fbGuest.name,
        email: fbGuest.email,
        role: 'Guest' as Guest['role'], // Default role since Firebase guests don't have this
        dietaryRestrictions: fbGuest.dietaryNeeds ? [fbGuest.dietaryNeeds] : [],
        accessibilityNeeds: fbGuest.accessibility ? [fbGuest.accessibility] : [],
        tableId: fbGuest.table || undefined, // Use the table field from Firebase
        seatNumber: undefined
      }));

      console.log('About to set guests state with:', convertedGuests);
      setGuests(convertedGuests);
      console.log('Converted guests for layout editor:', convertedGuests);
      console.log('Guests state should now have', convertedGuests.length, 'guests');
      setLoadingGuests(false);
    } catch (error) {
      console.error('Error loading guests:', error);
      setGuests([]); // Set empty array on error, don't keep mock guests
      setLoadingGuests(false);
    }
  };

  const loadFloorPlan = async () => {
    try {
      if (!eventId) return;

      const eventPlan = await floorPlanService.getFloorPlanByEventId(eventId);
      if (eventPlan) {
        setFloorPlanId(eventPlan.id || null);
        setCanvasSize(eventPlan.canvasSize);
        setTempCanvasSize(eventPlan.canvasSize);
        setPixelsPerMeter(eventPlan.pixelsPerMeter);

        // Rehydrate elements with icon components
        const rehydratedElements = eventPlan.elements.map((element: any) => {
          // Find the original config by id to get the icon
          const originalConfig = ELEMENT_CONFIGS.find(c => c.id === element.config.id);
          if (originalConfig) {
            return {
              ...element,
              config: {
                ...element.config,
                icon: originalConfig.icon
              }
            };
          }
          return element;
        });

        setLayoutElements(rehydratedElements);
        setRoomBoundary(eventPlan.roomBoundary);
        console.log('Loaded existing floor plan for event:', eventId);
      } else {
        console.log('No existing floor plan found for event:', eventId);
      }
    } catch (error) {
      console.error('Error loading floor plan:', error);
    }
  };

  const saveFloorPlan = async () => {
    setIsSaving(true);
    try {
      if (!eventId) {
        alert('No event ID provided. Cannot save floor plan.');
        return;
      }

      // Serialize elements for Firebase (remove icon component)
      const serializedElements = layoutElements.map(element => {
        const { config, ...rest } = element;
        const { icon, ...serializableConfig } = config;
        return {
          ...rest,
          config: serializableConfig
        };
      });

      const floorPlan = {
        eventId: eventId,
        canvasSize,
        pixelsPerMeter,
        elements: serializedElements,
        roomBoundary,
      };

      console.log('Saving floor plan:', floorPlan);

      const savedPlan = await floorPlanService.saveFloorPlan(floorPlan);
      setFloorPlanId(savedPlan.id || null);
      console.log('Floor plan saved successfully:', savedPlan);

      alert('Floor plan saved successfully!');

      // Redirect back to event list for layout
      setCurrentPage('event-list-for-layout');
    } catch (error: any) {
      console.error('Error saving floor plan:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Failed to save floor plan: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const applyCanvasSize = () => {
    const oldSize = canvasSize;
    const newSize = tempCanvasSize;

    // Only change canvas size - DO NOT scale elements
    // Elements should stay in their absolute positions
    if (oldSize.width !== newSize.width || oldSize.height !== newSize.height) {
      setCanvasSize(newSize);

      // Note: Elements are NOT scaled when canvas size changes
      // They maintain their absolute positions and sizes
      // If elements are outside the new canvas bounds, they'll still be there
      // but may be clipped visually
    }

    // Update grid size based on pixels per meter
    setGridSize(pixelsPerMeter / 2.5);
    setShowCanvasSettings(false);
  };

  // Update transformer when selection changes
  useEffect(() => {
    if (selectedId && transformerRef.current && stageRef.current) {
      const stage = stageRef.current;
      const selectedNode = stage.findOne(`#${selectedId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedId]);

  // Constrain stage position to keep canvas in view
  // Calculate minimum zoom scale to ensure canvas fills viewport
  const getMinZoomScale = (): number => {
    const container = containerRef.current;
    if (!container) return 0.1;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Calculate scale needed to fit canvas exactly in viewport
    const scaleToFitWidth = containerWidth / canvasSize.width;
    const scaleToFitHeight = containerHeight / canvasSize.height;

    // Use the larger of the two scales to ensure canvas fills viewport
    // This means canvas will always be at least as large as viewport
    const minScale = Math.max(scaleToFitWidth, scaleToFitHeight);

    return minScale;
  };

  const constrainStagePosition = (pos: { x: number; y: number }, scale: number): { x: number; y: number } => {
    const container = containerRef.current;
    if (!container) return pos;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const scaledCanvasWidth = canvasSize.width * scale;
    const scaledCanvasHeight = canvasSize.height * scale;

    let newX = pos.x;
    let newY = pos.y;

    // Keep canvas fully within viewport - no background visible
    // If canvas is smaller than viewport, center it
    // If canvas is larger than viewport, allow panning but keep edges within bounds

    if (scaledCanvasWidth <= containerWidth) {
      // Canvas fits horizontally - center it
      newX = (containerWidth - scaledCanvasWidth) / 2;
    } else {
      // Canvas larger than viewport - constrain to edges
      const maxX = 0; // Left edge of canvas at left edge of viewport
      const minX = containerWidth - scaledCanvasWidth; // Right edge at right edge
      newX = Math.max(minX, Math.min(maxX, newX));
    }

    if (scaledCanvasHeight <= containerHeight) {
      // Canvas fits vertically - center it
      newY = (containerHeight - scaledCanvasHeight) / 2;
    } else {
      // Canvas larger than viewport - constrain to edges
      const maxY = 0; // Top edge of canvas at top edge of viewport
      const minY = containerHeight - scaledCanvasHeight; // Bottom edge at bottom edge
      newY = Math.max(minY, Math.min(maxY, newY));
    }

    return { x: newX, y: newY };
  };

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = e.target.getStage();
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / stage.scaleX(),
      y: (pointer.y - stage.y()) / stage.scaleY()
    };

    const newScale = e.evt.deltaY > 0 ? stageScale / scaleBy : stageScale * scaleBy;
    const minScale = getMinZoomScale();
    const clampedScale = Math.max(minScale, Math.min(5, newScale));

    setStageScale(clampedScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale
    };

    const constrainedPos = constrainStagePosition(newPos, clampedScale);
    setStagePosition(constrainedPos);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const scaleBy = 1.2;
    const newScale = direction === 'in' ? stageScale * scaleBy : stageScale / scaleBy;
    const minScale = getMinZoomScale();
    const clampedScale = Math.max(minScale, Math.min(5, newScale));

    // Calculate the center of the viewport
    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = containerRef.current?.clientHeight || 600;
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    // Calculate the point in the canvas that's currently at the center
    const mousePointTo = {
      x: (centerX - stagePosition.x) / stageScale,
      y: (centerY - stagePosition.y) / stageScale
    };

    // Calculate new position to keep the same point at the center
    const newPos = {
      x: centerX - mousePointTo.x * clampedScale,
      y: centerY - mousePointTo.y * clampedScale
    };

    setStageScale(clampedScale);
    const constrainedPos = constrainStagePosition(newPos, clampedScale);
    setStagePosition(constrainedPos);
  };

  const handleMouseDown = (type: string) => {
    if (mode === 'preview') return;
    setIsDraggingFromSidebar(true);
    setDragElementType(type);
  };

  const handleMouseUp = () => {
    setIsDraggingFromSidebar(false);
    setDragElementType(null);
  };

  const handleStageMouseUp = (e: any) => {
    if (isDraggingFromSidebar && dragElementType) {
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();

      if (pointer) {
        const x = (pointer.x - stage.x()) / stage.scaleX();
        const y = (pointer.y - stage.y()) / stage.scaleY();
        addElement(dragElementType, x, y);
      }
    }
    handleMouseUp();
  };

  const handleStageClick = (e: any) => {
    const target = e.target;

    if (isDrawingRoom) {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const x = (pointer.x - stage.x()) / stage.scaleX();
      const y = (pointer.y - stage.y()) / stage.scaleY();

      const snappedX = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
      const snappedY = snapToGrid ? Math.round(y / gridSize) * gridSize : y;

      if (!roomBoundary) {
        setRoomBoundary({ vertices: [{ x: snappedX, y: snappedY }], closed: false });
      } else if (!roomBoundary.closed) {
        const firstVertex = roomBoundary.vertices[0];
        const distance = Math.sqrt(Math.pow(snappedX - firstVertex.x, 2) + Math.pow(snappedY - firstVertex.y, 2));

        if (distance < 30 && roomBoundary.vertices.length > 2) {
          setRoomBoundary({ ...roomBoundary, closed: true });
          setIsDrawingRoom(false);
        } else {
          setRoomBoundary({
            ...roomBoundary,
            vertices: [...roomBoundary.vertices, { x: snappedX, y: snappedY }]
          });
        }
      }
    } else if (target === target.getStage()) {
      setSelectedId(null);
    }
  };

  const handleStageMouseMove = (e: any) => {
    if (isDrawingRoom && roomBoundary && !roomBoundary.closed) {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const x = (pointer.x - stage.x()) / stage.scaleX();
      const y = (pointer.y - stage.y()) / stage.scaleY();

      const snappedX = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
      const snappedY = snapToGrid ? Math.round(y / gridSize) * gridSize : y;

      setTempVertex({ x: snappedX, y: snappedY });
    }
  };

  const addElement = (type: string, x?: number, y?: number) => {
    const config = ELEMENT_CONFIGS.find(c => c.id === type);
    if (!config) return;

    const newElement: LayoutElement = {
      id: `${type}-${Date.now()}`,
      type: type,
      x: x ?? (canvasSize.width / 2),
      y: y ?? (canvasSize.height / 2),
      width: config.defaultWidth,
      height: config.defaultHeight,
      rotation: 0,
      capacity: config.shape === 'circle' ? (config.defaultRadius! > 40 ? 8 : 4) : 6,
      name: `${config.label} ${layoutElements.filter(e => e.type === type).length + 1}`,
      assignedGuests: [],
      config: config,
      radius: config.defaultRadius
    };

    setLayoutElements([...layoutElements, newElement]);
  };

  const updateElement = (id: string, updates: Partial<LayoutElement>) => {
    setLayoutElements(elements =>
      elements.map(element =>
        element.id === id ? { ...element, ...updates } : element
      )
    );
  };

  const deleteElement = (id: string) => {
    setLayoutElements(elements => elements.filter(element => element.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  // Check if a point is inside the room boundary polygon
  const isPointInPolygon = (x: number, y: number, polygon: { x: number; y: number }[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;

      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Check if element's bounding box is within room boundary
  const isElementWithinBoundary = (element: LayoutElement, boundary: RoomBoundary): boolean => {
    if (!boundary || !boundary.closed || boundary.vertices.length < 3) {
      return true; // No boundary constraint
    }

    // Check all corners of the element
    const corners = [
      { x: element.x, y: element.y }, // Top-left
      { x: element.x + element.width, y: element.y }, // Top-right
      { x: element.x, y: element.y + element.height }, // Bottom-left
      { x: element.x + element.width, y: element.y + element.height } // Bottom-right
    ];

    // For circle elements, check the bounding square
    if (element.radius) {
      const radius = element.radius;
      corners.push(
        { x: element.x - radius, y: element.y - radius },
        { x: element.x + radius, y: element.y - radius },
        { x: element.x - radius, y: element.y + radius },
        { x: element.x + radius, y: element.y + radius }
      );
    }

    // All corners must be inside the boundary
    return corners.every(corner => isPointInPolygon(corner.x, corner.y, boundary.vertices));
  };

  // Constrain element position to stay within boundary
  const constrainToBoundary = (element: LayoutElement, newX: number, newY: number): { x: number; y: number } => {
    if (!roomBoundary || !roomBoundary.closed || roomBoundary.vertices.length < 3) {
      return { x: newX, y: newY };
    }

    const testElement = { ...element, x: newX, y: newY };
    if (isElementWithinBoundary(testElement, roomBoundary)) {
      return { x: newX, y: newY };
    }

    // If out of bounds, keep the old position
    return { x: element.x, y: element.y };
  };

  // Guest management functions
  const openAddGuestModal = () => {
    setEditingGuest(null);
    setGuestForm({
      name: '',
      email: '',
      role: 'Guest',
      dietaryRestrictions: '',
      accessibilityNeeds: ''
    });
    setShowGuestModal(true);
  };

  const openEditGuestModal = (guest: Guest) => {
    setEditingGuest(guest);
    setGuestForm({
      name: guest.name,
      email: guest.email,
      role: guest.role,
      dietaryRestrictions: guest.dietaryRestrictions.join(', '),
      accessibilityNeeds: guest.accessibilityNeeds.join(', ')
    });
    setShowGuestModal(true);
    setActiveGuestDropdown(null);
  };

  const handleSaveGuest = () => {
    if (!guestForm.name.trim()) return;

    const dietary = guestForm.dietaryRestrictions
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const accessibility = guestForm.accessibilityNeeds
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (editingGuest) {
      setGuests(guests.map(g =>
        g.id === editingGuest.id
          ? { ...g, ...guestForm, dietaryRestrictions: dietary, accessibilityNeeds: accessibility }
          : g
      ));
    } else {
      const newGuest: Guest = {
        id: `guest-${Date.now()}`,
        name: guestForm.name,
        email: guestForm.email,
        role: guestForm.role,
        dietaryRestrictions: dietary,
        accessibilityNeeds: accessibility
      };
      setGuests([...guests, newGuest]);
    }

    setShowGuestModal(false);
  };

  const handleDeleteGuest = (guestId: string) => {
    if (!window.confirm('Are you sure you want to delete this guest?')) return;

    // Remove from all elements
    setLayoutElements(elements =>
      elements.map(el => ({
        ...el,
        assignedGuests: el.assignedGuests.filter(id => id !== guestId)
      }))
    );
    setGuests(guests.filter(g => g.id !== guestId));
    setActiveGuestDropdown(null);
  };

  const handleAssignGuest = async (guestId: string, elementId: string) => {
    try {
      // Find the element to get its name for the table assignment
      const element = layoutElements.find(el => el.id === elementId);
      const tableName = element?.name || `Table ${elementId.slice(0, 8)}`;

      // Update guest's table in Firebase
      if (eventId) {
        await guestService.assignTable(eventId, guestId, tableName);
        console.log(`Assigned guest ${guestId} to table ${tableName}`);
      }

      // Update local state
      setGuests(prevGuests =>
        prevGuests.map(g =>
          g.id === guestId ? { ...g, tableId: tableName } : g
        )
      );

      // Remove guest from all other elements and add to selected element
      setLayoutElements(elements =>
        elements.map(el => ({
          ...el,
          assignedGuests: el.id === elementId
            ? [...el.assignedGuests, guestId]
            : el.assignedGuests.filter(id => id !== guestId)
        }))
      );
      
      setAssigningGuestId(null);
      setActiveGuestDropdown(null);
    } catch (error) {
      console.error('Error assigning guest to table:', error);
      alert('Failed to assign guest to table. Please try again.');
    }
  };

  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedGuestFilter === 'all') return matchesSearch;
    if (selectedGuestFilter === 'vip') return matchesSearch && guest.role === 'VIP';
    if (selectedGuestFilter === 'speakers') return matchesSearch && guest.role === 'Speaker';
    if (selectedGuestFilter === 'dietary') return matchesSearch && guest.dietaryRestrictions.length > 0;
    if (selectedGuestFilter === 'accessibility') return matchesSearch && guest.accessibilityNeeds.length > 0;
    if (selectedGuestFilter === 'unassigned') return matchesSearch && !guest.tableId;

    return matchesSearch;
  });

  const selectedElement = layoutElements.find(el => el.id === selectedId);

  const getTextWidth = (text: string, fontSize: number) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return 0;
    context.font = `bold ${fontSize}px Arial`;
    return context.measureText(text).width;
  };

  const renderShape = (element: LayoutElement) => {
    const { config } = element;
    const fontSize = Math.max(10, Math.min(14, element.width / 12));
    const textWidth = getTextWidth(element.name, fontSize);

    let textFits = false;
    if (config.shape === 'circle') {
      textFits = textWidth < (element.radius! * 1.6);
    } else if (config.shape === 'ellipse') {
      textFits = textWidth < (element.width * 0.8);
    } else {
      textFits = textWidth < (element.width - 20);
    }

    const labelOffsetY = config.shape === 'circle'
      ? element.radius! + 15
      : config.shape === 'ellipse'
      ? element.height / 2 + 15
      : element.height + 15;

    return (
      <Group
        key={element.id}
        id={element.id}
        x={element.x}
        y={element.y}
        rotation={element.rotation}
        draggable={mode === 'edit'}
        onClick={() => mode === 'edit' && setSelectedId(element.id)}
        onDragStart={(e: any) => {
          setIsDraggingElement(true);
          e.cancelBubble = true; // Prevent event from bubbling to Stage
        }}
        onDragMove={(e: any) => {
          e.cancelBubble = true; // Prevent event from bubbling to Stage during drag
        }}
        onDragEnd={(e: any) => {
          e.cancelBubble = true; // Prevent event from bubbling to Stage
          setIsDraggingElement(false);
          let newX = snapToGrid ? Math.round(e.target.x() / gridSize) * gridSize : e.target.x();
          let newY = snapToGrid ? Math.round(e.target.y() / gridSize) * gridSize : e.target.y();

          // Apply boundary constraints
          const constrained = constrainToBoundary(element, newX, newY);
          newX = constrained.x;
          newY = constrained.y;

          updateElement(element.id, { x: newX, y: newY });
          e.target.x(newX);
          e.target.y(newY);
        }}
        onTransformEnd={(e: any) => {
          const node = e.target;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          node.scaleX(1);
          node.scaleY(1);

          updateElement(element.id, {
            x: node.x(),
            y: node.y(),
            width: Math.max(20, node.width() * scaleX),
            height: Math.max(20, node.height() * scaleY),
            rotation: node.rotation(),
            radius: element.radius ? Math.max(20, element.radius * Math.min(scaleX, scaleY)) : undefined
          });
        }}
      >
        {/* Circle shape */}
        {config.shape === 'circle' && (
          <Circle
            radius={element.radius || 40}
            fill={config.color}
            stroke="#374151"
            strokeWidth={2}
            shadowColor="rgba(0,0,0,0.3)"
            shadowBlur={5}
            shadowOffset={{ x: 2, y: 2 }}
          />
        )}

        {/* Rectangle with rounded corners */}
        {config.shape === 'rounded-rect' && (
          <Rect
            width={element.width}
            height={element.height}
            fill={config.color}
            stroke="#374151"
            strokeWidth={2}
            cornerRadius={8}
            shadowColor="rgba(0,0,0,0.3)"
            shadowBlur={5}
            shadowOffset={{ x: 2, y: 2 }}
          />
        )}

        {/* Ellipse shape */}
        {config.shape === 'ellipse' && (
          <Ellipse
            radiusX={element.width / 2}
            radiusY={element.height / 2}
            fill={config.color}
            stroke="#374151"
            strokeWidth={2}
            shadowColor="rgba(0,0,0,0.3)"
            shadowBlur={5}
            shadowOffset={{ x: 2, y: 2 }}
          />
        )}

        {/* Hexagon shape */}
        {config.shape === 'hexagon' && (
          <RegularPolygon
            sides={6}
            radius={element.width / 2}
            fill={config.color}
            stroke="#374151"
            strokeWidth={2}
            shadowColor="rgba(0,0,0,0.3)"
            shadowBlur={5}
            shadowOffset={{ x: 2, y: 2 }}
          />
        )}

        {/* Stage shape (trapezoid) */}
        {config.shape === 'stage' && (
          <>
            <Line
              points={[
                20, 0,
                element.width - 20, 0,
                element.width, element.height,
                0, element.height
              ]}
              closed
              fill={config.color}
              stroke="#374151"
              strokeWidth={3}
              shadowColor="rgba(0,0,0,0.3)"
              shadowBlur={5}
              shadowOffset={{ x: 2, y: 2 }}
            />
            {/* Stage steps */}
            <Rect
              y={element.height - 15}
              width={element.width}
              height={15}
              fill="#000000"
              opacity={0.2}
            />
          </>
        )}

        {/* Door shape */}
        {config.shape === 'door' && (
          <>
            <Rect
              width={element.width}
              height={element.height}
              fill={config.color}
              stroke="#374151"
              strokeWidth={2}
              cornerRadius={4}
            />
            <Arc
              x={element.width * 0.25}
              y={element.height / 2}
              innerRadius={0}
              outerRadius={element.width * 0.2}
              angle={90}
              rotation={-45}
              fill="#FFFFFF"
              opacity={0.3}
            />
          </>
        )}

        {/* Text inside shape if it fits */}
        {textFits && (
          <Text
            text={element.name}
            fontSize={fontSize}
            fill={config.textColor}
            fontStyle="bold"
            width={config.shape === 'circle' ? element.radius! * 2 : element.width}
            height={config.shape === 'circle' ? element.radius! * 2 : element.height}
            align="center"
            verticalAlign="middle"
            offsetX={config.shape === 'circle' ? element.radius : 0}
            offsetY={config.shape === 'circle' ? element.radius : 0}
          />
        )}

        {/* Labeled chip below if text doesn't fit */}
        {!textFits && (
          <Group y={labelOffsetY}>
            <Rect
              width={textWidth + 16}
              height={22}
              fill={config.color}
              cornerRadius={11}
              offsetX={(textWidth + 16) / 2}
              stroke="#374151"
              strokeWidth={1}
            />
            <Text
              text={element.name}
              fontSize={11}
              fill={config.textColor}
              fontStyle="bold"
              align="center"
              width={textWidth + 16}
              height={22}
              verticalAlign="middle"
              offsetX={(textWidth + 16) / 2}
            />
          </Group>
        )}

        {/* Capacity indicator */}
        {element.assignedGuests.length > 0 && (
          <Group y={labelOffsetY + (textFits ? 0 : 28)}>
            <Rect
              width={60}
              height={18}
              fill="#FFFFFF"
              cornerRadius={9}
              offsetX={30}
              stroke="#374151"
              strokeWidth={1}
            />
            <Text
              text={`${element.assignedGuests.length}/${element.capacity}`}
              fontSize={10}
              fill="#374151"
              fontStyle="bold"
              align="center"
              width={60}
              height={18}
              verticalAlign="middle"
              offsetX={30}
            />
          </Group>
        )}
      </Group>
    );
  };

  const content = (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.3 }}
            className="w-80 bg-white border-r border-gray-200 flex flex-col min-h-0"
          >
            {/* Sidebar Header - Fixed */}
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Layout Editor</h2>
                  <p className="text-sm text-gray-500">Design your event layout</p>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {/* Layout Elements */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Layout Elements</h3>
                <div className="grid grid-cols-2 gap-2">
                  {ELEMENT_CONFIGS.map(({ id, icon: Icon, label, color, description }) => (
                    <button
                      key={id}
                      onMouseDown={() => handleMouseDown(id)}
                      onMouseUp={handleMouseUp}
                      title={description}
                      className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 group cursor-grab active:cursor-grabbing disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      disabled={mode === 'preview'}
                    >
                      <Icon className="h-6 w-6 mb-1" style={{ color }} />
                      <span className="text-xs text-gray-600 text-center leading-tight">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Room Boundary Tool */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Room Boundary</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setIsDrawingRoom(!isDrawingRoom)}
                    disabled={mode === 'preview'}
                    className={`w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                      isDrawingRoom
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isDrawingRoom ? 'Drawing... (Click to add vertices)' : 'Draw Room Boundary'}
                  </button>
                  {roomBoundary && (
                    <button
                      onClick={() => {
                        setRoomBoundary(null);
                        setIsDrawingRoom(false);
                      }}
                      className="w-full px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      Clear Boundary
                    </button>
                  )}
                  {isDrawingRoom && roomBoundary && roomBoundary.vertices.length > 2 && (
                    <p className="text-xs text-gray-500 text-center">
                      Click near first point to close polygon
                    </p>
                  )}
                </div>
              </div>

              {/* Guest Management */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Guests</h3>
                    <span className="text-xs text-gray-500">{guests.length} total</span>
                  </div>
                  <button
                    onClick={openAddGuestModal}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Add Guest</span>
                  </button>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search guests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {[
                    { id: 'all', label: 'All', count: guests.length },
                    { id: 'vip', label: 'VIP', count: guests.filter(g => g.role === 'VIP').length },
                    { id: 'speakers', label: 'Speakers', count: guests.filter(g => g.role === 'Speaker').length },
                    { id: 'unassigned', label: 'Unassigned', count: guests.filter(g => !g.tableId).length }
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedGuestFilter(filter.id)}
                      className={`px-2 py-1 text-xs rounded-full transition-colors ${
                        selectedGuestFilter === filter.id
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {filter.label} ({filter.count})
                    </button>
                  ))}
                </div>

                {/* Guest List */}
                {loadingGuests ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Loading guests...</p>
                  </div>
                ) : guests.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-700 font-medium">No guests yet</p>
                    <p className="text-xs text-gray-500 mt-1">Add guests in Guest Management</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                  {filteredGuests.map(guest => (
                    <div
                      key={guest.id}
                      className="relative flex items-start p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-xs font-medium text-white mr-3 flex-shrink-0">
                        {guest.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0 mr-6">
                        <p className="text-sm font-medium text-gray-900 truncate">{guest.name}</p>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                            guest.role === 'VIP' ? 'bg-yellow-100 text-yellow-800' :
                            guest.role === 'Speaker' ? 'bg-blue-100 text-blue-800' :
                            guest.role === 'CEO' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {guest.role}
                          </span>
                          {guest.dietaryRestrictions.map((diet, i) => (
                            <span key={i} className="px-1.5 py-0.5 text-xs rounded-full bg-orange-100 text-orange-800">
                              {diet}
                            </span>
                          ))}
                          {guest.accessibilityNeeds.map((need, i) => (
                            <span key={i} className="px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                              {need}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => setActiveGuestDropdown(activeGuestDropdown === guest.id ? null : guest.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {activeGuestDropdown === guest.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                            <button
                              onClick={() => {
                                setAssigningGuestId(guest.id);
                                setActiveGuestDropdown(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              Assign Seat
                            </button>
                            <button
                              onClick={() => openEditGuestModal(guest)}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteGuest(guest.id)}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Controls */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}

              <button
                onClick={() => navigate('/planner/event-list-for-layout')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>

              {/* Collaboration indicators */}
              <div className="flex items-center space-x-2">
                {onlineUsers.map(user => (
                  <div
                    key={user.id}
                    className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-white ring-2 ring-white"
                    style={{ backgroundColor: user.color }}
                    title={user.name}
                  >
                    {user.name.charAt(0)}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Canvas Controls */}
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleZoom('out')}
                  className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600 min-w-[50px] text-center font-medium">
                  {Math.round(stageScale * 100)}%
                </span>
                <button
                  onClick={() => handleZoom('in')}
                  className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>

              {/* Pan Mode Indicator */}
              {isPanMode && (
                <div className="flex items-center space-x-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                  <Move className="h-4 w-4" />
                  <span>Pan Mode (Hold Space)</span>
                </div>
              )}

              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-2 rounded transition-colors ${showGrid ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'} hover:bg-indigo-200`}
                title="Toggle Grid"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>

              <button
                onClick={() => setShowRuler(!showRuler)}
                className={`p-2 rounded transition-colors ${showRuler ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'} hover:bg-indigo-200`}
                title="Toggle Ruler"
              >
                <Ruler className="h-4 w-4" />
              </button>

              <button
                onClick={() => setShowCanvasSettings(!showCanvasSettings)}
                className={`p-2 rounded transition-colors ${showCanvasSettings ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'} hover:bg-indigo-200`}
                title="Canvas Settings"
              >
                <Maximize className="h-4 w-4" />
              </button>

              {/* Mode toggle */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setMode('edit')}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    mode === 'edit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <Edit className="h-4 w-4 inline mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => setMode('preview')}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    mode === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <Eye className="h-4 w-4 inline mr-1" />
                  Preview
                </button>
              </div>

              <button
                onClick={saveFloorPlan}
                disabled={isSaving}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Canvas Settings Panel */}
          {showCanvasSettings && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <h4 className="text-sm font-medium text-gray-900 mb-3">Canvas Settings</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Width (px)</label>
                  <input
                    type="number"
                    value={tempCanvasSize.width}
                    onChange={(e) => setTempCanvasSize({ ...tempCanvasSize, width: parseInt(e.target.value) || 800 })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="800"
                    max="5000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Height (px)</label>
                  <input
                    type="number"
                    value={tempCanvasSize.height}
                    onChange={(e) => setTempCanvasSize({ ...tempCanvasSize, height: parseInt(e.target.value) || 600 })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="600"
                    max="5000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Scale (px/m)</label>
                  <input
                    type="number"
                    value={pixelsPerMeter}
                    onChange={(e) => setPixelsPerMeter(parseInt(e.target.value) || 50)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="20"
                    max="200"
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Canvas: {(canvasSize.width / pixelsPerMeter).toFixed(1)}m × {(canvasSize.height / pixelsPerMeter).toFixed(1)}m
                </p>
                <button
                  onClick={applyCanvasSize}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Apply Changes
                </button>
              </div>
            </motion.div>
          )}

          {/* Scale indicator */}
          <div className="mt-2 text-xs text-gray-500">
            Scale: {pixelsPerMeter} px = 1m | Canvas: {canvasSize.width} × {canvasSize.height} px ({(canvasSize.width / pixelsPerMeter).toFixed(1)}m × {(canvasSize.height / pixelsPerMeter).toFixed(1)}m)
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 relative overflow-hidden bg-gray-100" ref={containerRef}>
          {/* @ts-ignore */}
          <Stage
            ref={stageRef}
            width={containerRef.current?.clientWidth || 800}
            height={containerRef.current?.clientHeight || 600}
            scaleX={stageScale}
            scaleY={stageScale}
            x={stagePosition.x}
            y={stagePosition.y}
            onWheel={handleWheel}
            draggable={!isDraggingElement}
            onDragStart={() => setIsPanning(true)}
            onDragEnd={(e: any) => {
              setIsPanning(false);
              const newPos = { x: e.target.x(), y: e.target.y() };
              const constrainedPos = constrainStagePosition(newPos, stageScale);
              setStagePosition(constrainedPos);
              e.target.x(constrainedPos.x);
              e.target.y(constrainedPos.y);
            }}
            onClick={handleStageClick}
            onMouseDown={(e: any) => {
              // Enable panning with middle mouse button (button 1)
              if (e.evt.button === 1) {
                e.evt.preventDefault();
                setIsMiddleMouseDown(true);
              }
            }}
            onMouseUp={(e: any) => {
              if (e.evt.button === 1) {
                setIsMiddleMouseDown(false);
              }
              handleStageMouseUp(e);
            }}
            onMouseMove={handleStageMouseMove}
          >
            <Layer>
              {/* Grid */}
              {showGrid && (
                <>
                  {Array.from({ length: Math.ceil(canvasSize.width / gridSize) }, (_, i) => (
                    <Line
                      key={`grid-v-${i}`}
                      points={[i * gridSize, 0, i * gridSize, canvasSize.height]}
                      stroke={i % 5 === 0 ? "#D1D5DB" : "#E5E7EB"}
                      strokeWidth={i % 5 === 0 ? 1.5 : 0.5}
                    />
                  ))}
                  {Array.from({ length: Math.ceil(canvasSize.height / gridSize) }, (_, i) => (
                    <Line
                      key={`grid-h-${i}`}
                      points={[0, i * gridSize, canvasSize.width, i * gridSize]}
                      stroke={i % 5 === 0 ? "#D1D5DB" : "#E5E7EB"}
                      strokeWidth={i % 5 === 0 ? 1.5 : 0.5}
                    />
                  ))}
                </>
              )}

              {/* Ruler */}
              {showRuler && (
                <>
                  {/* Horizontal ruler */}
                  <Rect x={0} y={0} width={canvasSize.width} height={35} fill="#F9FAFB" opacity={0.95} />
                  {Array.from({ length: Math.floor(canvasSize.width / pixelsPerMeter) + 1 }, (_, i) => (
                    <React.Fragment key={`ruler-h-${i}`}>
                      <Line
                        points={[i * pixelsPerMeter, 28, i * pixelsPerMeter, 35]}
                        stroke="#6B7280"
                        strokeWidth={1.5}
                      />
                      <Text
                        x={i * pixelsPerMeter + 3}
                        y={8}
                        text={`${i}m`}
                        fontSize={11}
                        fill="#374151"
                        fontStyle="bold"
                      />
                    </React.Fragment>
                  ))}

                  {/* Vertical ruler */}
                  <Rect x={0} y={0} width={35} height={canvasSize.height} fill="#F9FAFB" opacity={0.95} />
                  {Array.from({ length: Math.floor(canvasSize.height / pixelsPerMeter) + 1 }, (_, i) => (
                    <React.Fragment key={`ruler-v-${i}`}>
                      <Line
                        points={[28, i * pixelsPerMeter, 35, i * pixelsPerMeter]}
                        stroke="#6B7280"
                        strokeWidth={1.5}
                      />
                      <Text
                        x={3}
                        y={i * pixelsPerMeter + 3}
                        text={`${i}m`}
                        fontSize={11}
                        fill="#374151"
                        fontStyle="bold"
                      />
                    </React.Fragment>
                  ))}
                </>
              )}

              {/* Room Boundary */}
              {roomBoundary && roomBoundary.vertices.length > 0 && (
                <>
                  <Line
                    points={roomBoundary.vertices.flatMap(v => [v.x, v.y])}
                    stroke="#3B82F6"
                    strokeWidth={3}
                    closed={roomBoundary.closed}
                    fill={roomBoundary.closed ? 'rgba(59, 130, 246, 0.08)' : undefined}
                    dash={roomBoundary.closed ? undefined : [10, 5]}
                  />
                  {!roomBoundary.closed && tempVertex && (
                    <Line
                      points={[
                        roomBoundary.vertices[roomBoundary.vertices.length - 1].x,
                        roomBoundary.vertices[roomBoundary.vertices.length - 1].y,
                        tempVertex.x,
                        tempVertex.y
                      ]}
                      stroke="#93C5FD"
                      strokeWidth={2}
                      dash={[5, 5]}
                    />
                  )}
                  {roomBoundary.vertices.map((vertex, i) => (
                    <Circle
                      key={`vertex-${i}`}
                      x={vertex.x}
                      y={vertex.y}
                      radius={6}
                      fill={i === 0 ? '#EF4444' : '#3B82F6'}
                      stroke="#FFFFFF"
                      strokeWidth={2}
                      draggable={mode === 'edit' && !isDrawingRoom}
                      onDragStart={(e: any) => {
                        e.cancelBubble = true;
                      }}
                      onDragMove={(e: any) => {
                        e.cancelBubble = true;
                      }}
                      onDragEnd={(e: any) => {
                        e.cancelBubble = true;
                        const newVertices = [...roomBoundary.vertices];
                        newVertices[i] = { x: e.target.x(), y: e.target.y() };
                        setRoomBoundary({ ...roomBoundary, vertices: newVertices });
                      }}
                    />
                  ))}
                </>
              )}

              {/* Layout Elements */}
              {layoutElements.map(element => renderShape(element))}

              {/* Transformer for selected element */}
              {selectedId && mode === 'edit' && (
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox: any, newBox: any) => {
                    if (newBox.width < 30 || newBox.height < 30) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                  rotateEnabled={true}
                  enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                />
              )}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Properties Panel */}
      {selectedElement && (
        <motion.div
          initial={{ x: 320 }}
          animate={{ x: 0 }}
          exit={{ x: 320 }}
          className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Element Properties</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={selectedElement.name}
                onChange={(e) => updateElement(selectedElement.id, { name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={mode === 'preview'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input
                type="number"
                value={selectedElement.capacity}
                onChange={(e) => updateElement(selectedElement.id, { capacity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={mode === 'preview'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">X (px)</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.x)}
                    onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={mode === 'preview'}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Y (px)</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.y)}
                    onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={mode === 'preview'}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Width (px)</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.width)}
                    onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 20 })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={mode === 'preview'}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Height (px)</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.height)}
                    onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 20 })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={mode === 'preview'}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Real size: {(selectedElement.width / pixelsPerMeter).toFixed(2)}m × {(selectedElement.height / pixelsPerMeter).toFixed(2)}m
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Element Type</span>
                <div className="flex items-center space-x-2">
                  {React.createElement(selectedElement.config.icon, {
                    className: 'h-5 w-5',
                    style: { color: selectedElement.config.color }
                  })}
                  <span className="text-sm text-gray-600">{selectedElement.config.label}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">{selectedElement.config.description}</p>
            </div>

            {mode === 'edit' && (
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={() => deleteElement(selectedElement.id)}
                  className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="h-4 w-4 inline mr-1" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Assign Guest Modal */}
      {assigningGuestId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setAssigningGuestId(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Guest to Element</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select an element to assign {guests.find(g => g.id === assigningGuestId)?.name} to:
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {layoutElements.map(element => (
                <button
                  key={element.id}
                  onClick={() => handleAssignGuest(assigningGuestId, element.id)}
                  className="w-full px-4 py-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{element.name}</p>
                      <p className="text-xs text-gray-500">{element.config.label}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {element.assignedGuests.length}/{element.capacity}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setAssigningGuestId(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Add/Edit Guest Modal */}
      {showGuestModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowGuestModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingGuest ? 'Edit Guest' : 'Add New Guest'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={guestForm.name}
                  onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Guest name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={guestForm.email}
                  onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="guest@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={guestForm.role}
                  onChange={(e) => setGuestForm({ ...guestForm, role: e.target.value as Guest['role'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Guest">Guest</option>
                  <option value="VIP">VIP</option>
                  <option value="Speaker">Speaker</option>
                  <option value="CEO">CEO</option>
                  <option value="Director">Director</option>
                  <option value="Manager">Manager</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dietary Restrictions
                  <span className="text-xs text-gray-500 ml-2">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={guestForm.dietaryRestrictions}
                  onChange={(e) => setGuestForm({ ...guestForm, dietaryRestrictions: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Vegan, Gluten-Free, Halal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Accessibility Needs
                  <span className="text-xs text-gray-500 ml-2">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={guestForm.accessibilityNeeds}
                  onChange={(e) => setGuestForm({ ...guestForm, accessibilityNeeds: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Wheelchair, Sign Language, Hearing Aid"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={handleSaveGuest}
                disabled={!guestForm.name.trim()}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingGuest ? 'Save Changes' : 'Add Guest'}
              </button>
              <button
                onClick={() => setShowGuestModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );

  return (
    <Layout>
      {content}
    </Layout>
  );
};

export default LayoutEditor;