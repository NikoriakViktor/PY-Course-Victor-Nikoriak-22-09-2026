"""Python-код, показаний у гайді (вкладки «Патерни» і «Аналітика»), проти справжнього Redis і DuckDB.

    python tools/db_guide/checks/check_code.py

Redis — REDIS_HOST:REDIS_PORT (типово localhost:6379), база REDIS_DB (типово 14, має бути порожня).
PostgreSQL замінено словником: тут перевіряємо саме логіку Redis."""
import json, os, sys, tempfile, threading, time
import redis

r = redis.Redis(host=os.getenv("REDIS_HOST", "localhost"), port=int(os.getenv("REDIS_PORT", "6379")),
                db=int(os.getenv("REDIS_DB", "14")), decode_responses=True)
if r.dbsize(): sys.exit("база не порожня — візьми іншу: REDIS_DB=<номер>")

# ---------- cache-aside (вкладка «Кеш меню») ----------
PG = {3: [{"id": 9, "name": "Борщ", "price": 120.0}]}
class db:
    calls = 0
    @staticmethod
    def fetch_menu(rid):
        db.calls += 1; return json.loads(json.dumps(PG[rid]))

def get_menu(r, restaurant_id):
    key = f"cache:menu:{restaurant_id}"
    cached = r.get(key)
    if cached is not None:                  # HIT
        r.incr("stats:cache:hit")
        return json.loads(cached)
    menu = db.fetch_menu(restaurant_id)     # MISS → PostgreSQL
    r.set(key, json.dumps(menu), ex=60)     # кеш на 60 с
    r.incr("stats:cache:miss")
    return menu

def invalidate_menu(r, restaurant_id):
    r.delete(f"cache:menu:{restaurant_id}")  # після зміни цін

assert get_menu(r, 3)[0]["price"] == 120 and db.calls == 1 and 0 < r.ttl("cache:menu:3") <= 60
assert get_menu(r, 3)[0]["price"] == 120 and db.calls == 1            # HIT: у PostgreSQL не ходили
PG[3][0]["price"] = 130.0
assert get_menu(r, 3)[0]["price"] == 120                               # застаріло
invalidate_menu(r, 3)
assert get_menu(r, 3)[0]["price"] == 130 and db.calls == 2
assert r.get("stats:cache:hit") == "2" and r.get("stats:cache:miss") == "2"

# ---------- rate limit і гонка (вкладка «Лічильник») ----------
def check_rate_limit(r, customer):
    key = f"ratelimit:{customer}"
    n = r.incr(key)          # атомарно: прочитав + додав + записав
    if n == 1:
        r.expire(key, 60)    # перше в цій хвилині → вікно 60 с
    return n <= 3            # 4-те й далі → відмова (HTTP 429)

assert [check_rate_limit(r, "client-7") for _ in range(4)] == [True, True, True, False]
assert 0 < r.ttl("ratelimit:client-7") <= 60

def worker(fn):
    c = redis.Redis(connection_pool=r.connection_pool)
    for _ in range(300): fn(c)
naive = lambda c: c.set("n:naive", int(c.get("n:naive") or 0) + 1)
atomic = lambda c: c.incr("n:atomic")
for fn in (naive, atomic):
    ts = [threading.Thread(target=worker, args=(fn,)) for _ in range(4)]
    [t.start() for t in ts]; [t.join() for t in ts]
assert r.get("n:atomic") == "1200"
print("GET+SET з 4 потоків:", r.get("n:naive"), "з 1200 (втрати — нормальні для наївного варіанта); INCR:", r.get("n:atomic"))

# ---------- Stream: падіння і pending (вкладки «Три черги», «Пісочниця») ----------
r.xgroup_create("orders:new", "dispatchers", id="0", mkstream=True)
for oid in (1, 2): r.xadd("orders:new", {"order_id": oid})
done = []
def run_dispatcher(me, crash_on=None, limit=10):
    last_id = "0"                  # спершу — свої pending після падіння
    for _ in range(limit):
        resp = r.xreadgroup("dispatchers", me, {"orders:new": last_id}, count=10, block=100)
        entries = resp[0][1] if resp else []
        if last_id == "0" and not entries:
            last_id = ">"              # pending порожній → нові повідомлення
        for msg_id, fields in entries:
            if fields["order_id"] == crash_on: return "crash"
            done.append(fields["order_id"])           # try_assign(...)
            r.xack("orders:new", "dispatchers", msg_id)   # ПІСЛЯ обробки
assert run_dispatcher("d1", crash_on="2") == "crash" and done == ["1"]
assert r.xpending("orders:new", "dispatchers")["pending"] == 1
r.xadd("orders:new", {"order_id": 3})                  # прийшло, поки d1 лежав
run_dispatcher("d1")
assert done == ["1", "2", "3"] and r.xpending("orders:new", "dispatchers")["pending"] == 0

# ---------- захоплення кур'єра (SREM) ----------
r.sadd("couriers:free", "c2", "c4")
assert r.srem("couriers:free", "c4") == 1 and r.srem("couriers:free", "c4") == 0 and r.srem("couriers:free", "c2") == 1

# ---------- MULTI/EXEC: create_order ----------
order_id = r.incr("order:seq")         # до транзакції: id потрібен одразу
pipe = r.pipeline(transaction=True)    # MULTI
pipe.hset(f"order:{order_id}", mapping={"customer": "client-7", "status": "new"})
pipe.xadd("orders:x", {"order_id": order_id})
pipe.zadd("orders:active", {order_id: time.time()})
pipe.incr("stats:orders:today")
pipe.pfadd("stats:customers:unique", "client-7")
_, msg_id, *_ = pipe.execute()         # EXEC: усе разом
assert "-" in msg_id and r.hget("order:1", "status") == "new"
pipe = r.pipeline(transaction=True); pipe.hset("order:2", "status", "new"); pipe.reset()   # «упали» до EXEC
assert not r.exists("order:2")

# ---------- відкладений повтор ----------
r.zadd("orders:waiting", {"50": time.time() + 1})
assert r.zrangebyscore("orders:waiting", 0, time.time()) == []
time.sleep(1.1)
due = r.zrangebyscore("orders:waiting", 0, time.time())
assert due == ["50"] and r.zrem("orders:waiting", "50") == 1 and r.zrem("orders:waiting", "50") == 0
r.flushdb()

# ---------- DuckDB (вкладка «Аналітика») ----------
try:
    import duckdb
except ImportError:
    print("duckdb не встановлено — аналітику пропущено"); duckdb = None
if duckdb:
    d = tempfile.mkdtemp(); os.chdir(d)
    open("orders.csv", "w").write("id,restaurant_id,total,created_at,delivered_at\n"
                                  "1,5,200,2026-11-28 09:30:00+00,2026-11-28 09:34:00+00\n"
                                  "2,5,100,2026-11-28 09:31:00+00,2026-11-28 09:33:00+00\n"
                                  "3,3,415,2026-11-28 09:32:00+00,2026-11-28 09:36:00+00\n")
    duckdb.sql("COPY (SELECT * FROM 'orders.csv') TO 'orders.parquet' (FORMAT parquet)")
    rows = duckdb.sql("""
        SELECT restaurant_id,
               count(*)                                              AS orders,
               round(sum(total), 2)                                  AS revenue,
               round(avg(epoch(delivered_at - created_at)) / 60, 1)  AS avg_minutes
        FROM 'orders.parquet'
        GROUP BY ALL
        ORDER BY revenue DESC
    """).fetchall()
    assert rows == [(3, 1, 415.0, 4.0), (5, 2, 300.0, 3.0)], rows
print("check_code: усе ок")
