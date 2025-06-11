import axios from 'axios';
import { debounce } from 'lodash';
import { logger } from '@/lib/logger';
import type { FlightSearchResponse } from '@/types/flight-api';

// Get backend URL from environment
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: BACKEND_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 30000, // 30 seconds
});

// Add request interceptor
apiClient.interceptors.request.use(
    (config) => {
        logger.info('API Request', { url: config.url, method: config.method });
        return config;
    },
    (error) => {
        logger.error('API Request Error', { error });
        return Promise.reject(error);
    }
);

// Add response interceptor
apiClient.interceptors.response.use(
    (response) => {
        logger.info('API Response', { status: response.status, url: response.config.url });
        return response;
    },
    (error) => {
        logger.error('API Response Error', { error });
        
        // Handle common error cases
        if (error.response) {
            // Server responded with error
            logger.error('Server Error Response', { 
                status: error.response.status,
                data: error.response.data 
            });
            return Promise.reject({
                status: error.response.status,
                message: error.response.data?.message || 'An error occurred',
                details: error.response.data
            });
        } else if (error.request) {
            // Request made but no response
            logger.error('No Response', { 
                url: error.request.responseURL 
            });
            return Promise.reject({
                status: 0,
                message: 'No response from server',
                details: error.request
            });
        } else {
            // Error in request configuration
            logger.error('Request Error', { error });
            return Promise.reject({
                status: 0,
                message: 'Request failed',
                details: error
            });
        }
    }
);

// Export typed API functions
export interface FlightSearchRequest {
    tripType: 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_CITY';
    odSegments: Array<{
        origin: string;
        destination: string;
        departureDate: string;
        returnDate?: string;
    }>;
    numAdults: number;
    numChildren?: number;
    numInfants?: number;
    cabinPreference?: string;
    directOnly?: boolean;
}

export interface FlightOffer {
    id: string;
    price: number;
    currency: string;
    segments: Array<{
        origin: string;
        destination: string;
        departureTime: string;
        arrivalTime: string;
        duration: string;
        airline: string;
        flightNumber: string;
    }>;
}

// Create debounced search function to prevent rapid successive requests
const debouncedSearchFlights = debounce(async (params: FlightSearchRequest, resolve: (value: any) => void, reject: (reason?: any) => void) => {
    try {
        const response = await apiClient.post<FlightSearchResponse>('/api/verteil/air-shopping', params);
        resolve(response);
    } catch (error) {
        reject(error);
    }
}, 1000); // 1 second debounce delay

export const api = {
    // Flight Search with debouncing
    searchFlights: async (params: FlightSearchRequest) => {
        return new Promise((resolve, reject) => {
            debouncedSearchFlights(params, resolve, reject);
        });
    },

    // Flight Pricing
    getFlightPrice: async (offerId: string, shoppingResponseId: string, airShoppingRs: any) => {
        return apiClient.post('/api/verteil/flight-price', {
            offer_id: offerId,
            shopping_response_id: shoppingResponseId,
            air_shopping_rs: airShoppingRs
        });
    },

    // Booking
    createBooking: async (flightOffer: any, passengers: any[], payment: any, contactInfo: any) => {
        return apiClient.post('/api/verteil/order-create', {
            flight_offer: flightOffer,
            passengers,
            payment,
            contact_info: contactInfo
        });
    },

    // Health Check
    healthCheck: async () => {
        return apiClient.get('/api/health');
    }
};
