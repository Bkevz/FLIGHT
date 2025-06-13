# Flight Booking Portal - Development Scratchpad

## Current Active Tasks

### Flight Selection Data Flow Fix
- **File**: `docs/implementation-plan/flight-selection-data-flow-fix.md`
- **Status**: ✅ RESOLVED - Final testing phase completed
- **Priority**: CRITICAL
- **Description**: Fix the "No flight search data found" error when users select flights from search results
- **Root Cause**: URL encoding/decoding mismatch for flight IDs with special characters
- **Completed Tasks**: ✅ Task 1 (Data Storage), ✅ Task 2 (Navigation), ✅ Task 3 (Data Retrieval), ✅ Task 4 (URL Encoding Fix), ✅ Task 5 (Testing)
- **Current Phase**: Ready for production deployment
- **Branch**: `fix/flight-selection-data-flow`

## Lessons Learned

### [2025-06-13] OfferID Implementation Fix (Latest)
- **Issue**: "Flight Data Not Found" error due to using OfferItemID instead of OfferID for flight identification
- **Root Cause**: OfferItemID is for passenger type codes (PTC) under one OfferID, while OfferID is unique to each flight offer
- **Analysis**: 
  - Previous implementation used OfferItemID from offer_price object
  - OfferID is the correct unique identifier for each flight offer
  - OfferID is located in priced_offer.OfferID.value structure
  - OfferItemID represents passenger type variations under the same flight offer
- **Solution**: 
  - Updated `data_transformer.py` to extract OfferID from `priced_offer.OfferID.value`
  - Updated `data_transformer_roundtrip.py` to use OfferID with suffix for outbound/return legs
  - Added proper fallback to UUID-based IDs if OfferID not found
  - Maintained logging for debugging purposes
- **Files Modified**: 
  - `Backend/utils/data_transformer.py` (lines 470-490): Changed from OfferItemID to OfferID extraction
  - `Backend/utils/data_transformer_roundtrip.py` (lines 128-152): Updated to use OfferID with suffix
- **Key Improvements**: 
  - Correct flight identification using unique OfferID
  - Proper understanding of API response structure
  - Maintained backward compatibility with fallback IDs
- **Prevention**: Always verify the correct unique identifier field in API responses before implementation

### [2025-01-07] Shopping Response ID Access Fix (Latest - Attempt 2)
- **Issue**: "Shopping response ID not found" error - shopping_response_id still showing as null despite being present in nestedDataKeys
- **Root Cause**: Misunderstanding of data storage structure - the data is stored as `airShoppingResponse: apiResponse` where `apiResponse = response.data`, creating a deeper nesting than initially understood
- **Analysis**: 
  - Console logs show shopping_response_id exists in nestedDataKeys but access attempts return null
  - Data structure: `airShoppingResponseData` contains `airShoppingResponse: apiResponse` where `apiResponse` is `response.data`
  - This means the actual path is `airShoppingResponseData.data.data.data.shopping_response_id` (triple nested)
  - Previous fix was checking wrong nesting levels
- **Solution**: 
  - Updated debug logs to check all possible nesting levels including triple nested structure
  - Reordered access logic to check triple nested structure first: `airShoppingResponseData.data.data.data.shopping_response_id`
  - Added fallbacks for double nested, single nested, and direct access
  - Added console logs to indicate which structure was found
- **Files Modified**: 
  - `Frontend/app/flights/[id]/page.tsx` (lines 122-130, 199-223): Enhanced debug logging and corrected access logic
- **Key Improvements**: 
  - Comprehensive debug logging for all nesting levels
  - Correct understanding of data storage structure
  - Systematic approach to checking all possible locations
  - Clear logging to indicate which structure contains the data
- **Prevention**: Always trace data flow from storage to access to understand complete nesting structure

### [2025-01-07] Backend API Request Handling Fix
- **Issue**: Backend error "argument of type 'NoneType' is not iterable" and "Missing required fields: shopping_response_id"
- **Root Cause**: Backend `request.get_json()` returning None due to invalid JSON or missing Content-Type header
- **Analysis**: 
  - Frontend was sending requests but backend couldn't parse the JSON data
  - Error occurred in field validation loop: `[f for f in required_fields if f not in data]` when `data` was None
  - Frontend also had inconsistent data structure access for `shopping_response_id`
- **Solution**: 
  - **Backend**: Added null check for request data with descriptive error message
  - **Frontend**: Implemented flexible `shopping_response_id` detection with multiple fallback strategies
  - Added comprehensive logging for debugging request data structure
