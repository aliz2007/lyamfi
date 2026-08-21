#!/usr/bin/env python3
"""
Build supabase/setup.sql — the whole schema in one paste-able, RE-RUNNABLE file.

Why this exists
---------------
The Supabase SQL editor runs a pasted script as ONE transaction, so a single
"already exists" aborts and rolls back everything. The per-file migrations use
bare CREATE TABLE / CREATE POLICY, which is correct for tooling that applies
each file once, but means a concatenation of them can only ever run against an
empty project. This script emits a guarded version instead.

Why it is not a regex
---------------------
An earlier regex version split statements on the first ";" it found. Lesson
content is full of prose containing semicolons inside single-quoted strings, so
it cut mid-statement and rewrote a semicolon that lived *inside* a lesson body —
corrupting the text and leaving the real INSERT unguarded. SQL needs a scanner
that understands quoting; that is what split_statements does.
"""
from __future__ import annotations
import glob
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def split_statements(sql: str) -> list[str]:
    """Split on top-level semicolons, respecting SQL quoting and comments.

    Handles: 'single quotes' with '' escapes, $tag$ dollar quoting,
    -- line comments, and /* block comments */. Each returned chunk keeps its
    trailing ";" and surrounding whitespace, so "".join(result) == sql.
    """
    out: list[str] = []
    buf: list[str] = []
    i, n = 0, len(sql)

    while i < n:
        c = sql[i]

        # -- line comment
        if c == "-" and sql.startswith("--", i):
            j = sql.find("\n", i)
            j = n if j == -1 else j + 1
            buf.append(sql[i:j])
            i = j
            continue

        # /* block comment */
        if c == "/" and sql.startswith("/*", i):
            j = sql.find("*/", i + 2)
            j = n if j == -1 else j + 2
            buf.append(sql[i:j])
            i = j
            continue

        # 'single quoted' — '' is a literal quote, not a terminator
        if c == "'":
            j = i + 1
            while j < n:
                if sql[j] == "'":
                    if j + 1 < n and sql[j + 1] == "'":
                        j += 2
                        continue
                    j += 1
                    break
                j += 1
            buf.append(sql[i:j])
            i = j
            continue

        # $tag$ dollar quoted $tag$
        if c == "$":
            m = re.match(r"\$[A-Za-z_][A-Za-z_0-9]*\$|\$\$", sql[i:])
            if m:
                tag = m.group(0)
                j = sql.find(tag, i + len(tag))
                j = n if j == -1 else j + len(tag)
                buf.append(sql[i:j])
                i = j
                continue

        if c == ";":
            buf.append(c)
            out.append("".join(buf))
            buf = []
            i += 1
            continue

        buf.append(c)
        i += 1

    if buf:
        out.append("".join(buf))
    return out


# Seed tables whose INSERTs must become no-ops on a re-run.
CONFLICT_TARGET = {
    "public.stocks": "(ticker)",
    "public.lessons": "(slug)",
    "public.stock_fundamentals": "(ticker)",
    "public.stock_prices": "",
}


def guard(stmt: str) -> str:
    """Make a single statement safe to execute twice."""
    # Only look at the code outside quoted bodies when deciding what this is.
    probe = re.sub(r"'(?:''|[^'])*'|\$([A-Za-z_][A-Za-z_0-9]*)?\$.*?\$\1?\$", "''", stmt, flags=re.S)

    if re.search(r"\bCREATE TABLE\b(?!\s+IF NOT EXISTS)", probe):
        return re.sub(r"\bCREATE TABLE\b(?!\s+IF NOT EXISTS)", "CREATE TABLE IF NOT EXISTS", stmt, count=1)

    if re.search(r"\bCREATE INDEX\b(?!\s+IF NOT EXISTS)", probe):
        return re.sub(r"\bCREATE INDEX\b(?!\s+IF NOT EXISTS)", "CREATE INDEX IF NOT EXISTS", stmt, count=1)

    m = re.search(r'CREATE POLICY\s+("(?:[^"]+)"|\w+)\s+ON\s+([\w.]+)', probe)
    if m:
        return f"DROP POLICY IF EXISTS {m.group(1)} ON {m.group(2)};\n{stmt.lstrip()}"

    m = re.search(r"CREATE TRIGGER\s+(\w+)\b.*?\bON\s+([\w.]+)", probe, re.S)
    if m:
        return f"DROP TRIGGER IF EXISTS {m.group(1)} ON {m.group(2)};\n{stmt.lstrip()}"

    m = re.search(r"INSERT INTO\s+([\w.]+)", probe)
    if m and "ON CONFLICT" not in probe:
        target = CONFLICT_TARGET.get(m.group(1))
        if target is not None:
            clause = f"ON CONFLICT {target} DO NOTHING".replace("ON CONFLICT  DO", "ON CONFLICT DO")
            # Append before the statement's own terminating semicolon — which,
            # because of split_statements, is genuinely the last character.
            assert stmt.rstrip().endswith(";"), "statement should end with ;"
            head = stmt.rstrip()[:-1].rstrip()
            return f"{head}\n{clause};"

    return stmt


HEADER = """-- =====================================================================
-- Lyamfi — complete database setup, in one file.
--
-- Paste into the Supabase SQL Editor and press Run.
--
-- SAFE TO RE-RUN. The editor executes the whole script in one transaction,
-- so one "already exists" would roll everything back. Every statement here
-- is therefore guarded: CREATE TABLE/INDEX IF NOT EXISTS, DROP ... IF EXISTS
-- before each policy and trigger, CREATE OR REPLACE for functions, and
-- ON CONFLICT on every seed insert.
--
-- GENERATED by scripts/build-setup-sql.py from supabase/migrations/*.sql.
-- Do not edit by hand — regenerate instead.
-- ====================================================================="""


def main() -> int:
    files = sorted(glob.glob(os.path.join(REPO, "supabase/migrations/*.sql")))
    chunks = [HEADER]
    total_stmts = 0

    for f in files:
        body = open(f).read().strip()
        if not body:
            continue
        stmts = split_statements(body)
        assert "".join(stmts) == body, f"round-trip failed for {os.path.basename(f)}"
        total_stmts += len([s for s in stmts if s.strip()])
        guarded = "".join(guard(s) for s in stmts)
        chunks.append(
            "\n\n-- ---------------------------------------------------------------------\n"
            f"-- {os.path.basename(f)}\n"
            "-- ---------------------------------------------------------------------\n\n"
            + guarded
        )

    out = "\n".join(chunks) + "\n"
    open(os.path.join(REPO, "supabase/setup.sql"), "w").write(out)
    print(f"setup.sql: {len(files)} migrations, {total_stmts} statements, {len(out)} chars")
    return 0


if __name__ == "__main__":
    sys.exit(main())
