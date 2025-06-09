"""
Flight Booking Module

This module handles flight booking operations using the Verteil NDC API.
"""
import logging
from typing import Dict, Any, Optional, List
import uuid

from .core import FlightService
from .decorators import async_cache, async_rate_limited
from .exceptions import FlightServiceError, ValidationError, BookingError
from .types import BookingResponse, SearchCriteria

# Import the OrderCreate request builder
try:
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'scripts'))
    from build_ordercreate_rq import generate_order_create_rq
except ImportError as e:
    logger.error(f"Failed to import build_ordercreate_rq: {e}")
    generate_order_create_rq = None

logger = logging.getLogger(__name__)

class FlightBookingService(FlightService):
    """Service for handling flight booking operations."""
    
    @async_rate_limited(limit=100, window=60)
    async def create_booking(
        self,
        flight_price_response: Dict[str, Any],
        passengers: List[Dict[str, Any]],
        payment_info: Dict[str, Any],
        contact_info: Dict[str, str],
        request_id: Optional[str] = None,
    ) -> BookingResponse:
        """
        Create a new flight booking.
        
        Args:
            flight_price_response: The FlightPrice response
            passengers: List of passenger details
            payment_info: Payment information
            contact_info: Contact information
            request_id: Optional request ID for tracking
            
        Returns:
            BookingResponse containing booking confirmation or error information
            
        Raises:
            ValidationError: If the request data is invalid
            BookingError: If there's an error creating the booking
        """
        try:
            # Validate input
            self._validate_booking_request(
                flight_price_response=flight_price_response,
                passengers=passengers,
                payment_info=payment_info,
                contact_info=contact_info
            )
            
            # Generate a request ID if not provided
            request_id = request_id or str(uuid.uuid4())
            
            # Extract airline code from the flight price response for dynamic thirdPartyId
            airline_code = self._extract_airline_code_from_price_response(flight_price_response)
            logger.info(f"Extracted airline code '{airline_code}' for booking (ReqID: {request_id})")
            
            # Build the request payload
            payload = self._build_booking_payload(
                flight_price_response=flight_price_response,
                passengers=passengers,
                payment_info=payment_info,
                contact_info=contact_info,
                request_id=request_id
            )
            
            # Make the API request with dynamic airline code
            response = await self._make_request(
                endpoint='ordercreate',
                payload=payload,
                service_name='OrderCreate',
                airline_code=airline_code,
                request_id=request_id
            )
            
            # Process and return the response
            return {
                'status': 'success',
                'data': self._process_booking_response(response),
                'request_id': request_id
            }
            
        except ValidationError as e:
            logger.error(f"Validation error in create_booking: {str(e)}")
            return {
                'status': 'error',
                'error': str(e),
                'request_id': request_id
            }
        except Exception as e:
            logger.error(f"Error in create_booking: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'error': f"Failed to create booking: {str(e)}",
                'request_id': request_id
            }
    
    def _extract_airline_code_from_price_response(self, flight_price_response: Dict[str, Any]) -> Optional[str]:
        """
        Extract the airline code from the flight price response for dynamic thirdPartyId.
        
        Args:
            flight_price_response: The FlightPrice response containing offer details
            
        Returns:
            The airline code (e.g., 'KQ', 'WY') or None if not found
        """
        try:
            # Navigate to the priced offers in the response
            flight_price_rs = flight_price_response.get('FlightPriceRS', {})
            priced_offer = flight_price_rs.get('PricedOffer', {})
            
            # Extract airline code from Owner field
            owner = priced_offer.get('Owner', {})
            if isinstance(owner, dict):
                airline_code = owner.get('value')
                if airline_code:
                    logger.info(f"Found airline code '{airline_code}' in FlightPrice response")
                    return airline_code
            
            # Alternative: try to extract from OfferItem if Owner not found at top level
            offer_items = priced_offer.get('OfferItem', [])
            if not isinstance(offer_items, list):
                offer_items = [offer_items]
            
            for offer_item in offer_items:
                # Look for airline code in service associations or flight segments
                service = offer_item.get('Service', {})
                if isinstance(service, list) and service:
                    service = service[0]
                
                # Try to extract from service details
                service_definition = service.get('ServiceDefinition', {})
                if service_definition:
                    # Look for airline code in service definition
                    pass  # This would require more specific API response analysis
            
            logger.warning(f"Could not extract airline code from FlightPrice response")
            return None
            
        except Exception as e:
            logger.error(f"Error extracting airline code from FlightPrice response: {str(e)}", exc_info=True)
            return None
    
    async def get_booking_details(
        self,
        booking_reference: str,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Retrieve details for a specific booking.
        
        Args:
            booking_reference: The booking reference number
            request_id: Optional request ID for tracking
            
        Returns:
            Dictionary containing booking details
            
        Raises:
            ValidationError: If the booking reference is invalid
            BookingError: If there's an error retrieving the booking
        """
        try:
            if not booking_reference:
                raise ValidationError("Booking reference is required")
                
            # Generate a request ID if not provided
            request_id = request_id or str(uuid.uuid4())
            
            # Build the request payload
            payload = {
                'OrderID': booking_reference,
                'RequestID': request_id
            }
            
            # Make the API request
            response = await self._make_request(
                endpoint='orderretrieve',
                payload=payload,
                service_name='OrderRetrieve',
                request_id=request_id
            )
            
            # Process and return the response
            return {
                'status': 'success',
                'data': self._process_retrieve_response(response),
                'request_id': request_id
            }
            
        except ValidationError as e:
            logger.error(f"Validation error in get_booking_details: {str(e)}")
            return {
                'status': 'error',
                'error': str(e),
                'request_id': request_id
            }
        except Exception as e:
            logger.error(f"Error in get_booking_details: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'error': f"Failed to retrieve booking: {str(e)}",
                'request_id': request_id
            }
    
    def _validate_booking_request(
        self,
        flight_price_response: Dict[str, Any],
        passengers: List[Dict[str, Any]],
        payment_info: Dict[str, Any],
        contact_info: Dict[str, str]
    ) -> None:
        """
        Validate the booking request data.
        
        Args:
            flight_price_response: The FlightPrice response
            passengers: List of passenger details
            payment_info: Payment information
            contact_info: Contact information
            
        Raises:
            ValidationError: If any required data is missing or invalid
        """
        if not flight_price_response:
            raise ValidationError("Flight price response is required")
            
        if not passengers:
            raise ValidationError("At least one passenger is required")
            
        if not payment_info:
            raise ValidationError("Payment information is required")
            
        if not contact_info or not contact_info.get('email'):
            raise ValidationError("Contact information with email is required")
    
    def _build_booking_payload(
        self,
        flight_price_response: Dict[str, Any],
        passengers: List[Dict[str, Any]],
        payment_info: Dict[str, Any],
        contact_info: Dict[str, str],
        request_id: str
    ) -> Dict[str, Any]:
        """
        Build the OrderCreate request payload using the request builder.
        
        Args:
            flight_price_response: The FlightPrice response
            passengers: List of passenger details
            payment_info: Payment information
            contact_info: Contact information
            request_id: Request ID for tracking
            
        Returns:
            Dictionary containing the request payload
        """
        try:
            if generate_order_create_rq is None:
                # Fallback to manual payload construction if import failed
                logger.warning("Using fallback payload construction for OrderCreate")
                return self._build_fallback_payload(
                    flight_price_response, passengers, payment_info, contact_info, request_id
                )
            
            # Transform passenger data to match the expected format
            transformed_passengers = []
            for passenger in passengers:
                transformed_passenger = {
                    'type': passenger.get('type', 'ADT'),
                    'title': passenger.get('title'),
                    'first_name': passenger.get('first_name'),
                    'last_name': passenger.get('last_name'),
                    'date_of_birth': passenger.get('date_of_birth'),
                    'gender': passenger.get('gender'),
                    'nationality': passenger.get('nationality')
                }
                
                # Add document information if available
                if passenger.get('passport_number'):
                    transformed_passenger['documents'] = [{
                        'type': 'Passport',
                        'number': passenger.get('passport_number'),
                        'expiry_date': passenger.get('passport_expiry'),
                        'issuing_country': passenger.get('nationality')
                    }]
                
                # Add contact info to first passenger
                if len(transformed_passengers) == 0:
                    transformed_passenger['contact'] = {
                        'email': contact_info.get('email'),
                        'phone': contact_info.get('phone')
                    }
                
                transformed_passengers.append(transformed_passenger)
            
            # Transform payment info to match expected format
            transformed_payment = {
                'method': payment_info.get('payment_method', 'PaymentCard'),
                'currency': payment_info.get('currency', 'USD')
            }
            
            if payment_info.get('payment_method') == 'PaymentCard':
                transformed_payment['card_info'] = {
                    'type': payment_info.get('card_type'),
                    'number': payment_info.get('card_number'),
                    'expiry_date': payment_info.get('expiry_date'),
                    'cvv': payment_info.get('cvv'),
                    'holder_name': payment_info.get('card_holder_name')
                }
            
            # Use the request builder to generate the payload
            payload = generate_order_create_rq(
                flight_price_response=flight_price_response,
                passengers_data=transformed_passengers,
                payment_input_info=transformed_payment
            )
            
            logger.info(f"Successfully generated OrderCreate payload using request builder")
            return payload
            
        except Exception as e:
            logger.error(f"Error using OrderCreate request builder: {e}")
            # Fallback to manual construction
            return self._build_fallback_payload(
                flight_price_response, passengers, payment_info, contact_info, request_id
            )
    
    def _build_fallback_payload(
        self,
        flight_price_response: Dict[str, Any],
        passengers: List[Dict[str, Any]],
        payment_info: Dict[str, Any],
        contact_info: Dict[str, str],
        request_id: str
    ) -> Dict[str, Any]:
        """
        Fallback method to build OrderCreate payload manually.
        
        Args:
            flight_price_response: The FlightPrice response
            passengers: List of passenger details
            payment_info: Payment information
            contact_info: Contact information
            request_id: Request ID for tracking
            
        Returns:
            Dictionary containing the request payload
        """
        payload = {
            'ShoppingResponseID': flight_price_response.get('shopping_response_id'),
            'SelectedOffer': {
                'OfferID': flight_price_response.get('offer_id'),
                'OfferItemIDs': [item['id'] for item in flight_price_response.get('offer_items', [])]
            },
            'Passengers': [],
            'PaymentInfo': {
                'PaymentMethod': payment_info.get('payment_method', 'CREDIT_CARD'),
                'CardInfo': {
                    'CardType': payment_info.get('card_type'),
                    'CardNumber': payment_info.get('card_number'),
                    'ExpiryDate': payment_info.get('expiry_date'),
                    'CVV': payment_info.get('cvv'),
                    'CardHolderName': payment_info.get('card_holder_name')
                }
            },
            'ContactInfo': {
                'Email': contact_info.get('email'),
                'Phone': contact_info.get('phone')
            },
            'RequestID': request_id
        }
        
        # Add passenger details
        for i, passenger in enumerate(passengers, 1):
            payload['Passengers'].append({
                'PassengerID': f'PAX{i}',
                'Type': passenger.get('type', 'ADT'),
                'Title': passenger.get('title'),
                'FirstName': passenger.get('first_name'),
                'LastName': passenger.get('last_name'),
                'DateOfBirth': passenger.get('date_of_birth'),
                'Gender': passenger.get('gender'),
                'PassportNumber': passenger.get('passport_number'),
                'PassportExpiry': passenger.get('passport_expiry'),
                'Nationality': passenger.get('nationality')
            })
        
        return payload
    
    def _process_booking_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process the OrderCreate API response.
        
        Args:
            response: Raw API response
            
        Returns:
            Processed response data
        """
        # This is a simplified example - adapt based on the actual API response structure
        processed = {
            'booking_reference': response.get('OrderID'),
            'status': response.get('OrderStatus'),
            'booking_time': response.get('CreationDateTime'),
            'tickets': []
        }
        
        # Process tickets if available
        if 'Tickets' in response:
            for ticket in response['Tickets']:
                processed['tickets'].append({
                    'ticket_number': ticket.get('TicketNumber'),
                    'passenger_name': ticket.get('PassengerName'),
                    'status': ticket.get('Status')
                })
        
        return processed
    
    def _process_retrieve_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process the OrderRetrieve API response.
        
        Args:
            response: Raw API response
            
        Returns:
            Processed response data
        """
        # This is a simplified example - adapt based on the actual API response structure
        processed = {
            'booking_reference': response.get('OrderID'),
            'status': response.get('OrderStatus'),
            'booking_time': response.get('CreationDateTime'),
            'passengers': [],
            'flights': [],
            'price_info': response.get('PriceInfo', {})
        }
        
        # Process passengers if available
        if 'Passengers' in response:
            for pax in response['Passengers']:
                processed['passengers'].append({
                    'passenger_id': pax.get('PassengerID'),
                    'name': f"{pax.get('FirstName', '')} {pax.get('LastName', '')}".strip(),
                    'type': pax.get('Type'),
                    'ticket_number': pax.get('TicketNumber')
                })
        
        # Process flights if available
        if 'FlightSegments' in response:
            for segment in response['FlightSegments']:
                processed['flights'].append({
                    'flight_number': f"{segment.get('MarketingAirline')}{segment.get('FlightNumber')}",
                    'departure': segment.get('Departure'),
                    'arrival': segment.get('Arrival'),
                    'status': segment.get('Status')
                })
        
        return processed


# Helper functions for backward compatibility
async def create_booking(
    flight_price_response: Dict[str, Any],
    passengers: List[Dict[str, Any]],
    payment_info: Dict[str, Any],
    contact_info: Dict[str, str],
    request_id: Optional[str] = None,
    config: Optional[Dict[str, Any]] = None
) -> BookingResponse:
    """
    Create a new flight booking.
    
    This is a backward-compatible wrapper around the FlightBookingService.
    """
    # Use a single service instance to avoid creating multiple TokenManager instances
    service = FlightBookingService(config=config or {})
    try:
        return await service.create_booking(
            flight_price_response=flight_price_response,
            passengers=passengers,
            payment_info=payment_info,
            contact_info=contact_info,
            request_id=request_id
        )
    finally:
        await service.close()


async def process_order_create(order_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process order creation request.
    
    This is a backward-compatible wrapper around the FlightBookingService.
    """
    config = order_data.pop('config', {})
    
    # Use a single service instance to avoid creating multiple TokenManager instances
    service = FlightBookingService(config=config)
    try:
        return await service.create_booking(
            flight_price_response=order_data.get('flight_price_response', {}),
            passengers=order_data.get('passengers', []),
            payment_info=order_data.get('payment_info', {}),
            contact_info=order_data.get('contact_info', {}),
            request_id=order_data.get('request_id')
        )
    finally:
        await service.close()


async def get_booking_details(
    booking_reference: str,
    request_id: Optional[str] = None,
    config: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Retrieve details for a specific booking.
    
    This is a backward-compatible wrapper around the FlightBookingService.
    """
    # Use a single service instance to avoid creating multiple TokenManager instances
    service = FlightBookingService(config=config or {})
    try:
        return await service.get_booking_details(
            booking_reference=booking_reference,
            request_id=request_id
        )
    finally:
        await service.close()
