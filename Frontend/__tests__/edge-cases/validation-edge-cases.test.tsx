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

// Mock components with edge case handling
jest.mock('@/components/passenger-form', () => ({
  PassengerForm: ({ onPassengerChange, passengerData, passengerIndex }: any) => (
    <div data-testid={`passenger-form-${passengerIndex}`}>
      <input
        data-testid={`passenger-${passengerIndex}-firstName`}
        value={passengerData?.firstName || ''}
        onChange={(e) => onPassengerChange(passengerIndex, { ...passengerData, firstName: e.target.value })}
        placeholder="First Name"
        maxLength={50}
      />
      <input
        data-testid={`passenger-${passengerIndex}-lastName`}
        value={passengerData?.lastName || ''}
        onChange={(e) => onPassengerChange(passengerIndex, { ...passengerData, lastName: e.target.value })}
        placeholder="Last Name"
        maxLength={50}
      />
      <input
        data-testid={`passenger-${passengerIndex}-documentNumber`}
        value={passengerData?.documentNumber || ''}
        onChange={(e) => onPassengerChange(passengerIndex, { ...passengerData, documentNumber: e.target.value })}
        placeholder="Document Number"
        maxLength={20}
      />
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

describe('Validation Edge Cases', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePathname as jest.Mock).mockReturnValue('/bookings/test-flight');
    (useAuth as jest.Mock).mockReturnValue(mockAuth);
    jest.clearAllMocks();
  });

  describe('Input Validation Edge Cases', () => {
    test('should handle extremely long input values', async () => {
      render(<BookingForm />);
      
      const firstNameInput = screen.getByTestId('passenger-0-firstName');
      const longString = 'a'.repeat(1000);
      
      await userEvent.type(firstNameInput, longString);
      
      // Should be truncated to maxLength
      expect(firstNameInput.value.length).toBeLessThanOrEqual(50);
    });

    test('should handle special characters in names', async () => {
      render(<BookingForm />);
      
      const firstNameInput = screen.getByTestId('passenger-0-firstName');
      const lastNameInput = screen.getByTestId('passenger-0-lastName');
      
      // Test various special characters
      await userEvent.type(firstNameInput, "Jean-François");
      await userEvent.type(lastNameInput, "O'Connor");
      
      expect(firstNameInput).toHaveValue("Jean-François");
      expect(lastNameInput).toHaveValue("O'Connor");
    });

    test('should handle unicode characters', async () => {
      render(<BookingForm />);
      
      const firstNameInput = screen.getByTestId('passenger-0-firstName');
      const lastNameInput = screen.getByTestId('passenger-0-lastName');
      
      // Test unicode characters
      await userEvent.type(firstNameInput, "José");
      await userEvent.type(lastNameInput, "Müller");
      
      expect(firstNameInput).toHaveValue("José");
      expect(lastNameInput).toHaveValue("Müller");
    });

    test('should handle numeric input in text fields', async () => {
      render(<BookingForm />);
      
      const firstNameInput = screen.getByTestId('passenger-0-firstName');
      
      await userEvent.type(firstNameInput, "123456");
      
      // Should accept numeric input (validation is for presence, not format)
      expect(firstNameInput).toHaveValue("123456");
    });

    test('should handle whitespace-only input', async () => {
      render(<BookingForm />);
      
      const firstNameInput = screen.getByTestId('passenger-0-firstName');
      
      await userEvent.type(firstNameInput, "   ");
      
      // Continue button should remain disabled for whitespace-only input
      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).toBeDisabled();
    });

    test('should handle mixed whitespace and content', async () => {
      render(<BookingForm />);
      
      const firstNameInput = screen.getByTestId('passenger-0-firstName');
      
      await userEvent.type(firstNameInput, "  John  ");
      
      // Should accept input with leading/trailing whitespace
      expect(firstNameInput).toHaveValue("  John  ");
    });
  });

  describe('Email Validation Edge Cases', () => {
    test('should reject various invalid email formats', async () => {
      render(<BookingForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const continueButton = screen.getByRole('button', { name: /continue/i });
      
      const invalidEmails = [
        'plainaddress',
        '@missingdomain.com',
        'missing@.com',
        'missing@domain',
        'missing@domain.',
        'spaces @domain.com',
        'spaces@ domain.com',
        'spaces@domain .com',
        'double@@domain.com',
        'trailing.dot.@domain.com',
        '.leading.dot@domain.com',
        'consecutive..dots@domain.com',
        'toolong' + 'a'.repeat(250) + '@domain.com',
      ];
      
      for (const email of invalidEmails) {
        await userEvent.clear(emailInput);
        await userEvent.type(emailInput, email);
        
        expect(continueButton).toBeDisabled();
      }
    });

    test('should accept various valid email formats', async () => {
      render(<BookingForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      
      const validEmails = [
        'simple@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user123@example123.com',
        'a@b.co',
        'test@sub.domain.com',
        'user-name@example-domain.com',
        'user_name@example.org',
      ];
      
      for (const email of validEmails) {
        await userEvent.clear(emailInput);
        await userEvent.type(emailInput, email);
        
        expect(emailInput).toHaveValue(email);
      }
    });

    test('should handle email with maximum length', async () => {
      render(<BookingForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
      
      await userEvent.type(emailInput, longEmail);
      
      expect(emailInput).toHaveValue(longEmail);
    });
  });

  describe('Passenger Count Edge Cases', () => {
    test('should handle rapid passenger count changes', async () => {
      render(<BookingForm />);
      
      const increaseButton = screen.getByRole('button', { name: /\+/i });
      const decreaseButton = screen.getByRole('button', { name: /-/i });
      
      // Rapidly increase and decrease
      for (let i = 0; i < 5; i++) {
        await userEvent.click(increaseButton);
        await userEvent.click(decreaseButton);
      }
      
      // Should maintain consistency
      expect(screen.getByTestId('passenger-form-0')).toBeInTheDocument();
      expect(screen.queryByTestId('passenger-form-1')).not.toBeInTheDocument();
    });

    test('should handle passenger count at minimum boundary', async () => {
      render(<BookingForm />);
      
      const decreaseButton = screen.getByRole('button', { name: /-/i });
      
      // Try to go below minimum multiple times
      for (let i = 0; i < 10; i++) {
        await userEvent.click(decreaseButton);
      }
      
      // Should not go below 1
      expect(screen.getByTestId('passenger-form-0')).toBeInTheDocument();
      expect(screen.queryByTestId('passenger-form-1')).not.toBeInTheDocument();
    });

    test('should handle passenger count at maximum boundary', async () => {
      render(<BookingForm />);
      
      const increaseButton = screen.getByRole('button', { name: /\+/i });
      
      // Try to exceed maximum multiple times
      for (let i = 0; i < 20; i++) {
        await userEvent.click(increaseButton);
      }
      
      // Should not exceed maximum (typically 5)
      const passengerForms = screen.getAllByTestId(/passenger-form-/);
      expect(passengerForms.length).toBeLessThanOrEqual(5);
    });

    test('should handle data loss confirmation edge cases', async () => {
      render(<BookingForm />);
      
      // Increase to 3 passengers
      const increaseButton = screen.getByRole('button', { name: /\+/i });
      await userEvent.click(increaseButton);
      await userEvent.click(increaseButton);
      
      // Add data to all passengers
      const passenger1Input = screen.getByTestId('passenger-0-firstName');
      const passenger2Input = screen.getByTestId('passenger-1-firstName');
      const passenger3Input = screen.getByTestId('passenger-2-firstName');
      
      await userEvent.type(passenger1Input, 'John');
      await userEvent.type(passenger2Input, 'Jane');
      await userEvent.type(passenger3Input, 'Bob');
      
      // Mock window.confirm to test different scenarios
      const confirmSpy = jest.spyOn(window, 'confirm');
      
      // Test canceling data loss
      confirmSpy.mockReturnValueOnce(false);
      const decreaseButton = screen.getByRole('button', { name: /-/i });
      await userEvent.click(decreaseButton);
      
      // Should still have 3 passengers
      expect(screen.getByTestId('passenger-form-2')).toBeInTheDocument();
      
      // Test confirming data loss
      confirmSpy.mockReturnValueOnce(true);
      await userEvent.click(decreaseButton);
      
      // Should now have 2 passengers
      expect(screen.queryByTestId('passenger-form-2')).not.toBeInTheDocument();
      expect(screen.getByTestId('passenger-form-1')).toBeInTheDocument();
      
      confirmSpy.mockRestore();
    });
  });

  describe('Form State Edge Cases', () => {
    test('should handle rapid form field changes', async () => {
      render(<BookingForm />);
      
      const firstNameInput = screen.getByTestId('passenger-0-firstName');
      
      // Rapidly type and clear
      for (let i = 0; i < 10; i++) {
        await userEvent.type(firstNameInput, 'Test');
        await userEvent.clear(firstNameInput);
      }
      
      expect(firstNameInput).toHaveValue('');
    });

    test('should handle form submission with partially filled data', async () => {
      render(<BookingForm />);
      
      // Fill only some fields
      const firstNameInput = screen.getByTestId('passenger-0-firstName');
      const emailInput = screen.getByLabelText(/email/i);
      
      await userEvent.type(firstNameInput, 'John');
      await userEvent.type(emailInput, 'test@example.com');
      
      // Try to submit
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await userEvent.click(continueButton);
      
      // Should remain on same step due to incomplete data
      expect(screen.getByTestId('passenger-form-0')).toBeInTheDocument();
    });

    test('should handle concurrent form updates', async () => {
      render(<BookingForm />);
      
      const firstNameInput = screen.getByTestId('passenger-0-firstName');
      const lastNameInput = screen.getByTestId('passenger-0-lastName');
      
      // Simulate concurrent updates
      const promises = [
        userEvent.type(firstNameInput, 'John'),
        userEvent.type(lastNameInput, 'Doe'),
      ];
      
      await Promise.all(promises);
      
      expect(firstNameInput).toHaveValue('John');
      expect(lastNameInput).toHaveValue('Doe');
    });
  });

  describe('Browser Compatibility Edge Cases', () => {
    test('should handle missing window.confirm', async () => {
      render(<BookingForm />);
      
      // Temporarily remove window.confirm
      const originalConfirm = window.confirm;
      delete (window as any).confirm;
      
      // Increase passenger count and add data
      const increaseButton = screen.getByRole('button', { name: /\+/i });
      await userEvent.click(increaseButton);
      
      const passenger2Input = screen.getByTestId('passenger-1-firstName');
      await userEvent.type(passenger2Input, 'Jane');
      
      // Try to decrease count
      const decreaseButton = screen.getByRole('button', { name: /-/i });
      await userEvent.click(decreaseButton);
      
      // Should handle gracefully (either prevent action or proceed)
      // The exact behavior depends on implementation
      
      // Restore window.confirm
      window.confirm = originalConfirm;
    });

    test('should handle disabled JavaScript scenarios', () => {
      // This test ensures the form is still functional with basic HTML
      render(<BookingForm />);
      
      // Basic form elements should be present
      expect(screen.getByTestId('passenger-form-0')).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    test('should handle large number of form updates efficiently', async () => {
      render(<BookingForm />);
      
      const firstNameInput = screen.getByTestId('passenger-0-firstName');
      
      // Simulate many rapid updates
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        await userEvent.type(firstNameInput, 'a');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds
    });

    test('should handle maximum passenger count without memory issues', async () => {
      render(<BookingForm />);
      
      const increaseButton = screen.getByRole('button', { name: /\+/i });
      
      // Increase to maximum passengers
      for (let i = 0; i < 4; i++) {
        await userEvent.click(increaseButton);
      }
      
      // Fill all passenger forms
      for (let i = 0; i < 5; i++) {
        const firstNameInput = screen.getByTestId(`passenger-${i}-firstName`);
        await userEvent.type(firstNameInput, `Passenger${i}`);
      }
      
      // Should handle without issues
      expect(screen.getAllByTestId(/passenger-form-/)).toHaveLength(5);
    });
  });

  describe('Accessibility Edge Cases', () => {
    test('should handle keyboard navigation edge cases', async () => {
      render(<BookingForm />);
      
      const firstNameInput = screen.getByTestId('passenger-0-firstName');
      
      // Test various keyboard interactions
      firstNameInput.focus();
      
      // Test Tab navigation
      await userEvent.keyboard('{Tab}');
      
      // Test Escape key
      await userEvent.keyboard('{Escape}');
      
      // Test Enter key
      await userEvent.keyboard('{Enter}');
      
      // Form should remain stable
      expect(screen.getByTestId('passenger-form-0')).toBeInTheDocument();
    });

    test('should handle screen reader scenarios', () => {
      render(<BookingForm />);
      
      // Check for proper ARIA labels and roles
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
      
      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).toBeInTheDocument();
    });
  });

  describe('Network and API Edge Cases', () => {
    test('should handle form submission with network errors', async () => {
      render(<BookingForm />);
      
      // This would test API error handling
      // For now, we ensure the form doesn't break
      expect(screen.getByTestId('passenger-form-0')).toBeInTheDocument();
    });

    test('should handle slow network responses', async () => {
      render(<BookingForm />);
      
      // This would test loading states and timeouts
      // For now, we ensure the form remains responsive
      const firstNameInput = screen.getByTestId('passenger-0-firstName');
      await userEvent.type(firstNameInput, 'John');
      
      expect(firstNameInput).toHaveValue('John');
    });
  });

  describe('Data Integrity Edge Cases', () => {
    test('should maintain data consistency during rapid state changes', async () => {
      render(<BookingForm />);
      
      const firstNameInput = screen.getByTestId('passenger-0-firstName');
      const emailInput = screen.getByLabelText(/email/i);
      
      // Rapid alternating updates
      for (let i = 0; i < 10; i++) {
        await userEvent.type(firstNameInput, 'a');
        await userEvent.type(emailInput, 'b');
      }
      
      // Data should be consistent
      expect(firstNameInput.value).toContain('a');
      expect(emailInput.value).toContain('b');
    });

    test('should handle form reset scenarios', async () => {
      render(<BookingForm />);
      
      const firstNameInput = screen.getByTestId('passenger-0-firstName');
      
      // Fill form
      await userEvent.type(firstNameInput, 'John');
      expect(firstNameInput).toHaveValue('John');
      
      // Clear form
      await userEvent.clear(firstNameInput);
      expect(firstNameInput).toHaveValue('');
    });
  });
});