/* ============ РОЗСЛІДУВАННЯ ============ */
(function(){
  const CASES=/*CASES_JSON*/null;
  const SQLJS='https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/';
  let SQL=null,sqlLoading=null;
  function loadSql(){if(SQL)return Promise.resolve(SQL);if(sqlLoading)return sqlLoading;
    sqlLoading=new Promise((ok,fail)=>{const s=document.createElement('script');s.src=SQLJS+'sql-wasm.js';
      s.onload=()=>initSqlJs({locateFile:f=>SQLJS+f}).then(x=>{SQL=x;ok(x);},fail);s.onerror=()=>{sqlLoading=null;fail(new Error('не вдалося завантажити SQLite (потрібен інтернет)'));};document.head.appendChild(s);});
    return sqlLoading;}
  const ST={};CASES.forEach(c=>ST[c.id]={solved:new Set(),q:0,ed:{}});
  let cur=null,db=null,R=null;
  const STORE={pg:'🐘 PostgreSQL',rd:'⚡ Redis',dk:'🦆 DuckDB'};
  $('#detect-cases').innerHTML=CASES.map(c=>`<button class="cs ${c.store}" data-c="${c.id}"><span class="st" id="detect-st-${c.id}"></span><small>${STORE[c.store]} · ${c.level}</small><b>${esc(c.title)}</b><small>${c.topics}</small></button>`).join('');
  $('#detect-cases').onclick=e=>{const b=e.target.closest('[data-c]');if(b)openCase(b.dataset.c);};
  const status=t=>$('#detect-status').textContent=t;
  /* ---- виконання ---- */
  function runSql(q){const res=db.exec(q);if(!res.length)return{cols:[],rows:[]};const r=res[res.length-1];return{cols:r.columns,rows:r.values};}
  function runRedis(q){const lines=q.split('\n').map(s=>s.trim()).filter(Boolean);let txt='';for(const l of lines){const r=R.exec(rsplit(l));txt=rfmt(r);if(r&&r.t==='err')return{err:txt};}return{txt};}
  const norm=v=>v===null||v===undefined?'NULL':typeof v==='number'?String(Math.round(v*100)/100):String(v).trim();
  function same(a,b,ordered){if(a.rows.length!==b.rows.length)return false;if(a.rows.length&&a.rows[0].length!==b.rows[0].length)return false;
    const k=r=>r.map(norm).join('\u0001');let x=a.rows.map(k),y=b.rows.map(k);if(!ordered){x.sort();y.sort();}return x.every((v,i)=>v===y[i]);}
  function table(r){if(!r.cols.length)return'<span style="color:var(--muted)">запит нічого не повернув</span>';
    const rows=r.rows.slice(0,60);return `<table><tr>${r.cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr>${rows.map(x=>`<tr>${x.map(v=>`<td>${v===null?'<i style="color:var(--muted)">NULL</i>':esc(norm(v))}</td>`).join('')}</tr>`).join('')}</table>${r.rows.length>60?`<p class="clock">… ще ${r.rows.length-60} рядків</p>`:''}<p class="clock">${r.rows.length} рядків</p>`;}
  /* ---- справа ---- */
  async function openCase(id){cur=CASES.find(c=>c.id===id);const st=ST[id];
    document.querySelectorAll('#detect-cases .cs').forEach(b=>b.setAttribute('aria-pressed',b.dataset.c===id));
    $('#detect-brief').innerHTML=`<h3 style="font-size:19px;text-transform:none;letter-spacing:0;color:var(--ink);margin:0 0 6px">${STORE[cur.store]} · Справа «${esc(cur.title)}»</h3><p style="margin:0">${cur.brief}</p>${cur.engine_note?`<p class="note" style="margin:8px 0 0">${cur.engine_note}</p>`:''}`;
    $('#detect-out').innerHTML='';$('#detect-verdict').innerHTML='';$('#detect-hintbox').innerHTML='';
    if(cur.engine==='redis'){R=new MiniRedis();cur.setup.forEach(l=>R.exec(rsplit(l)));db=null;status('');drawSchema();showQ(st.q);return;}
    status('Завантажую SQLite…');$('#detect-run').disabled=true;
    try{await loadSql();}catch(e){status('');$('#detect-schema').innerHTML='';$('#detect-q').innerHTML=`<p class="note">⚠ ${esc(e.message)}. Справа виконує SQL прямо в браузері, тож потрібен інтернет, щоб завантажити рушій.</p>`;return;}
    if(cur.id!==id)return;db=new SQL.Database();db.run(cur.schema+cur.data);status('');$('#detect-run').disabled=false;drawSchema();showQ(st.q);}
  function drawSchema(){
    if(cur.engine==='redis'){$('#detect-schema-h').textContent='Ключі в Redis';
      $('#detect-schema').innerHTML=R.view().map(x=>`<div class="schema-t"><b data-ins="${esc(x.t==='hash'?'HGETALL '+x.k:x.t==='list'?'LRANGE '+x.k+' 0 -1':x.t==='set'?'SMEMBERS '+x.k:x.t==='zset'?'ZRANGE '+x.k+' 0 -1 WITHSCORES':'GET '+x.k)}">${esc(x.k)}</b> <span>${x.t.toUpperCase()}</span></div>`).join('')+'<p class="clock">Клік по ключу — команда в редактор. Будь-яку команду можна виконати; кілька — кожну з нового рядка.</p>';}
    else{$('#detect-schema-h').textContent='Таблиці';
      const ts=runSql("SELECT name FROM sqlite_master WHERE type='table' ORDER BY rowid").rows.map(r=>r[0]);
      $('#detect-schema').innerHTML=ts.map(t=>{const cols=runSql(`PRAGMA table_info(${t})`).rows.map(r=>r[1]+(r[5]?' 🔑':''));const n=runSql(`SELECT COUNT(*) FROM ${t}`).rows[0][0];
        return `<div class="schema-t"><b data-ins="SELECT * FROM ${t} LIMIT 10;">${t}</b> <span>(${n} рядків)</span><br><span>${cols.map(esc).join(', ')}</span></div>`;}).join('')+'<p class="clock">Клік по назві таблиці — запит-розвідка в редактор.</p>';}}
  $('#detect-schema').onclick=e=>{const b=e.target.closest('[data-ins]');if(b){$('#detect-ed').value=b.dataset.ins;$('#detect-ed').focus();}};
  function showQ(i){const st=ST[cur.id];st.q=i;const Q=cur.questions[i];
    $('#detect-dots').innerHTML='<span style="border:0;width:auto;background:none;cursor:default">Питання</span>'+cur.questions.map((_,k)=>`<span data-k="${k}" class="${st.solved.has(k)?'ok':''} ${k===i?'on':''} ${k>0&&!st.solved.has(k-1)&&!st.solved.has(k)?'lock':''}">${k+1}</span>`).join('');
    $('#detect-q').innerHTML=`<b>Q${i+1}.</b> ${Q.q}`;
    $('#detect-ed').value=st.ed[i]||(cur.engine==='redis'?'':'-- твій запит\n');$('#detect-ed').placeholder=cur.engine==='redis'?'команда Redis, напр. KEYS *':'SELECT …';
    $('#detect-hintbox').innerHTML='';$('#detect-verdict').innerHTML='';$('#detect-out').innerHTML='';
    $('#detect-notes').innerHTML=cur.questions.map((q,k)=>st.solved.has(k)?`<li>${q.clue}</li>`:'').join('')||'<li style="list-style:none;margin-left:-20px;color:var(--muted)">Поки порожньо: доказ з\'являється після правильної відповіді.</li>';
    if(st.solved.size===cur.questions.length)final();}
  $('#detect-dots').onclick=e=>{const d=e.target.closest('[data-k]');if(!d||d.classList.contains('lock'))return;showQ(+d.dataset.k);};
  $('#detect-ed').oninput=()=>{ST[cur.id].ed[ST[cur.id].q]=$('#detect-ed').value;};
  $('#detect-ed').onkeydown=e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();check();}};
  function check(){const st=ST[cur.id],i=st.q,Q=cur.questions[i],q=$('#detect-ed').value;let ok=false,msg='';
    if(cur.engine==='redis'){const r=runRedis(q);if(r.err){$('#detect-out').innerHTML=`<pre class="term" style="height:auto;max-height:260px">${esc(r.err)}</pre>`;msg='Redis відповів помилкою: перевір назву команди й ключа.';}
      else{$('#detect-out').innerHTML=`<pre class="term" style="height:auto;max-height:300px">${esc(r.txt)}</pre>`;ok=Q.need.every(s=>r.txt.includes(s));if(!ok)msg='Команда виконалась, але в її відповіді немає потрібного доказу. Подивись на ключі праворуч.';drawSchema();}}
    else{let mine;try{const qq=q.replace(/^\s*--.*$/gm,'').trim();if(!qq){msg='Напиши запит.';}else{mine=runSql(qq);}}catch(e){msg='Помилка SQL: '+esc(e.message);}
      if(mine){$('#detect-out').innerHTML=table(mine);const want=runSql(Q.a);ok=same(mine,want,Q.ordered);
        if(!ok)msg=mine.rows.length!==want.rows.length?`Запит працює, але рядків ${mine.rows.length}, а має бути ${want.rows.length}.`:mine.rows.length&&mine.cols.length!==want.cols.length?`Рядків стільки, скільки треба, але колонок ${mine.cols.length}, а потрібно ${want.cols.length}.`:Q.ordered?'Майже: перевір значення і порядок рядків (<code>ORDER BY</code>).':'Майже: значення не збігаються. Перевір умови.';}}
    if(ok){st.solved.add(i);const last=i===cur.questions.length-1;
      $('#detect-verdict').innerHTML=`<div class="v ok">✅ <b>Доказ знайдено.</b> ${Q.clue}${!last?` <button class="btn" id="detect-next" style="margin-left:8px">Наступне питання →</button>`:''}</div>`;
      const nb=$('#detect-next');if(nb)nb.onclick=()=>showQ(i+1);
      $('#detect-st-'+cur.id).textContent=st.solved.size===cur.questions.length?'✓ розкрито':st.solved.size+'/'+cur.questions.length;
      const keep=$('#detect-verdict').innerHTML,out=$('#detect-out').innerHTML;showQ(i);$('#detect-ed').value=q;$('#detect-verdict').innerHTML=keep;$('#detect-out').innerHTML=out;const nb2=$('#detect-next');if(nb2)nb2.onclick=()=>showQ(i+1);if(last)final();}
    else $('#detect-verdict').innerHTML=`<div class="v no">✗ ${msg}</div>`;
    return ok;}
  function final(){if($('#detect-final'))return;$('#detect-verdict').insertAdjacentHTML('beforeend',`<div class="verdict-final" id="detect-final">🕵️ <b>Справу розкрито.</b> ${cur.verdict}</div>`);}
  $('#detect-run').onclick=check;
  $('#detect-hint').onclick=()=>{$('#detect-hintbox').innerHTML=`<p class="note" style="margin:8px 0 0">💡 ${cur.questions[ST[cur.id].q].hint}</p>`;};
  $('#detect-show').onclick=()=>{const a=cur.questions[ST[cur.id].q].a;$('#detect-ed').value=a;ST[cur.id].ed[ST[cur.id].q]=a;};
  /* самоперевірка для browser_check.py: кожна еталонна відповідь має пройти */
  window.__detectSelfTest=async()=>{const out=[];for(const c of CASES){await openCase(c.id);if(c.engine!=='redis'&&!db){out.push(c.id+':no-engine');continue;}
    let n=0;for(let i=0;i<c.questions.length;i++){showQ(i);$('#detect-show').click();if(check())n++;}out.push(`${c.id}:${n}/${c.questions.length}${$('#detect-final')?'+verdict':''}`);}return out.join(' ');};
  openCase(CASES[0].id);
  course($('#detect-course'),['l30','l31','duck']);
})();
