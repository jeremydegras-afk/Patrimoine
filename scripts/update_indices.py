"""Récupère les clôtures mensuelles du CAC 40 et du S&P 500 et écrit data/indices.json.

Lancé chaque jour par GitHub Actions (.github/workflows/update-indices.yml).
Source principale : Yahoo Finance via la librairie yfinance (qui se présente comme un vrai navigateur,
ce que Yahoo exige désormais). Secours pour le S&P 500 : FRED (Réserve fédérale de Saint-Louis).
"""
import csv
import io
import json
import os
import sys
import time
import urllib.request
from datetime import datetime, timezone

OUT = "data/indices.json"
INDICES = [
    {"key": "cac40", "yahoo": "^FCHI", "fred": None},
    {"key": "sp500", "yahoo": "^GSPC", "fred": "SP500"},
]


def monthly_last(closes):
    """closes : itérable de (date 'AAAA-MM-JJ', cours). Renvoie {AAAA-MM: dernier cours du mois}."""
    out = {}
    for day, value in sorted(closes):
        if value is None or value != value or value <= 0:  # None, NaN, valeurs aberrantes
            continue
        out[day[:7]] = round(float(value), 2)
    return out


def from_yahoo(symbol):
    import yfinance as yf

    last_error = None
    for attempt in range(4):
        try:
            df = yf.Ticker(symbol).history(period="10y", interval="1d", auto_adjust=False)
            if df is not None and len(df) > 200:
                # l'index est daté dans le fuseau de la place : le mois lu est donc le bon
                return monthly_last((ts.strftime("%Y-%m-%d"), c) for ts, c in df["Close"].items())
            last_error = "réponse vide"
        except Exception as e:  # limitation de débit, coupure réseau...
            last_error = repr(e)
        time.sleep(20 * (attempt + 1))
    raise RuntimeError(f"Yahoo : {last_error}")


def parse_fred(text):
    rows = list(csv.reader(io.StringIO(text)))
    if not rows or len(rows[0]) < 2:
        raise RuntimeError("FRED : réponse inattendue")
    closes = []
    for row in rows[1:]:
        try:
            closes.append((row[0], float(row[1])))
        except (ValueError, IndexError):
            continue  # jours fériés notés "."
    return monthly_last(closes)


def from_fred(series):
    req = urllib.request.Request(
        f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={series}",
        headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) Chrome/126.0 Safari/537.36"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return parse_fred(r.read().decode("utf-8"))


def fetch(ix):
    sources = [("Yahoo", lambda: from_yahoo(ix["yahoo"]))]
    if ix["fred"]:
        sources.append(("FRED", lambda: from_fred(ix["fred"])))
    for name, src in sources:
        try:
            data = src()
            if len(data) >= 12:
                print(f"{ix['key']} : {name} OK")
                return data
            print(f"{ix['key']} : {name} en échec (trop peu de points)")
        except Exception as e:
            print(f"{ix['key']} : {name} en échec ({e})")
    return None


def main():
    previous = {}
    try:
        with open(OUT, encoding="utf-8") as f:
            previous = json.load(f)
    except (OSError, ValueError):
        pass
    out = {"updated": previous.get("updated"), "source": "Yahoo Finance / FRED, clôtures mensuelles"}
    ok, changed = 0, False
    for ix in INDICES:
        fresh = fetch(ix)
        if fresh:
            ok += 1
        # on garde l'historique déjà connu et on le complète / corrige avec les valeurs fraîches
        merged = dict(sorted({**previous.get(ix["key"], {}), **(fresh or {})}.items()))
        out[ix["key"]] = merged
        if merged != previous.get(ix["key"], {}):
            changed = True
        if merged:
            last = list(merged)[-1]
            print(f"{ix['key']} : {len(merged)} mois, dernier {last} = {merged[last]}")
    if ok == 0:
        print("::error::Aucune source disponible, fichier inchangé")
        sys.exit(1)
    if changed or not out["updated"]:
        out["updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    os.makedirs("data", exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=1)
        f.write("\n")
    if ok < len(INDICES):
        print("::warning::Un indice n'a pas pu être rafraîchi, anciennes valeurs conservées")


if __name__ == "__main__":
    main()
