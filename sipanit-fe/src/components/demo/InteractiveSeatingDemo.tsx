import React, { useState, useRef } from "react"
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
  isDragging: boolean
}

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
      isDragging: false,
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
      isDragging: false,
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
      isDragging: false,
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
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  const handleDragStart = (id: string) => {
    setTables(tables.map((table) => (table.id === id ? { ...table, isDragging: true } : table)))
  }

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    setTables(
      tables.map((table) =>
        table.id === id
          ? {
              ...table,
              isDragging: false,
              x: e.target.x(),
              y: e.target.y(),
            }
          : table,
      ),
    )
  }

  const TableComponent = ({ table }: { table: TableItem }) => {
    const opacity = table.isDragging ? 0.7 : 1

    if (table.type === "round") {
      return (
        <Group
          x={table.x}
          y={table.y}
          draggable
          opacity={opacity}
          onDragStart={() => handleDragStart(table.id)}
          onDragEnd={(e) => handleDragEnd(table.id, e)}
        >
          <Circle
            radius={table.width / 2}
            fill={table.color}
            stroke="#ffffff"
            strokeWidth={2}
            shadowColor="rgba(0,0,0,0.3)"
            shadowBlur={5}
            shadowOffset={{ x: 2, y: 2 }}
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
        onDragStart={() => handleDragStart(table.id)}
        onDragEnd={(e) => handleDragEnd(table.id, e)}
      >
        <Rect
          width={table.width}
          height={table.height}
          fill={table.color}
          stroke="#ffffff"
          strokeWidth={2}
          cornerRadius={8}
          shadowColor="rgba(0,0,0,0.3)"
          shadowBlur={5}
          shadowOffset={{ x: 2, y: 2 }}
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
        />
      </Group>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Interactive Demo</h3>
        <p className="text-sm text-gray-600">Drag tables to rearrange your event layout</p>
      </div>

      <div
        ref={containerRef}
        className="border-2 border-gray-200 rounded-lg bg-gray-50 overflow-hidden"
        style={{ height: stageSize.height }}
      >
        <Stage width={stageSize.width} height={stageSize.height}>
          <Layer>
            {/* Background grid */}
            {Array.from({ length: Math.ceil(stageSize.width / 20) }).map((_, i) =>
              Array.from({ length: Math.ceil(stageSize.height / 20) }).map((_, j) => (
                <Circle key={`${i}-${j}`} x={i * 20 + 10} y={j * 20 + 10} radius={1} fill="#E5E7EB" />
              )),
            )}

            {tables.map((table) => (
              <TableComponent key={table.id} table={table} />
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
