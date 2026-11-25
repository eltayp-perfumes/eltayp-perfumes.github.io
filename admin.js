(function(){
const C=window.ELTAYP,$=s=>document.querySelector(s);
const API=C.supabaseUrl,K=C.supabaseAnonKey;
const ST={new:"جديد",confirmed:"اتأكد",shipped:"خرج للشحن",delivered:"اتسلّم",cancelled:"اتلغى"};
let tok=sessionStorage.getItem("eltayp_adm")||"",filter="new",orders=[],seen=null;
const esc=t=>{const d=document.createElement("div");d.textContent=t==null?"":String(t);return d.innerHTML};
const msg=(t,c)=>{const m=$("#msg");m.textContent=t||"";m.className=c||""};
const H=()=>({apikey:K,Authorization:"Bearer "+tok,"Content-Type":"application/json"});
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
async function load(first){
  try{
    const r=await fetch(API+"/rest/v1/web_orders?select=*&order=created_at.desc&limit=200",{headers:H()});
    if(r.status===401||r.status===403){out();return msg("انتهت الجلسة، ادخل تاني.","err")}
    if(!r.ok)throw 0;
    orders=await r.json();
    const n=orders.filter(o=>o.status==="new").length;
    if(seen!==null&&n>seen){beep();try{if(window.Notification&&Notification.permission==="granted")new Notification("طلب جديد على ELTAYP")}catch(e){}}
    seen=n;document.title=(n?"("+n+") ":"")+"طلبات ELTAYP";
    $("#upd").textContent="آخر تحديث "+new Date().toLocaleTimeString("ar-EG");
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
$("#login").addEventListener("submit",login);
$("#logout").onclick=out;$("#refresh").onclick=()=>load();
if(window.Notification&&Notification.permission==="default")document.addEventListener("click",()=>Notification.requestPermission(),{once:true});
if(tok){view(true);load(true)}else view(false);
setInterval(()=>{if(tok&&!document.hidden)load()},30000);
})();
