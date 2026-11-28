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


# ---------------- справа 5: шматок піци ----------------
def case_pizza():
    rnd = random.Random(5)
    schema = """CREATE TABLE couriers (id TEXT PRIMARY KEY, name TEXT NOT NULL, vehicle TEXT NOT NULL);
CREATE TABLE orders (id INTEGER PRIMARY KEY, courier_id TEXT REFERENCES couriers(id), restaurant TEXT,
                     created_at TEXT, delivered_at TEXT, minutes INTEGER);
CREATE TABLE reviews (order_id INTEGER REFERENCES orders(id), stars INTEGER CHECK (stars BETWEEN 1 AND 5), text TEXT);
CREATE TABLE stops (courier_id TEXT REFERENCES couriers(id), ts TEXT, place TEXT, minutes INTEGER);
"""
    data = inserts("couriers", ["id", "name", "vehicle"], COURIERS)
    good = ["Все гаряче, дякую!", "Швидко і ввічливо", "Нормально", "Кур'єр молодець", "Трохи довго, але ок", "Супер, рекомендую"]
    orders, reviews, stops = [], [], []
    bad = {3006, 3013, 3020}
    for i in range(28):
        oid = 3000 + i + 1; c = COURIERS[i % 7][0]
        if oid in bad: c = "c2"
        elif c == "c2": c = "c4"
        start = 18 * 60 + 12 * i
        mins = rnd.randint(45, 52) if oid in bad else rnd.randint(18, 34)
        orders.append((oid, c, "Піца Поділ", f"2026-11-22 {hm(start)}", f"2026-11-22 {hm(start + mins)}", mins))
        if oid in bad:
            reviews.append((oid, 1, rnd.choice(["Піца холодна, і бракує шматка!", "Бракує шматка піци, коробка м'ята", "Знову без одного шматка. Що за жарти?"])))
            stops.append(("c2", f"2026-11-22 {hm(start + 15)}", "Парк Шевченка, лавка", rnd.randint(14, 18)))
        elif rnd.random() < 0.6:
            reviews.append((oid, rnd.randint(4, 5), rnd.choice(good)))
        for _ in range(2):
            stops.append((c, f"2026-11-22 {hm(start + rnd.randint(3, 15))}", rnd.choice(["світлофор", "ресторан: видача", "під'їзд клієнта", "АЗС"]), rnd.randint(1, 6)))
    stops.append(("c5", "2026-11-22 19:40", "АЗС", 12))
    reviews[2] = (reviews[2][0], 3, "Піца ціла, але холодна")
    stops.sort(key=lambda r: r[1])
    data += inserts("orders", ["id", "courier_id", "restaurant", "created_at", "delivered_at", "minutes"], orders)
    data += inserts("reviews", ["order_id", "stars", "text"], reviews)
    data += inserts("stops", ["courier_id", "ts", "place", "minutes"], stops)
    return {
        "id": "pizza", "engine": "sql", "store": "pg", "level": "🟢", "title": "Шматок піци",
        "topics": "LIKE · IN · ORDER BY · вкладений SELECT",
        "brief": "«Піца Поділ» отримує дивні відгуки: піца приїжджає холодна, а в коробці бракує шматка. Ресторан клянеться, що віддає піцу цілою. Між рестораном і клієнтом — лише кур'єр. Знайди, хто й де «обідає».",
        "schema": schema, "data": data,
        "questions": [
            {"q": "Знайди відгуки, в яких є слово «шматк» (шматка, шматок…): <code>order_id</code>, <code>stars</code>, <code>text</code>.",
             "a": "SELECT order_id, stars, text FROM reviews WHERE text LIKE '%шматк%';",
             "hint": "<code>LIKE '%шматк%'</code> — «містить шматк» будь-де в тексті.", "ordered": False,
             "clue": "Три скарги на шматок: замовлення 3006, 3013, 3020. «Просто холодна» не рахується."},
            {"q": "Хто віз ці три замовлення і скільки хвилин? <code>id</code>, <code>courier_id</code>, <code>minutes</code>, за <code>id</code>.",
             "a": "SELECT id, courier_id, minutes FROM orders\nWHERE id IN (3006, 3013, 3020)\nORDER BY id;",
             "hint": "<code>WHERE id IN (…, …, …)</code> — коротше, ніж три <code>OR</code>.", "ordered": True,
             "clue": "Усі три віз <b>c2</b>, і кожне їхало 45+ хв, а звичайно — 20–30."},
            {"q": "Довгі зупинки: усі зупинки довші за 10 хв (<code>courier_id</code>, <code>ts</code>, <code>place</code>, <code>minutes</code>), від найдовшої.",
             "a": "SELECT courier_id, ts, place, minutes FROM stops\nWHERE minutes > 10\nORDER BY minutes DESC;",
             "hint": "Таблиця <code>stops</code>, <code>ORDER BY minutes DESC</code>.", "ordered": False,
             "clue": "Три довгі зупинки c2 на <b>лавці в Парку Шевченка</b> і одна в c5 на АЗС (заправка, скарг немає)."},
            {"q": "Зупинки c2 у парку: <code>ts</code>, <code>place</code>, <code>minutes</code>, за часом. Порівняй час із замовленнями.",
             "a": "SELECT ts, place, minutes FROM stops\nWHERE courier_id = 'c2' AND place LIKE '%Парк%'\nORDER BY ts;",
             "hint": "Дві умови: кур'єр і <code>place LIKE '%Парк%'</code>.", "ordered": True,
             "clue": "Кожна зупинка в парку — рівно посеред одного з трьох «обскубаних» замовлень."},
            {"q": "Назви підозрювану одним запитом: ім'я кур'єра, який віз замовлення з відгуків про «шматк». Підказка: вкладений <code>SELECT</code> в <code>IN (…)</code>.",
             "a": "SELECT name FROM couriers\nWHERE id IN (SELECT courier_id FROM orders\n             WHERE id IN (SELECT order_id FROM reviews WHERE text LIKE '%шматк%'));",
             "hint": "Зсередини назовні: відгуки → id замовлень → courier_id → ім'я.", "ordered": False,
             "clue": "Це <b>Марія</b>."}],
        "verdict": "<b>Марія (c2)</b> зупинялась на лавці в парку й пригощалась шматком піци. Звідси і холодна піца: 15 хв на лавці. Як систему зробити чеснішою: пломба-наліпка на коробці й автоматичне сповіщення, якщо зупинка під час доставки довша за 10 хв.",
        "culprit": [["Марія"]]}

