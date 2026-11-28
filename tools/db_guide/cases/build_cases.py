"""Справи вкладки «Розслідування»: дані + питання + еталонні відповіді → cases.json.

    python tools/db_guide/cases/build_cases.py      # перебудувати cases.json і перевірити всі SQL-відповіді в SQLite

Дані генеруються детерміновано (random.Random(seed)). Для SQL-справ скрипт виконує кожну еталонну
відповідь у sqlite3 і перевіряє, що вона веде до винного. Redis-справу перевіряє browser_check.py (MiniRedis)."""
import json, os, random, sqlite3, sys

HERE = os.path.dirname(os.path.abspath(__file__))
COURIERS = [("c1", "Олег", "велосипед"), ("c2", "Марія", "скутер"), ("c3", "Андрій", "авто"),
            ("c4", "Тарас", "скутер"), ("c5", "Оксана", "скутер"), ("c6", "Богдан", "велосипед"), ("c7", "Ірина", "скутер")]
DISTRICTS = ["Поділ", "Оболонь", "Печерськ", "Дарниця", "Святошин", "Голосіїв"]

def sql_lit(v):
    if v is None: return "NULL"
    if isinstance(v, (int, float)): return repr(v)
    return "'" + str(v).replace("'", "''") + "'"

def inserts(table, cols, rows):
    return f"INSERT INTO {table} ({', '.join(cols)}) VALUES\n" + ",\n".join("  (" + ", ".join(sql_lit(v) for v in r) + ")" for r in rows) + ";\n"

def hm(m): return f"{m // 60:02d}:{m % 60:02d}"

