"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { ChevronRight, CreditCard, Luggage, User, Users, AlertCircle, CheckCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PassengerForm } from "@/components/passenger-form"
import { SeatSelection } from "@/components/seat-selection"
import { BaggageOptions } from "@/components/baggage-options"
import { MealOptions } from "@/components/meal-options"

interface ContactInfoState {
  email?: string;
  phone?: string;
}

// Validation interfaces
interface PassengerValidation {
  isValid: boolean;
  missingFields: string[];
}

interface ValidationState {
  passengers: PassengerValidation[];
  contactInfo: {
    isValid: boolean;
    missingFields: string[];
  };
  termsAccepted: boolean;
}

export function BookingForm() {
  const router = useRouter()
  const pathname = usePathname()
  const { isSignedIn } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [passengerCount, setPassengerCount] = useState(1)

  // --- Add State Variables Start ---
  const [passengers, setPassengers] = useState<any[]>([]); // State for passenger details
  const [contactInfo, setContactInfo] = useState<ContactInfoState>({}); // State for contact info
  const [selectedSeats, setSelectedSeats] = useState<any>({}); // State for seat selection
  const [selectedBaggage, setSelectedBaggage] = useState<any>({}); // State for baggage options
  const [selectedMeals, setSelectedMeals] = useState<any>({}); // State for meal options
  const [pricingDetails, setPricingDetails] = useState<any>({}); // State for pricing details
  const [termsAccepted, setTermsAccepted] = useState(false); // State for terms acceptance
  // --- Add State Variables End ---

  // Validation functions
  const validatePassenger = (passenger: any): PassengerValidation => {
    const missingFields: string[] = [];
    
    if (!passenger?.type) missingFields.push('Passenger Type');
    if (!passenger?.title) missingFields.push('Title');
    if (!passenger?.firstName?.trim()) missingFields.push('First Name');
    if (!passenger?.lastName?.trim()) missingFields.push('Last Name');
    if (!passenger?.gender) missingFields.push('Gender');
    if (!passenger?.nationality) missingFields.push('Nationality');
    if (!passenger?.documentType) missingFields.push('Document Type');
    if (!passenger?.documentNumber?.trim()) missingFields.push('Document Number');
    if (!passenger?.issuingCountry) missingFields.push('Issuing Country');
    
    // Date of birth validation
    if (!passenger?.dob?.day || !passenger?.dob?.month || !passenger?.dob?.year) {
      missingFields.push('Date of Birth');
    }
    
    // Expiry date validation
    if (!passenger?.expiryDate?.day || !passenger?.expiryDate?.month || !passenger?.expiryDate?.year) {
      missingFields.push('Document Expiry Date');
    }
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  };

  const validateContactInfo = (): { isValid: boolean; missingFields: string[] } => {
    const missingFields: string[] = [];
    
    if (!contactInfo.email?.trim()) missingFields.push('Email Address');
    if (!contactInfo.phone?.trim()) missingFields.push('Phone Number');
    
    // Basic email validation
    if (contactInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email)) {
      missingFields.push('Valid Email Address');
    }
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  };

  // Compute validation state
  const validationState: ValidationState = useMemo(() => {
    const passengerValidations: PassengerValidation[] = [];
    
    for (let i = 0; i < passengerCount; i++) {
      passengerValidations.push(validatePassenger(passengers[i] || {}));
    }
    
    return {
      passengers: passengerValidations,
      contactInfo: validateContactInfo(),
      termsAccepted
    };
  }, [passengers, passengerCount, contactInfo, termsAccepted]);

  // Check if current step is valid
  const isCurrentStepValid = useMemo(() => {
    switch (currentStep) {
      case 1: // Passenger Details
        return validationState.passengers.every(p => p.isValid) && validationState.contactInfo.isValid;
      case 2: // Seat Selection (optional)
        return true;
      case 3: // Extras (optional)
        return true;
      case 4: // Review
        return validationState.passengers.every(p => p.isValid) && 
               validationState.contactInfo.isValid && 
               validationState.termsAccepted;
      default:
        return false;
    }
  }, [currentStep, validationState]);

  // Get completion percentage for passengers
  const getPassengerCompletionPercentage = (index: number): number => {
    const passenger = passengers[index] || {};
    const validation = validatePassenger(passenger);
    const totalFields = 11; // Total required fields
    const completedFields = totalFields - validation.missingFields.length;
    return Math.round((completedFields / totalFields) * 100);
  };

  // --- Add Handler for Passenger Changes ---
  const handlePassengerChange = (index: number, updatedData: any) => {
    setPassengers(prev => {
      const newPassengers = [...prev];
      // Ensure the array is long enough
      while (newPassengers.length <= index) {
        newPassengers.push({});
      }
      newPassengers[index] = updatedData;
      return newPassengers;
    });
  };

  // --- Add Handler for Contact Info Changes ---
  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setContactInfo((prev: ContactInfoState) => ({ ...prev, [id]: value }));
  };

  // --- Add Handler for Seat Selection Changes ---
  const handleSeatChange = (flightType: 'outbound' | 'return', updatedSeats: any) => {
    setSelectedSeats((prev: any) => ({ ...prev, [flightType]: updatedSeats }));
  };

  // --- Add Handler for Baggage Changes ---
  const handleBaggageChange = (updatedBaggage: any) => {
    setSelectedBaggage(updatedBaggage);
  };

  // --- Add Handler for Meal Changes ---
  const handleMealChange = (updatedMeals: any) => {
    setSelectedMeals(updatedMeals);
  };

  // Handle passenger count changes with validation
  const handlePassengerCountChange = (newCount: number) => {
    // Check if reducing count would lose data
    if (newCount < passengerCount) {
      const hasDataInRemovedSlots = passengers.slice(newCount).some(passenger => {
        return passenger && Object.keys(passenger).length > 0;
      });
      
      if (hasDataInRemovedSlots) {
        const confirmed = window.confirm(
          `Reducing passenger count will remove data for passengers ${newCount + 1} to ${passengerCount}. Continue?`
        );
        if (!confirmed) return;
      }
    }
    
    setPassengerCount(newCount);
  };
  // --- End Handlers ---

  const steps = [
    { id: 1, name: "Passenger Details" },
    { id: 2, name: "Seat Selection" },
    { id: 3, name: "Extras" },
    { id: 4, name: "Review" },
  ]

  const nextStep = () => {
    if (currentStep < steps.length && isCurrentStepValid) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleContinueToPayment = () => {
    // Final validation before payment
    if (!isCurrentStepValid) {
      return;
    }

    const flightId = pathname.split("/")[2]

    // Create booking data to store in session storage
    const bookingData = {
      bookingReference: `REA-${Math.floor(Math.random() * 10000000)}`,
      flightId: flightId,
      id: flightId,
      totalAmount: pricingDetails?.total || 0,
      status: "pending",
      flightDetails: { 
        // TODO: Fetch or pass real flight details if needed, using dummy for now
        outbound: {
          departure: {
            city: "New York",
            airport: "JFK",
            date: "2025-05-15",
            time: "08:30",
            fullDate: "May 15, 2025"
          },
          arrival: {
            city: "London",
            airport: "LHR",
            date: "2025-05-15",
            time: "20:45",
            fullDate: "May 15, 2025"
          },
          airline: {
            name: "Rea Airways",
            code: "RA",
            flightNumber: "1234"
          }
        },
        return: {
          departure: {
            city: "London",
            airport: "LHR",
            date: "2025-05-22",
            time: "10:15",
            fullDate: "May 22, 2025"
          },
          arrival: {
            city: "New York",
            airport: "JFK",
            date: "2025-05-22",
            time: "13:30",
            fullDate: "May 22, 2025"
          },
          airline: {
            name: "Rea Airways",
            code: "RA",
            flightNumber: "4321"
          }
        }
      },
      passengers: passengers.slice(0, passengerCount), // Only include actual passenger count
      contactInfo: contactInfo,
      extras: {
        seats: selectedSeats,
        baggage: selectedBaggage,
        meals: selectedMeals,
        additionalServices: []
      },
      pricing: pricingDetails
    }

    // Store booking data in session storage
    sessionStorage.setItem("bookingReference", bookingData.bookingReference)
    sessionStorage.setItem("bookingData", JSON.stringify(bookingData))

    if (isSignedIn) {
      router.push(`/flights/${encodeURIComponent(flightId)}/payment`)
    } else {
      // Store the redirect URL in session storage
      const redirectUrl = `/flights/${flightId}/payment`
      router.push(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`)
    }
  }

  return (
    <div className="rounded-lg border">
      <div className="p-4 sm:p-6">
        <h2 className="text-xl font-semibold">Booking Details</h2>

        {/* Progress Steps */}
        <div className="mt-4 hidden sm:block">
          <div className="flex items-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium",
                      currentStep >= step.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30 text-muted-foreground",
                    )}
                  >
                    {step.id}
                  </div>
                  <span
                    className={cn(
                      "ml-2 text-sm font-medium",
                      currentStep >= step.id ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn("mx-2 h-0.5 w-10 bg-muted-foreground/30", currentStep > step.id && "bg-primary")}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Validation Summary */}
        {!isCurrentStepValid && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please complete all required fields before continuing.
              {currentStep === 1 && (
                <div className="mt-2">
                  {validationState.passengers.map((validation, index) => (
                    !validation.isValid && (
                      <div key={index} className="text-sm">
                        Passenger {index + 1}: {validation.missingFields.join(', ')}
                      </div>
                    )
                  ))}
                  {!validationState.contactInfo.isValid && (
                    <div className="text-sm">
                      Contact Info: {validationState.contactInfo.missingFields.join(', ')}
                    </div>
                  )}
                </div>
              )}
              {currentStep === 4 && !validationState.termsAccepted && (
                <div className="mt-2 text-sm">
                  Please accept the Terms and Conditions
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-6">
          {/* Step 1: Passenger Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Passenger Information</h3>
                  <Select
                    value={passengerCount.toString()}
                    onValueChange={(value) => handlePassengerCountChange(Number.parseInt(value))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Number of Passengers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Passenger</SelectItem>
                      <SelectItem value="2">2 Passengers</SelectItem>
                      <SelectItem value="3">3 Passengers</SelectItem>
                      <SelectItem value="4">4 Passengers</SelectItem>
                      <SelectItem value="5">5 Passengers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Tabs defaultValue="passenger-1" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-none sm:auto-cols-auto sm:flex">
                    {Array.from({ length: passengerCount }).map((_, index) => {
                      const validation = validationState.passengers[index];
                      const completionPercentage = getPassengerCompletionPercentage(index);
                      
                      return (
                        <TabsTrigger key={index} value={`passenger-${index + 1}`} className="relative">
                          <div className="flex items-center gap-2">
                            <span>Passenger {index + 1}</span>
                            {validation?.isValid ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : completionPercentage > 0 ? (
                              <div className="h-3 w-3 rounded-full border border-orange-500 bg-orange-100 text-[8px] flex items-center justify-center text-orange-600">
                                {Math.round(completionPercentage / 10)}
                              </div>
                            ) : (
                              <AlertCircle className="h-3 w-3 text-red-500" />
                            )}
                          </div>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  {Array.from({ length: passengerCount }).map((_, index) => (
                    <TabsContent key={index} value={`passenger-${index + 1}`}>
                      <PassengerForm
                        passengerNumber={index + 1}
                        passengerData={passengers[index] || {}} // Pass current data or empty object
                        onPassengerChange={(updatedData) => handlePassengerChange(index, updatedData)} // Pass update handler
                      />
                      
                      {/* Progress indicator */}
                      <div className="mt-4 p-3 bg-muted/50 rounded-md">
                        <div className="flex items-center justify-between text-sm">
                          <span>Form Completion</span>
                          <span className={cn(
                            "font-medium",
                            validationState.passengers[index]?.isValid ? "text-green-600" : "text-orange-600"
                          )}>
                            {getPassengerCompletionPercentage(index)}%
                          </span>
                        </div>
                        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-300",
                              validationState.passengers[index]?.isValid ? "bg-green-500" : "bg-orange-500"
                            )}
                            style={{ width: `${getPassengerCompletionPercentage(index)}%` }}
                          />
                        </div>
                        {!validationState.passengers[index]?.isValid && validationState.passengers[index]?.missingFields.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Missing: {validationState.passengers[index].missingFields.join(', ')}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={contactInfo.email || ''} // Bind value to state
                      onChange={handleContactInfoChange} // Add onChange handler
                      className={cn(
                        contactInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email) && "border-red-500"
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      Your booking confirmation will be sent to this email
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={contactInfo.phone || ''} // Bind value to state
                      onChange={handleContactInfoChange} // Add onChange handler
                    />
                    <p className="text-xs text-muted-foreground">For urgent notifications about your flight</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Seat Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Seat Selection</h3>
                <p className="text-sm text-muted-foreground">Choose your preferred seats for your flights</p>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="mb-2 text-base font-medium">Outbound Flight</h4>
                  <SeatSelection 
                    flightType="outbound"
                    selectedSeats={selectedSeats.outbound || []} 
                    onSeatChange={handleSeatChange} 
                  />
                </div>

                <Separator />

                <div>
                  <h4 className="mb-2 text-base font-medium">Return Flight</h4>
                  <SeatSelection 
                    flightType="return"
                    selectedSeats={selectedSeats.return || []} 
                    onSeatChange={handleSeatChange} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Extras */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Optional Extras</h3>
                <p className="text-sm text-muted-foreground">Enhance your journey with additional services</p>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="mb-2 text-base font-medium">Baggage Options</h4>
                  <BaggageOptions 
                    selectedBaggage={selectedBaggage} 
                    onBaggageChange={handleBaggageChange} 
                  />
                </div>

                <Separator />

                <div>
                  <h4 className="mb-2 text-base font-medium">Meal Preferences</h4>
                  <MealOptions 
                    selectedMeals={selectedMeals} 
                    onMealChange={handleMealChange} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Review Your Booking</h3>
                <p className="text-sm text-muted-foreground">Please review all details before proceeding to payment</p>
              </div>

              {/* Passenger Summary */}
              <div className="space-y-4">
                <h4 className="text-base font-medium">Passengers ({passengerCount})</h4>
                {passengers.slice(0, passengerCount).map((passenger, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <div className="font-medium">
                        {passenger?.title} {passenger?.firstName} {passenger?.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {passenger?.type} • {passenger?.nationality}
                      </div>
                    </div>
                    {validationState.passengers[index]?.isValid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                ))}
              </div>

              {/* Contact Info Summary */}
              <div className="space-y-2">
                <h4 className="text-base font-medium">Contact Information</h4>
                <div className="p-3 border rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <div>{contactInfo.email}</div>
                      <div className="text-sm text-muted-foreground">{contactInfo.phone}</div>
                    </div>
                    {validationState.contactInfo.isValid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="terms" 
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                  />
                  <div>
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the Terms and Conditions *
                    </label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      By checking this box, you agree to our{" "}
                      <a href="#" className="text-primary underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-primary underline">
                        Privacy Policy
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
              Back
            </Button>

            {currentStep < steps.length ? (
              <Button 
                onClick={nextStep} 
                disabled={!isCurrentStepValid}
                className={cn(!isCurrentStepValid && "opacity-50 cursor-not-allowed")}
              >
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleContinueToPayment} 
                disabled={!isCurrentStepValid}
                className={cn(!isCurrentStepValid && "opacity-50 cursor-not-allowed")}
                aria-label="Continue to payment page"
              >
                Continue to Payment
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