# ---------------- справа 6: накручений рейтинг ----------------
def case_rating():
    rnd = random.Random(6)
    PH = "+380671112233"
    schema = """CREATE TABLE couriers (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL);
CREATE TABLE customers (id TEXT PRIMARY KEY, phone TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE ratings (order_id INTEGER, courier_id TEXT REFERENCES couriers(id),
                      customer_id TEXT REFERENCES customers(id), stars INTEGER CHECK (stars BETWEEN 1 AND 5), ts TEXT);
"""
    cour = [(c, n, PH if c == "c1" else f"+38050{rnd.randint(1000000, 9999999)}") for c, n, _ in COURIERS]
    data = inserts("couriers", ["id", "name", "phone"], cour)
    cust = [(f"client-{i}", f"+38063{rnd.randint(1000000, 9999999)}", f"2026-{rnd.randint(1, 10):02d}-{rnd.randint(1, 28):02d}") for i in range(1, 61)]
    fakes = [(f"client-{i}", PH, "2026-11-25") for i in range(201, 210)]
    data += inserts("customers", ["id", "phone", "created_at"], cust + fakes)
    rat, oid = [], 4000
    for c, _, _ in COURIERS:
        for _ in range(14 if c != "c1" else 12):
            oid += 1
            st = rnd.choice([3, 4, 4, 4, 5]) if c != "c1" else rnd.choice([3, 3, 4, 4, 4])
            rat.append((oid, c, rnd.choice(cust)[0], st, f"2026-11-{rnd.randint(1, 27):02d}"))
    for f_ in fakes:
        oid += 1; rat.append((oid, "c1", f_[0], 5, "2026-11-26"))
    rat.sort(key=lambda r: r[0])
    data += inserts("ratings", ["order_id", "courier_id", "customer_id", "stars", "ts"], rat)
    return {
        "id": "rating", "engine": "sql", "store": "pg", "level": "🟡", "title": "Накручений рейтинг",
        "topics": "AVG · GROUP BY · HAVING · JOIN · підзапит",
        "brief": "Кур'єр місяця отримує премію 3000 грн — у кого найвищий середній рейтинг. Цього місяця лідер несподівано вирвався вперед за останні два дні. Служба підтримки підозрює накрутку. Знайди, звідки взялися п'ятірки.",
        "schema": schema, "data": data,
        "questions": [
            {"q": "Середній рейтинг кожного кур'єра (округли до 2 знаків) і кількість оцінок: <code>courier_id</code>, <code>avg</code>, <code>n</code>.",
             "a": "SELECT courier_id, ROUND(AVG(stars), 2) AS avg, COUNT(*) AS n\nFROM ratings\nGROUP BY courier_id\nORDER BY avg DESC;",
             "hint": "<code>AVG(stars)</code>, <code>ROUND(…, 2)</code>, <code>GROUP BY courier_id</code>.", "ordered": False,
             "clue": "Лідер — <b>c1</b>, і в нього найбільше оцінок."},
            {"q": "Хто ставив оцінки c1 з акаунтів, створених не раніше 25 листопада? <code>customer_id</code>, <code>created_at</code>, <code>stars</code>.",
             "a": "SELECT r.customer_id, c.created_at, r.stars\nFROM ratings AS r\nJOIN customers AS c ON c.id = r.customer_id\nWHERE r.courier_id = 'c1' AND c.created_at >= '2026-11-25';",
             "hint": "<code>JOIN customers</code> за <code>customer_id</code>, потім дві умови.", "ordered": False,
             "clue": "Дев'ять свіжих акаунтів, створених одного дня, — і всі поставили c1 п'ятірку."},
            {"q": "Чи є телефони, на які зареєстровано більше одного акаунта? <code>phone</code> і кількість акаунтів.",
             "a": "SELECT phone, COUNT(*) AS accounts\nFROM customers\nGROUP BY phone\nHAVING COUNT(*) > 1;",
             "hint": "<code>GROUP BY phone</code> + <code>HAVING COUNT(*) &gt; 1</code>.", "ordered": False,
             "clue": f"Один номер — <b>{PH}</b> — має 9 акаунтів."},
            {"q": "Чесний рейтинг c1: середня оцінка (2 знаки) <b>без</b> оцінок з акаунтів на телефоні, де акаунтів більше одного.",
             "a": "SELECT ROUND(AVG(r.stars), 2) AS honest_avg\nFROM ratings AS r\nJOIN customers AS c ON c.id = r.customer_id\nWHERE r.courier_id = 'c1'\n  AND c.phone NOT IN (SELECT phone FROM customers GROUP BY phone HAVING COUNT(*) > 1);",
             "hint": "Попередній запит стає підзапитом у <code>NOT IN (…)</code>.", "ordered": False,
             "clue": "Без накрутки c1 опускається в самий низ рейтингу."},
            {"q": "Чий це телефон? Ім'я кур'єра, чий <code>phone</code> збігається з телефоном «багатоакаунтника».",
             "a": "SELECT name FROM couriers\nWHERE phone IN (SELECT phone FROM customers GROUP BY phone HAVING COUNT(*) > 1);",
             "hint": "Знову підзапит із запитання 3, тепер у таблиці <code>couriers</code>.", "ordered": False,
             "clue": "Це <b>Олег</b>."}],
        "verdict": "<b>Олег (c1)</b> зареєстрував 9 акаунтів на свій номер і сам поставив собі п'ятірки. Що виправити: один телефон — один акаунт (<code>UNIQUE (phone)</code> у таблиці <code>customers</code>), і оцінку може поставити лише той, хто справді отримав замовлення.",
        "culprit": [["Олег"]]}

