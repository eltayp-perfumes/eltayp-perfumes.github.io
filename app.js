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
  const live=list.length>0&&C.ordersOpen;
  const cat=!live&&list.length>0&&C.catalogMode;
  document.body.classList.toggle("pre",!live&&!cat);
  document.body.classList.toggle("cat",!!(cat||live));
  $("#catalog").hidden=!(live||cat);$("#steps").hidden=!live;$("#openCart").hidden=!live;
  const ig=(C.social&&C.social.instagram)||"#";
  if(cat||live){
    $("#products").innerHTML=list.map(p=>`<div class="card">${p.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}">`:'<div class="ph"><span>ELTAYP</span></div>'}<span class="tag">مستوحى</span><h4>${esc(p.name)}</h4>${p.name_en?`<div class="en">${esc(p.name_en)}</div>`:""}${p.copy?`<p class="cp"><b>نفحات العطر الأصلي:</b> ${esc(p.copy)}</p>`:""}${p.note?`<p class="nt">${esc(p.note)}</p>`:""}<div class="sz">${esc(p.size||"")}</div>${p.price?`<div class="price">${p.price} ${cur} <small>سعر مبدئي</small></div>`:""}${live?`<button type="button" class="add" data-id="${esc(p.id)}">أضف للسلة</button>`:`<a class="ask" href="${esc(ig)}" target="_blank" rel="noopener">اسأل عن التوفر</a>`}</div>`).join("");
    document.querySelectorAll("#products .add").forEach(b=>b.onclick=()=>{cart[b.dataset.id]=(cart[b.dataset.id]||0)+1;renderCart();openDrawer()});
    return;
  }
  $("#products").innerHTML=live?list.map(p=>`<div class="card">${p.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}">`:'<div class="ph"></div>'}<h4>${esc(p.name)}</h4>${p.size?`<div>${esc(p.size)}</div>`:""}<div class="price">${p.price} ${cur}</div><button type="button" data-id="${esc(p.id)}">أضف للسلة</button></div>`).join(""):"";
  document.querySelectorAll("#products button").forEach(b=>b.onclick=()=>{cart[b.dataset.id]=(cart[b.dataset.id]||0)+1;renderCart();openDrawer()});
}
const lines=()=>Object.keys(cart).map(id=>{const p=products.find(x=>x.id===id);return p?{id,name:p.name,price:p.price,qty:cart[id]}:null}).filter(Boolean);
const sub=()=>lines().reduce((s,l)=>s+l.price*l.qty,0);
const govFee=()=>{const g=($("#gov")||{}).value;const m=C.shipping||{};return g&&g in m?m[g]:undefined};
const ship=()=>{const f=govFee();return typeof f==="number"?f:0};
const total=()=>sub()+ship();
function renderShip(){
  const f=govFee(),g=$("#gov").value,r=$("#shipRow");
  r.textContent=!g?"اختار المحافظة عشان يظهر سعر الشحن.":typeof f==="number"?"الشحن التقديري لـ"+g+": "+f+" "+cur:"سعر الشحن لـ"+g+" هنأكده معاك.";
  $("#sub2").textContent=sub();$("#total2").textContent=typeof f==="number"?total():"بعد تحديد الشحن";$("#total2").nextElementSibling.hidden=typeof f!=="number";
}
function renderCart(){
  localStorage.setItem(KEY,JSON.stringify(cart));
  const L=lines();
  $("#count").textContent=L.reduce((s,l)=>s+l.qty,0);
  $("#cartEmpty").hidden=L.length>0;$("#toCheckout").disabled=!L.length||!C.ordersOpen;
  $("#cart").innerHTML=L.map(l=>`<li><span>${esc(l.name)}<br><small>${l.price} ${cur} · سعر مبدئي</small></span><span><button type="button" data-d="${esc(l.id)}">−</button> ${l.qty} <button type="button" data-u="${esc(l.id)}">+</button></span></li>`).join("");
  $("#total").textContent=sub();if($("#gov"))renderShip();
  document.querySelectorAll(".cur").forEach(e=>e.textContent=cur);
  document.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{const i=b.dataset.d;if(--cart[i]<=0)delete cart[i];renderCart()});
  document.querySelectorAll("[data-u]").forEach(b=>b.onclick=()=>{cart[b.dataset.u]++;renderCart()});
}
const msg=(t,c)=>{const m=$("#msg");m.textContent=t;m.className=c||""};
function show(step){["step1","form","done"].forEach(i=>$("#"+i).hidden=i!==step);$("#dtitle").textContent=step==="form"?"بياناتك":step==="done"?"تم":"السلة";msg("")}
function openDrawer(){$("#drawer").classList.add("open");$("#shade").hidden=false;$("#drawer").setAttribute("aria-hidden","false");if(!$("#done").hidden)show("step1")}
function closeDrawer(){$("#drawer").classList.remove("open");$("#shade").hidden=true;$("#drawer").setAttribute("aria-hidden","true")}
async function submit(e){
  e.preventDefault();const d=Object.fromEntries(new FormData(e.target));
  if(d.website)return;
  const phone=(d.phone||"").replace(/[\s-]/g,"").replace(/[٠-٩]/g,x=>"٠١٢٣٤٥٦٧٨٩".indexOf(x));
  if(!d.name.trim()||!d.city.trim())return msg("كمّل الاسم والمحافظة.","err");
  if(!(d.city in (C.shipping||{})))return msg("اختار المحافظة من القايمة.","err");
  if(typeof govFee()!=="number")return msg("سعر الشحن للمحافظة دي لسه مش محدد.","err");
  if(!/^(\+?20|0)?1[0125]\d{8}$/.test(phone))return msg("رقم التليفون مش مظبوط.","err");
  const L=lines();if(!L.length)return msg("السلة فاضية.","err");
  if(!C.supabaseUrl||!C.supabaseAnonKey)return msg("الطلب مش متفعّل لسه.","err");
  const b=$("#send");b.disabled=true;msg("بنبعت الطلب...");
  try{
    const r=await fetch(C.supabaseUrl+"/rest/v1/web_orders",{method:"POST",headers:{apikey:C.supabaseAnonKey,Authorization:"Bearer "+C.supabaseAnonKey,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({customer_name:d.name.trim(),phone,city:d.city.trim(),address:d.address.trim()||"يتأكد مع العميل",notes:"[طلب مبدئي] "+d.notes.trim(),items:L,total:total()})});
    if(!r.ok)throw new Error(r.status);
    cart={};renderCart();e.target.reset();show("done");
  }catch(x){msg("حصلت مشكلة وطلبك ماوصلش. جرّب تاني بعد شوية.","err")}
  b.disabled=false;
}
async function init(){
  renderSocial();
  $("#gov").innerHTML+=Object.keys(C.shipping||{}).map(g=>`<option>${esc(g)}</option>`).join("");$("#gov").onchange=renderShip;
  try{
    let loaded=false;
    if(C.supabaseUrl&&C.supabaseAnonKey){
      try{
        const r=await fetch(C.supabaseUrl+"/rest/v1/web_products?select=id,name,name_en,size,price,copy,category,note,image_url,sort&in_stock=eq.true&order=sort.asc,id.asc",{headers:{apikey:C.supabaseAnonKey,Authorization:"Bearer "+C.supabaseAnonKey}});
        if(r.ok){const rows=await r.json();products=rows.map(p=>({id:p.id,name:p.name,name_en:p.name_en||"",size:p.size||"",price:p.price,copy:p.copy||"",category:p.category||"",note:p.note||"",image:p.image_url||""}));loaded=true}
      }catch(e2){}
    }
    if(!loaded){const j=await (await fetch("products.json",{cache:"no-cache"})).json();products=j.products||[];cur=j.currency||cur}
  }catch(e){}
  cart=Object.fromEntries(Object.entries(cart).filter(([id])=>products.some(p=>p.id===id)));
  renderProducts();renderCart();
  $("#openCart").onclick=openDrawer;$("#closeCart").onclick=$("#shade").onclick=$("#closeDone").onclick=closeDrawer;
  $("#toCheckout").onclick=()=>show("form");$("#back").onclick=()=>show("step1");
  $("#form").addEventListener("submit",submit);
}
init();
})();
