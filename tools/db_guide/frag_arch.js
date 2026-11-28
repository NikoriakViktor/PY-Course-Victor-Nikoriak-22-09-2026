/* ============ АРХІТЕКТУРА: спільна схема ============ */
const ARCH={
  boxes:{
    redis:{x:20,y:20,w:210,h:460,cls:'rd',t:'⚡ Redis',s:['порт 6390','','orders:new · STREAM','order:<id> · HASH','orders:active · ZSET','orders:waiting · ZSET','couriers:geo · GEO','couriers:free · SET','courier:<id> · HASH','restaurant:<id> · HASH','restaurants:geo · GEO','cache:menu:<id> · STRING','ratelimit:<клієнт>','order:seq · stats:*','lb:* · ZSET','events:orders · PUB/SUB','events:log · LIST']},
    gen:{x:420,y:20,w:180,h:56,cls:'svc',t:'generator',s:['app/generator.py']},
    api:{x:420,y:100,w:180,h:56,cls:'svc',t:'api  :8100',s:['app/api.py']},
    disp:{x:420,y:180,w:180,h:56,cls:'svc',t:'dispatcher',s:['app/dispatcher.py']},
    sim:{x:420,y:260,w:180,h:56,cls:'svc',t:'simulator',s:['app/simulator.py']},
    dash:{x:420,y:340,w:180,h:56,cls:'svc',t:'dashboard  :8060',s:['app/dashboard.py']},
    mon:{x:420,y:420,w:180,h:56,cls:'svc',t:'redis-monitor',s:['app/redis_monitor.py']},
    pg:{x:760,y:20,w:220,h:296,cls:'pg',t:'🐘 PostgreSQL',s:['порт 5434','','restaurants','menu_items','couriers','orders  ← лише доставлені','','на старті кожен сервіс:','seed_redis() читає','restaurants і couriers']},
    duck:{x:760,y:380,w:220,h:96,cls:'dk',t:'🦆 DuckDB',s:['поза проєктом:','аналітика історії orders','(вкладка «Аналітика»)']},
  },
  arrows:{
    'gen-rd':{p:[[420,48],[230,48]],l:['INCR · GET · MULTI…EXEC']},
    'api-rd':{p:[[420,128],[230,128]],l:['HGETALL · GEOSEARCH','SUBSCRIBE']},
    'disp-rd':{p:[[420,208],[230,208]],l:['XREADGROUP · GEOSEARCH','SREM · XACK']},
    'sim-rd':{p:[[420,288],[230,288]],l:['GEOADD щосекунди','MULTI…EXEC']},
    'dash-rd':{p:[[420,368],[230,368]],l:['ZRANGE · SCARD · LRANGE','щосекунди']},
    'mon-rd':{p:[[420,448],[230,448]],l:['MONITOR']},
    'gen-pg':{p:[[600,48],[760,48]],l:['SELECT menu (MISS)']},
    'api-pg':{p:[[600,128],[760,128]],l:['SELECT menu','/history']},
    'sim-pg':{p:[[600,288],[760,288]],l:['INSERT orders']},
    'pg-duck':{p:[[870,316],[870,380]],l:['вивантаження']},
  },
};
function archSvg(svg,opt={}){
  const on=new Set(opt.on||[]),aon=new Set(opt.arrows||[]);const dim=on.size>0;
  const END={rd:'redis',pg:'pg',duck:'duck',gen:'gen',api:'api',disp:'disp',sim:'sim',dash:'dash',mon:'mon'};
  aon.forEach(a=>a.split('-').forEach(p=>on.add(END[p])));          // кінці підсвічених зв'язків теж не тьмяніють
  let s=`<defs><marker id="${svg.id}-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="11" markerHeight="11" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="ah"/></marker></defs>`;
  Object.entries(ARCH.arrows).forEach(([id,a])=>{const [[x1,y1],[x2,y2]]=a.p;const mx=(x1+x2)/2,my=(y1+y2)/2;const vert=x1===x2;
    s+=`<g class="ar${aon.has(id)?' on':''}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#${svg.id}-ah)" marker-start="url(#${svg.id}-ah)"/>`+
      a.l.map((t,i)=>vert?`<text x="${mx+8}" y="${my+(i-(a.l.length-1)/2)*13}" style="text-anchor:start">${esc(t)}</text>`:`<text x="${mx}" y="${my-8-(a.l.length-1-i)*13}">${esc(t)}</text>`).join('')+'</g>';});
  Object.entries(ARCH.boxes).forEach(([id,b])=>{const big=b.h>100;
    s+=`<g class="box ${b.cls}${on.has(id)?' on':''}" data-b="${id}"><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="10"/>`+
      `<text class="t" x="${b.x+b.w/2}" y="${b.y+(big?22:20)}">${esc(b.t)}</text>`+
      b.s.map((t,i)=>`<text class="s" x="${b.x+b.w/2}" y="${b.y+(big?44:39)+i*(big?17.5:15)}">${esc(t)}</text>`).join('')+'</g>';});
  svg.innerHTML=s;
}

