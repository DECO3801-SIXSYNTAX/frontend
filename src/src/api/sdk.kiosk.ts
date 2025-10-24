export type PublicEvent = {
    id: string
    name: string
    logoUrl?: string
    requireQr: boolean
  }
  
  export type VerifyResult = { ok: true; guestId: string } | { ok: false; reason: "invalid" | "expired" }
  
  export type SeatView = {
    layout: any // tables, seats, zones for Konva
    seatId?: string
    guest?: {
      name: string
      org?: string
      seatLabel?: string
      tableLabel?: string
      dietary?: string
      access?: string
      tags?: string[]
    }
  }
  
  // Placeholder implementations - dummy resolved promises
  export async function getPublicEvent(eventId: string): Promise<PublicEvent> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))
  
    // Mock data based on eventId
    const mockEvents: Record<string, PublicEvent> = {
      "tech-conf-2024": {
        id: "tech-conf-2024",
        name: "Tech Conference 2024",
        logoUrl: "/tech-conference-logo.png",
        requireQr: true,
      },
      "gala-dinner": {
        id: "gala-dinner",
        name: "Annual Gala Dinner",
        logoUrl: "/elegant-gala-logo.jpg",
        requireQr: true,
      },
      "music-festival": {
        id: "music-festival",
        name: "Music Festival 2024",
        logoUrl: "/music-festival-logo.png",
        requireQr: false,
      },
    }
  
    return (
      mockEvents[eventId] || {
        id: eventId,
        name: "Sample Event",
        requireQr: false,
      }
    )
  }
  
  export async function verifyQr(token: string): Promise<VerifyResult> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1200))
  
    // Mock verification logic
    if (token === "invalid" || token === "expired") {
      return { ok: false, reason: token as "invalid" | "expired" }
    }
  
    // Generate mock guest ID
    return { ok: true, guestId: `guest-${Math.random().toString(36).substr(2, 9)}` }
  }
  
  export async function getSeatView(eventId: string, guestId?: string): Promise<SeatView> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 600))
    
    // In a real implementation, eventId would be used to fetch the correct event layout
    console.log(`Fetching seat view for event: ${eventId}`)
  
    // Mock layout data
    const mockLayout = {
      tables: [
        { id: "table-1", x: 100, y: 100, width: 120, height: 80, type: "rectangle", label: "Table 1" },
        { id: "table-2", x: 300, y: 100, radius: 60, type: "circle", label: "Table 2" },
        { id: "table-3", x: 500, y: 100, width: 120, height: 80, type: "rectangle", label: "Table 3" },
        { id: "table-4", x: 200, y: 300, radius: 60, type: "circle", label: "Table 4" },
      ],
      seats: [
        { id: "seat-1", x: 110, y: 80, tableId: "table-1", label: "A1" },
        { id: "seat-2", x: 150, y: 80, tableId: "table-1", label: "A2" },
        { id: "seat-3", x: 190, y: 80, tableId: "table-1", label: "A3" },
        { id: "seat-4", x: 280, y: 60, tableId: "table-2", label: "B1" },
        { id: "seat-5", x: 320, y: 60, tableId: "table-2", label: "B2" },
        { id: "seat-6", x: 510, y: 80, tableId: "table-3", label: "C1" },
      ],
    }
  
    // Mock guest data if guestId provided
    const mockGuest = guestId
      ? {
          name: "John Smith",
          org: "Tech Corp",
          seatLabel: "A2",
          tableLabel: "Table 1",
          dietary: "Vegetarian, No nuts",
          access: "Wheelchair accessible",
          tags: ["VIP", "Speaker", "Early Bird"],
        }
      : undefined
  
    return {
      layout: mockLayout,
      seatId: guestId ? "seat-2" : undefined,
      guest: mockGuest,
    }
  }
  