# ---------------- справа 1: зниклий борщ ----------------
def case_borsch():
    rnd = random.Random(1)
    day = "2026-11-14 "
    schema = """CREATE TABLE couriers (id TEXT PRIMARY KEY, name TEXT NOT NULL, vehicle TEXT NOT NULL);
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer TEXT, restaurant TEXT, district TEXT,
                     courier_id TEXT REFERENCES couriers(id), status TEXT, created_at TEXT, delivered_at TEXT);
CREATE TABLE gps (courier_id TEXT REFERENCES couriers(id), ts TEXT, district TEXT);
CREATE TABLE status_log (order_id INTEGER REFERENCES orders(id), ts TEXT, status TEXT, device TEXT);
"""
    data = inserts("couriers", ["id", "name", "vehicle"], COURIERS)
    # маршрути 21:00–22:00 кожні 5 хв
    route = {"c1": ["Поділ"] * 6 + ["Оболонь"] * 7, "c2": ["Голосіїв"] * 5 + ["Печерськ"] * 6 + ["Голосіїв"] * 2,
             "c3": ["Дарниця"] * 13, "c4": ["Печерськ"] * 3 + ["Поділ"] * 3 + ["Оболонь"] * 7,
             "c5": ["Святошин"] * 8 + ["Поділ"] * 5, "c6": ["Поділ"] * 4 + ["Дарниця"] * 9,
             "c7": ["Поділ"] * 4 + ["Печерськ"] * 7 + ["Поділ"] * 2}
    gps = [(c, day + hm(21 * 60 + 5 * i), d) for c, ds in route.items() for i, d in enumerate(ds)]
    gps.sort(key=lambda r: (r[1], r[0]))
    data += inserts("gps", ["courier_id", "ts", "district"], gps)
    orders, log = [], []
    rest = {"Поділ": "Піца Поділ", "Оболонь": "Суші Оболонь", "Печерськ": "Борщ на Печерську", "Дарниця": "Бургер Дарниця", "Святошин": "Вега Святошин", "Голосіїв": "Борщ Голосіїв"}
    oid = 1030
    for c, ds in route.items():
        for k in (1, 7):
            if k + 4 >= len(ds): continue
            oid += 1
            if oid == 1042: oid += 1
            cr, dl = 21 * 60 + 5 * k, 21 * 60 + 5 * (k + 4)
            orders.append((oid, f"client-{rnd.randint(10, 60)}", rest[ds[k]], ds[k + 4], c, "delivered", day + hm(cr), day + hm(dl)))
            log += [(oid, day + hm(cr), "new", "api"), (oid, day + hm(cr + 1), "assigned", "dispatcher-d1"),
                    (oid, day + hm(cr + 9), "picked_up", f"phone-{c}"), (oid, day + hm(dl), "delivered", f"phone-{c}")]
    orders.append((1042, "client-31", "Борщ на Печерську", "Печерськ", "c4", "delivered", day + "21:12", day + "21:40"))
    log += [(1042, day + "21:12", "new", "api"), (1042, day + "21:13", "assigned", "dispatcher-d1"),
            (1042, day + "21:24", "picked_up", "phone-c7"), (1042, day + "21:40", "delivered", "phone-c7")]
    orders.sort(); log.sort(key=lambda r: (r[1], r[0]))
    data += inserts("orders", ["id", "customer", "restaurant", "district", "courier_id", "status", "created_at", "delivered_at"], orders)
    data += inserts("status_log", ["order_id", "ts", "status", "device"], log)
    T = "'2026-11-14 21:30' AND '2026-11-14 21:50'"
    return {
        "id": "borsch", "engine": "sql", "store": "pg", "level": "🟢", "title": "Зниклий борщ",
        "topics": "SELECT · WHERE · BETWEEN · LIKE · ORDER BY",
        "brief": "14 листопада о 21:40 замовлення <b>№1042</b> («Борщ на Печерську», клієнтка <code>client-31</code>) позначено «доставлено». Клієнтка каже: ніхто не приходив і борщу немає. У замовленні вказаний кур'єр <b>c4 Тарас</b>. Він клянеться, що в той час був на Оболоні. Хтось бреше — знайди хто.",
        "schema": schema, "data": data,
        "questions": [
            {"q": "Почни з місця злочину: виведи все про замовлення 1042.", "a": "SELECT * FROM orders WHERE id = 1042;",
             "hint": "<code>SELECT *</code> — усі колонки; <code>WHERE id = …</code> — лише потрібний рядок.", "ordered": False,
             "clue": "За документами замовлення віз <b>c4</b> і «доставив» о 21:40 на Печерськ."},
            {"q": "Перевір алібі c4: де він був з 21:30 до 21:50? Колонки <code>ts</code> і <code>district</code>, за часом.",
             "a": f"SELECT ts, district FROM gps\nWHERE courier_id = 'c4' AND ts BETWEEN {T}\nORDER BY ts;",
             "hint": "Таблиця <code>gps</code>; дві умови через <code>AND</code>; час — <code>BETWEEN '2026-11-14 21:30' AND '2026-11-14 21:50'</code>.", "ordered": True,
             "clue": "GPS підтверджує алібі: увесь цей час c4 був на <b>Оболоні</b>. Він не міг привезти борщ на Печерськ."},
            {"q": "Хто з кур'єрів був на Печерську з 21:30 до 21:50? Виведи лише різні <code>courier_id</code>.",
             "a": f"SELECT DISTINCT courier_id FROM gps\nWHERE district = 'Печерськ' AND ts BETWEEN {T};",
             "hint": "<code>SELECT DISTINCT</code> прибирає повтори.", "ordered": False,
             "clue": "На Печерську в цей час були двоє: <b>c2</b> і <b>c7</b>."},
            {"q": "Хто натискав кнопки в замовленні 1042 з телефона кур'єра? Записи <code>status_log</code>, де <code>device</code> починається з <code>phone-</code>, за часом.",
             "a": "SELECT ts, status, device FROM status_log\nWHERE order_id = 1042 AND device LIKE 'phone-%'\nORDER BY ts;",
             "hint": "<code>LIKE 'phone-%'</code>: <code>%</code> — будь-які символи далі.", "ordered": True,
             "clue": "«Забрав» і «доставлено» натиснуто з телефона <b>phone-c7</b>, а не c4. c2 тут ні до чого."},
            {"q": "Назви підозрювану: ім'я і транспорт кур'єра, з чийого телефона закрили замовлення.",
             "a": "SELECT name, vehicle FROM couriers WHERE id = 'c7';",
             "hint": "Пристрій <code>phone-c7</code> → кур'єр з <code>id = 'c7'</code>.", "ordered": False,
             "clue": "Це <b>Ірина</b>."}],
        "verdict": "<b>Ірина (c7)</b> забрала чуже замовлення й закрила його зі свого телефона, а в замовленні лишився c4. Що виправити в системі: «доставлено» може натиснути лише кур'єр, призначений на замовлення. Це правило варто перевіряти на сервері, а не в додатку.",
        "culprit": [["Ірина", "скутер"]]}

