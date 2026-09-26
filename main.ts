import "./style.css";

type Product={id:string,name:string,price:number,stock:number};
type Sale={id:string,productId:string,qty:number,total:number,date:string};
type Movement={id:string,productId:string,qty:number,from:string,to:string,date:string};
type Entry={id:string,productId:string,qty:number,date:string};
type Removal={id:string,productId:string,qty:number,reason:string,date:string};

const key="libreta_almacen_v1";
const empty={products:[] as Product[],sales:[] as Sale[],movements:[] as Movement[],entries:[] as Entry[],removals:[] as Removal[],money:0};
let db=load();

function load(){try{return {...empty,...JSON.parse(localStorage.getItem(key)||"{}")}}catch{return {...empty}}}
function save(){localStorage.setItem(key,JSON.stringify(db)); render();}
function id(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function money(n:number){return n.toLocaleString("es-CU",{minimumFractionDigits:2,maximumFractionDigits:2})+" CUP"}
function product(id:string){return db.products.find(p=>p.id===id)}
function date(){return new Date().toLocaleDateString("es-ES")}

document.querySelector<HTMLDivElement>("#app")!.innerHTML=`
<header><div><h1>📦 Libreta Almacén</h1><p>Inventario Varadero ↔ Matanzas</p></div></header>
<nav id="nav">
<button data-page="resumen">Resumen</button><button data-page="productos">Productos</button>
<button data-page="entradas">Entradas</button><button data-page="movimientos">Movimientos</button>
<button data-page="ventas">Ventas</button><button data-page="retiros">Retirar</button>
<button data-page="inventario">Inventario</button>
</nav><main id="main"></main>`;

document.querySelectorAll<HTMLButtonElement>("#nav button").forEach(b=>b.onclick=()=>page(b.dataset.page!));
page("resumen");

function page(p:string){document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===p)); 
 const m=document.querySelector<HTMLDivElement>("#main")!;
 if(p==="productos") productos(m); else if(p==="entradas") entradas(m); else if(p==="movimientos") movimientos(m);
 else if(p==="ventas") ventas(m); else if(p==="retiros") retiros(m); else if(p==="inventario") inventario(m); else resumen(m);
}

function selectProducts(){return db.products.map(p=>`<option value="${p.id}">${esc(p.name)} — ${money(p.price)}</option>`).join("")}
function esc(s:string){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!))}

function productos(m:HTMLDivElement){
m.innerHTML=`<section class="card"><h2>Productos</h2><form id="pf" class="grid">
<input id="pn" placeholder="Nombre del producto" required><input id="pp" type="number" step="0.01" placeholder="Precio" required>
<input id="ps" type="number" min="0" placeholder="Stock inicial" required><button>Agregar producto</button></form></section>
<section class="card"><h2>Productos registrados</h2>${db.products.length?`<div class="list">${db.products.map(p=>`<div class="row"><b>${esc(p.name)}</b><span>${money(p.price)} · Stock: ${p.stock}</span><button onclick="editProduct('${p.id}')">Editar</button><button class="danger" onclick="deleteProduct('${p.id}')">Eliminar</button></div>`).join("")}</div>`:"<p>No hay productos todavía.</p>"}</section>`;
m.querySelector<HTMLFormElement>("#pf")!.onsubmit=e=>{e.preventDefault();const n=(document.querySelector("#pn") as HTMLInputElement).value.trim(),pr=+(document.querySelector("#pp") as HTMLInputElement).value,s=+(document.querySelector("#ps") as HTMLInputElement).value;db.products.push({id:id(),name:n,price:pr,stock:s});save()};
}
(window as any).editProduct=(pid:string)=>{const p=product(pid);if(!p)return;const n=prompt("Nombre",p.name),pr=prompt("Precio",String(p.price));if(n&&pr){p.name=n;p.price=+pr;save()}};
(window as any).deleteProduct=(pid:string)=>{if(confirm("¿Eliminar este producto?")){db.products=db.products.filter(p=>p.id!==pid);save()}};

function entradas(m:HTMLDivElement){
m.innerHTML=`<section class="card"><h2>Entradas de mercancía</h2><form id="ef" class="grid"><select id="ep" required>${selectProducts()}</select><input id="eq" type="number" min="1" placeholder="Cantidad" required><button>Registrar entrada</button></form></section>
<section class="card"><h2>Historial</h2>${db.entries.map(x=>`<div class="row">${date()} · ${esc(product(x.productId)?.name||"")} · +${x.qty}</div>`).join("")||"<p>Sin entradas.</p>"}</section>`;
m.querySelector("form")!.addEventListener("submit",e=>{e.preventDefault();const pid=(document.querySelector("#ep") as HTMLSelectElement).value,q=+(document.querySelector("#eq") as HTMLInputElement).value;const p=product(pid);if(p)p.stock+=q;db.entries.push({id:id(),productId:pid,qty:q,date:date()});save()});
}

