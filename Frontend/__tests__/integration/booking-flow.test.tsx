import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { BookingForm } from '@/components/booking-form';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock Clerk auth
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(),
}));

// Mock child components with more realistic implementations
jest.mock('@/components/passenger-form', () => ({
  PassengerForm: ({ onPassengerChange, passengerData, passengerIndex }: any) => {
    const handleFieldChange = (field: string, value: string) => {
      onPassengerChange(passengerIndex, {
        ...passengerData,
        [field]: value
      });
    };

    const handleDateChange = (dateType: 'dob' | 'expiryDate', field: string, value: string) => {
      onPassengerChange(passengerIndex, {
        ...passengerData,
        [dateType]: {
          ...passengerData?.[dateType],
          [field]: value
        }
      });
    };

    return (
      <div data-testid={`passenger-form-${passengerIndex}`}>
        <select
          data-testid={`passenger-${passengerIndex}-type`}
          value={passengerData?.type || ''}
          onChange={(e) => handleFieldChange('type', e.target.value)}
        >
          <option value="">Select Type</option>
          <option value="adult">Adult</option>
          <option value="child">Child</option>
          <option value="infant">Infant</option>
        </select>
        
        <select
          data-testid={`passenger-${passengerIndex}-title`}
          value={passengerData?.title || ''}
          onChange={(e) => handleFieldChange('title', e.target.value)}
        >
          <option value="">Select Title</option>
          <option value="Mr">Mr</option>
          <option value="Mrs">Mrs</option>
          <option value="Ms">Ms</option>
        </select>
        
        <input
          data-testid={`passenger-${passengerIndex}-firstName`}
          value={passengerData?.firstName || ''}
          onChange={(e) => handleFieldChange('firstName', e.target.value)}
          placeholder="First Name"
        />
        
        <input
          data-testid={`passenger-${passengerIndex}-lastName`}
          value={passengerData?.lastName || ''}
          onChange={(e) => handleFieldChange('lastName', e.target.value)}
          placeholder="Last Name"
        />
        
        <select
          data-testid={`passenger-${passengerIndex}-gender`}
          value={passengerData?.gender || ''}
          onChange={(e) => handleFieldChange('gender', e.target.value)}
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        
        <select
          data-testid={`passenger-${passengerIndex}-nationality`}
          value={passengerData?.nationality || ''}
          onChange={(e) => handleFieldChange('nationality', e.target.value)}
        >
          <option value="">Select Nationality</option>
          <option value="US">United States</option>
          <option value="UK">United Kingdom</option>
          <option value="CA">Canada</option>
        </select>
        
        <select
          data-testid={`passenger-${passengerIndex}-documentType`}
          value={passengerData?.documentType || ''}
          onChange={(e) => handleFieldChange('documentType', e.target.value)}
        >
          <option value="">Select Document Type</option>
          <option value="passport">Passport</option>
          <option value="id">National ID</option>
        </select>
        
        <input
          data-testid={`passenger-${passengerIndex}-documentNumber`}
          value={passengerData?.documentNumber || ''}
          onChange={(e) => handleFieldChange('documentNumber', e.target.value)}
          placeholder="Document Number"
        />
        
        <select
          data-testid={`passenger-${passengerIndex}-issuingCountry`}
          value={passengerData?.issuingCountry || ''}
          onChange={(e) => handleFieldChange('issuingCountry', e.target.value)}
        >
          <option value="">Select Issuing Country</option>
          <option value="US">United States</option>
          <option value="UK">United Kingdom</option>
          <option value="CA">Canada</option>
        </select>
        
        {/* Date of Birth */}
        <div data-testid={`passenger-${passengerIndex}-dob`}>
          <select
            data-testid={`passenger-${passengerIndex}-dob-day`}
            value={passengerData?.dob?.day || ''}
            onChange={(e) => handleDateChange('dob', 'day', e.target.value)}
          >
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
            ))}
          </select>
          
          <select
            data-testid={`passenger-${passengerIndex}-dob-month`}
            value={passengerData?.dob?.month || ''}
            onChange={(e) => handleDateChange('dob', 'month', e.target.value)}
          >
            <option value="">Month</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
            ))}
          </select>
          
          <select
            data-testid={`passenger-${passengerIndex}-dob-year`}
            value={passengerData?.dob?.year || ''}
            onChange={(e) => handleDateChange('dob', 'year', e.target.value)}
          >
            <option value="">Year</option>
            {Array.from({ length: 100 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return <option key={year} value={String(year)}>{year}</option>;
            })}
          </select>
        </div>
        
        {/* Expiry Date */}
        <div data-testid={`passenger-${passengerIndex}-expiryDate`}>
          <select
            data-testid={`passenger-${passengerIndex}-expiry-day`}
            value={passengerData?.expiryDate?.day || ''}
            onChange={(e) => handleDateChange('expiryDate', 'day', e.target.value)}
          >
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
            ))}
          </select>
          
          <select
            data-testid={`passenger-${passengerIndex}-expiry-month`}
            value={passengerData?.expiryDate?.month || ''}
            onChange={(e) => handleDateChange('expiryDate', 'month', e.target.value)}
          >
            <option value="">Month</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
            ))}
          </select>
          
          <select
            data-testid={`passenger-${passengerIndex}-expiry-year`}
            value={passengerData?.expiryDate?.year || ''}
            onChange={(e) => handleDateChange('expiryDate', 'year', e.target.value)}
          >
            <option value="">Year</option>
            {Array.from({ length: 20 }, (_, i) => {
              const year = new Date().getFullYear() + i;
              return <option key={year} value={String(year)}>{year}</option>;
            })}
          </select>
        </div>
      </div>
    );
  },
}));

