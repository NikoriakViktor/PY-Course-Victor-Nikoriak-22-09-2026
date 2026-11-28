/* ============ CACHE-ASIDE ============ */
(function(){
  const C=$('#cache-code');
  code(C,['def get_menu(r, restaurant_id):','    key = f"cache:menu:{restaurant_id}"','    cached = r.get(key)','    if cached is not None:                  # HIT','        r.incr("stats:cache:hit")','        return json.loads(cached)','    menu = db.fetch_menu(restaurant_id)     # MISS → PostgreSQL','    r.set(key, json.dumps(menu), ex=60)     # кеш на 60 с','    r.incr("stats:cache:miss")','    return menu','','def invalidate_menu(r, restaurant_id):','    r.delete(f"cache:menu:{restaurant_id}")  # після зміни цін']);
  const F=$('#cache-flow');flow(F,['запит меню','GET у Redis','SELECT у PostgreSQL','SET … EX 60','відповідь клієнту']);
  function* gen(){
    let t=0,hit=0,miss=0,seen='—',pg=120,cache=null,exp=null;
    const S=(node,line,msg,hot)=>({t,hit,miss,seen,pg,cache:cache!=null&&(exp==null||t<exp)?{v:cache,ttl:exp-t}:null,node,line,msg,hot});
    yield S(-1,-1,'Кеш порожній. Клієнт A відкриває меню «Борщ на Печерську».');
    yield S(1,2,'<code>GET cache:menu:3</code> → <code>(nil)</code>. Це <b>MISS</b>: у кеші нічого немає.');
    yield S(2,6,'Ідемо в PostgreSQL: <code>SELECT id, name, price FROM menu_items WHERE restaurant_id = 3</code> → борщ 120 грн. Це повільний шлях, ~5–10 мс.','pg');
    cache=120;exp=t+60;miss++;yield S(3,7,'<code>SET cache:menu:3 "[…]" EX 60</code>: кладемо меню в Redis на 60 с.','rd');
    seen='120 грн';yield S(4,9,'Клієнт A бачить 120 грн.');
    t=5;yield S(0,-1,'Минуло 5 с. Клієнт B відкриває той самий ресторан.');
    hit++;yield S(1,5,'<code>GET cache:menu:3</code> → є! Це <b>HIT</b>: ~0,3 мс, PostgreSQL не потрібен.','rd');
    t=20;pg=130;yield S(-1,-1,'Минуло 20 с. Менеджер змінює ціну в PostgreSQL: <code>UPDATE menu_items SET price = 130 WHERE id = 9</code>. Кеш про це <b>не знає</b>.','pg');
    t=25;hit++;seen='120 грн ⚠';yield S(1,5,'Клієнт C: <b>HIT</b> → 120 грн. Ціна <b>застаріла</b>: у PostgreSQL уже 130.','rd');
    cache=null;yield S(-1,12,'Тому після зміни цін викликаємо <code>invalidate_menu(3)</code>: <code>DEL cache:menu:3</code> → <code>(integer) 1</code>. Кеш скинуто.','rd');
    t=30;yield S(1,2,'Клієнт D: <code>GET</code> → <code>(nil)</code>, знову <b>MISS</b>.');
    miss++;cache=130;exp=t+60;yield S(2,7,'PostgreSQL → 130 грн, і нове меню знову в кеші на 60 с.','pg');
    seen='130 грн';yield S(4,9,'Клієнт D бачить правильну ціну.');
    t=95;yield S(-1,-1,'Минуло ще 65 с: TTL вийшов, і Redis сам видалив ключ. Навіть якби ми забули про <code>DEL</code>, застаріла ціна прожила б не більше 60 с. Тому кеш <b>завжди</b> ставлять з TTL.');
  }
  function render(s){flowOn(F,s.node);codeOn(C,s.line);$('#cache-msg').innerHTML=s.msg;
    $('#cache-t').textContent=s.t+' с';$('#cache-hit').textContent=s.hit;$('#cache-miss').textContent=s.miss;$('#cache-seen').textContent=s.seen;
    keys($('#cache-keys'),s.cache?[{k:'cache:menu:3',t:'string',v:`[… "Борщ", ${s.cache.v} …]`,ttl:s.cache.ttl,hot:s.hot==='rd'}]:[]);
    pgt($('#cache-pg'),'menu_items',['id','name','price'],[['9','Борщ з пампушками',s.pg.toFixed(2)],['12','Узвар','45.00']],{hot:s.hot==='pg'?0:undefined});}
  const r=new Runner(gen,render);r.delay=1300;controls($('#cache-controls'),r,'cache');
  course($('#cache-course'),['l31','nb31','l40']);
})();

