(function(){
const C=window.ELTAYP,$=s=>document.querySelector(s);
const API=C.supabaseUrl,K=C.supabaseAnonKey;
const ST={new:"جديد",confirmed:"اتأكد",shipped:"خرج للشحن",delivered:"اتسلّم",cancelled:"اتلغى"};
let tok=sessionStorage.getItem("eltayp_adm")||"",filter="new",orders=[],seen=null,sec="orders",products=[],shipping=[],shipLoaded=false,prodLoaded=false;
const esc=t=>{const d=document.createElement("div");d.textContent=t==null?"":String(t);return d.innerHTML};
const msg=(t,c)=>{const m=$("#msg");m.textContent=t||"";m.className=c||""};
const H=()=>({apikey:K,Authorization:"Bearer "+tok,"Content-Type":"application/json"});
const stamp=()=>{$("#upd").textContent="آخر تحديث "+new Date().toLocaleTimeString("ar-EG")};
function view(on){$("#login").hidden=on;$("#panel").hidden=!on}
async function login(e){
  e.preventDefault();const f=e.target;msg("بندخّلك...");
  try{
    const r=await fetch(API+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:K,"Content-Type":"application/json"},body:JSON.stringify({email:f.email.value.trim(),password:f.password.value})});
    if(!r.ok)throw 0;
    tok=(await r.json()).access_token;f.password.value="";
    const role=await (await fetch(API+"/rest/v1/rpc/my_role",{method:"POST",headers:H(),body:"{}"})).json();
    if(role!=="owner"){tok="";return msg("الحساب ده مالوش صلاحية على الطلبات.","err")}
    sessionStorage.setItem("eltayp_adm",tok);msg("");view(true);load(true);
  }catch(x){msg("الإيميل أو كلمة السر مش مظبوطين.","err")}
}
function out(){tok="";sessionStorage.removeItem("eltayp_adm");view(false);msg("")}
function authFail(r){if(r.status===401||r.status===403){out();msg("انتهت الجلسة، ادخل تاني.","err");return true}return false}
function showSec(s){
  sec=s;
  document.querySelectorAll("#vtabs button").forEach(b=>b.classList.toggle("on",b.dataset.v===s));
  $("#sec-orders").hidden=s!=="orders";$("#sec-products").hidden=s!=="products";$("#sec-shipping").hidden=s!=="shipping";
  if(s==="products")loadProducts();
  if(s==="shipping")loadShipping();
  if(s==="orders")load();
}
function refresh(){showSec(sec)}

