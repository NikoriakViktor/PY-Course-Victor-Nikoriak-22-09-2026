/* ============ MINI REDIS (пісочниця) ============
   Навчальна модель Redis у браузері: ті самі відповіді, що й redis-cli, для команд нижче.
   Спрощення (позначені в інтерфейсі): час віртуальний (кнопка «+10 с»); PFCOUNT рахує точно;
   PUBLISH нікому не доставляє (у пісочниці немає підписників); XREADGROUP без BLOCK. */
class MiniRedis{
  constructor(){this.db=new Map();this.now=0;this.multi=null;}
  _get(k){const e=this.db.get(k);if(e&&e.exp!=null&&this.now>=e.exp){this.db.delete(k);return undefined;}return e;}
  _typed(k,t,create){let e=this._get(k);if(!e){if(!create)return undefined;e={t,v:create(),exp:null};this.db.set(k,e);}
    else if(e.t!==t)throw new Error('WRONGTYPE Operation against a key holding the wrong kind of value');return e;}
  _int(s){if(!/^-?\d+$/.test(String(s)))throw new Error('ERR value is not an integer or out of range');return parseInt(s,10);}
  _num(s){const x=Number(s);if(s===''||isNaN(x))throw new Error('ERR value is not a valid float');return x;}
  _fs(x){return String(+x.toPrecision(17));}
  advance(sec){this.now+=sec;for(const k of [...this.db.keys()])this._get(k);}
  exec(argv){
    if(!argv.length)return null;const cmd=argv[0].toUpperCase(),a=argv.slice(1);
    if(this.multi&&!['EXEC','DISCARD','MULTI'].includes(cmd)){this.multi.push(argv);return{t:'status',v:'QUEUED'};}
    try{return this._run(cmd,a);}catch(e){return{t:'err',v:e.message};}
  }
  _run(cmd,a){
    const I=v=>({t:'int',v}),B=v=>v==null?{t:'nil'}:{t:'bulk',v:String(v)},OK={t:'status',v:'OK'},A=v=>({t:'arr',v});
    const need=n=>{if(a.length<n)throw new Error(`ERR wrong number of arguments for '${cmd.toLowerCase()}' command`);};
    const k=a[0];
    switch(cmd){
      case 'PING':return{t:'status',v:'PONG'};
      case 'FLUSHDB':this.db.clear();return OK;
      case 'MULTI':if(this.multi)throw new Error('ERR MULTI calls can not be nested');this.multi=[];return OK;
      case 'DISCARD':if(!this.multi)throw new Error('ERR DISCARD without MULTI');this.multi=null;return OK;
      case 'EXEC':{if(!this.multi)throw new Error('ERR EXEC without MULTI');const q=this.multi;this.multi=null;return A(q.map(x=>this.exec(x)));}
      case 'SET':{need(2);let ex=null,nx=false;for(let i=2;i<a.length;i++){const o=a[i].toUpperCase();if(o==='EX')ex=this._int(a[++i]);else if(o==='NX')nx=true;else throw new Error('ERR syntax error');}
        if(nx&&this._get(k))return{t:'nil'};this.db.set(k,{t:'string',v:a[1],exp:ex!=null?this.now+ex:null});return OK;}
      case 'GET':{need(1);const e=this._typed(k,'string');return B(e?e.v:null);}
      case 'DEL':{need(1);let n=0;a.forEach(x=>{if(this._get(x)){this.db.delete(x);n++;}});return I(n);}
      case 'EXISTS':{need(1);return I(a.filter(x=>this._get(x)).length);}
      case 'TYPE':{need(1);const e=this._get(k);return{t:'status',v:e?e.t:'none'};}
      case 'KEYS':{need(1);const re=new RegExp('^'+a[0].replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*').replace(/\?/g,'.')+'$');
        return A([...this.db.keys()].filter(x=>this._get(x)&&re.test(x)).sort().map(B));}
      case 'INCR':case 'DECR':case 'INCRBY':case 'DECRBY':{need(cmd.endsWith('BY')?2:1);const e=this._typed(k,'string',()=>'0');
        const d=cmd==='INCR'?1:cmd==='DECR'?-1:cmd==='INCRBY'?this._int(a[1]):-this._int(a[1]);const n=this._int(e.v)+d;e.v=String(n);return I(n);}
      case 'EXPIRE':{need(2);const e=this._get(k);if(!e)return I(0);e.exp=this.now+this._int(a[1]);return I(1);}
      case 'PERSIST':{need(1);const e=this._get(k);if(!e||e.exp==null)return I(0);e.exp=null;return I(1);}
      case 'TTL':{need(1);const e=this._get(k);return I(!e?-2:e.exp==null?-1:Math.ceil(e.exp-this.now));}
      case 'HSET':{if(a.length<3||a.length%2===0)throw new Error("ERR wrong number of arguments for 'hset' command");const e=this._typed(k,'hash',()=>new Map());let n=0;
        for(let i=1;i<a.length;i+=2){if(!e.v.has(a[i]))n++;e.v.set(a[i],a[i+1]);}return I(n);}
      case 'HGET':{need(2);const e=this._typed(k,'hash');return B(e&&e.v.has(a[1])?e.v.get(a[1]):null);}
      case 'HGETALL':{need(1);const e=this._typed(k,'hash');return A(e?[...e.v].flatMap(([f,v])=>[B(f),B(v)]):[]);}
      case 'HDEL':{need(2);const e=this._typed(k,'hash');if(!e)return I(0);let n=0;a.slice(1).forEach(f=>{if(e.v.delete(f))n++;});if(!e.v.size)this.db.delete(k);return I(n);}
      case 'HINCRBY':{need(3);const e=this._typed(k,'hash',()=>new Map());const n=this._int(e.v.get(a[1])??'0')+this._int(a[2]);e.v.set(a[1],String(n));return I(n);}
      case 'HLEN':{need(1);const e=this._typed(k,'hash');return I(e?e.v.size:0);}
      case 'LPUSH':case 'RPUSH':{need(2);const e=this._typed(k,'list',()=>[]);a.slice(1).forEach(x=>cmd==='LPUSH'?e.v.unshift(x):e.v.push(x));return I(e.v.length);}
      case 'LPOP':case 'RPOP':{need(1);const e=this._typed(k,'list');if(!e)return{t:'nil'};const x=cmd==='LPOP'?e.v.shift():e.v.pop();if(!e.v.length)this.db.delete(k);return B(x);}
      case 'LLEN':{need(1);const e=this._typed(k,'list');return I(e?e.v.length:0);}
      case 'LRANGE':{need(3);const e=this._typed(k,'list');if(!e)return A([]);const [s,t]=this._range(e.v.length,a[1],a[2]);return A(e.v.slice(s,t+1).map(B));}
      case 'LTRIM':{need(3);const e=this._typed(k,'list');if(!e)return OK;const [s,t]=this._range(e.v.length,a[1],a[2]);e.v=e.v.slice(s,t+1);if(!e.v.length)this.db.delete(k);return OK;}
      case 'SADD':{need(2);const e=this._typed(k,'set',()=>new Set());let n=0;a.slice(1).forEach(x=>{if(!e.v.has(x)){e.v.add(x);n++;}});return I(n);}
      case 'SREM':{need(2);const e=this._typed(k,'set');if(!e)return I(0);let n=0;a.slice(1).forEach(x=>{if(e.v.delete(x))n++;});if(!e.v.size)this.db.delete(k);return I(n);}
      case 'SMEMBERS':{need(1);const e=this._typed(k,'set');return A(e?[...e.v].sort().map(B):[]);}
      case 'SISMEMBER':{need(2);const e=this._typed(k,'set');return I(e&&e.v.has(a[1])?1:0);}
      case 'SCARD':{need(1);const e=this._typed(k,'set');return I(e?e.v.size:0);}
      case 'ZADD':{if(a.length<3||a.length%2===0)throw new Error("ERR wrong number of arguments for 'zadd' command");const e=this._typed(k,'zset',()=>new Map());let n=0;
        for(let i=1;i<a.length;i+=2){const s=this._num(a[i]);if(!e.v.has(a[i+1]))n++;e.v.set(a[i+1],s);}return I(n);}
      case 'ZINCRBY':{need(3);const e=this._typed(k,'zset',()=>new Map());const s=(e.v.get(a[2])||0)+this._num(a[1]);e.v.set(a[2],s);return B(this._fs(s));}
      case 'ZSCORE':{need(2);const e=this._typed(k,'zset');return B(e&&e.v.has(a[1])?this._fs(e.v.get(a[1])):null);}
      case 'ZCARD':{need(1);const e=this._typed(k,'zset');return I(e?e.v.size:0);}
      case 'ZREM':{need(2);const e=this._typed(k,'zset');if(!e)return I(0);let n=0;a.slice(1).forEach(x=>{if(e.v.delete(x))n++;});if(!e.v.size)this.db.delete(k);return I(n);}
      case 'ZRANK':{need(2);const e=this._typed(k,'zset');if(!e||!e.v.has(a[1]))return{t:'nil'};return I(this._zs(e).findIndex(([m])=>m===a[1]));}
      case 'ZRANGE':case 'ZREVRANGE':{need(3);const e=this._typed(k,'zset');if(!e)return A([]);let z=this._zs(e);if(cmd==='ZREVRANGE')z=z.reverse();
        const [s,t]=this._range(z.length,a[1],a[2]);const ws=(a[3]||'').toUpperCase()==='WITHSCORES';return A(z.slice(s,t+1).flatMap(([m,sc])=>ws?[B(m),B(this._fs(sc))]:[B(m)]));}
      case 'ZRANGEBYSCORE':{need(3);const e=this._typed(k,'zset');if(!e)return A([]);const lo=a[1]==='-inf'?-Infinity:this._num(a[1]),hi=a[2]==='+inf'?Infinity:this._num(a[2]);
        const ws=(a[3]||'').toUpperCase()==='WITHSCORES';return A(this._zs(e).filter(([,s])=>s>=lo&&s<=hi).flatMap(([m,sc])=>ws?[B(m),B(this._fs(sc))]:[B(m)]));}
      case 'PFADD':{need(1);const existed=!!this._get(k);const e=this._typed(k,'hll',()=>new Set());const before=e.v.size;a.slice(1).forEach(x=>e.v.add(x));return I(!existed||e.v.size>before?1:0);}
      case 'PFCOUNT':{need(1);const e=this._typed(k,'hll');return I(e?e.v.size:0);}
      case 'PUBLISH':{need(2);return I(0);}
      case 'GEOADD':{if(a.length<4||(a.length-1)%3)throw new Error("ERR wrong number of arguments for 'geoadd' command");const e=this._typed(k,'geo',()=>new Map());let n=0;
        for(let i=1;i<a.length;i+=3){if(!e.v.has(a[i+2]))n++;e.v.set(a[i+2],[this._num(a[i]),this._num(a[i+1])]);}return I(n);}
      case 'GEOPOS':{need(2);const e=this._typed(k,'geo');return A(a.slice(1).map(m=>e&&e.v.has(m)?A(e.v.get(m).map(x=>B(x.toFixed(6)))):{t:'nil'}));}
      case 'GEOSEARCH':{const e=this._typed(k,'geo');const u=a.map(x=>x.toUpperCase());const f=u.indexOf('FROMLONLAT'),r=u.indexOf('BYRADIUS');
        if(f<0||r<0)throw new Error('ERR syntax error');const lon=this._num(a[f+1]),lat=this._num(a[f+2]),rad=this._num(a[r+1]),unit=u[r+2]==='M'?1:1000;
        const wd=u.includes('WITHDIST');let list=e?[...e.v].map(([m,[lo,la]])=>[m,this._hav(lat,lon,la,lo)/unit]).filter(([,d])=>d<=rad):[];
        if(u.includes('ASC'))list.sort((x,y)=>x[1]-y[1]);if(u.includes('DESC'))list.sort((x,y)=>y[1]-x[1]);
        const c=u.indexOf('COUNT');if(c>=0)list=list.slice(0,this._int(a[c+1]));
        return A(list.map(([m,d])=>wd?A([B(m),B(d.toFixed(4))]):B(m)));}
      case 'XADD':{need(4);const e=this._typed(k,'stream',()=>({entries:[],groups:new Map(),last:[0,0]}));let id=a[1];
        if(id==='*'){const ms=1795858400000+Math.round(this.now*1000);const seq=ms===e.v.last[0]?e.v.last[1]+1:0;id=`${ms}-${seq}`;}
        const p=this._xid(id);if(this._xcmp(p,e.v.last)<=0)throw new Error('ERR The ID specified in XADD is equal or smaller than the target stream top item');
        e.v.last=p;e.v.entries.push({id,f:a.slice(2)});return B(id);}
      case 'XLEN':{need(1);const e=this._typed(k,'stream');return I(e?e.v.entries.length:0);}
      case 'XGROUP':{if(a[0].toUpperCase()!=='CREATE')throw new Error('ERR unknown subcommand');const key=a[1],g=a[2];let e=this._get(key);
        if(!e){if(!a.slice(4).some(x=>x.toUpperCase()==='MKSTREAM'))throw new Error('ERR The XGROUP subcommand requires the key to exist. Note that for CREATE you may want to use the MKSTREAM option to create an empty stream automatically.');
          e=this._typed(key,'stream',()=>({entries:[],groups:new Map(),last:[0,0]}));}
        else if(e.t!=='stream')throw new Error('WRONGTYPE Operation against a key holding the wrong kind of value');
        if(e.v.groups.has(g))throw new Error('BUSYGROUP Consumer Group name already exists');
        e.v.groups.set(g,{last:a[3]==='$'?e.v.last:this._xid(a[3]),pel:new Map()});return OK;}
      case 'XREADGROUP':{const u=a.map(x=>x.toUpperCase());if(u[0]!=='GROUP')throw new Error('ERR syntax error');const g=a[1],c=a[2];
        const ci=u.indexOf('COUNT');const cnt=ci>=0?this._int(a[ci+1]):Infinity;const si=u.indexOf('STREAMS');const key=a[si+1],from=a[si+2];
        const e=this._typed(key,'stream');const G=e&&e.v.groups.get(g);
        if(!G)throw new Error(`NOGROUP No such key '${key}' or consumer group '${g}' in XREADGROUP with GROUP option`);
        let out;
        if(from==='>'){out=e.v.entries.filter(x=>this._xcmp(this._xid(x.id),G.last)>0).slice(0,cnt);
          out.forEach(x=>{G.pel.set(x.id,c);G.last=this._xid(x.id);});if(!out.length)return{t:'nil'};}
        else{const p=this._xid(from);out=e.v.entries.filter(x=>G.pel.get(x.id)===c&&this._xcmp(this._xid(x.id),p)>0).slice(0,cnt);}
        return A([A([B(key),A(out.map(x=>A([B(x.id),A(x.f.map(B))])))])]);}
      case 'XACK':{need(3);const e=this._typed(k,'stream');const G=e&&e.v.groups.get(a[1]);if(!G)return I(0);let n=0;a.slice(2).forEach(id=>{if(G.pel.delete(id))n++;});return I(n);}
      case 'XPENDING':{need(2);const e=this._typed(k,'stream');const G=e&&e.v.groups.get(a[1]);
        if(!G)throw new Error(`NOGROUP No such key '${k}' or consumer group '${a[1]}'`);const ids=[...G.pel.keys()].sort((x,y)=>this._xcmp(this._xid(x),this._xid(y)));
        if(!ids.length)return A([I(0),{t:'nil'},{t:'nil'},{t:'nil'}]);const per={};G.pel.forEach(c=>per[c]=(per[c]||0)+1);
        return A([I(ids.length),B(ids[0]),B(ids[ids.length-1]),A(Object.keys(per).sort().map(c=>A([B(c),B(per[c])])))]);}
      default:throw new Error(`ERR unknown command '${cmd.toLowerCase()}', with args beginning with: ${a.slice(0,3).map(x=>`'${x}' `).join('')}`);
    }
  }
  _range(n,s,t){s=this._int(s);t=this._int(t);if(s<0)s=Math.max(0,n+s);if(t<0)t=n+t;if(t>=n)t=n-1;return[s,t];}
  _zs(e){return [...e.v].sort((x,y)=>x[1]-y[1]||(x[0]<y[0]?-1:x[0]>y[0]?1:0));}
  _xid(s){const [a,b]=String(s).split('-');return[+a,b===undefined?0:+b];}
  _xcmp(p,q){return p[0]-q[0]||p[1]-q[1];}
  _hav(la1,lo1,la2,lo2){const R=6372797.560856,r=Math.PI/180;const dl=(la2-la1)*r,dn=(lo2-lo1)*r;
    const h=Math.sin(dl/2)**2+Math.cos(la1*r)*Math.cos(la2*r)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h));}
  view(){return [...this.db.keys()].sort().map(k=>{const e=this._get(k);if(!e)return null;const ttl=e.exp==null?null:Math.ceil(e.exp-this.now);
    let v;switch(e.t){case 'string':v=e.v;break;case 'hash':v=Object.fromEntries(e.v);break;case 'list':v=e.v.slice();break;case 'set':v=[...e.v].sort();break;
      case 'zset':v=this._zs(e).map(([m,s])=>[m,this._fs(s)]);break;case 'geo':v=[...e.v].map(([m,[lo,la]])=>[m,lo.toFixed(3)+' '+la.toFixed(3)]);break;
      case 'hll':v=e.v.size;break;case 'stream':{const pel=new Map();e.v.groups.forEach(G=>G.pel.forEach((c,id)=>pel.set(id,c)));
        v=e.v.entries.map(x=>({id:x.id,f:x.f.join('='),st:pel.has(x.id)?'pend':''}));break;}}
    return{k,t:e.t,v,ttl};}).filter(Boolean);}
}
function rfmt(r){
  if(r==null)return '';
  if(r.t==='status')return r.v;if(r.t==='int')return '(integer) '+r.v;if(r.t==='nil')return '(nil)';if(r.t==='err')return '(error) '+r.v;
  if(r.t==='bulk')return '"'+r.v.replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"';
  if(!r.v.length)return '(empty array)';
  const w=String(r.v.length).length;
  return r.v.map((x,i)=>{const p=String(i+1).padStart(w)+') ';const lines=rfmt(x).split('\n');return p+lines[0]+lines.slice(1).map(l=>'\n'+' '.repeat(p.length)+l).join('');}).join('\n');
}
function rsplit(line){const out=[];const re=/"((?:[^"\\]|\\.)*)"|'([^']*)'|(\S+)/g;let m;while((m=re.exec(line)))out.push(m[1]!=null?m[1].replace(/\\(.)/g,'$1'):m[2]!=null?m[2]:m[3]);return out;}
window.miniRedis={MiniRedis,rfmt,rsplit};

