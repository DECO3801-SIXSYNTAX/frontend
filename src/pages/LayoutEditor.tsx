import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Text, Transformer, Group } from 'react-konva';
import Konva from 'konva';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Save,
  Download,
  Users,
  Search,
  Settings,
  Plus,
  Minus,
  Eye,
  Edit,
  FileText,
  ClipboardList,
  Map,
  Utensils,
  Accessibility,
  Crown,
  Mic,
  Calendar,
  Filter,
  Copy,
  Trash2,
  Undo,
  Redo,
  Share2,
  Menu
} from 'lucide-react';
import { useDashboard } from '../contexts/DashboardContext';
import Layout from '../components/layout/Layout';

interface LayoutElement {
  id: string;
  type: 'table' | 'round-table' | 'vip' | 'demo-zone' | 'stage' | 'entrance' | 'catering' | 'decoration';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  capacity: number;
  name: string;
  assignedGuests: string[];
  color: string;
  radius?: number; // For round tables
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

interface LayoutStats {
  totalCapacity: number;
  assignedGuests: number;
  dietaryRequirements: number;
  accessibilityNeeds: number;
}

const LayoutEditor: React.FC = () => {
  const { setCurrentPage } = useDashboard();
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas state
  const [stageScale, setStageScale] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isDraggingFromSidebar, setIsDraggingFromSidebar] = useState(false);
  const [dragElementType, setDragElementType] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Layout state
  const [layoutElements, setLayoutElements] = useState<LayoutElement[]>([
    {
      id: 'table-1',
      type: 'table',
      x: 100,
      y: 100,
      width: 120,
      height: 60,
      rotation: 0,
      capacity: 6,
      name: 'Table 1',
      assignedGuests: [],
      color: '#8B5CF6'
    },
    {
      id: 'round-table-1',
      type: 'round-table',
      x: 300,
      y: 150,
      width: 80,
      height: 80,
      rotation: 0,
      capacity: 8,
      name: 'Round Table 1',
      assignedGuests: [],
      color: '#3B82F6',
      radius: 40
    }
  ]);