/* ============ АРХІТЕКТУРА: картки ============ */
(function(){
  const D={
    redis:['⚡ Redis — спільна пам\'ять і пошта між сервісами',[['Що робить','Тримає все «гаряче»: чергу замовлень, стан кур\'єрів і активних замовлень, кеш, лічильники, рейтинги, події. Сервіси не знають одне про одного — лише назви ключів.'],['Образ','<code>redis:7-alpine</code> з <code>--appendonly yes</code>: кожна команда пишеться в журнал AOF, тож після перезапуску дані відновлюються.'],['Карта ключів','Усі назви — в одному файлі <code>app/config.py</code>. Формат: <code>&lt;сутність&gt;:&lt;id&gt;</code> або <code>&lt;група&gt;:&lt;призначення&gt;</code>.'],['Подивитись','<code>redis-cli -p 6390</code> → <code>KEYS *</code>, <code>XINFO GROUPS orders:new</code>, <code>SMEMBERS couriers:free</code>. Або <code>docker compose logs -f redis-monitor</code>.']]],
    pg:['🐘 PostgreSQL — джерело правди',[['Що робить','Зберігає довідники (ресторани, меню, кур\'єри) і <b>завершені</b> замовлення. Схема й стартові дані — <code>sql/init.sql</code>, виконується при першому запуску контейнера.'],['Хто пише','Лише <code>simulator</code>: <code>INSERT INTO orders … ON CONFLICT (id) DO NOTHING</code> після доставки.'],['Хто читає','Усі сервіси на старті (<code>seed_redis()</code>). <code>generator</code> і <code>api</code> — меню при кеш-MISS. <code>api</code> — <code>/history</code>.'],['Подивитись','<code>docker compose logs -f postgres</code> — кожен запит з іменем сервісу (<code>log_statement=all</code>, <code>application_name</code>). <code>psql postgresql://taxi:taxi@localhost:5434/smachno</code>.']]],
    gen:['generator — «клієнти»',[['Роль','Кожні ~6 с випадковий клієнт (<code>client-1…25</code>) замовляє 1–3 страви у випадковому ресторані. Без нього дашборд був би порожній.'],['Функції','<code>check_rate_limit()</code> → <code>get_menu()</code> → <code>create_order()</code> → <code>publish_event()</code>.'],['Пише в Redis','<code>ratelimit:*</code>, <code>cache:menu:*</code>, <code>order:seq</code>, <code>order:&lt;id&gt;</code>, <code>orders:new</code>, <code>orders:active</code>, <code>stats:*</code>, <code>events:*</code>.'],['PostgreSQL','<code>SELECT menu_items</code> лише коли меню немає в кеші.'],['Лог','<code>docker compose logs -f generator</code>']]],
    api:['api — FastAPI для людей і фронтенду',[['Роль','Ті самі операції, що й генератор, але по HTTP: <code>POST /orders</code>, меню, статус замовлення, кур\'єри, рейтинг, статистика, історія і live-події <code>GET /events</code> (SSE поверх Pub/Sub).'],['Файл','<code>app/api.py</code> — тонкий шар. Логіка в <code>orders.py</code>, <code>menu.py</code>, <code>db.py</code>, тож генератор і API використовують одні й ті самі функції.'],['Спробувати','http://localhost:8100/docs → <code>GET /restaurants/1/menu</code> двічі: у відповіді <code>source</code> зміниться з <code>db</code> на <code>cache</code>.'],['Лог','<code>docker compose logs -f api</code>']]],
    disp:['dispatcher — диспетчер',[['Роль','Читає чергу <code>orders:new</code> через consumer group <code>dispatchers</code>, шукає найближчого вільного кур\'єра й призначає його. Якщо вільних немає — відкладає повтор.'],['Функції','<code>run()</code>: спершу свої pending (<code>0</code>), потім нові (<code>&gt;</code>), <code>XACK</code> після обробки. <code>try_assign()</code>: <code>GEOSEARCH</code> + <code>SREM</code>. <code>process_waiting()</code>: <code>ZRANGEBYSCORE orders:waiting</code>.'],['Масштаб','Можна запустити кілька: <code>docker compose run -d --name d2 -e DISPATCHER_NAME=d2 dispatcher</code>. Група поділить повідомлення, <code>SREM</code> не дасть зайняти одного кур\'єра двічі.'],['Лог','<code>docker compose logs -f dispatcher</code> — найкращий для показу черги.']]],
    sim:['simulator — «кур\'єри їдуть»',[['Роль','Щосекунди кожен зайнятий кур\'єр робить крок до цілі (<code>GEOADD</code>): спершу до ресторану, потім до клієнта.'],['Функції','<code>tick()</code> → <code>step_towards()</code>. Дійшов до клієнта → <code>deliver()</code>: транзакція в Redis + <code>db.save_delivered_order()</code>.'],['Єдиний, хто пише в PostgreSQL','<code>INSERT INTO orders</code>. Якщо PostgreSQL недоступний, буде <code>WARN</code> у лозі, а Redis уже оновлено. У бойовому коді тут була б повторна спроба або черга.'],['Лог','<code>docker compose logs -f simulator</code>. Кроки кур\'єрів видно з <code>LOG_LEVEL=DEBUG</code>.']]],
    dash:['dashboard — диспетчерська (Dash)',[['Роль','Щосекунди читає Redis і малює мапу, KPI, рейтинг і стрічку подій. <b>Нічого не пише.</b>'],['Читає','<code>ZRANGE orders:active</code>, <code>SCARD couriers:free</code>, <code>PFCOUNT</code>, <code>GEOPOS</code>, <code>ZREVRANGE lb:*</code>, <code>LRANGE events:log</code>.'],['Чому не з PostgreSQL','Щосекундні запити від кожного відкритого браузера — зайве навантаження на джерело правди. До того ж активних замовлень у PostgreSQL ще немає.'],['Адреса','http://localhost:8060']]],
    mon:['redis-monitor — «рентген» Redis',[['Роль','Навчальний сервіс: команда <code>MONITOR</code> показує кожну команду, яку отримує Redis, з іменем сервісу-відправника (<code>CLIENT SETNAME</code> → <code>client_name</code> у <code>config.get_redis()</code>).'],['Шум','Щосекундні опитування сховано. <code>MONITOR_ALL=1 docker compose up</code> покаже все.'],['Увага','<code>MONITOR</code> сповільнює Redis. Це інструмент для навчання й відладки, не для бою.'],['Лог','<code>docker compose logs -f redis-monitor</code>']]],
    duck:['🦆 DuckDB — аналітика (поза цим проєктом)',[['Роль','Відповідає на питання до всієї історії: виторг по районах і годинах, середній час доставки. PostgreSQL з такими запитами впорається, але заважатиме сайту, а DuckDB рахує на копії.'],['Як','Вивантажити <code>orders</code> у parquet → <code>SELECT … FROM read_parquet(…)</code>. Деталі — вкладка «Аналітика».']]],
  };
  const svg=$('#arch-svg');let cur='disp';
  const ARR={redis:Object.keys(ARCH.arrows).filter(a=>a.endsWith('-rd')),pg:['gen-pg','api-pg','sim-pg','pg-duck'],gen:['gen-rd','gen-pg'],api:['api-rd','api-pg'],disp:['disp-rd'],sim:['sim-rd','sim-pg'],dash:['dash-rd'],mon:['mon-rd'],duck:['pg-duck']};
  function show(k){cur=k;archSvg(svg,{on:[k],arrows:ARR[k]});$('#arch-title').innerHTML=D[k][0];$('#arch-card').innerHTML=D[k][1].map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join('');}
  svg.addEventListener('click',e=>{const g=e.target.closest('[data-b]');if(g)show(g.dataset.b);});
  show(cur);
  course($('#arch-course'),['taxi','taxiarch','l31','l30']);
})();

