"""Пісочниця гайду проти справжнього Redis: ті самі команди → ті самі відповіді у форматі redis-cli.

    python tools/db_guide/checks/check_sandbox.py ["module_3/bonus/Бази даних — загальна картина.html"]

Потрібні playwright (pip install playwright && playwright install chromium) і Redis на REDIS_HOST:REDIS_PORT
(типово localhost:6379, наприклад `docker run -d --name redis_lab -p 6379:6379 redis:8`).
Працює в базі REDIS_DB (типово 14) і відмовляється, якщо вона не порожня. Свій Chromium — змінна CHROMIUM_PATH.
Клієнт Redis тут — 30 рядків «сирого» протоколу RESP, без redis-py: так видно справжні типи відповідей."""
import os, pathlib, re, socket, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
PAGE = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "module_3" / "bonus" / "Бази даних — загальна картина.html"
HOST, PORT, DB = os.getenv("REDIS_HOST", "localhost"), int(os.getenv("REDIS_PORT", "6379")), int(os.getenv("REDIS_DB", "14"))

SCENARIOS = [
    ["GET cache:menu:3", 'SET cache:menu:3 "[борщ 120]" EX 60', "GET cache:menu:3", "TTL cache:menu:3", "TTL nope",
     "SET k v NX", "SET k w NX", "GET k", "PERSIST cache:menu:3", "TTL cache:menu:3", "TYPE k", "TYPE nope", "KEYS *", "DEL k nope", "EXISTS k cache:menu:3"],
    ["INCR ratelimit:client-7", "EXPIRE ratelimit:client-7 60", "INCR ratelimit:client-7", "INCRBY ratelimit:client-7 5",
     "DECR ratelimit:client-7", "TTL ratelimit:client-7", "SET s hello", "INCR s", "EXPIRE nope 10"],
    ["HSET order:42 customer client-7 restaurant_id 3 status new", "HGET order:42 status", "HSET order:42 status assigned courier_id c4",
     "HGETALL order:42", "HINCRBY order:42 qty 2", "HLEN order:42", "HDEL order:42 qty nope", "HGET order:42 nope", "GET order:42"],
    ["LPUSH events:log a b c", "RPUSH events:log z", "LRANGE events:log 0 -1", "LTRIM events:log 0 1", "LRANGE events:log 0 -1",
     "LLEN events:log", "LPOP events:log", "RPOP events:log", "RPOP events:log", "LRANGE events:log 0 -1"],
    ["SADD couriers:free c1 c2 c4", "SADD couriers:free c4", "SREM couriers:free c4", "SREM couriers:free c4", "SMEMBERS couriers:free",
     "SISMEMBER couriers:free c1", "SCARD couriers:free"],
    ["ZINCRBY lb 1 c4", "ZINCRBY lb 1 c2", "ZINCRBY lb 1 c4", "ZADD lb 0.5 c9 3 c1", "ZREVRANGE lb 0 -1 WITHSCORES", "ZRANGE lb 0 1",
     "ZSCORE lb c4", "ZRANK lb c4", "ZRANGEBYSCORE lb 1 2", "ZRANGEBYSCORE lb -inf +inf WITHSCORES", "ZREM lb c9 nope", "ZCARD lb", "ZINCRBY lb 0.25 c1"],
    ["XGROUP CREATE orders:new dispatchers 0", "XGROUP CREATE orders:new dispatchers 0 MKSTREAM", "XGROUP CREATE orders:new dispatchers 0",
     "XADD orders:new 1-0 order_id 7", "XADD orders:new 2-0 order_id 8", "XADD orders:new 2-0 order_id 9", "XLEN orders:new",
     "XREADGROUP GROUP dispatchers d1 COUNT 1 STREAMS orders:new >", "XPENDING orders:new dispatchers",
     "XREADGROUP GROUP dispatchers d1 STREAMS orders:new 0", "XACK orders:new dispatchers 1-0", "XACK orders:new dispatchers 1-0",
     "XPENDING orders:new dispatchers", "XREADGROUP GROUP dispatchers d2 STREAMS orders:new >", "XREADGROUP GROUP dispatchers d2 STREAMS orders:new >",
     "XREADGROUP GROUP dispatchers d1 STREAMS orders:new 0"],
    ["MULTI", "INCR order:seq", "HSET order:43 status new", "XADD orders:x 5-0 order_id 43", "EXEC", "MULTI", "INCR order:seq", "DISCARD", "GET order:seq", "EXEC"],
    ["PFADD u a b c", "PFADD u a", "PFCOUNT u", "PFADD u2", "PFADD u2", "PING", "PUBLISH events:orders hi",
     "GEOADD g 30.61 50.47 c1 30.55 50.43 c2 30.54 50.43 c4", "GEOSEARCH g FROMLONLAT 30.538 50.427 BYRADIUS 5 km ASC WITHDIST",
     "GEOSEARCH g FROMLONLAT 30.538 50.427 BYRADIUS 50 km ASC COUNT 2"],
]


