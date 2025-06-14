# Passenger Transformation Refactor

## Background and Motivation

Currently, there are three layers of passenger data transformation happening in the booking flow:

1. **Frontend → Backend API** (in `verteil_flights.py` lines 466-579)
   - Transforms frontend passenger format to backend service format
   - Maps `type` → `PTC`, formats dates, handles contact info

2. **Backend Service** (in `booking.py` lines 270-310)
   - Transforms backend service format to `build_ordercreate_rq` expected format
   - Another layer of field mapping and restructuring

3. **NDC Request Builder** (in `build_ordercreate_rq.py`)
   - Transforms to final NDC API format for Verteil

This creates redundant transformation logic and violates separation of concerns. The endpoint should pass raw frontend data to the service layer and let the service handle all transformations.

## Branch Name
`refactor/passenger-transformation-cleanup`

## Key Challenges and Analysis

### Current Issues
- **Code Duplication**: Similar transformation logic exists in multiple layers
- **Separation of Concerns**: API layer is handling business logic transformations
- **Maintenance Burden**: Changes to passenger format require updates in multiple places
- **Testing Complexity**: Multiple transformation points make testing more complex

### Technical Analysis
- The endpoint in `verteil_flights.py` is doing transformation work that should be in the service layer
- The `process_order_create` function already expects to receive passenger data and transform it
- The `build_ordercreate_rq.py` script is the only place that should handle final NDC transformation

## High-level Task Breakdown

### Task 1: Create Feature Branch
- **Objective**: Set up development branch for refactoring work
- **Actions**: 
  - Create branch `refactor/passenger-transformation-cleanup` from main
  - Ensure clean working directory
- **Success Criteria**: 
  - Branch created and checked out
  - No uncommitted changes
- **Estimated Time**: 5 minutes

### Task 2: Update Service Layer to Handle Frontend Format
- **Objective**: Modify the booking service to accept frontend passenger format directly
- **Actions**:
  - Update `_build_booking_payload` method in `booking.py` to handle frontend format
  - Map frontend fields (`firstName`, `lastName`, `dob`, `expiryDate`, etc.) to service format
  - Handle contact information embedding in first passenger
  - Update field mappings and validation logic
- **Success Criteria**:
  - Service can process frontend passenger format
  - All existing transformations work correctly
  - Contact info properly embedded in first passenger
- **Estimated Time**: 45 minutes

### Task 3: Simplify API Endpoint
- **Objective**: Remove transformation logic from `verteil_flights.py` endpoint
- **Actions**:
  - Remove passenger transformation code (lines 466-540)
  - Pass raw frontend data directly to service
  - Update order_data structure to use frontend format
  - Maintain error handling and logging
- **Success Criteria**:
  - Endpoint passes raw frontend data to service
  - No transformation logic in API layer
  - Error handling preserved
- **Estimated Time**: 30 minutes

### Task 4: Write Tests
- **Objective**: Ensure refactored code works correctly
- **Actions**:
  - Create test for service layer with frontend format
  - Test passenger transformation in service
  - Test contact info embedding
  - Test error scenarios
- **Success Criteria**:
  - All tests pass
  - Coverage maintained or improved
  - Edge cases handled
- **Estimated Time**: 60 minutes

### Task 5: Integration Testing
- **Objective**: Verify end-to-end booking flow works
- **Actions**:
  - Test complete booking flow from frontend to NDC API
  - Verify passenger data transformations
  - Test with different passenger types (adult, child, infant)
  - Test contact information handling
- **Success Criteria**:
  - End-to-end booking works
  - All passenger types handled correctly
  - Contact info properly processed
- **Estimated Time**: 45 minutes

## Project Status Board

### To Do
- None

### In Progress
- None

### Done
- [x] Task 1: Create Feature Branch
- [x] Task 2: Update Service Layer to Handle Frontend Format
- [x] Task 3: Simplify API Endpoint
- [x] Task 4: Write Tests
- [x] Task 5: Integration Testing

## Current Status / Progress Tracking

**Status**: ✅ COMPLETED - All tasks finished successfully
**Last Updated**: 2025-01-07
**Next Action**: Implementation complete, ready for production use

## Executor's Feedback or Assistance Requests

*This section will be updated by the Executor during implementation*

## Lessons Learned

*This section will be updated as implementation progresses*

## Acceptance Criteria

- [x] Passenger transformation logic removed from API endpoint
- [x] Service layer handles frontend format directly
- [x] Only one transformation layer (service → NDC format)
- [x] All tests pass
- [x] End-to-end booking flow works
- [x] Code is cleaner and more maintainable
- [x] No regression in functionality