- **Files Modified**: 
  - `Backend/routes/verteil_flights.py` (lines 370-379): Added data validation and logging
  - `Frontend/app/flights/[id]/page.tsx` (lines 188-218): Enhanced data structure handling
- **Key Improvements**: 
  - Better error messages for invalid requests
  - Flexible data access patterns for nested API responses
  - Enhanced debugging logs for request data structure
- **Prevention**: Always validate request data existence before processing and use flexible data access patterns

### [2025-01-07] Flight Data Structure Access Issue Fixed
- **Issue**: "airShoppingResponseData.data.offers is undefined" error when accessing flight details
- **Root Cause**: Inconsistent data structure access patterns between flight results and flight details pages
- **Analysis**: 
  - Flight results page stores complete API response as `airShoppingResponse: apiResponse`
  - Flight details page was hardcoded to access `airShoppingResponseData.data.offers`
  - Actual structure varies: `apiResponse.data.data.offers` (triple nested) vs `apiResponse.data.offers` (double nested)
- **Solution**: Implemented flexible data structure detection with multiple fallback strategies
  - Strategy 1: `airShoppingResponseData.data.data.offers` (triple nested)
  - Strategy 2: `airShoppingResponseData.data.offers` (double nested)
  - Strategy 3: `airShoppingResponseData.offers` (direct array)
- **Files Modified**: `Frontend/app/flights/[id]/page.tsx` (lines 115-156)
- **Key Improvement**: Added comprehensive logging and error messages showing available data structure
- **Prevention**: Always use flexible data access patterns when dealing with nested API responses

### [2025-01-07] ThirdPartyId Configuration Analysis Completed
- **Issue Identified**: Configuration shows `VERTEIL_THIRD_PARTY_ID=EK` but API responses contain data from multiple airlines (KQ, WY, etc.)
- **Root Cause Analysis**: 
  - ThirdPartyId is sent in HTTP headers (`X-Third-Party-ID` and `ThirdpartyId`) but NOT in request payload body
  - AirShopping endpoint: ThirdPartyId is optional - API returns offers from multiple airlines regardless of header value
  - FlightPrice endpoint: ThirdPartyId is mandatory - must match the airline of the selected offer
  - OrderCreate endpoint: ThirdPartyId is mandatory - must match the airline for booking creation
- **Current Implementation**: 
  - Headers correctly include `ThirdpartyId: EK` from config
  - Request payloads (AirShopping, FlightPrice, OrderCreate) do NOT include thirdPartyId field
  - API responses contain airline-specific data (e.g., "Owner": {"value": "KQ"}) independent of header
- **Evidence Found**:
  - Debug response shows offers from KQ airline despite EK thirdPartyId header
  - WY references found in encoded offer IDs within API responses
  - Test files use `VERTEIL_THIRD_PARTY_ID='KQ'` while production uses `EK`
- **Detailed Analysis and Recommendations**:
  1. **Current Implementation Status**: ThirdPartyId is correctly included in headers but not in request payloads (which is correct per API specification)
  2. **Dynamic ThirdPartyId Implementation**: For FlightPrice and OrderCreate operations, implement dynamic thirdPartyId header setting based on the selected offer's airline (extract from offer.Owner.value)
  3. **Service Layer Enhancement**: Update FlightPricingService and FlightBookingService to accept airline parameter and dynamically set thirdPartyId header
- **Recommendation**: ThirdPartyId header should match the airline being processed for FlightPrice/OrderCreate operations

### [2024-12-19] Frontend-Backend Integration Successfully Tested
- **Issue Fixed**: Configuration error "Configuration not available for FlightSearchService in process_air_shopping"
- **Root Cause**: Flight service was trying to import Flask's `current_app` instead of Quart's `current_app`
- **Solution**: Updated imports in `Backend/services/flight/search.py` to use `from quart import current_app`
- **Files Modified**: `Backend/services/flight/search.py` (lines with Flask imports changed to Quart)
- **Test Results**: All integration tests pass - Backend API returns successful responses, Frontend loads correctly
- **Integration Flow**: Frontend (localhost:3000) → Frontend API Route (/api/flights/search-advanced) → Backend API (localhost:5000/api/verteil/air-shopping)

### [2024-12-19] Token Management Anti-Pattern Identified
- **Issue**: Multiple FlightService instances are being created on each API call, each generating their own tokens
- **Root Cause**: Standalone service functions (search_flights, get_flight_price, create_booking, etc.) use `async with FlightService(config) as service` pattern
- **Impact**: Bypasses the singleton TokenManager, causing unnecessary token generation requests
- **Files Affected**: 
  - `Backend/services/flight/search.py`
  - `Backend/services/flight/pricing.py` 
  - `Backend/services/flight/booking.py`

