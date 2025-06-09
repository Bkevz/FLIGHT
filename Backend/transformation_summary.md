# Data Transformation Results Summary

This document shows the results of running the data transformation on the airshoping response with both default and enhanced (round trip) modes.

## Transformation Results Overview

### Default Transformation (enableRoundtrip=false)
- **Total Offers**: 95 offers
- **File**: `transformation_result_default.json`
- **Behavior**: Standard transformation that keeps round trip flights as single combined offers

### Enhanced Transformation (enableRoundtrip=true)
- **Total Offers**: 190 offers (exactly double)
- **File**: `transformation_result_enhanced.json`
- **Behavior**: Splits round trip flights into separate outbound and return offers

## Key Differences in Enhanced Mode

### New Fields Added
Each offer in the enhanced transformation includes:
- `"tripType": "round-trip"` - Indicates this is part of a round trip
- `"direction": "outbound"` or `"direction": "return"` - Specifies the direction

### Time Field Addition
- Both transformations now include a separate `"time"` field in departure and arrival objects
- Example: `"time": "23:50"` extracted from `"datetime": "2025-06-09T23:50:00.000"`
- This provides easy access to time information without parsing the full datetime string

### ID Structure Changes
- **Default**: `"id": "KQ-KQ-SEG3-KQ-SEG16-16409"`
- **Enhanced Outbound**: `"id": "KQ-SEG0-16409-outbound"`
- **Enhanced Return**: `"id": "KQ-SEG0-16409-return"`

### Flight Segments
- **Default**: Contains both outbound and return segments in a single offer
- **Enhanced**: Each offer contains only the segments for its specific direction

### Duration and Route Information
- **Default**: Shows total round trip duration (e.g., "20h 30m")
- **Enhanced**: Shows individual leg duration (e.g., "7h 40m" for outbound)

## Sample Offer Structure (Enhanced Mode)

### Outbound Offer Example
```json
{
  "id": "KQ-SEG0-16409-outbound",
  "airline": {
    "code": "KQ",
    "name": "Kenya Airways",
    "logo": "/airlines/kq.png",
    "flightNumber": "KQ112"
  },
  "departure": {
    "airport": "NBO",
    "datetime": "2025-06-09T23:50:00.000",
    "terminal": "1A",
    "airportName": "NBO"
  },
  "arrival": {
    "airport": "CDG",
    "datetime": "2025-06-10T07:30:00.000",
    "terminal": "2E",
    "airportName": "CDG"
  },
  "duration": "7h 40m",
  "stops": 0,
  "stopDetails": [],
  "price": 16409,
  "currency": "INR",
  "tripType": "round-trip",
  "direction": "outbound"
}
```

### Return Offer Example
```json
{
  "id": "KQ-SEG0-16409-return",
  "airline": {
    "code": "KQ",
    "name": "Kenya Airways",
    "logo": "/airlines/kq.png",
    "flightNumber": "KQ113"
  },
  "departure": {
    "airport": "CDG",
    "datetime": "2025-06-11T11:45:00.000",
    "terminal": "2E",
    "airportName": "CDG"
  },
  "arrival": {
    "airport": "NBO",
    "datetime": "2025-06-12T20:20:00.000",
    "terminal": "1A",
    "airportName": "NBO"
  },
  "duration": "8h 35m",
  "stops": 0,
  "stopDetails": [],
  "price": 16409,
  "currency": "INR",
  "tripType": "round-trip",
  "direction": "return"
}
```

## Which Transformation Does the Frontend Expect?

### Current Recommendation: **Default Mode**

Based on the API design and frontend requirements:

1. **API Parameter**: The `enableRoundtrip` parameter is **optional** and defaults to `false`
2. **Frontend Intelligence**: The frontend should intelligently determine trip type from segments
3. **Backward Compatibility**: Default mode ensures existing frontend code continues to work
4. **Automatic Detection**: Frontend can analyze segments to detect round trips without backend splitting

### When to Use Enhanced Mode:
- **Future Enhancement**: When frontend is specifically designed to handle separate outbound/return offers
- **Advanced Filtering**: When users need to filter or modify individual legs
- **Detailed Display**: When UI shows separate cards for outbound and return flights

### Current Implementation:
- **Default Behavior**: API returns combined round trip offers (95 offers)
- **Enhanced Option**: Available via `enableRoundtrip=true` parameter (190 offers)
- **Frontend Choice**: Frontend can request either format based on UI requirements

## Frontend Benefits

### Enhanced Mode Benefits:
- **Better UX**: Separate display of outbound and return flights
- **Easier Filtering**: Filter by direction (outbound/return)
- **Clearer Pricing**: Individual pricing for each leg
- **Improved Search**: Search within specific directions
- **Better Mobile Display**: Separate cards for each direction

### Default Mode Benefits:
- **Backward Compatibility**: Works with existing frontend code
- **Simpler Integration**: Single offer per round trip
- **Reduced Complexity**: Fewer offers to process
- **Intelligent Frontend**: Frontend can analyze segments to determine trip characteristics

### API Integration
- **Backward Compatible**: Default behavior unchanged when `enableRoundtrip=false`
- **Optional Enhancement**: Frontend can choose to enable round trip splitting
- **Consistent Structure**: All existing fields maintained, new fields added

## File Locations
- **Default Result**: `Backend/transformation_result_default.json` (16,277 lines)
- **Enhanced Result**: `Backend/transformation_result_enhanced.json` (25,219 lines)
- **Demo Script**: `Backend/run_transformation_demo.py`

## Usage in API
To get the enhanced transformation, include `enableRoundtrip=true` in your API request:

```bash
# GET request
curl "http://localhost:5000/api/air-shopping?enableRoundtrip=true&..."

# POST request
curl -X POST "http://localhost:5000/api/air-shopping" \
  -H "Content-Type: application/json" \
  -d '{"enableRoundtrip": true, ...}'
```