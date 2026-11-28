/* ============ ЩО ТАКЕ ============ */
course($('#whatis-course'),['l30','l31','duck','taxiarch']);

/* ============ 7 КРОКІВ ПРОЄКТУВАННЯ ============ */
(function(){
  const where=(f,why)=>`<div class="note" style="margin-top:10px"><b>Де в коді:</b> ${f}<br><b>Чому саме там:</b> ${why}</div>`;
  const STEPS=[
    {h:'Крок 1. Сценарії: що система має вміти',
     b:`<p>Запиши 5–10 речень «хто → що робить → що хоче побачити». Кожне речення стане запитом до бази. Чого немає в сценаріях, те в базу не потрапляє.</p>
        <ol><li>Клієнт бачить меню ресторану з цінами.</li><li>Клієнт замовляє; більше 3 замовлень за хвилину не можна.</li><li>Диспетчер призначає <b>найближчого вільного</b> кур'єра.</li><li>Кур'єр їде, і на мапі видно, де він <b>зараз</b>.</li><li>Доставлене замовлення зберігається назавжди: гроші.</li><li>Власниця бачить рейтинг кур'єрів і виторг ресторанів.</li><li>Аналітик рахує середній час доставки за рік.</li></ol>`
        +where('<code>README.md</code> проєкту — розділ «Що відбувається»; дашборд показує сценарії 4 і 6.','сценарії — це вимоги. Код і схема — відповідь на них.'),
     c:['# Питання, на які система має відповідати','menu(restaurant)            → страви й ціни','can_order(customer)         → чи не перевищено ліміт','nearest_free(lat, lon)      → вільний кур\'єр поруч','where_is(courier)           → координати зараз','history(order)              → доставлене назавжди','top(couriers), revenue()    → рейтинги','avg_delivery_time(year)     → аналітика']},
    {h:'Крок 2. Сутності: іменники зі сценаріїв',
     b:`<p>Підкресли <b>іменники</b> — кандидати в сутності: ресторан, страва, клієнт, кур'єр, замовлення. <b>Дієслова</b> (замовити, призначити, доставити) — це функції, які змінюють сутності.</p>
        <p>Для кожної сутності — картка: що це, що знає (поля), хто її створює і змінює. Сутність, у якої немає власних даних (клієнт: лише ім'я), може не мати окремої таблиці.</p>`
        +where('<code>sql/init.sql</code> — чотири таблиці; функції-дієслова — <code>create_order()</code>, <code>try_assign()</code>, <code>deliver()</code>.','таблиці зберігають сутності, функції в <code>app/*.py</code> їх змінюють. Вкладка «Сутності» показує картку кожної.'),
     c:['# іменники → таблиці        # дієслова → функції','restaurants                 orders.create_order()   замовити','menu_items                  dispatcher.try_assign() призначити','couriers                    simulator.tick()        їхати','orders                      simulator.deliver()     доставити','(customer — лише колонка:   menu.get_menu()         показати меню','  власних даних немає)']},
    {h:'Крок 3. Поля і типи: правила — у схему',
     b:`<p>Для кожної сутності: які поля, якого типу, що обов'язкове. Правила, які не можна порушити, пиши <b>в схему</b>, а не лише в Python: тоді їх не обійде жодна програма.</p>
        <ul><li>гроші — <code>NUMERIC(8,2)</code>, не <code>float</code>: 0.1 + 0.2 ≠ 0.3;</li><li>час — <code>TIMESTAMPTZ</code> (з часовим поясом);</li><li><code>NOT NULL</code> — де значення обов'язкове;</li><li><code>CHECK (price &gt; 0)</code> — бізнес-правило.</li></ul>`
        +where('<code>sql/init.sql</code>, таблиця <code>menu_items</code>.','база — останній рубіж: навіть якщо в коді API помилка, від\'ємна ціна не запишеться.'),
     c:['CREATE TABLE menu_items (','    id            SERIAL PRIMARY KEY,','    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),','    name          TEXT NOT NULL,','    price         NUMERIC(8,2) NOT NULL CHECK (price > 0)',');']},
    {h:'Крок 4. Зв\'язки: хто кому належить',
     b:`<p>Між кожною парою сутностей спитай: «скільки X в одного Y?»</p>
        <ul><li><b>1:N</b> — у ресторану багато страв → <code>menu_items.restaurant_id</code> з <code>REFERENCES</code>;</li><li><b>N:1</b> — замовлення належить одному ресторану й одному кур'єру → два зовнішні ключі в <code>orders</code>;</li><li><b>M:N</b> — замовлення має багато страв, страва в багатьох замовленнях → зазвичай окрема таблиця <code>order_items</code>.</li></ul>
        <p>У проєкті M:N зроблено інакше: <code>items JSONB</code>, <b>знімок</b> страв і цін на момент замовлення. Ціни в меню змінюються, а в чеку мають лишитися ті, що були.</p>`
        +where('<code>sql/init.sql</code>, таблиця <code>orders</code>.','зовнішній ключ не дасть записати замовлення неіснуючого ресторану. <code>JOIN</code> по цих ключах — у <code>db.py</code> і в задачах уроку 30.'),
     c:['CREATE TABLE orders (','    id            BIGINT PRIMARY KEY,         -- з Redis: INCR order:seq','    customer      TEXT NOT NULL,','    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),  -- N:1','    courier_id    TEXT REFERENCES couriers(id),                -- N:1','    items         JSONB NOT NULL,             -- знімок M:N на момент замовлення','    total         NUMERIC(8,2) NOT NULL,','    created_at    TIMESTAMPTZ NOT NULL,','    delivered_at  TIMESTAMPTZ NOT NULL, ...',');']},
    {h:'Крок 5. Правда чи гаряче: що йде в Redis',
     b:`<p>Для кожної сутності три питання:</p>
        <ol><li>Чи можна її <b>втратити</b>? Ні → правда в PostgreSQL.</li><li>Чи змінюється вона <b>щосекунди</b> або її читають <b>кілька процесів одночасно</b>? Так → гаряча копія чи стан у Redis.</li><li>З чого її <b>відновити</b>, якщо Redis очиститься?</li></ol>
        <p>Замовлення в дорозі — гаряче (статус змінюється, читають усі сервіси), доставлене — правда. Тому одна сутність живе у двох місцях у різні моменти життя.</p>`
        +where('<code>app/config.py</code> — повний список ключів; <code>seed.py</code> — відновлення Redis з PostgreSQL.','у Redis немає схеми. Якщо назви ключів розкидані по файлах, одна описка — і два сервіси мовчки пишуть у різні ключі.'),
     c:['# сутність     правда (PG)     гаряче (Redis)               відновлення','restaurant    restaurants     restaurant:<id>, *:geo       seed_redis()','menu          menu_items      cache:menu:<id>  EX 60        сам: MISS → SELECT','courier       couriers        courier:<id>, couriers:geo,  seed_redis()','                              couriers:free','order         orders          order:<id>, orders:new,      активні губляться*','              (доставлені)    orders:active','','# * тому Redis з --appendonly yes (docker-compose.yml)']},
    {h:'Крок 6. Операції → структури Redis',
     b:`<p>Тип Redis обирають за <b>операцією</b>, а не за даними. Одні й ті самі кур'єри лежать у чотирьох структурах, бо з ними роблять чотири різні речі.</p>
        <table class="t"><tr><th>Операція</th><th>Тип</th><th>Ключ у проєкті</th></tr>
        <tr><td>картка з полями</td><td>HASH</td><td><code>courier:c4</code></td></tr><tr><td>хто поруч</td><td>GEO</td><td><code>couriers:geo</code></td></tr><tr><td>взяти вільного атомарно</td><td>SET + SREM</td><td><code>couriers:free</code></td></tr><tr><td>рейтинг</td><td>ZSET</td><td><code>lb:couriers:deliveries</code></td></tr>
        <tr><td>черга з підтвердженням</td><td>STREAM</td><td><code>orders:new</code></td></tr><tr><td>лічильник, id</td><td>STRING + INCR</td><td><code>order:seq</code></td></tr><tr><td>останні N подій</td><td>LIST + LTRIM</td><td><code>events:log</code></td></tr><tr><td>кеш з терміном</td><td>STRING + EX</td><td><code>cache:menu:3</code></td></tr></table>`
        +where('<code>app/config.py</code>: біля кожного ключа — тип і навіщо.','одне місце, яке читає людина: «карта даних» проєкту.'),
     c:['COURIERS_GEO   = "couriers:geo"     # GEO    — живі координати кур\'єрів','COURIERS_FREE  = "couriers:free"    # SET    — вільні (SREM = атомарний «захват»)','LB_COURIERS    = "lb:couriers:deliveries"  # ZSET — рейтинг','ORDER_SEQ      = "order:seq"        # STRING — лічильник id (INCR)','ORDERS_STREAM  = "orders:new"       # STREAM — черга нових замовлень','EVENTS_LOG     = "events:log"       # LIST   — останні події','','def courier_key(cid): return f"courier:{cid}"    # HASH','def order_key(oid):   return f"order:{oid}"      # HASH']},
    {h:'Крок 7. Потік даних: хто, куди і коли пише',
     b:`<p>Намалюй стрілки: який процес що читає й куди пише. Перевір три правила:</p>
        <ul><li><b>Одна правда</b> на кожен факт. Дублікати (кеш, копії) мають TTL або відновлюються з правди.</li><li><b>Межа запису в правду</b> — у явному місці: тут лише <code>deliver()</code> → <code>save_delivered_order()</code>, і повтор безпечний (<code>ON CONFLICT DO NOTHING</code>).</li><li><b>Аналітика — окремо</b>: важкі <code>GROUP BY</code> за роки йдуть по копії в parquet, а не по живій базі.</li></ul>`
        +where('<code>app/simulator.py: deliver()</code> → <code>app/db.py: save_delivered_order()</code>. Повна схема стрілок — вкладка «Архітектура проєкту».','момент «замовлення завершено» — єдиний, коли факт стає остаточним. Записувати раніше означало б оновлювати рядок щосекунди.'),
     c:['def deliver(r, cid, order_id):                  # app/simulator.py','    order = r.hgetall(C.order_key(order_id))','    pipe = r.pipeline(transaction=True)         # Redis: усе разом','    pipe.hset(..., {"status": "delivered"})','    pipe.expire(C.order_key(order_id), 3600)    # гаряча копія зникне сама','    pipe.zincrby(C.LB_COURIERS, 1, cid)','    pipe.sadd(C.COURIERS_FREE, cid)','    pipe.execute()','    db.save_delivered_order(order)              # → PostgreSQL: назавжди','','# app/db.py:  INSERT INTO orders ... ON CONFLICT (id) DO NOTHING']},
  ];
  const F=$('#design-flow');flow(F,['сценарії','сутності','поля','зв\'язки','правда/гаряче','операції→типи','потік']);
  function* gen(){for(let i=0;i<STEPS.length;i++)yield i;}
  function render(i){flowOn(F,i);const s=STEPS[i];$('#design-h').textContent=s.h;$('#design-body').innerHTML=s.b;code($('#design-code'),s.c);}
  const r=new Runner(gen,render);r.delay=4000;controls($('#design-controls'),r,'design');
  F.onclick=e=>{const n=e.target.closest('.node');if(!n)return;r.pause();r.reset();while(r.state!==+n.dataset.i&&!r.done)r.step();};
  course($('#design-course'),['l30','taxiarch','taxi']);
})();