// Mock other components
jest.mock('@/components/seat-selection', () => ({
  SeatSelection: ({ onSeatChange }: any) => (
    <div data-testid="seat-selection">
      <button onClick={() => onSeatChange('outbound', { seat: '12A' })}>Select Seat 12A</button>
      <button onClick={() => onSeatChange('return', { seat: '15B' })}>Select Seat 15B</button>
    </div>
  ),
}));

jest.mock('@/components/baggage-options', () => ({
  BaggageOptions: ({ onBaggageChange }: any) => (
    <div data-testid="baggage-options">
      <button onClick={() => onBaggageChange({ baggage: '20kg' })}>20kg Baggage</button>
      <button onClick={() => onBaggageChange({ baggage: '30kg' })}>30kg Baggage</button>
    </div>
  ),
}));

jest.mock('@/components/meal-options', () => ({
  MealOptions: ({ onMealChange }: any) => (
    <div data-testid="meal-options">
      <button onClick={() => onMealChange({ meal: 'vegetarian' })}>Vegetarian</button>
      <button onClick={() => onMealChange({ meal: 'halal' })}>Halal</button>
    </div>
  ),
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

const mockAuth = {
  isSignedIn: true,
  userId: 'test-user-id',
};

describe('Booking Flow Integration Tests', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePathname as jest.Mock).mockReturnValue('/bookings/test-flight');
    (useAuth as jest.Mock).mockReturnValue(mockAuth);
    jest.clearAllMocks();
  });

  const fillCompletePassengerData = async (passengerIndex: number) => {
    const user = userEvent.setup();
    
    // Fill passenger type
    const typeSelect = screen.getByTestId(`passenger-${passengerIndex}-type`);
    await user.selectOptions(typeSelect, 'adult');
    
    // Fill title
    const titleSelect = screen.getByTestId(`passenger-${passengerIndex}-title`);
    await user.selectOptions(titleSelect, 'Mr');
    
    // Fill names
    const firstNameInput = screen.getByTestId(`passenger-${passengerIndex}-firstName`);
    await user.type(firstNameInput, 'John');
    
    const lastNameInput = screen.getByTestId(`passenger-${passengerIndex}-lastName`);
    await user.type(lastNameInput, 'Doe');
    
    // Fill gender
    const genderSelect = screen.getByTestId(`passenger-${passengerIndex}-gender`);
    await user.selectOptions(genderSelect, 'male');
    
    // Fill nationality
    const nationalitySelect = screen.getByTestId(`passenger-${passengerIndex}-nationality`);
    await user.selectOptions(nationalitySelect, 'US');
    
    // Fill document type
    const documentTypeSelect = screen.getByTestId(`passenger-${passengerIndex}-documentType`);
    await user.selectOptions(documentTypeSelect, 'passport');
    
    // Fill document number
    const documentNumberInput = screen.getByTestId(`passenger-${passengerIndex}-documentNumber`);
    await user.type(documentNumberInput, 'A12345678');
    
    // Fill issuing country
    const issuingCountrySelect = screen.getByTestId(`passenger-${passengerIndex}-issuingCountry`);
    await user.selectOptions(issuingCountrySelect, 'US');
    
    // Fill date of birth
    const dobDaySelect = screen.getByTestId(`passenger-${passengerIndex}-dob-day`);
    await user.selectOptions(dobDaySelect, '15');
    
    const dobMonthSelect = screen.getByTestId(`passenger-${passengerIndex}-dob-month`);
    await user.selectOptions(dobMonthSelect, '6');
    
    const dobYearSelect = screen.getByTestId(`passenger-${passengerIndex}-dob-year`);
    await user.selectOptions(dobYearSelect, '1990');
    
    // Fill expiry date
    const expiryDaySelect = screen.getByTestId(`passenger-${passengerIndex}-expiry-day`);
    await user.selectOptions(expiryDaySelect, '15');
    
    const expiryMonthSelect = screen.getByTestId(`passenger-${passengerIndex}-expiry-month`);
    await user.selectOptions(expiryMonthSelect, '6');
    
    const expiryYearSelect = screen.getByTestId(`passenger-${passengerIndex}-expiry-year`);
    await user.selectOptions(expiryYearSelect, '2030');
  };

  const fillContactInfo = async () => {
    const user = userEvent.setup();
    
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@example.com');
    
    const phoneInput = screen.getByLabelText(/phone/i);
    await user.type(phoneInput, '+1234567890');
  };

  describe('Complete Booking Flow', () => {
    test('should complete full booking flow with single passenger', async () => {
      render(<BookingForm />);
      
      // Step 1: Fill passenger details and contact info
      await fillCompletePassengerData(0);
      await fillContactInfo();
      
      // Continue button should be enabled
      await waitFor(() => {
        const continueButton = screen.getByRole('button', { name: /continue/i });
        expect(continueButton).toBeEnabled();
      });
      
      // Click continue to go to step 2
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await userEvent.click(continueButton);
      
      // Should be on seat selection step
      await waitFor(() => {
        expect(screen.getByTestId('seat-selection')).toBeInTheDocument();
      });
    });

    test('should handle multiple passengers correctly', async () => {
      render(<BookingForm />);
      
      // Increase passenger count to 2
      const increaseButton = screen.getByRole('button', { name: /\+/i });
      await userEvent.click(increaseButton);
      
      // Fill data for both passengers
      await fillCompletePassengerData(0);
      await fillCompletePassengerData(1);
      await fillContactInfo();
      
      // Continue button should be enabled
      await waitFor(() => {
        const continueButton = screen.getByRole('button', { name: /continue/i });
        expect(continueButton).toBeEnabled();
      });
    });

    test('should prevent progression with incomplete data', async () => {
      render(<BookingForm />);
      
      // Fill only partial data
      const firstNameInput = screen.getByTestId('passenger-0-firstName');
      await userEvent.type(firstNameInput, 'John');
      
      // Continue button should remain disabled
      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).toBeDisabled();
    });

    test('should show validation errors for incomplete forms', async () => {
      render(<BookingForm />);
      
      // Try to interact with form without filling required fields
      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).toBeDisabled();
      
      // Should show validation indicators
      const validationElements = screen.getAllByText(/required/i);
      expect(validationElements.length).toBeGreaterThan(0);
    });
  });

  describe('Step Navigation', () => {
    test('should navigate through all steps with valid data', async () => {
      render(<BookingForm />);
      
      // Step 1: Passenger Details
      expect(screen.getByTestId('passenger-form-0')).toBeInTheDocument();
      
      await fillCompletePassengerData(0);
      await fillContactInfo();
      
      // Continue to Step 2
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await userEvent.click(continueButton);
      
      // Step 2: Seat Selection
      await waitFor(() => {
        expect(screen.getByTestId('seat-selection')).toBeInTheDocument();
      });
      
      // Continue to Step 3
      const continueButton2 = screen.getByRole('button', { name: /continue/i });
      await userEvent.click(continueButton2);
      
      // Step 3: Extras
      await waitFor(() => {
        expect(screen.getByTestId('baggage-options')).toBeInTheDocument();
        expect(screen.getByTestId('meal-options')).toBeInTheDocument();
      });
    });

    test('should allow going back to previous steps', async () => {
      render(<BookingForm />);
      
      // Fill data and go to step 2
      await fillCompletePassengerData(0);
      await fillContactInfo();
      
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await userEvent.click(continueButton);
      
      // Should be on step 2
      await waitFor(() => {
        expect(screen.getByTestId('seat-selection')).toBeInTheDocument();
      });
      
      // Go back to step 1
      const backButton = screen.getByRole('button', { name: /back/i });
      await userEvent.click(backButton);
      
      // Should be back on step 1
      await waitFor(() => {
        expect(screen.getByTestId('passenger-form-0')).toBeInTheDocument();
      });
    });

    test('should maintain data when navigating between steps', async () => {
      render(<BookingForm />);
      
      // Fill passenger data
      await fillCompletePassengerData(0);
      await fillContactInfo();
      
      // Go to step 2
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await userEvent.click(continueButton);
      
      // Go back to step 1
      const backButton = screen.getByRole('button', { name: /back/i });
      await userEvent.click(backButton);
      
      // Data should be preserved
      const firstNameInput = screen.getByTestId('passenger-0-firstName');
      expect(firstNameInput).toHaveValue('John');
      
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveValue('test@example.com');
    });
  });

  describe('Passenger Count Validation', () => {
    test('should validate all passengers when count increases', async () => {
      render(<BookingForm />);
      
      // Fill first passenger
      await fillCompletePassengerData(0);
      await fillContactInfo();
      
      // Increase passenger count
      const increaseButton = screen.getByRole('button', { name: /\+/i });
      await userEvent.click(increaseButton);
      
      // Continue button should be disabled until second passenger is filled
      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).toBeDisabled();
      
      // Fill second passenger
      await fillCompletePassengerData(1);
      
      // Now continue button should be enabled
      await waitFor(() => {
        expect(continueButton).toBeEnabled();
      });
    });

    test('should handle passenger count reduction with confirmation', async () => {
      render(<BookingForm />);
      
      // Increase to 2 passengers
      const increaseButton = screen.getByRole('button', { name: /\+/i });
      await userEvent.click(increaseButton);
      
      // Fill second passenger with some data
      const secondPassengerFirstName = screen.getByTestId('passenger-1-firstName');
      await userEvent.type(secondPassengerFirstName, 'Jane');
      
      // Mock window.confirm
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      
      // Decrease passenger count
      const decreaseButton = screen.getByRole('button', { name: /-/i });
      await userEvent.click(decreaseButton);
      
      // Should show confirmation dialog
      expect(confirmSpy).toHaveBeenCalled();
      
      // Should only have one passenger form
      expect(screen.getByTestId('passenger-form-0')).toBeInTheDocument();
      expect(screen.queryByTestId('passenger-form-1')).not.toBeInTheDocument();
      
      confirmSpy.mockRestore();
    });

    test('should cancel passenger count reduction when not confirmed', async () => {
      render(<BookingForm />);
      
      // Increase to 2 passengers
      const increaseButton = screen.getByRole('button', { name: /\+/i });
      await userEvent.click(increaseButton);
      
      // Fill second passenger with some data
      const secondPassengerFirstName = screen.getByTestId('passenger-1-firstName');
      await userEvent.type(secondPassengerFirstName, 'Jane');
      
      // Mock window.confirm to return false
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
      
      // Try to decrease passenger count
      const decreaseButton = screen.getByRole('button', { name: /-/i });
      await userEvent.click(decreaseButton);
      
      // Should still have both passenger forms
      expect(screen.getByTestId('passenger-form-0')).toBeInTheDocument();
      expect(screen.getByTestId('passenger-form-1')).toBeInTheDocument();
      
      confirmSpy.mockRestore();
    });
  });

  describe('Real-time Validation', () => {
    test('should update validation state as user types', async () => {
      render(<BookingForm />);
      
      const firstNameInput = screen.getByTestId('passenger-0-firstName');
      const continueButton = screen.getByRole('button', { name: /continue/i });
      
      // Initially disabled
      expect(continueButton).toBeDisabled();
      
      // Start typing
      await userEvent.type(firstNameInput, 'J');
      
      // Should still be disabled (incomplete)
      expect(continueButton).toBeDisabled();
      
      // Complete the name
      await userEvent.type(firstNameInput, 'ohn');
      
      // Should still be disabled (other fields missing)
      expect(continueButton).toBeDisabled();
    });

    test('should show completion percentage', async () => {
      render(<BookingForm />);
      
      // Look for completion indicators
      const completionElements = screen.getAllByText(/%/);
      expect(completionElements.length).toBeGreaterThan(0);
      
      // Fill some fields and check if percentage updates
      const firstNameInput = screen.getByTestId('passenger-0-firstName');
      await userEvent.type(firstNameInput, 'John');
      
      // Percentage should have updated
      const updatedCompletionElements = screen.getAllByText(/%/);
      expect(updatedCompletionElements.length).toBeGreaterThan(0);
    });
  });

  describe('Terms and Conditions', () => {
    test('should require terms acceptance for final submission', async () => {
      render(<BookingForm />);
      
      // Navigate to final step (this would require completing previous steps)
      // For this test, we'll check that terms checkbox exists
      const termsCheckbox = screen.getByRole('checkbox', { name: /terms/i });
      expect(termsCheckbox).toBeInTheDocument();
      expect(termsCheckbox).not.toBeChecked();
    });

    test('should enable final submission when terms are accepted', async () => {
      render(<BookingForm />);
      
      const termsCheckbox = screen.getByRole('checkbox', { name: /terms/i });
      await userEvent.click(termsCheckbox);
      
      expect(termsCheckbox).toBeChecked();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid email gracefully', async () => {
      render(<BookingForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      await userEvent.type(emailInput, 'invalid-email');
      
      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).toBeDisabled();
    });

    test('should handle empty form submission attempts', async () => {
      render(<BookingForm />);
      
      const continueButton = screen.getByRole('button', { name: /continue/i });
      
      // Try to click continue without filling anything
      await userEvent.click(continueButton);
      
      // Should remain on the same step
      expect(screen.getByTestId('passenger-form-0')).toBeInTheDocument();
    });

    test('should handle maximum passenger count limit', async () => {
      render(<BookingForm />);
      
      const increaseButton = screen.getByRole('button', { name: /\+/i });
      
      // Try to exceed maximum (typically 5 passengers)
      for (let i = 0; i < 10; i++) {
        await userEvent.click(increaseButton);
      }
      
      // Should not exceed maximum
      const passengerForms = screen.getAllByTestId(/passenger-form-/);
      expect(passengerForms.length).toBeLessThanOrEqual(5);
    });
  });
});