function movimientos(m:HTMLDivElement){
m.innerHTML=`<section class="card"><h2>Movimientos</h2><form id="mf" class="grid"><select id="mp">${selectProducts()}</select><input id="mq" type="number" min="1" placeholder="Cantidad" required><select id="from"><option>Varadero</option><option>Matanzas</option></select><select id="to"><option>Matanzas</option><option>Varadero</option></select><button>Registrar movimiento</button></form></section>
<section class="card"><h2>Movimientos registrados</h2>${db.movements.map(x=>`<div class="row">${x.date} · ${esc(product(x.productId)?.name||"")} · ${x.qty} · ${x.from} → ${x.to}</div>`).join("")||"<p>Sin movimientos.</p>"}</section>`;
m.querySelector("form")!.addEventListener("submit",e=>{e.preventDefault();const pid=(document.querySelector("#mp") as HTMLSelectElement).value,q=+(document.querySelector("#mq") as HTMLInputElement).value,from=(document.querySelector("#from") as HTMLSelectElement).value,to=(document.querySelector("#to") as HTMLSelectElement).value,p=product(pid);if(from===to||!p||q<=0)return;if(from==="Varadero"&&p.stock<q){alert("No hay suficiente stock.");return} if(from==="Varadero")p.stock-=q;else p.stock+=q;db.movements.push({id:id(),productId:pid,qty:q,from,to,date:date()});save()});
}

function ventas(m:HTMLDivElement){
m.innerHTML=`<section class="card"><h2>Ventas</h2><form id="vf" class="grid"><select id="vp">${selectProducts()}</select><input id="vq" type="number" min="1" placeholder="Cantidad vendida" required><button>Registrar venta</button></form></section>
<section class="card"><h2>Dinero recogido</h2><div class="big">${money(db.money)}</div><p>Total acumulado de ventas.</p></section>
<section class="card"><h2>Ventas</h2>${db.sales.map(x=>`<div class="row">${x.date} · ${esc(product(x.productId)?.name||"")} · ${x.qty} · ${money(x.total)}</div>`).join("")||"<p>Sin ventas.</p>"}</section>`;
m.querySelector("form")!.addEventListener("submit",e=>{e.preventDefault();const pid=(document.querySelector("#vp") as HTMLSelectElement).value,q=+(document.querySelector("#vq") as HTMLInputElement).value,p=product(pid);if(!p||p.stock<q){alert("Stock insuficiente.");return}const total=q*p.price;p.stock-=q;db.money+=total;db.sales.push({id:id(),productId:pid,qty:q,total,date:date()});save()});
}

function retiros(m:HTMLDivElement){
m.innerHTML=`<section class="card"><h2>Retirar producto</h2><form id="rf" class="grid"><select id="rp">${selectProducts()}</select><input id="rq" type="number" min="1" placeholder="Cantidad" required><input id="rr" placeholder="Motivo: daño, rotura, etc." required><button>Registrar retiro</button></form></section>
<section class="card"><h2>Retiros</h2>${db.removals.map(x=>`<div class="row">${x.date} · ${esc(product(x.productId)?.name||"")} · ${x.qty} · ${esc(x.reason)}</div>`).join("")||"<p>Sin retiros.</p>"}</section>`;
m.querySelector("form")!.addEventListener("submit",e=>{e.preventDefault();const pid=(document.querySelector("#rp") as HTMLSelectElement).value,q=+(document.querySelector("#rq") as HTMLInputElement).value,r=(document.querySelector("#rr") as HTMLInputElement).value,p=product(pid);if(!p||p.stock<q){alert("Stock insuficiente.");return}p.stock-=q;db.removals.push({id:id(),productId:pid,qty:q,reason:r,date:date()});save()});
}

function inventario(m:HTMLDivElement){
m.innerHTML=`<section class="card"><h2>Inventario actual</h2><p>El stock mostrado se actualiza automáticamente con entradas, ventas, retiros y movimientos.</p>${db.products.map(p=>`<div class="row"><b>${esc(p.name)}</b><span>Varadero: ${p.stock}</span><span>Mov. Matanzas: ${db.movements.filter(x=>x.productId===p.id&&x.to==="Matanzas").reduce((a,x)=>a+x.qty,0)}</span></div>`).join("")||"<p>No hay productos.</p>"}</section>`;
}

function resumen(m:HTMLDivElement){
const totalStock=db.products.reduce((a,p)=>a+p.stock,0),sales=db.sales.reduce((a,s)=>a+s.qty,0),moves=db.movements.reduce((a,x)=>a+x.qty,0),removed=db.removals.reduce((a,x)=>a+x.qty,0);
m.innerHTML=`<section class="hero"><h2>Resumen general</h2><p>Control local de tu almacén.</p></section><div class="cards">
<div class="stat"><b>${db.products.length}</b><span>Productos</span></div><div class="stat"><b>${totalStock}</b><span>Stock actual</span></div><div class="stat"><b>${sales}</b><span>Unidades vendidas</span></div><div class="stat"><b>${moves}</b><span>Movimientos</span></div><div class="stat"><b>${removed}</b><span>Retiradas</span></div><div class="stat"><b>${money(db.money)}</b><span>Dinero recogido</span></div></div>
<section class="card"><h2>Estado</h2><p>✓ Datos guardados automáticamente en este teléfono.</p><p>✓ Funciona sin internet después de instalarse.</p><p>✓ Productos, entradas, movimientos, ventas y retiros actualizan el inventario.</p></section>`;
}
