"""Génère la migration de seed des fondamentaux depuis le classeur Lyamfi."""
import openpyxl, sys

XL = "/root/.claude/uploads/7b53398c-0611-501b-bbaa-beea9c8b400d/99d9755a-Lyamfi_Fond_DataBase_24_08.xlsx"
OUT = "/home/user/lyamfi/supabase/migrations/20260825090000_stock_metrics.sql"

# Colonne du classeur -> colonne SQL. L'ordre fixe l'ordre des VALUES.
COLUMNS = [
    ("Société", "company"),
    ("Ticker", "ticker"),
    ("Nombre d'actions", "shares"),
    ("BPA 26", "eps_26"),
    ("BPAe 27", "eps_27e"),
    ("DPA 26", "dps_26"),
    ("DPAe 27", "dps_27e"),
    ("Book price 25", "book_value_25"),
    ("Sales per Share 25", "sales_per_share_25"),
    ("FCF per share 25", "fcf_per_share_25"),
    ("ROE 25", "roe_25"),
    ("ROA 25", "roa_25"),
    ("Pay-out 25", "payout_25"),
    ("Marge nette 25", "net_margin_25"),
    ("Marge EBE 25", "ebitda_margin_25"),
]

# Marqueurs d'absence utilisés dans le classeur.
BLANKS = {"", "_", "—", "-", "n/a", "na", "nd", "n.d."}


def number(value):
    """Nombre SQL, ou NULL. Les milliers sont séparés par des espaces, y
    compris insécables, et la virgule peut servir de séparateur décimal."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    if text.lower() in BLANKS:
        return None
    for space in (" ", " ", " ", " "):
        text = text.replace(space, "")
    text = text.replace(",", ".")
    try:
        return float(text)
    except ValueError:
        return None


def literal(v):
    return "NULL" if v is None else repr(round(v, 6)).rstrip("0").rstrip(".") if isinstance(v, float) else str(v)


def sql_text(v):
    return "'" + str(v).strip().replace("'", "''") + "'"


rows = [r for r in openpyxl.load_workbook(XL, data_only=True)["Feuille 1"].iter_rows(values_only=True)]
header = [str(c).strip() if c else "" for c in rows[0]]
index = {name: header.index(name) for name, _ in COLUMNS}

records, skipped = [], []
for raw in rows[1:]:
    ticker = raw[index["Ticker"]]
    if not ticker or not str(ticker).strip():
        continue
    ticker = str(ticker).strip().upper()
    company = str(raw[index["Société"]]).strip()
    values = [sql_text(ticker), sql_text(company)]
    for name, _ in COLUMNS[2:]:
        values.append(literal(number(raw[index[name]])))
    records.append((ticker, values))

records.sort(key=lambda r: r[0])
assert len({t for t, _ in records}) == len(records), "ticker en double dans le classeur"

cols = ["ticker", "company"] + [sql for _, sql in COLUMNS[2:]]
lines = ",\n".join("  (" + ", ".join(v) + ")" for _, v in records)

body = f"""-- Fondamentaux des valeurs de la Bourse de Casablanca.
--
-- Seed issu de « Lyamfi_Fond_DataBase_24_08.xlsx », généré par
-- scripts/build-stock-metrics.py : ne pas éditer à la main, régénérer.
--
-- Toutes les colonnes chiffrées sont NULLABLES et le classeur est
-- volontairement incomplet : il note « _ » ou « — » là où la donnée manque.
-- L'interface masque l'indicateur correspondant plutôt que d'afficher un
-- « N/A », donc une valeur absente ici doit rester NULL et surtout pas 0, qui
-- se lirait comme une vraie mesure.
--
-- Les colonnes « 25 » sont des constats sur l'exercice clos, les « 26 » des
-- prévisions, les « 27e » des estimations. Rien ici ne dépend du cours : PER,
-- rendement, P/B, P/S et P/FCF se calculent à l'affichage à partir du cours du
-- jour, sinon ils seraient périmés dès le lendemain.

CREATE TABLE IF NOT EXISTS public.stock_metrics (
  ticker             text PRIMARY KEY,
  company            text NOT NULL,
  shares             numeric,
  eps_26             numeric,
  eps_27e            numeric,
  dps_26             numeric,
  dps_27e            numeric,
  book_value_25      numeric,
  sales_per_share_25 numeric,
  fcf_per_share_25   numeric,
  roe_25             numeric,
  roa_25             numeric,
  payout_25          numeric,
  net_margin_25      numeric,
  ebitda_margin_25   numeric,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.stock_metrics TO anon, authenticated;
GRANT ALL    ON public.stock_metrics TO service_role;
ALTER TABLE public.stock_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "metrics public read" ON public.stock_metrics
FOR SELECT TO anon, authenticated USING (true);

-- Le seed fait foi : une réexécution réaligne la table sur le classeur.
INSERT INTO public.stock_metrics ({", ".join(cols)}) VALUES
{lines}
ON CONFLICT (ticker) DO UPDATE SET
{chr(10).join(f"  {c} = EXCLUDED.{c}," for c in cols[1:])}
  updated_at = now();

-- Les valeurs radiées de la cote disparaissent de la table.
DELETE FROM public.stock_metrics
WHERE ticker NOT IN ({", ".join(sql_text(t) for t, _ in records)});
"""

open(OUT, "w").write(body)
print(f"{len(records)} valeurs écrites dans {OUT}")
nulls = {}
for _, vals in records:
    for i, (name, sqlname) in enumerate(COLUMNS[2:], start=2):
        if vals[i] == "NULL":
            nulls[sqlname] = nulls.get(sqlname, 0) + 1
print("colonnes avec des trous :", {k: v for k, v in sorted(nulls.items(), key=lambda x: -x[1])})
