import json
import re

class FlightPriceTransformer:
    def __init__(self, ndc_json: dict):
        self.data = ndc_json
        self.traveler_map = {
            t['ObjectKey']: t['PTC']['value']
            for t in self.data['DataLists']['AnonymousTravelerList']['AnonymousTraveler']
        }
        self.segment_map = {
            seg['SegmentKey']: seg
            for seg in self.data['DataLists']['FlightSegmentList']['FlightSegment']
        }
        self.flight_map = {
            flt['FlightKey']: flt['SegmentReferences']['value']
            for flt in self.data['DataLists']['FlightList']['Flight']
        }
        self.origin_dest_map = {
            od['OriginDestinationKey']: od
            for od in self.data['DataLists']['OriginDestinationList']['OriginDestination']
        }

        self.price_class_map = {}
        if 'PriceClassList' in self.data['DataLists']:
            self.price_class_map = {
                pc['ObjectKey']: pc for pc in self.data['DataLists']['PriceClassList']['PriceClass']
            }
        elif 'ServiceList' in self.data['DataLists']:
            self.price_class_map = {
                pc['ObjectKey']: pc for pc in self.data['DataLists']['ServiceList']['Service']
            }

        self.penalty_map = {
            p['ObjectKey']: p for p in self.data['DataLists'].get('PenaltyList', {}).get('Penalty', [])
        }
        self.carryon_map = {
            c['ListKey']: c for c in self.data['DataLists'].get('CarryOnAllowanceList', {}).get('CarryOnAllowance', [])
        }
        self.checked_map = {
            c['ListKey']: c for c in self.data['DataLists'].get('CheckedBagAllowanceList', {}).get('CheckedBagAllowance', [])
        }

    def parse_duration(self, pt_str):
        match = re.match(r'PT(\d+)H(\d+)M', pt_str)
        if match:
            hours, minutes = match.groups()
            return f"{int(hours)}h {int(minutes)}m"
        return pt_str

    def get_baggage(self, assoc):
        price_class_ref = assoc.get('PriceClass', {}).get('PriceClassReference')
        if price_class_ref and price_class_ref in self.price_class_map:
            descs = self.price_class_map[price_class_ref].get('Descriptions', {}).get('Description', [])
            carry = next((d['Text']['value'] for d in descs if 'CARRYON' in d['Text']['value']), None)
            check = next((d['Text']['value'] for d in descs if 'CHECKED' in d['Text']['value']), None)
            if carry or check:
                return {"carry_on_allowance": carry, "checked_allowance": check}

        carry_descs, checked_descs = [], []
        for segment in assoc.get('ApplicableFlight', {}).get('FlightSegmentReference', []):
            bag_detail = segment.get('BagDetailAssociation', {})
            for carry_key in bag_detail.get('CarryOnReferences', []):
                carry_data = self.carryon_map.get(carry_key, {})
                for d in carry_data.get('AllowanceDescription', {}).get('Descriptions', {}).get('Description', []):
                    carry_descs.append(d['Text']['value'])
            for check_key in bag_detail.get('CheckedBagReferences', []):
                checked_data = self.checked_map.get(check_key, {})
                for d in checked_data.get('AllowanceDescription', {}).get('Descriptions', {}).get('Description', []):
                    checked_descs.append(d['Text']['value'])

        return {
            "carry_on_allowance": carry_descs[0] if carry_descs else None,
            "checked_allowance": checked_descs[0] if checked_descs else None
        }

    def extract_penalties(self, refs):
        cancel_vals, change_vals = [], []
        for ref in refs:
            entry = self.penalty_map.get(ref, {})
            for d in entry.get('Details', {}).get('Detail', []):
                for amt in d['Amounts']['Amount']:
                    val = amt['CurrencyAmountValue']['value']
                    if 'Cancel' in d['Type']:
                        cancel_vals.append(val)
                    if 'Change' in d['Type']:
                        change_vals.append(val)
        return {
            "cancel_fee_min": min(cancel_vals) if cancel_vals else 0,
            "cancel_fee_max": max(cancel_vals) if cancel_vals else 0,
            "change_fee_min": min(change_vals) if change_vals else 0,
            "change_fee_max": max(change_vals) if change_vals else 0
        }

    def transform(self):
        results = []
        for offer in self.data['PricedFlightOffers']['PricedFlightOffer']:
            time_limits = offer.get('TimeLimits', {})
            offer_expiry = time_limits.get('OfferExpiration', {}).get('DateTime')
            payment_expiry = time_limits.get('PaymentTimeLimit', {}).get('DateTime') or \
                             time_limits.get('Payment', {}).get('DateTime')

            for price_block in offer['OfferPrice']:
                rd = price_block['RequestedDate']
                pd = rd['PriceDetail']
                currency = pd['TotalAmount']['SimpleCurrencyPrice']['Code']
                total_per_ptc = pd['TotalAmount']['SimpleCurrencyPrice']['value']

                segments = []
                for key in rd['Associations'][0]['ApplicableFlight']['OriginDestinationReferences']:
                    for flight_ref in self.origin_dest_map[key]['FlightReferences']['value']:
                        for seg_key in self.flight_map[flight_ref]:
                            segments.append(self.segment_map[seg_key])

                segment_list = []
                for seg in segments:
                    segment_list.append({
                        "airline_name": seg['MarketingCarrier']['Name'],
                        "flight_number": f"{seg['MarketingCarrier']['AirlineID']['value']}{seg['MarketingCarrier']['FlightNumber']['value']}",
                        "origin": seg['Departure']['AirportCode']['value'],
                        "destination": seg['Arrival']['AirportCode']['value'],
                        "departure_date": seg['Departure']['Date'].split('T')[0],
                        "departure_time": seg['Departure']['Time'],
                        "arrival_date": seg['Arrival']['Date'].split('T')[0],
                        "arrival_time": seg['Arrival']['Time'],
                        "flight_duration": self.parse_duration(seg['FlightDetail']['FlightDuration']['Value'])
                    })

                fare_basis = price_block['FareDetail']['FareComponent'][0]['FareBasis']['FareBasisCode']['Code']
                penalty_refs = [ref for fc in price_block['FareDetail']['FareComponent']
                                for ref in fc['FareRules']['Penalty']['refs']]
                penalties = self.extract_penalties(penalty_refs)
                seen_ptc = set()

                for assoc in rd['Associations']:
                    traveler_refs = assoc['AssociatedTraveler']['TravelerReferences']
                    ptc = self.traveler_map[traveler_refs[0]]
                    count = len(traveler_refs)
                    ptc_key = (ptc, count)

                    if ptc_key in seen_ptc:
                        continue
                    seen_ptc.add(ptc_key)

                    baggage = self.get_baggage(assoc)
                    base = pd['BaseAmount']['value']
                    taxes = pd['Taxes']['Total']['value']
                    discount = sum(d['DiscountAmount']['value'] for d in pd.get('Discount', []))

                    record = {
                        "segments": segment_list,
                        "fare_basis": fare_basis,
                        "passenger_type": ptc,
                        "traveler_count": count,
                        "baggage_allowance": baggage,
                        "pricing": {
                            "base_fare_per_traveler": base,
                            "taxes_per_traveler": taxes,
                            "discount_per_traveler": discount,
                            "total_price_per_traveler": total_per_ptc,
                            "currency": currency,
                            "traveler_count": count,
                            "total_base_fare": base * count,
                            "total_taxes": taxes * count,
                            "total_discount": discount * count,
                            "total_price": total_per_ptc * count
                        },
                        "penalties": penalties,
                        "total_amount_per_ptc": {
                            "passenger_type": ptc,
                            "traveler_count": count,
                            "price_per_ptc": total_per_ptc,
                            "currency": currency,
                            "total_amount": total_per_ptc * count
                        }
                    }
                    if offer_expiry:
                        record["offer_expiration_utc"] = offer_expiry
                    if payment_expiry:
                        record["payment_expiration_utc"] = payment_expiry

                    results.append(record)
        return results