/* ============ ОПИТУВАЛЬНИК ============ */
(function(){
  const Q=[
    {id:'lose',q:'1. Що буде, якщо ці дані зникнуть?',o:[['money','Втратимо гроші, документи, історію'],['restore','Неприємно, але відновимо з іншого місця'],['none','Нічого страшного: перерахуємо або це тимчасово']]},
    {id:'freq',q:'2. Як часто змінюється одиниця даних?',o:[['rare','Рідко: раз на хвилини, дні'],['fast','Часто: щосекунди, сотні разів на секунду']]},
    {id:'who',q:'3. Хто й як читає?',o:[['app','Програма: пошук за умовами, JOIN'],['many','Кілька процесів одночасно, за ключем'],['analyst','Аналітик: агрегати за довгий період']]},
    {id:'op',q:'4. Головна операція',o:[['row','Записати / знайти запис'],['counter','+1 до лічильника'],['queue','Черга задач для воркерів'],['rank','Топ-N, рейтинг'],['geo','Хто поруч'],['unique','Чи бачили вже? / скільки різних'],['recent','Останні N подій'],['cache','Не рахувати дороге двічі'],['agg','Сума / середнє за період']]},
    {id:'join',q:'5. Потрібні зв\'язки з іншими даними (JOIN)?',o:[['yes','Так'],['no','Ні']]},
    {id:'life',q:'6. Скільки живуть дані?',o:[['forever','Назавжди'],['process','Поки триває процес'],['ttl','Фіксований час (хвилина, година)']]},
    {id:'size',q:'7. Обсяг',o:[['small','Поточний стан: до мільйонів записів'],['big','Історія за роки: сотні мільйонів рядків']]},
  ];
  const PRE={
    'Баланс гаманця':{lose:'money',freq:'rare',who:'app',op:'row',join:'yes',life:'forever',size:'small'},
    'Перегляди статті':{lose:'none',freq:'fast',who:'many',op:'counter',join:'no',life:'forever',size:'small'},
    'Черга листів':{lose:'restore',freq:'fast',who:'many',op:'queue',join:'no',life:'process',size:'small'},
    'Позиції таксі':{lose:'none',freq:'fast',who:'many',op:'geo',join:'no',life:'process',size:'small'},
    'Поїздки за 3 роки':{lose:'restore',freq:'rare',who:'analyst',op:'agg',join:'yes',life:'forever',size:'big'},
    'Рейтинг гравців':{lose:'restore',freq:'fast',who:'many',op:'rank',join:'no',life:'forever',size:'small'},
    'Код з SMS на 5 хв':{lose:'none',freq:'rare',who:'many',op:'row',join:'no',life:'ttl',size:'small'},
  };
  const A={};
  const OPS={
    counter:['STRING + INCR','stats:views:<id>','<code>order:seq</code>, <code>stats:delivered</code> — <code>create_order()</code>, <code>deliver()</code>','INCR атомарний: читає, додає й пише однією командою, тож з п\'яти процесів не загубиться жодне +1.'],
    queue:['STREAM + consumer group','emails:new','<code>orders:new</code> — <code>create_order()</code> пише, <code>dispatcher.run()</code> читає','Stream тримає повідомлення в pending до XACK: воркер упав — задача не губиться, а кілька воркерів ділять роботу.'],
    rank:['ZSET','lb:players:score','<code>lb:couriers:deliveries</code> — <code>deliver()</code> (ZINCRBY), дашборд (ZRANGE)','ZSET тримає елементи відсортованими за score: топ-10 — одна команда без сортування.'],
    geo:['GEO','taxis:geo','<code>couriers:geo</code> — <code>simulator.tick()</code> (GEOADD), <code>try_assign()</code> (GEOSEARCH)','GEO шукає в радіусі за індексом: не перебирати всіх і не рахувати відстані в Python.'],
    unique:['SET (точно) або HyperLogLog (приблизно, 12 КБ)','seen:<день>','<code>stats:customers:unique</code> (PFADD) — <code>create_order()</code>; <code>couriers:free</code> (SET)','SADD/SISMEMBER відповідають «чи є» за O(1); HyperLogLog рахує мільйони різних, займаючи 12 КБ.'],
    recent:['LIST + LPUSH + LTRIM','feed:<user>','<code>events:log</code> — <code>publish_event()</code>','LPUSH + LTRIM 0 N-1 — як deque(maxlen=N): список не росте вічно.'],
    cache:['STRING + EX (cache-aside)','cache:<що>:<id>','<code>cache:menu:&lt;id&gt;</code> — <code>menu.get_menu()</code>, <code>invalidate_menu()</code>','Дорогий результат рахуємо раз і кладемо з TTL: застаріле проживе не довше TTL, а правда лишається в PostgreSQL.'],
  };
  function rec(){
    const why=[],warn=[];let store,struct,key,analog,code;
    if(A.op==='agg'||A.who==='analyst'||A.size==='big'){
      store='🦆 DuckDB + parquet (data lake)';struct='колонкові файли parquet, розкладені за датою';key='data/year=2026/month=11/*.parquet';
      analog='вкладка «Аналітика»: <code>orders</code> → CSV → parquet → DuckDB';code='окремий скрипт вивантаження; живий сервіс про нього не знає';
      why.push('Агрегати по мільйонах рядків читають кілька колонок — колонкове зберігання читає лише їх.','Аналітика не навантажує живу базу, де клієнти роблять замовлення.');
      if(A.lose==='money')why.push('Правда при цьому лишається в PostgreSQL; parquet — копія для звітів.');
      if(A.freq==='fast')warn.push('Часті дрібні записи в parquet не роблять: пиши в PostgreSQL/Redis, а в lake вивантажуй пачками (раз на годину/добу).');
    }else if(A.lose==='money'||(A.op==='row'&&(A.join==='yes'||A.life==='forever'))){
      store='🐘 PostgreSQL';struct='таблиця з PRIMARY KEY, FOREIGN KEY, NOT NULL, CHECK';key='CREATE TABLE …';
      analog='<code>orders</code>, <code>restaurants</code>, <code>menu_items</code> — <code>sql/init.sql</code>, запити в <code>app/db.py</code>';code='SQL — в одному модулі (<code>db.py</code>), схема — в <code>init.sql</code>/міграціях';
      why.push('Транзакції ACID: записалось — то назавжди, і або все, або нічого.','Схема й зовнішні ключі не дадуть записати неправильні дані.');
      if(A.join==='yes')why.push('Зв\'язки з іншими даними — JOIN, природна робота реляційної бази.');
      if(A.freq==='fast'||A.who==='many'){warn.push('Дані змінюються часто або їх читають багато процесів: тримай <b>гарячу копію в Redis</b> (як <code>order:&lt;id&gt;</code>) і пиши в PostgreSQL у момент, коли факт став остаточним (як <code>deliver()</code>).');}
      if(A.op!=='row'&&OPS[A.op])warn.push(`Операція «${Q[3].o.find(o=>o[0]===A.op)[1]}» — для неї поруч у Redis: ${OPS[A.op][0]}.`);
    }else{
      const o=OPS[A.op]||['HASH','<сутність>:<id>','<code>order:&lt;id&gt;</code>, <code>courier:&lt;id&gt;</code> — <code>create_order()</code>, <code>try_assign()</code>','HASH — словник полів під одним ключем: HSET змінює одне поле, HGETALL читає картку цілком, швидко й з будь-якого процесу.'];
      store='⚡ Redis';[struct,key,analog]=o;why.push(o[3]);code='назву ключа — у <code>config.py</code>, команди — у функції сервісу, що виконує операцію';
      if(A.freq==='fast')why.push('Пам\'ять, мікросекунди: витримує сотні змін на секунду.');
      if(A.who==='many')why.push('Кілька процесів бачать той самий стан і змінюють його атомарними командами.');
      if(A.life==='ttl'){key+=' … EX <секунд>';why.push('TTL: Redis сам видалить ключ, коли мине час.');}
      if(A.life==='process')why.push('Коли процес завершився — DEL або EXPIRE (як EXPIRE 3600 у <code>deliver()</code>).');
      if(A.life==='forever'&&A.lose!=='none')warn.push('Дані мають жити назавжди, а Redis — пам\'ять: увімкни AOF (<code>--appendonly yes</code>) або тримай правду в PostgreSQL і відновлюй з неї (як <code>seed_redis()</code>).');
      if(A.join==='yes')warn.push('JOIN у Redis немає: зв\'язки доведеться склеювати в Python. Якщо зв\'язків багато — це знак, що правда має бути в PostgreSQL.');
      if(A.lose==='restore')why.push('Якщо Redis очиститься, дані відновлюються з іншого джерела — тому їм не потрібна правда в PostgreSQL.');
    }
    return {store,struct,key,analog,code,why,warn};
  }
  function draw(){
    $('#survey-form').innerHTML=Q.map(q=>`<div style="margin-bottom:12px"><div style="font-weight:600;margin-bottom:5px">${q.q}</div><div class="presets" style="margin:0">${q.o.map(([v,t])=>`<button class="btn${A[q.id]===v?' primary':''}" data-q="${q.id}" data-v="${v}">${esc(t)}</button>`).join('')}</div></div>`).join('');
    const left=Q.filter(q=>!A[q.id]);
    if(left.length){$('#survey-out').innerHTML=`<h3>Рекомендація</h3><p style="color:var(--muted)">Залишилось відповісти: ${left.map(q=>q.q.split('.')[0]).join(', ')}.</p>`;return;}
    const r=rec();
    $('#survey-out').innerHTML=`<h3>Рекомендація</h3>
      <div style="font-size:22px;font-weight:700;margin:4px 0 10px">${r.store}</div>
      <table class="t"><tr><th>Структура</th><td>${r.struct}</td></tr><tr><th>Приклад</th><td><code>${esc(r.key)}</code></td></tr><tr><th>Аналог у «Смачно + Таксі»</th><td>${r.analog}</td></tr><tr><th>Де в коді</th><td>${r.code}</td></tr></table>
      <h3 style="margin-top:14px">Чому</h3><ul style="margin:0;padding-left:20px">${r.why.map(w=>`<li>${w}</li>`).join('')}</ul>
      ${r.warn.length?`<h3 style="margin-top:14px">⚠ Зверни увагу</h3><ul style="margin:0;padding-left:20px">${r.warn.map(w=>`<li>${w}</li>`).join('')}</ul>`:''}`;
  }
  $('#survey-form').onclick=e=>{const b=e.target.closest('[data-q]');if(!b)return;A[b.dataset.q]=b.dataset.v;draw();};
  $('#survey-presets').innerHTML=Object.keys(PRE).map(n=>`<button class="btn" data-p="${esc(n)}">${esc(n)}</button>`).join('')+'<button class="btn" data-p="">Очистити</button>';
  $('#survey-presets').onclick=e=>{const b=e.target.closest('[data-p]');if(!b)return;for(const k in A)delete A[k];Object.assign(A,PRE[b.dataset.p]||{});draw();};
  draw();
  course($('#survey-course'),['l30','l31','duck']);
})();

