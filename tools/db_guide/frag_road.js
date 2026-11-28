/* ============ РОАДМАП ============ */
(function(){
  const R=[
    ['🐘','Урок 30 · SQL і PostgreSQL','Таблиці, первинні й зовнішні ключі, <code>JOIN</code>, транзакції, <code>EXPLAIN</code>.','Читаєш <code>sql/init.sql</code> і <code>app/db.py</code>: чому <code>REFERENCES</code>, <code>CHECK</code>, параметри <code>%s</code> замість f-рядків і <code>ON CONFLICT</code>.',['l30','nb30']],
    ['⚡','Урок 31 · Redis','Типи даних, <code>TTL</code>, <code>INCR</code>, pipeline, cache-aside, черга, Pub/Sub, rate limit.','Розумієш кожен ключ у <code>app/config.py</code> і можеш передбачити відповідь будь-якої команди в <code>redis-cli</code>.',['l31','nb31']],
    ['🗺️','Цей гайд: загальна картина','Три ролі баз, картки сутностей, патерни як «задача → рішення», архітектура.','Можеш пояснити, <b>чому</b> кожен шматок даних лежить саме там і що буде, якщо щось упаде.',[]],
    ['🚕','Проєкт taxi_delivery_redis','Шість сервісів, Redis Streams, GEO, транзакції, логи, Docker Compose.','Запускаєш, читаєш логи, ламаєш (kill) і бачиш, як система відновлюється. Додаєш свою фічу.',['taxi','taxiarch']],
    ['🦆','Бонус · DuckDB і data lake','Колонкове зберігання, parquet, аналітика по мільйонах рядків, medallion.','Вивантажуєш історію <code>orders</code> і рахуєш виторг та час доставки; розумієш OLTP проти OLAP.',['duck']],
    ['🔌','Далі · Redis у вебзастосунку','Кеш і rate limit як middleware FastAPI, фонові задачі.','Ті самі патерни, але у вебсервісі з HTTP-заголовками й кодом 429.',['l40']],
  ];
  $('#road-steps').innerHTML=R.map(([ic,h,what,after,keys])=>`<div class="rstep"><div class="num">${ic}</div><div class="card"><h3>${h}</h3><p><b>Що:</b> ${what}</p><p><b>Після цього:</b> ${after}</p>${keys.length?`<p>${keys.map(k=>`<a href="${COURSE[k].u}" target="_blank" rel="noopener">${esc(COURSE[k].t)}</a>`).join(' · ')}</p>`:''}</div></div>`).join('');
  course($('#road-course'),['l30','l31','taxi','duck']);
})();