  // Guest management state
  const [guests, setGuests] = useState<Guest[]>([
    {
      id: 'guest-1',
      name: 'John Smith',
      email: 'john@example.com',
      role: 'VIP',
      dietaryRestrictions: ['Vegan'],
      accessibilityNeeds: []
    },
    {
      id: 'guest-2',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      role: 'Speaker',
      dietaryRestrictions: [],
      accessibilityNeeds: ['Wheelchair']
    },
    {
      id: 'guest-3',
      name: 'Mike Wilson',
      email: 'mike@example.com',
      role: 'CEO',
      dietaryRestrictions: ['Gluten-Free'],
      accessibilityNeeds: []
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuestFilter, setSelectedGuestFilter] = useState('all');

  // Layout statistics
  const [layoutStats, setLayoutStats] = useState<LayoutStats>({
    totalCapacity: 0,
    assignedGuests: 0,
    dietaryRequirements: 0,
    accessibilityNeeds: 0
  });

  // Collaboration state
  const [onlineUsers] = useState([
    { id: 'user1', name: 'Alice Chen', avatar: '', color: '#EF4444' },
    { id: 'user2', name: 'Bob Smith', avatar: '', color: '#10B981' }
  ]);

  const elementTypes = [
    { type: 'table', icon: Grid3X3, label: 'Table', color: '#8B5CF6' },
    { type: 'round-table', icon: Circle, label: 'Round Table', color: '#3B82F6' },
    { type: 'vip', icon: Crown, label: 'VIP Area', color: '#F59E0B' },
    { type: 'demo-zone', icon: Mic, label: 'Demo Zone', color: '#10B981' },
    { type: 'stage', icon: Calendar, label: 'Stage', color: '#EF4444' },
    { type: 'entrance', icon: ArrowLeft, label: 'Entrance', color: '#6B7280' },
    { type: 'catering', icon: Utensils, label: 'Catering', color: '#F97316' }
  ];

  // Update layout statistics
  useEffect(() => {
    const totalCapacity = layoutElements.reduce((sum, element) => sum + element.capacity, 0);
    const assignedGuests = layoutElements.reduce((sum, element) => sum + element.assignedGuests.length, 0);
    const dietaryRequirements = guests.filter(guest => guest.dietaryRestrictions.length > 0).length;
    const accessibilityNeeds = guests.filter(guest => guest.accessibilityNeeds.length > 0).length;

    setLayoutStats({
      totalCapacity,
      assignedGuests,
      dietaryRequirements,
      accessibilityNeeds
    });
  }, [layoutElements, guests]);

  // Update canvas size based on container
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [sidebarOpen]);

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
    const clampedScale = Math.max(0.1, Math.min(3, newScale));

    setStageScale(clampedScale);

    // Update stage scale without changing position to avoid unwanted movement
    if (stageRef.current) {
      stageRef.current.scale({ x: clampedScale, y: clampedScale });
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const scaleBy = 1.2;
    const newScale = direction === 'in' ? stageScale * scaleBy : stageScale / scaleBy;
    const clampedScale = Math.max(0.1, Math.min(3, newScale));
    setStageScale(clampedScale);

    if (stageRef.current) {
      stageRef.current.scale({ x: clampedScale, y: clampedScale });
    }
  };

  const handleMouseDown = (type: string) => {
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
        // Adjust for stage scale and position
        const x = (pointer.x - stage.x()) / stage.scaleX();
        const y = (pointer.y - stage.y()) / stage.scaleY();

        addElement(dragElementType, x, y);
      }
    }
    handleMouseUp();
  };

  const handleStageClick = (e: any) => {
    // Check if we clicked on empty area
    const target = e.target;
    if (target === target.getStage()) {
      setSelectedId(null);
    }
  };

  const addElement = (type: string, x?: number, y?: number) => {
    const newElement: LayoutElement = {
      id: `${type}-${Date.now()}`,
      type: type as LayoutElement['type'],
      x: x ?? (200 + Math.random() * 100),
      y: y ?? (200 + Math.random() * 100),
      width: type === 'round-table' ? 80 : 120,
      height: type === 'round-table' ? 80 : 60,
      rotation: 0,
      capacity: type === 'round-table' ? 8 : 6,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${layoutElements.length + 1}`,
      assignedGuests: [],
      color: elementTypes.find(et => et.type === type)?.color || '#8B5CF6',
      radius: type === 'round-table' ? 40 : undefined
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

  const assignGuestToTable = (guestId: string, tableId: string) => {
    const table = layoutElements.find(el => el.id === tableId);
    if (!table || table.assignedGuests.length >= table.capacity) return;

    // Remove guest from any other table
    setLayoutElements(elements =>
      elements.map(element => ({
        ...element,
        assignedGuests: element.assignedGuests.filter(id => id !== guestId)
      }))
    );

    // Add guest to new table
    updateElement(tableId, {
      assignedGuests: [...table.assignedGuests, guestId]
    });

    // Update guest table assignment
    setGuests(guests =>
      guests.map(guest =>
        guest.id === guestId ? { ...guest, tableId } : guest
      )
    );
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

  const exportSeatingChart = () => {
    // Implementation for exporting seating chart
    console.log('Exporting seating chart...');
  };

  const exportCateringReport = () => {
    // Implementation for exporting catering report
    console.log('Exporting catering report...');
  };

  const exportGuestList = () => {
    // Implementation for exporting guest list
    console.log('Exporting guest list...');
  };

  const exportFloorPlan = () => {
    // Implementation for exporting floor plan PDF
    console.log('Exporting floor plan...');
  };

  const content = (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-16'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Layout Editor</h2>
                <p className="text-sm text-gray-500">Design your event layout</p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {sidebarOpen && (
          <>
            {/* Layout Elements */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Layout Elements</h3>
              <div className="grid grid-cols-2 gap-2">
                {elementTypes.map(({ type, icon: Icon, label, color }) => (
                  <button
                    key={type}
                    onMouseDown={() => handleMouseDown(type)}
                    onMouseUp={handleMouseUp}
                    className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 group cursor-grab active:cursor-grabbing"
                    disabled={isPreviewMode}
                  >
                    <Icon className="h-6 w-6 mb-1" style={{ color }} />
                    <span className="text-xs text-gray-600">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Guest Management */}
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Guests</h3>
                  <span className="text-xs text-gray-500">{guests.length} total</span>
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
                    { id: 'dietary', label: 'Dietary', count: guests.filter(g => g.dietaryRestrictions.length > 0).length },
                    { id: 'accessibility', label: 'Access', count: guests.filter(g => g.accessibilityNeeds.length > 0).length },
                    { id: 'unassigned', label: 'Unassigned', count: guests.filter(g => !g.tableId).length }
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedGuestFilter(filter.id)}
                      className={`px-2 py-1 text-xs rounded-full ${
                        selectedGuestFilter === filter.id
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {filter.label} ({filter.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest List */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {filteredGuests.map(guest => (
                    <div
                      key={guest.id}
                      className="flex items-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-move"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('guest-id', guest.id);
                      }}
                    >
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-white mr-3">
                        {guest.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{guest.name}</p>
                        <div className="flex items-center space-x-1">
                          <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                            guest.role === 'VIP' ? 'bg-yellow-100 text-yellow-800' :
                            guest.role === 'Speaker' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {guest.role}
                          </span>
                          {guest.dietaryRestrictions.length > 0 && (
                            <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                              {guest.dietaryRestrictions[0]}
                            </span>
                          )}
                          {guest.accessibilityNeeds.length > 0 && (
                            <Accessibility className="h-3 w-3 text-blue-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Controls */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentPage('event-settings')}
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
                    className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-white"
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
                  className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600 min-w-[50px] text-center">
                  {Math.round(stageScale * 100)}%
                </span>
                <button
                  onClick={() => handleZoom('in')}
                  className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-2 rounded ${showGrid ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'} hover:bg-indigo-200`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>

              {/* Mode toggle */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setIsPreviewMode(false)}
                  className={`px-3 py-1.5 text-sm rounded ${
                    !isPreviewMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <Edit className="h-4 w-4 inline mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => setIsPreviewMode(true)}
                  className={`px-3 py-1.5 text-sm rounded ${
                    isPreviewMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <Eye className="h-4 w-4 inline mr-1" />
                  Preview
                </button>
              </div>

              <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <Save className="h-4 w-4 mr-2" />
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 relative overflow-hidden bg-gray-100" ref={containerRef}>
          {/* @ts-ignore */}
          <Stage
            ref={stageRef}
            width={canvasSize.width}
            height={canvasSize.height}
            scaleX={stageScale}
            scaleY={stageScale}
            onWheel={handleWheel}
            draggable={false}
            onClick={handleStageClick}
            onMouseUp={handleStageMouseUp}
          >
            <Layer>
              {/* Grid */}
              {showGrid && (
                <>
                  {Array.from({ length: 100 }, (_, i) => (
                    <React.Fragment key={`grid-${i}`}>
                      <Rect
                        x={i * 20}
                        y={0}
                        width={1}
                        height={2000}
                        fill="#E5E7EB"
                      />
                      <Rect
                        x={0}
                        y={i * 20}
                        width={2000}
                        height={1}
                        fill="#E5E7EB"
                      />
                    </React.Fragment>
                  ))}
                </>
              )}

              {/* Layout Elements */}
              {layoutElements.map(element => (
                <Group
                  key={element.id}
                  id={element.id}
                  x={element.x}
                  y={element.y}
                  rotation={element.rotation}
                  draggable={!isPreviewMode}
                  onClick={() => setSelectedId(element.id)}
                  onDragEnd={(e: any) => {
                    const newX = snapToGrid ? Math.round(e.target.x() / 20) * 20 : e.target.x();
                    const newY = snapToGrid ? Math.round(e.target.y() / 20) * 20 : e.target.y();
                    updateElement(element.id, { x: newX, y: newY });
                  }}
                >
                  {element.type === 'round-table' ? (
                    <Circle
                      radius={element.radius || 40}
                      fill={element.color}
                      stroke="#374151"
                      strokeWidth={2}
                    />
                  ) : (
                    <Rect
                      width={element.width}
                      height={element.height}
                      fill={element.color}
                      stroke="#374151"
                      strokeWidth={2}
                      cornerRadius={4}
                    />
                  )}
                  <Text
                    text={element.name}
                    fontSize={12}
                    fill="white"
                    fontStyle="bold"
                    width={element.width}
                    height={element.height}
                    align="center"
                    verticalAlign="middle"
                  />
                  {element.assignedGuests.length > 0 && (
                    <Text
                      text={`${element.assignedGuests.length}/${element.capacity}`}
                      fontSize={10}
                      fill="white"
                      x={element.type === 'round-table' ? -20 : 5}
                      y={element.type === 'round-table' ? (element.radius || 40) + 5 : element.height + 5}
                    />
                  )}
                </Group>
              ))}

              {/* Transformer for selected element */}
              {selectedId && (
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox: any, newBox: any) => {
                    if (newBox.width < 5 || newBox.height < 5) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                />
              )}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Properties Panel */}
      {selectedElement && sidebarOpen && (
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Element Properties</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={selectedElement.name}
                onChange={(e) => updateElement(selectedElement.id, { name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input
                type="number"
                value={selectedElement.capacity}
                onChange={(e) => updateElement(selectedElement.id, { capacity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Layout Statistics</label>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Capacity:</span>
                  <span className="font-medium">{layoutStats.totalCapacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Assigned Guests:</span>
                  <span className="font-medium">{layoutStats.assignedGuests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dietary Requirements:</span>
                  <span className="font-medium">{layoutStats.dietaryRequirements}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Accessibility Needs:</span>
                  <span className="font-medium">{layoutStats.accessibilityNeeds}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Export Reports</h4>
              <div className="space-y-2">
                <button
                  onClick={exportSeatingChart}
                  className="w-full flex items-center px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Map className="h-4 w-4 mr-2" />
                  Seating Chart
                </button>
                <button
                  onClick={exportFloorPlan}
                  className="w-full flex items-center px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Floor Plan PDF
                </button>
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <button
                onClick={() => deleteElement(selectedElement.id)}
                className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                <Trash2 className="h-4 w-4 inline mr-1" />
                Delete
              </button>
            </div>
          </div>
        </div>
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