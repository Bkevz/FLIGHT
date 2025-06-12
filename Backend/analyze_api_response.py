#!/usr/bin/env python3
"""
Analyze the API response structure to understand why airline code extraction is failing.
"""

import json
import sys

def analyze_api_response():
    try:
        with open('c:/Users/User/Desktop/FLIGHT/Backend/tests/airshoping_response.json', 'r') as f:
            data = json.load(f)
        
        print("=== API Response Analysis ===")
        print(f"Top-level keys: {list(data.keys())}")
        
        offers_group = data.get('OffersGroup', {})
        print(f"OffersGroup keys: {list(offers_group.keys())}")
        
        airline_offers = offers_group.get('AirlineOffers', [])
        print(f"Number of airline offers: {len(airline_offers)}")
        
        if airline_offers:
            print("\n=== First Airline Offer Group ===")
            first_group = airline_offers[0]
            print(f"First group keys: {list(first_group.keys())}")
            
            # Check for Owner at group level
            owner_at_group = first_group.get('Owner')
            print(f"Owner at group level: {owner_at_group}")
            
            # Check individual offers
            individual_offers = first_group.get('AirlineOffer', [])
            print(f"Number of individual offers in first group: {len(individual_offers)}")
            
            if individual_offers:
                print("\n=== First Individual Offer ===")
                first_offer = individual_offers[0]
                print(f"First offer keys: {list(first_offer.keys())}")
                
                # Check OfferID structure
                offer_id = first_offer.get('OfferID')
                print(f"OfferID: {offer_id}")
                print(f"OfferID type: {type(offer_id)}")
                
                if isinstance(offer_id, dict):
                    print(f"OfferID keys: {list(offer_id.keys())}")
                    owner = offer_id.get('Owner')
                    print(f"OfferID.Owner: {owner}")
                    print(f"OfferID.Owner type: {type(owner)}")
                
                # Check a few more offers to see if pattern is consistent
                print("\n=== Checking Multiple Offers ===")
                for i, offer in enumerate(individual_offers[:5]):
                    offer_id = offer.get('OfferID', {})
                    if isinstance(offer_id, dict):
                        owner = offer_id.get('Owner')
                        print(f"Offer {i+1} - OfferID.Owner: {owner}")
                    else:
                        print(f"Offer {i+1} - OfferID: {offer_id} (type: {type(offer_id)})")
        
        # Check multiple airline offer groups
        print("\n=== Checking Multiple Airline Offer Groups ===")
        for i, group in enumerate(airline_offers[:3]):
            individual_offers = group.get('AirlineOffer', [])
            if individual_offers:
                first_offer = individual_offers[0]
                offer_id = first_offer.get('OfferID', {})
                if isinstance(offer_id, dict):
                    owner = offer_id.get('Owner')
                    print(f"Group {i+1} - First offer OfferID.Owner: {owner}")
                else:
                    print(f"Group {i+1} - First offer OfferID: {offer_id}")
    
    except FileNotFoundError:
        print("Error: airshoping_response.json not found")
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON - {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_api_response()