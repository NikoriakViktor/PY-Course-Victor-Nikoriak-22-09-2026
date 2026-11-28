"""Браузерна перевірка гайду (потрібен playwright: pip install playwright && playwright install chromium).

    python tools/db_guide/browser_check.py ["module_3/bonus/Бази даних — загальна картина.html"] [--shots DIR]

Відкриває кожну секцію, проганяє кожну анімацію до кінця в кожному режимі (усі варіанти <select>),
клацає тренажер, пісочницю й схему. Друкує помилки JS. Свій Chromium — змінна CHROMIUM_PATH."""
import os, pathlib, sys
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parents[2]
argv = sys.argv[1:]
shots = argv.pop(argv.index("--shots") + 1) if "--shots" in argv else None
args = [a for a in argv if not a.startswith("--")]
page = pathlib.Path(args[0]) if args else ROOT / "module_3" / "bonus" / "Бази даних — загальна картина.html"
RUN = """sid => { const out = []; const sec = document.getElementById(sid);
  const play = () => { for (const btn of sec.querySelectorAll('.controls .btn.primary[id$="-play"]')) {
      const idp = btn.id.replace(/-play$/, ''); const step = document.getElementById(idp + '-step');
      let k = 0; document.getElementById(idp + '-reset').click();
      while (!step.disabled && k < 3000) { step.click(); k++; } out.push(idp + ':' + k); } };
  const sels = [...sec.querySelectorAll('.controls select')];
  if (!sels.length) play();
  for (const s of sels) for (const o of s.options) { s.value = o.value; s.dispatchEvent(new Event('change')); play(); }
  sec.querySelectorAll('.qz .q').forEach(q => q.querySelector('button').click());
  sec.querySelectorAll('#sandbox-presets button, #survey-presets button, #builder-tpl button, #design-flow .node, .store, .er .tb, svg.arch [data-b]').forEach(b => b.dispatchEvent(new MouseEvent('click', {bubbles: true})));
  return out.join(' '); }"""
bad = 0
with sync_playwright() as pw:
    exe = os.environ.get("CHROMIUM_PATH")
    b = pw.chromium.launch(**({"executable_path": exe} if exe else {}))
    for theme in (["light", "dark"] if shots else ["light"]):
        pg = b.new_page(viewport={"width": 1280, "height": 900}, color_scheme=theme); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: m.type == "error" and errs.append("console: " + m.text))
        pg.goto(page.resolve().as_uri()); pg.wait_for_timeout(300)
        if errs: print("load errors:", errs); bad += 1
        for sid in pg.eval_on_selector_all("section.lesson", "els => els.map(e => e.id)"):
            errs.clear(); pg.evaluate(f"showSection('{sid}', false)"); res = pg.evaluate(RUN, sid)
            if shots:
                os.makedirs(shots, exist_ok=True); pg.screenshot(path=f"{shots}/{theme}_{sid}.png", full_page=True)
            bad += bool(errs); print(f"{sid:10s} {res:48s} {'ERR ' + '; '.join(errs) if errs else 'ok'}")
        pg.close()
    b.close()
sys.exit(1 if bad else 0)
