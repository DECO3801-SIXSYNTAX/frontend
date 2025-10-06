"use client"

import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { User, Building, MapPin, Utensils, Accessibility } from "lucide-react"

type GuestCardProps = {
  guest: {
    name: string
    org?: string
    seatLabel?: string
    tableLabel?: string
    dietary?: string
    access?: string
    tags?: string[]
  }
  showBackToScan?: boolean
  onBackToScan?: () => void
}

export function GuestCard({ guest, showBackToScan = false, onBackToScan }: GuestCardProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <User className="h-6 w-6" />
          Welcome!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <p className="text-xl font-semibold text-gray-900">{guest.name}</p>
            {guest.org && (
              <p className="text-lg text-gray-600 flex items-center gap-2 mt-1">
                <Building className="h-4 w-4" />
                {guest.org}
              </p>
            )}
          </div>

          {(guest.seatLabel || guest.tableLabel) && (
            <div className="flex items-center gap-2 text-lg">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="font-medium">
                {guest.seatLabel && guest.tableLabel
                  ? `${guest.seatLabel} at ${guest.tableLabel}`
                  : guest.seatLabel || guest.tableLabel}
              </span>
            </div>
          )}

          {guest.dietary && (
            <div className="flex items-start gap-2">
              <Utensils className="h-4 w-4 text-green-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-700">Dietary Requirements</p>
                <p className="text-sm text-gray-600">{guest.dietary}</p>
              </div>
            </div>
          )}

          {guest.access && (
            <div className="flex items-start gap-2">
              <Accessibility className="h-4 w-4 text-purple-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-700">Accessibility</p>
                <p className="text-sm text-gray-600">{guest.access}</p>
              </div>
            </div>
          )}

          {guest.tags && guest.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {guest.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg" className="w-full h-14 text-lg bg-transparent">
                View More Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Guest Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold">Contact Information</p>
                  <p className="text-sm text-gray-600">***@***.com (masked for privacy)</p>
                  <p className="text-sm text-gray-600">+1 ***-***-1234 (masked for privacy)</p>
                </div>
                {guest.tags && guest.tags.length > 0 && (
                  <div>
                    <p className="font-semibold mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {guest.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {showBackToScan && (
            <Button variant="secondary" size="lg" className="w-full h-14 text-lg" onClick={onBackToScan}>
              Back to Scan
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