### [2024-12-19] Proper Token Management Architecture
- **Correct Pattern**: Use singleton TokenManager from `Backend/utils/auth.py`
- **TokenManager Features**: Thread-safe caching, automatic renewal, expiry buffer handling
- **Integration Point**: FlightService should use TokenManager instead of implementing its own token logic

### [2025-01-07] Service Configuration Error Resolved
- **Issue**: Backend logs showed "Service configuration error" from Verteil API with transaction IDs
- **Root Cause**: Multiple FlightService instances were creating duplicate authentication requests
- **Evidence**: Logs showed multiple "FlightService initialized" messages per request
- **Impact**: API requests were failing due to authentication/configuration conflicts
- **Solution Implemented**: ✅ Modified all wrapper functions to use single service instances instead of `async with Service(...)` pattern
- **Files Updated**: search.py, booking.py, and pricing.py - eliminated duplicate FlightService instantiation

### [2025-01-07] Critical Frontend-Backend Data Structure Mismatch Identified and Resolved
- **Issue**: Frontend expects clean, structured `FlightOffer` objects but backend returns raw Verteil API responses
- **Root Cause**: No data transformation layer exists between Verteil API responses and frontend expectations
- **Evidence**: 
  - Frontend `types/flight-api.ts` defines structured interfaces (FlightOffer, AirlineDetails, etc.)
  - Backend returns complex nested JSON with airline-specific namespacing (e.g., "KQ-SEG3")
  - Price data buried in `PriceDetail.TotalAmount.SimpleCurrencyPrice` vs frontend expecting simple `price` field
- **Impact**: Frontend cannot properly display flight information without significant data transformation
- **Solution Implemented**: ✅ Created comprehensive data transformation layer
  - Implemented `transform_verteil_to_frontend()` function in `Backend/utils/data_transformer.py`
  - Added helper functions for reference data extraction, segment transformation, duration calculation
  - Created comprehensive test suite with 13 passing unit tests
  - Integrated transformation into `process_air_shopping()` function
  - Fixed indentation error in flight search service
- **Files Created**: `Backend/utils/data_transformer.py`, `Backend/tests/test_data_transformer.py`
- **Files Modified**: `Backend/services/flight/search.py`
- **Result**: Raw Verteil API responses now automatically transformed to frontend-compatible format
- **Status**: ✅ RESOLVED - Task 2.0 completed successfully

### [2025-01-07] Data Transformation Layer Successfully Implemented
- **Achievement**: Complete data transformation from Verteil API responses to frontend-compatible FlightOffer objects
- **Files Created**: 
  - `Backend/utils/data_transformer.py` - Main transformation logic with comprehensive field mapping
  - `Backend/tests/test_data_transformer.py` - Unit tests covering success/error scenarios
- **Key Features**: 
  - Airline details extraction and mapping
  - Flight segment processing with departure/arrival details
  - Price extraction and formatting
  - Baggage allowance parsing
  - Robust error handling for malformed data
- **Integration**: Successfully integrated with `Backend/services/flight/search.py`
- **Test Results**: All unit tests pass, manual testing confirms proper data structure transformation
- **Impact**: Frontend now receives properly structured data matching expected interfaces

### [2025-01-07] Round Trip Transformation Feature Successfully Implemented
- **Achievement**: Enhanced data transformer to split round trip flights into separate outbound and return offers
- **Files Created**:
  - `Backend/utils/data_transformer_roundtrip.py` - Round trip transformation logic
  - `Backend/test_roundtrip_transformation.py` - Comprehensive round trip tests
  - `Backend/test_roundtrip_integration.py` - Integration tests with main transformer
  - `Backend/docs/roundtrip_transformation.md` - Complete feature documentation
- **Key Features**:
  - Automatic detection of round trip segments based on origin/destination patterns
  - Splitting of round trip offers into separate outbound/return journeys
  - Enhanced offer metadata with direction and trip type information
  - Backward compatibility with existing transformation logic
- **API Integration**: Added `enableRoundtrip` parameter to `/api/verteil/air-shopping` endpoint
- **Test Results**: 
  - Original transformation: 95 offers (round trip as single offers)
  - Enhanced transformation: 190 offers (95 outbound + 95 return)
  - All integration tests pass, backward compatibility maintained
- **Impact**: Users can now view and analyze individual legs of round trip journeys with separate pricing and details