/* ============ КОНСТРУКТОР ============ */
(function(){
  const BEH=[['truth','правда: зберігати назавжди'],['state','стан змінюється щосекунди'],['cache','часто читають, рідко міняють'],['queue','потрапляє в чергу обробки'],['pool','пул «вільних» (взяти один атомарно)'],['counter','рахуємо кількість'],['rank','рейтинг / топ'],['geo','має координати, шукаємо поруч']];
  const TYPES={text:'TEXT',int:'INTEGER',float:'DOUBLE PRECISION',money:'NUMERIC(10,2)',time:'TIMESTAMPTZ',bool:'BOOLEAN',json:'JSONB',date:'DATE'};
  const TPL={
    'Смачно + Таксі':[
      {n:'restaurants',f:'name text!\ncuisine text!\nlat float!\nlon float!',b:['truth','cache','rank','geo']},
      {n:'menu_items',f:'restaurant_id -> restaurants!\nname text!\nprice money! >0',b:['truth','cache']},
      {n:'couriers',f:'name text!\nlat float\nlon float',b:['truth','state','pool','rank','geo']},
      {n:'orders',f:'customer text!\nrestaurant_id -> restaurants!\ncourier_id -> couriers\nitems json!\ntotal money!\ncreated_at time!\ndelivered_at time',b:['truth','state','queue','counter']}],
    'Бібліотека':[
      {n:'authors',f:'name text!',b:['truth']},
      {n:'books',f:'title text!\nauthor_id -> authors!\nyear int\ncopies int! >=0',b:['truth','cache','rank']},
      {n:'readers',f:'name text!\nemail text! unique',b:['truth']},
      {n:'loans',f:'book_id -> books!\nreader_id -> readers!\ntaken_at time!\nreturned_at time',b:['truth','counter']}],
    'Інтернет-магазин':[
      {n:'products',f:'name text!\nprice float!\ntags list',b:['truth','cache','rank']},
      {n:'customers',f:'email text! unique\nname text!',b:['truth']},
      {n:'carts',f:'customer_id -> customers!\nupdated_at time!',b:['state']},
      {n:'orders',f:'customer_id -> customers!\ntotal money!\ncreated_at time!\nstatus text!',b:['truth','queue','counter']},
      {n:'order_items',f:'order_id -> orders!\nproduct_id\nqty int! >0\nprice money!',b:['truth']}],
    'З нуля':[{n:'',f:'',b:[]}],
  };
  let E=[];
  const sing=n=>n.endsWith('ies')?n.slice(0,-3)+'y':n.endsWith('ses')?n.slice(0,-2):n.endsWith('s')?n.slice(0,-1):n;
  const up=s=>s.toUpperCase().replace(/[^A-Z0-9]+/g,'_');
  function parse(e){return e.f.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{
    const m=l.match(/^([A-Za-z_а-яієїґА-ЯІЄЇҐ][\wа-яієїґА-ЯІЄЇҐ]*)\s*(.*)$/);if(!m)return{bad:l};
    let [,name,rest]=m;const f={name,raw:l,nn:/!/.test(rest),uniq:/\bunique\b/.test(rest)};
    const ref=rest.match(/->\s*([\w]+)/);if(ref)f.ref=ref[1];
    const chk=rest.match(/(>=|>|<=|<)\s*(-?\d+(?:\.\d+)?)/);if(chk)f.check=chk[1]+' '+chk[2];
    const t=rest.replace(/->\s*\w+/,'').match(/\b(text|int|float|money|time|bool|json|date|list)\b/);f.type=t?t[1]:(f.ref?'ref':'');
    return f;});}
  function analyze(){
    const W=[],sql=[],rk=[],rel=[];const names=E.map(e=>e.n.trim()).filter(Boolean);
    const idType={};E.forEach(e=>idType[e.n.trim()]='id');
    E.forEach(e=>{const n=e.n.trim();if(!n){W.push(['bad','У сутності немає назви.']);return;}
      if(!/^[a-z][a-z0-9_]*$/.test(n))W.push(['bad',`<code>${esc(n)}</code>: назву таблиці пиши латиницею в snake_case (<code>menu_items</code>) — так її зручно писати в SQL і в ключах Redis.`]);
      else if(!n.endsWith('s'))W.push(['tip',`<code>${esc(n)}</code>: таблиці зазвичай називають у множині (<code>${esc(n)}s</code>): у ній багато рядків.`]);
      if(names.filter(x=>x===n).length>1)W.push(['bad',`Сутність <code>${esc(n)}</code> є двічі.`]);
      const F=parse(e);const seen=new Set();const cols=['    id            '+(n==='couriers'?'TEXT':'BIGSERIAL')+' PRIMARY KEY'];
      const b=new Set(e.b);
      F.forEach(f=>{if(f.bad){W.push(['bad',`<code>${esc(n)}</code>: не розібрав рядок «${esc(f.bad)}». Формат: <code>назва тип</code>, наприклад <code>price money!</code>.`]);return;}
        if(seen.has(f.name))W.push(['bad',`<code>${esc(n)}.${esc(f.name)}</code> повторюється.`]);seen.add(f.name);
        if(f.name==='id'){W.push(['tip',`<code>${esc(n)}.id</code> додається сам — PRIMARY KEY.`]);return;}
        let sqlt=TYPES[f.type]||'TEXT';
        if(f.ref){if(!names.includes(f.ref))W.push(['bad',`<code>${esc(n)}.${esc(f.name)} -> ${esc(f.ref)}</code>: сутності <code>${esc(f.ref)}</code> немає.`]);
          sqlt=(f.ref==='couriers'?'TEXT':'BIGINT')+` REFERENCES ${f.ref}(id)`;rel.push(`<b>${esc(n)}</b> N : 1 <b>${esc(f.ref)}</b> — у кожного рядка <code>${esc(n)}</code> один <code>${esc(f.ref)}</code>, у <code>${esc(f.ref)}</code> багато <code>${esc(n)}</code> (через <code>${esc(n)}.${esc(f.name)}</code>)`);
          if(!f.name.endsWith('_id'))W.push(['tip',`<code>${esc(n)}.${esc(f.name)}</code>: зовнішній ключ зручно називати <code>${esc(sing(f.ref))}_id</code>.`]);}
        else if(f.name.endsWith('_id')){W.push(['bad',`<code>${esc(n)}.${esc(f.name)}</code> схоже на зв'язок, але не сказано, на що він вказує. Допиши <code>-&gt; ${esc(f.name.slice(0,-3))}s</code>, інакше база не перевірить, що такий запис існує.`]);}
        if(!f.type&&!f.ref)W.push(['tip',`<code>${esc(n)}.${esc(f.name)}</code>: тип не вказано, ставлю TEXT. Типи: ${Object.keys(TYPES).join(', ')}.`]);
        if(f.type==='list'){W.push(['bad',`<code>${esc(n)}.${esc(f.name)}</code>: список у колонці — це прихований зв'язок M:N. Винеси в окрему таблицю (наприклад <code>${esc(sing(n))}_${esc(f.name)}</code> з двома зовнішніми ключами) або, якщо це незмінний знімок, візьми <code>json</code>.`]);sqlt='TEXT[]  -- ⚠ див. зауваження';}
        if(f.type==='float'&&/price|total|sum|amount|cost|fee|balance|ціна|сума/i.test(f.name))W.push(['bad',`<code>${esc(n)}.${esc(f.name)}</code> — гроші у <code>float</code>: 0.1 + 0.2 = 0.30000000000000004. Візьми <code>money</code> (NUMERIC).`]);
        if(/_at$/.test(f.name)&&f.type!=='time')W.push(['tip',`<code>${esc(n)}.${esc(f.name)}</code>: <code>_at</code> зазвичай означає момент часу — тип <code>time</code> (TIMESTAMPTZ).`]);
        if(f.name==='status'&&!b.has('state'))W.push(['tip',`<code>${esc(n)}.status</code> змінюється протягом життя запису. Якщо часто, познач «стан змінюється щосекунди» — і поточний статус житиме в Redis, як <code>order:&lt;id&gt;</code>.`]);
        cols.push(`    ${f.name.padEnd(13)} ${sqlt}${f.nn?' NOT NULL':''}${f.uniq?' UNIQUE':''}${f.check?` CHECK (${f.name} ${f.check})`:''}`);});
      const has=x=>F.some(f=>f.name===x);
      if(b.has('truth')||!e.b.length)sql.push(`CREATE TABLE ${n} (\n${cols.join(',\n')}\n);`);
      if(!e.b.length)W.push(['tip',`<code>${esc(n)}</code>: не позначено, що з нею робить система. Без цього не зрозуміло, де вона має жити.`]);
      const S=sing(n),U=up(n);
      if(b.has('state')){rk.push(`def ${S}_key(id): return f"${S}:{id}"   # HASH — поточний стан: ${F.filter(f=>!f.bad).slice(0,4).map(f=>f.name).join(', ')||'поля'}`);}
      if(b.has('cache'))rk.push(`CACHE_${up(S)} = "cache:${S}:{id}"   # STRING EX 60 — cache-aside, правда в ${n}`);
      if(b.has('queue'))rk.push(`${U}_STREAM = "${n}:new"   # STREAM — черга обробки (XADD → XREADGROUP → XACK)`);
      if(b.has('pool'))rk.push(`${U}_FREE = "${n}:free"   # SET — вільні; SREM = атомарно взяти одного`);
      if(b.has('counter'))rk.push(`${U}_SEQ = "${S}:seq"   # STRING INCR — лічильник / id\nSTAT_${U} = "stats:${n}:today"   # STRING INCR`);
      if(b.has('rank'))rk.push(`LB_${U} = "lb:${n}"   # ZSET — рейтинг (ZINCRBY / ZREVRANGE)`);
      if(b.has('geo')){rk.push(`${U}_GEO = "${n}:geo"   # GEO — хто поруч (GEOADD / GEOSEARCH)`);
        if(!(has('lat')&&has('lon')))W.push(['bad',`<code>${esc(n)}</code> позначено «шукаємо поруч», але полів <code>lat</code>, <code>lon</code> немає.`]);}
      if(!b.has('truth')&&e.b.length){
        if(b.has('state')||b.has('queue'))W.push(['warn',`<code>${esc(n)}</code> живе лише в Redis. Що буде, якщо Redis перезапуститься без AOF? Якщо це гроші чи історія — додай «правда» (таблиця в PostgreSQL).`]);
        if(b.has('cache'))W.push(['bad',`<code>${esc(n)}</code>: кеш без правди — кешувати нема чого. Кеш — копія даних з PostgreSQL.`]);}
      if(b.has('truth')&&b.has('state'))W.push(['ok',`<code>${esc(n)}</code>: правда в PostgreSQL + поточний стан у Redis. Визнач <b>момент</b>, коли стан стає фактом і записується в таблицю (у проєкті — <code>deliver()</code>).`]);
      if(b.has('queue')&&!b.has('state'))W.push(['tip',`<code>${esc(n)}</code> іде в чергу: у повідомленні передавай лише id, а дані бери з картки (HASH) — як <code>orders:new</code> → <code>order:&lt;id&gt;</code>.`]);
    });
    if(!E.some(e=>e.b.includes('truth'))&&E.length&&E[0].n)W.push(['warn','Жодна сутність не позначена як «правда». Де тоді дані, які не можна втратити?']);
    if(E.length>1&&!rel.length&&names.length>1)W.push(['tip','Між сутностями немає жодного зв\'язку. Спитай для кожної пари: «скільки X в одного Y?» і додай поле <code>y_id -&gt; ys</code>.']);
    if(!W.some(w=>w[0]==='bad'||w[0]==='warn'))W.unshift(['ok','Серйозних проблем не бачу.']);
    return{W,sql,rk,rel};
  }
  const ICON={bad:'🔴',warn:'🟠',tip:'💡',ok:'✅'};
  function out(){const a=analyze();
    $('#builder-warn').innerHTML=a.W.map(([k,t])=>`<div style="margin-bottom:6px">${ICON[k]} ${t}</div>`).join('');
    $('#builder-rel').innerHTML=a.rel.length?a.rel.map(r=>`<div style="margin-bottom:4px">${r}</div>`).join(''):'<span style="color:var(--muted)">поки немає</span>';
    $('#builder-sql').textContent=a.sql.join('\n\n')||'-- немає сутностей з позначкою «правда»';
    $('#builder-redis').textContent=a.rk.length?'# app/config.py — усі ключі в одному місці\n'+a.rk.join('\n'):'# Redis не потрібен: жодної гарячої операції';}
  function draw(){
    $('#builder-ents').innerHTML=E.map((e,i)=>`<div class="card" data-i="${i}"><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px">
      <input class="b-n" value="${esc(e.n)}" placeholder="назва таблиці, напр. orders" style="flex:1;font:600 15px var(--mono, monospace);padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink)">
      <button class="btn b-del" title="видалити">✕</button></div>
      <textarea class="b-f" rows="${Math.max(3,e.f.split('\n').length+1)}" placeholder="поле тип — по одному в рядку&#10;name text!&#10;price money! >0&#10;restaurant_id -> restaurants!" style="width:100%;box-sizing:border-box;font:13.5px var(--mono, monospace);padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink)">${esc(e.f)}</textarea>
      <div style="display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:8px;font-size:13.5px">${BEH.map(([k,t])=>`<label><input type="checkbox" class="b-b" value="${k}"${e.b.includes(k)?' checked':''}> ${t}</label>`).join('')}</div></div>`).join('')
      +`<button class="btn" id="builder-add">+ сутність</button>
      <div class="note" style="font-size:13.5px">Поля: <code>назва тип</code>; типи — ${Object.keys(TYPES).join(', ')}, list. <code>!</code> — обов'язкове (NOT NULL), <code>unique</code>, <code>&gt;0</code> — перевірка, <code>-&gt; таблиця</code> — зв'язок. <code>id</code> додається сам.</div>`;
    out();}
  $('#builder-ents').addEventListener('input',e=>{const c=e.target.closest('[data-i]');if(!c)return;const x=E[+c.dataset.i];
    if(e.target.classList.contains('b-n'))x.n=e.target.value;else if(e.target.classList.contains('b-f'))x.f=e.target.value;out();});
  $('#builder-ents').addEventListener('change',e=>{if(!e.target.classList.contains('b-b'))return;const x=E[+e.target.closest('[data-i]').dataset.i];
    x.b=[...e.target.closest('[data-i]').querySelectorAll('.b-b:checked')].map(c=>c.value);out();});
  $('#builder-ents').addEventListener('click',e=>{if(e.target.id==='builder-add'){E.push({n:'',f:'',b:[]});draw();}
    else if(e.target.classList.contains('b-del')){E.splice(+e.target.closest('[data-i]').dataset.i,1);draw();}});
  $('#builder-tpl').innerHTML=Object.keys(TPL).map(n=>`<button class="btn" data-t="${esc(n)}">${esc(n)}</button>`).join('');
  $('#builder-tpl').onclick=e=>{const b=e.target.closest('[data-t]');if(!b)return;E=JSON.parse(JSON.stringify(TPL[b.dataset.t]));draw();};
  E=JSON.parse(JSON.stringify(TPL['Інтернет-магазин']));draw();
  course($('#builder-course'),['l30','taxiarch']);
})();