/* الطلبات */
async function load(first){
  try{
    const r=await fetch(API+"/rest/v1/web_orders?select=*&order=created_at.desc&limit=200",{headers:H()});
    if(authFail(r))return;
    if(!r.ok)throw 0;
    orders=await r.json();
    const n=orders.filter(o=>o.status==="new").length;
    if(seen!==null&&n>seen){beep();try{if(window.Notification&&Notification.permission==="granted")new Notification("طلب جديد على ELTAYP")}catch(e){}}
    seen=n;document.title=(n?"("+n+") ":"")+"إدارة ELTAYP";
    stamp();
    render();
  }catch(x){msg("مش قادر أحمّل الطلبات. جرّب تحدّث.","err")}
}
function beep(){try{const a=new (window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator();o.connect(a.destination);o.frequency.value=880;o.start();setTimeout(()=>o.stop(),250)}catch(e){}}
function render(){
  const cnt=s=>orders.filter(o=>o.status===s).length;
  $("#tabs").innerHTML=["new","confirmed","shipped","delivered","cancelled"].map(s=>`<button type="button" data-f="${s}" class="${filter===s?"on":""}">${ST[s]} (${cnt(s)})</button>`).join("");
  const L=orders.filter(o=>o.status===filter);
  $("#list").innerHTML=L.length?L.map(o=>`<div class="ord ${o.status==="new"?"new":""}">
    <div class="h"><span>${esc(o.customer_name)} · <a href="tel:${esc(o.phone)}" dir="ltr">${esc(o.phone)}</a></span><span>${esc(o.total)} ${esc("ج.م")}</span></div>
    <div class="m">${new Date(o.created_at).toLocaleString("ar-EG")} · طلب رقم ${esc(o.id)}</div>
    <div>${esc(o.city)} - ${esc(o.address)}</div>
    ${o.notes?`<div class="m">ملاحظات: ${esc(o.notes)}</div>`:""}
    <ul>${(o.items||[]).map(i=>`<li>${esc(i.name)} × ${esc(i.qty)}</li>`).join("")}</ul>
    <div class="acts">${Object.keys(ST).map(s=>`<button type="button" data-id="${esc(o.id)}" data-s="${s}" class="${o.status===s?"cur":""}">${ST[s]}</button>`).join("")}</div>
  </div>`).join(""):'<p class="note">مفيش طلبات هنا.</p>';
  document.querySelectorAll("#tabs button").forEach(b=>b.onclick=()=>{filter=b.dataset.f;render()});
  document.querySelectorAll(".acts button").forEach(b=>b.onclick=()=>setStatus(b.dataset.id,b.dataset.s));
}
async function setStatus(id,s){
  try{
    const r=await fetch(API+"/rest/v1/web_orders?id=eq."+encodeURIComponent(id),{method:"PATCH",headers:Object.assign(H(),{Prefer:"return=minimal"}),body:JSON.stringify({status:s})});
    if(!r.ok)throw 0;load();
  }catch(x){msg("الحالة ماتغيّرتش. جرّب تاني.","err")}
}

/* المنتجات */
async function loadProducts(){
  try{
    const r=await fetch(API+"/rest/v1/web_products?select=*&order=sort.asc,id.asc",{headers:H()});
    if(authFail(r))return;
    if(!r.ok)throw 0;
    products=await r.json();prodLoaded=true;stamp();renderProducts();
  }catch(x){msg("مش قادر أحمّل المنتجات. جرّب تحدّث.","err")}
}
function field(p,n,val,full,type){
  const v=p?p[n]:"";
  if(type==="ta")return `<label class="${full?"full":""}">${val}<textarea name="${n}" rows="2">${esc(v||"")}</textarea></label>`;
  if(n==="category"){const opts=["","رجالي","نسائي","للجنسين"];return `<label>${val}<select name="category">${opts.map(o=>`<option value="${esc(o)}" ${o===(v||"")?"selected":""}>${o||"—"}</option>`).join("")}</select></label>`}
  return `<label class="${full?"full":""}">${val}<input name="${n}" value="${esc(v==null?"":v)}" ${n==="price"||n==="sort"?'type="number" min="0" step="any"':""}></label>`;
}
function renderProducts(){
  $("#plist").innerHTML=products.map(p=>cardHtml(p,false)).join("");
  bindCards();
}
function cardHtml(p,isNew){
  return `<div class="pcard" data-id="${esc(p.id||"")}" data-new="${isNew?"1":""}">
    <div class="h"><span>${isNew?"منتج جديد":esc(p.name)} <span class="m" dir="ltr">${esc(p.id||"")}</span></span>${p&&p.in_stock===false?'<span class="off">مش ظاهر على الموقع</span>':""}</div>
    <div class="frm">
      ${field(p,"name","اسم العطر (عربي)",true)}
      ${field(p,"name_en","الاسم بالإنجليزي")}
      ${field(p,"category","القسم")}
      ${field(p,"price","السعر (ج.م)")}
      ${field(p,"size","الحجم")}
      ${field(p,"sort","ترتيب الظهور")}
      <label class="chk"><input type="checkbox" name="in_stock" ${!p||p.in_stock!==false?"checked":""}> متاح على الموقع</label>
      ${field(p,"copy","النفحات / الوصف",true,"ta")}
      ${field(p,"note","ملاحظة تظهر تحت الوصف (اختياري)",true,"ta")}
      <label class="full">صورة المنتج
        <span class="imgrow">
          ${p&&p.image_url?`<img src="${esc(p.image_url)}" alt="">`:""}
          <input type="file" name="img" accept="image/*">
          ${p&&p.image_url?`<button type="button" class="rmimg link">إزالة الصورة</button>`:""}
        </span>
      </label>
    </div>
    <div class="pacts">
      <button type="button" class="save">${isNew?"إضافة المنتج":"حفظ التعديلات"}</button>
      ${isNew?'<button type="button" class="cancel link">إلغاء</button>':'<button type="button" class="del">حذف المنتج</button>'}
    </div>
  </div>`;
}
function bindCards(){
  document.querySelectorAll("#plist .pcard").forEach(c=>{
    const rm=c.querySelector(".rmimg");if(rm)rm.onclick=()=>{c.dataset.rmimg="1";const im=c.querySelector(".imgrow img");if(im)im.remove();rm.remove()};
    const sv=c.querySelector(".save");if(sv)sv.onclick=()=>c.dataset.new?addProduct(c):saveProduct(c);
    const dl=c.querySelector(".del");if(dl)dl.onclick=()=>delProduct(c.dataset.id);
    const cn=c.querySelector(".cancel");if(cn)cn.onclick=()=>c.remove();
  });
}
async function uploadImage(pid,file){
  if(file.size>5*1024*1024)throw "big";
  let ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
  if(!ext||ext.length>5)ext="jpg";
  const path=pid+"-"+Date.now()+"."+ext;
  const r=await fetch(API+"/storage/v1/object/product-images/"+path,{method:"POST",headers:{apikey:K,Authorization:"Bearer "+tok,"Content-Type":file.type||"image/jpeg","x-upsert":"true"},body:file});
  if(!r.ok)throw 0;
  return API+"/storage/v1/object/public/product-images/"+path;
}
function readCard(c){
  const g=n=>{const e=c.querySelector(`[name=${n}]`);return e?e.value:""};
  const b={name:g("name").trim(),name_en:g("name_en").trim()||null,category:g("category")||null,size:g("size").trim()||null,
    price:Number(g("price"))||0,sort:Math.max(0,parseInt(g("sort"),10)||100),copy:g("copy").trim()||null,note:g("note").trim()||null,
    in_stock:c.querySelector("[name=in_stock]").checked};
  return b;
}
async function saveProduct(c){
  const id=c.dataset.id,b=readCard(c);
  if(!b.name)return msg("اكتب اسم العطر.","err");
  if(!(b.price>0))return msg("اكتب سعر صحيح أكبر من صفر.","err");
  msg("بحفظ...");
  try{
    const f=c.querySelector("[name=img]").files[0];
    if(f)b.image_url=await uploadImage(id,f);
    else if(c.dataset.rmimg==="1")b.image_url=null;
    const r=await fetch(API+"/rest/v1/web_products?id=eq."+encodeURIComponent(id),{method:"PATCH",headers:Object.assign(H(),{Prefer:"return=minimal"}),body:JSON.stringify(b)});
    if(authFail(r))return;
    if(!r.ok)throw 0;
    msg("اتحفظ ✅ التعديل ظاهر على الموقع دلوقتي.");loadProducts();
  }catch(x){msg(x==="big"?"الصورة أكبر من ٥ ميجا. صغّرها وجرّب تاني.":"الحفظ ماتمش. جرّب تاني.","err")}
}
async function addProduct(c){
  const b=readCard(c);
  if(!b.name)return msg("اكتب اسم العطر الأول.","err");
  if(!(b.price>0))return msg("اكتب سعر صحيح أكبر من صفر.","err");
  b.id="p-"+Date.now().toString(36);
  msg("بضيف المنتج...");
  try{
    const f=c.querySelector("[name=img]").files[0];
    if(f)b.image_url=await uploadImage(b.id,f);
    const r=await fetch(API+"/rest/v1/web_products",{method:"POST",headers:Object.assign(H(),{Prefer:"return=minimal"}),body:JSON.stringify(b)});
    if(authFail(r))return;
    if(!r.ok)throw 0;
    msg("المنتج اتضاف ✅ ظاهر على الموقع دلوقتي.");loadProducts();
  }catch(x){msg(x==="big"?"الصورة أكبر من ٥ ميجا. صغّرها وجرّب تاني.":"الإضافة ماتمش. جرّب تاني.","err")}
}
async function delProduct(id){
  if(!confirm("متأكد إنك عايز تمسح المنتج ده نهائيًا من الموقع؟"))return;
  msg("بمسح...");
  try{
    const r=await fetch(API+"/rest/v1/web_products?id=eq."+encodeURIComponent(id),{method:"DELETE",headers:Object.assign(H(),{Prefer:"return=minimal"})});
    if(authFail(r))return;
    if(!r.ok)throw 0;
    msg("المنتج اتمسح ✅");loadProducts();
  }catch(x){msg("المسح ماتمش. جرّب تاني.","err")}
}

/* الشحن */
async function loadShipping(){
  try{
    const r=await fetch(API+"/rest/v1/web_shipping?select=*&order=governorate.asc",{headers:H()});
    if(authFail(r))return;
    if(!r.ok)throw 0;
    shipping=await r.json();shipLoaded=true;stamp();renderShipping();
  }catch(x){msg("مش قادر أحمّل أسعار الشحن. جرّب تحدّث.","err")}
}
function renderShipping(){
  $("#shiplist").innerHTML=shipping.map(s=>`<div class="shiprow"><span>${esc(s.governorate)}</span><input type="number" min="0" max="1000" step="any" data-g="${esc(s.governorate)}" value="${s.fee==null?"":esc(s.fee)}" placeholder="مش متاح"><span>ج.م</span></div>`).join("");
}
async function saveShipping(){
  msg("بحفظ أسعار الشحن...");
  try{
    for(const inp of document.querySelectorAll("#shiplist input")){
      const g=inp.dataset.g,v=inp.value.trim();
      const old=shipping.find(s=>s.governorate===g);
      const nv=v===""?null:Number(v);
      if(nv!==null&&!(nv>=0&&nv<=1000))return msg("سعر الشحن لـ"+g+" مش منطقي.","err");
      if((old&&old.fee)===nv||(old&&old.fee===null&&nv===null))continue;
      const r=await fetch(API+"/rest/v1/web_shipping?governorate=eq."+encodeURIComponent(g),{method:"PATCH",headers:Object.assign(H(),{Prefer:"return=minimal"}),body:JSON.stringify({fee:nv})});
      if(authFail(r))return;
      if(!r.ok)throw 0;
    }
    msg("أسعار الشحن اتحفظت ✅");loadShipping();
  }catch(x){msg("الحفظ ماتمش. جرّب تاني.","err")}
}

$("#login").addEventListener("submit",login);
$("#logout").onclick=out;$("#refresh").onclick=refresh;
$("#saveship").onclick=saveShipping;
$("#addp").onclick=()=>{const d=document.createElement("div");d.innerHTML=cardHtml(null,true);const c=d.firstElementChild;$("#plist").prepend(c);bindCards();c.scrollIntoView({behavior:"smooth"})};
document.querySelectorAll("#vtabs button").forEach(b=>b.onclick=()=>showSec(b.dataset.v));
if(window.Notification&&Notification.permission==="default")document.addEventListener("click",()=>Notification.requestPermission(),{once:true});
if(tok){view(true);load(true)}else view(false);
setInterval(()=>{if(tok&&sec==="orders"&&!document.hidden)load()},30000);
})();