# ---------------- справа 7: Redis, нічний стрибок ----------------
def case_redis_lb():
    setup = ["ZADD lb:couriers:deliveries 14 c1 12 c2 9 c3 61 c4 13 c5",
             "HSET courier:c1 name Олег deliveries_today 14 status free", "HSET courier:c2 name Марія deliveries_today 12 status busy",
             "HSET courier:c3 name Андрій deliveries_today 9 status free", "HSET courier:c4 name Тарас deliveries_today 11 status busy",
             "HSET courier:c5 name Оксана deliveries_today 13 status free",
             "HSET client:dispatcher owner system role service", "HSET client:simulator owner system role service",
             "HSET client:dashboard-dev owner c4 role стажер-розробник created 2026-11-27 note тестовий-скрипт",
             'LPUSH monitor:log "02:58:10 [dashboard-dev] CLIENT SETNAME dashboard-dev"',
             'LPUSH monitor:log "03:12:44 [dashboard-dev] ZINCRBY lb:couriers:deliveries 50 c4"',
             'LPUSH monitor:log "03:12:45 [dashboard-dev] ZREVRANGE lb:couriers:deliveries 0 2 WITHSCORES"',
             'LPUSH monitor:log "08:01:03 [simulator] ZINCRBY lb:couriers:deliveries 1 c1"',
             'LPUSH monitor:log "08:20:41 [simulator] ZINCRBY lb:couriers:deliveries 1 c4"',
             'LPUSH monitor:log "08:31:17 [simulator] ZINCRBY lb:couriers:deliveries 1 c5"']
    return {
        "id": "redis-lb", "engine": "redis", "store": "rd", "level": "⚡", "title": "Нічний стрибок у рейтингу",
        "topics": "ZREVRANGE · ZSCORE · HGET · LRANGE · HGETALL",
        "brief": "Ранок. На дашборді диспетчерської рейтинг кур'єрів за доставками, і там дивина: хтось за ніч обійшов усіх на 50 доставок. Але вночі служба не працює. Рейтинг — це <code>ZSET</code> у Redis. Знайди, хто й як його змінив.",
        "setup": setup,
        "questions": [
            {"q": "Подивись топ-3 рейтингу разом з балами.", "a": "ZREVRANGE lb:couriers:deliveries 0 2 WITHSCORES", "need": ["c4", "61"],
             "hint": "Від більшого до меншого — <code>ZREVRANGE &lt;ключ&gt; 0 2 WITHSCORES</code>.",
             "clue": "Перший — <b>c4</b> з <b>61</b> доставкою. Другий — 14."},
            {"q": "Скільки доставок c4 насправді зробив сьогодні? Поле в його картці.", "a": "HGET courier:c4 deliveries_today", "need": ["11"],
             "hint": "Картка кур'єра — <code>courier:c4</code>, поле <code>deliveries_today</code>.",
             "clue": "Насправді <b>11</b>. Рейтинг каже 61: різниця — рівно 50."},
            {"q": "Хто змінював рейтинг? Прочитай увесь журнал команд <code>monitor:log</code>.", "a": "LRANGE monitor:log 0 -1", "need": ["ZINCRBY lb:couriers:deliveries 50 c4", "dashboard-dev"],
             "hint": "LIST: <code>LRANGE monitor:log 0 -1</code>. Шукай команду, яка додає 50.",
             "clue": "О 03:12 клієнт <b>dashboard-dev</b> виконав <code>ZINCRBY … 50 c4</code>. Сервіси додають лише по 1."},
            {"q": "Що це за клієнт <code>dashboard-dev</code>? Подивись його картку.", "a": "HGETALL client:dashboard-dev", "need": ["c4", "стажер"],
             "hint": "Ключ — <code>client:dashboard-dev</code>.",
             "clue": "Його власник — <b>c4</b>, стажер-розробник дашборду."},
            {"q": "Як звати кур'єра c4?", "a": "HGET courier:c4 name", "need": ["Тарас"],
             "hint": "Поле <code>name</code> у картці <code>courier:c4</code>.", "clue": "Це <b>Тарас</b>."}],
        "verdict": "<b>Тарас (c4)</b> підробляє стажером на дашборді й уночі тестовим скриптом додав собі 50 доставок. Два уроки. 1) Рейтинг у Redis — лише <b>копія</b>: правда — це доставлені замовлення в PostgreSQL, тож рейтинг можна перерахувати (<code>SELECT courier_id, COUNT(*) FROM orders GROUP BY courier_id</code>). 2) Не давай усім клієнтам права на запис: у Redis є користувачі й ACL (<code>ACL SETUSER dashboard … +@read</code>), а дашборду досить читати.",
    }

