"""
carrier_rates.py — Karrio SDK integration for real multi-carrier shipping rates.
Maps internal carrier IDs to real carriers (FedEx, UPS, DHL).
Falls back to formula-based pricing when Karrio is unavailable.
"""

import os
from typing import Any

# ─── Karrio Carrier Mapping ───
CARRIER_MAP = {
    "carrier_a": {"karrio_carrier": "fedex", "service": "fedex_standard_overnight", "label": "FedEx"},
    "carrier_b": {"karrio_carrier": "ups", "service": "ups_ground", "label": "UPS"},
    "carrier_c": {"karrio_carrier": "dhl_express", "service": "dhl_express_worldwide", "label": "DHL Express"},
    "carrier_d": {"karrio_carrier": "ups", "service": "ups_3_day_select", "label": "UPS 3-Day"},
    "carrier_e": {"karrio_carrier": "fedex", "service": "fedex_ground", "label": "FedEx Ground"},
}

_KARRIO_AVAILABLE = False

try:
    import karrio
    from karrio.core.models import RateRequest, Address, Parcel
    from karrio.mappers import fedex, ups, dhl_express

    _KARRIO_AVAILABLE = True
except ImportError:
    _KARRIO_AVAILABLE = False


# ─── Coordinate → Address Conversion ───
LOCATION_ADDRESSES: dict[str, dict[str, Any]] = {
    "Factory A": {
        "city": "New Delhi", "state_code": "DL", "postal_code": "110001",
        "country_code": "IN", "address_line1": "Connaught Place",
    },
    "Factory B": {
        "city": "Mumbai", "state_code": "MH", "postal_code": "400001",
        "country_code": "IN", "address_line1": "Fort Area",
    },
    "Retailer B": {
        "city": "Bangalore", "state_code": "KA", "postal_code": "560001",
        "country_code": "IN", "address_line1": "MG Road",
    },
    "Retailer C": {
        "city": "Kolkata", "state_code": "WB", "postal_code": "700001",
        "country_code": "IN", "address_line1": "Park Street",
    },
}


def _get_karrio_gateway(carrier_id: str):
    """Get a Karrio gateway for the given carrier. Returns None if unavailable."""
    if not _KARRIO_AVAILABLE:
        return None

    mapping = CARRIER_MAP.get(carrier_id)
    if not mapping:
        return None

    karrio_carrier = mapping["karrio_carrier"]

    try:
        if karrio_carrier == "fedex":
            api_key = os.getenv("FEDEX_API_KEY", "")
            secret = os.getenv("FEDEX_SECRET_KEY", "")
            account = os.getenv("FEDEX_ACCOUNT_NUMBER", "")
            if not api_key:
                return None
            return karrio.gateway["fedex"].create({
                "api_key": api_key,
                "secret_key": secret,
                "account_number": account,
                "test_mode": True,
            })
        elif karrio_carrier == "ups":
            client_id = os.getenv("UPS_CLIENT_ID", "")
            client_secret = os.getenv("UPS_CLIENT_SECRET", "")
            account = os.getenv("UPS_ACCOUNT_NUMBER", "")
            if not client_id:
                return None
            return karrio.gateway["ups"].create({
                "client_id": client_id,
                "client_secret": client_secret,
                "account_number": account,
                "test_mode": True,
            })
        elif karrio_carrier == "dhl_express":
            site_id = os.getenv("DHL_SITE_ID", "")
            password = os.getenv("DHL_PASSWORD", "")
            account = os.getenv("DHL_ACCOUNT_NUMBER", "")
            if not site_id:
                return None
            return karrio.gateway["dhl_express"].create({
                "site_id": site_id,
                "password": password,
                "account_number": account,
                "test_mode": True,
            })
    except Exception as e:
        print(f"⚠️  Karrio gateway creation failed for {carrier_id}: {e}")
        return None

    return None


def get_real_carrier_rate(
    carrier_id: str,
    weight_kg: float,
    source: str,
    destination: str,
    distance_km: float = 300.0,
) -> dict[str, Any] | None:
    """
    Fetch a real shipping rate from Karrio.
    Returns None if Karrio is unavailable (caller should use fallback pricing).
    """
    gateway = _get_karrio_gateway(carrier_id)
    if gateway is None:
        return None

    mapping = CARRIER_MAP.get(carrier_id, {})
    src_addr = LOCATION_ADDRESSES.get(source)
    dst_addr = LOCATION_ADDRESSES.get(destination)

    if not src_addr or not dst_addr:
        return None

    try:
        request = RateRequest(
            shipper=Address(**src_addr),
            recipient=Address(**dst_addr),
            parcels=[
                Parcel(
                    weight=weight_kg,
                    weight_unit="KG",
                    length=60, width=40, height=40,
                    dimension_unit="CM",
                )
            ],
            services=[mapping.get("service", "")],
        )

        rates, messages = karrio.Rating.fetch(request).from_(gateway).parse()

        if rates:
            best_rate = rates[0]
            return {
                "carrier_id": carrier_id,
                "carrier_label": mapping.get("label", carrier_id),
                "service": best_rate.service,
                "quoted_price": float(best_rate.total_charge),
                "currency": best_rate.currency,
                "estimated_delivery_days": best_rate.transit_days,
                "estimated_delivery_hours": (best_rate.transit_days or 2) * 24,
                "source": "karrio_live",
            }

        if messages:
            print(f"⚠️  Karrio rate messages for {carrier_id}: {messages}")

    except Exception as e:
        print(f"⚠️  Karrio rate fetch failed for {carrier_id}: {e}")

    return None


def get_karrio_status() -> dict[str, Any]:
    """Returns the status of Karrio integration for the dashboard."""
    return {
        "karrio_available": _KARRIO_AVAILABLE,
        "carriers_configured": {
            cid: {
                "label": mapping["label"],
                "karrio_carrier": mapping["karrio_carrier"],
                "credentials_set": bool(_get_karrio_gateway(cid)),
            }
            for cid, mapping in CARRIER_MAP.items()
        },
    }
