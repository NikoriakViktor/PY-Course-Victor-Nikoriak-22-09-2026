/* ================= DB GUIDE: shared helpers =================
   keys(host, list)            -> Redis keyspace as boxes. item: {k, t, v, ttl, hot, gone, hotRow}
       t: string|hash|list|set|zset|stream|geo|hll|channel
       v: string → value; hash → {field: value}; list/set → [..]; zset → [[member, score], ..];
          stream → [{id, f:'order_id=7', st:'new'|'pend'|'ack'}]; geo → [[member, 'lon lat']]; hll → number; channel → text
   pgt(host, caption, cols, rows, opt) -> PostgreSQL table. opt: {hot: rowIndex, empty: 'text'}
   logs(host, lines)           -> coloured log lines. line: 'service|TAG|text' or {dim:true, s:'...'}
   PROJ(path)                  -> link to a file of taxi_delivery_redis on GitHub
*/
Object.assign(COURSE,{
  l30:{t:'Урок 30 · SQL і PostgreSQL',u:BOOK+'m3/lesson_30/'},
  l31:{t:'Урок 31 · Redis',u:BOOK+'m3/lesson_31/'},
  duck:{t:'Бонус: DuckDB і data lake',u:BOOK+'m3/bonus_duckdb/'},
  taxi:{t:'Проєкт taxi_delivery_redis',u:REPO+'module_3/lessons/taxi_delivery_redis/README.md'},
  taxiarch:{t:'Архітектура проєкту (ARCHITECTURE.md)',u:REPO+'module_3/lessons/taxi_delivery_redis/ARCHITECTURE.md'},
  nb31:{t:'Ноутбук уроку 31',u:REPO+'module_3/lessons/lesson_31_redis_overview/note_lesson_31_redis.ipynb'},
  nb30:{t:'Ноутбук PostgreSQL (урок 30)',u:REPO+'module_3/lessons/lesson_30_sql_basics/postgresql/note_lesson_30_postgresql_updated.ipynb'},
  algo:{t:'Алгоритми наживо: стек, черга, купа',u:REPO+'module_3/bonus/'+encodeURIComponent('Алгоритми наживо.html')},
  l40:{t:'Урок 40 · Redis у FastAPI (middleware)',u:REPO+'module_4/lessons/lesson_40_middleware_redis/'},
});
const PROJ=p=>REPO+'module_3/lessons/taxi_delivery_redis/'+p;
const TYPE_UA={string:'string',hash:'hash',list:'list',set:'set',zset:'sorted set',stream:'stream',geo:'geo',hll:'hyperloglog',channel:'pub/sub канал'};
function keys(host,list){
  if(!list.length){host.innerHTML='<div class="empty">Redis порожній</div>';return;}
  host.innerHTML=list.map(x=>{let body='';const v=x.v;const hr=x.hotRow;
    const row=(a,b,cls)=>`<div class="r${cls?' '+cls:''}"><span>${esc(a)}</span><span>${esc(b)}</span></div>`;
    if(x.t==='string'||x.t==='hll'||x.t==='channel')body=`<div class="r"><span>${esc(x.t==='hll'?'≈ унікальних':'')}</span><span>${esc(v)}</span></div>`;
    else if(x.t==='hash')body=Object.entries(v).map(([a,b])=>row(a,b,hr===a?'hot':'')).join('')||'<div class="r"><span>(порожньо)</span></div>';
    else if(x.t==='list'||x.t==='set')body=v.length?v.map((a,i)=>row(x.t==='list'?i:'•',a,hr===i||hr===a?'hot':'')).join(''):'<div class="r"><span>(порожньо)</span></div>';
    else if(x.t==='zset'||x.t==='geo')body=v.length?v.map(([m,s])=>row(m,s,hr===m?'hot':'')).join(''):'<div class="r"><span>(порожньо)</span></div>';
    else if(x.t==='stream')body=v.length?v.map(e=>row(e.id,e.f+(e.st==='pend'?' · pending':e.st==='ack'?' · ✓ ack':''),e.st==='pend'?'pend':(hr===e.id?'hot':''))).join(''):'<div class="r"><span>(порожньо)</span></div>';
    return `<div class="key t-${x.t}${x.hot?' hot':''}${x.gone?' gone':''}"><header><b>${esc(x.k)}</b><small>${TYPE_UA[x.t]||x.t}</small></header><div class="body">${body}</div>${x.ttl!=null&&x.ttl>=0?`<div class="ttl">TTL ${x.ttl} с</div>`:''}</div>`;}).join('');
}
function pgt(host,caption,cols,rows,opt={}){
  host.innerHTML=`<div class="tablewrap"><table class="pgt"><caption>🐘 ${esc(caption)}</caption><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr>${rows.length?rows.map((r,i)=>`<tr class="${opt.hot===i?'hot':''}">${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join(''):`<tr><td class="none" colspan="${cols.length}">${esc(opt.empty||'0 рядків')}</td></tr>`}</table></div>`;
}
function logs(host,lines){
  host.innerHTML=lines.length?lines.map(l=>{if(typeof l==='object')return `<span class="dim">${esc(l.s)}</span>`;
    const [s,t,m]=l.split('|');return `<span class="svc">${esc(s.padEnd(11))}</span> <span class="tg ${t}">${esc(t.padEnd(5))}</span>  ${esc(m)}`;}).join('\n'):'<span class="dim">(логів ще немає)</span>';
  host.scrollTop=host.scrollHeight;
}

/* ============ КАРТА: три бази ============ */
(function(){
  const S={
    pg:{h:'PostgreSQL',dl:[
      ['Роль','<b>Джерело правди</b> (OLTP): те, що не можна втратити.'],
      ['Аналогія','Бухгалтерська книга: записали — назавжди, і з перевірками.'],
      ['У «Смачно + Таксі»','Таблиці <code>restaurants</code>, <code>menu_items</code>, <code>couriers</code> і <code>orders</code>. В <code>orders</code> потрапляють <b>лише доставлені</b> замовлення.'],
      ['Як говоримо','SQL через <code>psycopg</code>: <code>SELECT</code>, <code>INSERT … ON CONFLICT DO NOTHING</code>. Файл <code>app/db.py</code>.'],
      ['Сильне','Транзакції ACID, зв\'язки <code>FOREIGN KEY</code>, обмеження <code>CHECK (price &gt; 0)</code>, <code>JOIN</code>, складні запити.'],
      ['Слабке','Кожен запит — це мережа, розбір SQL і диск: мілісекунди. Тисячі оновлень координат щосекунди — не його робота.'],
      ['Якщо зникне','Бізнес зупинився. Тому для нього роблять бекапи й репліки.'],
    ]},
    rd:{h:'Redis',dl:[
      ['Роль','<b>Гаряча пам\'ять</b> і <b>координація сервісів</b>: те, що потрібне «зараз» і дуже швидко.'],
      ['Аналогія','Магнітна дошка диспетчера: хто вільний, хто куди їде, що в черзі. Швидко стерти й переписати.'],
      ['У «Смачно + Таксі»','Кеш меню на 60 с, позиції кур\'єрів (GEO), вільні кур\'єри (SET), черга замовлень (STREAM), активні замовлення (HASH + ZSET), лічильники, рейтинги, live-події.'],
      ['Як говоримо','Команди через <code>redis-py</code>: <code>GET</code>, <code>INCR</code>, <code>HSET</code>, <code>XADD</code>… Кожна команда <b>атомарна</b>.'],
      ['Сильне','Усе в оперативній пам\'яті — десятки мікросекунд. Готові структури даних. Атомарність: кілька сервісів працюють з одними даними й не заважають одне одному.'],
      ['Слабке','Пам\'ять обмежена й дорога. Немає SQL, JOIN, схеми та зв\'язків. Надійність налаштовується (AOF/RDB), але це не бухгалтерія.'],
      ['Якщо зникне','Активні доставки доведеться відновлювати, а довідники й історія цілі в PostgreSQL. <code>seed_redis()</code> на старті знову завантажить ресторани й кур\'єрів.'],
    ]},
    dk:{h:'DuckDB',dl:[
      ['Роль','<b>Аналітика по історії</b> (OLAP): великі питання до всього архіву.'],
      ['Аналогія','Аналітик, який раз на тиждень бере весь архів і рахує тренди.'],
      ['У курсі','Це не сервер, а бібліотека всередині Python. Читає parquet і CSV напряму. У дашборді NYC Taxi — ~200 млн поїздок у <code>data/year=…/month=…</code>.'],
      ['Як говоримо','SQL майже як у PostgreSQL, але над файлами: <code>SELECT … FROM read_parquet(\'data/**/*.parquet\')</code>.'],
      ['Сильне','Колонкове зберігання й векторне виконання: суми й середні по мільйонах рядків за секунди на ноутбуці.'],
      ['Слабке','Не для багатьох одночасних дрібних записів. Не обслуговує сайт у реальному часі.'],
      ['Якщо зникне','Нічого не втрачено: файли лежать, усе перерахуємо.'],
    ]},
  };
  const det=$('#kart-detail');
  function show(k){document.querySelectorAll('#kart-stores .store').forEach(b=>b.setAttribute('aria-pressed',b.dataset.k===k));
    const s=S[k];det.innerHTML=`<h3><span class="pill ${k}">${s.h}</span></h3><dl>${s.dl.map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>`;}
  document.querySelectorAll('#kart-stores .store').forEach(b=>b.onclick=()=>show(b.dataset.k));
  show('rd');
  course($('#kart-course'),['l30','l31','duck','taxi']);
})();

/* ============ КУДИ ПОКЛАСТИ? ============ */
(function(){
  const Q=[
    ['Меню ресторану з цінами (офіційне)','pg','Ціни — це правда, з перевіркою <code>CHECK price &gt; 0</code>. У Redis лежить лише копія на 60 с (<code>cache:menu:&lt;id&gt;</code>).'],
    ['Копія меню, щоб не ходити в базу на кожен клік','rd','<code>SET cache:menu:3 … EX 60</code>. Зникне — не біда: візьмемо з PostgreSQL ще раз.'],
    ['Де кур\'єр c4 зараз (оновлюється щосекунди)','rd','GEO <code>couriers:geo</code>. Нам потрібна лише остання точка. PostgreSQL писав би на диск тисячі рядків, які нікому не потрібні.'],
    ['Завершене замовлення: сума, кур\'єр, час','pg','<code>INSERT INTO orders</code> у <code>simulator.deliver()</code>. Гроші й історія — їх не можна втратити.'],
    ['Скільки замовлень client-7 зробив за останню хвилину','rd','<code>INCR ratelimit:client-7</code> + <code>EXPIRE 60</code>: лічильник сам зникне через хвилину.'],
    ['Нові замовлення, що чекають на диспетчера','rd','STREAM <code>orders:new</code> + consumer group: повідомлення не загубиться, навіть якщо диспетчер упаде посеред роботи.'],
    ['Виторг кожного району по місяцях за два роки','dk','Одне питання до мільйонів рядків історії. Колонкова аналітика прочитає лише потрібні стовпці.'],
    ['Рейтинг кур\'єрів на дашборді після кожної доставки','rd','ZSET <code>lb:couriers:deliveries</code>, <code>ZINCRBY +1</code>. Точну історію завжди можна перерахувати з <code>orders</code> у PostgreSQL.'],
    ['Довідник кур\'єрів: id та ім\'я','pg','Таблиця <code>couriers</code>. <code>seed_redis()</code> на старті копіює її в HASH <code>courier:&lt;id&gt;</code>.'],
    ['Скільки різних клієнтів замовляли сьогодні (можна приблизно)','rd','HyperLogLog <code>stats:customers:unique</code>: ~12 КБ на мільйони клієнтів, похибка близько 0,8 %.'],
    ['Середній час доставки по годинах доби за рік','dk','Агрегат по всій історії: вивантажуємо <code>orders</code> у parquet і рахуємо в DuckDB.'],
    ['Подія «#42 доставлено» для відкритого дашборду','rd','<code>PUBLISH events:orders</code> отримає той, хто слухає саме зараз. Ще <code>LPUSH events:log</code> — щоб новий відвідувач побачив останні 30 подій.'],
    ['Виплати кур\'єрам за місяць','pg','Гроші — тільки з транзакціями ACID. Суму рахуємо запитом <code>SUM(fee)</code> по <code>orders</code>.'],
  ];
  const N={pg:'PostgreSQL',rd:'Redis',dk:'DuckDB'};
  const host=$('#kudy-quiz');let right=0,done=0;
  host.innerHTML=Q.map(([q],i)=>`<div class="q" id="kudy-q${i}"><b>${esc(q)}</b><div class="opts">${Object.keys(N).map(k=>`<button class="btn" data-i="${i}" data-k="${k}">${N[k]}</button>`).join('')}</div><div class="fb"></div></div>`).join('');
  host.addEventListener('click',e=>{const b=e.target.closest('button[data-k]');if(!b)return;const i=+b.dataset.i,card=$('#kudy-q'+i);
    if(card.classList.contains('right')||card.classList.contains('wrong'))return;
    const ok=b.dataset.k===Q[i][1];card.classList.add(ok?'right':'wrong');done++;if(ok)right++;
    card.querySelectorAll('button').forEach(x=>{x.disabled=true;if(x.dataset.k===Q[i][1])x.classList.add('primary');});
    card.querySelector('.fb').innerHTML=`<b>${ok?'Так':'Ні, '+N[Q[i][1]]}.</b> ${Q[i][2]}`;
    $('#kudy-score').textContent=`${right} з ${done} (усього ${Q.length})`;});
  $('#kudy-reset').onclick=()=>{right=done=0;$('#kudy-score').textContent='0 з 0';host.querySelectorAll('.q').forEach(c=>{c.classList.remove('right','wrong');c.querySelector('.fb').innerHTML='';c.querySelectorAll('button').forEach(x=>{x.disabled=false;x.classList.remove('primary');});});};
  course($('#kudy-course'),['l30','l31','duck']);
})();
