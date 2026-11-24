(function(){
const C=window.ELTAYP,$=s=>document.querySelector(s);
let products=[],cur="ج.م",cart={};
const KEY="eltayp_cart";
try{cart=JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){}
const esc=t=>{const d=document.createElement("div");d.textContent=t;return d.innerHTML};
function renderSocial(){
  const n={instagram:"انستجرام",facebook:"فيسبوك",tiktok:"تيك توك"};
  $("#social").innerHTML=Object.keys(n).filter(k=>C.social[k]).map(k=>`<a href="${esc(C.social[k])}" target="_blank" rel="noopener">${n[k]}</a>`).join("");
}
function renderProducts(){
  const list=products.filter(p=>p.inStock!==false);
  $("#empty").hidden=list.length>0;
  $("#products").innerHTML=list.length?list.map(p=>`<div class="card">${p.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}">`:'<div class="ph"></div>'}<h4>${esc(p.name)}</h4>${p.size?`<div>${esc(p.size)}</div>`:""}<div class="price">${p.price} ${cur}</div><button type="button" data-id="${esc(p.id)}">أضف للسلة</button></div>`).join(""):
   [1,2,3,4].map(()=>`<div class="card"><div class="ph"></div><h4>قريبًا</h4><div class="price">&nbsp;</div></div>`).join("");
  document.querySelectorAll("#products button").forEach(b=>b.onclick=()=>{cart[b.dataset.id]=(cart[b.dataset.id]||0)+1;renderCart();openDrawer()});
}
const lines=()=>Object.keys(cart).map(id=>{const p=products.find(x=>x.id===id);return p?{id,name:p.name,price:p.price,qty:cart[id]}:null}).filter(Boolean);
const total=()=>lines().reduce((s,l)=>s+l.price*l.qty,0);
function renderCart(){
  localStorage.setItem(KEY,JSON.stringify(cart));
  const L=lines();
  $("#count").textContent=L.reduce((s,l)=>s+l.qty,0);
  $("#cartEmpty").hidden=L.length>0;$("#toCheckout").disabled=!L.length||!C.ordersOpen;
  $("#cart").innerHTML=L.map(l=>`<li><span>${esc(l.name)}<br><small>${l.price} ${cur}</small></span><span><button type="button" data-d="${esc(l.id)}">−</button> ${l.qty} <button type="button" data-u="${esc(l.id)}">+</button></span></li>`).join("");
  $("#total").textContent=$("#total2").textContent=total();
  document.querySelectorAll(".cur").forEach(e=>e.textContent=cur);
  document.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{const i=b.dataset.d;if(--cart[i]<=0)delete cart[i];renderCart()});
  document.querySelectorAll("[data-u]").forEach(b=>b.onclick=()=>{cart[b.dataset.u]++;renderCart()});
}
const msg=(t,c)=>{const m=$("#msg");m.textContent=t;m.className=c||""};
function show(step){["step1","form","done"].forEach(i=>$("#"+i).hidden=i!==step);$("#dtitle").textContent=step==="form"?"بياناتك":"السلة";msg("")}
function openDrawer(){$("#drawer").classList.add("open");$("#shade").hidden=false;$("#drawer").setAttribute("aria-hidden","false");if(!$("#done").hidden)show("step1")}
function closeDrawer(){$("#drawer").classList.remove("open");$("#shade").hidden=true;$("#drawer").setAttribute("aria-hidden","true")}
async function submit(e){
  e.preventDefault();const d=Object.fromEntries(new FormData(e.target));
  if(d.website)return;
  const phone=(d.phone||"").replace(/[\s-]/g,"").replace(/[٠-٩]/g,x=>"٠١٢٣٤٥٦٧٨٩".indexOf(x));
  if(!d.name.trim()||!d.city.trim()||!d.address.trim())return msg("كمّل الاسم والمحافظة والعنوان.","err");
  if(!/^(\+?20|0)?1[0125]\d{8}$/.test(phone))return msg("رقم التليفون مش مظبوط.","err");
  const L=lines();if(!L.length)return msg("السلة فاضية.","err");
  if(!C.supabaseUrl||!C.supabaseAnonKey)return msg("الطلب مش متفعّل لسه.","err");
  const b=$("#send");b.disabled=true;msg("بنبعت الطلب...");
  try{
    const r=await fetch(C.supabaseUrl+"/rest/v1/web_orders",{method:"POST",headers:{apikey:C.supabaseAnonKey,Authorization:"Bearer "+C.supabaseAnonKey,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({customer_name:d.name.trim(),phone,city:d.city.trim(),address:d.address.trim(),notes:d.notes.trim(),items:L,total:total()})});
    if(!r.ok)throw new Error(r.status);
    cart={};renderCart();e.target.reset();show("done");
  }catch(x){msg("حصلت مشكلة وطلبك ماوصلش. جرّب تاني بعد شوية.","err")}
  b.disabled=false;
}
async function init(){
  renderSocial();$("#payNote").textContent=C.paymentNote;
  try{const j=await (await fetch("products.json",{cache:"no-cache"})).json();products=j.products||[];cur=j.currency||cur}catch(e){}
  cart=Object.fromEntries(Object.entries(cart).filter(([id])=>products.some(p=>p.id===id)));
  renderProducts();renderCart();
  $("#openCart").onclick=openDrawer;$("#closeCart").onclick=$("#shade").onclick=$("#closeDone").onclick=closeDrawer;
  $("#toCheckout").onclick=()=>show("form");$("#back").onclick=()=>show("step1");
  $("#form").addEventListener("submit",submit);
}
init();
})();
