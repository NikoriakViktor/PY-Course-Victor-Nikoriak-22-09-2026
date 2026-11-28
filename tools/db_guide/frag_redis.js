/* ============ ТИПИ ============ */
(function(){
  course($('#types-course'),['l31','nb31','algo']);
})();

/* ============ ПІСОЧНИЦЯ ============ */
(function(){
  const R=new MiniRedis();const term=$('#sandbox-term'),inp=$('#sandbox-in');
  /* Словник: що робить команда простими словами і аналог у Python */
  const D={
    SET:['записати значення за ключем (EX n — Redis сам видалить ключ через n секунд)','d[key] = value'],
    GET:['прочитати значення за ключем; (nil) — такого ключа немає','d.get(key)'],
    DEL:['видалити ключ; відповідь — скільки ключів видалено','del d[key]'],
    EXISTS:['чи є такий ключ: 1 — так, 0 — ні','key in d'],TYPE:['який тип у значення','type(d[key])'],KEYS:['усі ключі за шаблоном (лише для навчання — на великій базі повільно)','[k for k in d if fnmatch(k, pattern)]'],
    INCR:['+1 до числа й повернути нове. Ключа немає — вважає, що був 0. Атомарно: ніхто не вклиниться між «прочитав» і «записав»','d[key] = d.get(key, 0) + 1  # але під замком'],
    INCRBY:['+n до числа','d[key] += n'],DECR:['−1 від числа','d[key] -= 1'],
    EXPIRE:['поставити ключу «таймер самознищення» на n секунд','threading.Timer(n, d.pop, [key])'],
    TTL:['скільки секунд ключу лишилось жити; −1 — вічний, −2 — ключа вже немає','—'],PERSIST:['скасувати таймер, ключ знову вічний','—'],
    HSET:['записати поля в «картку» (hash); відповідь — скільки полів НОВИХ (оновлені не рахуються)','d[key].update({...})'],
    HGET:['прочитати одне поле картки','d[key][field]'],HGETALL:['прочитати всю картку','dict(d[key])'],HDEL:['видалити поле картки','del d[key][field]'],HINCRBY:['+n до поля картки','d[key][field] += n'],HLEN:['скільки полів у картці','len(d[key])'],
    LPUSH:['додати на початок списку','d[key].appendleft(x)'],RPUSH:['додати в кінець списку','d[key].append(x)'],LPOP:['забрати перший елемент','d[key].popleft()'],RPOP:['забрати останній','d[key].pop()'],
    LRANGE:['елементи з start по stop ВКЛЮЧНО (−1 — до кінця)','list(d[key])[start:stop+1]'],LLEN:['довжина списку','len(d[key])'],LTRIM:['обрізати список, лишити start..stop','d[key] = d[key][start:stop+1]'],
    SADD:['додати в множину; відповідь — скільки справді нових','d[key].add(x)'],
    SREM:['вийняти з множини; 1 — вийняв (був там), 0 — його вже не було. Перевірка й вилучення — одна атомарна дія','if x in s: s.remove(x); return 1  # під замком'],
    SMEMBERS:['усі елементи множини (порядок не гарантований)','set(d[key])'],SISMEMBER:['чи є елемент у множині','x in d[key]'],SCARD:['скільки елементів','len(d[key])'],
    ZADD:['додати елемент з балом (score); множина завжди відсортована за балом','scores[x] = score'],
    ZINCRBY:['+n до балу елемента (немає — створить з 0); відповідь — новий бал','scores[x] = scores.get(x, 0) + n'],
    ZSCORE:['бал елемента','scores[x]'],ZRANK:['місце елемента з 0, за зростанням','sorted(scores, key=scores.get).index(x)'],
    ZRANGE:['елементи за зростанням балу','sorted(scores, key=scores.get)[a:b+1]'],ZREVRANGE:['елементи за спаданням балу — топ','sorted(scores, key=scores.get, reverse=True)[a:b+1]'],
    ZRANGEBYSCORE:['елементи з балом між min і max','[x for x in scores if lo <= scores[x] <= hi]'],ZREM:['вийняти елемент','scores.pop(x)'],ZCARD:['скільки елементів','len(scores)'],
    XADD:['дописати повідомлення в журнал (stream); * — Redis сам дасть id «час-номер»','journal.append({...})'],
    XLEN:['скільки повідомлень у журналі','len(journal)'],
    XGROUP:['створити групу читачів: вона пам\'ятає, що вже роздано і кому','groups[name] = {"last": 0, "pending": {}}'],
    XREADGROUP:['видати читачу повідомлення: > — нові, яких ще нікому не давали; 0 — ті, що вже видані ЙОМУ, але не підтверджені','—'],
    XACK:['«готово»: прибрати повідомлення з pending','pending.pop(msg_id)'],
    XPENDING:['що видано, але не підтверджено, і кому','pending'],
    GEOADD:['записати координати (довгота, широта) — точки на мапі','points[name] = (lon, lat)'],
    GEOPOS:['координати точки','points[name]'],GEOSEARCH:['точки в радіусі від місця, найближчі першими','sorted(p for p in points if dist(p) <= r)'],
    PFADD:['запам\'ятати «бачили такого» для підрахунку різних (HyperLogLog, 12 КБ на мільйони)','seen.add(x)'],PFCOUNT:['скільки різних бачили (приблизно)','len(seen)'],
    MULTI:['почати транзакцію: наступні команди лише стають у чергу (QUEUED)','—'],EXEC:['виконати всю чергу разом, без вклинювань між командами','—'],DISCARD:['скасувати чергу транзакції','—'],
    PUBLISH:['надіслати повідомлення всім, хто ЗАРАЗ слухає канал; відповідь — скільки отримали','for f in listeners: f(msg)'],
    PING:['перевірка зв\'язку','—'],FLUSHDB:['видалити всі ключі','d.clear()'],
  };
  /* Проблеми: кроки {c, q — що передбачити, why — навіщо тут, after — що означає відповідь} */
  const S={
    'Кеш меню':{t:'Меню відкривають сотні разів за хвилину, а змінюється воно раз на день',
      p:'Кожен відкритий екран меню — <code>SELECT</code> у PostgreSQL: ~10 мс і навантаження на базу, хоча відповідь щоразу та сама.',
      naive:'Словник у пам\'яті програми? У нас 6 процесів — у кожного була б своя копія, і жоден не знає, коли її оновити.',
      code:'<code>app/menu.py: get_menu()</code>',steps:[
      {c:'GET cache:menu:3',q:'Ключа ще ніхто не створював. Що відповість Redis?',why:'Спершу завжди дивимось у кеш.',after:'<code>(nil)</code> — у кеші порожньо (MISS). Ідемо в PostgreSQL по меню.'},
      {c:'SET cache:menu:3 "[борщ 120, узвар 45]" EX 60',q:'Що відповість і що з\'явиться праворуч?',why:'Кладемо результат SELECT у кеш. <code>EX 60</code> — щоб застаріле меню не жило вічно.',after:'<code>OK</code>, праворуч з\'явився ключ з TTL 60 с.'},
      {c:'GET cache:menu:3',q:'Другий клієнт відкрив те саме меню. Що тепер?',why:'Так кожен наступний клієнт обходиться без PostgreSQL.',after:'Меню прийшло з Redis (HIT): ~0,3 мс замість ~10, база не працювала.'},
      {c:'TTL cache:menu:3',q:'Скільки секунд лишилось жити ключу?',why:'Перевіряємо таймер.',after:'60 с (час у пісочниці стоїть, поки не натиснеш «+10 с»).'},
      {tick:60,q:'Минає 60 секунд. Що станеться з ключем?',after:'Ключ зник сам — праворуч його більше немає.'},
      {c:'GET cache:menu:3',q:'Що поверне GET тепер?',why:'Після TTL наступний клієнт знову піде в PostgreSQL і покладе свіже меню.',after:'<code>(nil)</code>. Тому застаріла ціна проживе щонайбільше 60 с, навіть якщо ми забудемо скинути кеш.'}]},
    'Ліміт замовлень':{t:'Бот шле 100 замовлень за хвилину від одного клієнта',
      p:'Треба пускати не більше 3 замовлень на клієнта за хвилину, а решті відповідати «429 Too Many Requests».',
      naive:'Лічильник у змінній Python? API запущено в кількох процесах — у кожного свій лічильник. А <code>GET</code>, потім <code>SET n+1</code> з двох процесів губить +1 (гонка).',
      code:'<code>app/orders.py: check_rate_limit()</code>',steps:[
      {c:'INCR ratelimit:client-7',q:'Ключа немає. Помилка чи щось інше?',why:'Перше замовлення клієнта за хвилину.',after:'<code>1</code>: INCR вважає відсутній ключ нулем. Читає, додає й пише однією дією — гонки немає.'},
      {c:'EXPIRE ratelimit:client-7 60',q:'Навіщо таймер?',why:'Лічильник має «жити» одну хвилину. Ставимо, лише коли INCR повернув 1.',after:'<code>1</code> — таймер поставлено.'},
      {c:'INCR ratelimit:client-7',q:'Що поверне?',why:'Друге замовлення.',after:'2 ≤ 3 — пускаємо.'},
      {c:'INCR ratelimit:client-7',q:'А тепер?',why:'Третє.',after:'3 ≤ 3 — ще пускаємо.'},
      {c:'INCR ratelimit:client-7',q:'Четверте замовлення в ту ж хвилину. Що зробить код?',why:'Перевіряємо ліміт.',after:'4 &gt; 3 → API відповідає 429. Замовлення не створюється.'},
      {tick:60,q:'Хвилина минула. Що з лічильником?',after:'Ключ зник разом з таймером.'},
      {c:'INCR ratelimit:client-7',q:'Що поверне?',why:'Нова хвилина.',after:'<code>1</code> — рахунок почався заново, ніхто нічого не скидав вручну.'}]},
    'Захоплення кур\'єра':{t:'Два диспетчери одночасно знайшли того самого вільного кур\'єра',
      p:'Кур\'єр c4 найближчий для двох замовлень. Якщо обидва диспетчери його візьмуть, c4 поїде на два замовлення одразу.',
      naive:'«Перевірити, чи вільний, потім позначити зайнятим» — дві команди. Між ними другий диспетчер встигає перевірити й побачити «вільний».',
      code:'<code>app/dispatcher.py: try_assign()</code>',steps:[
      {c:'SADD couriers:free c1 c2 c4',q:'Що поверне?',why:'Множина вільних кур\'єрів (робить <code>seed_redis()</code> на старті).',after:'<code>3</code> — додано троє нових.'},
      {c:'SISMEMBER couriers:free c4',q:'Наївна перевірка «чи вільний c4». Що побачать ОБИДВА диспетчери?',why:'Показуємо, чому так не можна.',after:'<code>1</code> — обидва бачать «вільний» і обидва підуть його займати. Проблема.'},
      {c:'SREM couriers:free c4',q:'Диспетчер d1 «виймає» c4. Що відповість?',why:'Правильно: перевірка й захоплення — одна команда.',after:'<code>1</code> — c4 був у множині, тепер його забрав d1.'},
      {c:'SREM couriers:free c4',q:'Мілісекундою пізніше те саме робить d2. Що отримає він?',why:'Другий диспетчер.',after:'<code>0</code> — c4 уже забрали. d2 бере наступного з GEOSEARCH. Двічі одного кур\'єра не видадуть.'},
      {c:'SMEMBERS couriers:free',q:'Хто лишився вільним?',why:'Перевірка.',after:'c1 і c2.'}]},
    'Картка замовлення':{t:'Статус замовлення змінюється 5 разів, і його читають усі сервіси',
      p:'new → assigned → picked_up → delivered. Диспетчер, симулятор, API й дашборд читають і змінюють картку замовлення.',
      naive:'Зберігати картку як JSON-рядок? Щоб змінити одне поле, треба прочитати весь рядок, розпарсити, змінити й записати назад — і чужа зміна між цими кроками загубиться.',
      code:'<code>orders.create_order()</code>, <code>dispatcher.try_assign()</code>, <code>simulator.deliver()</code>',steps:[
      {c:'HSET order:42 customer client-7 restaurant_id 3 status new',q:'Що поверне HSET?',why:'Створюємо картку — словник полів під одним ключем.',after:'<code>3</code> — створено три нові поля.'},
      {c:'HGET order:42 status',q:'Що прочитає API?',why:'Можна читати одне поле, а не всю картку.',after:'<code>"new"</code>.'},
      {c:'HSET order:42 status assigned courier_id c4',q:'Змінюємо status і додаємо courier_id. Скільки поверне?',why:'Диспетчер призначив кур\'єра — змінюємо лише два поля, решта не чіпаємо.',after:'<code>1</code> — нове лише одне поле (courier_id); status оновлено, але не враховано.'},
      {c:'HGETALL order:42',q:'Що побачить дашборд?',why:'Уся картка однією командою.',after:'Усі поля разом.'},
      {c:'EXPIRE order:42 3600',q:'Навіщо після доставки?',why:'Доставлене замовлення вже записано в PostgreSQL; гаряча копія не потрібна вічно.',after:'Картка зникне з Redis за годину, а в PostgreSQL лишиться назавжди.'}]},
    'Рейтинг':{t:'Дашборд щосекунди показує топ кур\'єрів',
      p:'Після кожної доставки рейтинг змінюється, а дашборд перемальовується раз на секунду.',
      naive:'Тримати лічильники в словнику й щоразу сортувати всіх — O(n log n) щосекунди; у PostgreSQL — <code>GROUP BY</code> по всій історії щосекунди.',
      code:'<code>simulator.deliver()</code> (ZINCRBY), <code>dashboard.py</code> (ZREVRANGE)',steps:[
      {c:'ZINCRBY lb:couriers:deliveries 1 c4',q:'c4 доставив перше замовлення. Що поверне?',why:'+1 до балу c4; множина сама тримає порядок.',after:'<code>"1"</code> — новий бал.'},
      {c:'ZINCRBY lb:couriers:deliveries 1 c2',q:'Тепер c2.',why:'Ще одна доставка.',after:'<code>"1"</code>.'},
      {c:'ZINCRBY lb:couriers:deliveries 1 c4',q:'Знову c4. Який бал?',why:'Ще одна доставка c4.',after:'<code>"2"</code>.'},
      {c:'ZREVRANGE lb:couriers:deliveries 0 2 WITHSCORES',q:'Хто перший у топі?',why:'Дашборд: топ-3 від більшого до меншого.',after:'c4 (2), далі c2 (1). Без жодного сортування в коді.'}]},
    'Черга зі збоєм':{t:'Замовлення має обробити рівно один диспетчер — і не загубити, якщо той упаде',
      p:'Генератор кладе замовлення в чергу, диспетчери їх розбирають. Диспетчер може впасти посеред обробки.',
      naive:'Pub/Sub — якщо диспетчер не слухає в цю мить, замовлення пропало. LIST + LPOP — забрав і впав: замовлення вже вийнято з черги й загублено.',
      code:'<code>orders.create_order()</code> (XADD), <code>dispatcher.run()</code> (XREADGROUP, XACK)',steps:[
      {c:'XGROUP CREATE orders:new dispatchers 0 MKSTREAM',q:'Що відповість?',why:'Група «dispatchers» запам\'ятовуватиме, що кому видано.',after:'<code>OK</code>.'},
      {c:'XADD orders:new * order_id 7',save:'id7',q:'Що поверне XADD?',why:'Генератор кладе замовлення 7 у журнал.',after:'id повідомлення «час-номер».'},
      {c:'XADD orders:new * order_id 8',q:'А тут?',why:'Замовлення 8.',after:'Наступний id.'},
      {c:'XREADGROUP GROUP dispatchers d1 COUNT 1 STREAMS orders:new >',q:'Диспетчер d1 просить одне нове. Що отримає?',why:'<code>&gt;</code> — нові, яких ще нікому не давали.',after:'Замовлення 7. Воно не зникло з журналу, а записане як видане d1 (pending).'},
      {note:'💥 d1 упав, не надіславши XACK.',q:'Що з замовленням 7: загублене, у черзі чи ще десь?'},
      {c:'XPENDING orders:new dispatchers',q:'Що покаже?',why:'Перевіряємо непідтверджені.',after:'1 повідомлення висить за d1. Замовлення не загублено.'},
      {c:'XREADGROUP GROUP dispatchers d1 STREAMS orders:new 0',q:'d1 перезапустився й читає з <code>0</code>. Що отримає?',why:'Так починає <code>dispatcher.run()</code>: спершу свої недороблені.',after:'Знову замовлення 7 — доробляє його.'},
      {c:'XACK orders:new dispatchers {id7}',q:'Що поверне XACK?',why:'Обробили — підтверджуємо. Саме ПІСЛЯ обробки.',after:'<code>1</code> — підтверджено.'},
      {c:'XPENDING orders:new dispatchers',q:'А тепер?',why:'Перевірка.',after:'0 непідтверджених. Замовлення 8 чекає наступного читання з <code>&gt;</code>.'}]},
    'Транзакція':{t:'Створення замовлення — це кілька записів, і падати посередині не можна',
      p:'Треба записати картку, поставити замовлення в чергу й додати в активні.',
      naive:'Три окремі команди: програма впала після першої — є картка, але немає в черзі, і замовлення ніхто не обробить.',
      code:'<code>orders.create_order()</code> — <code>pipeline(transaction=True)</code>',steps:[
      {c:'INCR order:seq',q:'Що поверне?',why:'Спершу номер замовлення — він потрібен у всіх командах (це поза транзакцією).',after:'<code>1</code>.'},
      {c:'MULTI',q:'Що відповість?',why:'Починаємо транзакцію.',after:'<code>OK</code>.'},
      {c:'HSET order:1 status new',q:'Чи з\'явиться картка праворуч?',why:'Перша команда транзакції.',after:'<code>QUEUED</code> — ні! Команда лише стала в чергу, у Redis нічого не змінилось.'},
      {c:'XADD orders:new * order_id 1',q:'А тепер?',why:'Друга.',after:'Теж QUEUED.'},
      {c:'ZADD orders:active 0 1',q:'І це?',why:'Третя.',after:'QUEUED.'},
      {c:'EXEC',q:'Що станеться?',why:'Виконати все разом.',after:'Три відповіді — усі три записи з\'явились одночасно. Між ними ніхто не вклинився. (Відкату, як у PostgreSQL, немає: помилкова команда не скасує інших.)'}]},
    'Хто поруч':{t:'Знайти найближчого до ресторану кур\'єра',
      p:'Кур\'єри рухаються щосекунди. Для кожного замовлення треба найближчих у радіусі.',
      naive:'Перебирати всіх кур\'єрів і рахувати відстань у Python для кожного замовлення — повільно, коли кур\'єрів тисячі.',
      code:'<code>simulator.tick()</code> (GEOADD), <code>dispatcher.try_assign()</code> (GEOSEARCH)',steps:[
      {c:'GEOADD couriers:geo 30.61 50.47 c1 30.55 50.43 c2 30.54 50.43 c4',q:'Що поверне?',why:'Координати (довгота, широта) трьох кур\'єрів. Симулятор оновлює їх щосекунди тією ж командою.',after:'<code>3</code> — три нові точки.'},
      {c:'GEOSEARCH couriers:geo FROMLONLAT 30.538 50.427 BYRADIUS 5 km ASC WITHDIST',q:'Ресторан на Печерську. Хто перший?',why:'Найближчі в радіусі 5 км, від ближчого до дальшого.',after:'c4 (~0,36 км), потім c2. c1 далі 5 км — його немає. Далі диспетчер пробує <code>SREM couriers:free c4</code>.'}]},
  };
  let cur=null,k=0,done=false,ctx={};
  const out=h=>{term.insertAdjacentHTML('beforeend',h+'\n');term.scrollTop=term.scrollHeight;};
  const snap=()=>Object.fromEntries(R.view().map(x=>[x.k,JSON.stringify(x)]));
  function exec(line,mark){const before=snap();out(`<span class="in">redis&gt; ${esc(line)}</span>`);
    const r=R.exec(rsplit(line));const txt=rfmt(r);out(r&&r.t==='err'?`<span class="err">${esc(txt)}</span>`:esc(txt));
    const after=snap();const hot=Object.keys(after).filter(x=>after[x]!==before[x]);draw(hot);return{r,txt};}
  function draw(hot=[]){keys($('#sandbox-keys'),R.view().map(x=>({...x,hot:hot.includes(x.k)})));$('#sandbox-clock').textContent='віртуальний час: '+R.now+' с'+(R.multi?' · MULTI: у черзі '+R.multi.length:'');}
  const dict=c=>{const d=D[c.toUpperCase()];return d?`<b><code>${esc(c.toUpperCase())}</code></b> — ${d[0]}.${d[1]!=='—'?` <span style="color:var(--muted)">Python:</span> <code>${esc(d[1])}</code>`:''}`:''};
  const cmdOf=s=>s.c.replace(/\{(\w+)\}/g,(_,n)=>ctx[n]||n);
  function showStep(res){const s=cur.steps[k];const n=cur.steps.length;
    let h=`<div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0">Крок ${k+1} з ${n}</h3><span style="color:var(--muted);font-size:13px">${esc(Object.keys(S).find(x=>S[x]===cur))}</span></div>`;
    if(s.c){const c=cmdOf(s);h+=`<pre class="code" style="margin:10px 0;font-size:15px">${esc(c)}</pre><div style="font-size:14.5px">${dict(c.split(' ')[0])}</div>`;if(s.why)h+=`<p style="margin:8px 0 0"><b>Навіщо тут:</b> ${s.why}</p>`;}
    else if(s.tick)h+=`<p style="font-size:16px;margin:10px 0">⏱ Минає ${s.tick} с.</p>`;else h+=`<p style="font-size:17px;margin:10px 0"><b>${s.note}</b></p>`;
    if(!done)h+=`<details class="predict" open><summary>🔮 ${s.q}</summary><p style="color:var(--muted)">Подумай і натисни «Виконати».</p></details>`;
    else{if(res!=null&&s.c)h+=`<p style="margin:10px 0 4px"><b>Redis відповів:</b></p><pre class="code" style="margin:0">${esc(res)}</pre>`;if(s.after)h+=`<p class="note" style="margin-top:8px"><b>Що це означає:</b> ${s.after}</p>`;}
    const last=k===n-1;
    h+=`<div class="controls" style="margin-top:10px">${!done?`<button class="btn primary" id="sandbox-next">${s.c?'Виконати':'Далі'}</button>`:last?`<button class="btn primary" id="sandbox-next" disabled>✓ Проблему розв'язано</button>`:`<button class="btn primary" id="sandbox-next">Наступний крок →</button>`}<button class="btn" id="sandbox-restart">З початку</button></div>`;
    if(done&&last)h+=`<p class="note" style="margin-top:8px"><b>У проєкті:</b> ${cur.code}. Спробуй свою команду в терміналі нижче.</p>`;
    $('#sandbox-step').innerHTML=h;
    $('#sandbox-next').onclick=next;$('#sandbox-restart').onclick=()=>start(cur);}
  let lastRes=null;
  function next(){const s=cur.steps[k];
    if(!done){done=true;lastRes=null;
      if(s.c){const {r,txt}=exec(cmdOf(s));lastRes=txt;if(s.save)ctx[s.save]=r.v;}
      else if(s.tick){R.advance(s.tick);out(`<span class="hint">… минуло ${s.tick} с</span>`);draw();}
      else out(`<span class="hint">${esc(s.note)}</span>`);
      showStep(lastRes);return;}
    if(k<cur.steps.length-1){k++;done=false;showStep();}}
  function start(sc){cur=sc;k=0;done=false;ctx={};R.db.clear();R.multi=null;R.now=0;term.innerHTML='';
    out(`<span class="hint">── ${esc(sc.t)} ──</span>`);draw();
    $('#sandbox-problem').innerHTML=`<h3 style="font-size:19px;text-transform:none;letter-spacing:0;color:var(--ink);margin:0 0 8px">Проблема: ${sc.t}</h3><p style="margin:0 0 6px">${sc.p}</p><p style="margin:0"><b>Чому «просто» не працює:</b> ${sc.naive}</p>`;
    document.querySelectorAll('#sandbox-presets .btn').forEach(b=>b.classList.toggle('primary',S[b.dataset.p]===sc));showStep();}
  $('#sandbox-presets').innerHTML=Object.keys(S).map(n=>`<button class="btn" data-p="${esc(n)}">${esc(n)}</button>`).join('');
  $('#sandbox-presets').onclick=e=>{const b=e.target.closest('[data-p]');if(b)start(S[b.dataset.p]);};
  const free=()=>{const v=inp.value.trim();if(!v)return;exec(v);$('#sandbox-dict').innerHTML=dict(v.split(/\s+/)[0])||'<span style="color:var(--muted)">Такої команди в словнику немає.</span>';inp.value='';inp.focus();};
  inp.onkeydown=e=>{if(e.key==='Enter')free();};$('#sandbox-go').onclick=free;
  $('#sandbox-tick').onclick=()=>{R.advance(10);out(`<span class="hint">… минуло 10 с</span>`);draw();};
  $('#sandbox-flush').onclick=()=>{R.db.clear();R.multi=null;R.now=0;term.innerHTML='';out('<span class="hint">FLUSHDB: порожньо.</span>');draw();};
  start(S['Кеш меню']);
  course($('#sandbox-course'),['l31','nb31']);
})();
