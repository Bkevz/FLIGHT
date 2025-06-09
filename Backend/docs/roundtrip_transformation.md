# Round Trip Transformation Feature

## Overview

The round trip transformation feature allows the flight booking system to split round trip flights into separate outbound and return offers. This provides better flexibility for users who want to view and potentially book different legs of their journey separately.

## How It Works

### Default Behavior (enableRoundtrip=false)
- Round trip flights are returned as single offers containing multiple segments
- Each offer represents the complete round trip journey
- Users see the total price for the entire round trip

### Enhanced Behavior (enableRoundtrip=true)
- Round trip flights are split into separate outbound and return offers
- Each offer represents one direction of the journey
- Users can see individual pricing and details for each leg
- Offers are marked with `direction: 'outbound'` or `direction: 'return'`
- Trip type is set to `tripType: 'round-trip'` for both legs

## API Usage

### GET Request
```
GET /api/verteil/air-shopping?origin=NBO&destination=CDG&departDate=2024-12-15&returnDate=2024-12-22&adults=1&tripType=round-trip&enableRoundtrip=true
```

### POST Request
```json
{
  "tripType": "ROUND_TRIP",
  "odSegments": [
    {
      "origin": "NBO",
      "destination": "CDG",
      "departureDate": "2024-12-15"
    },
    {
      "origin": "CDG",
      "destination": "NBO",
      "departureDate": "2024-12-22"
    }
  ],
  "numAdults": 1,
  "cabinPreference": "ECONOMY",
  "enableRoundtrip": true
}
```

## Response Format

### Standard Response (enableRoundtrip=false)
```json
{
  "status": "success",
  "data": {
    "offers": [
      {
        "id": "offer-1",
        "departure": {"airport": "NBO"},
        "arrival": {"airport": "NBO"},
        "segments": [
          {"departure": {"airport": "NBO"}, "arrival": {"airport": "CDG"}},
          {"departure": {"airport": "CDG"}, "arrival": {"airport": "NBO"}}
        ],
        "tripType": "round-trip",
        "price": {"total": 1200}
      }
    ]
  }
}
```

### Enhanced Response (enableRoundtrip=true)
```json
{
  "status": "success",
  "data": {
    "offers": [
      {
        "id": "offer-1-outbound",
        "departure": {"airport": "NBO"},
        "arrival": {"airport": "CDG"},
        "segments": [
          {"departure": {"airport": "NBO"}, "arrival": {"airport": "CDG"}}
        ],
        "tripType": "round-trip",
        "direction": "outbound",
        "price": {"total": 600}
      },
      {
        "id": "offer-1-return",
        "departure": {"airport": "CDG"},
        "arrival": {"airport": "NBO"},
        "segments": [
          {"departure": {"airport": "CDG"}, "arrival": {"airport": "NBO"}}
        ],
        "tripType": "round-trip",
        "direction": "return",
        "price": {"total": 600}
      }
    ]
  }
}
```

## Implementation Details

### Backend Components

1. **Data Transformer** (`utils/data_transformer.py`)
   - Enhanced with `enable_roundtrip` parameter
   - Delegates to round trip transformer when enabled

2. **Round Trip Transformer** (`utils/data_transformer_roundtrip.py`)
   - Detects round trip segments based on origin/destination patterns
   - Splits offers into separate outbound and return journeys
   - Maintains original offer structure with enhanced metadata

3. **API Endpoint** (`routes/verteil_flights.py`)
   - Accepts `enableRoundtrip` parameter in both GET and POST requests
   - Passes parameter to search service

4. **Search Service** (`services/flight/search.py`)
   - Extracts `enableRoundtrip` from search criteria
   - Passes to data transformer

### Key Functions

- `transform_verteil_to_frontend(response, enable_roundtrip=False)`
- `transform_verteil_to_frontend_with_roundtrip(response)`
- `detect_roundtrip_segments(segments)`
- `create_flight_offer_from_segments(segments, direction, original_offer)`

## Testing

### Unit Tests
- `test_roundtrip_transformation.py` - Core transformation logic
- `test_simple_roundtrip.py` - Simple comparison test
- `test_roundtrip_integration.py` - Integration with main transformer

### API Tests
- `test_api_roundtrip.py` - API parameter validation

### Manual Testing
```bash
# Test with round trip disabled (default)
curl "http://localhost:5000/api/verteil/air-shopping?origin=NBO&destination=CDG&departDate=2024-12-15&returnDate=2024-12-22&adults=1&tripType=round-trip"

# Test with round trip enabled
curl "http://localhost:5000/api/verteil/air-shopping?origin=NBO&destination=CDG&departDate=2024-12-15&returnDate=2024-12-22&adults=1&tripType=round-trip&enableRoundtrip=true"
```

## Benefits

1. **Flexibility**: Users can view individual legs of round trip journeys
2. **Transparency**: Clear pricing breakdown for each direction
3. **Backward Compatibility**: Default behavior remains unchanged
4. **Scalability**: Easy to extend for multi-city trips

## Future Enhancements

1. **Multi-city Support**: Extend to handle complex itineraries
2. **Mixed Cabin Classes**: Support different cabin classes per leg
3. **Flexible Dates**: Allow date changes for individual legs
4. **Separate Booking**: Enable booking of individual legs

## Configuration

The feature is controlled by the `enableRoundtrip` parameter:
- **Default**: `false` (maintains existing behavior)
- **Enabled**: `true` (activates round trip splitting)

No additional configuration or environment variables are required.