# ---------------- справа 8: Redis, застрягле замовлення ----------------
def case_redis_stuck():
    I = lambda n: f"1700000000000-{n}"
    setup = ["XGROUP CREATE orders:new dispatchers 0 MKSTREAM"] + [f"XADD orders:new {I(i)} order_id {88 + i}" for i in range(4)] + [
        "XREADGROUP GROUP dispatchers d1 COUNT 2 STREAMS orders:new >", f"XACK orders:new dispatchers {I(0)} {I(1)}",
        "XREADGROUP GROUP dispatchers d3 COUNT 1 STREAMS orders:new >",
        "XREADGROUP GROUP dispatchers d2 COUNT 1 STREAMS orders:new >", f"XACK orders:new dispatchers {I(3)}",
        "HSET order:88 status delivered courier_id c1", "HSET order:89 status picked_up courier_id c5",
        "HSET order:90 customer client-77 status new created 21:41", "HSET order:91 status assigned courier_id c2",
        "SADD dispatchers:alive d1 d2",
        'LPUSH events:log "21:40:02 d3: старт (тестовий запуск з ноутбука розробника)"',
        'LPUSH events:log "21:41:15 d3: XREADGROUP → взяв #90"',
        'LPUSH events:log "21:41:16 d3: Killed — ноутбук закрили, процес зник"',
        'LPUSH events:log "21:41:20 d2: XREADGROUP → взяв #91, XACK"']
    return {
        "id": "redis-stuck", "engine": "redis", "store": "rd", "level": "⚡", "title": "Замовлення-привид",
        "topics": "Stream: XPENDING · XREADGROUP 0 · SMEMBERS · LRANGE",
        "brief": "Клієнт <code>client-77</code> замовив о 21:41. Зараз 22:05, і замовлення №90 досі «нове»: кур'єра не шукали. Інші замовлення, і раніші, і пізніші, давно в дорозі. Черга — Redis Stream <code>orders:new</code> з групою <code>dispatchers</code>. Знайди, де застрягло замовлення, і витягни його.",
        "setup": setup,
        "questions": [
            {"q": "Подивись картку замовлення 90.", "a": "HGETALL order:90", "need": ["new"],
             "hint": "<code>HGETALL order:90</code>.", "clue": "Статус <b>new</b> уже 24 хв: диспетчер його так і не обробив."},
            {"q": "Чи є в групі <code>dispatchers</code> видані, але не підтверджені повідомлення? І за ким вони?", "a": "XPENDING orders:new dispatchers", "need": ["d3"],
             "hint": "<code>XPENDING &lt;stream&gt; &lt;group&gt;</code> — скільки непідтверджених і за якими споживачами.",
             "clue": "Одне повідомлення висить за споживачем <b>d3</b>."},
            {"q": "Які диспетчери зараз живі?", "a": "SMEMBERS dispatchers:alive", "need": ["d1", "d2"],
             "hint": "Множина <code>dispatchers:alive</code>.",
             "clue": "Живі лише <b>d1</b> і <b>d2</b>. d3 немає."},
            {"q": "Що сталося з d3? Прочитай журнал подій.", "a": "LRANGE events:log 0 -1", "need": ["Killed"],
             "hint": "<code>LRANGE events:log 0 -1</code>.",
             "clue": "d3 — тестовий запуск з ноутбука: узяв #90 і зник, не надіславши XACK. Stream не загубив замовлення, але d3 уже не повернеться, щоб його доробити."},
            {"q": "Врятуй замовлення: прочитай повідомлення, що висять за d3 (від імені d3, з id <code>0</code>).", "a": "XREADGROUP GROUP dispatchers d3 STREAMS orders:new 0", "need": ["90"],
             "hint": "З id <code>0</code> споживач отримує <b>свої</b> непідтверджені: <code>XREADGROUP GROUP dispatchers d3 STREAMS orders:new 0</code>.",
             "clue": "Ось воно: <b>order_id 90</b>. Тепер його можна обробити й підтвердити XACK."}],
        "verdict": "Винний — <b>тестовий диспетчер d3</b>: його запустили з ноутбука в робочу групу, він узяв замовлення й зник. Stream зберіг повідомлення в pending: саме тому замовлення не загубилось. Але наш <code>dispatcher.run()</code> перечитує лише <b>свої</b> pending. У справжній системі живі диспетчери забирають чужі завислі повідомлення командою <code>XAUTOCLAIM orders:new dispatchers d1 60000 0</code> («усе, що висить понад 60 с»). Це задача 🔴 з роадмапу. А тестові запуски — лише в окремій групі або на окремому Redis.",
    }

