# -*- coding: utf-8 -*-
"""
Patch SQL.pptx slide XML: add project text only (images/layout unchanged).
Reads: c:\\Users\\PC\\Downloads\\SQL.pptx
Writes: c:\\Users\\PC\\Downloads\\SQL-Updated.pptx

Run: python scripts/update_sql_pptx.py
"""
from __future__ import annotations

import os
import sys
import tempfile
import zipfile


def esc(t: str) -> str:
    return (
        t.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def bullets_wingdings(char: str, lines: list[str]) -> str:
    ppr = (
        "<a:pPr>"
        '<a:buFont typeface="Wingdings" panose="05000000000000000000" pitchFamily="2" charset="2"/>'
        f'<a:buChar char="{char}"/>'
        '<a:defRPr sz="1800"><a:latin typeface="Times New Roman"/></a:defRPr>'
        "</a:pPr>"
    )
    parts = []
    for line in lines:
        parts.append(
            "<a:p>"
            + ppr
            + '<a:r><a:rPr lang="en-US" sz="1800"/><a:t>'
            + esc(line)
            + "</a:t></a:r>"
            + '<a:endParaRPr lang="en-GB" dirty="0"/>'
            + "</a:p>"
        )
    return "".join(parts)


def plain_paras(lines: list[str]) -> str:
    parts = []
    for line in lines:
        parts.append(
            "<a:p>"
            + '<a:r><a:rPr lang="en-US" sz="1800"/><a:t>'
            + esc(line)
            + "</a:t></a:r>"
            + '<a:endParaRPr lang="en-GB" dirty="0"/>'
            + "</a:p>"
        )
    return "".join(parts)


def rep(path: str, old: str, new: str, label: str) -> None:
    s = open(path, encoding="utf-8").read()
    if old not in s:
        raise SystemExit(f"{label}: fragment not found in {os.path.basename(path)}")
    s = s.replace(old, new, 1)
    open(path, "w", encoding="utf-8", newline="").write(s)


def zip_dir(src_dir: str, out_pptx: str) -> None:
    with zipfile.ZipFile(out_pptx, "w", zipfile.ZIP_DEFLATED) as z:
        for root, _, files in os.walk(src_dir):
            for f in files:
                fp = os.path.join(root, f)
                arc = os.path.relpath(fp, src_dir).replace("\\", "/")
                z.write(fp, arc)


def main() -> None:
    src = r"c:\Users\PC\Downloads\SQL.pptx"
    out = r"c:\Users\PC\Downloads\SQL-Updated.pptx"
    if not os.path.isfile(src):
        print(f"ERROR: Not found: {src}", file=sys.stderr)
        sys.exit(1)

    d = tempfile.mkdtemp(prefix="pptx_patch_")
    try:
        with zipfile.ZipFile(src, "r") as z:
            z.extractall(d)

        slides = os.path.join(d, "ppt", "slides")

        # Slide 1 — center title (empty run)
        rep(
            os.path.join(slides, "slide1.xml"),
            "<a:lstStyle/><a:p><a:endParaRPr lang=\"en-US\" sz=\"4000\" dirty=\"0\"/></a:p></p:txBody></p:sp><p:cxnSp>",
            "<a:lstStyle/><a:p><a:r><a:rPr lang=\"en-US\" sz=\"4000\" dirty=\"0\"/><a:t>"
            "SQL Injection Lab - Meridian Supply (GitHub: Cyber-Security)"
            "</a:t></a:r><a:endParaRPr lang=\"en-US\" sz=\"4000\" dirty=\"0\"/></a:p></p:txBody></p:sp><p:cxnSp>",
            "slide1",
        )

        intro = [
            "Hands-on app: Node.js + Express + SQLite (sql.js) — repo: Hafiz-Subhan-Sabir/Cyber-Security.",
            "Two stacks: Site A = legacy SQL (input glued into strings); Site B = parameterized queries + allow-lists.",
            "Same UI for sign-in and inventory; routes /insecure/* vs /secure/* show weak vs strong backend patterns.",
            "Live demo: Render (e.g. cyber-security-*.onrender.com); Diagnostics show SQL for coursework screenshots.",
        ]
        rep(
            os.path.join(slides, "slide2.xml"),
            '<a:lstStyle/><a:p><a:pPr><a:buFont typeface="Wingdings" panose="05000000000000000000" pitchFamily="2" charset="2"/><a:buChar char="v"/><a:defRPr sz="1800"><a:latin typeface="Times New Roman"/></a:defRPr></a:pPr><a:endParaRPr lang="en-GB" dirty="0"/></a:p></p:txBody></p:sp><p:pic><p:nvPicPr><p:cNvPr id="3074"',
            "<a:lstStyle/>"
            + bullets_wingdings("v", intro)
            + '</p:txBody></p:sp><p:pic><p:nvPicPr><p:cNvPr id="3074"',
            "slide2",
        )

        prob = [
            "SQL injection: untrusted input becomes part of the SQL command, not only literal data (OWASP / CWE-89 theme).",
            "Risk: broken authentication, leaked rows, integrity loss if the DB account is over-privileged.",
            "This project isolates the issue in Site A for authorized lab use; Site B shows the same features built safely.",
        ]
        rep(
            os.path.join(slides, "slide3.xml"),
            '<a:lstStyle/><a:p><a:pPr><a:buFont typeface="Wingdings" panose="05000000000000000000" pitchFamily="2" charset="2"/><a:buChar char="Ø"/><a:defRPr sz="1800"><a:latin typeface="Times New Roman"/></a:defRPr></a:pPr><a:endParaRPr lang="en-GB" dirty="0"/></a:p></p:txBody></p:sp><p:pic><p:nvPicPr><p:cNvPr id="5" name="Picture 4"',
            "<a:lstStyle/>"
            + bullets_wingdings("Ø", prob)
            + '</p:txBody></p:sp><p:pic><p:nvPicPr><p:cNvPr id="5" name="Picture 4"',
            "slide3",
        )

        obj = [
            "Demonstrate login + inventory attack surface on Site A (string-built WHERE, LIKE, ORDER BY).",
            "Contrast with Site B: prepared statements (?), bound arrays, allow-listed ORDER BY columns.",
            "Deliver reproducible evidence: Diagnostics on each page; deck layout and images unchanged.",
        ]
        rep(
            os.path.join(slides, "slide4.xml"),
            '<a:lstStyle/><a:p><a:pPr><a:buFont typeface="Wingdings" panose="05000000000000000000" pitchFamily="2" charset="2"/><a:buChar char="q"/><a:defRPr sz="1800"><a:latin typeface="Times New Roman"/></a:defRPr></a:pPr><a:endParaRPr lang="en-GB" dirty="0"/></a:p></p:txBody></p:sp><p:pic><p:nvPicPr><p:cNvPr id="2052"',
            "<a:lstStyle/>"
            + bullets_wingdings("q", obj)
            + '</p:txBody></p:sp><p:pic><p:nvPicPr><p:cNvPr id="2052"',
            "slide4",
        )

        meth = [
            "Site A: Express builds SQL with template literals; getOneRaw / getAllRaw execute the final string.",
            "Site B: fixed SQL with ? placeholders; getOneBound / getAllBound + stmt.bind(params).",
            "Stack: sql.js (WASM SQLite); Render sets PORT and RENDER; server binds 0.0.0.0 when deployed.",
        ]
        rep(
            os.path.join(slides, "slide5.xml"),
            '<a:lstStyle/><a:p><a:pPr><a:buFont typeface="Wingdings" panose="05000000000000000000" pitchFamily="2" charset="2"/><a:buChar char="v"/><a:defRPr sz="1800"><a:latin typeface="Times New Roman"/></a:defRPr></a:pPr><a:endParaRPr lang="en-GB" dirty="0"/></a:p></p:txBody></p:sp><p:pic><p:nvPicPr><p:cNvPr id="5" name="Picture 4"',
            "<a:lstStyle/>"
            + bullets_wingdings("v", meth)
            + '</p:txBody></p:sp><p:pic><p:nvPicPr><p:cNvPr id="5" name="Picture 4"',
            "slide5",
        )

        test = [
            "Sign-in: valid users alice / alice123; compare Diagnostics — Site A shows literals, Site B shows ? template.",
            "Inventory: normal search (e.g. Notebook) on both; syllabus exercises on Site A URL parameters only.",
            "Chrome breach-password warnings are browser heuristics on weak demo passwords — not a Site B bug.",
        ]
        rep(
            os.path.join(slides, "slide6.xml"),
            '<a:lstStyle/><a:p><a:pPr><a:buFont typeface="Wingdings" panose="05000000000000000000" pitchFamily="2" charset="2"/><a:buChar char="Ø"/><a:defRPr sz="1800"><a:latin typeface="Times New Roman"/></a:defRPr></a:pPr><a:endParaRPr lang="en-GB" dirty="0"/></a:p></p:txBody></p:sp><p:pic><p:nvPicPr><p:cNvPr id="4098"',
            "<a:lstStyle/>"
            + bullets_wingdings("Ø", test)
            + '</p:txBody></p:sp><p:pic><p:nvPicPr><p:cNvPr id="4098"',
            "slide6",
        )

        conc = [
            "Glue vs fix: Site A pastes user text inside the SQL sentence; Site B keeps the sentence fixed and fills ? slots only.",
            "Defense: parameterization, least-privilege DB roles, allow-lists for sort columns, avoid leaking DB errors in production.",
            "Ethics: test only systems you own or are assigned; remove public demos after assessment.",
        ]
        rep(
            os.path.join(slides, "slide7.xml"),
            "<a:p><a:pPr><a:defRPr sz=\"1800\"><a:latin typeface=\"Times New Roman\"/></a:defRPr></a:pPr>"
            '<a:endParaRPr lang="en-GB" dirty="0"/></a:p></p:txBody></p:sp><p:pic><p:nvPicPr><p:cNvPr id="5122"',
            plain_paras(conc) + '</p:txBody></p:sp><p:pic><p:nvPicPr><p:cNvPr id="5122"',
            "slide7",
        )

        if os.path.isfile(out):
            os.remove(out)
        zip_dir(d, out)
        print("Wrote:", out)
    finally:
        import shutil

        shutil.rmtree(d, ignore_errors=True)


if __name__ == "__main__":
    main()
