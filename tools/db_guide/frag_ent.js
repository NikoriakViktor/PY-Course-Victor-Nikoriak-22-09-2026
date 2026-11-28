/* ============ СУТНОСТІ: картки ============ */
(function(){
  const E={
    rest:['Ресторан',[
      ['Що це','Заклад, з якого везуть їжу. Довідник: змінюється рідко.'],
      ['Правда в PostgreSQL','<code>restaurants</code> (id, name, cuisine, district, lat, lon). Заповнює <code>sql/init.sql</code>.'],
      ['У Redis','<code>HASH restaurant:&lt;id&gt;</code> — копія рядка. <code>GEO restaurants:geo</code> — точка на мапі для «що поруч». <code>ZSET lb:restaurants:revenue</code> — живий виторг.'],
      ['Хто змінює','<code>seed_redis()</code> на старті кожного сервісу: <code>GEOADD</code> + <code>HSET</code>, тобто копіює з PostgreSQL. <code>simulator.deliver()</code>: <code>ZINCRBY lb:restaurants:revenue</code>.'],
      ['Хто читає','<code>dispatcher.try_assign()</code>: <code>HGETALL restaurant:3</code> → координати для пошуку кур\'єра. API <code>GET /restaurants</code>: <code>GEOSEARCH restaurants:geo</code>. <code>create_order()</code>: <code>EXISTS</code>.'],
      ['Чому так','Правда — у PostgreSQL. Redis тримає копію, бо без неї не буде <code>GEOSEARCH</code> «у радіусі 5 км», а координати ресторану потрібні на кожне замовлення.'],
    ]],
    menu:['Страва (меню)',[
      ['Що це','Позиція меню з ціною. Читається на кожне замовлення, змінюється рідко.'],
      ['Правда в PostgreSQL','<code>menu_items</code> (id, <code>restaurant_id → restaurants</code>, name, price <code>CHECK &gt; 0</code>).'],
      ['У Redis','<code>STRING cache:menu:&lt;restaurant_id&gt;</code> — усе меню одним JSON, живе 60 с (<code>EX 60</code>). Лічильники <code>stats:cache:hit</code> і <code>stats:cache:miss</code>.'],
      ['Хто змінює','Ціни змінюють у PostgreSQL. Після цього — <code>menu.invalidate_menu()</code>: <code>DEL cache:menu:3</code> (API <code>DELETE /restaurants/3/menu/cache</code>).'],
      ['Хто читає','<code>menu.get_menu()</code> за схемою cache-aside: <code>GET</code> → немає → <code>SELECT … FROM menu_items</code> → <code>SET … EX 60</code>.'],
      ['Чому так','Читаємо в сотні разів частіше, ніж змінюємо, — класичний кеш. TTL гарантує, що застаріла ціна проживе не довше хвилини, навіть якщо інвалідацію забули. Ціну для замовлення беремо з меню, а <b>не від клієнта</b>.'],
    ]],
    cour:['Кур\'єр',[
      ['Що це','Людина на мапі. Її стан змінюється щосекунди: позиція, вільний/зайнятий, фаза доставки.'],
      ['Правда в PostgreSQL','<code>couriers</code> (id, name) — лише довідник.'],
      ['У Redis','<code>HASH courier:c4</code> (name, status, order_id, phase, target_lat/lon). <code>GEO couriers:geo</code> — жива позиція. <code>SET couriers:all</code> і <code>SET couriers:free</code>. <code>ZSET lb:couriers:deliveries</code> — рейтинг.'],
      ['Хто змінює','<code>seed_redis()</code>: стартова позиція. <code>dispatcher.try_assign()</code>: <code>SREM couriers:free c4</code> (захоплення) + <code>HSET status=busy</code>. <code>simulator.tick()</code>: <code>GEOADD</code> щосекунди. <code>simulator.deliver()</code>: <code>SADD couriers:free</code> + <code>ZINCRBY</code>.'],
      ['Хто читає','Диспетчер: <code>GEOSEARCH couriers:geo</code> + <code>SMEMBERS couriers:free</code>. Дашборд і API: <code>GEOPOS</code>, <code>SCARD couriers:free</code>.'],
      ['Чому так','Позиція — «гаряча» й тимчасова: історія координат нікому не потрібна. За вільного кур\'єра змагаються кілька диспетчерів, і атомарний <code>SREM</code> гарантує, що його отримає лише один.'],
    ]],
    order:['Замовлення',[
      ['Що це','Головна сутність. Проходить статуси <code>new → assigned → picked_up → delivered</code> (або <code>waiting</code>, якщо вільних кур\'єрів немає).'],
      ['Правда в PostgreSQL','<code>orders</code> — <b>лише доставлені</b>: customer, restaurant_id, courier_id, items (JSONB), total, fee, created_at, delivered_at.'],
      ['У Redis','<code>STRING order:seq</code> — генератор id. <code>HASH order:42</code> — картка зі статусом. <code>STREAM orders:new</code> — черга для диспетчерів. <code>ZSET orders:active</code> (score = час створення). <code>ZSET orders:waiting</code> (score = коли повторити).'],
      ['Хто змінює','<code>orders.create_order()</code>: <code>INCR order:seq</code>, далі <code>MULTI</code>: <code>HSET</code> + <code>XADD</code> + <code>ZADD</code> + <code>INCR</code> + <code>PFADD</code>, <code>EXEC</code>. <code>dispatcher.try_assign()</code>: <code>status=assigned</code>. <code>simulator.tick()</code>: <code>picked_up</code>. <code>simulator.deliver()</code>: <code>delivered</code>, <code>EXPIRE 3600</code> і <code>INSERT INTO orders</code>.'],
      ['Хто читає','Диспетчер: <code>XREADGROUP</code> → <code>HGETALL order:42</code>. API <code>GET /orders/42</code>. Дашборд: <code>ZRANGE orders:active</code>. API <code>/history</code>: <code>SELECT … FROM orders</code>.'],
      ['Чому так','Поки доставка триває, замовлення змінюється кілька разів за хвилину, і його читають усі сервіси, тож місце йому в Redis. Коли воно завершене, його записують назавжди в PostgreSQL. Id видає Redis (<code>INCR</code>), тому він однаковий в обох базах.'],
    ]],
    cust:['Клієнт',[
      ['Що це','Той, хто замовляє. У навчальному проєкті — просто рядок <code>"client-7"</code> від генератора.'],
      ['Правда в PostgreSQL','Окремої таблиці немає: лише колонка <code>orders.customer</code>. У справжньому сервісі тут була б таблиця <code>customers</code>. Це хороша задача.'],
      ['У Redis','<code>STRING ratelimit:client-7</code> — скільки замовлень за поточну хвилину (<code>INCR</code> + <code>EXPIRE 60</code>). <code>HyperLogLog stats:customers:unique</code> — скільки різних клієнтів.'],
      ['Хто змінює','<code>orders.check_rate_limit()</code>: <code>INCR</code>, а на першому — <code>EXPIRE 60</code>. <code>create_order()</code>: <code>PFADD</code>.'],
      ['Хто читає','Сам <code>check_rate_limit()</code> — порівнює з лімітом 3. Дашборд і <code>/stats</code>: <code>PFCOUNT</code>.'],
      ['Чому так','Лічильник за хвилину не потрібен після хвилини — TTL прибирає його сам. Точна кількість унікальних клієнтів коштувала б пам\'яті на кожного. HyperLogLog дає ~0,8 % похибки за 12 КБ.'],
    ]],
    event:['Подія',[
      ['Що це','Повідомлення «щось сталося з #42»: створено, призначено, забрано, доставлено.'],
      ['Правда в PostgreSQL','Немає: подія цікава лише «зараз». Історію статусів можна відновити з <code>orders</code>.'],
      ['У Redis','Канал <code>PUB/SUB events:orders</code> — нічого не зберігає. <code>LIST events:log</code> — останні 30 подій (<code>LPUSH</code> + <code>LTRIM 0 29</code>).'],
      ['Хто змінює','<code>orders.publish_event()</code>, яку викликають <code>create_order()</code>, <code>try_assign()</code>, <code>tick()</code> і <code>deliver()</code>.'],
      ['Хто читає','API <code>GET /events</code>: <code>SUBSCRIBE</code> → Server-Sent Events у браузер. Дашборд: <code>LRANGE events:log</code>.'],
      ['Чому так','Pub/Sub доставляє лише тим, хто слухає саме зараз: хто відкрив сторінку пізніше, нічого не отримає. Тому подія йде двома шляхами: <code>PUBLISH</code> для «живих» і <code>LIST</code> для новачків.'],
    ]],
  };
  function show(k){document.querySelectorAll('#ent-er .tb').forEach(b=>b.setAttribute('aria-pressed',b.dataset.e===k));
    $('#ent-title').textContent='Картка: '+E[k][0];
    $('#ent-card').innerHTML=E[k][1].map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join('');}
  document.querySelectorAll('#ent-er .tb').forEach(b=>b.onclick=()=>show(b.dataset.e));
  show('order');
  course($('#ent-course'),['l30','l31','taxiarch']);
})();

