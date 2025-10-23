import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Search, Bell, ArrowLeft, Users, MapPin, Calendar, AlertCircle, ZoomIn, ZoomOut } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import { Stage, Layer, Rect, Circle, Text, Group, Line, RegularPolygon, Ellipse } from 'react-konva';
import { DashboardService } from '../../services/DashboardService';
import { GuestService } from '../../services/GuestService';
import { FloorPlanService } from '../../services/FloorPlanService';
import { auth, db } from '../../config/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

interface Guest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  table?: string;
  seat?: string;
  dietaryNeeds?: string;
  accessibility?: string;
  seatId?: string;
  seatName?: string;
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
  eventId: string;
  canvasSize: { width: number; height: number };
  pixelsPerMeter: number;
  elements: LayoutElement[];
  roomBoundary: any;
}

interface Event {
  id: string;
  name: string;
  venue: string;
  date: string;
  status: string;
  attendees: number;
  description?: string;
}

export default function SeatingView() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [layout, setLayout] = useState<FloorPlan | null>(null);
  const [apiGuests, setApiGuests] = useState<Guest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const floorPlanService = new FloorPlanService();
  const guestService = new GuestService();

  // Load event data when eventId changes
  useEffect(() => {
    if (!eventId) {
      setError('No event ID provided');
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const { db } = await import('../../config/firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        
        const eventRef = doc(db, 'events', eventId);
        const eventDoc = await getDoc(eventRef);
        
        if (cancelled) return;
        
        if (!eventDoc.exists()) {
          setError('Event not found');
          setLoading(false);
          return;
        }
        
        const eventData = eventDoc.data();
        const eventObj = {
          id: eventDoc.id,
          name: eventData.name || '',
          venue: eventData.venue || '',
          date: eventData.startDate || eventData.date || '',
          status: eventData.status || '',
          attendees: eventData.expectedAttendees || eventData.attendees || 0,
          description: eventData.description || '',
        };
        
        setEvent(eventObj as any);

        try {
          const layoutData = await floorPlanService.getFloorPlanByEventId(eventId);
          if (cancelled) return;
          
          if (layoutData) {
            setLayout({
              id: layoutData.id,
              eventId: layoutData.eventId,
              canvasSize: layoutData.canvasSize,
              pixelsPerMeter: layoutData.pixelsPerMeter,
              elements: layoutData.elements,
              roomBoundary: layoutData.roomBoundary
            });
          } else {
            setLayout(null);
          }
        } catch (err) {
          setLayout(null);
        }

        try {
          const guestsData = await guestService.getGuestsByEvent(eventId);
          if (cancelled) return;
          setApiGuests(guestsData as any);
        } catch (err) {
          setApiGuests([]);
        }

      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || 'Failed to load event data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId]);
  // Join: add seatId/seatName to each guest by scanning layout.elements[].assignedGuests
  const guests = useMemo(() => {
    if (!layout) return apiGuests;
    
    const byGuest = new Map<string, { seatId: string; seatName: string }[]>();
    
    for (const el of layout.elements) {
      const ids = el.assignedGuests || [];
      for (const gid of ids) {
        const list = byGuest.get(gid) || [];
        list.push({ seatId: el.id, seatName: el.name || el.type || el.id });
        byGuest.set(gid, list);
      }
    }
    
    return apiGuests.map((g) => {
      const seats = byGuest.get(g.id) || [];
      const first = seats[0];
      return {
        ...g,
        seatId: first?.seatId,
        seatName: first?.seatName,
      };
    });
  }, [apiGuests, layout]);

  // Filter guests based on search
  const filteredGuests = useMemo(() => {
    if (!searchTerm) return guests;
    
    const term = searchTerm.toLowerCase();
    return guests.filter(
      (g) =>
        g.name.toLowerCase().includes(term) ||
        g.email?.toLowerCase().includes(term) ||
        g.seatName?.toLowerCase().includes(term)
    );
  }, [guests, searchTerm]);

  // Zoom handlers
  const handleZoom = (direction: 'in' | 'out') => {
    const scaleBy = 1.2;
    const newScale = direction === 'in' ? stageScale * scaleBy : stageScale / scaleBy;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));
    setStageScale(clampedScale);
  };

  const handleWheel = (e: any) => {
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

  // Render element on canvas
  const renderElement = (element: LayoutElement) => {
    const isSelected = selectedGuest && element.assignedGuests?.includes(selectedGuest.id);
    const assignedCount = element.assignedGuests?.length || 0;
    const isFull = assignedCount >= element.capacity;

    const fillColor = isSelected
      ? '#3B82F6'
      : isFull
      ? '#10B981'
      : assignedCount > 0
      ? '#F59E0B'
      : '#E5E7EB';

    const config = element.config || {};
    const shape = config.shape || 'rectangle';

    if (shape === 'circle') {
      return (
        <Group key={element.id} x={element.x} y={element.y} rotation={element.rotation}>
          <Circle
            radius={element.radius || element.width / 2}
            fill={fillColor}
            stroke="#ffffff"
            strokeWidth={2}
          />
          <Text
            text={element.name}
            fontSize={12}
            fill="#1F2937"
            fontStyle="bold"
            align="center"
            verticalAlign="middle"
            x={-(element.radius || element.width / 2)}
            y={-(element.radius || element.width / 2)}
            width={(element.radius || element.width / 2) * 2}
            height={(element.radius || element.width / 2) * 2}
          />
          <Text
            text={`${assignedCount}/${element.capacity}`}
            fontSize={10}
            fill="#6B7280"
            align="center"
            x={-(element.radius || element.width / 2)}
            y={(element.radius || element.width / 2) - 25}
            width={(element.radius || element.width / 2) * 2}
          />
        </Group>
      );
    }

    if (shape === 'ellipse') {
      return (
        <Group key={element.id} x={element.x} y={element.y} rotation={element.rotation}>
          <Ellipse
            radiusX={element.width / 2}
            radiusY={element.height / 2}
            fill={fillColor}
            stroke="#ffffff"
            strokeWidth={2}
          />
          <Text
            text={element.name}
            fontSize={12}
            fill="#1F2937"
            fontStyle="bold"
            align="center"
            verticalAlign="middle"
            x={-element.width / 2}
            y={-element.height / 2}
            width={element.width}
            height={element.height}
          />
          <Text
            text={`${assignedCount}/${element.capacity}`}
            fontSize={10}
            fill="#6B7280"
            align="center"
            x={-element.width / 2}
            y={element.height / 2 - 20}
            width={element.width}
          />
        </Group>
      );
    }

    if (shape === 'hexagon' || shape === 'triangle' || shape === 'star') {
      const sides = shape === 'hexagon' ? 6 : shape === 'triangle' ? 3 : 5;
      const radius = Math.min(element.width, element.height) / 2;
      
      return (
        <Group key={element.id} x={element.x} y={element.y} rotation={element.rotation}>
          <RegularPolygon
            sides={sides}
            radius={radius}
            fill={fillColor}
            stroke="#ffffff"
            strokeWidth={2}
          />
          <Text
            text={element.name}
            fontSize={12}
            fill="#1F2937"
            fontStyle="bold"
            align="center"
            verticalAlign="middle"
            x={-radius}
            y={-radius}
            width={radius * 2}
            height={radius * 2}
          />
          <Text
            text={`${assignedCount}/${element.capacity}`}
            fontSize={10}
            fill="#6B7280"
            align="center"
            x={-radius}
            y={radius - 20}
            width={radius * 2}
          />
        </Group>
      );
    }

    // Default: rectangle or rounded-rect
    return (
      <Group key={element.id} x={element.x} y={element.y} rotation={element.rotation}>
        <Rect
          width={element.width}
          height={element.height}
          fill={fillColor}
          stroke="#ffffff"
          strokeWidth={2}
          cornerRadius={shape === 'rounded-rect' ? 8 : 0}
        />
        <Text
          text={element.name}
          fontSize={12}
          fill="#1F2937"
          fontStyle="bold"
          align="center"
          verticalAlign="middle"
          width={element.width}
          height={element.height}
        />
        <Text
          text={`${assignedCount}/${element.capacity}`}
          fontSize={10}
          fill="#6B7280"
          align="center"
          y={element.height - 20}
          width={element.width}
        />
      </Group>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600 font-medium">Loading seating view...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md"
        >
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Error Loading Event</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <Link to="/vendor">
            <Button className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-600">Event not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar - Guest List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <Link
            to="/vendor"
            className="inline-flex items-center text-white hover:text-blue-100 mb-3 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
          <h2 className="text-xl font-bold">{event.name}</h2>
          <div className="mt-2 space-y-1 text-blue-100 text-sm">
            <div className="flex items-center">
              <MapPin className="h-3.5 w-3.5 mr-1.5" />
              <span>{event.venue}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              <span>{new Date(event.date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search guests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Guest Count */}
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 font-medium">Total Guests</span>
            <span className="text-blue-600 font-bold">{filteredGuests.length}</span>
          </div>
        </div>

        {/* Guest List */}
        <div className="flex-1 overflow-y-auto">
          {filteredGuests.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-600">
                {searchTerm ? 'No guests found' : 'No guests assigned'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredGuests.map((guest) => (
                <div
                  key={guest.id}
                  onClick={() => setSelectedGuest(guest.id === selectedGuest?.id ? null : guest)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedGuest?.id === guest.id
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {guest.name}
                      </p>
                      <p className="text-xs text-gray-600 truncate mt-0.5">
                        {guest.email}
                      </p>
                      {guest.seatName && (
                        <div className="mt-2 inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          {guest.seatName}
                        </div>
                      )}
                    </div>
                    <div
                      className={`ml-2 w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                        guest.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Canvas */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {/* Canvas Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Seating Layout</h1>
              <p className="text-sm text-gray-600 mt-1">
                {layout ? `${layout.elements.length} tables` : 'No layout available'}
              </p>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleZoom('out')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600 min-w-[60px] text-center font-medium">
                {Math.round(stageScale * 100)}%
              </span>
              <button
                onClick={() => handleZoom('in')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          {!layout ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg text-gray-600 font-medium">No seating layout available</p>
                <p className="text-sm text-gray-500 mt-2">
                  The event planner hasn't created a layout yet
                </p>
              </div>
            </div>
          ) : (
            <Stage
              width={window.innerWidth - 320}
              height={window.innerHeight - 73}
              scaleX={stageScale}
              scaleY={stageScale}
              x={stagePosition.x}
              y={stagePosition.y}
              draggable
              onWheel={handleWheel}
              onDragEnd={(e: any) => {
                setStagePosition({ x: e.target.x(), y: e.target.y() });
              }}
            >
              <Layer>
                {/* Grid Background */}
                {Array.from({ length: Math.ceil(layout.canvasSize.width / 50) }, (_, i) => (
                  <Line
                    key={`grid-v-${i}`}
                    points={[i * 50, 0, i * 50, layout.canvasSize.height]}
                    stroke="#E5E7EB"
                    strokeWidth={0.5}
                  />
                ))}
                {Array.from({ length: Math.ceil(layout.canvasSize.height / 50) }, (_, i) => (
                  <Line
                    key={`grid-h-${i}`}
                    points={[0, i * 50, layout.canvasSize.width, i * 50]}
                    stroke="#E5E7EB"
                    strokeWidth={0.5}
                  />
                ))}

                {/* Room Boundary */}
                {layout.roomBoundary && layout.roomBoundary.vertices?.length > 0 && (
                  <Line
                    points={layout.roomBoundary.vertices.flatMap((v: any) => [v.x, v.y])}
                    stroke="#3B82F6"
                    strokeWidth={3}
                    closed={layout.roomBoundary.closed}
                    fill={layout.roomBoundary.closed ? 'rgba(59, 130, 246, 0.05)' : undefined}
                  />
                )}

                {/* Render Elements */}
                {layout.elements.map((element) => renderElement(element))}
              </Layer>
            </Stage>
          )}
        </div>

        {/* Legend */}
        <div className="bg-white border-t border-gray-200 px-6 py-3">
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
              <span className="text-gray-600">Empty</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
              <span className="text-gray-600">Partially Filled</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span className="text-gray-600">Full</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span className="text-gray-600">Selected Guest</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}