/* ============ ТРАСА ============ */
(function(){
  const T=[
    [['gen'],[],'generator','app/generator.py → run()',['generator|TASK|клієнт client-4 відкриває ресторан 5'],'Генератор вигадав клієнта й ресторан.'],
    [['gen','redis'],['gen-rd'],'generator','app/orders.py → check_rate_limit()',['generator|REDIS|INCR ratelimit:client-4 → 1 з 3 за хвилину'],'Rate limit: перше замовлення client-4 за цю хвилину.'],
    [['gen','redis'],['gen-rd'],'generator','app/menu.py → get_menu()',['generator|REDIS|GET cache:menu:5 → MISS (кешу немає) → іду в PostgreSQL'],'Меню ресторану 5 ще не в кеші.'],
    [['gen','pg'],['gen-pg'],'generator','app/db.py → fetch_menu()',['generator|PG|SELECT menu_items WHERE restaurant_id=5 → страв у меню: 4','postgres|PG|[generator] LOG:  execute <unnamed>: SELECT id, name, price FROM menu_items WHERE restaurant_id = $1'],'Повільний шлях. У лозі <code>postgres</code> видно і сам запит, і ім\'я сервісу в дужках.'],
    [['gen','redis'],['gen-rd'],'generator','app/menu.py → get_menu()',['generator|REDIS|SET cache:menu:5 EX 60 → кеш на 60 с (разом 8.6 мс)'],'Меню в кеші: наступні 60 с цей ресторан обійдеться без PostgreSQL.'],
    [['gen','redis'],['gen-rd'],'generator','app/orders.py → create_order()',['generator|TASK|замовлення #1 від client-4: 1 поз., 200 грн','generator|REDIS|INCR order:seq → 1 (новий id) · MULTI: HSET order:1, ZADD orders:active, PFADD stats:customers:unique · EXEC','generator|QUEUE|XADD orders:new → 1795858398626-0  (#1 чекає на диспетчера)'],'Одна транзакція: картка, черга, активні, лічильники. Замовлення стоїть у черзі.'],
    [['gen','redis','api'],['gen-rd','api-rd'],'generator','app/orders.py → publish_event()',['generator|EVENT|PUBLISH events:orders → почули 1 підписників · LPUSH events:log · Нове замовлення #1 · Вега Святошин · 200 грн'],'Подія. «Почули 1 підписник» — це відкрита сторінка <code>GET /events</code> в API.'],
    [['disp','redis'],['disp-rd'],'dispatcher','app/dispatcher.py → run()',['dispatcher|QUEUE|XREADGROUP dispatchers dispatcher-1 ... > → нових повідомлень: 1 — 1795858398626-0 (#1)'],'Диспетчер чекав на черзі (<code>BLOCK 1000</code>) і одразу отримав повідомлення.'],
    [['disp','redis'],['disp-rd'],'dispatcher','app/dispatcher.py → try_assign()',['dispatcher|REDIS|GEOSEARCH couriers:geo біля «Вега Святошин» → c1 5.8 км, c5 6.1 км, c2 7.9 км · вільні: c1, c2, c5','dispatcher|REDIS|SREM couriers:free c1 → 1 (кур\'єр наш, ніхто інший його вже не візьме)','dispatcher|TASK|#1 → кур\'єр c1 (Олег), 5.8 км до ресторану'],'Найближчий вільний — c1. <code>SREM</code> повернув 1: захоплення вдалося.'],
    [['disp','redis'],['disp-rd'],'dispatcher','app/dispatcher.py → run()',['dispatcher|EVENT|PUBLISH events:orders → почули 1 підписників · LPUSH events:log · #1: кур\'єр Олег їде до «Вега Святошин»','dispatcher|QUEUE|XACK orders:new dispatchers 1795858398626-0 → 1 (оброблено, з pending прибрано)'],'Підтвердили <b>після</b> обробки. Повідомлення пішло з pending.'],
    [['sim','redis'],['sim-rd'],'simulator','app/simulator.py → tick()',[{s:'simulator    DEBUG  GEOADD couriers:geo 30.40112 50.45731 c1 (крок до цілі, фаза to_restaurant)   ← видно з LOG_LEVEL=DEBUG'},'simulator|TASK|#1: кур\'єр c1 у ресторані, забрав їжу → їде до клієнта'],'Щосекунди <code>GEOADD</code> пересуває кур\'єра. Дійшов до ресторану → статус <code>picked_up</code>.'],
    [['sim','redis'],['sim-rd'],'simulator','app/simulator.py → deliver()',['simulator|TASK|#1 доставлено кур\'єром c1 · 200 грн','simulator|REDIS|MULTI: HSET order:1 status=delivered, EXPIRE 3600, ZREM orders:active, ZINCRBY lb:couriers:deliveries c1 → 1, INCR stats:delivered → 1, SADD couriers:free c1 · EXEC'],'Доставлено: одна транзакція оновлює все, кур\'єр знову вільний.'],
    [['sim','pg'],['sim-pg'],'simulator','app/db.py → save_delivered_order()',['simulator|PG|INSERT INTO orders #1 (200.0 грн) — замовлення збережено назавжди','postgres|PG|[simulator] LOG:  execute <unnamed>: INSERT INTO orders (id, customer, …) VALUES ($1, $2, …) ON CONFLICT (id) DO NOTHING'],'Єдиний запис у PostgreSQL за все життя замовлення.'],
    [['dash','redis','api'],['dash-rd','api-rd'],'dashboard · api','app/dashboard.py → refresh() · app/api.py → GET /events',[{s:'(дашборд не логує щосекундні читання; їх видно в redis-monitor з MONITOR_ALL=1)'},{s:'dashboard   ▶ ZRANGE orders:active 0 -1 · SCARD couriers:free · LRANGE events:log 0 11 · ZREVRANGE lb:couriers:deliveries 0 4 WITHSCORES'}],'Дашборд щосекунди читає Redis і малює мапу. Браузер з <code>/events</code> отримав усі три події через Pub/Sub.'],
  ];
  function* gen(){const L=[];yield{on:[],ar:[],svc:'',where:'',L:[],msg:'Натисни «Крок →». Повний цикл одного замовлення — 14 кроків.'};
    for(const [on,ar,svc,where,lines,msg] of T){lines.forEach(l=>L.push(l));yield{on,ar,svc,where,L:L.slice(),msg};}}
  function render(s){archSvg($('#trace-svg'),{on:s.on,arrows:s.ar});logs($('#trace-log'),s.L);$('#trace-msg').innerHTML=s.msg;
    $('#trace-where').innerHTML=s.svc?`<span class="pill svc">${esc(s.svc)}</span> <code>${esc(s.where)}</code>`:'';}
  const r=new Runner(gen,render);r.delay=1800;controls($('#trace-controls'),r,'trace');
  course($('#trace-course'),['taxi','taxiarch']);
})();

