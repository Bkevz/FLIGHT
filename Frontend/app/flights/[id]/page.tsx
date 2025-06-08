'use client'

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { useSearchParams, useParams } from "next/navigation"
import { api } from "@/utils/api-client"
import { Separator } from "@/components/ui/separator"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { FlightDetailsHeader } from "@/components/flight-details-header"
import { EnhancedFlightCard } from "@/components/enhanced-flight-card"
import { BookingForm } from "@/components/booking-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { FlightOffer } from "@/types/flight-api"
import { AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function FlightDetailsPage() {
  const searchParams = useSearchParams()
  const params = useParams()
  const flightId = params.id as string
  
  // Get trip type from search parameters
  const tripType = searchParams.get('tripType') || 'one-way'
  
  // State management
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flightOffer, setFlightOffer] = useState<any>(null)
  const [returnFlightOffer, setReturnFlightOffer] = useState<any>(null)
  const [pricedOffer, setPricedOffer] = useState<any>(null)
  const [airShoppingResponse, setAirShoppingResponse] = useState<any>(null)

  useEffect(() => {
    // Function to fetch flight price
    const fetchFlightPrice = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Get the air shopping response from URL state or localStorage
        const airShoppingResponseStr = searchParams.get('airShoppingResponse') || localStorage.getItem('airShoppingResponse')
        
        if (!airShoppingResponseStr) {
          throw new Error("No flight search data found. Please go back to search results.")
        }

        // Parse the air shopping response
        const airShoppingResponseData = JSON.parse(airShoppingResponseStr)
        setAirShoppingResponse(airShoppingResponseData)

        // Find the selected offer by ID
        const selectedOffer = airShoppingResponseData.data.offers.find(
          (offer: any) => offer.id === flightId
        )

        if (!selectedOffer) {
          throw new Error("Selected flight offer not found")
        }

        setFlightOffer(selectedOffer)

        // Handle return flight for round-trip
        if (tripType === 'round-trip' && airShoppingResponseData.data.offers.length > 1) {
          // Find return flight (assuming it's the second offer or has return segments)
          const returnOffer = airShoppingResponseData.data.offers.find(
            (offer: any) => offer.id !== flightId && offer.segments?.some((seg: any) => seg.direction === 'return')
          ) || airShoppingResponseData.data.offers[1] // Fallback to second offer
          
          if (returnOffer) {
            setReturnFlightOffer(returnOffer)
          }
        }

        // Call the flight-price API endpoint
        const response = await api.getFlightPrice(
          selectedOffer.id,
          airShoppingResponseData.data.shopping_response_id,
          airShoppingResponseData.data
        )

        // Set the priced offer data
        setPricedOffer(response.data)
      } catch (err) {
        console.error("Error fetching flight price:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch flight price data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchFlightPrice()
  }, [flightId, searchParams])

  // Helper function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/logo1.png" alt="Rea Travel Logo" width={32} height={32} />
              <span className="text-xl font-bold">Rea Travel</span>
            </div>
            <MainNav />
            <UserNav />
          </div>
        </header>

        <main className="flex-1">
          <div className="container py-6">
            <div className="mb-6">
              <Link
                href="/flights"
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to Search Results
              </Link>
            </div>
            
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Loading flight pricing details...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/logo1.png" alt="Rea Travel Logo" width={32} height={32} />
              <span className="text-xl font-bold">Rea Travel</span>
            </div>
            <MainNav />
            <UserNav />
          </div>
        </header>

        <main className="flex-1">
          <div className="container py-6">
            <div className="mb-6">
              <Link
                href="/flights"
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to Search Results
              </Link>
            </div>
            
            <Alert variant="destructive" className="my-8">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            <Button asChild>
              <Link href="/flights">Return to Flight Search</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // If we have flight data, render the flight details
  if (flightOffer && pricedOffer) {
    // Price data from priced offer or fallback to flight offer
    const totalPrice = pricedOffer.data.priced_offer?.total_amount || flightOffer.price || 0
    const currency = pricedOffer.data.priced_offer?.currency || flightOffer.currency || "USD"
    const taxes = pricedOffer.data.priced_offer?.breakdown?.[0]?.taxes || flightOffer.priceBreakdown?.taxes || 0
    const baseFare = pricedOffer.data.priced_offer?.breakdown?.[0]?.base || flightOffer.priceBreakdown?.baseFare || (totalPrice - taxes)
    
    // Format flight data for the components using the actual API response structure
    const formattedFlight: FlightOffer = {
      id: flightOffer.id,
      airline: {
        name: flightOffer.airline?.name || "Unknown Airline",
        logo: flightOffer.airline?.logo || "/placeholder.svg?height=40&width=40",
        code: flightOffer.airline?.code || "",
        flightNumber: flightOffer.airline?.flightNumber || "",
      },
      departure: {
        airport: flightOffer.departure?.airport || "",
        datetime: flightOffer.departure?.datetime || "",
        terminal: flightOffer.departure?.terminal || "",
        airportName: flightOffer.departure?.airportName || "",
      },
      arrival: {
        airport: flightOffer.arrival?.airport || "",
        datetime: flightOffer.arrival?.datetime || "",
        terminal: flightOffer.arrival?.terminal || "",
        airportName: flightOffer.arrival?.airportName || "",
      },
      duration: flightOffer.duration && flightOffer.duration !== "0h 0m" 
        ? flightOffer.duration 
        : flightOffer.segments?.reduce((total: number, segment: any) => {
            if (segment.duration && segment.duration.startsWith('PT')) {
              // Parse ISO 8601 duration format (PT1H15M)
              const hours = segment.duration.match(/PT(\d+)H/) ? parseInt(segment.duration.match(/PT(\d+)H/)![1]) : 0;
              const minutes = segment.duration.match(/(\d+)M/) ? parseInt(segment.duration.match(/(\d+)M/)![1]) : 0;
              return total + (hours * 60) + minutes;
            }
            return total;
          }, 0) ? (() => {
            const totalMinutes = flightOffer.segments?.reduce((total: number, segment: any) => {
              if (segment.duration && segment.duration.startsWith('PT')) {
                const hours = segment.duration.match(/PT(\d+)H/) ? parseInt(segment.duration.match(/PT(\d+)H/)![1]) : 0;
                const minutes = segment.duration.match(/(\d+)M/) ? parseInt(segment.duration.match(/(\d+)M/)![1]) : 0;
                return total + (hours * 60) + minutes;
              }
              return total;
            }, 0) || 0;
            const hours = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            return `${hours}h ${mins}m`;
          })() : "0h 0m",
      stops: flightOffer.segments?.length > 1 ? flightOffer.segments.length - 1 : 0,
      stopDetails: flightOffer.stopDetails || [],
      price: totalPrice,
      currency: currency,
      seatsAvailable: flightOffer.seatsAvailable || "Available",
      baggage: flightOffer.baggage ? {
        carryOn: { 
          description: typeof flightOffer.baggage.carryOn === 'string' ? flightOffer.baggage.carryOn : flightOffer.baggage.carryOn?.description || "Not specified" 
        },
        checkedBaggage: { 
          description: typeof flightOffer.baggage.checked === 'string' ? flightOffer.baggage.checked : flightOffer.baggage.checkedBaggage?.description || "Not specified",
          policyType: 'WEIGHT_BASED' as const
        }
      } : {
        carryOn: { description: "Not specified" },
        checkedBaggage: { description: "Not specified", policyType: 'WEIGHT_BASED' as const }
      },
      fare: flightOffer.fare,
      aircraft: flightOffer.aircraft,
      segments: flightOffer.segments?.map((segment: any) => ({
        ...segment,
        airlineName: flightOffer.airline?.name || segment.airlineName || "Unknown Airline"
      })) || [],
      priceBreakdown: flightOffer.priceBreakdown,
      additionalServices: flightOffer.additionalServices,
    }

    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/logo1.png" alt="Rea Travel Logo" width={32} height={32} />
              <span className="text-xl font-bold">Rea Travel</span>
            </div>
            <MainNav />
            <UserNav />
          </div>
        </header>

        <main className="flex-1">
          <div className="container py-6">
            <div className="mb-6">
              <Link
                href="/flights"
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to Search Results
              </Link>

              <FlightDetailsHeader
                origin={formattedFlight.departure.airportName || ''}
                originCode={formattedFlight.departure.airport || ''}
                destination={formattedFlight.arrival.airportName || ''}
                destinationCode={formattedFlight.arrival.airport || ''}
                departDate={formatDate(formattedFlight.departure.datetime)}
                returnDate={returnFlightOffer ? formatDate(returnFlightOffer.departure?.datetime) : undefined}
                passengers={1} // Update with actual passenger count from search
                price={formattedFlight.price}
                currency={formattedFlight.currency}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
              {/* Flight Details and Booking Form */}
              <div className="space-y-6">
                {/* Dynamic flight display based on trip type */}
                {tripType === 'one-way' && (
                  <div className="rounded-lg border">
                    <div className="p-4 sm:p-6">
                      <h2 className="text-xl font-semibold">Flight Details</h2>
                      <p className="text-sm text-muted-foreground">{formatDate(formattedFlight.departure.datetime)}</p>
                    </div>
                    <Separator />
                    <EnhancedFlightCard flight={formattedFlight} />
                  </div>
                )}

                {tripType === 'round-trip' && (
                  <>
                    <div className="rounded-lg border">
                      <div className="p-4 sm:p-6">
                        <h2 className="text-xl font-semibold">Outbound Flight</h2>
                        <p className="text-sm text-muted-foreground">{formatDate(formattedFlight.departure.datetime)}</p>
                      </div>
                      <Separator />
                      <EnhancedFlightCard flight={formattedFlight} />
                    </div>

                    {returnFlightOffer && (
                      <div className="rounded-lg border">
                        <div className="p-4 sm:p-6">
                          <h2 className="text-xl font-semibold">Return Flight</h2>
                          <p className="text-sm text-muted-foreground">{formatDate(returnFlightOffer.departure?.datetime)}</p>
                        </div>
                        <Separator />
                        <EnhancedFlightCard
                          flight={{
                            ...returnFlightOffer,
                            stopDetails: returnFlightOffer.stopDetails || [],
                            baggage: returnFlightOffer.baggage || {
                              carryOn: { description: "Not specified" },
                              checkedBaggage: { description: "Not specified" }
                            },
                          } as FlightOffer}
                        />
                      </div>
                    )}
                  </>
                )}

                {tripType === 'multi-city' && (
                  <div className="space-y-4">
                    <div className="rounded-lg border">
                      <div className="p-4 sm:p-6">
                        <h2 className="text-xl font-semibold">Flight Segment 1</h2>
                        <p className="text-sm text-muted-foreground">{formatDate(formattedFlight.departure.datetime)}</p>
                      </div>
                      <Separator />
                      <EnhancedFlightCard flight={formattedFlight} />
                    </div>
                    {/* Additional segments would be rendered here based on the flight data */}
                  </div>
                )}

                <BookingForm />
              </div>

              {/* Price Summary */}
              <div className="h-fit rounded-lg border">
                <div className="p-4 sm:p-6">
                  <h2 className="text-xl font-semibold">Price Summary</h2>
                </div>
                <Separator />
                <div className="p-4 sm:p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Base fare (1 passenger)</span>
                      <span>{baseFare.toFixed(2)} {currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes and fees</span>
                      <span>{taxes.toFixed(2)} {currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Baggage fees</span>
                      <span>Included</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{formattedFlight.price.toFixed(2)} {formattedFlight.currency}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>Fare rules:</p>
                      <ul className="mt-1 list-inside list-disc">
                        <li>{flightOffer?.fareRules?.refundable ? "Refundable" : "Non-refundable"}</li>
                        <li>Changes allowed (fee may apply)</li>
                        <li>Fare class: {flightOffer?.cabinType || "Economy"}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Fallback if we somehow get here without data or errors
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo1.png" alt="Rea Travel Logo" width={32} height={32} />
            <span className="text-xl font-bold">Rea Travel</span>
          </div>
          <MainNav />
          <UserNav />
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-6">
          <div className="mb-6">
            <Link
              href="/flights"
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Search Results
            </Link>
          </div>
          
          <Alert className="my-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No flight data available</AlertTitle>
            <AlertDescription>
              Please return to the search results and select a flight.
            </AlertDescription>
          </Alert>
          
          <Button asChild>
            <Link href="/flights">Return to Flight Search</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
