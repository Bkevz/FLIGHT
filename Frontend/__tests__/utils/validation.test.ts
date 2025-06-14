/**
 * Unit tests for passenger validation functions
 * These tests focus on testing the validation logic in isolation
 */

describe('Passenger Validation Functions', () => {
  // Mock passenger data for testing
  const validPassenger = {
    type: 'adult',
    title: 'Mr',
    firstName: 'John',
    lastName: 'Doe',
    gender: 'male',
    nationality: 'US',
    documentType: 'passport',
    documentNumber: 'A12345678',
    issuingCountry: 'US',
    dob: {
      day: '15',
      month: '06',
      year: '1990'
    },
    expiryDate: {
      day: '15',
      month: '06',
      year: '2030'
    }
  };

  const invalidPassenger = {
    type: '',
    title: '',
    firstName: '',
    lastName: '',
    gender: '',
    nationality: '',
    documentType: '',
    documentNumber: '',
    issuingCountry: '',
    dob: {
      day: '',
      month: '',
      year: ''
    },
    expiryDate: {
      day: '',
      month: '',
      year: ''
    }
  };

  // Since validation functions are internal to the component,
  // we'll create standalone versions for testing
  const validatePassenger = (passenger: any) => {
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

  const validateContactInfo = (contactInfo: any) => {
    const missingFields: string[] = [];
    
    if (!contactInfo?.email?.trim()) missingFields.push('Email Address');
    if (!contactInfo?.phone?.trim()) missingFields.push('Phone Number');
    
    // Basic email validation
    if (contactInfo?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email)) {
      missingFields.push('Valid Email Address');
    }
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  };

  describe('validatePassenger', () => {
    test('should return valid for complete passenger data', () => {
      const result = validatePassenger(validPassenger);
      expect(result.isValid).toBe(true);
      expect(result.missingFields).toHaveLength(0);
    });

    test('should return invalid for empty passenger data', () => {
      const result = validatePassenger({});
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toHaveLength(11);
    });

    test('should identify missing passenger type', () => {
      const passenger = { ...validPassenger, type: '' };
      const result = validatePassenger(passenger);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Passenger Type');
    });

    test('should identify missing title', () => {
      const passenger = { ...validPassenger, title: '' };
      const result = validatePassenger(passenger);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Title');
    });

    test('should identify missing first name', () => {
      const passenger = { ...validPassenger, firstName: '' };
      const result = validatePassenger(passenger);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('First Name');
    });

    test('should identify whitespace-only first name as missing', () => {
      const passenger = { ...validPassenger, firstName: '   ' };
      const result = validatePassenger(passenger);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('First Name');
    });

    test('should identify missing last name', () => {
      const passenger = { ...validPassenger, lastName: '' };
      const result = validatePassenger(passenger);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Last Name');
    });

    test('should identify missing gender', () => {
      const passenger = { ...validPassenger, gender: '' };
      const result = validatePassenger(passenger);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Gender');
    });

    test('should identify missing nationality', () => {
      const passenger = { ...validPassenger, nationality: '' };
      const result = validatePassenger(passenger);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Nationality');
    });

    test('should identify missing document type', () => {
      const passenger = { ...validPassenger, documentType: '' };
      const result = validatePassenger(passenger);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Document Type');
    });

    test('should identify missing document number', () => {
      const passenger = { ...validPassenger, documentNumber: '' };
      const result = validatePassenger(passenger);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Document Number');
    });

    test('should identify missing issuing country', () => {
      const passenger = { ...validPassenger, issuingCountry: '' };
      const result = validatePassenger(passenger);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Issuing Country');
    });

    test('should identify incomplete date of birth', () => {
      const passenger = { ...validPassenger, dob: { day: '', month: '06', year: '1990' } };
      const result = validatePassenger(passenger);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Date of Birth');
    });

    test('should identify missing date of birth month', () => {
      const passenger = { ...validPassenger, dob: { day: '15', month: '', year: '1990' } };
      const result = validatePassenger(passenger);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Date of Birth');
    });

    test('should identify missing date of birth year', () => {
      const passenger = { ...validPassenger, dob: { day: '15', month: '06', year: '' } };
      const result = validatePassenger(passenger);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Date of Birth');
    });

    test('should identify incomplete expiry date', () => {
      const passenger = { ...validPassenger, expiryDate: { day: '', month: '06', year: '2030' } };
      const result = validatePassenger(passenger);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Document Expiry Date');
    });

    test('should handle null/undefined passenger', () => {
      const result = validatePassenger(null);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toHaveLength(11);
    });

    test('should handle passenger with nested null values', () => {
      const passenger = {
        ...validPassenger,
        dob: null,
        expiryDate: null
      };
      const result = validatePassenger(passenger);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Date of Birth');
      expect(result.missingFields).toContain('Document Expiry Date');
    });
  });

  describe('validateContactInfo', () => {
    test('should return valid for complete contact info', () => {
      const contactInfo = {
        email: 'test@example.com',
        phone: '+1234567890'
      };
      const result = validateContactInfo(contactInfo);
      expect(result.isValid).toBe(true);
      expect(result.missingFields).toHaveLength(0);
    });

    test('should return invalid for empty contact info', () => {
      const result = validateContactInfo({});
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Email Address');
      expect(result.missingFields).toContain('Phone Number');
    });

    test('should identify missing email', () => {
      const contactInfo = { phone: '+1234567890' };
      const result = validateContactInfo(contactInfo);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Email Address');
    });

    test('should identify missing phone', () => {
      const contactInfo = { email: 'test@example.com' };
      const result = validateContactInfo(contactInfo);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Phone Number');
    });

    test('should identify invalid email format', () => {
      const contactInfo = {
        email: 'invalid-email',
        phone: '+1234567890'
      };
      const result = validateContactInfo(contactInfo);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Valid Email Address');
    });

    test('should validate various invalid email formats', () => {
      const invalidEmails = [
        'invalid',
        '@invalid.com',
        'invalid@',
        'invalid@.com',
        'invalid.com',
        'invalid@domain',
        'invalid@domain.',
        'invalid @domain.com',
        'invalid@domain .com'
      ];

      invalidEmails.forEach(email => {
        const contactInfo = { email, phone: '+1234567890' };
        const result = validateContactInfo(contactInfo);
        expect(result.isValid).toBe(false);
        expect(result.missingFields).toContain('Valid Email Address');
      });
    });

    test('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
        'a@b.co'
      ];

      validEmails.forEach(email => {
        const contactInfo = { email, phone: '+1234567890' };
        const result = validateContactInfo(contactInfo);
        expect(result.isValid).toBe(true);
        expect(result.missingFields).toHaveLength(0);
      });
    });

    test('should handle whitespace-only email as missing', () => {
      const contactInfo = {
        email: '   ',
        phone: '+1234567890'
      };
      const result = validateContactInfo(contactInfo);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Email Address');
    });

    test('should handle whitespace-only phone as missing', () => {
      const contactInfo = {
        email: 'test@example.com',
        phone: '   '
      };
      const result = validateContactInfo(contactInfo);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Phone Number');
    });

    test('should handle null/undefined contact info', () => {
      const result = validateContactInfo(null);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Email Address');
      expect(result.missingFields).toContain('Phone Number');
    });
  });

  describe('Completion Percentage Calculation', () => {
    const getPassengerCompletionPercentage = (passenger: any): number => {
      const validation = validatePassenger(passenger || {});
      const totalFields = 11; // Total required fields
      const completedFields = totalFields - validation.missingFields.length;
      return Math.round((completedFields / totalFields) * 100);
    };

    test('should return 100% for complete passenger', () => {
      const percentage = getPassengerCompletionPercentage(validPassenger);
      expect(percentage).toBe(100);
    });

    test('should return 0% for empty passenger', () => {
      const percentage = getPassengerCompletionPercentage({});
      expect(percentage).toBe(0);
    });

    test('should return correct percentage for partially filled passenger', () => {
      const partialPassenger = {
        type: 'adult',
        title: 'Mr',
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male'
        // Missing 6 fields
      };
      const percentage = getPassengerCompletionPercentage(partialPassenger);
      expect(percentage).toBe(Math.round((5 / 11) * 100)); // 45%
    });

    test('should handle null passenger', () => {
      const percentage = getPassengerCompletionPercentage(null);
      expect(percentage).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle passenger with undefined nested objects', () => {
      const passenger = {
        ...validPassenger,
        dob: undefined,
        expiryDate: undefined
      };
      const result = validatePassenger(passenger);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Date of Birth');
      expect(result.missingFields).toContain('Document Expiry Date');
    });

    test('should handle passenger with partial nested objects', () => {
      const passenger = {
        ...validPassenger,
        dob: { day: '15' }, // Missing month and year
        expiryDate: { month: '06', year: '2030' } // Missing day
      };
      const result = validatePassenger(passenger);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Date of Birth');
      expect(result.missingFields).toContain('Document Expiry Date');
    });

    test('should handle very long field values', () => {
      const longString = 'a'.repeat(1000);
      const passenger = {
        ...validPassenger,
        firstName: longString,
        lastName: longString,
        documentNumber: longString
      };
      const result = validatePassenger(passenger);
      expect(result.isValid).toBe(true); // Should still be valid if all fields are present
    });

    test('should handle special characters in names', () => {
      const passenger = {
        ...validPassenger,
        firstName: "Jean-François",
        lastName: "O'Connor"
      };
      const result = validatePassenger(passenger);
      expect(result.isValid).toBe(true);
    });

    test('should handle numeric strings in text fields', () => {
      const passenger = {
        ...validPassenger,
        firstName: "123",
        lastName: "456"
      };
      const result = validatePassenger(passenger);
      expect(result.isValid).toBe(true); // Validation doesn't check format, only presence
    });
  });
});