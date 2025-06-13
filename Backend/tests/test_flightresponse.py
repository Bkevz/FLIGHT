import pytest
from Backend.utils.flight_datatransformer import FlightPriceTransformer
import json

filename = "flightpriceresponse.json"
# Utility to load test fixtures
def load_fixture(filename):
    with open(f"tests/{filename}", "r") as f:
        return json.load(f)

# Test 1: PriceClassList-based response
def test_transform_with_price_class():
    data = load_fixture(filename)
    transformer = FlightPriceTransformer(data)
    result = transformer.transform()
    assert len(result) > 0
    assert "baggage_allowance" in result[0]
    assert result[0]['baggage_allowance']['carry_on_allowance'] is not None

# Test 2: ServiceList-based response with BagDetailAssociation
def test_transform_with_service_list():
    data = load_fixture(filename)
    transformer = FlightPriceTransformer(data)
    result = transformer.transform()
    assert len(result) > 0
    assert result[0]['baggage_allowance']['checked_allowance'] is not None

# Test 3: No TimeLimits

def test_transform_without_timelimits():
    data = load_fixture(filename)
    transformer = FlightPriceTransformer(data)
    result = transformer.transform()
    assert "offer_expiration_utc" not in result[0] or result[0]['offer_expiration_utc'] is None
    assert "payment_expiration_utc" not in result[0] or result[0]['payment_expiration_utc'] is None

# Test 4: No Penalties

def test_transform_without_penalties():
    data = load_fixture(filename)
    transformer = FlightPriceTransformer(data)
    result = transformer.transform()
    assert result[0]['penalties']['cancel_fee_max'] == 0
    assert result[0]['penalties']['change_fee_max'] == 0

# Test 5: Segment duration and breakdown

def test_segment_details():
    data = load_fixture(filename)
    transformer = FlightPriceTransformer(data)
    result = transformer.transform()
    assert "segments" in result[0]
    assert len(result[0]['segments']) >= 2
    assert "flight_duration" in result[0]['segments'][0]