# ---------------- справа 9: DuckDB, без перерви ----------------
def case_nobreak():
    rnd = random.Random(9)
    schema = """CREATE TABLE couriers (id TEXT PRIMARY KEY, name TEXT NOT NULL, vehicle TEXT NOT NULL);
CREATE TABLE pings (courier_id TEXT, t_min INTEGER, ts TEXT);   -- додаток онлайн; t_min — хвилина від 00:00
"""
    data = inserts("couriers", ["id", "name", "vehicle"], COURIERS)
    plan = {"c1": [(6 * 60, 17 * 60 + 30)], "c2": [(8 * 60, 12 * 60), (13 * 60, 17 * 60)], "c3": [(10 * 60, 14 * 60), (14 * 60 + 45, 19 * 60)],
            "c4": [(7 * 60, 11 * 60 + 30), (12 * 60 + 15, 15 * 60)], "c5": [(12 * 60, 16 * 60), (16 * 60 + 40, 21 * 60)],
            "c6": [(6 * 60, 11 * 60), (12 * 60, 17 * 60 + 30)], "c7": [(9 * 60, 13 * 60 + 30)]}
    pings = []
    for c, sess in plan.items():
        for a, b in sess:
            t = a
            while t <= b:
                pings.append((c, t, hm(t)))
                t += rnd.choice([5, 5, 5, 5, 10, 15]) if c in ("c1", "c6") else rnd.choice([5, 5, 5, 10])
    pings.sort(key=lambda r: (r[1], r[0]))
    data += inserts("pings", ["courier_id", "t_min", "ts"], pings)
    G = """WITH g AS (
  SELECT courier_id, t_min, ts,
         t_min - LAG(t_min) OVER (PARTITION BY courier_id ORDER BY t_min) AS gap
  FROM pings
), s AS (
  SELECT *, SUM(CASE WHEN gap IS NULL OR gap >= 30 THEN 1 ELSE 0 END)
              OVER (PARTITION BY courier_id ORDER BY t_min) AS session
  FROM g
), runs AS (
  SELECT courier_id, session, MIN(ts) AS start, MAX(ts) AS finish, MAX(t_min) - MIN(t_min) AS minutes
  FROM s GROUP BY courier_id, session
)"""
    return {
        "id": "nobreak", "engine": "sql", "store": "dk", "level": "🔴", "title": "Без перерви",
        "topics": "gaps & islands: LAG · CASE · SUM() OVER · WITH",
        "brief": "Правило безпеки служби: не більше <b>8 годин підряд</b> без перерви щонайменше 30 хв. Після вчорашньої аварії (кур'єр заснув на світлофорі, усі цілі) треба перевірити вивантаження пінгів додатка за день: поки кур'єр онлайн, додаток пінгує кожні 5–15 хв. Хто порушив правило?",
        "engine_note": "Запити виконує SQLite у браузері; у DuckDB вони пишуться так само, тільки <code>FROM 'pings.parquet'</code>. Це класична задача «gaps and islands»: розірви ряд там, де пауза ≥ 30 хв, і поміряй кожен шматок.",
        "schema": schema, "data": data,
        "questions": [
            {"q": "Скільки хвилин кожен був онлайн «по годиннику»: від першого до останнього пінгу (<code>courier_id</code>, <code>first</code>, <code>last</code>, <code>span</code>), від найбільшого <code>span</code>.",
             "a": "SELECT courier_id, MIN(ts) AS first, MAX(ts) AS last, MAX(t_min) - MIN(t_min) AS span\nFROM pings\nGROUP BY courier_id\nORDER BY span DESC;",
             "hint": "<code>MAX(t_min) - MIN(t_min)</code> по кожному кур'єру.", "ordered": False,
             "clue": "Найдовші дні в <b>c6</b> і <b>c1</b> — по 11,5 год. Але чи були перерви?"},
            {"q": "Паузи між пінгами c1, довші за 5 хв: <code>ts</code> і <code>gap</code> (хв від попереднього пінгу), за часом.",
             "a": "SELECT ts, gap FROM (\n  SELECT ts, t_min, t_min - LAG(t_min) OVER (ORDER BY t_min) AS gap\n  FROM pings WHERE courier_id = 'c1'\n) WHERE gap > 5\nORDER BY t_min;",
             "hint": "<code>t_min - LAG(t_min) OVER (ORDER BY t_min)</code>; фільтр по вікну — лише зовні, у підзапиті.", "ordered": True,
             "clue": "У c1 найдовша пауза — 15 хв. Перерви ≥ 30 хв немає жодної."},
            {"q": "Скільки справжніх перерв (пауза ≥ 30 хв) у кожного кур'єра? <code>courier_id</code>, <code>breaks</code>.",
             "a": "SELECT courier_id, SUM(CASE WHEN gap >= 30 THEN 1 ELSE 0 END) AS breaks\nFROM (\n  SELECT courier_id, t_min - LAG(t_min) OVER (PARTITION BY courier_id ORDER BY t_min) AS gap\n  FROM pings\n)\nGROUP BY courier_id;",
             "hint": "<code>PARTITION BY courier_id</code> у LAG, а потім <code>SUM(CASE WHEN gap &gt;= 30 THEN 1 ELSE 0 END)</code>.", "ordered": False,
             "clue": "У c6 перерва є (обід о 11:00), у c7 зміна коротка, а в <b>c1</b> — <b>0 перерв</b>."},
            {"q": "Найдовша безперервна робота кожного кур'єра: розріж пінги на «сесії» (нова сесія — коли пауза ≥ 30 хв або перший пінг), поміряй кожну й візьми максимум. <code>courier_id</code>, <code>longest</code> (хв), від найбільшого.",
             "a": G + "\nSELECT courier_id, MAX(minutes) AS longest\nFROM runs\nGROUP BY courier_id\nORDER BY longest DESC;",
             "hint": "Номер сесії = накопичувальна сума «тут почалась нова»: <code>SUM(CASE …) OVER (PARTITION BY courier_id ORDER BY t_min)</code>. Далі <code>GROUP BY courier_id, session</code>.", "ordered": True,
             "clue": "c1 — <b>690 хв</b> (11,5 год) без перерви. Решта — не більше 5,5 год."},
            {"q": "Протокол: ім'я, початок, кінець і тривалість кожної сесії довшої за 8 год (480 хв).",
             "a": G + "\nSELECT c.name, r.start, r.finish, r.minutes\nFROM runs AS r JOIN couriers AS c ON c.id = r.courier_id\nWHERE r.minutes > 480;",
             "hint": "Той самий <code>WITH</code>, потім <code>JOIN couriers</code> і <code>WHERE minutes &gt; 480</code>.", "ordered": False,
             "clue": "Порушення одне."}],
        "verdict": "<b>Олег (c1)</b> працював з 06:00 до 17:30 без перерви — 11,5 год. У Богдана (c6) день такий самий довгий, але з обідньою годиною, і це за правилами. Саме тому рахують не «скільки годин онлайн», а <b>найдовший безперервний шматок</b>. Це задача для аналітики по історії: рахується раз на день по вивантаженню, а не на живій базі.",
        "culprit": [["Олег", "06:00", "17:30", 690]]}