### [2025-01-07] Penalties Section Enhancement Completed (Basic Implementation)
- **Issue**: Backend penalty extraction returned raw penalty list, but frontend expected structured FareRules format
- **Root Cause**: Penalty data was extracted correctly but not transformed to match frontend TypeScript interfaces
- **Evidence**: 
  - Frontend `types/flight-api.ts` defines `FareRules` interface with specific penalty categories
  - Backend `_extract_penalty_info()` returned simple penalty list with type, application, amount, currency
  - Frontend expected structured categories like `changeBeforeDeparture`, `cancelBeforeDeparture`, etc.
- **Solution Implemented**: ✅ Enhanced penalty transformation to structured FareRules format
  - Created `_transform_penalties_to_fare_rules()` function in `Backend/utils/data_transformer.py`
  - Maps penalty types and applications to specific frontend categories
  - Calculates refund percentages for cancellation policies
  - Maintains backward compatibility with original penalties list
  - Adds structured fare rules with allowed/fee/currency/conditions format
- **Files Modified**: `Backend/utils/data_transformer.py`
- **Test Results**: 
  - Successfully extracts Change and Cancel penalties from API response
  - Correctly maps "Prior to Departure" application to `changeBeforeDeparture` and `cancelBeforeDeparture`
  - Properly calculates 100% refund percentage for zero-fee cancellations
  - Maintains additional restrictions and penalty summaries
- **Result**: Flight offers now include both `penalties` (backward compatibility) and `fareRules` (structured format)
- **Status**: ✅ COMPLETED - Basic penalties section enhanced and tested

### [2025-01-07] Advanced Penalty Structure Requirements Identified
- **New Requirement**: Comprehensive penalty documentation provided showing complex penalty calculation requirements
- **Key Requirements Identified**:
  - **MIN/MAX Penalty Calculations**: API consumers must consider maximum value as max penalty and lowest value as minimum penalty
  - **OD-Level vs Segment-Level Penalties**: Different penalty structures for Origin-Destination vs individual segments
  - **Trip Type Support**: One-way, Round-trip, and Multi-city trip penalty calculations
  - **Passenger Category Support**: Different penalties for ADT (Adult), Young Adult, CHD (Child), INFT (Infant)
  - **Penalty Type Coverage**: Cancel, Change, No-show cancel, No-show change, upgrade, and future penalty types
  - **UI Representation**: Agency UI shows penalty details at OD level/Itinerary level
- **Current Implementation Gap**: Current penalty extraction only handles basic penalty mapping without MIN/MAX calculations or trip-type-specific logic
- **Next Steps Required**: 
  - Enhance penalty extraction to support MIN/MAX calculations across segments
  - Implement OD-level penalty aggregation logic
  - Add support for different trip types (one-way, round-trip, multi-city)
  - Add passenger category-specific penalty handling
  - Update frontend to display penalty ranges (MIN-MAX) appropriately
- **Status**: 🔄 PLANNING REQUIRED - Advanced penalty structure enhancement needed

## Project Status

- Task 2.0 (Data Transformation Layer) completed - **Basic Implementation**. Flight offers now include both original `penalties` and structured `fareRules`.
- **NEW**: Advanced Penalty Structure Enhancement identified and planned based on comprehensive penalty documentation.
- Task 2.1 (Enhance Flight Search Endpoint) is on hold pending advanced penalty implementation.

## Resolved Issues

- **Frontend-Backend Data Structure Mismatch:** Resolved by implementing a data transformation layer (`data_transformer.py`) to convert backend penalty data into the frontend's expected `FareRules` structure. This involved creating the `_transform_penalties_to_fare_rules` function.
- **Service Configuration Errors:** Resolved by ensuring single instances of services are used.

## Current Focus: Advanced Penalty Structure Enhancement

### Implementation Plan Created
- **Document**: `docs/implementation-plan/advanced-penalty-structure-enhancement.md`
- **Branch**: `feature/advanced-penalty-structure`
- **Status**: Ready to begin implementation

### Key Requirements Identified
1. **MIN/MAX Penalty Calculations**: Calculate penalty ranges across segments
2. **OD-Level Aggregation**: Show penalties at Origin-Destination level vs segment level
3. **Trip Type Support**: One-way, Round-trip, Multi-city penalty logic
4. **Passenger Category Support**: ADT, Young Adult, CHD, INFT specific penalties
5. **UI Representation**: Agency UI penalty display at OD/Itinerary level

### Current Implementation Gap
The existing basic penalty implementation only handles simple penalty mapping without:
- MIN/MAX penalty range calculations
- OD-level penalty aggregation
- Trip type specific logic
- Passenger category considerations
- Advanced UI penalty range display

## Lessons Learned

