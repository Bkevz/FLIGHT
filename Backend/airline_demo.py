"""Demonstration of airline name retrieval functionality with real-world scenarios"""

import sys
import os
import json

# Add the Backend directory to the path so we can import utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.data_transformer import _get_airline_name, _extract_reference_data, transform_verteil_to_frontend

def demo_airline_name_retrieval():
    """Demonstrate airline name retrieval in various scenarios"""
    
    print("🛩️  Airline Name Retrieval Demonstration")
    print("=" * 50)
    
    # Scenario 1: Basic usage without reference data
    print("\n📋 Scenario 1: Basic Usage (Fallback to Known Airlines)")
    common_airlines = ['EK', 'QR', 'SQ', 'TK', 'LH', 'AF', 'BA', 'AA', 'DL', 'UA']
    
    for code in common_airlines:
        name = _get_airline_name(code)
        print(f"  {code} → {name}")
    
    # Scenario 2: With custom reference data (simulating API response)
    print("\n📋 Scenario 2: With Reference Data (Priority Override)")
    custom_reference = {
        'airlines': {
            'EK': 'Emirates - Premium Service',
            'QR': 'Qatar Airways - World\'s Best',
            'XX': 'Custom Test Airline',
            'YY': 'Another Test Carrier'
        }
    }
    
    test_codes = ['EK', 'QR', 'SQ', 'XX', 'YY', 'ZZ']
    for code in test_codes:
        name = _get_airline_name(code, custom_reference)
        source = "Reference Data" if code in custom_reference.get('airlines', {}) else "Fallback"
        print(f"  {code} → {name} ({source})")
    
    # Scenario 3: Edge cases and error handling
    print("\n📋 Scenario 3: Edge Cases and Error Handling")
    edge_cases = [
        (None, "None input"),
        ("", "Empty string"),
        ("  ", "Whitespace only"),
        ("ek", "Lowercase code"),
        ("  EK  ", "Code with whitespace"),
        ("UNKNOWN_CODE", "Unknown airline code"),
        (123, "Non-string input")
    ]
    
    for test_input, description in edge_cases:
        try:
            result = _get_airline_name(test_input)
            print(f"  {description}: '{test_input}' → '{result}'")
        except Exception as e:
            print(f"  {description}: '{test_input}' → ERROR: {e}")
    
    # Scenario 4: Simulating real Verteil API response
    print("\n📋 Scenario 4: Real-world API Response Simulation")
    
    # Mock a realistic Verteil API response structure
    mock_verteil_response = {
        'DataLists': {
            'FlightSegmentList': {
                'FlightSegment': [
                    {
                        'SegmentKey': 'SEG_EK_001',
                        'MarketingCarrier': {
                            'AirlineID': {'value': 'EK'},
                            'Name': 'Emirates'
                        },
                        'OperatingCarrier': {
                            'AirlineID': {'value': 'EK'},
                            'Name': 'Emirates'
                        },
                        'Departure': {
                            'AirportCode': {'value': 'DXB'},
                            'AirportName': 'Dubai International Airport',
                            'Date': '2024-01-15',
                            'Time': '14:30'
                        },
                        'Arrival': {
                            'AirportCode': {'value': 'LHR'},
                            'AirportName': 'London Heathrow Airport',
                            'Date': '2024-01-15',
                            'Time': '18:45'
                        }
                    },
                    {
                        'SegmentKey': 'SEG_QR_002',
                        'MarketingCarrier': {
                            'AirlineID': {'value': 'QR'},
                            'Name': 'Qatar Airways'
                        },
                        'Departure': {
                            'AirportCode': {'value': 'DOH'},
                            'AirportName': 'Hamad International Airport',
                            'Date': '2024-01-16',
                            'Time': '02:15'
                        },
                        'Arrival': {
                            'AirportCode': {'value': 'JFK'},
                            'AirportName': 'John F. Kennedy International Airport',
                            'Date': '2024-01-16',
                            'Time': '07:30'
                        }
                    },
                    {
                        'SegmentKey': 'SEG_TK_003',
                        'MarketingCarrier': {
                            'AirlineID': {'value': 'TK'},
                            'Name': 'Turkish Airlines'
                        },
                        'Departure': {
                            'AirportCode': {'value': 'IST'},
                            'AirportName': 'Istanbul Airport'
                        },
                        'Arrival': {
                            'AirportCode': {'value': 'CDG'},
                            'AirportName': 'Charles de Gaulle Airport'
                        }
                    }
                ]
            }
        },
        'OffersGroup': {
            'AirlineOffers': [
                {
                    'Owner': {'value': 'EK'},
                    'AirlineOffer': []
                },
                {
                    'Owner': {'value': 'QR'},
                    'AirlineOffer': []
                },
                {
                    'Owner': {'value': 'TK'},
                    'AirlineOffer': []
                }
            ]
        }
    }
    
    # Extract reference data from the mock response
    print("  Extracting reference data from mock API response...")
    reference_data = _extract_reference_data(mock_verteil_response)
    
    print(f"  ✓ Extracted {len(reference_data.get('airlines', {}))} airlines")
    print(f"  ✓ Extracted {len(reference_data.get('segments', {}))} flight segments")
    print(f"  ✓ Default airline: {reference_data.get('default_airline', {})}")
    
    # Test airline name retrieval with extracted data
    print("\n  Testing airline name retrieval with extracted data:")
    test_airlines = ['EK', 'QR', 'TK', 'SQ', 'LH', 'UNKNOWN']
    
    for code in test_airlines:
        name = _get_airline_name(code, reference_data)
        in_extracted = code in reference_data.get('airlines', {})
        source = "Extracted" if in_extracted else "Fallback"
        print(f"    {code} → {name} ({source})")
    
    # Scenario 5: Performance and debugging info
    print("\n📋 Scenario 5: Debugging Information")
    
    debug_reference = {
        'airlines': {'EK': 'Emirates', 'QR': 'Qatar Airways'},
        'segments': {
            'SEG1': {
                'MarketingCarrier': {
                    'AirlineID': {'value': 'TK'},
                    'Name': 'Turkish Airlines from Segment'
                }
            }
        },
        'flights': {
            'FLT1': {
                'MarketingCarrier': {
                    'AirlineID': {'value': 'AF'},
                    'Name': 'Air France from Flight'
                }
            }
        }
    }
    
    print("  Reference data structure:")
    print(f"    Airlines dict: {debug_reference.get('airlines', {})}")
    print(f"    Segments count: {len(debug_reference.get('segments', {}))}")
    print(f"    Flights count: {len(debug_reference.get('flights', {}))}")
    
    print("\n  Lookup priority demonstration:")
    priority_tests = [
        ('EK', 'Should find in airlines dict'),
        ('TK', 'Should find in segments (but will use fallback due to priority)'),
        ('AF', 'Should find in flights (but will use fallback due to priority)'),
        ('SQ', 'Should use fallback mapping'),
        ('XX', 'Should format unknown code')
    ]
    
    for code, description in priority_tests:
        result = _get_airline_name(code, debug_reference)
        print(f"    {code} → {result} ({description})")
    
    print("\n🎉 Demonstration completed!")
    print("\n📝 Key Takeaways:")
    print("   • Airline names are retrieved with fallback priority")
    print("   • Reference data from API responses takes precedence")
    print("   • Edge cases are handled gracefully")
    print("   • Unknown codes are formatted consistently")
    print("   • The system is robust and handles various input types")

if __name__ == '__main__':
    demo_airline_name_retrieval()