/* ============ INCR + RATE LIMIT ============ */
(function(){
  function* gen(){
    const n=[],a=[];const S=(vn,va)=>({n:n.slice(),a:a.slice(),vn,va});
    yield S('','');
    n.push('A|REDIS|GET orders:client-7     → "5"');a.push('A|REDIS|INCR orders:client-7    → (integer) 6');yield S('','');
    n.push('B|REDIS|GET orders:client-7     → "5"   ← A ще не записав!');a.push('B|REDIS|INCR orders:client-7    → (integer) 7');yield S('','');
    n.push('A|REDIS|SET orders:client-7 6   → OK');yield S('','✓ 7: Redis виконав INCR по черзі');
    n.push('B|REDIS|SET orders:client-7 6   → OK   ← перезаписав');yield S('✗ 6 замість 7: одне замовлення загублено','✓ 7: Redis виконав INCR по черзі');
  }
  function render(s){logs($('#limit-naive'),s.n);logs($('#limit-atomic'),s.a);
    $('#limit-vn').innerHTML=s.vn?`<span style="color:var(--swap)">${s.vn}</span>`:'';$('#limit-va').innerHTML=s.va?`<span style="color:var(--ok)">${s.va}</span>`:'';}
  const r=new Runner(gen,render);r.delay=1200;controls($('#limit-controls'),r,'limit');
  const C=$('#limit-code');code(C,['def check_rate_limit(r, customer):','    key = f"ratelimit:{customer}"','    n = r.incr(key)          # атомарно: прочитав + додав + записав','    if n == 1:','        r.expire(key, 60)    # перше в цій хвилині → вікно 60 с','    return n <= 3            # 4-те й далі → відмова (HTTP 429)']);
  const R=new MiniRedis();const L=[];
  const draw=()=>{logs($('#limit-log'),L);keys($('#limit-keys'),R.view());$('#limit-clock').textContent='віртуальний час: '+R.now+' с';};
  $('#limit-order').onclick=()=>{const n=R.exec(['INCR','ratelimit:client-7']).v;L.push(`generator|REDIS|INCR ratelimit:client-7 → (integer) ${n}`);codeOn(C,2);
    if(n===1){R.exec(['EXPIRE','ratelimit:client-7','60']);L.push('generator|REDIS|EXPIRE ratelimit:client-7 60 → вікно на хвилину');codeOn(C,4);}
    L.push(n<=3?`generator|TASK|замовлення прийнято (${n} з 3 за хвилину)`:`generator|WARN|відмова: ${n} > 3 → HTTP 429 Too Many Requests`);draw();};
  $('#limit-wait').onclick=()=>{R.advance(20);const ttl=R.exec(['TTL','ratelimit:client-7']).v;L.push({s:`… минуло 20 с · TTL ratelimit:client-7 → ${ttl}${ttl===-2?' (ключа вже немає: нова хвилина, лічильник з нуля)':''}`});draw();};
  draw();
  course($('#limit-course'),['l31','l40']);
})();

