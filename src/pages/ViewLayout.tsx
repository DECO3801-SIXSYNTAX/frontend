import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group, Line, RegularPolygon, Ellipse, Arc } from 'react-konva';
import Konva from 'konva';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Users,
  Plus,
  Edit,
  Trash2,
  X,
  Save
} from 'lucide-react';
import { useDashboard } from '../contexts/DashboardContext';
import Layout from '../components/layout/Layout';
import { FloorPlanService } from '../services/FloorPlanService';
import { DashboardService } from '../services/DashboardService';

interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  dietaryRestrictions?: string;
  accessibilityNeeds?: string;
  elementId?: string;
}

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
  config: any;
  radius?: number;
}

interface FloorPlan {
  id?: string;
  eventId?: string;
  canvasSize: { width: number; height: number };
  pixelsPerMeter: number;
  elements: LayoutElement[];
  roomBoundary: any;
}

interface ViewLayoutProps {
  eventId: string;
}

const ViewLayout: React.FC<ViewLayoutProps> = ({ eventId }) => {
  const { setCurrentPage, events } = useDashboard();
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [guestForm, setGuestForm] = useState({
    name: '',
    email: '',
    phone: '',
    dietaryRestrictions: '',
    accessibilityNeeds: ''
  });

  // Initialize services
  const floorPlanService = new FloorPlanService();
  const dashboardService = new DashboardService();

  const event = events.find(e => e.id === eventId);

  useEffect(() => {
    loadFloorPlan();
    loadGuests();
  }, [eventId]);

  const loadFloorPlan = async () => {
    try {
      const eventPlan = await floorPlanService.getFloorPlanByEventId(eventId);
      if (eventPlan) {
        setFloorPlan(eventPlan);
      }
    } catch (error) {
      console.error('Error loading floor plan:', error);
    }
  };

  const loadGuests = async () => {
    try {
      const eventGuests = await dashboardService.getGuests(eventId);
      setGuests(eventGuests || []);
    } catch (error) {
      console.error('Error loading guests:', error);
    }
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
    const clampedScale = Math.max(0.1, Math.min(5, newScale));

    setStageScale(clampedScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale
    };

    setStagePosition(newPos);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const scaleBy = 1.2;
    const newScale = direction === 'in' ? stageScale * scaleBy : stageScale / scaleBy;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));
    setStageScale(clampedScale);
  };

  const selectedElement = floorPlan?.elements.find(el => el.id === selectedElementId);
  const elementGuests = guests.filter(g =>
    selectedElement?.assignedGuests?.includes(g.id)
  );

  const openAddGuestModal = () => {
    setEditingGuest(null);
    setGuestForm({
      name: '',
      email: '',
      phone: '',
      dietaryRestrictions: '',
      accessibilityNeeds: ''
    });
    setShowGuestModal(true);
  };

  const openEditGuestModal = (guest: Guest) => {
    setEditingGuest(guest);
    setGuestForm({
      name: guest.name,
      email: guest.email || '',
      phone: guest.phone || '',
      dietaryRestrictions: guest.dietaryRestrictions || '',
      accessibilityNeeds: guest.accessibilityNeeds || ''
    });
    setShowGuestModal(true);
  };

  const handleSaveGuest = async () => {
    try {
      if (editingGuest) {
        // Update existing guest
        await dashboardService.updateGuest(editingGuest.id, guestForm);
      } else {
        // Create new guest
        const newGuestData = {
          ...guestForm,
          eventId,
          rsvpStatus: 'pending' as const,
        };

        const createdGuests = await dashboardService.importGuests([newGuestData]);
        const newGuest = createdGuests[0];

        // Assign to selected element
        if (selectedElement && floorPlan && newGuest) {
          const updatedElements = floorPlan.elements.map(el =>
            el.id === selectedElement.id
              ? { ...el, assignedGuests: [...(el.assignedGuests || []), newGuest.id] }
              : el
          );

          // Save updated floor plan with new guest assignment
          await floorPlanService.saveFloorPlan({
            ...floorPlan,
            eventId, // Use eventId from props to ensure it's defined
            elements: updatedElements
          });
          setFloorPlan({ ...floorPlan, elements: updatedElements });
        }
      }

      await loadGuests();
      setShowGuestModal(false);
    } catch (error) {
      console.error('Error saving guest:', error);
      alert('Failed to save guest');
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (!window.confirm('Are you sure you want to remove this guest?')) return;

    try {
      // Remove from element assignment in floor plan
      if (selectedElement && floorPlan) {
        const updatedElements = floorPlan.elements.map(el =>
          el.id === selectedElement.id
            ? { ...el, assignedGuests: el.assignedGuests.filter(id => id !== guestId) }
            : el
        );

        // Save updated floor plan
        await floorPlanService.saveFloorPlan({
          ...floorPlan,
          eventId, // Use eventId from props to ensure it's defined
          elements: updatedElements
        });
        setFloorPlan({ ...floorPlan, elements: updatedElements });
      }

      await loadGuests();
    } catch (error) {
      console.error('Error deleting guest:', error);
      alert('Failed to delete guest');
    }
  };

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
        onClick={() => setSelectedElementId(element.id)}
      >
        {config.shape === 'circle' && (
          <Circle
            radius={element.radius || 40}
            fill={config.color}
            stroke={selectedElementId === element.id ? "#4F46E5" : "#374151"}
            strokeWidth={selectedElementId === element.id ? 4 : 2}
            shadowColor="rgba(0,0,0,0.3)"
            shadowBlur={5}
            shadowOffset={{ x: 2, y: 2 }}
          />
        )}

        {config.shape === 'rounded-rect' && (
          <Rect
            width={element.width}
            height={element.height}
            fill={config.color}
            stroke={selectedElementId === element.id ? "#4F46E5" : "#374151"}
            strokeWidth={selectedElementId === element.id ? 4 : 2}
            cornerRadius={8}
            shadowColor="rgba(0,0,0,0.3)"
            shadowBlur={5}
            shadowOffset={{ x: 2, y: 2 }}
          />
        )}

        {config.shape === 'ellipse' && (
          <Ellipse
            radiusX={element.width / 2}
            radiusY={element.height / 2}
            fill={config.color}
            stroke={selectedElementId === element.id ? "#4F46E5" : "#374151"}
            strokeWidth={selectedElementId === element.id ? 4 : 2}
            shadowColor="rgba(0,0,0,0.3)"
            shadowBlur={5}
            shadowOffset={{ x: 2, y: 2 }}
          />
        )}

        {config.shape === 'hexagon' && (
          <RegularPolygon
            sides={6}
            radius={element.width / 2}
            fill={config.color}
            stroke={selectedElementId === element.id ? "#4F46E5" : "#374151"}
            strokeWidth={selectedElementId === element.id ? 4 : 2}
            shadowColor="rgba(0,0,0,0.3)"
            shadowBlur={5}
            shadowOffset={{ x: 2, y: 2 }}
          />
        )}

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
              stroke={selectedElementId === element.id ? "#4F46E5" : "#374151"}
              strokeWidth={selectedElementId === element.id ? 4 : 3}
              shadowColor="rgba(0,0,0,0.3)"
              shadowBlur={5}
              shadowOffset={{ x: 2, y: 2 }}
            />
            <Rect
              y={element.height - 15}
              width={element.width}
              height={15}
              fill="#000000"
              opacity={0.2}
            />
          </>
        )}

        {config.shape === 'door' && (
          <>
            <Rect
              width={element.width}
              height={element.height}
              fill={config.color}
              stroke={selectedElementId === element.id ? "#4F46E5" : "#374151"}
              strokeWidth={selectedElementId === element.id ? 4 : 2}
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

        {element.assignedGuests && element.assignedGuests.length > 0 && (
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

  if (!floorPlan) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-500">No layout found for this event</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Controls */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentPage('event-list-for-layout')}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">{event?.name}</h2>
                  <p className="text-sm text-gray-500">View Layout</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
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

                <button
                  onClick={() => setCurrentPage(`layout-editor-${eventId}`)}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Layout
                </button>
              </div>
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
              draggable={true}
              onClick={(e: any) => {
                if (e.target === e.target.getStage()) {
                  setSelectedElementId(null);
                }
              }}
            >
              <Layer>
                {/* Room Boundary */}
                {floorPlan.roomBoundary && floorPlan.roomBoundary.vertices.length > 0 && (
                  <Line
                    points={floorPlan.roomBoundary.vertices.flatMap((v: any) => [v.x, v.y])}
                    stroke="#3B82F6"
                    strokeWidth={3}
                    closed={floorPlan.roomBoundary.closed}
                    fill={floorPlan.roomBoundary.closed ? 'rgba(59, 130, 246, 0.08)' : undefined}
                  />
                )}

                {/* Layout Elements */}
                {floorPlan.elements.map(element => renderShape(element))}
              </Layer>
            </Stage>
          </div>
        </div>

        {/* Side Panel - Guest List */}
        {selectedElement && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="w-96 bg-white border-l border-gray-200 flex flex-col"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">{selectedElement.name}</h3>
                <button
                  onClick={() => setSelectedElementId(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Capacity: {elementGuests.length} / {selectedElement.capacity}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">Assigned Guests</h4>
                <button
                  onClick={openAddGuestModal}
                  className="flex items-center px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  disabled={elementGuests.length >= selectedElement.capacity}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Guest
                </button>
              </div>

              {elementGuests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No guests assigned</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {elementGuests.map(guest => (
                    <div
                      key={guest.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{guest.name}</p>
                          {guest.email && (
                            <p className="text-xs text-gray-500 mt-1">{guest.email}</p>
                          )}
                          {guest.dietaryRestrictions && (
                            <p className="text-xs text-orange-600 mt-1">
                              Dietary: {guest.dietaryRestrictions}
                            </p>
                          )}
                          {guest.accessibilityNeeds && (
                            <p className="text-xs text-blue-600 mt-1">
                              Accessibility: {guest.accessibilityNeeds}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => openEditGuestModal(guest)}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteGuest(guest.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Guest Modal */}
        <AnimatePresence>
          {showGuestModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowGuestModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-2xl max-w-md w-full"
              >
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {editingGuest ? 'Edit Guest' : 'Add Guest'}
                  </h3>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={guestForm.name}
                      onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Guest name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={guestForm.email}
                      onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="guest@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={guestForm.phone}
                      onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="+1234567890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dietary Restrictions
                    </label>
                    <input
                      type="text"
                      value={guestForm.dietaryRestrictions}
                      onChange={(e) => setGuestForm({ ...guestForm, dietaryRestrictions: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., Vegetarian, Gluten-free"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Accessibility Needs
                    </label>
                    <input
                      type="text"
                      value={guestForm.accessibilityNeeds}
                      onChange={(e) => setGuestForm({ ...guestForm, accessibilityNeeds: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., Wheelchair access"
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowGuestModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveGuest}
                    disabled={!guestForm.name.trim()}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default ViewLayout;
