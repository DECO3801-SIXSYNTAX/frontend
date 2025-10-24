"use client"

import { useState, useEffect } from "react"
import {
  getPublicEvent,
  verifyQr,
  getSeatView,
  type PublicEvent,
  type VerifyResult,
  type SeatView,
} from "../api/sdk.kiosk"

export function usePublicEvent(eventId: string) {
  const [data, setData] = useState<PublicEvent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (!eventId) return

    const fetchEvent = async () => {
      try {
        setIsLoading(true)
        setIsError(false)
        const event = await getPublicEvent(eventId)
        setData(event)
      } catch (error) {
        setIsError(true)
        console.error("Failed to fetch public event:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvent()
  }, [eventId])

  return { data, isLoading, isError }
}

export function useVerifyQr(token: string) {
  const [data, setData] = useState<VerifyResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  const verify = async () => {
    if (!token) return

    try {
      setIsLoading(true)
      setIsError(false)
      const result = await verifyQr(token)
      setData(result)
    } catch (error) {
      setIsError(true)
      console.error("Failed to verify QR:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return { data, isLoading, isError, verify }
}

export function useSeatView(eventId: string, guestId?: string) {
  const [data, setData] = useState<SeatView | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (!eventId) return

    const fetchSeatView = async () => {
      try {
        setIsLoading(true)
        setIsError(false)
        const seatView = await getSeatView(eventId, guestId)
        setData(seatView)
      } catch (error) {
        setIsError(true)
        console.error("Failed to fetch seat view:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSeatView()
  }, [eventId, guestId])

  return { data, isLoading, isError }
}
