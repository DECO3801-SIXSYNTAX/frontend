"use client"

import { useRef, useEffect } from "react"
import { Stage, Layer, Group, Rect, Circle, Text } from "react-konva"

type SeatMapProps = {
  layout: any
  highlightSeatId?: string
  width?: number
  height?: number
  allowZoom?: boolean
  allowPan?: boolean
}

export function SeatMap({
  layout,
  highlightSeatId,
  width = 800,
  height = 600,
  allowZoom = true,
  allowPan = true,
}: SeatMapProps) {
  const stageRef = useRef<any>(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    // Enable zoom and pan
    if (allowZoom) {
      const handleWheel = (e: any) => {
        e.evt.preventDefault()

        const scaleBy = 1.1
        const stage = e.target.getStage()
        const oldScale = stage.scaleX()
        const pointer = stage.getPointerPosition()

        const mousePointTo = {
          x: (pointer.x - stage.x()) / oldScale,
          y: (pointer.y - stage.y()) / oldScale,
        }

        const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy

        stage.scale({ x: newScale, y: newScale })

        const newPos = {
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale,
        }

        stage.position(newPos)
        stage.batchDraw()
      }

      stage.on("wheel", handleWheel)

      return () => {
        stage.off("wheel", handleWheel)
      }
    }
  }, [allowZoom])

  if (!layout) return null

  return (
    <div className="border rounded-lg overflow-hidden bg-gray-50">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        draggable={allowPan}
        className="cursor-grab active:cursor-grabbing"
      >
        <Layer>
          {/* Grid background */}
          <Group>
            {Array.from({ length: Math.ceil(width / 50) }).map((_, i) => (
              <Rect key={`grid-v-${i}`} x={i * 50} y={0} width={1} height={height} fill="#e5e7eb" />
            ))}
            {Array.from({ length: Math.ceil(height / 50) }).map((_, i) => (
              <Rect key={`grid-h-${i}`} x={0} y={i * 50} width={width} height={1} fill="#e5e7eb" />
            ))}
          </Group>

          {/* Tables */}
          {layout.tables?.map((table: any) => (
            <Group key={table.id}>
              {table.type === "rectangle" ? (
                <Rect
                  x={table.x}
                  y={table.y}
                  width={table.width}
                  height={table.height}
                  fill="#f3f4f6"
                  stroke="#9ca3af"
                  strokeWidth={2}
                  cornerRadius={8}
                />
              ) : (
                <Circle x={table.x} y={table.y} radius={table.radius} fill="#f3f4f6" stroke="#9ca3af" strokeWidth={2} />
              )}
              <Text
                x={table.type === "rectangle" ? table.x + table.width / 2 : table.x}
                y={table.type === "rectangle" ? table.y + table.height / 2 : table.y}
                text={table.label}
                fontSize={14}
                fontFamily="Arial"
                fill="#374151"
                align="center"
                offsetX={table.label.length * 3.5}
                offsetY={7}
              />
            </Group>
          ))}

          {/* Seats */}
          {layout.seats?.map((seat: any) => {
            const isHighlighted = seat.id === highlightSeatId
            return (
              <Group key={seat.id}>
                <Circle
                  x={seat.x}
                  y={seat.y}
                  radius={12}
                  fill={isHighlighted ? "#3b82f6" : "#ffffff"}
                  stroke={isHighlighted ? "#1d4ed8" : "#6b7280"}
                  strokeWidth={isHighlighted ? 3 : 2}
                />
                {isHighlighted && (
                  <Circle
                    x={seat.x}
                    y={seat.y}
                    radius={20}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dash={[5, 5]}
                    opacity={0.7}
                  />
                )}
                <Text
                  x={seat.x}
                  y={seat.y}
                  text={seat.label}
                  fontSize={10}
                  fontFamily="Arial"
                  fill={isHighlighted ? "#ffffff" : "#374151"}
                  align="center"
                  offsetX={seat.label.length * 2.5}
                  offsetY={5}
                />
              </Group>
            )
          })}
        </Layer>
      </Stage>
    </div>
  )
}
