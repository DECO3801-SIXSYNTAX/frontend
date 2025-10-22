import React, { useState, useRef, useCallback, useMemo } from "react"
import { Stage, Layer, Rect, Circle, Text, Group } from "react-konva"
import type Konva from "konva"

interface TableItem {
  id: string
  x: number
  y: number
  width: number
  height: number
  type: "round" | "rectangle"
  seats: number
  color: string
}

// Memoized table component for better performance
const TableComponent = React.memo(({ table, onDragEnd }: { 
  table: TableItem
  onDragEnd: (id: string, e: Konva.KonvaEventObject<DragEvent>) => void
}) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    setIsDragging(false)
    onDragEnd(table.id, e)
  }, [table.id, onDragEnd])

  const opacity = isDragging ? 0.8 : 1
  const scale = isDragging ? 1.05 : 1

  if (table.type === "round") {
    return (
      <Group
        x={table.x}
        y={table.y}
        draggable
        opacity={opacity}
        scaleX={scale}
        scaleY={scale}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Circle
          radius={table.width / 2}
          fill={table.color}
          stroke="#ffffff"
          strokeWidth={2}
          shadowColor="rgba(0,0,0,0.2)"
          shadowBlur={3}
          shadowOffsetX={1}
          shadowOffsetY={1}
          shadowEnabled={!isDragging}
        />
        <Text
          text={table.seats.toString()}
          fontSize={16}
          fontFamily="Arial"
          fill="white"
          fontStyle="bold"
          x={-8}
          y={-8}
          align="center"
          listening={false}
        />
      </Group>
    )
  }

  return (
    <Group
      x={table.x}
      y={table.y}
      draggable
      opacity={opacity}
      scaleX={scale}
      scaleY={scale}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Rect
        width={table.width}
        height={table.height}
        fill={table.color}
        stroke="#ffffff"
        strokeWidth={2}
        cornerRadius={8}
        shadowColor="rgba(0,0,0,0.2)"
        shadowBlur={3}
        shadowOffsetX={1}
        shadowOffsetY={1}
        shadowEnabled={!isDragging}
      />
      <Text
        text={table.seats.toString()}
        fontSize={16}
        fontFamily="Arial"
        fill="white"
        fontStyle="bold"
        x={table.width / 2 - 8}
        y={table.height / 2 - 8}
        align="center"
        listening={false}
      />
    </Group>
  )
})

TableComponent.displayName = "TableComponent"

export function InteractiveSeatingDemo() {
  const [tables, setTables] = useState<TableItem[]>([
    {
      id: "table1",
      x: 50,
      y: 50,
      width: 80,
      height: 80,
      type: "round",
      seats: 6,
      color: "#3B82F6",
    },
    {
      id: "table2",
      x: 200,
      y: 100,
      width: 120,
      height: 60,
      type: "rectangle",
      seats: 8,
      color: "#10B981",
    },
    {
      id: "table3",
      x: 100,
      y: 200,
      width: 80,
      height: 80,
      type: "round",
      seats: 4,
      color: "#F59E0B",
    },
  ])

  const [stageSize, setStageSize] = useState({ width: 400, height: 300 })
  const containerRef = useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = Math.min(containerRef.current.offsetWidth, 400)
        const height = Math.min(width * 0.75, 300)
        setStageSize({ width, height })
      }
    }

    updateSize()
    const timeoutId = setTimeout(updateSize, 100)
    window.addEventListener("resize", updateSize)
    return () => {
      window.removeEventListener("resize", updateSize)
      clearTimeout(timeoutId)
    }
  }, [])

  const handleDragEnd = useCallback((id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    setTables((prevTables) =>
      prevTables.map((table) =>
        table.id === id
          ? {
              ...table,
              x: e.target.x(),
              y: e.target.y(),
            }
          : table,
      ),
    )
  }, [])

  // Memoize background grid to prevent recreation
  const backgroundGrid = useMemo(() => {
    const dots = []
    const rows = Math.ceil(stageSize.height / 25)
    const cols = Math.ceil(stageSize.width / 25)
    
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        dots.push(
          <Circle 
            key={`${i}-${j}`} 
            x={i * 25 + 12} 
            y={j * 25 + 12} 
            radius={1.5} 
            fill="#D1D5DB"
            listening={false}
          />
        )
      }
    }
    return dots
  }, [stageSize.width, stageSize.height])

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Interactive Demo</h3>
        <p className="text-sm text-gray-600">Drag tables to rearrange your event layout</p>
      </div>

      <div
        ref={containerRef}
        className="border-2 border-gray-200 rounded-lg bg-gray-50 overflow-hidden cursor-move"
        style={{ height: stageSize.height }}
      >
        <Stage width={stageSize.width} height={stageSize.height}>
          <Layer>
            {backgroundGrid}
            {tables.map((table) => (
              <TableComponent key={table.id} table={table} onDragEnd={handleDragEnd} />
            ))}
          </Layer>
        </Stage>
      </div>

      <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
        <span>🔵 Round Table</span>
        <span>🟢 Rectangle Table</span>
        <span>🟡 VIP Table</span>
      </div>
    </div>
  )
}