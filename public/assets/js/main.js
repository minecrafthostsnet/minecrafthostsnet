
function fallbackLogo(img){
  const fallback = img.getAttribute("data-fallback");
  if (fallback && img.src !== fallback) img.src = fallback;
}
const rows = Array.from(document.querySelectorAll("[data-host-row]"));
const q = document.querySelector("#hostSearch");
const f = document.querySelector("#typeFilter");
const s = document.querySelector("#sortHosts");
function updateRows(){
  if(!rows.length) return;
  const query=(q?.value||"").toLowerCase();
  const type=f?.value||"all";
  rows.forEach(row=>{
    const matchesText=row.textContent.toLowerCase().includes(query);
    const matchesType=type==="all"||row.dataset.category===type;
    row.style.display=matchesText&&matchesType?"":"none";
  });
  const visible=rows.filter(r=>r.style.display!=="none");
  visible.sort((a,b)=>{
    if((s?.value||"rank")==="price") return Number(a.dataset.price)-Number(b.dataset.price);
    if(s?.value==="score") return Number(b.dataset.score)-Number(a.dataset.score);
    return Number(a.dataset.rank)-Number(b.dataset.rank);
  });
  visible.forEach(r=>r.parentElement.appendChild(r));
}
[q,f,s].forEach(el=>el&&el.addEventListener("input",updateRows));
[q,f,s].forEach(el=>el&&el.addEventListener("change",updateRows));
updateRows();