def split(line):
    return [m[0] or m[1] or m[2] for m in re.findall(r'"((?:[^"\\]|\\.)*)"|\'([^\']*)\'|(\S+)', line)]


class Resp:
    def __init__(self):
        self.s = socket.create_connection((HOST, PORT)); self.f = self.s.makefile("rb")

    def cmd(self, *args):
        out = b"*%d\r\n" % len(args) + b"".join(b"$%d\r\n%s\r\n" % (len(x), x) for x in (a.encode() for a in args))
        self.s.sendall(out); return self.read()

    def read(self):
        line = self.f.readline()[:-2].decode(); t, body = line[0], line[1:]
        if t == "+": return ("status", body)
        if t == "-": return ("err", body)
        if t == ":": return ("int", int(body))
        if t == "$": return ("nil", None) if body == "-1" else ("bulk", self.f.read(int(body) + 2)[:-2].decode())
        if t == "*": return ("nil", None) if body == "-1" else ("arr", [self.read() for _ in range(int(body))])
        raise ValueError(line)


def fmt(r):
    t, v = r
    if t == "status": return v
    if t == "int": return f"(integer) {v}"
    if t == "nil": return "(nil)"
    if t == "err": return f"(error) {v}"
    if t == "bulk": return '"' + v.replace("\\", "\\\\").replace('"', '\\"') + '"'
    if not v: return "(empty array)"
    w, out = len(str(len(v))), []
    for i, x in enumerate(v):
        p = f"{str(i + 1).rjust(w)}) "; lines = fmt(x).split("\n")
        out.append(p + lines[0] + "".join("\n" + " " * len(p) + l for l in lines[1:]))
    return "\n".join(out)


def same(cmd, a, b):
    if a == b: return True
    if a.startswith("(error)") and b.startswith("(error)"):          # тексти помилок різняться між версіями: порівнюємо код
        return a.split()[1] == b.split()[1]
    if cmd.split()[0].upper() in ("KEYS", "SMEMBERS"):                # порядок у Redis не гарантований
        items = lambda s: sorted(re.sub(r"^\s*\d+\) ", "", l) for l in s.split("\n"))
        return items(a) == items(b)
    if cmd.upper().startswith("GEOSEARCH"):                            # GEO зберігає координати як geohash: відстань ±0,5 м
        na, nb = re.findall(r'"(\d+\.\d+)"', a), re.findall(r'"(\d+\.\d+)"', b)
        return re.sub(r'"\d+\.\d+"', "#", a) == re.sub(r'"\d+\.\d+"', "#", b) and all(abs(float(x) - float(y)) < 0.01 for x, y in zip(na, nb))
    return False


real = Resp()
assert fmt(real.cmd("SELECT", str(DB))) == "OK"
if real.cmd("DBSIZE")[1]: sys.exit(f"база {DB} не порожня — візьми іншу: REDIS_DB=<номер>")
bad = total = 0
with sync_playwright() as pw:
    exe = os.environ.get("CHROMIUM_PATH")
    b = pw.chromium.launch(**({"executable_path": exe} if exe else {})); pg = b.new_page()
    pg.goto(PAGE.resolve().as_uri())
    for sc in SCENARIOS:
        real.cmd("FLUSHDB")
        mine = pg.evaluate("""cmds => { const {MiniRedis, rfmt, rsplit} = window.miniRedis; const R = new MiniRedis();
                                         return cmds.map(c => rfmt(R.exec(rsplit(c)))); }""", sc)
        for cmd, m in zip(sc, mine):
            total += 1; r = fmt(real.cmd(*split(cmd)))
            if not same(cmd, m, r):
                bad += 1; print(f"✗ {cmd}\n   пісочниця: {m!r}\n   Redis:     {r!r}")
    b.close()
real.cmd("FLUSHDB")
print(f"{total - bad}/{total} команд збіглися з Redis {HOST}:{PORT}/{DB}")
sys.exit(1 if bad else 0)