/* ============ ЗАДАЧІ ============ */
(function(){
  const T=[
    ['1. Кеш меню','🟢',[
      ['Передбач','Відкрий <code>GET /restaurants/1/menu</code> двічі. Яке буде поле <code>source</code> у першій і в другій відповіді? Як зміниться <code>ms</code>?'],
      ['Запусти','http://localhost:8100/docs → <code>GET /restaurants/1/menu</code> → Execute, двічі.'],
      ['Досліди','<pre>docker compose logs -f api            # GET … MISS → SELECT → SET … EX 60, потім HIT\nredis-cli -p 6390 TTL cache:menu:1</pre>'],
      ['Зміни','Підніми ціну в PostgreSQL: <pre>docker compose exec postgres psql -U taxi smachno -c "UPDATE menu_items SET price = 999 WHERE id = 1"</pre>Коли нову ціну побачить клієнт? Виклич <code>DELETE /restaurants/1/menu/cache</code> і поясни різницю.'],
      ['Зроби своє','Ендпоінт <code>PUT /menu_items/{id}</code>, що змінює ціну в PostgreSQL <b>і</b> скидає кеш ресторану. Чому саме в такому порядку: спершу база, потім <code>DEL</code>?'],
    ]],
    ['2. Два диспетчери','🟢',[
      ['Передбач','Якщо запустити другого диспетчера, чи може один кур\'єр отримати два замовлення? Чи може одне замовлення обробитися двічі?'],
      ['Запусти','<pre>docker compose run -d --name d2 -e DISPATCHER_NAME=d2 dispatcher</pre>'],
      ['Досліди','<pre>docker compose logs -f dispatcher     # перший диспетчер\ndocker logs -f d2                     # другий (запущений через run)\ndocker compose exec redis redis-cli XINFO CONSUMERS orders:new dispatchers</pre>Порівняй, кому дісталось яке повідомлення. Шукай рядки <code>SREM … → 0 (вже зайнятий іншим…)</code>. Прибрати другого: <code>docker rm -f d2</code>, потім <code>… redis-cli XGROUP DELCONSUMER orders:new dispatchers d2</code>.'],
      ['Зміни','Прискор генератор: у <code>docker-compose.yml</code> додай <code>ORDER_EVERY_SEC: "1"</code> до <code>generator.environment</code> і перезапусти. Що відбувається з <code>orders:waiting</code>?'],
      ['Зроби своє','Поясни трьома реченнями, чому подвійного призначення немає: роль consumer group і роль <code>SREM</code>.'],
    ]],
    ['3. Падіння диспетчера','🟡',[
      ['Передбач','Диспетчер лежить 30 секунд. Що станеться з замовленнями, які прийшли за цей час? Скільки буде в pending?'],
      ['Запусти','<pre>docker compose kill dispatcher\n# почекай 20–30 с\nredis-cli -p 6390 XLEN orders:new\nredis-cli -p 6390 XPENDING orders:new dispatchers\ndocker compose start dispatcher</pre>'],
      ['Досліди','Перші рядки лога <code>dispatcher</code> після старту: «непідтверджених (pending) …», потім <code>XREADGROUP … &gt;</code> забирає все, що накопичилось.'],
      ['Зміни','Подумки (або в копії коду) перенеси <code>XACK</code> <b>перед</b> <code>try_assign()</code>. Що станеться, якщо процес упаде між ними?'],
      ['Зроби своє','Чому <code>try_assign()</code> перевіряє статус і пропускає вже призначені замовлення? Поясни через «at-least-once» доставку. 🔴 Якщо диспетчер <code>d2</code> зник <b>назавжди</b>, маючи pending, хто їх забере? Ніхто: кожен читає лише свої. Дізнайся, як це розв\'язує <code>XAUTOCLAIM</code>.'],
    ]],
    ['4. Rate limit','🟡',[
      ['Передбач','Клієнт робить 4 замовлення за 10 секунд. Що отримає четверте? А 3 замовлення о 0:59 і ще 3 о 1:01?'],
      ['Запусти','У Swagger <code>POST /orders</code> 4 рази поспіль з тим самим <code>customer</code>.'],
      ['Досліди','<pre>docker compose logs -f api            # INCR ratelimit:… → 4 з 3 → ВІДМОВА (429)\nredis-cli -p 6390 TTL ratelimit:&lt;customer&gt;</pre>'],
      ['Зміни','Зміни <code>ORDERS_PER_MIN_LIMIT</code> в <code>app/config.py</code> і перевір.'],
      ['Зроби своє','Ковзне вікно на ZSET: <code>ZADD ratelimit:z:&lt;клієнт&gt; &lt;now&gt; &lt;now&gt;</code>, <code>ZREMRANGEBYSCORE … 0 &lt;now-60&gt;</code>, <code>ZCARD</code>. Чому тут потрібен <code>MULTI</code>?'],
    ]],
    ['5. Нова фіча: заробіток кур\'єрів','🟡',[
      ['Передбач','У яку функцію і в яку транзакцію треба додати одну команду, щоб рахувати заробіток кур\'єрів? Який тип Redis?'],
      ['Запусти','Знайди <code>deliver()</code> в <code>app/simulator.py</code> і транзакцію <code>MULTI</code> в ній.'],
      ['Досліди','<pre>redis-cli -p 6390 ZREVRANGE lb:couriers:deliveries 0 -1 WITHSCORES</pre>'],
      ['Зміни','Додай ключ <code>LB_EARNINGS = "lb:couriers:earnings"</code> у <code>config.py</code> і <code>pipe.zincrby(C.LB_EARNINGS, C.DELIVERY_FEE, cid)</code> у <code>deliver()</code>.'],
      ['Зроби своє','Виведи «Топ-5 за заробітком» на дашборд і в API. Звір із PostgreSQL: <code>SELECT courier_id, SUM(fee) FROM orders GROUP BY 1</code>.'],
    ]],
    ['6. Таблиця клієнтів','🔴',[
      ['Передбач','Зараз клієнт — просто рядок. Що зміниться в <code>orders</code>, якщо додати таблицю <code>customers</code> з <code>FOREIGN KEY</code>? Що буде із замовленням неіснуючого клієнта?'],
      ['Запусти','Відкрий <code>sql/init.sql</code> і <code>save_delivered_order()</code>.'],
      ['Досліди','Заповни «картку сутності» для клієнта (вкладка «Сутності»): що в PostgreSQL, що в Redis, хто змінює, хто читає.'],
      ['Зміни','Таблиця <code>customers(id TEXT PRIMARY KEY, name TEXT, created_at TIMESTAMPTZ)</code>, у <code>orders</code> — <code>REFERENCES customers(id)</code>. Перезапуск з нуля: <code>docker compose down -v</code>, потім <code>up --build</code>.'],
      ['Зроби своє','Де створювати клієнта: у генераторі, в API чи <code>INSERT … ON CONFLICT DO NOTHING</code> перед замовленням? Обґрунтуй.'],
    ]],
    ['7. Аналітика в DuckDB','🔴',[
      ['Передбач','Який ресторан заробив найбільше? О котрій годині найбільше замовлень? Запиши здогадку до запиту.'],
      ['Запусти','Конвеєр з вкладки «Аналітика»: <code>\\copy orders</code> → <code>orders.csv</code> → parquet → DuckDB.'],
      ['Досліди','<code>GROUP BY restaurant_id</code>, <code>GROUP BY hour(delivered_at)</code>, <code>avg(epoch(delivered_at - created_at))</code>.'],
      ['Зміни','Вивантаж і <code>restaurants</code>, зроби <code>JOIN</code> і отримай назви й райони замість id.'],
      ['Зроби своє','Чому цей запит краще ганяти в DuckDB по parquet, ніж щохвилини в PostgreSQL під навантаженням? Два аргументи.'],
    ]],
    ['8. Питання на розмову: перезапуск Redis','🔴',[
      ['Передбач','Що лишиться після <code>docker compose restart redis</code> з <code>--appendonly yes</code>? А без нього? Що збережеться в PostgreSQL у будь-якому разі?'],
      ['Запусти','<pre>docker compose restart redis\nredis-cli -p 6390 DBSIZE</pre>Потім прибери <code>--appendonly yes</code> з <code>docker-compose.yml</code>, <code>docker compose up -d</code>, ще раз <code>restart redis</code>.'],
      ['Досліди','Що стало з активними замовленнями, <code>order:seq</code> і кур\'єрами? Хто їх відновив і як (<code>seed_redis()</code>)?'],
      ['Зміни','Поверни <code>--appendonly yes</code>.'],
      ['Зроби своє','Чому <code>order:seq</code> без AOF небезпечний (<code>ON CONFLICT</code> у PostgreSQL)? Як би ти це виправив?'],
    ]],
  ];
  $('#tasks-list').innerHTML=T.map(([h,lvl,steps],i)=>`<details class="task"${i===0?' open':''}><summary>${lvl} ${h}</summary><ol>${steps.map(([a,b])=>`<li><b>${a}</b><div>${b}</div></li>`).join('')}</ol></details>`).join('');
  course($('#tasks-course'),['taxi','taxiarch','duck']);
})();
