# Passenger Input and PTC Analysis

## Current Frontend Passenger Tracking System

### 1. Passenger Count Management
The frontend uses a sophisticated passenger tracking system in `booking-form.tsx`:

- **Passenger Count Selection**: Users can select 1-5 passengers via a dropdown
- **Dynamic Tab Generation**: The system creates tabs dynamically based on passenger count
- **State Management**: Each passenger's data is stored in a `passengers` array with proper indexing

```typescript
const [passengerCount, setPassengerCount] = useState(1)
const [passengers, setPassengers] = useState<any[]>([])

// Dynamic tab creation
{Array.from({ length: passengerCount }).map((_, index) => (
  <TabsTrigger key={index} value={`passenger-${index + 1}`}>
    Passenger {index + 1}
  </TabsTrigger>
))}
```

### 2. Passenger Type Selection and PTC Identification

#### Frontend Passenger Types
Each passenger form includes radio buttons for type selection:
- **Adult (12+ years)** → Maps to PTC: `ADT`
- **Child (2-11 years)** → Maps to PTC: `CHD`
- **Infant (0-2 years)** → Maps to PTC: `INF`

#### Backend PTC Mapping
The backend service (`booking.py`) handles the transformation:

```python
ptc_mapping = {
    'adult': 'ADT',
    'child': 'CHD', 
    'infant': 'INF'
}
ptc = ptc_mapping.get(pax_type, 'ADT')
```

### 3. User Experience Flow

1. **Step 1**: User selects number of passengers (1-5)
2. **Step 2**: System generates individual tabs for each passenger
3. **Step 3**: User fills out each passenger's details including:
   - **Passenger Type** (Adult/Child/Infant) - Critical for PTC
   - **Title** (Mr./Mrs./Ms./Miss/Dr./Prof.) - **NEWLY ADDED**
   - **Given Name & Surname** - **LABELS CLARIFIED**
   - **Date of Birth**
   - **Gender**
   - **Travel Document Type** (Passport/ID Card) - **NOW PROPERLY TRACKED**
   - **Document Details**
   - **Nationality**

## Improvements Made

### 1. Added Missing Title Field
**Problem**: Backend expected title/salutation but frontend didn't collect it
**Solution**: Added title dropdown with options: Mr., Mrs., Ms., Miss, Dr., Prof.

### 2. Enhanced Payment Method Selection
**Problem**: No way to select between Cash and Card payment
**Solution**: Added payment method type selection with:
- **Card Payment**: Credit/Debit card processing
- **Cash Payment**: Pay at airport/office with detailed instructions

### 3. Improved Field Labels
**Problem**: Generic "First Name" and "Last Name" labels
**Solution**: Changed to "Given Name (First Name)" and "Surname (Last Name)" for clarity

### 4. Fixed Document Type Tracking
**Problem**: Document type selection wasn't being tracked in state
**Solution**: Added proper state binding for document type selection

## Data Flow Analysis

### Frontend → Backend Transformation

1. **Passenger Data Collection**:
   ```typescript
   // Frontend structure
   {
     type: "adult",           // → ADT
     title: "mr",            // → Mr
     firstName: "John",      // → first_name
     lastName: "Doe",        // → last_name
     dob: { year: "1990", month: "5", day: "15" }, // → 1990-05-15
     gender: "male",         // → male
     documentType: "passport", // → Passport
     documentNumber: "A123456", // → number
     nationality: "us"       // → nationality
   }
   ```

2. **Backend Processing**:
   ```python
   # Backend transformation
   transformed_passenger = {
       'type': 'ADT',  # PTC code
       'title': 'Mr',
       'first_name': 'John',
       'last_name': 'Doe',
       'date_of_birth': '1990-05-15',
       'gender': 'male',
       'nationality': 'us'
   }
   ```

### Payment Method Integration

1. **Frontend Selection**:
   - Visual cards for Cash vs Card selection
   - Conditional form rendering based on selection
   - Different submit button text

2. **Backend Processing**:
   - Cash: `{"MethodType": "Cash", "Details": {"CashInd": True}}`
   - Card: `{"MethodType": "PaymentCard", "CardInfo": {...}}`

## Critical Success Factors

### 1. Passenger Type Accuracy
- **Clear Age Ranges**: Adult (12+), Child (2-11), Infant (0-2)
- **Visual Indicators**: Each passenger tab shows the type selected
- **Validation**: Frontend validates required fields per passenger type

### 2. PTC Mapping Reliability
- **Consistent Mapping**: Frontend types directly map to standard PTCs
- **Fallback Handling**: Defaults to 'ADT' if type is unclear
- **Backend Validation**: Ensures PTC codes are valid

### 3. Data Completeness
- **Required Fields**: All mandatory fields for booking success
- **Optional Fields**: Document details, titles for enhanced processing
### Contact Information Collection

#### Frontend Implementation
- **Contact Info Fields**: Email (required) and phone number collected in booking form
- **State Management**: Managed via `contactInfo` state in `BookingForm` component
- **Validation**: Email field is required for booking confirmation
- **User Experience**: Clear labels and placeholder text guide user input
- **Data Binding**: Real-time updates via `handleContactInfoChange` handler

#### Backend Processing
- **Validation**: Backend validates that email is provided (required field)
- **Storage**: Contact info attached to first passenger record and separate ContactInfo section
- **Integration**: Contact details included in booking payload for airline API
- **Usage**: Email used for booking confirmations, phone for urgent flight notifications

#### Data Flow
1. User enters email and phone in booking form
2. Frontend validates and stores in `contactInfo` state
3. Data passed to backend via booking API
4. Backend validates email presence (required)
5. Contact info attached to passenger data and booking payload
6. Used for confirmations and notifications

## Potential Issues and Mitigations

### 1. Age Validation
**Issue**: User selects "Child" but enters adult birth date
**Mitigation**: Add client-side validation to check age against passenger type

### 2. Document Requirements
**Issue**: Some destinations require specific document types
**Mitigation**: Add destination-based document validation

### 3. Payment Method Clarity
**Issue**: Users might not understand cash payment process
**Mitigation**: Added detailed instructions for cash payment option

## Recommendations

1. **Add Age Validation**: Implement birth date validation against passenger type
2. **Enhanced Error Handling**: Better error messages for PTC mismatches
3. **Progressive Disclosure**: Show relevant fields based on passenger type
4. **Real-time Validation**: Validate passenger data as user types
5. **Accessibility**: Ensure all form elements are properly labeled for screen readers

This analysis confirms that the frontend now properly tracks passenger count, types, and all necessary details for successful backend transformation and PTC identification.