# ---------------- справа 2: каса ----------------
def case_cash():
    rnd = random.Random(2)
    schema = """CREATE TABLE couriers (id TEXT PRIMARY KEY, name TEXT NOT NULL, vehicle TEXT NOT NULL);
CREATE TABLE orders (id INTEGER PRIMARY KEY, courier_id TEXT REFERENCES couriers(id),
                     payment TEXT CHECK (payment IN ('cash', 'card')), total NUMERIC NOT NULL, delivered_at TEXT);
CREATE TABLE cash_handover (order_id INTEGER REFERENCES orders(id), amount NUMERIC NOT NULL, ts TEXT);
"""
    data = inserts("couriers", ["id", "name", "vehicle"], COURIERS)
    orders, hand = [], []
    oid = 2000
    for i in range(42):
        oid += 1; c = COURIERS[i % 7][0]
        pay = "cash" if i % 3 != 1 else "card"
        total = rnd.choice([90, 120, 150, 180, 210, 240, 260, 300, 330, 400, 415, 450])
        t = 9 * 60 + 15 * i
        orders.append((oid, c, pay, total, f"2026-11-20 {hm(t)}"))
    # підкрутки
    stolen = []
    for o in orders:
        if o[2] != "cash": continue
        if o[1] == "c6" and len(stolen) < 3: stolen.append(o[0]); continue
        amt = o[3] - 5 if o[1] == "c3" and o[3] == max(x[3] for x in orders if x[1] == "c3" and x[2] == "cash") else o[3]
        hand.append((o[0], amt, o[4][:11] + "21:00"))
    data += inserts("orders", ["id", "courier_id", "payment", "total", "delivered_at"], orders)
    data += inserts("cash_handover", ["order_id", "amount", "ts"], hand)
    short = sum(o[3] for o in orders if o[0] in stolen)
    return {
        "id": "cash", "engine": "sql", "store": "pg", "level": "🟡", "title": "Каса не сходиться",
        "topics": "GROUP BY · JOIN · LEFT JOIN · HAVING · CASE",
        "brief": f"20 листопада. Кур'єри беруть готівку за замовлення й увечері здають її в касу (<code>cash_handover</code>: одне здавання — одне замовлення). Бухгалтерка рахує: за готівковими замовленнями мало бути більше, ніж у касі. Різниця — <b>{short + 5} грн</b>. Хто взяв гроші, а хто просто помилився з решткою?",
        "schema": schema, "data": data,
        "questions": [
            {"q": "Скільки готівкових замовлень (<code>payment = 'cash'</code>) у кожного кур'єра? Колонки: <code>courier_id</code>, кількість.",
             "a": "SELECT courier_id, COUNT(*) AS n\nFROM orders\nWHERE payment = 'cash'\nGROUP BY courier_id;",
             "hint": "<code>GROUP BY courier_id</code> і <code>COUNT(*)</code>.", "ordered": False,
             "clue": "Готівку возили всі сім кур'єрів — підозрюваних поки що сім."},
            {"q": "Готівкові замовлення, за якими гроші в касу <b>не здали взагалі</b>: <code>id</code>, <code>courier_id</code>, <code>total</code>.",
             "a": "SELECT o.id, o.courier_id, o.total\nFROM orders AS o\nLEFT JOIN cash_handover AS h ON h.order_id = o.id\nWHERE o.payment = 'cash' AND h.order_id IS NULL;",
             "hint": "<code>LEFT JOIN</code> лишає замовлення навіть без пари в <code>cash_handover</code>; у такого рядка <code>h.order_id IS NULL</code>.", "ordered": False,
             "clue": f"Три замовлення без здавання, усі в <b>c6</b>: {', '.join(map(str, stolen))}."},
            {"q": "Де гроші здали, але <b>менше</b>, ніж коштувало замовлення? <code>id</code>, <code>courier_id</code>, <code>total</code>, <code>amount</code>.",
             "a": "SELECT o.id, o.courier_id, o.total, h.amount\nFROM orders AS o\nJOIN cash_handover AS h ON h.order_id = o.id\nWHERE h.amount < o.total;",
             "hint": "Звичайний <code>JOIN</code> — лише пари, що є в обох таблицях; умова <code>h.amount &lt; o.total</code>.", "ordered": False,
             "clue": "Одне замовлення в <b>c3</b>: здав на 5 грн менше. Схоже на «не було решти»."},
            {"q": "Нестача по кожному кур'єру: <code>courier_id</code> і сума <code>total - здано</code> за готівковими замовленнями. Лише ті, в кого нестача більша за 0.",
             "a": "SELECT o.courier_id, SUM(o.total - COALESCE(h.amount, 0)) AS shortage\nFROM orders AS o\nLEFT JOIN cash_handover AS h ON h.order_id = o.id\nWHERE o.payment = 'cash'\nGROUP BY o.courier_id\nHAVING SUM(o.total - COALESCE(h.amount, 0)) > 0;",
             "hint": "<code>COALESCE(h.amount, 0)</code> — «не здав» = 0. Фільтр по сумі групи — <code>HAVING</code>, а не <code>WHERE</code>.", "ordered": False,
             "clue": f"Нестача: c6 — <b>{short} грн</b>, c3 — 5 грн."},
            {"q": "Вердикт: ім'я кур'єра, нестача і висновок <code>CASE</code>: більше 100 грн → <code>'крадіжка'</code>, інакше <code>'похибка'</code>. Лише кур'єри з нестачею, від більшої до меншої.",
             "a": "SELECT c.name,\n       SUM(o.total - COALESCE(h.amount, 0)) AS shortage,\n       CASE WHEN SUM(o.total - COALESCE(h.amount, 0)) > 100\n            THEN 'крадіжка' ELSE 'похибка' END AS verdict\nFROM orders AS o\nJOIN couriers AS c ON c.id = o.courier_id\nLEFT JOIN cash_handover AS h ON h.order_id = o.id\nWHERE o.payment = 'cash'\nGROUP BY c.name\nHAVING SUM(o.total - COALESCE(h.amount, 0)) > 0\nORDER BY shortage DESC;",
             "hint": "Поєднай попередній запит з <code>JOIN couriers</code> і додай <code>CASE WHEN … THEN … ELSE … END</code>.", "ordered": True,
             "clue": "Висновок готовий."}],
        "verdict": f"<b>Богдан (c6)</b> не здав гроші за три замовлення: {short} грн. Андрій (c3) винен 5 грн — це решта, а не крадіжка. Чому правда в PostgreSQL: гроші — це факт, який має пережити будь-що, а <code>LEFT JOIN … IS NULL</code> знаходить «чого бракує».",
        "culprit": [["Богдан", short, "крадіжка"], ["Андрій", 5, "похибка"]]}

