"use client"

import { useState } from 'react'
import Link from "next/link"
import Image from "next/image"
import { 
  ArrowRight, 
  Clock, 
  Luggage, 
  ChevronDown, 
  ChevronUp, 
  Wifi, 
  Power, 
  Utensils, 
  Tv, 
  Briefcase
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { FlightOffer } from "@/types/flight-api"

interface EnhancedFlightCardProps {
  flight: FlightOffer
  showExtendedDetails?: boolean
}

export function EnhancedFlightCard({ flight, showExtendedDetails = false }: EnhancedFlightCardProps) {
  const [expanded, setExpanded] = useState(showExtendedDetails)

  // Note: Data formatting is now handled by the backend
  // Frontend components should use FlightOffer data directly

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto]">
          {/* Flight Details */}
          <div className="p-4 md:p-6">
            <div className="mb-4 flex items-center">
              <div className="flex items-center">
                <Image
                  src={flight.airline?.logo || "/placeholder-logo.svg"}
                  alt={flight.airline?.name || "Airline"}
                  width={32}
                  height={32}
                  className="mr-3 rounded"
                />
                <div>
                  <div className="font-semibold text-sm">{flight.airline?.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {flight.segments?.map((segment, index) => (
                      <span key={`flight-${flight.id}-segment-${index}-${segment.airline?.flightNumber || 'unknown'}`}>
                        {segment.airline?.flightNumber}
                        {index < (flight.segments?.length || 0) - 1 && ", "}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {flight.fare?.fareFamily && (
                <Badge variant="secondary" className="ml-auto">
                  {flight.fare.fareFamily}
                </Badge>
              )}
            </div>

            {/* Route and Time */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {flight.segments?.[0]?.departure?.time || '--:--'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {flight.segments?.[0]?.departure?.airportName ||
                      flight.segments?.[0]?.departure?.airport}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {flight.segments?.[0]?.departure?.airport}
                  </div>
                </div>
                
                <div className="flex flex-col items-center px-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    {flight.duration}
                  </div>
                  <div className="flex items-center">
                    <div className="h-px bg-border flex-1 w-16"></div>
                    <ArrowRight className="mx-2 h-4 w-4 text-muted-foreground" />
                    <div className="h-px bg-border flex-1 w-16"></div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {flight.segments && flight.segments.length > 1 ? `${flight.segments.length - 1} stop${flight.segments.length > 2 ? 's' : ''}` : 'Direct'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {flight.segments?.[flight.segments.length - 1]?.arrival?.time || '--:--'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {flight.segments?.[flight.segments.length - 1]?.arrival?.airportName ||
                      flight.segments?.[flight.segments.length - 1]?.arrival?.airport || 'Unknown'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {flight.segments?.[flight.segments.length - 1]?.arrival?.airport}
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            {flight.additionalServices?.additionalAmenities && flight.additionalServices.additionalAmenities.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {flight.additionalServices.additionalAmenities.map((amenity: string, index: number) => {
                    const getAmenityIcon = (amenity: string) => {
                      switch (amenity.toLowerCase()) {
                        case 'wifi':
                          return <Wifi className="h-3 w-3" />;
                        case 'power':
                          return <Power className="h-3 w-3" />;
                        case 'meal':
                          return <Utensils className="h-3 w-3" />;
                        case 'entertainment':
                          return <Tv className="h-3 w-3" />;
                        default:
                          return <Briefcase className="h-3 w-3" />;
                      }
                    };
                    
                    return (
                      <Badge key={`${amenity}-${index}`} variant="outline" className="text-xs">
                        {getAmenityIcon(amenity)}
                        <span className="ml-1">{amenity}</span>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Expandable Details */}
            {expanded && (
              <div className="space-y-4">
                <Separator />
                
                <Tabs defaultValue="segments" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="segments">Flight Details</TabsTrigger>
                    <TabsTrigger value="baggage">Baggage</TabsTrigger>
                    <TabsTrigger value="fare">Fare Rules</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="segments" className="space-y-4">
                    {flight.segments?.map((segment, index) => (
                      <div key={`flight-${flight.id}-detail-segment-${index}-${segment.airline?.flightNumber || 'unknown'}-${segment.departure?.airport || 'unknown'}`} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Image
                              src={segment.airline?.logo || "/placeholder-logo.svg"}
                              alt={segment.airline?.name || "Airline"}
                              width={24}
                              height={24}
                              className="mr-2 rounded"
                            />
                            <span className="font-medium">{segment.airline?.flightNumber}</span>
                          </div>
                          <Badge variant="outline">{segment.aircraft?.name || segment.aircraft?.code}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium">Departure</div>
                            <div>{segment.departure?.datetime || '--:--'}</div>
                            <div className="text-muted-foreground">
                              {segment.departure?.airportName || segment.departure?.airport || 'Unknown'} ({segment.departure?.airport})
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">Arrival</div>
                            <div>{segment.arrival?.datetime || '--:--'}</div>
                            <div className="text-muted-foreground">
                              {segment.arrival?.airportName || segment.arrival?.airport || 'Unknown'} ({segment.arrival?.airport})
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-sm text-muted-foreground">
                          Duration: {segment.duration}
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="baggage">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Luggage className="h-4 w-4 mr-2" />
                        <span className="text-sm">Carry-on: {flight.baggage?.carryOn?.description || 'Included'}</span>
                      </div>
                      <div className="flex items-center">
                        <Luggage className="h-4 w-4 mr-2" />
                        <span className="text-sm">Checked: {flight.baggage?.checkedBaggage?.description || 'See fare rules'}</span>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="fare">
                    <div className="text-sm space-y-2">
                      <div><strong>Refundable:</strong> {flight.fare?.rules?.refundable ? 'Yes' : 'No'}</div>
                      <div><strong>Changeable:</strong> {flight.fare?.rules?.exchangeable ? 'Yes' : 'No'}</div>
                      {flight.fare?.rules?.penalties && (
                        <div><strong>Penalties:</strong> {flight.fare.rules.penalties}</div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Toggle Button */}
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="w-full"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show More Details
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Price and Book Button */}
          <div className="bg-muted/50 p-4 md:p-6 flex flex-col justify-between min-w-[200px]">
            <div className="text-center mb-4">
              <div className="text-2xl font-bold">
                ${flight.priceBreakdown?.totalPrice || flight.price}
              </div>
              <div className="text-sm text-muted-foreground">
                per person
              </div>
              {flight.priceBreakdown?.baseFare && flight.priceBreakdown.baseFare !== flight.priceBreakdown.totalPrice && (
                <div className="text-xs text-muted-foreground line-through">
                  ${flight.priceBreakdown.baseFare}
                </div>
              )}
            </div>
            
            <Link href={`/flights/${flight.id}?from=search`} className="w-full">
              <Button className="w-full">
                Select Flight
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
