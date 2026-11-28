/* ============ OLAP: рядки проти колонок ============ */
(function(){
  const COLS=['id','customer','restaurant_id','courier_id','total','delivered_at'];const NEED=['restaurant_id','total'];
  const ROWS=[[1,'client-4',5,'c1',200,'09:34'],[2,'client-9',3,'c6',415,'09:36'],[3,'client-2',2,'c8',800,'09:40'],[4,'client-4',5,'c2',130,'09:41'],[5,'client-7',3,'c4',240,'09:44'],[6,'client-1',2,'c5',260,'09:47']];
  function* gen(){
    const rowRead=new Set(),colRead=new Set();let msg='Запит: <code>SELECT restaurant_id, SUM(total) FROM orders GROUP BY restaurant_id</code>. Потрібні дві колонки з шести.';
    const S=()=>({r:new Set(rowRead),c:new Set(colRead),msg});yield S();
    for(let i=0;i<ROWS.length;i++){COLS.forEach((_,j)=>rowRead.add(i+':'+j));
      msg=`Рядкове: щоб дістати <code>restaurant_id</code> і <code>total</code> з рядка ${i+1}, читаємо <b>весь рядок</b> — 6 клітинок.`;yield S();}
    NEED.forEach(cn=>{const j=COLS.indexOf(cn);ROWS.forEach((_,i)=>colRead.add(i+':'+j));msg=`Колонкове: читаємо колонку <code>${cn}</code> цілком, підряд. Решта колонок навіть не відкривається.`;});
    yield S();
    msg='Підсумок: рядкове прочитало 36 клітинок, колонкове — 12, утричі менше. На справжніх даних колонок 15–20, а колонки ще й стискаються: однакові значення поруч. Звідси «секунди замість хвилин».';yield S();
  }
  function render(s){
    $('#olap-row').innerHTML=ROWS.map((r,i)=>r.map((v,j)=>`<span class="${s.r.has(i+':'+j)?'read':''}" title="${COLS[j]}">${esc(v)}</span>`).join('')+'<span class="sep">│</span>').join('');
    $('#olap-col').innerHTML=COLS.map((cn,j)=>`<span class="sep">${cn}:</span>`+ROWS.map((r,i)=>`<span class="${s.c.has(i+':'+j)?'read':(s.c.size&&!NEED.includes(cn)?'skip':'')}">${esc(r[j])}</span>`).join('')+'<span class="sep">│</span>').join('');
    $('#olap-nr').textContent=s.r.size;$('#olap-nc').textContent=s.c.size;$('#olap-msg').innerHTML=s.msg;}
  const r=new Runner(gen,render);r.delay=900;controls($('#olap-controls'),r,'olap');
  code($('#olap-code'),[
    '# 1. Вивантажити історію з PostgreSQL (наприклад, раз на добу)',
    '#    docker compose exec -T postgres psql -U taxi smachno \\',
    '#      -c "\\copy orders TO STDOUT CSV HEADER" > orders.csv',
    'import duckdb',
    '',
    '# 2. CSV → parquet: колонковий, стиснений формат',
    'duckdb.sql("COPY (SELECT * FROM \'orders.csv\') TO \'orders.parquet\' (FORMAT parquet)")',
    '',
    '# 3. Аналітика прямо по файлу — без сервера',
    'duckdb.sql("""',
    '    SELECT restaurant_id,',
    '           count(*)                                              AS orders,',
    '           round(sum(total), 2)                                  AS revenue,',
    '           round(avg(epoch(delivered_at - created_at)) / 60, 1)  AS avg_minutes',
    '    FROM \'orders.parquet\'',
    '    GROUP BY ALL',
    '    ORDER BY revenue DESC',
    '""").show()']);
  course($('#olap-course'),['duck','l30','taxi']);
})();