CASES = [case_borsch(), case_pizza(), case_cash(), case_rating(), case_redis(), case_redis_lb(), case_redis_stuck(), case_teleport(), case_nobreak()]

# ---------------- ігровий шар: оповідач, підозрювані, історія кожного кроку ----------------
EXTRA = {
 "borsch": dict(place="Печерськ, Київ", time="14 листопада, 21:12–21:40", narrator="🕵️ Слідча Ліна Гордієнко",
   goal="Довести, хто насправді закрив замовлення №1042, і назвати ім'я.", culprit_id="c7",
   suspects=[["c4", "Тарас", "скутер", "«Я був на Оболоні, возив суші. Борщу в очі не бачив!»"],
             ["c7", "Ірина", "скутер", "«Того вечора я каталась по Подолу. На Печерськ не заїжджала»."],
             ["c2", "Марія", "скутер", "«Я возила свої замовлення з Голосієва. Чуже мені не треба»."]],
   stories=["Почнемо з паперів. Що каже система про саме замовлення: хто віз, куди, о котрій «доставлено»? Не вір нікому, вір рядку в таблиці.",
            "Тарас каже, що був на Оболоні. Добре, перевіримо. Додаток кур'єра пінгує GPS кожні 5 хв — таблиця <code>gps</code>. Нас цікавить проміжок навколо «доставки»: 21:30–21:50.",
            "Якщо Тарас чистий, то хто був поруч із клієнткою? Хтось мусив бути на Печерську саме тоді.",
            "Кожне натискання кнопки в додатку лишає слід у <code>status_log</code>: що натиснули, коли і з якого пристрою. Цікавлять лише телефони кур'єрів — пристрої <code>phone-…</code>.",
            "Пристрій знайдено. Лишилось назвати людину: кому належить цей телефон?"]),
 "pizza": dict(place="«Піца Поділ» → клієнти Подолу", time="22 листопада, вечір", narrator="👨‍🍳 Шеф «Піци Поділ» Марко",
   goal="Знайти, хто «пробує» піцу дорогою, і де він це робить.", culprit_id="c2",
   suspects=[["c2", "Марія", "скутер", "«Затори, світлофори, ви ж знаєте вечірній Поділ»."],
             ["c5", "Оксана", "скутер", "«Я заправлялась один раз. Скарг на мене немає»."],
             ["c4", "Тарас", "скутер", "«Я возив піцу весь вечір, і все було ціле»."]],
   stories=["Я віддаю піцу цілою, присягаюсь! Почитай, що пишуть клієнти. Мене цікавлять скарги саме на «шматок», не на «холодну».",
            "Три скарги. Хто віз ці замовлення і скільки вони їхали? Звичайна доставка в нас — 20–30 хв.",
            "Сорок п'ять хвилин на дорогу в 3 км? Додаток пише всі зупинки кур'єрів (<code>stops</code>). Подивись, хто стояв довше за 10 хвилин.",
            "Одна людина стояла довго тричі, і щоразу в тому самому місці. Склади протокол цих зупинок за часом і зістав із часом замовлень.",
            "Час збігається. Оформимо одним запитом, щоб і бухгалтерія зрозуміла: від скарг до імені кур'єра."]),
 "cash": dict(place="Каса служби доставки", time="20 листопада, кінець дня", narrator="🧮 Бухгалтерка Ніна Петрівна",
   goal="Знайти, хто взяв гроші, і відрізнити крадіжку від помилки з рештою.", culprit_id="c6",
   suspects=[["c6", "Богдан", "велосипед", "«Я все здав. Мабуть, каса помилилась»."],
             ["c3", "Андрій", "авто", "«Решти в мене не було, клієнт махнув рукою: не треба»."],
             ["c1", "Олег", "велосипед", "«У мене все до копійки, перевіряйте»."]],
   stories=["Каса не б'ється, а я не люблю, коли не б'ється. Спершу простий облік: скільки готівкових замовлень було в кожного?",
            "Тепер найпростіший вид нестачі: гроші взяли, а в касу не здали зовсім. Таке замовлення є в <code>orders</code>, але не має пари в <code>cash_handover</code>.",
            "Буває й інакше: здав, але менше. Таке теж треба знайти — тут уже звичайний JOIN.",
            "Зведемо все разом: нестача по кожному кур'єру. Тих, у кого все чисто, не показуй.",
            "Мені потрібен документ для директора: ім'я, сума і висновок, крадіжка це чи похибка. Поріг — 100 грн."]),
 "rating": dict(place="Відділ якості", time="кінець листопада", narrator="⭐ Менеджерка якості Аліна",
   goal="З'ясувати, чи чесний рейтинг лідера, і хто накрутив оцінки.", culprit_id="c1",
   suspects=[["c1", "Олег", "велосипед", "«Мене просто люблять клієнти. Я ввічливий»."],
             ["c7", "Ірина", "скутер", "«У мене чесна четвірка з плюсом. Перевіряйте»."],
             ["c4", "Тарас", "скутер", "«Рейтинг? Я про нього навіть не думаю»."]],
   stories=["Премія — 3000 грн, тож усе має бути чисто. Покажи середній рейтинг кожного кур'єра і скільки в нього оцінок.",
            "У лідера оцінок більше, ніж у всіх. Хто ці щедрі клієнти? Мене насторожують нові акаунти, створені з 25 листопада.",
            "Дев'ять нових акаунтів за день — дивно. Подивимось, на які телефони реєструють акаунти: чи нема номера, на якому їх кілька?",
            "Перерахуй рейтинг лідера чесно: без оцінок з того «багатоакаунтного» телефона.",
            "Лишилось головне: чий це номер? Телефони кур'єрів є в їхній таблиці."]),
 "redis": dict(place="Redis диспетчерської", time="21:02 → 21:30", narrator="📞 Диспетчерка Леся",
   goal="Знайти, чому кур'єра «віддали» двом замовленням одночасно.", culprit_id="d2",
   suspects=[["d1", "диспетчер d1", "версія 2.3", "«Я беру кур'єра через SREM. Взяв — значить, мій»."],
             ["d2", "диспетчер d2", "версія 1.0", "«Я перевірив: кур'єр був вільний!»"],
             ["c3", "Андрій", "кур'єр", "«Мені прийшло #81, я на нього і поїхав. Про #77 нічого не знаю»."]],
   stories=["Клієнт кричить у трубку: кур'єр «призначений», але не їде. Подивись, що в Redis написано про замовлення 77.",
            "Кур'єр c3. А що він сам каже про себе — тобто що в його картці?",
            "Він везе інше замовлення. Хто його туди призначив?",
            "Два диспетчери, один кур'єр. Мені потрібна хронологія: усе, що вони робили, пишеться в <code>events:log</code>.",
            "d1 і d2 поводяться по-різному. Подивимось, що це за диспетчер d2 і яка в нього версія."]),
 "redis-lb": dict(place="Дашборд диспетчерської", time="ніч 27→28 листопада", narrator="📊 Керівниця зміни Олена",
   goal="Знайти, хто й як змінив рейтинг уночі.", culprit_id="c4",
   suspects=[["c4", "Тарас", "кур'єр + стажер", "«Я вночі сплю! І рейтинг мені не потрібен»."],
             ["c1", "Олег", "кур'єр", "«Я другий у рейтингу. Мені невигідно когось піднімати»."],
             ["simulator", "сервіс simulator", "система", "«Я додаю рівно 1 за кожну доставку»."]],
   stories=["Відкриваю дашборд, а там диво: хтось за ніч обійшов усіх. Покажи топ-3 рейтингу з балами.",
            "61 доставка до ранку? Перевір, скільки доставок записано в картці самого кур'єра.",
            "Різниця рівно 50. Хтось змінив рейтинг напряму. Наш Redis пише журнал команд у <code>monitor:log</code>. Шукай ZINCRBY, який додає не 1.",
            "Клієнт з іменем <code>dashboard-dev</code>? Сервісу з такою назвою в нас немає. Подивись, чий він.",
            "Власник — c4. Як його звати, щоб я знала, з ким говорити?"]),
 "redis-stuck": dict(place="Черга orders:new", time="21:41 → 22:05", narrator="📞 Диспетчерка Леся",
   goal="Знайти, де застрягло замовлення №90, і витягти його з черги.", culprit_id="d3",
   suspects=[["d1", "диспетчер d1", "живий", "«Я взяв 88 і 89, усе підтвердив»."],
             ["d2", "диспетчер d2", "живий", "«Я взяв 91 і підтвердив»."],
             ["d3", "диспетчер d3", "???", "(не відповідає)"]],
   stories=["Клієнт чекає 24 хвилини, а кур'єра навіть не шукали. Подивись картку замовлення 90.",
            "Замовлення в черзі є, але «нове». Може, хтось його взяв і не підтвердив? Stream пам'ятає, що кому видано.",
            "Висить за споживачем d3. А d3 у нас взагалі працює? Живі диспетчери відмічаються в множині <code>dispatchers:alive</code>.",
            "d3 серед живих немає. Що з ним сталося? Подивись журнал.",
            "Зрозуміло. Замовлення не загублене: Stream тримає його за d3. Витягни його — прочитай від імені d3 його непідтверджені повідомлення."]),
 "teleport": dict(place="Аналітика: GPS за ранок", time="ранок, 09:00–11:00", narrator="📈 Аналітик Денис",
   goal="Знайти, хто підробляв GPS, щоб набрати бонус.", culprit_id="c5",
   suspects=[["c5", "Оксана", "скутер", "«Я просто швидко їжджу і знаю короткі шляхи»."],
             ["c2", "Марія", "скутер", "«Мій скутер розганяється до 50. Буває, лечу»."],
             ["c7", "Ірина", "скутер", "«У мене сьоме місце. Мене точно не підозрюйте»."]],
   stories=["Бонус отримує лідер за доставками. Почнемо з таблиці лідерів: скільки доставок у кожного і хто на якому місці.",
            "Лідер з великим відривом. Подивимось на його трек. Щоб рахувати переміщення, кожній точці потрібна попередня — це робить <code>LAG</code>.",
            "Тепер швидкість. Відстань по кварталах: |Δx| + |Δy| км за різницю хвилин. Порахуй для всіх кур'єрів і подивись максимум.",
            "300+ км/год на скутері? Знайди всі такі «телепорти»: де, коли і в кого.",
            "Останній доказ: якщо телепорт — шахрайство, то в ту ж хвилину має бути «доставка». Зістав стрибки з доставками."]),
 "nobreak": dict(place="Відділ безпеки", time="вчора, 06:00–21:00", narrator="🦺 Інженерка з безпеки Галина",
   goal="Знайти, хто працював понад 8 годин без перерви.", culprit_id="c1",
   suspects=[["c1", "Олег", "велосипед", "«Я відпочивав на світлофорах, чесно»."],
             ["c6", "Богдан", "велосипед", "«День був довгий, але я обідав годину»."],
             ["c5", "Оксана", "скутер", "«Я почала опівдні, до 21:00 — це ж менше 8 годин підряд?»"]],
   stories=["Після аварії мені потрібна правда про вчорашній день. Спершу грубо: хто скільки був онлайн від першого до останнього пінгу.",
            "Двоє з однаковим днем. Довгий день — ще не порушення, порушення — це немає перерви. Подивимось на паузи Олега між пінгами.",
            "Перерва — це пауза від 30 хвилин. Порахуй, скільки справжніх перерв було в кожного.",
            "Тепер точно: розріж день кожного на безперервні шматки там, де була перерва, і знайди найдовший шматок.",
            "Мені потрібен протокол: хто, з котрої до котрої і скільки хвилин без перерви — лише ті, де понад 8 годин."]),
}
for c in CASES:
    e = EXTRA[c["id"]]
    for q, s in zip(c["questions"], e.pop("stories")): q["story"] = s
    c.update(e)

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