/* ============ ЖИТТЯ ЗАМОВЛЕННЯ ============ */
(function(){
  const ORDER={id:42,customer:'client-7',restaurant_id:3,items:'[{"name":"Борщ","qty":2}]',total:'240',lat:'50.43',lon:'30.52',status:'new',courier_id:'',created_at:'1795858443'};
  function* gen(){
    const R={}; // key -> {t,v,ttl}
    const set=(k,t,v,ttl)=>{R[k]={t,v,ttl};};
    set('restaurant:3','hash',{name:'Борщ на Печерську',lat:'50.427',lon:'30.538'});
    set('couriers:free','set',['c1','c2','c4']);
    set('couriers:geo','geo',[['c1','30.61 50.47'],['c2','30.55 50.43'],['c4','30.54 50.43']]);
    set('courier:c4','hash',{name:'Тарас',status:'free'});
    set('orders:new','stream',[]);
    set('orders:active','zset',[]);
    let pg=[];let hot=[];let row=null;
    const snap=(st,stage,svc,fn,file,cmd,msg,pgnote)=>({stage,svc,fn,file,cmd,msg,pgnote:pgnote||'',hot:hot.slice(),row,
      keys:Object.entries(R).map(([k,x])=>({k,t:x.t,v:JSON.parse(JSON.stringify(x.v)),ttl:x.ttl,hot:hot.includes(k),gone:x.gone})),pg:pg.map(r=>r.slice())});
    yield snap(0,-1,'—','','','# клієнт натискає «Замовити» в ресторані 3','Старт. У Redis уже лежать копії ресторанів і кур\'єрів (їх завантажив <code>seed_redis()</code>), черга <code>orders:new</code> порожня. У PostgreSQL замовлень немає.');
    hot=['ratelimit:client-7'];set('ratelimit:client-7','string','1',60);
    yield snap(1,0,'generator','check_rate_limit()','app/orders.py','INCR ratelimit:client-7   → (integer) 1\nEXPIRE ratelimit:client-7 60','Rate limit: перше замовлення за хвилину. Лічильник сам зникне через 60 с. Четверте замовлення за хвилину отримало б відмову.');
    hot=['cache:menu:3'];set('cache:menu:3','string','[{"id":9,"name":"Борщ","price":120}, …]',60);
    yield snap(2,0,'generator','get_menu()','app/menu.py','GET cache:menu:3          → (nil)        # MISS\n-- PostgreSQL: SELECT id, name, price FROM menu_items WHERE restaurant_id = 3\nSET cache:menu:3 "[…]" EX 60','Ціни беремо з меню: спершу з кешу Redis, якщо там порожньо — з PostgreSQL, і кладемо в кеш на 60 с. Наступний клієнт цього ресторану отримає меню з Redis.','SELECT menu_items — лише читання, таблиця orders не змінилась.');
    hot=['order:seq'];set('order:seq','string','42');
    yield snap(3,0,'generator','create_order()','app/orders.py','INCR order:seq            → (integer) 42','Новий id без PostgreSQL. <code>INCR</code> атомарний: два одночасні замовлення ніколи не отримають однаковий номер.');
    hot=['order:42','orders:new','orders:active'];set('order:42','hash',{...ORDER});
    R['orders:new'].v=[{id:'1795858443-0',f:'order_id=42',st:'new'}];R['orders:active'].v=[['42','1795858443']];
    yield snap(4,0,'generator','create_order()','app/orders.py','MULTI\nHSET order:42 id 42 customer client-7 restaurant_id 3 items "[…]" total 240 status new …\nXADD orders:new * order_id 42\nZADD orders:active 1795858443 42\nINCR stats:orders:2026-11-28\nPFADD stats:customers:unique client-7\nEXEC','Транзакція: картка замовлення, запис у черзі й місце серед активних з\'являються <b>разом або ніяк</b>. Без <code>MULTI</code> падіння між <code>HSET</code> і <code>XADD</code> лишило б замовлення, про яке диспетчер ніколи не дізнається.');
    hot=['events:log'];set('events:log','list',['{"order_id":42,"status":"new",…}']);
    yield snap(5,0,'generator','publish_event()','app/orders.py','PUBLISH events:orders "{…new…}"   → (integer) 1   # скільки слухачів отримали\nLPUSH events:log "{…}"\nLTRIM events:log 0 29','Подія для дашборду: <code>PUBLISH</code> отримають ті, хто слухає зараз, а <code>LPUSH</code> лишає слід у стрічці.');
    hot=['orders:new'];R['orders:new'].v[0].st='pend';
    yield snap(6,0,'dispatcher','run()','app/dispatcher.py','XREADGROUP GROUP dispatchers dispatcher-1 COUNT 10 BLOCK 1000 STREAMS orders:new >\n  → 1795858443-0 {order_id: 42}','Диспетчер забрав повідомлення з черги. Воно ще <b>pending</b>: Redis пам\'ятає, що його отримав dispatcher-1, але той не підтвердив обробку. Якщо диспетчер зараз упаде, повідомлення не загубиться.');
    hot=['restaurant:3','couriers:geo','couriers:free'];
    yield snap(7,0,'dispatcher','try_assign()','app/dispatcher.py','HGETALL order:42 · HGETALL restaurant:3\nGEOSEARCH couriers:geo FROMLONLAT 30.538 50.427 BYRADIUS 15 km ASC COUNT 20 WITHDIST\n  → c4 0.3 км, c2 1.4 км, c1 7.0 км\nSMEMBERS couriers:free → c1 c2 c4','Хто найближче до ресторану? <code>GEOSEARCH</code> повертає кур\'єрів від найближчого до дальшого.');
    hot=['couriers:free'];R['couriers:free'].v=['c1','c2'];
    yield snap(8,1,'dispatcher','try_assign()','app/dispatcher.py','SREM couriers:free c4      → (integer) 1   # наш!','Атомарне захоплення: якби інший диспетчер узяв c4 на мить раніше, ми отримали б 0 і пішли до c2. Двох замовлень на одного кур\'єра не буде.');
    hot=['courier:c4','order:42'];R['courier:c4'].v={name:'Тарас',status:'busy',order_id:'42',phase:'to_restaurant'};R['order:42'].v.status='assigned';R['order:42'].v.courier_id='c4';
    yield snap(9,1,'dispatcher','try_assign()','app/dispatcher.py','HSET courier:c4 status busy order_id 42 phase to_restaurant …\nHSET order:42 status assigned courier_id c4\nZREM orders:waiting 42\nPUBLISH events:orders "{…assigned…}"','Кур\'єр і замовлення тепер посилаються одне на одного. Цей зв\'язок тримає наш код, а не <code>FOREIGN KEY</code>.');
    hot=['orders:new'];R['orders:new'].v[0].st='ack';
    yield snap(10,1,'dispatcher','run()','app/dispatcher.py','XACK orders:new dispatchers 1795858443-0   → (integer) 1','Підтвердили <b>після</b> обробки: повідомлення пішло з pending. Підтвердження до обробки повернуло б ризик втратити замовлення при падінні.');
    hot=['couriers:geo','courier:c4','order:42'];R['couriers:geo'].v[2]=['c4','30.538 50.427'];R['courier:c4'].v.phase='to_customer';R['order:42'].v.status='picked_up';
    yield snap(11,2,'simulator','tick()','app/simulator.py','GEOADD couriers:geo 30.540 50.428 c4   # щосекунди, крок до цілі\n…\nHSET courier:c4 phase to_customer target_lat 50.43 …\nHSET order:42 status picked_up','Симулятор щосекунди рухає кур\'єра (<code>GEOADD</code> перезаписує точку). Кур\'єр дійшов до ресторану, забрав їжу й тепер їде до клієнта.');
    hot=['order:42','orders:active','courier:c4','couriers:free','lb:couriers:deliveries'];
    R['order:42'].v.status='delivered';R['order:42'].ttl=3600;R['orders:active'].v=[];R['courier:c4'].v={name:'Тарас',status:'free',order_id:'',phase:''};R['couriers:free'].v=['c1','c2','c4'];
    set('lb:couriers:deliveries','zset',[['c4','1']]);
    yield snap(12,3,'simulator','deliver()','app/simulator.py','MULTI\nHSET order:42 status delivered delivered_at …\nEXPIRE order:42 3600\nZREM orders:active 42\nZINCRBY lb:couriers:deliveries 1 c4\nZINCRBY lb:restaurants:revenue 240 3\nINCR stats:delivered\nHSET courier:c4 status free order_id "" phase ""\nSADD couriers:free c4\nEXEC','Доставлено. Одна транзакція оновлює статус, рейтинг і лічильники й повертає кур\'єра до вільних. Картці замовлення в Redis лишилась година життя.');
    hot=[];pg=[['42','client-7','3','c4','240.00','2026-11-28 09:41']];row=0;
    yield snap(13,4,'simulator','db.save_delivered_order()','app/db.py','-- PostgreSQL:\nINSERT INTO orders (id, customer, restaurant_id, courier_id, items, total, fee, created_at, delivered_at, lat, lon)\nVALUES (42, \'client-7\', 3, \'c4\', \'[…]\'::jsonb, 240, 50, …)\nON CONFLICT (id) DO NOTHING','Тепер замовлення <b>назавжди</b> в PostgreSQL. <code>ON CONFLICT DO NOTHING</code> робить запис безпечним для повтору: якщо його випадково виконати двічі, дубля не буде.','INSERT — єдиний запис у PostgreSQL за все життя замовлення.');
    hot=['order:42'];R['order:42'].gone=true;R['order:42'].ttl=null;delete R['cache:menu:3'];delete R['ratelimit:client-7'];row=0;
    yield snap(14,4,'—','','','# минула година: TTL вийшов\nEXISTS order:42   → (integer) 0','Через годину Redis сам прибрав <code>order:42</code>, а кеш меню й лічильник rate limit зникли ще раніше. Redis прибирає за собою, а історія лишилась у PostgreSQL. Саме для неї ми його й тримаємо.','Рядок у PostgreSQL лишився: це і є історія замовлень.');
  }
  const flowHost=$('#life-flow');flow(flowHost,['new','assigned','picked_up','delivered','рядок у PostgreSQL']);
  function render(s){flowOn(flowHost,s.stage);
    $('#life-where').innerHTML=s.svc==='—'?'<span class="lab">Сервіс:</span> —':`<span class="pill svc">${esc(s.svc)}</span> <code>${esc(s.file)}</code> → <code>${esc(s.fn)}</code>`;
    $('#life-cmd').textContent=s.cmd;$('#life-msg').innerHTML=s.msg;
    keys($('#life-keys'),s.keys);
    pgt($('#life-pg'),'orders',['id','customer','restaurant_id','courier_id','total','delivered_at'],s.pg,{hot:s.row,empty:'0 рядків — поки доставка триває, замовлення живе лише в Redis'});
    $('#life-pgnote').textContent=s.pgnote||'PostgreSQL на цьому кроці не задіяний.';}
  const r=new Runner(gen,render);r.delay=1400;controls($('#life-controls'),r,'life');
  course($('#life-course'),['taxi','l31','l30']);
})();