# ---------------- справа 3: Redis ----------------
def case_redis():
    setup = [
        "SADD couriers:all c1 c3 c5 c7", "SADD couriers:free c1 c5",
        "HSET courier:c3 name Андрій status busy order_id 81",
        "HSET courier:c7 name Ірина status busy order_id 79",
        "HSET order:77 customer client-12 restaurant_id 2 status assigned courier_id c3 assigned_by d2",
        "HSET order:79 customer client-25 restaurant_id 1 status picked_up courier_id c7 assigned_by d1",
        "HSET order:81 customer client-40 restaurant_id 5 status picked_up courier_id c3 assigned_by d1",
        "HSET dispatcher:d1 version 2.3 claim SREM started 20:00",
        "HSET dispatcher:d2 version 1.0 claim SISMEMBER+HSET started 20:55",
        'LPUSH events:log "21:01:58 d1: SREM couriers:free c7 → 1 → c7 на #79"',
        'LPUSH events:log "21:02:09 d2: SISMEMBER couriers:free c3 → 1 (вільний?)"',
        'LPUSH events:log "21:02:10 d1: SREM couriers:free c3 → 1 → c3 на #81"',
        'LPUSH events:log "21:02:11 d2: HSET order:77 courier_id c3 (без SREM)"',
        'LPUSH events:log "21:09:40 simulator: c3 забрав #81"',
        "ZADD orders:active 1 77 2 79 3 81",
    ]
    return {
        "id": "redis", "engine": "redis", "store": "rd", "level": "⚡", "title": "Один кур'єр — два замовлення",
        "topics": "HGETALL · HGET · SISMEMBER · LRANGE · KEYS",
        "brief": "21:30. Клієнт <code>client-12</code> чекає замовлення №77 уже пів години: у додатку написано «кур'єр призначений», але ніхто не їде. У PostgreSQL цього замовлення ще немає — воно живе лише в Redis. Розслідуй за станом Redis: хто й чому «віддав» кур'єра.",
        "setup": setup,
        "questions": [
            {"q": "Подивись картку замовлення 77 — усі поля.", "a": "HGETALL order:77", "need": ["c3", "d2", "assigned"],
             "hint": "Картка — це HASH: <code>HGETALL &lt;ключ&gt;</code>. Не знаєш ключів — <code>KEYS *</code>.",
             "clue": "На #77 призначено <b>c3</b>, призначив диспетчер <b>d2</b>."},
            {"q": "Що зараз робить кур'єр c3? Подивись його картку.", "a": "HGETALL courier:c3", "need": ["81", "busy"],
             "hint": "Ключ кур'єра — <code>courier:c3</code>.",
             "clue": "c3 зайнятий, але везе <b>№81</b>, а не 77."},
            {"q": "Хто призначив c3 на замовлення 81? Прочитай одне поле.", "a": "HGET order:81 assigned_by", "need": ["d1"],
             "hint": "Одне поле HASH — <code>HGET &lt;ключ&gt; &lt;поле&gt;</code>.",
             "clue": "На #81 його взяв <b>d1</b>. Двоє диспетчерів віддали одного кур'єра на два замовлення."},
            {"q": "Що сталося о 21:02? Прочитай увесь журнал подій.", "a": "LRANGE events:log 0 -1", "need": ["SISMEMBER", "SREM", "без SREM"],
             "hint": "Журнал — LIST: <code>LRANGE &lt;ключ&gt; 0 -1</code> (від першого до останнього).",
             "clue": "21:02:09 d2 лише <b>перевірив</b> SISMEMBER → «вільний». За секунду d1 атомарно <b>забрав</b> c3 через SREM. Ще за секунду d2 записав c3 на #77, не забираючи з множини."},
            {"q": "Чим d2 відрізняється від d1? Подивись налаштування диспетчера d2.", "a": "HGETALL dispatcher:d2", "need": ["1.0", "SISMEMBER"],
             "hint": "Ключ — <code>dispatcher:d2</code>.",
             "clue": "d2 — стара версія 1.0: «перевірити, потім записати». Між двома командами вклинився d1."},
        ],
        "verdict": "Винна <b>стара версія диспетчера d2</b>: о 20:55 її запустили поруч з новою. Вона перевіряє кур'єра (<code>SISMEMBER</code>) і окремою командою записує його в замовлення — це гонка «перевірив, потім зайняв». d1 правильно захоплює через <code>SREM</code>: перевірка й захоплення в одній атомарній команді. Виправлення: зупинити d2 і повернути #77 у чергу. Порівняй з вкладкою «Захоплення кур'єра».",
    }

