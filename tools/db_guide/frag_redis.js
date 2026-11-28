/* ============ ТИПИ ============ */
(function(){
  course($('#types-course'),['l31','nb31','algo']);
})();

/* ============ ПІСОЧНИЦЯ ============ */
(function(){
  const R=new MiniRedis();const term=$('#sandbox-term'),inp=$('#sandbox-in');
  const PRE={
    'Кеш меню':['GET cache:menu:3','SET cache:menu:3 "[борщ 120, узвар 45]" EX 60','GET cache:menu:3','TTL cache:menu:3','# натисни «+10 с» кілька разів і знову: GET cache:menu:3'],
    'Rate limit':['INCR ratelimit:client-7','EXPIRE ratelimit:client-7 60','INCR ratelimit:client-7','INCR ratelimit:client-7','INCR ratelimit:client-7','TTL ratelimit:client-7','# 4 > 3 → відмова. Після 60 с ключ зникне сам'],
    'Картка замовлення':['HSET order:42 customer client-7 restaurant_id 3 status new','HGET order:42 status','HSET order:42 status assigned courier_id c4','HGETALL order:42'],
    'Захоплення кур\'єра':['SADD couriers:free c1 c2 c4','SREM couriers:free c4','SREM couriers:free c4','SMEMBERS couriers:free','# перший SREM → 1 (наш), другий → 0 (уже зайнятий)'],
    'Рейтинг':['ZINCRBY lb:couriers:deliveries 1 c4','ZINCRBY lb:couriers:deliveries 1 c2','ZINCRBY lb:couriers:deliveries 1 c4','ZREVRANGE lb:couriers:deliveries 0 -1 WITHSCORES'],
    'Черга зі збоєм':['XGROUP CREATE orders:new dispatchers 0 MKSTREAM','XADD orders:new * order_id 7','XADD orders:new * order_id 8','XREADGROUP GROUP dispatchers d1 COUNT 1 STREAMS orders:new >','# d1 «упав», не надіславши XACK. Що в pending?','XPENDING orders:new dispatchers','# d1 перезапустився: спершу читає СВОЇ непідтверджені (id 0)','XREADGROUP GROUP dispatchers d1 STREAMS orders:new 0'],
    'Транзакція':['MULTI','INCR order:seq','HSET order:43 status new','XADD orders:new * order_id 43','EXEC'],
    'Хто поруч (GEO)':['GEOADD couriers:geo 30.61 50.47 c1 30.55 50.43 c2 30.54 50.43 c4','GEOSEARCH couriers:geo FROMLONLAT 30.538 50.427 BYRADIUS 5 km ASC WITHDIST'],
  };
  const out=(html)=>{term.insertAdjacentHTML('beforeend',html+'\n');term.scrollTop=term.scrollHeight;};
  function run(line){line=line.trim();if(!line)return;
    if(line.startsWith('#')){out(`<span class="hint">${esc(line)}</span>`);return;}
    out(`<span class="in">redis&gt; ${esc(line)}</span>`);
    const r=R.exec(rsplit(line));out(r&&r.t==='err'?`<span class="err">${esc(rfmt(r))}</span>`:esc(rfmt(r)));draw();}
  function draw(){keys($('#sandbox-keys'),R.view());$('#sandbox-clock').textContent='віртуальний час: '+R.now+' с'+(R.multi?' · MULTI: у черзі '+R.multi.length:'');}
  $('#sandbox-presets').innerHTML=Object.keys(PRE).map(n=>`<button class="btn" data-p="${esc(n)}">${esc(n)}</button>`).join('');
  $('#sandbox-presets').onclick=e=>{const b=e.target.closest('[data-p]');if(!b)return;out(`<span class="hint">── сценарій «${esc(b.dataset.p)}» ──</span>`);PRE[b.dataset.p].forEach(run);};
  inp.onkeydown=e=>{if(e.key==='Enter'){run(inp.value);inp.value='';}};
  $('#sandbox-go').onclick=()=>{run(inp.value);inp.value='';inp.focus();};
  $('#sandbox-tick').onclick=()=>{R.advance(10);out(`<span class="hint">… минуло 10 с</span>`);draw();};
  $('#sandbox-flush').onclick=()=>{R.db.clear();R.multi=null;R.now=0;term.innerHTML='';out('<span class="hint">FLUSHDB: порожньо. Спробуй сценарій зверху або введи команду.</span>');draw();};
  $('#sandbox-flush').click();
  course($('#sandbox-course'),['l31','nb31']);
})();