- [2025-01-07] Include info useful for debugging in the program output.
- [2025-01-07] Read the file before you try to edit it.
- [2025-01-07] If there are vulnerabilities that appear in the terminal, run npm audit before proceeding.
- [2025-01-07] Always ask before using the -force git command.
- [2025-01-07] My testing framework is pytest.
- [2025-01-07] **Penalty calculations are significantly more complex than initially implemented** - requires MIN/MAX aggregation, OD-level calculations, and trip type awareness.
- [2025-01-07] **Comprehensive penalty documentation analysis is crucial** - the provided documentation reveals advanced requirements not captured in basic implementation.
- [2025-01-07] **CRITICAL: Application Code mapping is essential for penalty accuracy** - API uses specific codes (1-4) that must be correctly interpreted: 1=After Departure NO Show, 2=Prior to Departure, 3=After Departure, 4=Before Departure No Show.
- [2025-01-07] **API structure understanding is fundamental** - penalty data follows specific JSON path `JSON.DataLists.PenaltyList.Penalty[0].Details.Detail[0].Application.Code` with MIN/MAX amounts in `AmountApplication` field.

## Comprehensive Penalty Implementation Requirements

### Core Penalty Principles
- Penalties can vary by passenger type (ADT, Young Adult, CHD, INFT)
- Penalty details are applicable across various API flows (AirShopping, FlightPrice, OrderView, OrderReshop, OrderRequote) and penalty types (Cancel, Change, No-show cancel, No-show change, upgrade, and future types)
- The precise penalty amount is only available after initiating a cancel or change transaction via respective API calls (refundquote RS API or reshop/requote RS API)
- The UI is assumed to show penalty details at the OD (Origin-Destination) or Itinerary level

### MIN/MAX Penalty Interpretation Rules
- **Maximum value**: Represents the highest possible penalty that will be incurred
- **Lowest value**: Represents the lowest or starting value that can be charged
- **API consumers**: Can display min-max range or minimum amount for changes/cancellations
- **Missing MIN/MAX**: If no MIN/MAX is provided in API response, assume the value as maximum

### Penalty Aggregation Logic by Trip Type

#### One-Way Trips
- **Segment Level**: Calculate MIN/MAX across all segments in the journey
- **OD Level**: Direct mapping from API to UI
- **UI Display**: Show minimum of all minimums and maximum of all maximums

#### Round-Trip Trips
- **Segment Level**: Calculate MIN/MAX for outbound and return segments separately
- **OD Level**: Aggregate penalties for each direction
- **UI Display**: Show penalty ranges for each OD direction

#### Multi-City Trips
- **Segment Level**: Calculate MIN/MAX for each OD separately
- **OD Level**: Aggregate penalties within each OD
- **UI Display**: Show penalty ranges for each OD in the multi-city itinerary

### Implementation Examples from Documentation

#### Segment Level - One Way (A-B-C)
- **VDC API**: A-B (MIN: 100, MAX: 120), B-C (MIN: 110, MAX: 200)
- **UI (OD)**: A-C (MIN: 100, MAX: 200)

#### Segment Level - Round Trip (A-B-C-B-A)
- **VDC API**: 
  - Outbound: A-B (MIN: 100, MAX: 120), B-C (MIN: 100, MAX: 130)
  - Return: C-B (MIN: 100, MAX: 100), B-A (MIN: 90, MAX: 110)
- **UI (OD)**: 
  - A-C (MIN: 90, MAX: 130)
  - C-A (MIN: 90, MAX: 130)

#### No MIN/MAX Representation
- **Rule**: If no MIN/MAX is available in API response, assume as maximum value
- **Example**: Single penalty value of 200 should be treated as MAX: 200

## Recent Issues (Resolved)

### Service Configuration Error (RESOLVED)
- **Status**: ✅ FIXED - No longer occurring
- **Resolution**: Modified all wrapper functions in search.py, booking.py, and pricing.py to use single service instances instead of `async with Service(...)` pattern
- **Changes Made**:
  - Updated `search_flights_sync()` and `process_air_shopping()` in search.py
  - Updated `create_booking()`, `process_order_create()`, and `get_booking_details()` in booking.py
  - Updated `get_flight_price()` and `process_flight_price()` in pricing.py
- **Result**: Eliminated multiple FlightService instances and duplicate authentication requests

## Project Structure Notes

- **Authentication**: Centralized in `Backend/utils/auth.py` with TokenManager singleton
- **Flight Services**: Modular structure in `Backend/services/flight/` with core.py, search.py, pricing.py, booking.py
- **API Routes**: Located in `Backend/routes/verteil_flights.py`
- **Configuration**: Environment-based config in `Backend/config.py`