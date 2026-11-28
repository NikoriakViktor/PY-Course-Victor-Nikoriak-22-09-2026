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

  /* ---------- малювання схем ---------- */
  const NS='http://www.w3.org/2000/svg';
  const T=(x,y,s,cls,anchor)=>`<text x="${x}" y="${y}"${cls?` class="${cls}"`:''}${anchor?` text-anchor="${anchor}"`:''}>${esc(s)}</text>`;
  const clip=(b,tx,ty)=>{const cx=b.x+b.w/2,cy=b.y+b.h/2,dx=tx-cx,dy=ty-cy;if(!dx&&!dy)return[cx,cy];
    const sx=dx?(b.w/2)/Math.abs(dx):1e9,sy=dy?(b.h/2)/Math.abs(dy):1e9,s=Math.min(sx,sy);return[cx+dx*s,cy+dy*s];};
  const ah=(x1,y1,x2,y2,cls)=>{const a=Math.atan2(y2-y1,x2-x1),L=11,W=5.5;
    const p=[[x2,y2],[x2-L*Math.cos(a)+W*Math.sin(a),y2-L*Math.sin(a)-W*Math.cos(a)],[x2-L*Math.cos(a)-W*Math.sin(a),y2-L*Math.sin(a)+W*Math.cos(a)]];
    return `<polygon class="arh ${cls||''}" points="${p.map(q=>q.join(',')).join(' ')}"/>`;};
  function link(a,b,label,o={}){const c=[b.x+b.w/2,b.y+b.h/2],d=[a.x+a.w/2,a.y+a.h/2];const[x1,y1]=clip(a,...c),[x2,y2]=clip(b,...d);
    const cls=`ln ${o.cls||''}${o.dash?' dash':''}`;let s=`<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`+ah(x1,y1,x2,y2,o.cls);
    if(o.both)s+=ah(x2,y2,x1,y1,o.cls);
    if(label){const lx=(x1+x2)/2+(o.dx||0),ly=(y1+y2)/2+(o.dy||0);String(label).split('\n').forEach((l,i,arr)=>s+=T(lx,ly+4+(i-(arr.length-1)/2)*15,l,'lbl','middle'));}
    return s;}
  function box(b,cls,title,lines=[],o={}){let s=`<rect class="${cls}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="10"/>`;
    const lh=o.lh||17,top=b.y+b.h/2-((lines.length)*lh)/2+(lines.length?2:6);
    s+=T(b.x+b.w/2,lines.length?top:b.y+b.h/2+5,title,'t','middle');
    lines.forEach((l,i)=>s+=T(b.x+b.w/2,top+lh*(i+1),l,o.mono?'m':'s','middle'));return s;}
  /* таблиця: rows [name,type,flag] flag: pk|fk|'' ; rules → зелений текст справа */
  const RH=23,HH=32;
  function table(t,o={}){const h=HH+t.rows.length*RH+6;let s=`<rect class="pg" x="${t.x}" y="${t.y}" width="${t.w}" height="${h}" rx="9"/>`+
    `<path class="pgh" style="fill:var(--pg)" d="M${t.x} ${t.y+HH}V${t.y+9}a9 9 0 0 1 9-9H${t.x+t.w-9}a9 9 0 0 1 9 9V${t.y+HH}Z"/>`+T(t.x+12,t.y+21,t.n,'hd');
    t.rows.forEach((r,i)=>{const y=t.y+HH+RH*i+3;if(r[2]==='fk'&&o.fk)s+=`<rect class="rowfk" x="${t.x+2}" y="${y}" width="${t.w-4}" height="${RH}"/>`;
      if(i)s+=`<line class="sep" x1="${t.x+8}" x2="${t.x+t.w-8}" y1="${y}" y2="${y}"/>`;
      const by=y+16;s+=r[2]==='pk'?T(t.x+10,by,'PK','key'):r[2]==='fk'?T(t.x+10,by,'FK','fk'):'';
      s+=T(t.x+36,by,r[0],'m');if(o.types!==false)s+=T(t.x+t.w-10,by,r[1],r[3]&&o.rules?'rule':'ty','end');});
    t.h=h;return s;}
  const rowY=(t,i)=>t.y+HH+RH*i+3+RH/2;
  const TB={
    restaurants:{n:'restaurants',x:30,y:20,w:270,rows:[['id','INTEGER','pk'],['name','TEXT NOT NULL','',1],['cuisine','TEXT NOT NULL','',1],['district','TEXT NOT NULL','',1],['lat, lon','DOUBLE NOT NULL','',1]]},
    menu_items:{n:'menu_items',x:30,y:235,w:270,rows:[['id','SERIAL','pk'],['restaurant_id','INTEGER NOT NULL','fk',1],['name','TEXT NOT NULL','',1],['price','NUMERIC CHECK > 0','',1]]},
    orders:{n:'orders',x:375,y:20,w:290,rows:[['id','BIGINT','pk'],['customer','TEXT NOT NULL','',1],['restaurant_id','INTEGER NOT NULL','fk',1],['courier_id','TEXT','fk'],['items','JSONB NOT NULL','',1],['total, fee','NUMERIC(8,2)','',1],['created_at','TIMESTAMPTZ','',1],['delivered_at','TIMESTAMPTZ','',1],['lat, lon','DOUBLE NOT NULL','',1]]},
    couriers:{n:'couriers',x:740,y:20,w:230,rows:[['id','TEXT','pk'],['name','TEXT NOT NULL','',1]]},
  };
  const DRAWS=[
    /* 1. сценарії */
    ()=>{const A=[['👤 Клієнт','бачить меню з цінами','menu_items'],['👤 Клієнт','замовляє (≤ 3 за хвилину)','orders · ліміт'],['🧭 Диспетчер','найближчий ВІЛЬНИЙ кур\'єр','couriers: де, чи вільний'],['🛵 Кур\'єр','де він зараз на мапі','координати щосекунди'],['📊 Власниця','рейтинг і виторг','лічильники, топ'],['🔍 Аналітик','середній час доставки за рік','історія orders']];
      let s='';A.forEach(([who,what,data],i)=>{const y=12+i*64,a={x:20,y,w:170,h:50},q={x:290,y,w:380,h:50},d={x:770,y,w:210,h:50};
        s+=box(a,'act',who)+box(q,'svc',what)+box(d,'pg',data)+link(a,q,'хоче')+link(q,d,'потрібні дані',{cls:'pg'});});
      return [s,400,'Кожен сценарій «хто → що хоче» вказує, які дані потрібні. Справа — майбутні таблиці й ключі.'];},
    /* 2. сутності */
    ()=>{const B={cl:{x:30,y:40,w:200,h:62},or:{x:400,y:160,w:200,h:62},re:{x:30,y:280,w:200,h:62},me:{x:400,y:318,w:200,h:62},co:{x:770,y:160,w:200,h:62},di:{x:770,y:20,w:200,h:62}};
      let s=box(B.cl,'ghost','клієнт',['лише ім\'я → колонка'])+box(B.or,'pg','замовлення',['orders'],{mono:1})+box(B.re,'pg','ресторан',['restaurants'],{mono:1})+box(B.me,'pg','страва',['menu_items'],{mono:1})+box(B.co,'pg','кур\'єр',['couriers'],{mono:1})+box(B.di,'ghost','диспетчер',['процес, не сутність']);
      s+=link(B.cl,B.or,'замовляє()')+link(B.re,B.or,'готує')+link(B.re,B.me,'має в меню')+link(B.or,B.me,'містить',{dash:1})+link(B.co,B.or,'доставляє()')+link(B.di,B.co,'призначає()',{dash:1});
      return [s,400,'Іменники → сутності (синя рамка — таблиця). Дієслова на стрілках → функції в коді. Пунктир — не таблиця.'];},
    /* 3. поля */
    ()=>[Object.values(TB).map(t=>table({...t},{rules:1})).join('')+T(740,150,'зелене — правило в схемі:','s')+T(740,168,'NOT NULL, CHECK, NUMERIC','rule')+T(740,196,'PK — первинний ключ','s')+T(740,214,'FK — зовнішній ключ','s'),420,'Кожна сутність — таблиця: поле, тип, правило. Гроші — NUMERIC, час — TIMESTAMPTZ.'],
    /* 4. зв'язки */
    ()=>{const t={};let s=Object.entries(TB).map(([k,v])=>{t[k]={...v};return table(t[k],{fk:1,types:false});}).join('');
      const R=t.restaurants,M=t.menu_items,O=t.orders,C=t.couriers;
      const el=(x1,y1,xm,x2,y2,c1,c2,cls='pg')=>`<path class="ln ${cls}" d="M${x1} ${y1}H${xm}V${y2}H${x2}"/>`+ah(xm,y2,x2,y2,cls)+T(x1+(x2>x1?-14:14)*(x1<xm?-1:1),y1-6,c1,'card','middle')+T(x2+(xm<x2?-12:12),y2-6,c2,'card','middle');
      s+=`<path class="ln pg" d="M${M.x} ${rowY(M,1)}H${M.x-16}V${rowY(R,0)}H${R.x}"/>`+ah(M.x-16,rowY(R,0),R.x,rowY(R,0),'pg')+T(M.x-6,rowY(M,1)-6,'N','card','end')+T(R.x-6,rowY(R,0)-6,'1','card','end');
      s+=`<path class="ln pg" d="M${O.x} ${rowY(O,2)}H${O.x-37}V${rowY(R,0)}H${R.x+R.w}"/>`+ah(O.x-37,rowY(R,0),R.x+R.w,rowY(R,0),'pg')+T(O.x-6,rowY(O,2)-6,'N','card','end')+T(R.x+R.w+8,rowY(R,0)-6,'1','card');
      s+=`<path class="ln pg" d="M${O.x+O.w} ${rowY(O,3)}H${O.x+O.w+38}V${rowY(C,0)}H${C.x}"/>`+ah(O.x+O.w+38,rowY(C,0),C.x,rowY(C,0),'pg')+T(O.x+O.w+8,rowY(O,3)-6,'N','card')+T(C.x-6,rowY(C,0)-6,'1','card','end');
      s+=`<path class="ln dash" d="M${O.x} ${rowY(O,4)}H${O.x-28}V${rowY(M,0)}H${M.x+M.w}"/>`+ah(O.x-28,rowY(M,0),M.x+M.w,rowY(M,0))+T(O.x+10,O.y+O.h+24,'- - ▶  items JSONB — знімок страв і цін, не FK','s');
      s+=T(740,150,'1 ──▶ N','card')+T(740,170,'«в одного ресторану','s')+T(740,186,'багато страв і замовлень»','s')+T(740,214,'FK веде до PK іншої таблиці','s');
      return [s,420,'Лінії — зовнішні ключі (FK → PK). 1 і N — скільки рядків з кожного боку. Пунктир — зв\'язок без FK (знімок у JSONB).'];},
    /* 5. правда / гаряче */
    ()=>{const P={r:{x:30,y:28,w:220,h:56},m:{x:30,y:118,w:220,h:56},c:{x:30,y:208,w:220,h:56},o:{x:30,y:312,w:220,h:56}};
      const R={r:{x:610,y:20,w:360,h:72},m:{x:610,y:116,w:360,h:60},c:{x:610,y:196,w:360,h:90},o:{x:610,y:304,w:360,h:90}};
      let s=box(P.r,'pg','restaurants',['правда'])+box(P.m,'pg','menu_items',['правда'])+box(P.c,'pg','couriers',['довідник'])+box(P.o,'pg','orders',['лише доставлені'])
       +box(R.r,'rd','restaurant:<id> HASH',['restaurants:geo GEO'],{mono:1})+box(R.m,'rd','cache:menu:<id> STRING',['EX 60'],{mono:1})
       +box(R.c,'rd','courier:<id> HASH',['couriers:geo GEO','couriers:free SET'],{mono:1})+box(R.o,'rd','order:<id> HASH',['orders:new STREAM','orders:active ZSET'],{mono:1});
      s+=link(P.r,R.r,'seed_redis(): копія на старті',{cls:'rd',dash:1})+link(P.m,R.m,'MISS → SELECT → SET',{cls:'rd',dash:1})+link(P.c,R.c,'seed_redis(): стан змінюється щосекунди',{cls:'rd',dash:1})+link(R.o,P.o,'deliver() → INSERT: стає фактом',{cls:'pg'});
      s+=T(140,18,'🐘 PostgreSQL — правда','t','middle')+T(790,12,'⚡ Redis — гаряче','t','middle');
      return [s,400,'Ліворуч — що не можна втратити. Праворуч — що змінюється щосекунди або потрібне кільком процесам. Стрілки — звідки береться і куди повертається.'];},
    /* 6. операції → типи */
    ()=>{const O=[['картка з полями, міняємо одне','HASH','courier:c4 · order:42'],['хто поруч','GEO','couriers:geo'],['взяти вільного атомарно','SET + SREM','couriers:free'],['рейтинг, топ-N','ZSET','lb:couriers:deliveries'],['черга з підтвердженням','STREAM','orders:new'],['лічильник, новий id','STRING + INCR','order:seq'],['останні N подій','LIST + LTRIM','events:log'],['кеш з терміном','STRING + EX','cache:menu:3']];
      let s=T(165,14,'операція (що робимо)','s','middle')+T(470,14,'тип Redis','s','middle')+T(780,14,'ключ у проєкті','s','middle');
      O.forEach(([op,ty,k],i)=>{const y=24+i*47,a={x:20,y,w:300,h:38},b={x:390,y,w:160,h:38},c={x:620,y,w:340,h:38};
        s+=box(a,'svc',op)+box(b,'rd',ty)+box(c,'dk',k)+link(a,b,'')+link(b,c,'');});
      return [s,404,'Тип обирають за операцією. Ті самі кур\'єри лежать у чотирьох структурах: картка, GEO, SET вільних, рейтинг.'];},
    /* 7. потік */
    ()=>{const X=[15,272,529,786],W=200,B=[0,1,2,3].map(i=>({x:X[i],y:70,w:W,h:96})).concat([3,2,1,0].map(i=>({x:X[i],y:262,w:W,h:96})));
      let s=box(B[0],'svc','generator / api',['create_order()','MULTI: HSET, XADD'],{mono:1})+box(B[1],'rd','⚡ Redis',['order:42 · new','orders:new'],{mono:1})
       +box(B[2],'svc','dispatcher',['try_assign()','GEOSEARCH · SREM'],{mono:1})+box(B[3],'svc','simulator',['tick(): GEOADD','кожну секунду'],{mono:1})
       +box(B[4],'svc','deliver()',['MULTI … EXEC','EXPIRE order:42'],{mono:1})+box(B[5],'pg','🐘 PostgreSQL',['INSERT INTO orders','ON CONFLICT DO NOTHING'],{mono:1})
       +box(B[6],'dk','parquet',['COPY … TO','orders.parquet'],{mono:1})+box(B[7],'dk','🦆 DuckDB',['GROUP BY за рік','аналітика'],{mono:1});
      const up={dy:-16};s+=link(B[0],B[1],'new',up)+link(B[1],B[2],'читає',up)+link(B[2],B[3],'assigned',up)+link(B[3],B[4],'picked_up → delivered',{dx:-6})+link(B[4],B[5],'факт',{cls:'pg',dy:-16})+link(B[5],B[6],'COPY',{dash:1,dy:-16})+link(B[6],B[7],'',{dash:1});
      s+=T(500,30,'статус замовлення: new → assigned → picked_up → delivered → в історії','t','middle')+T(500,222,'одна межа запису в правду: deliver() → save_delivered_order()','s','middle');
      return [s,380,'Верхній ряд — гаряче життя замовлення в Redis. Нижній — факт у PostgreSQL і копія для аналітики.'];},
  ];
  function drawDesign(i){const [s,h,cap]=DRAWS[i]();const svg=$('#design-svg');svg.setAttribute('viewBox',`0 0 1000 ${h}`);svg.innerHTML=s;$('#design-cap').textContent=cap;}
  const F=$('#design-flow');flow(F,['сценарії','сутності','поля','зв\'язки','правда/гаряче','операції→типи','потік']);
  function* gen(){for(let i=0;i<STEPS.length;i++)yield i;}
  function render(i){flowOn(F,i);drawDesign(i);const s=STEPS[i];$('#design-h').textContent=s.h;$('#design-body').innerHTML=s.b;code($('#design-code'),s.c);}
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
