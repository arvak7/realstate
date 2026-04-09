#!/usr/bin/env python3
"""Flight search script that scrapes and distills results from multiple sources.

Usage:
    ./scripts/flights.py [origin] <destination> [outbound_date] [return_date] [options]
    ./scripts/flights.py <destination> range:<start>-<end> [options]

Examples:
    ./scripts/flights.py BCN 2026-05-15
    ./scripts/flights.py PMI BCN 2026-05-15 2026-05-18
    ./scripts/flights.py BCN 2026-05-15 --json
    ./scripts/flights.py BCN 2026-05-15 --sources google,ryanair
    ./scripts/flights.py BCN range:2026-06-01-2026-06-30
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from typing import Optional

SCRAPLING = "/home/mreus/.local/share/scrapling-mcp/bin/scrapling"
SOCS_COOKIE = "SOCS=CAISHAgCEhJnd3NfMjAyNTA0MDItMF9SQzIaAmVzIAEaBgiA_PW8Bg"
DEFAULT_ORIGIN = "PMI"
DEFAULT_TIMEOUT = 60

KNOWN_AIRLINES = {
    "Ryanair", "Vueling", "Iberia", "Air Europa", "EasyJet", "Transavia",
    "Eurowings", "Lufthansa", "Air France", "KLM", "TAP", "Wizz Air",
    "Norwegian", "SAS", "Swiss", "Austrian", "Brussels Airlines", "Volotea",
    "Iberia Express", "LEVEL", "Binter", "Air Nostrum", "Jet2", "TUI",
    "British Airways", "Aer Lingus", "Finnair", "LOT", "Aegean",
}


@dataclass
class Flight:
    airline: str
    depart: str
    arrive: str
    duration: str
    stops: int
    price_eur: Optional[int]
    source: str
    co2: Optional[str] = None
    operated_by: Optional[str] = None
    flight_no: Optional[str] = None

    @property
    def dedup_key(self) -> str:
        return f"{self.depart}|{self.airline}"


def run_scrapling_get(url: str, output_file: str, cookies: str = "",
                      timeout: int = DEFAULT_TIMEOUT, ai_targeted: bool = False) -> bool:
    """Run scrapling extract get and return success."""
    cmd = [SCRAPLING, "extract", "get", url, output_file,
           "--impersonate", "chrome", "--timeout", str(timeout)]
    if cookies:
        cmd += ["--cookies", cookies]
    if ai_targeted:
        cmd.append("--ai-targeted")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True,
                                timeout=timeout + 10)
        return result.returncode == 0 and os.path.getsize(output_file) > 0
    except (subprocess.TimeoutExpired, OSError):
        return False


def run_scrapling_stealthy(url: str, output_file: str, css_selector: str = "",
                           wait: int = 5000, timeout: int = 60000,
                           ai_targeted: bool = False) -> bool:
    """Run scrapling extract stealthy-fetch and return success."""
    cmd = [SCRAPLING, "extract", "stealthy-fetch", url, output_file,
           "--solve-cloudflare", "--disable-resources", "--network-idle",
           "--wait", str(wait), "--timeout", str(timeout), "--locale", "es-ES"]
    if css_selector:
        cmd += ["--css-selector", css_selector]
    if ai_targeted:
        cmd.append("--ai-targeted")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True,
                                timeout=(timeout // 1000) + 30)
        return result.returncode == 0 and os.path.getsize(output_file) > 0
    except (subprocess.TimeoutExpired, OSError):
        return False


# ---------------------------------------------------------------------------
# Google Flights parser
# ---------------------------------------------------------------------------

def parse_google_flights(text: str) -> list[Flight]:
    """Parse Google Flights text extraction into Flight objects."""
    flights = []
    lines = text.split("\n")
    # The primary flight block pattern:
    # HH:MM
    # A las HH:MM el ...
    # –
    # HH:MM
    # A las HH:MM el ...
    # Airline
    # [Operado por ...]
    # Duration (e.g. "55 min" or "1 h" or "1 h 30 min" or "2 h 5 min")
    # PMI / origin airport
    # ...
    # Directo / N escala(s)
    # ...
    # XX €
    time_re = re.compile(r"^(\d{1,2}:\d{2})$")
    desc_re = re.compile(r"^A las \d{1,2}:\d{2} el ")
    dur_re = re.compile(r"^(?:(\d+)\s*h)?\s*(?:(\d+)\s*min)?$")
    price_re = re.compile(r"^(\d[\d.,]*)\s*€$")
    stop_re = re.compile(r"^(\d+)\s+escala")

    i = 0
    seen_blocks = set()  # dedup repeated DOM blocks

    while i < len(lines):
        line = lines[i].strip()
        m = time_re.match(line)
        if not m:
            i += 1
            continue

        depart_time = m.group(1)

        # Check next line is "A las ..."
        if i + 1 >= len(lines) or not desc_re.match(lines[i + 1].strip()):
            i += 1
            continue

        # Expect "–" then arrival time
        if i + 2 >= len(lines) or lines[i + 2].strip() != "–":
            i += 1
            continue

        if i + 3 >= len(lines):
            i += 1
            continue
        arrive_m = time_re.match(lines[i + 3].strip())
        if not arrive_m:
            i += 1
            continue
        arrive_time = arrive_m.group(1)

        # Next should be "A las ... " descriptor for arrival
        if i + 4 >= len(lines) or not desc_re.match(lines[i + 4].strip()):
            i += 1
            continue

        # Now find airline (next non-empty, non-descriptor line)
        j = i + 5
        airline = None
        operated_by = None
        duration = None
        stops = 0
        price = None
        co2 = None

        # Scan forward to extract airline, duration, stops, price
        while j < len(lines) and j < i + 40:
            l = lines[j].strip()

            # Airline detection
            if airline is None and l and not dur_re.match(l) and l not in (
                "–", "Directo", "Seleccionar vuelo", "Salida"
            ) and not desc_re.match(l) and not price_re.match(l) and not l.startswith("A las ") and not l.startswith("Aeropuerto") and not stop_re.match(l) and l not in ("PMI", "BCN", "MAD", "VLC", "SVQ", "AGP", "LGW", "STN", "FCO", "CDG", "BER", "AMS", "LIS", "MXP") and "kg CO2" not in l and "Promedio" not in l and "equipaje" not in l.lower() and "filtro" not in l.lower() and "precio" not in l.lower() and l != "ida y vuelta" and not l.startswith("Quitar") and not l.startswith("Añadir") and len(l) < 40:
                # Check if it's a known airline or looks like one
                if any(a.lower() in l.lower() for a in KNOWN_AIRLINES) or (l[0].isupper() and not l[0].isdigit()):
                    airline = l
                    j += 1
                    # Check for "Operado por ..."
                    if j < len(lines) and lines[j].strip().startswith("Operado por"):
                        operated_by = lines[j].strip().replace("Operado por ", "")
                        j += 1
                    continue

            # Duration
            if duration is None and l:
                dm = dur_re.match(l)
                if dm and (dm.group(1) or dm.group(2)):
                    h = int(dm.group(1) or 0)
                    m_val = int(dm.group(2) or 0)
                    if h > 0 and m_val > 0:
                        duration = f"{h}h{m_val:02d}m"
                    elif h > 0:
                        duration = f"{h}h"
                    else:
                        duration = f"{m_val}m"
                    j += 1
                    continue

            # Stops
            if l == "Directo":
                stops = 0
                j += 1
                continue
            sm = stop_re.match(l)
            if sm:
                stops = int(sm.group(1))
                j += 1
                continue

            # CO2
            if "kg CO2" in l:
                co2 = l
                j += 1
                continue

            # Price
            pm = price_re.match(l)
            if pm:
                price = int(pm.group(1).replace(".", "").replace(",", ""))
                break  # price found = end of block

            j += 1

        if airline and price is not None:
            block_key = f"{depart_time}|{arrive_time}|{airline}|{price}"
            if block_key not in seen_blocks:
                seen_blocks.add(block_key)
                flights.append(Flight(
                    airline=airline, depart=depart_time, arrive=arrive_time,
                    duration=duration or "?", stops=stops, price_eur=price,
                    source="google", co2=co2, operated_by=operated_by
                ))

        i = j + 1 if j > i else i + 1

    return flights


# ---------------------------------------------------------------------------
# Kayak parser
# ---------------------------------------------------------------------------

def parse_kayak(text: str) -> list[Flight]:
    """Parse Kayak text extraction (from nrc6 divs) into Flight objects."""
    flights = []
    lines = text.split("\n")
    time_re = re.compile(r"(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})")
    price_re = re.compile(r"(\d[\d.,]*)\s*€")
    dur_re = re.compile(r"(\d+)\s*h\s*(\d+)\s*m|(\d+)\s*h|(\d+)\s*m")
    seen = set()

    i = 0
    while i < len(lines):
        line = lines[i].strip()
        tm = time_re.search(line)
        if not tm:
            i += 1
            continue

        depart = tm.group(1)
        arrive = tm.group(2)
        airline = None
        duration = None
        stops = 0
        price = None

        # Scan forward ~15 lines for airline, duration, stops, price
        for j in range(i + 1, min(i + 20, len(lines))):
            l = lines[j].strip()

            if airline is None and any(a.lower() in l.lower() for a in KNOWN_AIRLINES):
                airline = l.split(",")[0].strip()  # take first if "Ryanair, Vueling"

            dm = dur_re.search(l)
            if dm and duration is None:
                if dm.group(1) and dm.group(2):
                    duration = f"{dm.group(1)}h{int(dm.group(2)):02d}m"
                elif dm.group(3):
                    duration = f"{dm.group(3)}h"
                elif dm.group(4):
                    duration = f"{dm.group(4)}m"

            if "directo" in l.lower() or "direct" in l.lower():
                stops = 0
            elif re.search(r"(\d+)\s+escala", l):
                stops = int(re.search(r"(\d+)\s+escala", l).group(1))
            elif re.search(r"(\d+)\s+stop", l):
                stops = int(re.search(r"(\d+)\s+stop", l).group(1))

            pm = price_re.search(l)
            if pm:
                price = int(pm.group(1).replace(".", "").replace(",", ""))

        if airline and price is not None:
            key = f"{depart}|{airline}"
            if key not in seen:
                seen.add(key)
                flights.append(Flight(
                    airline=airline, depart=depart, arrive=arrive,
                    duration=duration or "?", stops=stops,
                    price_eur=price, source="kayak"
                ))
        i += 1

    return flights


# ---------------------------------------------------------------------------
# Ryanair parser
# ---------------------------------------------------------------------------

def parse_ryanair(text: str) -> list[Flight]:
    """Parse Ryanair text extraction into Flight objects."""
    flights = []
    lines = text.split("\n")
    # Ryanair shows: "06:30 - 08:15" or "06:30\n...\n08:15"
    # and prices like "51.14 EUR" or "51,14 €"
    time_re = re.compile(r"(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})")
    price_re = re.compile(r"(\d[\d.,]+)\s*(?:EUR|€)")
    flight_no_re = re.compile(r"(FR\s*\d+)")
    seen = set()

    for i, line in enumerate(lines):
        tm = time_re.search(line)
        if not tm:
            continue

        depart = tm.group(1)
        arrive = tm.group(2)
        price = None
        flight_no = None

        # Look forward for price and flight number
        for j in range(max(0, i - 5), min(i + 15, len(lines))):
            l = lines[j].strip()
            pm = price_re.search(l)
            if pm and price is None:
                price = int(float(pm.group(1).replace(",", ".")))
            fm = flight_no_re.search(l)
            if fm:
                flight_no = fm.group(1)

        if price is not None:
            key = f"{depart}|Ryanair"
            if key not in seen:
                seen.add(key)
                # Calculate duration
                dh, dm_val = map(int, depart.split(":"))
                ah, am_val = map(int, arrive.split(":"))
                total_min = (ah * 60 + am_val) - (dh * 60 + dm_val)
                if total_min < 0:
                    total_min += 24 * 60
                dur_h = total_min // 60
                dur_m = total_min % 60
                if dur_h > 0 and dur_m > 0:
                    duration = f"{dur_h}h{dur_m:02d}m"
                elif dur_h > 0:
                    duration = f"{dur_h}h"
                else:
                    duration = f"{dur_m}m"

                flights.append(Flight(
                    airline="Ryanair", depart=depart, arrive=arrive,
                    duration=duration, stops=0, price_eur=price,
                    source="ryanair", flight_no=flight_no
                ))

    return flights


# ---------------------------------------------------------------------------
# Skyscanner routes parser (best prices mode)
# ---------------------------------------------------------------------------

@dataclass
class RouteDeal:
    price_eur: int
    date: str
    airline: str
    direct: bool
    source: str = "skyscanner"


def parse_skyscanner_routes(text: str) -> list[RouteDeal]:
    """Parse Skyscanner routes page for best price deals."""
    deals = []
    lines = text.split("\n")
    # Pattern: price, date, airline, direct/stops
    price_re = re.compile(r"(\d[\d.,]*)\s*(?:€|EUR)")
    date_re = re.compile(r"(\d{1,2})\s+(?:de\s+)?(\w+)(?:\s+(?:de\s+)?(\d{4}))?")
    seen = set()

    months_es = {
        "enero": "01", "febrero": "02", "marzo": "03", "abril": "04",
        "mayo": "05", "junio": "06", "julio": "07", "agosto": "08",
        "septiembre": "09", "octubre": "10", "noviembre": "11", "diciembre": "12",
        "ene": "01", "feb": "02", "mar": "03", "abr": "04",
        "may": "05", "jun": "06", "jul": "07", "ago": "08",
        "sep": "09", "oct": "10", "nov": "11", "dic": "12",
    }

    i = 0
    while i < len(lines):
        l = lines[i].strip()
        pm = price_re.search(l)
        if not pm:
            i += 1
            continue

        price = int(float(pm.group(1).replace(".", "").replace(",", ".")))
        airline = None
        date_str = None
        direct = True

        # Search nearby lines for date and airline
        for j in range(max(0, i - 5), min(i + 5, len(lines))):
            jl = lines[j].strip()
            if airline is None:
                for a in KNOWN_AIRLINES:
                    if a.lower() in jl.lower():
                        airline = a
                        break
            dm = date_re.search(jl)
            if dm and date_str is None:
                day = int(dm.group(1))
                month_name = dm.group(2).lower()
                if month_name in months_es:
                    month = months_es[month_name]
                    year = dm.group(3) or str(datetime.now().year)
                    date_str = f"{year}-{month}-{day:02d}"
            if "escala" in jl.lower():
                direct = False

        if price and date_str:
            key = f"{date_str}|{airline}|{price}"
            if key not in seen:
                seen.add(key)
                deals.append(RouteDeal(
                    price_eur=price, date=date_str,
                    airline=airline or "?", direct=direct
                ))
        i += 1

    return deals


# ---------------------------------------------------------------------------
# URL builders
# ---------------------------------------------------------------------------

def google_flights_url(orig: str, dest: str, date: str) -> str:
    return (f"https://www.google.com/travel/flights?q=flights+from+{orig}"
            f"+to+{dest}+on+{date}&hl=es&gl=ES")


def kayak_url(orig: str, dest: str, date: str, ret_date: str = None) -> str:
    if ret_date:
        return f"https://www.kayak.es/flights/{orig}-{dest}/{date}/{ret_date}?sort=bestflight_a"
    return f"https://www.kayak.es/flights/{orig}-{dest}/{date}?sort=bestflight_a"


def ryanair_url(orig: str, dest: str, date: str, ret_date: str = None) -> str:
    url = (f"https://www.ryanair.com/es/es/trip/flights/select?adults=1&teens=0"
           f"&children=0&infants=0&dateOut={date}&originIata={orig}"
           f"&destinationIata={dest}")
    if ret_date:
        url += f"&isReturn=true&dateIn={ret_date}"
    else:
        url += "&isReturn=false"
    return url


def skyscanner_routes_url(orig: str, dest: str) -> str:
    return f"https://www.skyscanner.es/rutas-aereas/{orig.lower()}/{dest.lower()}/"


# ---------------------------------------------------------------------------
# Source fetchers (each returns list of Flight or RouteDeal)
# ---------------------------------------------------------------------------

def fetch_google(orig: str, dest: str, date: str, tmpdir: str,
                 verbose: bool = False) -> list[Flight]:
    out = os.path.join(tmpdir, "google.txt")
    url = google_flights_url(orig, dest, date)
    if verbose:
        print(f"  [google] Fetching...", file=sys.stderr)
    ok = run_scrapling_get(url, out, cookies=SOCS_COOKIE, timeout=DEFAULT_TIMEOUT)
    if not ok or not os.path.exists(out):
        if verbose:
            print(f"  [google] FAILED", file=sys.stderr)
        return []
    with open(out) as f:
        text = f.read()
    flights = parse_google_flights(text)
    if verbose:
        print(f"  [google] OK: {len(flights)} flights", file=sys.stderr)
    return flights


def fetch_kayak(orig: str, dest: str, date: str, ret_date: str,
                tmpdir: str, verbose: bool = False) -> list[Flight]:
    out = os.path.join(tmpdir, "kayak.txt")
    url = kayak_url(orig, dest, date, ret_date)
    if verbose:
        print(f"  [kayak] Fetching (stealthy)...", file=sys.stderr)
    ok = run_scrapling_stealthy(url, out, css_selector="div[class*='nrc6']",
                                wait=5000, timeout=60000)
    if not ok or not os.path.exists(out):
        if verbose:
            print(f"  [kayak] FAILED", file=sys.stderr)
        return []
    with open(out) as f:
        text = f.read()
    flights = parse_kayak(text)
    if verbose:
        print(f"  [kayak] OK: {len(flights)} flights", file=sys.stderr)
    return flights


def fetch_ryanair(orig: str, dest: str, date: str, ret_date: str,
                  tmpdir: str, verbose: bool = False) -> list[Flight]:
    out = os.path.join(tmpdir, "ryanair.txt")
    url = ryanair_url(orig, dest, date, ret_date)
    if verbose:
        print(f"  [ryanair] Fetching (stealthy)...", file=sys.stderr)
    ok = run_scrapling_stealthy(url, out, ai_targeted=True, wait=8000, timeout=90000)
    if not ok or not os.path.exists(out):
        if verbose:
            print(f"  [ryanair] FAILED", file=sys.stderr)
        return []
    with open(out) as f:
        text = f.read()
    flights = parse_ryanair(text)
    if verbose:
        print(f"  [ryanair] OK: {len(flights)} flights", file=sys.stderr)
    return flights


def fetch_skyscanner(orig: str, dest: str, tmpdir: str,
                     verbose: bool = False) -> list[RouteDeal]:
    out = os.path.join(tmpdir, "skyscanner.txt")
    url = skyscanner_routes_url(orig, dest)
    if verbose:
        print(f"  [skyscanner] Fetching...", file=sys.stderr)
    ok = run_scrapling_get(url, out, ai_targeted=True, timeout=DEFAULT_TIMEOUT)
    if not ok or not os.path.exists(out):
        # Try stealthy as fallback (captcha)
        if verbose:
            print(f"  [skyscanner] Simple HTTP failed, trying stealthy...", file=sys.stderr)
        ok = run_scrapling_stealthy(url, out, ai_targeted=True, wait=5000, timeout=60000)
        if not ok or not os.path.exists(out):
            if verbose:
                print(f"  [skyscanner] FAILED", file=sys.stderr)
            return []
    with open(out) as f:
        text = f.read()
    if len(text.strip()) < 50:
        if verbose:
            print(f"  [skyscanner] FAILED (empty/captcha)", file=sys.stderr)
        return []
    deals = parse_skyscanner_routes(text)
    if verbose:
        print(f"  [skyscanner] OK: {len(deals)} deals", file=sys.stderr)
    return deals


# ---------------------------------------------------------------------------
# Dedup & merge
# ---------------------------------------------------------------------------

def deduplicate_flights(all_flights: list[Flight]) -> list[Flight]:
    """Deduplicate by depart+airline, keeping lowest price."""
    best = {}
    for f in all_flights:
        key = f.dedup_key
        if key not in best or (f.price_eur is not None and
                               (best[key].price_eur is None or f.price_eur < best[key].price_eur)):
            best[key] = f
    return sorted(best.values(), key=lambda f: f.price_eur or 9999)


# ---------------------------------------------------------------------------
# Output formatters
# ---------------------------------------------------------------------------

def format_table(flights: list[Flight], orig: str, dest: str, date: str,
                 links: dict) -> str:
    """ANSI-colored table for terminal."""
    BOLD = "\033[1m"
    GREEN = "\033[32m"
    CYAN = "\033[36m"
    YELLOW = "\033[33m"
    DIM = "\033[2m"
    RESET = "\033[0m"

    header = f"\n{BOLD}Flights {orig} -> {dest} | {date}{RESET}\n"
    sep = f"{DIM}{'─' * 75}{RESET}"
    rows = [header, sep]
    rows.append(f"  {'#':>2}  {'Airline':<18} {'Depart':>6} {'Arrive':>6} {'Dur':>6} {'Stops':>5} {'Price':>7}  {'Src':<8}")
    rows.append(sep)

    for i, f in enumerate(flights[:15], 1):
        stops_str = "Direct" if f.stops == 0 else f"{f.stops} stop"
        price_str = f"{f.price_eur} €" if f.price_eur else "?"
        color = GREEN if i <= 3 else CYAN if i <= 7 else ""
        end = RESET if color else ""
        rows.append(f"  {color}{i:>2}  {f.airline:<18} {f.depart:>6} {f.arrive:>6} {f.duration:>6} {stops_str:>5} {price_str:>7}  {f.source:<8}{end}")

    rows.append(sep)
    rows.append(f"\n{DIM}Sources:{RESET}")
    for name, url in links.items():
        rows.append(f"  {YELLOW}{name}{RESET}: {url}")
    rows.append(f"\n{DIM}Queried: {datetime.now().strftime('%Y-%m-%d %H:%M')}{RESET}")
    rows.append(f"{DIM}Prices are indicative. Check links for final price.{RESET}\n")

    return "\n".join(rows)


def format_json(flights: list[Flight], orig: str, dest: str, date: str,
                ret_date: str, links: dict, sources_ok: list[str],
                sources_failed: list[str]) -> str:
    """Compact JSON for Claude consumption."""
    data = {
        "route": f"{orig} -> {dest}",
        "date": date,
        "return_date": ret_date,
        "queried": datetime.now().strftime("%Y-%m-%d"),
        "flights": [
            {k: v for k, v in asdict(f).items() if v is not None and k != "co2"}
            for f in flights[:15]
        ],
        "links": links,
        "sources_ok": sources_ok,
        "sources_failed": sources_failed,
    }
    return json.dumps(data, ensure_ascii=False, indent=2)


def format_range_table(deals: list[RouteDeal], orig: str, dest: str,
                       links: dict) -> str:
    """Table for best-price range mode."""
    BOLD = "\033[1m"
    GREEN = "\033[32m"
    DIM = "\033[2m"
    YELLOW = "\033[33m"
    RESET = "\033[0m"

    header = f"\n{BOLD}Best prices {orig} -> {dest}{RESET}\n"
    sep = f"{DIM}{'─' * 55}{RESET}"
    rows = [header, sep]
    rows.append(f"  {'#':>2}  {'Date':<12} {'Airline':<18} {'Direct':>6} {'Price':>7}")
    rows.append(sep)

    for i, d in enumerate(deals[:15], 1):
        direct_str = "Yes" if d.direct else "No"
        color = GREEN if i <= 3 else ""
        end = RESET if color else ""
        rows.append(f"  {color}{i:>2}  {d.date:<12} {d.airline:<18} {direct_str:>6} {d.price_eur:>5} €{end}")

    rows.append(sep)
    rows.append(f"\n{DIM}Sources:{RESET}")
    for name, url in links.items():
        rows.append(f"  {YELLOW}{name}{RESET}: {url}")
    rows.append(f"\n{DIM}Queried: {datetime.now().strftime('%Y-%m-%d %H:%M')}{RESET}\n")

    return "\n".join(rows)


def format_range_json(deals: list[RouteDeal], orig: str, dest: str,
                      links: dict, sources_ok: list, sources_failed: list) -> str:
    """JSON for range mode."""
    data = {
        "route": f"{orig} -> {dest}",
        "mode": "best_prices",
        "queried": datetime.now().strftime("%Y-%m-%d"),
        "deals": [asdict(d) for d in deals[:15]],
        "links": links,
        "sources_ok": sources_ok,
        "sources_failed": sources_failed,
    }
    return json.dumps(data, ensure_ascii=False, indent=2)


# ---------------------------------------------------------------------------
# Arg parsing
# ---------------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(
        description="Flight search with result distillation",
        epilog="Examples:\n"
               "  flights.py BCN 2026-05-15\n"
               "  flights.py PMI BCN 2026-05-15 --json\n"
               "  flights.py BCN range:2026-06-01-2026-06-30\n",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("args", nargs="+", help="[origin] destination [date] [return_date] or range:...")
    parser.add_argument("--json", action="store_true", help="Output JSON (for Claude)")
    parser.add_argument("--sources", default="google,kayak,ryanair",
                        help="Comma-separated sources (default: google,kayak,ryanair)")
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT, help="Timeout per source")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show progress")
    return parser.parse_args()


def parse_positional(args: list[str]) -> dict:
    """Parse positional args into origin, dest, date, return_date, range."""
    date_re = re.compile(r"^\d{4}-\d{2}-\d{2}$")
    range_re = re.compile(r"^range:(\d{4}-\d{2}-\d{2})-(\d{4}-\d{2}-\d{2})$")

    result = {"origin": DEFAULT_ORIGIN, "dest": None, "date": None,
              "return_date": None, "range_start": None, "range_end": None}

    places = []
    dates = []
    for a in args:
        rm = range_re.match(a)
        if rm:
            result["range_start"] = rm.group(1)
            result["range_end"] = rm.group(2)
        elif date_re.match(a):
            dates.append(a)
        else:
            places.append(a.upper())

    if len(places) >= 2:
        result["origin"] = places[0]
        result["dest"] = places[1]
    elif len(places) == 1:
        result["dest"] = places[0]

    if len(dates) >= 2:
        result["date"] = dates[0]
        result["return_date"] = dates[1]
    elif len(dates) == 1:
        result["date"] = dates[0]

    # Default date: tomorrow
    if not result["date"] and not result["range_start"]:
        result["date"] = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")

    return result


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    args = parse_args()
    params = parse_positional(args.args)

    if not params["dest"]:
        print("Error: destination required", file=sys.stderr)
        sys.exit(1)

    orig = params["origin"]
    dest = params["dest"]
    sources = [s.strip() for s in args.sources.split(",")]
    is_range = params["range_start"] is not None
    verbose = args.verbose

    if verbose:
        if is_range:
            print(f"Searching {orig} -> {dest} | range: {params['range_start']} to {params['range_end']}", file=sys.stderr)
        else:
            print(f"Searching {orig} -> {dest} | {params['date']}"
                  + (f" / {params['return_date']}" if params['return_date'] else ""),
                  file=sys.stderr)
        print(f"Sources: {', '.join(sources)}", file=sys.stderr)

    links = {}
    sources_ok = []
    sources_failed = []

    with tempfile.TemporaryDirectory(prefix="flights_") as tmpdir:
        if is_range:
            # Range mode: use skyscanner + google for cheapest day
            links["skyscanner"] = skyscanner_routes_url(orig, dest)
            deals = fetch_skyscanner(orig, dest, tmpdir, verbose)
            if deals:
                sources_ok.append("skyscanner")
                deals.sort(key=lambda d: d.price_eur)
            else:
                sources_failed.append("skyscanner")

            if args.json:
                print(format_range_json(deals, orig, dest, links, sources_ok, sources_failed))
            else:
                print(format_range_table(deals, orig, dest, links))

        else:
            # Specific date mode
            date = params["date"]
            ret_date = params["return_date"]
            all_flights = []

            # Build links
            if "google" in sources:
                links["google"] = google_flights_url(orig, dest, date)
            if "kayak" in sources:
                links["kayak"] = kayak_url(orig, dest, date, ret_date)
            if "ryanair" in sources:
                links["ryanair"] = ryanair_url(orig, dest, date, ret_date)

            # Parallel fetch
            with ThreadPoolExecutor(max_workers=3) as executor:
                futures = {}
                if "google" in sources:
                    futures[executor.submit(fetch_google, orig, dest, date, tmpdir, verbose)] = "google"
                if "kayak" in sources:
                    futures[executor.submit(fetch_kayak, orig, dest, date, ret_date, tmpdir, verbose)] = "kayak"
                if "ryanair" in sources:
                    futures[executor.submit(fetch_ryanair, orig, dest, date, ret_date, tmpdir, verbose)] = "ryanair"

                for future in as_completed(futures):
                    source = futures[future]
                    try:
                        result = future.result()
                        if result:
                            all_flights.extend(result)
                            sources_ok.append(source)
                        else:
                            sources_failed.append(source)
                    except Exception as e:
                        if verbose:
                            print(f"  [{source}] ERROR: {e}", file=sys.stderr)
                        sources_failed.append(source)

            flights = deduplicate_flights(all_flights)

            if args.json:
                print(format_json(flights, orig, dest, date, ret_date, links,
                                  sources_ok, sources_failed))
            else:
                print(format_table(flights, orig, dest, date, links))


if __name__ == "__main__":
    main()
