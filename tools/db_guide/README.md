# «Бази даних: загальна картина» — вихідники

Інтерактивний гайд `module_3/bonus/Бази даних — загальна картина.html`: PostgreSQL, Redis і DuckDB як одна система
на прикладі «Смачно + Таксі» та проєкту `module_3/lessons/taxi_delivery_redis`.
HTML самодостатній, його можна просто відкрити в браузері. **Не редагуй HTML вручну**: правки — тут, потім збірка.

## Збірка й перевірка

```bash
python tools/db_guide/assemble.py                      # → module_3/bonus/Бази даних — загальна картина.html
python tools/db_guide/browser_check.py                 # усі анімації, режими й кнопки в браузері, помилки JS
python tools/db_guide/checks/check_sandbox.py          # пісочниця = справжній Redis (99 команд)
python tools/db_guide/checks/check_code.py             # Python-код з гайду проти Redis і DuckDB
```

Для перевірок: `pip install playwright redis duckdb && playwright install chromium` і Redis на `localhost:6379`
(`docker run -d --name redis_lab -p 6379:6379 redis:8`). Перевірки працюють у базі 14 і відмовляються, якщо вона не порожня.

## Як влаштовано

Спільні частини беруться з `tools/algorithms_guide` (`base_head.html`, `extra.css`, `helpers.js` з `Runner`/`controls`/`code`/`course`, `nav.js`), тож обидва гайди виглядають і керуються однаково.

| Файл | Що в ньому |
|---|---|
| `assemble.py` | збирач; `CHAPTERS` задає вкладки й порядок секцій |
| `miniredis.js` | `MiniRedis` — навчальна модель Redis (пісочниця, демонстрації); `rfmt` — відповідь у форматі `redis-cli` |
| `frag_base.*` | стилі гайду; хелпери `keys()` (ключі Redis «коробками»), `pgt()` (таблиця PostgreSQL), `logs()` (рядки логів); вкладка «Карта» |
| `frag_ent.*` | «Сутності»: ER-схема, картки сутностей, життя замовлення |
| `frag_redis.*` | типи Redis ↔ структури Python, пісочниця |
| `frag_pat.*` | патерни: кеш, лічильник і rate limit, три черги, захоплення кур'єра, MULTI/EXEC, відкладений повтор |
| `frag_arch.*` | схема сервісів (`ARCH`, `archSvg`), замовлення наскрізь з логами, «чому так», шпаргалка |
| `frag_design.*` | «Проєктуємо свою базу»: що таке кожне сховище, 7 кроків проєктування з місцями в коді, опитувальник, конструктор схеми |
| `frag_olap.*`, `frag_road.*` | аналітика (рядки проти колонок), роадмап, задачі |

Правило змісту: усе, що гайд каже про проєкт (ключі, функції, команди, рядки логів), має збігатися з кодом
`taxi_delivery_redis`. Змінив проєкт — онови `frag_arch.js` (шпаргалка `M`, траса `T`) і `frag_ent.js`.
