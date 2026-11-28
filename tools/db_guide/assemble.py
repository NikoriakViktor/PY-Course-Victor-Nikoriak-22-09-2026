"""Збирає «Бази даних: загальна картина» з фрагментів у module_3/bonus/Бази даних — загальна картина.html.

    python tools/db_guide/assemble.py                           # повний гайд у репо
    python tools/db_guide/assemble.py --out /tmp/t.html         # кудись інде
    python tools/db_guide/assemble.py --repo 11-11-2026 --out <інший репо>/module_3/bonus/...html
                                                                # посилання на репозиторій 11-11-2026

Спільні частини (head зі стилями й темами, extra.css, helpers.js, nav.js) беремо з tools/algorithms_guide —
обидва гайди виглядають і керуються однаково. Свої секції — frag_<name>.html / .js / .css з цієї папки.
miniredis.js — навчальна модель Redis для пісочниці й демонстрацій (іде одразу після helpers.js).
Порядок секцій і розділи меню — CHAPTERS."""
import glob, json, os, re, sys
D = os.path.dirname(os.path.abspath(__file__))
SHARED = os.path.join(D, "..", "algorithms_guide")
TITLE = "Бази даних: загальна картина"
CHAPTERS = [
    ("map", "1 · Карта", ["kart", "whatis", "kudy"]),
    ("ent", "2 · Сутності", ["ent", "life"]),
    ("redis", "3 · Redis зсередини", ["types", "sandbox"]),
    ("pat", "4 · Патерни", ["cache", "limit", "queues", "claim", "multi", "retry"]),
    ("arch", "5 · Архітектура проєкту", ["arch", "trace", "why", "methods"]),
    ("design", "6 · Проєктуємо свою базу", ["design", "survey", "builder"]),
    ("olap", "7 · Аналітика", ["olap"]),
    ("road", "8 · Роадмап і задачі", ["road", "tasks"]),
]
args = sys.argv[1:]
out = os.path.join(D, "..", "..", "module_3", "bonus", f"Бази даних — загальна картина.html")
if "--out" in args: out = args[args.index("--out") + 1]
read = lambda p: open(p, encoding="utf-8").read() if os.path.exists(p) else ""
names = sorted({os.path.basename(p)[5:].rsplit(".", 1)[0] for p in glob.glob(os.path.join(D, "frag_*.*"))})
names = sorted(names, key=lambda n: (n != "base", n))
sections = {}
for n in names:
    for m in re.finditer(r'<section class="lesson" id="([^"]+)".*?</section>', read(os.path.join(D, f"frag_{n}.html")), re.S):
        if m.group(1) in sections: sys.exit(f"duplicate section id {m.group(1)} in frag_{n}")
        sections[m.group(1)] = m.group(0)
ordered = [i for _, _, ids in CHAPTERS for i in ids]
missing = [i for i in ordered if i not in sections]
extra = [i for i in sections if i not in ordered]
if extra: sys.exit(f"sections not in CHAPTERS: {extra}")
if missing and "--allow-missing" not in args: sys.exit(f"sections missing: {missing}")
head = read(os.path.join(SHARED, "base_head.html")).replace("<title>Алгоритми наживо — повний гайд</title>", f"<title>{TITLE}</title>")
css = read(os.path.join(SHARED, "extra.css")) + "".join(read(os.path.join(D, f"frag_{n}.css")) for n in names)
js = "".join(f"\n/* ---------- frag_{n} ---------- */\n" + read(os.path.join(D, f"frag_{n}.js")) for n in names)
html = f"""{head}
<style>
{css}</style>

<header class="top"><div class="wrap">
  <h1>{TITLE}</h1>
  <p>PostgreSQL, Redis і DuckDB як одна система на прикладі «Смачно + Таксі»: що де лежить, хто й якою командою це змінює і чому саме так. Спершу карта, потім сутності, типи Redis, патерни, архітектура проєкту <code>taxi_delivery_redis</code> і аналітика. «Крок →» — вручну, «▶ Старт» — автоматично.</p>
</div></header>

<nav class="tabs" aria-label="Розділи гайду"><div class="wrap" id="tabbar"></div><div class="wrap sub" id="subbar"></div></nav>

<main class="wrap">
{chr(10).join(sections[i] for i in ordered if i in sections)}
</main>
<footer class="wrap">Бази даних: загальна картина · гайд курсу Python, модуль 3 · PostgreSQL · Redis · DuckDB</footer>

<script>
(function(){{
'use strict';
{read(os.path.join(SHARED, "helpers.js"))}
{read(os.path.join(D, "miniredis.js"))}
const CHAPTERS={json.dumps(CHAPTERS, ensure_ascii=False)};
{js}
{read(os.path.join(SHARED, "nav.js"))}
}})();
</script>

</body></html>
"""
# Другий репозиторій курсу має інші шляхи до DuckDB і ноутбука PostgreSQL
LINKS_FOR = {"11-11-2026": [
    ("u:BOOK+'m3/bonus_duckdb/'", "u:REPO+'module_3/lessons/lesson_30_sql_basics/README_dashboard.md'"),
    ("postgresql/note_lesson_30_postgresql_updated.ipynb", "postgresql/note_lesson_30_postgresql.ipynb"),
]}
if "--repo" in args:
    target = args[args.index("--repo") + 1]
    html = html.replace("PY-Course-Victor-Nikoriak-22-09-2026", f"PY-Course-Victor-Nikoriak-{target}")
    for a, b in LINKS_FOR.get(target, []):
        if a not in html: sys.exit(f"--repo {target}: не знайшов {a!r}")
        html = html.replace(a, b)
open(out, "w", encoding="utf-8").write(html)
print(f"wrote {os.path.normpath(out)}: {len(sections)} sections, {len(html)//1024} KB; missing: {missing}")