/* ============ ТРИ ЧЕРГИ ============ */
(function(){
  const C=$('#queues-code');
  code(C,['last_id = "0"                  # спершу — свої pending після падіння','while True:','    resp = r.xreadgroup("dispatchers", me, {"orders:new": last_id},','                        count=10, block=1000)','    entries = resp[0][1] if resp else []','    if last_id == "0" and not entries:','        last_id = ">"              # pending порожній → нові повідомлення','    for msg_id, fields in entries:','        try_assign(r, fields["order_id"])','        r.xack("orders:new", "dispatchers", msg_id)   # ПІСЛЯ обробки']);
  const NAMES={L:['LIST','RPUSH → LPOP'],P:['Pub/Sub','PUBLISH → SUBSCRIBE'],S:['Stream','XADD → XREADGROUP → XACK']};
  function* gen(){
    const st={};['L','P','S'].forEach(k=>st[k]={q:[],work:null,done:[],lost:[],pend:[],up:true,cmd:''});
    const S=(msg,line)=>({msg,line,st:JSON.parse(JSON.stringify(st))});
    const send=n=>{st.L.q.push(n);st.L.cmd=`RPUSH orders #${n}`;
      if(st.P.up){st.P.work=null;st.P.q.push(n);st.P.cmd=`PUBLISH orders #${n} → (integer) 1`;}else{st.P.lost.push(n);st.P.cmd=`PUBLISH orders #${n} → (integer) 0 — ніхто не слухає`;}
      st.S.q.push(n);st.S.cmd=`XADD orders:new * order_id ${n}`;};
    const take=()=>{if(st.L.q.length){st.L.work=st.L.q.shift();st.L.cmd=`LPOP orders → #${st.L.work}`;}
      if(st.P.q.length){st.P.work=st.P.q.shift();st.P.cmd=`отримав повідомлення #${st.P.work}`;}
      if(st.S.q.length){st.S.work=st.S.q.shift();st.S.pend.push(st.S.work);st.S.cmd=`XREADGROUP … > → #${st.S.work} (pending)`;}};
    const finish=()=>{['L','P','S'].forEach(k=>{const x=st[k];if(x.work!=null){x.done.push(x.work);if(k==='S'){x.pend=x.pend.filter(y=>y!==x.work);x.cmd=`XACK … #${x.work} → (integer) 1`;}else x.cmd=`#${x.work} оброблено`;x.work=null;}});};
    yield S('Диспетчер працює. Черги порожні.',-1);
    send(1);yield S('Генератор створює замовлення <b>#1</b>.',-1);
    take();yield S('Диспетчер бере #1. У Stream воно стало <b>pending</b>: видано, але не підтверджено.',2);
    finish();yield S('#1 оброблено. Stream отримав <code>XACK</code>, і #1 пішло з pending.',9);
    send(2);yield S('Генератор створює <b>#2</b>.',-1);
    take();yield S('Диспетчер бере #2 і починає шукати кур\'єра…',8);
    ['L','P','S'].forEach(k=>{const x=st[k];x.up=false;if(k!=='S'){x.lost.push(x.work);x.cmd=`💥 #${x.work} був у пам'яті процесу — зник`;}else x.cmd=`💥 #${x.work} лишився в pending`;x.work=null;});
    yield S('💥 <b>Диспетчер упав</b> посеред обробки #2. LIST: <code>LPOP</code> уже забрав #2, і процес помер разом з ним. Pub/Sub: так само. Stream: #2 досі в pending, бо <code>XACK</code> не було.',8);
    send(3);yield S('Поки диспетчер лежить, приходить <b>#3</b>. LIST і Stream зберігають його. Pub/Sub віддає його «в ефір», де ніхто не слухає: <code>PUBLISH</code> повертає 0.',-1);
    ['L','P','S'].forEach(k=>{st[k].up=true;st[k].cmd='🔄 перезапуск';});st.P.cmd='🔄 перезапуск · SUBSCRIBE orders — бачить лише нові повідомлення';
    yield S('Диспетчер перезапустився.',0);
    st.S.work=st.S.pend[0];st.S.cmd=`XREADGROUP … 0 → #${st.S.work} (своє непідтверджене)`;st.L.work=st.L.q.shift();st.L.cmd=`LPOP orders → #${st.L.work}`;st.P.cmd='чекає… нічого не прийде';
    yield S('Stream спершу читає <b>свої pending</b> (<code>last_id = "0"</code>) і знаходить #2. LIST бере #3: про #2 він уже нічого не знає.',2);
    finish();yield S('Оброблено: Stream — #2, LIST — #3.',9);
    st.S.work=st.S.q.shift();st.S.pend.push(st.S.work);st.S.cmd=`pending порожній → XREADGROUP … > → #${st.S.work}`;yield S('Pending у Stream порожній → перемикаємось на нові повідомлення (<code>&gt;</code>) і беремо #3.',6);
    finish();yield S('<b>Підсумок.</b> Stream обробив усі три. LIST загубив замовлення, з яким упав. Pub/Sub загубив і його, і все, що прийшло, поки нікого не було. Тому замовлення йдуть через Stream, а події для екрана — через Pub/Sub.',9);
  }
  function lane(k,x,final){const [t,how]=NAMES[k];const m=(arr,cls)=>arr.length?arr.map(n=>`<span class="m8 ${cls}">#${n}</span>`).join(''):'<span class="lab">—</span>';
    return `<h4>${t} <small style="color:var(--muted);font-weight:400">${how}</small></h4><div class="st">
      <div class="worker${x.up?'':' down'}">диспетчер: ${x.up?'працює':'💥 лежить'}</div>
      <div><span class="lab">у черзі</span><div class="msgs">${m(x.q,'')}</div></div>
      ${k==='S'?`<div><span class="lab">pending (видано, без XACK)</span><div class="msgs">${m(x.pend,'pend')}</div></div>`:''}
      <div><span class="lab">в обробці</span><div class="msgs">${x.work!=null?`<span class="m8 work">#${x.work}</span>`:'<span class="lab">—</span>'}</div></div>
      <div><span class="lab">оброблено</span><div class="msgs">${m(x.done,'ok')}</div></div>
      <div><span class="lab">втрачено</span><div class="msgs">${m(x.lost,'lost')}</div></div>
      <pre class="log" style="margin:4px 0 0;padding:6px 8px;font-size:12px;white-space:pre-wrap">${esc(x.cmd||' ')}</pre></div>`;}
  function render(s,run){['L','P','S'].forEach(k=>$('#queues-'+k).innerHTML=lane(k,s.st[k]));$('#queues-msg').innerHTML=s.msg;codeOn(C,s.line);}
  const r=new Runner(gen,render);r.delay=1700;controls($('#queues-controls'),r,'queues');
  course($('#queues-course'),['l31','nb31','taxi']);
})();

/* ============ ЗАХОПЛЕННЯ КУР'ЄРА ============ */
(function(){
  const C=$('#claim-code');
  code(C,['def try_assign(r, order_id):','    ...  # GEOSEARCH → кандидати від найближчого','    for cid, dist in candidates:','        if r.srem("couriers:free", cid) == 1:   # 1 — наш, 0 — уже ні','            r.hset(f"courier:{cid}", mapping={"status": "busy", ...})','            r.hset(f"order:{order_id}", "courier_id", cid)','            return True','    # нікого не захопили → відкладений повтор','','# ❌ наївно — так НЕ робимо:','#   if r.sismember("couriers:free", cid):   # перевірили…','#       r.srem("couriers:free", cid)         # …а тут уже інший']);
  function* gen(){
    const mode=$('#claim-mode').value;const R=new MiniRedis();R.exec(['SADD','couriers:free','c2','c4']);
    const L=[],res={'#7':'—','#8':'—'};let msg='Кур\'єри c4 і c2 вільні. Обидва диспетчери отримали по замовленню, і для обох найближчий — c4.',line=-1,bad=false;
    const S=()=>({L:L.slice(),keys:R.view(),res:{...res},msg,line,bad});
    const ex=(who,cmd)=>{const out=rfmt(R.exec(rsplit(cmd)));L.push(`${who}|REDIS|${cmd} → ${out}`);return out;};
    yield S();
    if(mode==='naive'){
      ex('d1','SISMEMBER couriers:free c4');line=10;msg='d1: «c4 вільний?» → 1, так.';yield S();
      ex('d2','SISMEMBER couriers:free c4');msg='d2 вклинився між перевіркою й позначкою: «c4 вільний?» → 1, теж так!';yield S();
      ex('d1','SREM couriers:free c4');res['#7']='c4';line=11;L.push('d1|TASK|#7 → кур\'єр c4');msg='d1 позначає c4 зайнятим і призначає на #7.';yield S();
      ex('d2','SREM couriers:free c4');res['#8']='c4 ⚠';L.push('d2|TASK|#8 → кур\'єр c4   ← той самий!');bad=true;
      msg='d2 не перевіряє результат <code>SREM</code>, бо «вже перевірив», і теж призначає c4. <b>Один кур\'єр — два замовлення.</b> Помилка не в Redis, а в тому, що «перевірити» й «зайняти» — дві окремі команди.';yield S();
    }else{
      ex('d1','SREM couriers:free c4');line=3;msg='d1: <code>SREM couriers:free c4</code> → 1. Кур\'єр наш, і ніхто інший його вже не візьме.';yield S();
      L.push('d1|TASK|#7 → кур\'єр c4');res['#7']='c4';line=5;yield S();
      ex('d2','SREM couriers:free c4');line=3;msg='d2: <code>SREM couriers:free c4</code> → 0. Його вже забрали, і d2 це знає з відповіді.';yield S();
      ex('d2','SREM couriers:free c2');res['#8']='c2';L.push('d2|TASK|#8 → кур\'єр c2');line=5;
      msg='d2 бере наступного кандидата: <code>SREM … c2</code> → 1. Кожен кур\'єр — рівно одному замовленню. «Перевірити й зайняти» — <b>одна</b> атомарна команда.';yield S();
    }
  }
  function render(s){logs($('#claim-log'),s.L);$('#claim-msg').innerHTML=s.msg;codeOn(C,s.line);keys($('#claim-keys'),s.keys.length?s.keys:[{k:'couriers:free',t:'set',v:[]}]);
    $('#claim-res').innerHTML=`<table class="t"><tr><th>Замовлення</th><th>Кур'єр</th></tr>${Object.entries(s.res).map(([o,c])=>`<tr class="${c.includes('⚠')?'warn':''}"><td>${o}</td><td><b>${esc(c)}</b></td></tr>`).join('')}</table>`;}
  const r=new Runner(gen,render);r.delay=1500;controls($('#claim-controls'),r,'claim');
  $('#claim-mode').onchange=()=>r.reset();
  course($('#claim-course'),['l31','taxi']);
})();

/* ============ MULTI/EXEC ============ */
(function(){
  const C=$('#multi-code');
  const CODE={multi:['order_id = r.incr("order:seq")         # до транзакції: id потрібен одразу','pipe = r.pipeline(transaction=True)    # MULTI','pipe.hset(f"order:{order_id}", mapping={..., "status": "new"})','pipe.xadd("orders:new", {"order_id": order_id})','pipe.zadd("orders:active", {order_id: now})','pipe.incr(f"stats:orders:{today}")','pipe.pfadd("stats:customers:unique", customer)','_, msg_id, *_ = pipe.execute()         # EXEC: усе разом'],
    plain:['order_id = r.incr("order:seq")','r.hset(f"order:{order_id}", mapping={..., "status": "new"})','r.xadd("orders:new", {"order_id": order_id})   # 💥 сюди не дійшли','r.zadd("orders:active", {order_id: now})','r.incr(f"stats:orders:{today}")','r.pfadd("stats:customers:unique", customer)']};
  function* gen(){
    const mode=$('#multi-mode').value;code(C,CODE[mode]);const R=new MiniRedis();R.exec(['SET','order:seq','42']);
    const L=[];let msg='Генератор починає створювати замовлення. У Redis лише лічильник id.',line=-1;
    const S=()=>({L:L.slice(),keys:R.view(),msg,line});
    const ex=(cmd,show)=>{const out=rfmt(R.exec(rsplit(cmd)));L.push(`generator|REDIS|${show||cmd} → ${out.replace(/\n/g,' ')}`);return out;};
    yield S();
    ex('INCR order:seq');line=0;msg='<code>INCR order:seq</code> → 43: id нового замовлення.';yield S();
    if(mode==='plain'){
      ex('HSET order:43 customer client-7 restaurant_id 3 status new','HSET order:43 … status new');line=1;msg='Картку замовлення записано одразу.';yield S();
      L.push({s:'💥 процес generator упав (OOM, деплой, вимкнули світло…)'});line=2;
      msg='💥 Процес упав перед <code>XADD</code>. У Redis лишилась картка <code>order:43</code> зі статусом <code>new</code>, але в черзі <code>orders:new</code> її немає. Диспетчер <b>ніколи</b> не дізнається про це замовлення: це «зомбі».';yield S();
    }else{
      ex('MULTI');line=1;msg='<code>MULTI</code>: далі Redis лише збирає команди.';yield S();
      ex('HSET order:43 customer client-7 restaurant_id 3 status new','HSET order:43 … status new');line=2;msg='<code>QUEUED</code> — команду не виконано, лише поставлено в чергу.';yield S();
      ex('XADD orders:new * order_id 43');line=3;yield S();
      L.push({s:'💥 процес generator упав (OOM, деплой, вимкнули світло…)'});R.multi=null;
      msg='💥 Процес упав до <code>EXEC</code>. Redis закрив з\'єднання й викинув чергу команд. Зомбі немає: замовлення просто не створено, клієнт отримає помилку й повторить. Номер 43 «згорів» — дірка в нумерації нікому не шкодить.';yield S();
      L.push({s:'── а без падіння: ──'});R.exec(['MULTI']);
      ['HSET order:44 customer client-7 restaurant_id 3 status new','XADD orders:new * order_id 44','ZADD orders:active 1795858443 44'].forEach(c=>R.exec(rsplit(c)));
      const out=rfmt(R.exec(['EXEC']));L.push(`generator|REDIS|MULTI · HSET order:44 · XADD · ZADD · EXEC → ${out.replace(/\n/g,'  ')}`);line=7;
      msg='Без падіння <code>EXEC</code> виконує все разом і повертає список результатів. Тому в коді <code>_, msg_id, *_ = pipe.execute()</code>: друга відповідь — id запису в черзі.';yield S();
    }
  }
  function render(s){logs($('#multi-log'),s.L);$('#multi-msg').innerHTML=s.msg;codeOn(C,s.line);keys($('#multi-keys'),s.keys);}
  const r=new Runner(gen,render);r.delay=1500;controls($('#multi-controls'),r,'multi');
  $('#multi-mode').onchange=()=>r.reset();
  course($('#multi-course'),['l31','nb31','l30']);
})();

/* ============ ВІДКЛАДЕНИЙ ПОВТОР ============ */
(function(){
  const C=$('#retry-code');
  code(C,['def try_assign(r, order_id):','    ...  # GEOSEARCH + SREM, як на сторінці «Захоплення»','    # нікого не захопили:','    r.hset(f"order:{order_id}", "status", "waiting")','    r.zadd("orders:waiting", {order_id: time.time() + 3})','','def process_waiting(r):              # на кожному колі диспетчера','    for oid in r.zrangebyscore("orders:waiting", 0, time.time()):','        if r.zrem("orders:waiting", oid) == 1:   # лише один диспетчер','            try_assign(r, oid)']);
  function* gen(){
    const R=new MiniRedis();R.exec(['HSET','order:50','status','new']);const L=[];let line=-1;
    const S=()=>({L:L.slice(),keys:R.view(),line,t:R.now});
    const ex=(svc,cmd)=>{const out=rfmt(R.exec(rsplit(cmd)));L.push(`${svc}|${/^Z/.test(cmd)?'QUEUE':'REDIS'}|${cmd} → ${out.replace(/\n/g,' ')}`);return out;};
    L.push({s:'t=0.0  усі кур\'єри зайняті: couriers:free порожня'});yield S();
    L.push('dispatcher|REDIS|SREM couriers:free … → кандидатів немає');line=2;yield S();
    ex('dispatcher','HSET order:50 status waiting');line=3;yield S();
    ex('dispatcher','ZADD orders:waiting 3 50');line=4;L.push('dispatcher|QUEUE|#50: вільних кур\'єрів немає → повтор через 3 с');yield S();
    for(const t of [1,2,3]){
      R.advance(1);L.push({s:`t=${t}.0`});
      if(t===2){ex('simulator','SADD couriers:free c2');L.push('simulator|TASK|#41 доставлено, кур\'єр c2 знову вільний');}
      const out=ex('dispatcher',`ZRANGEBYSCORE orders:waiting 0 ${t}`);line=7;yield S();
      if(out!=='(empty array)'){ex('dispatcher','ZREM orders:waiting 50');line=8;yield S();
        L.push('dispatcher|QUEUE|настав час повтору → #50, шукаю кур\'єра знову');line=9;yield S();
        ex('dispatcher','SREM couriers:free c2');ex('dispatcher','HSET order:50 status assigned courier_id c2');L.push('dispatcher|TASK|#50 → кур\'єр c2');yield S();}
    }
  }
  function render(s){logs($('#retry-log'),s.L);codeOn(C,s.line);keys($('#retry-keys'),s.keys);$('#retry-t').textContent=s.t.toFixed(1).replace('.',',')+' с';}
  const r=new Runner(gen,render);r.delay=1300;controls($('#retry-controls'),r,'retry');
  course($('#retry-course'),['l31','taxi','algo']);
})();