# ---------------- справа 4: DuckDB ----------------
def case_teleport():
    rnd = random.Random(4)
    schema = """CREATE TABLE couriers (id TEXT PRIMARY KEY, name TEXT NOT NULL, vehicle TEXT NOT NULL);
CREATE TABLE gps (courier_id TEXT, t_min INTEGER, ts TEXT, x_km REAL, y_km REAL);   -- t_min: хвилина від 09:00
CREATE TABLE deliveries (order_id INTEGER, courier_id TEXT, t_min INTEGER);
"""
    data = inserts("couriers", ["id", "name", "vehicle"], COURIERS)
    gps, dels = [], []
    jumps = {20: (9.0, 2.0), 46: (-8.5, -1.5), 80: (8.0, 3.0)}
    oid = 5000
    for c, _, _ in COURIERS:
        x, y = rnd.uniform(-5, 5), rnd.uniform(-5, 5)
        for k in range(61):
            t = 2 * k
            if k:
                if c == "c5" and t in jumps: dx, dy = jumps[t]
                elif c == "c2" and t == 50: dx, dy = 1.2, 0.4
                else: dx, dy = rnd.uniform(-0.5, 0.5), rnd.uniform(-0.4, 0.4)
                x, y = x + dx, y + dy
            gps.append((c, t, hm(9 * 60 + t), round(x, 2), round(y, 2)))
            if (k % 9 == 4) or (c == "c5" and (t in jumps or k % 9 == 7)):
                oid += 1; dels.append((oid, c, t))
    data += inserts("gps", ["courier_id", "t_min", "ts", "x_km", "y_km"], gps)
    data += inserts("deliveries", ["order_id", "courier_id", "t_min"], dels)
    S = """WITH moves AS (
  SELECT courier_id, ts, t_min,
         ABS(x_km - LAG(x_km) OVER w) + ABS(y_km - LAG(y_km) OVER w) AS km,
         t_min - LAG(t_min) OVER w AS minutes
  FROM gps
  WINDOW w AS (PARTITION BY courier_id ORDER BY t_min)
), speed AS (
  SELECT courier_id, ts, t_min, km / minutes * 60 AS kmh FROM moves WHERE minutes IS NOT NULL
)"""
    return {
        "id": "teleport", "engine": "sql", "store": "dk", "level": "🔴", "title": "Телепорт",
        "topics": "оконні функції: RANK · LAG · PARTITION BY · WITH",
        "brief": "Звіт за ранок: кур'єр-переможець отримує бонус за найбільшу кількість доставок. Аналітик помітив, що лідер «доставляє» неправдоподібно швидко. Дані — вивантаження GPS (точка кожні 2 хв, координати в км на сітці міста) і доставок. Відстань рахуємо «по кварталах»: <code>|Δx| + |Δy|</code>. Знайди, хто підробляв GPS.",
        "engine_note": "Запити виконує SQLite у браузері. Усе, що тут потрібно (<code>WITH</code>, <code>LAG</code>, <code>RANK</code>, <code>PARTITION BY</code>), у DuckDB пишеться так само; там запит запускають прямо по parquet: <code>FROM 'gps.parquet'</code>.",
        "schema": schema, "data": data,
        "questions": [
            {"q": "Рейтинг за доставками: <code>courier_id</code>, кількість доставок і місце <code>RANK()</code>, від більшої кількості.",
             "a": "SELECT courier_id, COUNT(*) AS n,\n       RANK() OVER (ORDER BY COUNT(*) DESC) AS place\nFROM deliveries\nGROUP BY courier_id\nORDER BY place;",
             "hint": "Віконна функція рахується після <code>GROUP BY</code>, тож у ній можна писати <code>COUNT(*)</code>: <code>RANK() OVER (ORDER BY COUNT(*) DESC)</code>.", "ordered": False,
             "clue": "Лідер з великим відривом — <b>c5</b>."},
            {"q": "Перші 6 точок c5: <code>ts</code>, <code>x_km</code>, <code>y_km</code> і координати попередньої точки <code>prev_x</code>, <code>prev_y</code> (через <code>LAG</code>).",
             "a": "SELECT ts, x_km, y_km,\n       LAG(x_km) OVER (ORDER BY t_min) AS prev_x,\n       LAG(y_km) OVER (ORDER BY t_min) AS prev_y\nFROM gps\nWHERE courier_id = 'c5'\nORDER BY t_min\nLIMIT 6;",
             "hint": "<code>LAG(колонка) OVER (ORDER BY t_min)</code> — значення з попереднього рядка; у першого рядка його немає (NULL).", "ordered": True,
             "clue": "LAG дає «де був 2 хв тому». Тепер можна рахувати швидкість."},
            {"q": "Максимальна швидкість кожного кур'єра (км/год, округли до 1 знака), від найбільшої. Відстань — <code>|Δx| + |Δy|</code>, час — різниця <code>t_min</code>. Порада: <code>WITH</code> і <code>PARTITION BY courier_id</code>.",
             "a": S + "\nSELECT courier_id, ROUND(MAX(kmh), 1) AS max_kmh\nFROM speed\nGROUP BY courier_id\nORDER BY max_kmh DESC;",
             "hint": "<code>LAG(x_km) OVER (PARTITION BY courier_id ORDER BY t_min)</code> — попередня точка того самого кур'єра. Швидкість = км / хвилини * 60.", "ordered": True,
             "clue": "У всіх до ~40 км/год, у c2 одного разу ~48 (скутер, правдоподібно). У <b>c5</b> — понад 300 км/год."},
            {"q": "Усі «стрибки» — переміщення швидше за 80 км/год: <code>courier_id</code>, <code>ts</code>, швидкість (округлена до 1 знака), за часом.",
             "a": S + "\nSELECT courier_id, ts, ROUND(kmh, 1) AS kmh\nFROM speed\nWHERE kmh > 80\nORDER BY t_min;",
             "hint": "Той самий <code>WITH</code>, а фільтр — у фінальному <code>SELECT</code>.", "ordered": True,
             "clue": "Три телепорти, усі в <b>c5</b>, кожен — на ~10 км за 2 хв."},
            {"q": "Доказ: ім'я кур'єра і скільки доставок він зарахував <b>у ту саму хвилину</b>, коли «телепортувався».",
             "a": S + "\nSELECT c.name, COUNT(*) AS fake\nFROM speed AS s\nJOIN deliveries AS d ON d.courier_id = s.courier_id AND d.t_min = s.t_min\nJOIN couriers AS c ON c.id = s.courier_id\nWHERE s.kmh > 80\nGROUP BY c.name;",
             "hint": "З'єднай стрибки з <code>deliveries</code> за двома умовами: той самий кур'єр і та сама <code>t_min</code>.", "ordered": False,
             "clue": "Кожен стрибок — це доставка."}],
        "verdict": "<b>Оксана (c5)</b> підробляла GPS: телепортувалась до клієнта, щоб закрити доставку й набрати бонус. Усі три «доставки» припадають на стрибки. Чому це задача для DuckDB: треба пройти по всіх точках усіх кур'єрів і порівняти кожну з попередньою. Це важкий аналітичний запит по історії, і живу базу ним не навантажують.",
        "culprit": [["Оксана", 3]]}

CASES = [case_borsch(), case_cash(), case_redis(), case_teleport()]

def run_sql(c, q):
    con = sqlite3.connect(":memory:"); con.executescript(c["schema"] + c["data"])
    return con.execute(q).fetchall()

ok = True
for c in CASES:
    if c["engine"] != "sql": continue
    for i, q in enumerate(c["questions"], 1):
        rows = run_sql(c, q["a"])
        print(f"{c['id']} Q{i}: {len(rows)} рядків · {rows[:4]}")
        if not rows: ok = False; print("   ✗ порожньо")
    last = [list(r) for r in run_sql(c, c["questions"][-1]["a"])]
    if last != c["culprit"]: ok = False; print("   ✗ винний не збігся:", last, "≠", c["culprit"])
if not ok: sys.exit(1)
json.dump(CASES, open(os.path.join(HERE, "cases.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("cases.json:", os.path.getsize(os.path.join(HERE, "cases.json")) // 1024, "KB")