/* ============ ЧОМУ ТАК ============ */
(function(){
  const W=[
    ['Чому замовлення потрапляє в PostgreSQL лише після доставки?','Поки доставка триває, замовлення живе в Redis.','Писати кожну зміну статусу в PostgreSQL.','Статус змінюється кілька разів за хвилину, і його читають усі сервіси. Це «гарячі» дані. PostgreSQL потрібна підсумкова правда: що, кому, за скільки, хто віз. Один <code>INSERT</code> замість потоку <code>UPDATE</code>.','Якщо Redis упаде посеред доставки, активні замовлення доведеться відновлювати. Це свідомий компроміс навчального проєкту. У бою статуси часто теж пишуть у PostgreSQL або ведуть журнал подій.'],
    ['Чому черга замовлень — Stream, а не LIST чи Pub/Sub?','STREAM <code>orders:new</code> + consumer group.','LIST (<code>LPUSH</code>/<code>BRPOP</code>) або Pub/Sub.','Pub/Sub губить усе, коли диспетчер не слухає. LIST губить замовлення, з яким диспетчер упав. Stream тримає повідомлення в pending до <code>XACK</code>, ділить роботу між кількома диспетчерами й дозволяє перечитати історію.','Дивись вкладку «Три черги»: там цей сценарій розіграно покроково.'],
    ['Чому XACK після обробки, а не одразу після читання?','<code>try_assign()</code>, потім <code>XACK</code>.','Підтвердити одразу, щоб «не забути».','Підтвердження означає «я це доробив». Якщо підтвердити заздалегідь і впасти, Redis вважатиме замовлення обробленим, і воно загубиться. Ціна правильного порядку — повідомлення <b>може</b> оброблятися двічі. Тому <code>try_assign()</code> перевіряє статус і пропускає вже призначені (ідемпотентність).','Тема «at-least-once» доставки: краще двічі, ніж жодного разу, але обробник має це витримувати.'],
    ['Чому SREM, а не «перевірити, а потім зайняти»?','<code>SREM couriers:free c4</code> → 1 або 0.','<code>SISMEMBER</code>, потім <code>HSET status busy</code>.','Між двома командами вклинюється інший диспетчер, і кур\'єр отримує два замовлення. <code>SREM</code> — це «перевірити й зайняти» однією атомарною командою.','Той самий прийом у <code>process_waiting()</code>: <code>ZREM … == 1</code>.'],
    ['Чому id замовлення дає Redis (INCR), а не SERIAL у PostgreSQL?','<code>INCR order:seq</code>.','<code>INSERT … RETURNING id</code> у PostgreSQL на старті замовлення.','Тоді на кожне замовлення був би запис у PostgreSQL ще до оплати й доставки, а ми свідомо пишемо туди лише завершені. <code>INCR</code> атомарний: два генератори ніколи не отримають однаковий номер.','Якщо Redis втратить <code>order:seq</code> (без AOF), номери почнуться з 1 і зіткнуться з тими, що вже є в PostgreSQL. Тому <code>--appendonly yes</code> і <code>ON CONFLICT DO NOTHING</code>.'],
    ['Чому ціни беремо з меню, а не з запиту клієнта?','<code>create_order()</code> рахує суму за меню (кеш → PostgreSQL).','Довіряти полю <code>price</code> у JSON від клієнта.','Клієнт може надіслати будь-що, наприклад «борщ за 1 грн». Правило: усе, що стосується грошей, рахує сервер з власних даних.','Те саме з кешем: він може бути застарілим не довше за TTL — 60 с.'],
    ['Чому кожна подія йде і в PUBLISH, і в LIST?','<code>PUBLISH events:orders</code> + <code>LPUSH events:log</code> + <code>LTRIM 0 29</code>.','Лише Pub/Sub.','Pub/Sub доставляє тільки тим, хто слухає саме зараз. Людина, яка відкрила дашборд пізніше, побачила б порожню стрічку. LIST з останніми 30 подіями — «пам\'ять» для новачків.','Обидві команди йдуть пачкою в одному <code>pipeline</code>.'],
    ['Чому кожен сервіс на старті викликає seed_redis()?','Прогрів: ресторани й кур\'єри з PostgreSQL → Redis, створення групи черги.','Окремий скрипт ініціалізації один раз.','Redis може бути порожнім: перший запуск, <code>FLUSHALL</code>, втрата даних. Будь-який сервіс, що стартує першим, наповнить його. Функція <b>ідемпотентна</b>: повторний виклик нічого не ламає (<code>BUSYGROUP</code> ігнорується, наявних кур\'єрів не чіпає).','Ідемпотентність — головна властивість усього, що виконується «на старті» або «при повторі».'],
    ['Що буде, якщо впаде PostgreSQL?','Сервіси чекають на нього на старті (<code>wait_for_db</code>). Під час роботи <code>deliver()</code> пише <code>WARN</code>.','—','Нові замовлення й доставки продовжуються: усе «гаряче» в Redis. Не запишуться в історію завершені замовлення, а кеш-MISS меню отримає помилку.','У бойовому коді: повторна спроба або окрема черга «записати в БД» (патерн outbox). <code>ON CONFLICT</code> робить повтор безпечним.'],
    ['Чому шість процесів, а не один скрипт?','Окремий контейнер на кожну роль.','Один <code>main.py</code> з потоками.','Падіння симулятора не зупиняє прийом замовлень. Диспетчерів можна запустити два. Логи кожної ролі окремі. Через Redis сервіси «не знають» одне про одного — лише назви ключів.','Ціна: більше рухомих частин, тож потрібні <code>docker compose</code>, healthcheck і логи.'],
    ['Чому всі назви ключів в одному файлі?','<code>app/config.py</code>.','Писати <code>"couriers:free"</code> рядком там, де потрібно.','У Redis немає схеми: одна описка (<code>courier:free</code>) — і два сервіси працюють з різними ключами, не отримуючи жодної помилки. Один файл — це «схема», яку можна прочитати.','Студентам: почни читати проєкт саме з <code>config.py</code>.'],
  ];
  $('#why-cards').innerHTML=W.map(([q,ch,al,why,more])=>`<div class="why"><h3>${q}</h3><p><span class="ch">Обрали:</span> ${ch}</p>${al!=='—'?`<p><span class="al">Альтернатива:</span> ${al}</p>`:''}<p><b>Чому:</b> ${why}</p><p style="color:var(--muted)">${more}</p></div>`).join('');
  course($('#why-course'),['taxi','taxiarch','l31']);
})();

