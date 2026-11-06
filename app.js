'use strict';
const $=s=>document.querySelector(s),K='llaveros_db',
SH=['Pendiente de preparación','Preparado','Enviado por Shalom','En tránsito','Llegó a destino','Disponible para recojo','Recogido por cliente','Incidencia o devolución'],
ST=['Pendiente','Preparado','Enviado','En tránsito','Llegó','Para recojo','Recogido','Incidencia'],
E={r:'🔴',o:'🟠',y:'🟡',b:'🔵',g:'🟢'},
M={recojo:'Hola {nombre}, te escribo para recordarte que tu pedido de llaveros ya se encuentra disponible en la agencia Shalom. Por favor, acércate a recogerlo y completar el pago pendiente ({saldo}). Muchas gracias por tu compra.',
confirmar:'Hola {nombre}, confirmo tu pedido de {cant} llaveros por {total}. ¡Gracias por tu compra!',
adelanto:'Hola {nombre}, para preparar tu pedido de {cant} llaveros necesito el adelanto del 50 % ({mitad}) por Yape. Cuando lo envíes, avísame por aquí. ¡Gracias!',
enviado:'Hola {nombre}, tu pedido de llaveros ya fue enviado por Shalom. Te aviso apenas llegue a la agencia.',
llego:'Hola {nombre}, tu pedido de llaveros ya llegó a la agencia Shalom. Puedes recogerlo y pagar el saldo de {saldo}.',
saldo:'Hola {nombre}, te recuerdo el saldo pendiente de {saldo} por tu pedido de llaveros. Gracias.',
urgente:'Hola {nombre}, tu pedido de llaveros lleva varios días en la agencia Shalom y corre el riesgo de ser devuelto. Por favor, confírmame cuándo lo recogerás (saldo {saldo}).',
recogido:'Hola {nombre}, confirmo que recogiste tu pedido de llaveros. ¡Gracias por tu compra!'},
MN={recojo:'Recordar recojo',confirmar:'Confirmar pedido',adelanto:'Solicitar adelanto 50 %',enviado:'Pedido enviado',llego:'Llegó a Shalom',saldo:'Recordar saldo',urgente:'Aviso urgente (varios días)',recogido:'Pedido recogido'};
let db=load(),v='home',Q='',F=-1,P='d',tmp=null,pre={},dip=null,hid=0,AM={};
function load(){let d={};try{d=JSON.parse(localStorage[K]||'{}')}catch(e){}
return{orders:d.orders||[],notes:d.notes||[],cfg:{pin:'',unit:5,days:10,hours:[24,48,72],notif:false,...d.cfg}}}
const save=()=>{try{localStorage[K]=JSON.stringify(db)}catch(e){alert('Sin espacio. Haz una copia de seguridad y reduce las fotos.')}},
S=n=>'S/ '+(+n||0).toFixed(2),uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,5),
td=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)},now=()=>new Date().toISOString(),
esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),
paid=o=>o.pays.reduce((a,p)=>a+p.amt,0),bal=o=>Math.max(0,o.total-paid(o)),get=i=>db.orders.find(o=>o.id==i),
ps=o=>{const p=paid(o);return p<=0?'Sin adelanto':p>=o.total?'Pago completo':(o.pays.length==1&&p>=o.total/2-.01)?'Adelanto recibido':'Pago parcial'},
hs=s=>{let x=5381;for(const c of s)x=(x*33)^c.charCodeAt(0);return String(x>>>0)},
tot=A=>({sold:A.reduce((a,o)=>a+o.total,0),col:A.reduce((a,o)=>a+paid(o),0),due:A.reduce((a,o)=>a+bal(o),0)}),
ck=o=>(o.wa||o.name).replace(/\s/g,'').toLowerCase(),
match=o=>!Q||[o.name,o.wa,o.date,o.promised,o.dest,o.prod].join(' ').toLowerCase().includes(Q.toLowerCase()),
toast=m=>{const t=$('#toast');t.textContent=m;t.className='show';setTimeout(()=>t.className='',2200)},
dl=(n,t,m)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:m}));a.download=n;a.click()};
function msg(o,k){return M[k].replace(/\{(\w+)\}/g,(_,x)=>({nombre:o.name,cant:o.qty,total:S(o.total),saldo:S(bal(o)),mitad:S(o.total/2)}[x]))}
function wa(i,k){const o=get(i);let n=(o.wa||'').replace(/\D/g,'');if(!n)return toast('Este cliente no tiene WhatsApp');if(n.length==9)n='51'+n;(o.contacts=o.contacts||[]).push(now());save();open('https://wa.me/'+n+'?text='+encodeURIComponent(msg(o,k)),'_blank')}
function alerts(){const R=[],c=db.cfg;for(const o of db.orders){if(o.cancel)continue;const b=bal(o),B=[];let m=null,pr=0;
const arr=[SH[4],SH[5]].includes(o.ship),h=o.arrived?(Date.now()-new Date(o.arrived))/36e5:0,d=h/24,L=c.hours.filter(x=>h>=x).pop();
if(arr){if(d>=c.days){B.push(['r','¡'+Math.floor(d)+' días sin recoger! Urgente: contacta y decide qué hacer']);pr=3;m='urgente'}else if(L){B.push(['r','Cliente no recogió su pedido (+'+L+' h)']);pr=2;m='recojo'}else{B.push(['y','Pedido disponible en Shalom']);pr=1;m='llego'}}
if(b>0&&SH.slice(2,7).includes(o.ship)){B.push(['o','Debe el 50 % restante: '+S(b)]);pr=Math.max(pr,1);m=m||'saldo'}
const dd=(Date.now()-new Date(o.updated))/864e5;
if(o.ship!=SH[6]&&o.ship!=SH[7]&&dd>=c.days){B.push(['b','Sin actualizar hace '+Math.floor(dd)+' días: contactar']);m=m||'enviado'}
if(o.promised&&o.promised<td()&&[SH[0],SH[1]].includes(o.ship)){B.push(['b','Envío prometido vencido ('+o.promised+')']);pr=Math.max(pr,1)}
if(!paid(o)&&o.ship==SH[0]){B.push(['b','Sin adelanto: pídelo antes de preparar']);m=m||'adelanto'}
if(o.ship==SH[6]&&!b)B.push(['g','Pedido recogido y pagado completamente']);
if(B.length)R.push({o,B,m,pr})}
return R.sort((a,b)=>b.pr-a.pr)}
const contact=()=>alerts().filter(a=>a.B.some(x=>x[0]!='g'));
function acard(a){const o=a.o,d=o.arrived?Math.floor((Date.now()-new Date(o.arrived))/864e5):0;
return`<div class="card l${a.pr}"><div class="row sb" style="margin:0"><b>${esc(o.name)}</b><span class="mut">${esc(o.wa)}</span></div>${a.B.map(x=>`<div class="bd ${x[0]}">${E[x[0]]} ${x[1]}</div>`).join('')}<div class="mut">Pendiente ${S(bal(o))} · ${ST[SH.indexOf(o.ship)]} · ${o.arrived?'Llegó el '+o.arrived.slice(0,10)+' ('+d+' d)':'Aún sin llegada'}</div><div class="row"><button class="btn wa" data-a="wa" data-id="${o.id}" data-k="${a.m||'saldo'}">WhatsApp</button><button class="btn ghost" data-a="show" data-id="${o.id}">Ver pedido</button></div></div>`}
const ocard=o=>`<div class="card tap l${AM[o.id]?.pr||0}" data-a="show" data-id="${o.id}"><div class="row sb" style="margin:0"><b>${esc(o.name)}</b><span>${S(o.total)}</span></div><div class="mut">${o.qty} llaveros${o.prod?' · '+esc(o.prod):''} · ${o.date}</div><div class="row"><span class="pill">${o.cancel?'Cancelado':o.ship}</span><span class="pill ${bal(o)?'o':'g'}">${ps(o)}${bal(o)?' · debe '+S(bal(o)):''}</span></div></div>`;
function form(o){o=o||{};const c=db.cfg,i=(n,l,x='',a='')=>`<label>${l}<input name="${n}" value="${esc(o[n]??x)}" ${a}></label>`;
return`<form class="of" data-id="${o.id||''}"><label>Nombre completo<input name="name" required list="cl" autocomplete="off" data-c="nm" value="${esc(o.name)}"></label><datalist id="cl">${[...new Set(db.orders.map(x=>x.name))].map(n=>`<option value="${esc(n)}">`).join('')}</datalist>${i('wa','WhatsApp (9 dígitos)','','type=tel inputmode=tel')}${i('dest','Agencia Shalom de destino')}${i('prod','Modelo o diseño de los llaveros')}<div class="g2">${i('qty','Cantidad','','type=number min=1 required inputmode=numeric')}${i('unit','Precio unitario (S/)',c.unit,'type=number step=0.01')}</div><div class="g2">${i('date','Fecha del pedido',td(),'type=date')}${i('promised','Envío prometido','','type=date')}</div>${o.id?'':`<label>Adelanto recibido (S/)<input name="adv" type="number" step="0.01" inputmode="decimal"></label><label class="ck"><input type="checkbox" name="okadv"> Confirmo que ya recibí este adelanto por Yape</label>`}<label>Comprobante de Yape (foto)<input type="file" accept="image/*" data-c="photo"></label><label>Observaciones<textarea name="obs" rows="2">${esc(o.obs)}</textarea></label><div class="tot"></div><button class="btn">Guardar pedido</button></form>`}
function saveOrder(f){const d=Object.fromEntries(new FormData(f)),id=f.dataset.id,o=id?get(id):{id:uid(),pays:[],ship:SH[0],contacts:[]};
Object.assign(o,{name:d.name.trim(),wa:d.wa,dest:d.dest,prod:d.prod,qty:+d.qty,unit:+d.unit,date:d.date||td(),promised:d.promised,obs:d.obs,updated:now()});
o.total=o.qty*o.unit;if(tmp)o.photo=tmp;tmp=null;
if(!id){if(+d.adv>0&&d.okadv)o.pays.push({d:o.date,amt:+d.adv,ref:'Yape (adelanto)'});const n=db.notes.find(x=>x.id==pre.note);if(n)n.done=1;pre={};db.orders.unshift(o)}
save();if($('#dlg').open)$('#dlg').close();v=id?v:'ship';F=-1;render();det(o.id);toast('Pedido guardado')}
function setShip(o,s){if(s==SH[6]&&!confirm('¿Confirmas que el cliente ya recogió el pedido?'))return 0;o.ship=s;if(s==SH[2]&&!o.sent)o.sent=td();if((s==SH[4]||s==SH[5])&&!o.arrived)o.arrived=now();if(s==SH[6])o.picked=td();o.updated=now();save();return 1}
function det(id){const o=get(id),B=bal(o),i=SH.indexOf(o.ship),nx=i<6?SH[i+1]:null;
$('#dlg').innerHTML=`<div class="dh"><h2>${esc(o.name)}</h2><button class="ib" data-a="close">✕</button></div><p class="mut">${o.wa?'WhatsApp '+esc(o.wa):'Sin WhatsApp'}<br>${esc(o.dest)}</p><div class="steps">${SH.slice(0,7).map((s,j)=>`<i class="${j<i?'d':j==i?'c':''}"></i>`).join('')}</div><p><b>${o.qty}</b> llaveros${o.prod?' ('+esc(o.prod)+')':''} × ${S(o.unit)} = <b>${S(o.total)}</b><br>Pagado ${S(paid(o))} · Saldo <b>${S(B)}</b> · ${ps(o)}${o.cancel?' · CANCELADO':''}<br>Pedido ${o.date}${o.promised?' · Envío prometido '+o.promised:''}${o.sent?' · Despachado '+o.sent:''}</p>${o.obs?`<p class="note">${esc(o.obs)}</p>`:''}${o.photo?`<img class="ph" alt="Comprobante" src="${o.photo}">`:''}
<h3>Envío Shalom</h3>${nx&&!o.cancel?`<button class="btn" data-a="next" data-id="${id}">Avanzar a: ${nx}</button>`:''}<select data-c="ship" data-id="${id}">${SH.map(s=>`<option${s==o.ship?' selected':''}>${s}</option>`).join('')}</select>${o.arrived?`<label>Llegó a Shalom el<input type="date" data-c="arr" data-id="${id}" value="${o.arrived.slice(0,10)}"></label>`:''}
<h3>Pagos recibidos</h3>${o.pays.map(p=>`<div class="row sb"><span>${p.d} · ${esc(p.ref)}</span><b>${S(p.amt)}</b></div>`).join('')||'<p class="mut">Aún no hay pagos confirmados.</p>'}<div class="g3"><input id="pa" type="number" step="0.01" inputmode="decimal" placeholder="Monto"><input id="pd" type="date" value="${td()}"><input id="pr" placeholder="Referencia"></div><button class="btn" data-a="pay" data-id="${id}">Confirmar pago recibido</button>
<h3>WhatsApp</h3><select id="mk">${Object.keys(M).map(k=>`<option value="${k}">${MN[k]}</option>`).join('')}</select><button class="btn wa" data-a="wa2" data-id="${id}">Abrir WhatsApp</button><div class="row" style="margin-top:14px"><button class="btn ghost" data-a="edit" data-id="${id}">Editar</button><button class="btn ghost" data-a="dup" data-id="${id}">Repetir pedido</button><button class="btn ghost" data-a="cancel" data-id="${id}">${o.cancel?'Reactivar':'Cancelar'}</button></div>`;if(!$('#dlg').open)$('#dlg').showModal()}
const LV={
clients:()=>{const G={};db.orders.filter(match).forEach(o=>(G[ck(o)]=G[ck(o)]||[]).push(o));return Object.keys(G).map(k=>{const L=G[k].filter(o=>!o.cancel),o=G[k][0],t=tot(L);return`<div class="card tap" data-a="cli" data-id="${esc(k)}"><b>${esc(o.name)}</b> <span class="mut">${esc(o.wa)}</span><div class="mut">${G[k].length} pedido(s) · comprado ${S(t.sold)} · debe <b>${S(t.due)}</b></div></div>`}).join('')||'<p class="mut">Sin resultados.</p>'},
ship:()=>db.orders.filter(o=>match(o)&&(F<0||(F==8?o.cancel:o.ship==SH[F]&&!o.cancel))).map(ocard).join('')||'<p class="mut">Sin pedidos en este estado.</p>',
pay:()=>{const L=db.orders.filter(o=>!o.cancel&&bal(o)>0&&match(o)).sort((a,b)=>bal(b)-bal(a));return`<div class="card"><b>Por cobrar: ${S(L.reduce((a,o)=>a+bal(o),0))}</b> · ${L.length} cliente(s)</div>`+(L.map(o=>ocard(o)+`<button class="btn wa" style="margin:-4px 0 12px" data-a="wa" data-id="${o.id}" data-k="saldo">Recordar saldo por WhatsApp</button>`).join('')||'<p class="mut">Nadie debe dinero. 🟢</p>')}};
const V={
home:()=>{const A=db.orders.filter(o=>!o.cancel),n=a=>A.filter(o=>a.includes(o.ship)).length,D=A.filter(o=>bal(o)>0),t=tot(A),C=contact(),pc=t.sold?Math.round(t.col*100/t.sold):0,
st=[['Total de ventas',S(t.sold)],['Pedidos registrados',A.length],['Pendientes de envío',n([SH[0],SH[1]])],['Enviados por Shalom',n([SH[2],SH[3]])],['Pendientes de recojo',n([SH[4],SH[5]])],['Clientes que deben dinero',D.length],['Pago incompleto',D.filter(o=>paid(o)>0).length],['Dinero cobrado',S(t.col)]];
return`<div class="hero"><span>Dinero pendiente de cobrar</span><b>${S(t.due)}</b><div class="bar"><u style="width:${pc}%"></u></div><span>Cobrado ${pc} % de lo vendido</span></div><div class="row"><button class="btn" data-a="go" data-id="new">➕ Nuevo pedido</button><button class="btn ghost" data-a="go" data-id="alerts">🔔 Contactar (${C.length})</button></div><div class="grid" style="margin-top:10px">${st.map(s=>`<div class="stat"><span>${s[0]}</span><b>${s[1]}</b></div>`).join('')}</div><h2>CLIENTES QUE DEBO CONTACTAR</h2>${C.slice(0,4).map(acard).join('')||'<p class="mut">Nada pendiente por ahora. 🟢</p>'}`},
new:()=>`<div class="card">${form(pre)}</div>`,
alerts:()=>{const C=alerts(),a=C.filter(x=>x.B.some(y=>y[0]!='g')),g=C.filter(x=>!a.includes(x));return`<h2>CLIENTES QUE DEBO CONTACTAR (${a.length})</h2>${a.map(acard).join('')||'<p class="mut">Sin alertas. 🟢</p>'}${g.length?'<h2>Completados</h2>'+g.map(acard).join(''):''}`},
notes:()=>`<div class="card"><textarea id="nt" rows="3" placeholder="Cliente interesado, dirección, promesa de pago…"></textarea><button class="btn" data-a="nadd">Guardar nota</button></div>${db.notes.map(n=>`<div class="card${n.done?' dn':''}"><div class="mut">${n.d}${n.done?' · convertida en pedido':''}</div><div style="white-space:pre-wrap">${esc(n.t)}</div><div class="row">${n.done?'':`<button class="btn ghost" data-a="nconv" data-id="${n.id}">Convertir en pedido</button>`}<button class="btn ghost" data-a="ndel" data-id="${n.id}">Borrar</button></div></div>`).join('')}`,
sales:()=>{const A=db.orders.filter(o=>!o.cancel),t=tot(A),R={},g=k=>R[k]=R[k]||{s:0,c:0},
key=d=>{if(P=='m')return d.slice(0,7);if(P=='w'){const x=new Date(d+'T12:00');x.setDate(x.getDate()-(x.getDay()+6)%7);return x.toISOString().slice(0,10)}return d};
A.forEach(o=>{g(key(o.date)).s+=o.total;o.pays.forEach(p=>g(key(p.d)).c+=p.amt)});
return`<div class="grid">${[['Total vendido',S(t.sold)],['Cobrado por Yape',S(t.col)],['Pendiente de cobrar',S(t.due)],['Pedidos',A.length]].map(s=>`<div class="stat"><span>${s[0]}</span><b>${s[1]}</b></div>`).join('')}</div><h2>Por periodo</h2><select data-c="per"><option value="d"${P=='d'?' selected':''}>Por día</option><option value="w"${P=='w'?' selected':''}>Por semana</option><option value="m"${P=='m'?' selected':''}>Por mes</option></select><div class="card" style="margin-top:10px"><table><tr><th>${P=='w'?'Semana del':'Periodo'}</th><th>Vendido</th><th>Cobrado</th></tr>${Object.keys(R).sort().reverse().map(k=>`<tr><td>${k}</td><td>${S(R[k].s)}</td><td>${S(R[k].c)}</td></tr>`).join('')}</table></div><p class="mut">Vendido = pedidos registrados. Cobrado = pagos que tú confirmaste.</p>`},
more:()=>`<div class="big">${[['pay','💸','Pagos pendientes'],['notes','📝','Bloc de notas'],['sales','📈','Ventas'],['cfg','⚙️','Configuración']].map(b=>`<button data-a="go" data-id="${b[0]}"><span>${b[1]}</span>${b[2]}</button>`).join('')}</div>`,
cfg:()=>{const c=db.cfg,i=(k,l,t='number')=>`<label>${l}<input data-c="cfg" data-k="${k}" type="${t}" step="0.01" value="${esc(c[k])}"></label>`;
return`<div class="card"><h3>Precio</h3>${i('unit','Precio unitario por defecto (S/)')}</div><div class="card"><h3>Recordatorios</h3>${i('hours','Horas sin recoger para avisar (separadas por coma)','text')}${i('days','Días para alerta urgente y pedidos sin actualizar')}<button class="btn" data-a="notif">${c.notif?'Notificaciones activas ✔ (probar)':'Activar notificaciones'}</button></div><div class="card"><h3>PIN de acceso</h3><input id="np" type="password" inputmode="numeric" maxlength="8" placeholder="${c.pin?'Nuevo PIN (vacío = quitar)':'Crea un PIN de 4 a 8 dígitos'}"><button class="btn" data-a="pin">Guardar PIN</button></div><div class="card"><h3>Datos</h3><button class="btn" data-a="bk">Copia de seguridad (JSON)</button><button class="btn ghost" data-a="csv">Exportar a Excel (CSV)</button><label class="btn ghost">Importar copia de seguridad<input type="file" accept=".json" data-c="imp" hidden></label><button class="btn ghost" data-a="inst" ${dip?'':'hidden'}>Instalar app</button></div>`}};
const N=[['home','🏠','Inicio'],['new','➕','Nuevo'],['clients','👥','Clientes'],['ship','📦','Envíos'],['alerts','🔔','Alertas'],['more','☰','Más']],
T={home:'Inicio',new:'Nuevo pedido',clients:'Mis clientes',ship:'Envíos Shalom',pay:'Pagos pendientes',alerts:'Alertas',notes:'Bloc de notas',sales:'Ventas',cfg:'Configuración',more:'Más'};
function list(){$('#list').innerHTML=LV[v]()}
function render(){$('#ttl').textContent=T[v];const C=alerts();AM=Object.fromEntries(C.map(a=>[a.o.id,a]));const c=C.filter(a=>a.B.some(x=>x[0]!='g')).length;
$('#app').innerHTML=LV[v]?`<input id="q" type="search" placeholder="Buscar nombre, WhatsApp o fecha" value="${esc(Q)}">${v=='ship'?`<div class="chips">${['Todos',...ST,'Cancelado'].map((s,j)=>`<button data-a="flt" data-id="${j-1}" class="${F==j-1?'on':''}">${s}${j&&j<9?' '+db.orders.filter(o=>!o.cancel&&o.ship==SH[j-1]).length:''}</button>`).join('')}</div>`:''}<div id="list">${LV[v]()}</div>`:V[v]();
$('#nav').innerHTML=N.map(n=>`<button data-a="go" data-id="${n[0]}" class="${v==n[0]||(n[0]=='more'&&['pay','notes','sales','cfg'].includes(v))?'on':''}"><span>${n[1]}</span>${n[2]}${n[0]=='alerts'&&c?`<i>${c}</i>`:''}</button>`).join('')}
function comp(f){const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const k=Math.min(1,720/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);tmp=c.toDataURL('image/jpeg',.6);toast('Foto lista')};i.src=r.result};r.readAsDataURL(f)}
async function check(f){const c=db.cfg;if(!c.notif||!('Notification' in window)||Notification.permission!='granted')return;const L=contact().filter(a=>a.B.some(x=>'ro'.includes(x[0])));
if(!L.length){if(f)toast('Activadas. No hay clientes por contactar ahora.');return}
const k='nt'+td()+L.length;if(!f&&localStorage.nk==k)return;localStorage.nk=k;
const r=await navigator.serviceWorker.ready;r.showNotification(L.length+' cliente(s) por contactar',{body:L.slice(0,3).map(a=>a.o.name+': '+a.B[0][1]).join('\n'),icon:'icon-192.png',tag:'llaveros'})}
function lock(){$('#lock').hidden=false;$('#pin').value='';setTimeout(()=>$('#pin').focus(),60)}
function unlock(){$('#lock').hidden=true;$('#pin').value=''}
const A={
go:i=>{v=i;Q='';F=-1;tmp=null;if(i!='new')pre={};render();scrollTo(0,0)},flt:i=>{F=+i;render()},
show:i=>det(i),close:()=>$('#dlg').close(),wa:(i,t)=>wa(i,t.dataset.k),wa2:i=>wa(i,$('#mk').value),
next:i=>{const o=get(i);if(setShip(o,SH[SH.indexOf(o.ship)+1])){render();det(i)}},
pay:i=>{const o=get(i),a=+$('#pa').value;if(!(a>0))return toast('Escribe el monto');if(a>bal(o)+.001&&!confirm('El monto supera el saldo. ¿Continuar?'))return;if(!confirm('¿Confirmas que recibiste '+S(a)+'?'))return;o.pays.push({d:$('#pd').value||td(),amt:a,ref:$('#pr').value||'Yape'});o.updated=now();save();det(i);render()},
edit:i=>{$('#dlg').innerHTML='<div class="dh"><h2>Editar pedido</h2><button class="ib" data-a="close">✕</button></div>'+form(get(i))},
dup:i=>{const o=get(i);pre={name:o.name,wa:o.wa,dest:o.dest,prod:o.prod,qty:o.qty,unit:o.unit};$('#dlg').close();v='new';render()},
cancel:i=>{const o=get(i);if(confirm(o.cancel?'¿Reactivar este pedido?':'¿Cancelar este pedido? Se conserva en el historial.')){o.cancel=!o.cancel;o.updated=now();save();det(i);render()}},
cli:k=>{const L=db.orders.filter(o=>ck(o)==k),Z=L.filter(o=>!o.cancel),o=L[0],t=tot(Z);$('#dlg').innerHTML=`<div class="dh"><h2>${esc(o.name)}</h2><button class="ib" data-a="close">✕</button></div><p class="mut">${esc(o.wa)}</p><div class="grid"><div class="stat"><span>Compras</span><b>${Z.length}</b></div><div class="stat"><span>Pagos efectuados</span><b>${S(t.col)}</b></div><div class="stat"><span>Recogidos</span><b>${Z.filter(x=>x.ship==SH[6]).length}</b></div><div class="stat"><span>Pendientes</span><b>${Z.filter(x=>x.ship!=SH[6]).length}</b></div><div class="stat"><span>Cancelados</span><b>${L.length-Z.length}</b></div><div class="stat"><span>Debe</span><b>${S(t.due)}</b></div></div>${L.filter(x=>x.obs).map(x=>`<p class="note">${x.date}: ${esc(x.obs)}</p>`).join('')}<h3>Historial</h3>${L.map(ocard).join('')}`;if(!$('#dlg').open)$('#dlg').showModal()},
nadd:()=>{const t=$('#nt').value.trim();if(t){db.notes.unshift({id:uid(),t,d:td()});save();render()}},
ndel:i=>{if(confirm('¿Borrar esta nota?')){db.notes=db.notes.filter(n=>n.id!=i);save();render()}},
nconv:i=>{pre={obs:db.notes.find(n=>n.id==i).t,note:i};v='new';render()},
notif:()=>{if(!('Notification' in window))return toast('Este navegador no admite notificaciones');Notification.requestPermission().then(p=>{db.cfg.notif=p=='granted';save();render();check(1)})},
pin:()=>{const p=$('#np').value;if(p&&p.length<4)return toast('Mínimo 4 dígitos');db.cfg.pin=p?hs(p):'';save();toast(p?'PIN guardado':'PIN quitado');render()},
unlock:()=>{if(hs($('#pin').value)==db.cfg.pin)unlock();else toast('PIN incorrecto')},
bk:()=>dl('llaveros-respaldo-'+td()+'.json',JSON.stringify(db),'application/json'),
csv:()=>{const q=x=>'"'+String(x??'').replace(/"/g,'""')+'"',H=['Fecha','Cliente','WhatsApp','Agencia destino','Modelo','Cantidad','Precio unit','Total','Pagado','Saldo','Estado pago','Estado envío','Observaciones'];dl('pedidos-'+td()+'.csv','\ufeff'+[H,...db.orders.map(o=>[o.date,o.name,o.wa,o.dest,o.prod,o.qty,o.unit,o.total,paid(o),bal(o),ps(o),o.cancel?'Cancelado':o.ship,o.obs])].map(r=>r.map(q).join(',')).join('\n'),'text/csv')},
inst:()=>dip&&dip.prompt()};
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(t&&A[t.dataset.a])A[t.dataset.a](t.dataset.id,t)});
document.addEventListener('submit',e=>{e.preventDefault();saveOrder(e.target)});
document.addEventListener('input',e=>{const t=e.target;if(t.id=='pin'){if(db.cfg.pin&&hs(t.value)==db.cfg.pin)unlock();return}if(t.id=='q'){Q=t.value;return list()}const f=t.closest('form.of');if(f){const d=Object.fromEntries(new FormData(f)),x=d.qty*d.unit||0;f.querySelector('.tot').textContent='Total '+S(x)+' · 50 % = '+S(x/2)+(+d.adv&&d.okadv?' · Saldo '+S(x-d.adv):'')}});
document.addEventListener('change',e=>{const t=e.target,c=t.dataset.c,o=t.dataset.id&&get(t.dataset.id);if(!c)return;
if(c=='ship'){if(setShip(o,t.value)){render();det(o.id)}else det(o.id)}
else if(c=='arr'&&t.value){o.arrived=new Date(t.value+'T12:00').toISOString();o.updated=now();save();render();det(o.id)}
else if(c=='nm'){const p=db.orders.find(x=>x.name.toLowerCase()==t.value.trim().toLowerCase()),f=t.closest('form');if(p&&!f.dataset.id){if(!f.wa.value)f.wa.value=p.wa||'';if(!f.dest.value)f.dest.value=p.dest||''}}
else if(c=='photo'&&t.files[0])comp(t.files[0]);
else if(c=='per'){P=t.value;render()}
else if(c=='cfg'){const k=t.dataset.k;db.cfg[k]=k=='hours'?t.value.split(',').map(Number).filter(x=>x>0).sort((a,b)=>a-b):+t.value;if(k=='hours'&&!db.cfg.hours.length)db.cfg.hours=[24,48,72];if(k=='days'&&!(db.cfg.days>0))db.cfg.days=10;save()}
else if(c=='imp'&&t.files[0])t.files[0].text().then(x=>{try{const d=JSON.parse(x);if(!Array.isArray(d.orders))throw 0;if(confirm('Se reemplazarán los datos actuales por la copia. ¿Continuar?')){localStorage[K]=JSON.stringify(d);db=load();render();toast('Datos importados')}}catch(_){alert('Archivo no válido')}})});
addEventListener('beforeinstallprompt',e=>{e.preventDefault();dip=e;if(v=='cfg')render()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){hid=Date.now();return}if(db.cfg.pin&&Date.now()-hid>6e4)lock();check();if(!$('#dlg').open&&!['new','notes'].includes(v))render()});
setInterval(()=>check(),9e5);
if(db.cfg.pin)lock();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
render();check();