/* ============ ШПАРГАЛКА ============ */
(function(){
  const M=[
    ['generator','generator.py','run()','—','—','кожні ~6 с випадковий клієнт замовляє в ресторані'],
    ['generator, api','orders.py','check_rate_limit()','INCR, EXPIRE','ratelimit:<клієнт>','≤ 3 замовлень за хвилину, інакше 429'],
    ['generator, api','menu.py','get_menu()','GET, SET … EX 60, INCR, TTL · SQL SELECT','cache:menu:<id>, stats:cache:hit/miss · menu_items','cache-aside: Redis, а при MISS — PostgreSQL'],
    ['api','menu.py','invalidate_menu()','DEL','cache:menu:<id>','скинути кеш після зміни цін'],
    ['generator, api','orders.py','create_order()','EXISTS, INCR, MULTI (HSET, XADD, ZADD, INCR, PFADD) EXEC, HGET','order:seq, order:<id>, orders:new, orders:active, stats:orders:<день>, stats:customers:unique','нове замовлення: картка + черга, разом або ніяк'],
    ['усі, хто змінює статус','orders.py','publish_event()','PUBLISH, LPUSH, LTRIM','events:orders, events:log','live-подія + стрічка останніх 30'],
    ['усі (на старті)','seed.py','seed_redis()','SQL SELECT · GEOADD, HSET, SISMEMBER, SADD, XGROUP CREATE … MKSTREAM','restaurants, couriers · restaurants:geo, restaurant:<id>, couriers:geo, courier:<id>, couriers:all, couriers:free, orders:new','прогріти Redis з PostgreSQL (ідемпотентно)'],
    ['усі (на старті)','db.py','wait_for_db()','SQL connect','—','дочекатися PostgreSQL, логуючи кожну спробу'],
    ['dispatcher','dispatcher.py','run()','XINFO GROUPS, XLEN, XREADGROUP (0, потім >), XACK','orders:new','читати чергу; спершу свої pending після падіння'],
    ['dispatcher','dispatcher.py','try_assign()','HGETALL, GEOSEARCH, SMEMBERS, SREM, HSET, ZREM, HGET · або HSET + ZADD','order:<id>, restaurant:<id>, couriers:geo, couriers:free, courier:<id>, orders:waiting','найближчий вільний кур\'єр або відкладений повтор'],
    ['dispatcher','dispatcher.py','process_waiting()','ZRANGEBYSCORE, ZREM','orders:waiting','повторити тих, чий час настав'],
    ['simulator','simulator.py','tick()','SMEMBERS, HGETALL, GEOPOS, GEOADD, HSET','couriers:all, courier:<id>, couriers:geo, order:<id>','крок кожного зайнятого кур\'єра щосекунди'],
    ['simulator','simulator.py','deliver()','HGETALL, MULTI (HSET, EXPIRE, ZREM, ZINCRBY ×2, INCR, HSET, SADD) EXEC','order:<id>, orders:active, lb:couriers:deliveries, lb:restaurants:revenue, stats:delivered, courier:<id>, couriers:free','завершити доставку однією транзакцією'],
    ['simulator','db.py','save_delivered_order()','SQL INSERT … ON CONFLICT (id) DO NOTHING','orders','назавжди в PostgreSQL, повтор безпечний'],
    ['api','api.py','GET /restaurants','GEOSEARCH, HGET','restaurants:geo, restaurant:<id>','ресторани в радіусі'],
    ['api','api.py','GET /restaurants/{id}/menu','див. get_menu()','cache:menu:<id>','меню + звідки (cache/db) і скільки мс'],
    ['api','api.py','POST /orders','див. check_rate_limit() + create_order()','—','замовлення по HTTP'],
    ['api','api.py','GET /orders/{id}','HGETALL','order:<id>','статус активного замовлення'],
    ['api','api.py','GET /couriers','SMEMBERS, HGETALL, GEOPOS','couriers:all, courier:<id>, couriers:geo','кур\'єри та позиції'],
    ['api','api.py','GET /leaderboard','ZREVRANGE … WITHSCORES, HGET','lb:couriers:deliveries, lb:restaurants:revenue','топ-5 кур\'єрів і ресторанів'],
    ['api','api.py','GET /stats','GET, ZCARD, SCARD, PFCOUNT, XLEN','stats:*, orders:active, orders:waiting, couriers:free, orders:new','лічильники'],
    ['api','db.py','GET /history','SQL SELECT … ORDER BY id DESC LIMIT','orders','завершені замовлення з PostgreSQL'],
    ['api','api.py','GET /events','SUBSCRIBE','events:orders','Server-Sent Events у браузер'],
    ['dashboard','dashboard.py','refresh() щосекунди','GET, ZCARD, PFCOUNT, SCARD, ZRANGE, HGETALL, GEOPOS, ZREVRANGE, HGET, LRANGE','stats:*, orders:active, couriers:*, restaurants:geo, lb:*, events:log','мапа, KPI, рейтинг, стрічка'],
    ['redis-monitor','redis_monitor.py','run()','MONITOR, CLIENT LIST','—','показати кожну команду й хто її надіслав'],
  ];
  const svcs=['усі сервіси',...new Set(M.flatMap(m=>m[0].split(', ').map(x=>x.replace(/ \(.*\)| хто змінює статус/,''))))];
  $('#methods-svc').innerHTML=svcs.map(s=>`<option>${esc(s)}</option>`).join('');
  const hl=s=>esc(s).replace(/\b(SQL [A-Z]+(?: …[^,·]*)?|[A-Z]{3,}(?: [A-Z]+)?)\b/g,'<code>$1</code>');
  function draw(){const q=$('#methods-q').value.trim().toLowerCase(),sv=$('#methods-svc').value;
    const rows=M.filter(m=>(sv==='усі сервіси'||m[0].includes(sv))&&(!q||m.join(' ').toLowerCase().includes(q)));
    $('#methods-table').innerHTML='<tr><th>Сервіс</th><th>Функція</th><th>Redis / SQL</th><th>Ключі / таблиці</th><th>Навіщо</th></tr>'+
      rows.map(m=>`<tr><td>${esc(m[0])}</td><td><code>${esc(m[1])}</code><br><b>${esc(m[2])}</b></td><td>${hl(m[3])}</td><td style="font-family:var(--mono);font-size:12.5px">${esc(m[4])}</td><td>${esc(m[5])}</td></tr>`).join('');
    $('#methods-n').textContent=`рядків: ${rows.length} з ${M.length}`;}
  $('#methods-q').oninput=draw;$('#methods-svc').onchange=draw;draw();
  course($('#methods-course'),['taxi','taxiarch']);
})();
