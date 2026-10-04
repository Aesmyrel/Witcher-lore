/* Compagnon du Sorceleur : logique de l'application.
   Navigation par ancre (#ciri, #bestiaire, #defi-ab12…) pour que chaque page se partage par un simple lien. */
const C=window.CODEX,E=C.entrees,M=C.bestiaire,ID={},MID={};
E.forEach(e=>ID[e.id]=e);M.forEach(m=>MID[m.id]=m);
const BOOKS=E.filter(e=>e.t==="livre").sort((a,b)=>a.ordre-b.ordre);
const SIGNES=["Aard","Igni","Yrden","Quen","Axii"];
/* Adresses publiques du compagnon, utilisées pour les liens de partage. */
const LIEN={artifact:"https://claude.ai/artifact/XHmn6MRvrESmEH8ux3peXH",pages:"https://couefficguillaume-collab.github.io/Witcher-lore/"};
const TYPES={perso:"Personnage",lieu:"Lieu",faction:"Peuple ou faction",concept:"Notion",livre:"Livre"};
const SRC={L:"Livres",J:"Jeu",LJ:"Livres et jeu"};
const svg=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const ICO={
 partie:svg('<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'),
 codex:svg('<path d="M3 5.5c3-1 6-1 9 1 3-2 6-2 9-1v13c-3-1-6-1-9 1-3-2-6-2-9-1z"/><path d="M12 6.5v13"/>'),
 bestiaire:svg('<path d="M6 4c3 4 4 9 3 16"/><path d="M11 3c3 5 4 11 2 18"/><path d="M16 4c3 4 4 9 2 15"/>'),
 livres:svg('<path d="M6 3h12v18l-6-4-6 4z"/>'),
 quiz:svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7v.5"/><path d="M12 17h.01"/>'),
 demander:svg('<path d="M4 5h16v11H9l-5 4z"/>'),
 share:svg('<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>')
};
const TABS=[["partie","Partie"],["codex","Codex"],["bestiaire","Bestiaire"],["livres","Livres"],["quiz","Quiz"],["demander","Demander"]];
const TABK=TABS.map(t=>t[0]);
const SEGS={frise:1,ecrans:1};

let SM=null,ctl=null,qrLib=null,trail=[],sheetUrl="",sheetMsg="";
const mem={};
const S={ch:0,hos:false,bw:false,sp:false,lus:{},vu:false,record:null,
 tab:"partie",id:null,lv:"ordre",defi:null,q:"",ty:"all",cl:"all",bq:"",an:0,rv:{},force:{},quiz:null,eclair:null,
 ask:{q:"",out:"",busy:false}};
const KEEP=["ch","hos","bw","sp","lus","vu","record"];
try{const o=JSON.parse(localStorage.getItem("cs")||"{}");KEEP.forEach(k=>{if(k in o)S[k]=o[k]})}catch(e){}
S.ch=Math.min(Math.max(+S.ch||0,0),C.chapitres.length-1);
if(!S.lus||typeof S.lus!=="object")S.lus={};
const save=()=>{try{const o={};KEEP.forEach(k=>o[k]=S[k]);localStorage.setItem("cs",JSON.stringify(o))}catch(e){}};

/* ---------- Outils ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const norm=s=>String(s).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
const inFrame=(()=>{try{return window.top!==window.self}catch(e){return true}})();
const now=()=>({ch:S.ch,hos:S.hos,bw:S.bw});
const SAFE={ch:0,hos:false,bw:false};
const visIn=(x,k)=>!x.porte||(x.porte.d?!!k[x.porte.d]:x.porte.c<=k.ch);
const vis=x=>visIn(x,now());
const jv=l=>l.d?S[l.d]:l.c<=S.ch;
const any=id=>ID[id]||MID[id];
const ents=ids=>ids.map(i=>ID[i]).filter(e=>e&&vis(e));
const row=e=>`<button class="ro ${e.src}" data-o="${e.id}"><b>${esc(e.nom)}</b><small>${esc(e.role)}</small></button>`;
const SG={Igni:"#d6532b",Aard:"#4d8fd1",Yrden:"#9a68d1",Quen:"#d9a62e",Axii:"#d1659f"};
const sg=s=>`<span class="sg"><i style="background:${SG[s]||"var(--mu)"}"></i>${s}</span>`;
const mrow=m=>`<button class="ro ${m.livres?"LJ":"J"}" data-o="${m.id}"><b>${esc(m.nom)}</b><small>${esc(m.cl)}${m.signes?" · "+m.signes.map(sg).join(""):""}</small></button>`;
const chip=id=>{const x=any(id);return x&&vis(x)?`<button class="ch" data-o="${id}">${esc(x.nom)}</button>`:""};
const chips=ids=>{const h=ids.map(chip).join("");return h?`<div class="chips">${h}</div>`:""};
const oil=c=>c==="Humains"?"Venin du pendu (épée d'acier)":"Huile "+C.classes[c]+(c==="Bêtes"?"":" (épée d'argent)");
const kv=(k,v)=>v?`<p class="kv"><b>${k}</b> ${v}</p>`:"";
const bl=(t,x,j)=>`<div class="bl${j?" j":""}"><h3>${t}</h3><p>${esc(x)}</p></div>`;
const pl=(n,s)=>n+" "+s+(n>1?"s":"");
const dayKey=()=>new Date().toISOString().slice(0,10);
let tt;
function toast(m){const t=$("#toast");t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>{t.hidden=true},2800)}

/* ---------- Quiz : questions tirées du codex, reproductibles à partir d'une graine ---------- */
function rng(seed){let a=2166136261;for(const c of String(seed))a=Math.imul(a^c.charCodeAt(0),16777619);
 return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const shuf=(a,r)=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const words=s=>norm(s).split(/[^a-z0-9]+/).filter(w=>w.length>3);
const overlap=(a,b)=>{const A=words(a),B=words(b),na=norm(a),nb=norm(b);return A.some(w=>B.includes(w))||na.includes(nb)||nb.includes(na)};
const LEX=C.lexique.filter(w=>w.mot.length<20);

function questions(k,r){
 const V=E.filter(e=>visIn(e,k)),out=[],pick=a=>a[Math.floor(r()*a.length)];
 const mk=(type,subject,q,good,bad,why,lien)=>{bad=[...new Set(bad)].filter(b=>b!==good);if(bad.length<3)return;
  const o=shuf([good,...shuf(bad,r).slice(0,3)],r);out.push({type,subject,q,opts:o,ok:o.indexOf(good),why,lien})};
 const P=V.filter(e=>e.t==="perso"),L=V.filter(e=>e.t==="lieu");
 for(const e of P){const al=(e.alias||[]).filter(a=>!overlap(a,e.nom));
  if(al.length)mk("alias",e.id,`Qui se cache derrière le nom « ${pick(al)} » ?`,e.nom,P.filter(x=>x!==e).map(x=>x.nom),`${e.nom} : ${e.role}.`,e.id)}
 for(const e of L)mk("lieu",e.id,`Quel lieu correspond à cette description : « ${e.role} » ?`,e.nom,L.filter(x=>x!==e).map(x=>x.nom),e.resume,e.id);
 for(const e of V)if(e.t!=="livre"&&e.dans&&e.dans.length)
  mk("dans",e.id,`Dans lequel de ces livres croise-t-on ${e.nom} ?`,ID[pick(e.dans)].nom,BOOKS.filter(b=>!e.dans.includes(b.id)).map(b=>b.nom),`${e.nom} apparaît dans : ${e.dans.map(i=>ID[i].nom).join(", ")}.`,e.id);
 for(const b of BOOKS)mk("annee",b.id,`En quelle année « ${b.nom} » est-il paru en Pologne ?`,String(b.annee),BOOKS.map(x=>String(x.annee)),`« ${b.vo} », ${b.annee}. ${b.resume}`,b.id);
 const MV=M.filter(m=>visIn(m,k));
 for(const m of MV)if(m.signes&&m.signes.length<=2)
  mk("signe",m.id,`Quel signe le bestiaire de TW3 conseille-t-il contre : ${m.nom} ?`,pick(m.signes),SIGNES.filter(s=>!m.signes.includes(s)),m.conseil,m.id);
 const CL=Object.keys(C.classes).filter(c=>c!=="Humains"&&c!=="Bêtes");
 for(const m of MV)if(CL.includes(m.cl))mk("classe",m.id,`À quelle famille du bestiaire appartient : ${m.nom} ?`,m.cl,CL,`${m.nom} : ${m.cl}. ${oil(m.cl)}.`,m.id);
 for(const w of LEX)mk("mot",w.mot,`Que signifie « ${w.mot} » en langue ancienne ?`,w.sens,LEX.map(x=>x.sens),w.note,w.lien);
 return out}

function makeQuiz(seed,k,n){
 const r=rng(seed),by={};
 for(const q of questions(k,r))(by[q.type]=by[q.type]||[]).push(q);
 const types=shuf(Object.keys(by),r);types.forEach(t=>by[t]=shuf(by[t],r));
 const out=[],used=new Set();
 for(let added=true;out.length<n&&added;){added=false;
  for(const t of types){if(out.length>=n)break;const i=by[t].findIndex(q=>!used.has(q.subject));
   if(i>=0){const q=by[t].splice(i,1)[0];used.add(q.subject);out.push(q);added=true}}}
 return shuf(out,r)}

const newSeed=()=>Math.random().toString(36).slice(2,7).replace(/[^a-z0-9]/g,"x").padEnd(5,"x");
const score=z=>z.ans.filter((a,i)=>a===z.qs[i].ok).length;
function rang(s,n){const p=s/n;
 if(p===1)return{t:"Digne de Vesemir",d:"Un sans-faute. Même les vieux loups de Kaer Morhen sont impressionnés."};
 if(p>=.8)return{t:"Maître sorceleur",d:"Vous connaissez le Continent comme votre poche."};
 if(p>=.5)return{t:"Sorceleur sur la route",d:"De bonnes bases, et encore quelques contrats à honorer."};
 if(p>=.2)return{t:"Apprenti de Kaer Morhen",d:"L'Épreuve des Herbes vous attend : quelques fiches du codex et ça ira mieux."};
 return{t:"Barde égaré",d:"Même Jaskier aurait fait mieux, et il en aurait tiré une ballade."}}

function opts(q,a,act){return `<div class="opts">`+q.opts.map((o,i)=>{let c="opt";if(a!=null){if(i===q.ok)c+=" good";else if(i===a)c+=" bad"}
 return `<button class="${c}" data-${act}="${i}"${a!=null?" disabled":""}>${esc(o)}</button>`}).join("")+`</div>`}
function feedback(q,a){const ok=a===q.ok;
 return `<p class="fb ${ok?"ok":"ko"}">${ok?"Bonne réponse.":"Raté. La bonne réponse : "+esc(q.opts[q.ok])+"."}</p><p>${esc(q.why)}</p>${q.lien?chips([q.lien]):""}`}

/* ---------- Vues ---------- */
function partie(){
 const c=C.chapitres[S.ch];let h="";
 if(!S.vu)h+=`<div class="card hello"><p class="eb">Bienvenue</p><p>Touchez l'étape où vous en êtes dans la barre ci-dessus : le compagnon masquera tout ce qui vient après dans le jeu. Les rebondissements des livres restent cachés derrière un bouton.</p><button class="pr" data-act="vu">C'est noté</button></div>`;
 h+=`<p class="eb">Étape ${S.ch+1} sur ${C.chapitres.length}</p><h2>${esc(c.nom)}</h2><p class="mu">${esc(c.lieux)}</p><p>${esc(c.intro)}</p>`;
 h+=`<div class="bl"><h3>À lire dans les livres</h3><p>${esc(c.lire)}</p>${chips(c.lireIds)}</div>`;
 const ls=ents(c.entrees);if(ls.length)h+=`<h3>Autour de vous</h3>`+ls.map(row).join("");
 const ms=(c.monstres||[]).map(i=>MID[i]).filter(m=>m&&vis(m));if(ms.length)h+=`<h3>Monstres du coin</h3>`+ms.map(mrow).join("");
 for(const k of["hos","bw"])if(S[k]){const d=C.dlc[k];
  h+=`<h3>${d.nom}</h3><p>${esc(d.intro)}</p><div class="bl"><p>${esc(d.lire)}</p></div>`+ents(d.entrees).map(row).join("")+(d.monstres||[]).map(i=>MID[i]).filter(Boolean).map(mrow).join("")}
 const nx=BOOKS.find(b=>!S.lus[b.id]);
 h+=nx?`<div class="card"><p class="eb">Votre prochaine lecture</p><h3 class="ct">${esc(nx.nom)}</h3><p class="mu sm">${esc(nx.role)}</p><p>${esc(nx.resume)}</p><div class="chips"><button class="ch" data-lu="${nx.id}">Je l'ai lu</button><button class="ch" data-o="${nx.id}">Voir la fiche</button><button class="ch" data-tab="livres">Ordre de lecture</button></div></div>`
  :`<div class="card"><p class="eb">Bibliothèque</p><p>Vous avez lu toute la saga. Il ne reste plus qu'à la relire.</p></div>`;
 h+=eclair();
 const an=C.anecdotes.filter(a=>(!a.c||a.c<=S.ch)&&(!any(a.lien)||vis(any(a.lien))));
 if(an.length){const a=an[S.an%an.length];h+=`<h3>Le saviez-vous</h3><p>${esc(a.t)}</p><div class="chips"><button class="ch" data-an>Une autre anecdote</button>${chip(a.lien)}</div>`}
 return h}

function eclair(){
 const key=dayKey()+"-"+S.ch+(S.hos?"h":"")+(S.bw?"b":"");
 if(!S.eclair||S.eclair.key!==key)S.eclair={key,q:makeQuiz("jour-"+key,now(),1)[0],a:null};
 const{q,a}=S.eclair;if(!q)return"";
 return `<div class="card"><p class="eb">Question du jour</p><p class="qq">${esc(q.q)}</p>${opts(q,a,"ej")}${a!=null?feedback(q,a)+`<p><button class="ch" data-tab="quiz">Faire le quiz complet</button></p>`:""}</div>`}

function codex(){
 const T=[["all","Tout"],["perso","Personnages"],["lieu","Lieux"],["faction","Peuples et factions"],["concept","Notions"],["livre","Livres"],["mot","Langue ancienne"]];
 return `<h2>Codex</h2><input id="q" type="search" placeholder="Chercher un nom, un surnom, un lieu, un mot elfe" aria-label="Chercher dans le codex" value="${esc(S.q)}" autocomplete="off"><div class="fl">${T.map(([k,n])=>`<button class="ch${S.ty===k?" on":""}" data-t="${k}">${n}</button>`).join("")}</div><p class="mu sm">Trait bleu : issu des livres. Trait ambre : issu du jeu. Les deux : présent dans les deux.</p><div id="lst">${lst()}</div>`}

function lst(){
 const q=norm(S.q.trim());
 if(S.ty==="mot")return lex(q)||`<p class="mu">Aucun mot ne correspond.</p>`;
 const hit=x=>!q||norm([x.nom,...(x.alias||[]),x.role||"",x.resume||""].join(" ")).includes(q);
 const l=E.filter(e=>vis(e)&&(S.ty==="all"||e.t===S.ty)&&hit(e));
 l.sort((a,b)=>S.ty==="livre"?a.ordre-b.ordre:a.nom.localeCompare(b.nom,"fr"));
 let h="";
 if(S.ty==="all"&&!q){const G=[["perso","Personnages"],["lieu","Lieux"],["faction","Peuples et factions"],["concept","Notions"],["livre","Livres"]];
  for(const[t,n]of G){const g=l.filter(e=>e.t===t);if(t==="livre")g.sort((a,b)=>a.ordre-b.ordre);if(g.length)h+=`<h3 class="gh">${n}<span>${g.length}</span></h3>`+g.map(row).join("")}}
 else h=l.map(row).join("");
 if(S.ty==="all"&&q){
  const ms=M.filter(m=>vis(m)&&norm([m.nom,m.en||"",m.cl].join(" ")).includes(q));if(ms.length)h+=`<h3 class="gh">Bestiaire</h3>`+ms.map(mrow).join("");
  const lx=lex(q);if(lx)h+=`<h3 class="gh">Langue ancienne</h3>`+lx}
 return h||`<p class="mu">Aucune fiche ne correspond. Essayez un autre nom ou un surnom.</p>`}

function lex(q){return C.lexique.filter(w=>!q||norm(w.mot+" "+w.sens+" "+w.note).includes(q)).map(w=>
 `<div class="lx"><p><b>${esc(w.mot)}</b> ${esc(w.sens)}</p><p class="mu sm">${esc(w.note)}</p>${w.lien?chips([w.lien]):""}</div>`).join("")}

function bestiaire(){
 const f=[["all","Tous"],...Object.keys(C.classes).map(c=>[c,c])].map(([k,n])=>`<button class="ch${S.cl===k?" on":""}" data-c="${k}">${n}</button>`).join("");
 return `<h2>Bestiaire</h2><p class="mu">Ce que le jeu recommande, et ce que les livres en disent. Touchez une créature pour voir sa fiche.</p><input id="bq" type="search" placeholder="Chercher une créature, en français ou en anglais" aria-label="Chercher une créature" value="${esc(S.bq)}" autocomplete="off"><div class="fl">${f}</div><div id="blst">${blst()}</div>`}
function blst(){const q=norm(S.bq.trim());
 const l=M.filter(m=>vis(m)&&(S.cl==="all"||m.cl===S.cl)&&(!q||norm([m.nom,m.en||"",m.cl].join(" ")).includes(q)));
 return l.map(mrow).join("")||`<p class="mu">Aucune créature ne correspond.</p>`}

const topbar=id=>`<div class="tb"><button class="ch" data-b>← Retour</button><button class="ch" data-share="${id}">${ICO.share}Partager</button></div>`;
const askLink=n=>SM?`<p><button class="ch" data-askabout="${esc(n)}">${ICO.demander}Poser une question sur ${esc(n)}</button></p>`:"";

function gate(x){const n=x.porte.d?C.dlc[x.porte.d].nom:C.chapitres[x.porte.c].nom;
 return `<div class="tb"><button class="ch" data-b>← Retour</button></div><div class="gate"><p class="eb">Attention, spoiler</p><h2>Fiche verrouillée</h2><p>Cette fiche concerne ${x.porte.d?"l'extension "+esc(n):"un passage du jeu situé à l'étape « "+esc(n)+" »"}, plus loin que là où vous en êtes. Un ami vous l'a peut-être envoyée.</p><div class="row"><button class="pr" data-force="${x.id}">Afficher quand même</button><button class="ch" data-b>Non merci</button></div></div>`}

function fiche(e){
 if(!vis(e)&&!S.force[e.id])return gate(e);
 const vj=(e.jeu||[]).filter(jv),sealed=(e.jeu||[]).length-vj.length;
 let h=topbar(e.id)+`<p class="eb">${TYPES[e.t]} · <span class="src ${e.src}">${SRC[e.src]}</span></p><h2>${esc(e.nom)}</h2>`;
 if(e.alias&&e.alias.length)h+=`<p class="mu">Aussi appelé : ${esc(e.alias.join(", "))}</p>`;
 h+=`<p class="mu">${esc(e.role)}</p><p>${esc(e.resume)}</p>`;
 if(e.t==="livre")h+=kv("Titre original",esc(e.vo)+", "+e.annee)+kv("Genre",esc(e.genre))+`<p><button class="ch${S.lus[e.id]?" on":""}" data-lu="${e.id}" aria-pressed="${!!S.lus[e.id]}">${S.lus[e.id]?"Lu ✓":"Marquer comme lu"}</button></p>`;
 if(e.nouvelles)h+=`<h3>Les nouvelles</h3>`+e.nouvelles.map(n=>`<p><b>${esc(n.t)}.</b> ${esc(n.d)}</p>`).join("");
 if(e.livres)h+=bl("Dans les livres",e.livres);
 if(e.rev)h+=(S.sp||S.rv[e.id])?bl("La suite dans les livres",e.rev):`<button class="sp" data-r="${e.id}">Révéler la suite dans les livres (spoilers)</button>`;
 if(vj.length||sealed)h+=`<div class="bl j"><h3>Dans le jeu</h3>${vj.map(l=>`<p>${esc(l.t)}</p>`).join("")}${sealed?`<p class="mu">${pl(sealed,"note")} masquée${sealed>1?"s":""} pour ne pas vous dévoiler la suite du jeu.</p>`:""}</div>`;
 const dn=chips(e.dans||[]),vo=chips(e.voir||[]);
 if(dn)h+=`<h3>À lire pour le retrouver</h3>${dn}`;
 if(vo)h+=`<h3>Voir aussi</h3>${vo}`;
 return h+askLink(e.nom)}

function monstre(m){
 if(!vis(m)&&!S.force[m.id])return gate(m);
 return topbar(m.id)+`<p class="eb">Bestiaire · ${esc(m.cl)}</p><h2>${esc(m.nom)}</h2>${m.en?`<p class="mu">En anglais : ${esc(m.en)}</p>`:""}`
  +kv("Huile",oil(m.cl))+kv("Signes",m.signes&&m.signes.map(sg).join(""))+kv("Bombes",m.bombes&&esc(m.bombes.join(", ")))
  +kv("Potions",m.potions&&esc(m.potions.join(", ")))+kv("Autres",m.autres&&esc(m.autres.join(", ")))+kv("Insensible à",m.immun&&sg(m.immun))
  +`<p>${esc(m.conseil)}</p>`+(m.origine?bl("Origines",m.origine):"")+(m.livres?bl("Dans les livres",m.livres):"")
  +(m.lien&&chip(m.lien)?`<h3>Voir aussi</h3>${chips([m.lien])}`:"")+askLink(m.nom)}

function livres(){
 const seg=[["ordre","Ordre de lecture"],["frise","Frise"],["ecrans","Jeux et écrans"]];
 return `<h2>Livres</h2><div class="seg" role="tablist" aria-label="Rubriques">${seg.map(([k,n])=>`<button role="tab" aria-selected="${S.lv===k}" class="${S.lv===k?"on":""}" data-lv="${k}">${n}</button>`).join("")}</div>`
  +({ordre,frise,ecrans}[S.lv]||ordre)()}

function ordre(){
 const nl=BOOKS.filter(b=>S.lus[b.id]).length;
 const quand=id=>C.chapitres.filter(c=>c.lireIds.includes(id)).map(c=>c.court).concat(Object.values(C.dlc).filter(d=>d.lireIds.includes(id)).map(d=>d.nom));
 return `<p>Commencez par les deux recueils de nouvelles, puis lisez les cinq romans de la saga dans l'ordre. « La Saison des orages » se glisse où vous voulez après les nouvelles, et « La Croisée des corbeaux », une préquelle, se lit à tout moment.</p>
<div class="prog"><div class="bar"><i style="width:${Math.round(nl/BOOKS.length*100)}%"></i></div><span>${nl} sur ${BOOKS.length} lus</span></div><ol class="books">`
 +BOOKS.map((b,i)=>{const q=quand(b.id),lu=!!S.lus[b.id];
  return `<li class="${lu?"lu":""}"><span class="num">${i+1}</span><div class="bi"><h3 class="ct"><button class="lnk" data-o="${b.id}">${esc(b.nom)}</button></h3><p class="mu sm">${esc(b.genre)} · ${esc(b.vo)}, ${b.annee}</p><p>${esc(b.resume)}</p>${q.length?`<p class="sm"><b>Idéal pendant :</b> ${esc(q.join(", "))}</p>`:""}<button class="ch${lu?" on":""}" data-lu="${b.id}" aria-pressed="${lu}">${lu?"Lu ✓":"Marquer comme lu"}</button></div></li>`}).join("")
 +`</ol><p class="mu sm">En français, la saga est publiée chez Bragelonne, et en poche chez Milady, dans la traduction de Laurence Dyèvre.</p>`}

function frise(){
 const l=C.chrono.map((x,i)=>({...x,k:"f"+i})).filter(x=>!x.c||x.c<=S.ch);
 return `<p class="mu">Des origines du monde jusqu'aux jeux. Point bleu : les livres. Point ambre : les jeux.</p><div class="tl">`+l.map(x=>`<div class="ti ${x.jeu?"J":"L"}"><b>${esc(x.quand)}</b><br>${esc(x.titre)}`
  +(x.rev&&!S.sp&&!S.rv[x.k]?`<button class="sp" data-r="${x.k}">Révéler le détail (spoilers des livres)</button>`:`<p>${esc(x.d)}</p>`)
  +(x.lien&&chip(x.lien)?`<button class="ch" data-o="${x.lien}">Voir la fiche</button>`:"")+`</div>`).join("")+`</div>`}

function ecrans(){
 return `<p class="mu">Les jeux et adaptations nés des livres de Sapkowski. Point bleu : films et séries. Point ambre : jeux.</p><div class="tl">`
  +C.ecrans.map(x=>`<div class="ti ${x.jeu?"J":"L"}"><b>${esc(x.quand)}</b><br>${esc(x.titre)}<p>${esc(x.d)}</p></div>`).join("")+`</div>`}

function quiz(){
 const z=S.quiz;
 if(S.defi&&(!z||z.seed!==S.defi))return `<h2>Défi entre amis</h2><div class="card"><p class="eb">Défi n° ${esc(S.defi.toUpperCase())}</p><p>Un ami vous lance un défi : dix questions sur l'univers du Sorceleur, les mêmes pour tout le monde. Aucune ne dévoile la suite du jeu ni la fin des livres.</p><button class="pr" data-act="relever">Relever le défi</button></div><p><button class="ch" data-act="quit">Faire plutôt un quiz adapté à ma partie</button></p>`;
 if(!z)return `<h2>Quiz</h2><p>Dix questions sur les livres, le bestiaire et la langue ancienne.</p><div class="cards"><div class="card"><h3 class="ct">Quiz de ma partie</h3><p>Les questions s'adaptent à votre avancée dans le jeu et aux extensions commencées.</p><button class="pr" data-act="solo">Commencer</button></div><div class="card"><h3 class="ct">Défi entre amis</h3><p>Lancez un défi puis envoyez le lien : vos amis répondent aux mêmes questions, sans aucun spoiler pour personne.</p><button class="pr" data-act="defi">Lancer un défi</button></div></div>${S.record?`<p class="mu">Votre record : ${S.record.s} sur ${S.record.n}.</p>`:""}`;
 const n=z.qs.length,s=score(z);
 if(z.i>=n){const r=rang(s,n);
  return `<h2>${z.defi?"Défi n° "+esc(z.seed.toUpperCase()):"Résultat du quiz"}</h2><div class="card res"><p class="big">${s}<span> / ${n}</span></p><p class="eb">${r.t}</p><p>${r.d}</p></div><div class="row"><button class="pr" data-act="sharescore">${ICO.share} ${z.defi?"Envoyer le défi à mes amis":"Partager mon score"}</button><button class="ch" data-act="again">Rejouer</button></div>`
   +`<h3>Récapitulatif</h3><ol class="recap">`+z.qs.map((q,i)=>`<li class="${z.ans[i]===q.ok?"ok":"ko"}">${esc(q.q)}<br><span class="mu">${esc(q.opts[q.ok])}</span></li>`).join("")+`</ol>`}
 const q=z.qs[z.i],a=z.ans[z.i];
 return `<h2>${z.defi?"Défi n° "+esc(z.seed.toUpperCase()):"Quiz"}</h2><div class="prog"><div class="bar"><i style="width:${Math.round((z.i+(a!=null?1:0))/n*100)}%"></i></div><span>Question ${z.i+1} sur ${n} · ${pl(s,"point")}</span></div><p class="qq">${esc(q.q)}</p>${opts(q,a,"qa")}`
  +(a!=null?feedback(q,a)+`<p><button class="pr" data-act="next">${z.i+1<n?"Question suivante":"Voir mon score"}</button></p>`:"")
  +`<p><button class="ch" data-act="quit">Abandonner</button></p>`}

function demander(){
 if(!SM)return `<h2>Demander</h2><p>Les questions à Claude ne sont possibles que dans la version du compagnon publiée sur Claude.</p>${LIEN.artifact?`<p><a href="${esc(LIEN.artifact)}" target="_blank" rel="noopener">Ouvrir cette version</a></p>`:""}`;
 const ex=["Qu'est-ce que la Loi de la Surprise ?","Pourquoi Geralt a-t-il les cheveux blancs ?","Quelle différence entre les Aen Seidhe et les Aen Elle ?","Quel livre lire en ce moment ?"];
 return `<h2>Demander</h2><p class="mu">Posez une question sur les livres ou le monde du Sorceleur. La réponse tient compte de votre avancée dans le jeu et des livres que vous avez lus.</p><div class="chips">${ex.map(x=>`<button class="ch" data-ex="${esc(x)}">${esc(x)}</button>`).join("")}</div><textarea id="qs" rows="3" placeholder="Par exemple : qui sont les Aen Elle ?" aria-label="Votre question">${esc(S.ask.q)}</textarea><p class="row"><button class="pr" id="go"${S.ask.busy?" disabled":""}>Poser la question</button><button class="ch" id="stop"${S.ask.busy?"":" hidden"}>Arrêter</button></p><div id="out" class="out" aria-live="polite">${esc(S.ask.out)}</div><p class="mu sm">Réponse générée par Claude à partir du codex et de ses propres connaissances : vérifiez les détails importants dans les livres.</p>`}

const footer=()=>`<footer class="ft"><p>Guide non officiel, réalisé par des fans. La saga du Sorceleur est l'œuvre d'Andrzej Sapkowski ; The Witcher est une série de jeux de CD Projekt Red.</p><p><button class="lnk" data-share="">Envoyer le compagnon à un ami</button></p></footer>`;

/* ---------- Rendu ---------- */
function renderRoute(){
 const r=$("#route");
 r.innerHTML=C.chapitres.map((c,i)=>`<button class="st${i<S.ch?" done":""}${i===S.ch?" on":""}" data-i="${i}" aria-pressed="${i===S.ch}"><i></i>${esc(c.court)}</button>`).join("");
 const b=$("#route .on");if(b)r.scrollLeft=b.offsetLeft-r.clientWidth/2+b.offsetWidth/2}
function renderTabs(){
 $("#tabs").innerHTML=TABS.filter(([k])=>k!=="demander"||SM).map(([k,n])=>`<button data-tab="${k}" class="${k===S.tab?"on":""}"${k===S.tab?' aria-current="page"':""}>${ICO[k]}<span>${n}</span></button>`).join("")}
function render(){
 renderRoute();renderTabs();
 const v=S.id?(ID[S.id]?fiche(ID[S.id]):monstre(MID[S.id])):({partie,codex,bestiaire,livres,quiz,demander}[S.tab]||partie)();
 $("#main").innerHTML=v+footer()}

/* ---------- Navigation ---------- */
const cur=()=>{try{return decodeURIComponent(location.hash.slice(1))}catch(e){return""}};
const isRoot=t=>TABK.includes(t)||SEGS[t];
function go(t){if(cur()===t){mem[t]=0;route()}else location.hash=t}
function replaceHash(t){try{history.replaceState(null,"","#"+t)}catch(e){}trail[trail.length-1]=t}
function back(){go(trail.length>1?trail[trail.length-2]:S.tab)}
function route(){
 const t=cur()||"partie";
 const popped=trail.length>1&&trail[trail.length-2]===t;
 if(isRoot(t))trail=[t];else if(popped)trail.pop();else if(trail[trail.length-1]!==t)trail.push(t);
 S.id=null;S.defi=null;
 if(SEGS[t]){S.tab="livres";S.lv=t}
 else if(t==="livres"){S.tab="livres";S.lv="ordre"}
 else if(TABK.includes(t))S.tab=t;
 else if(/^defi-[a-z0-9]{3,12}$/.test(t)){S.tab="quiz";S.defi=t.slice(5)}
 else if(ID[t]){S.id=t;S.tab=ID[t].t==="livre"?"livres":"codex"}
 else if(MID[t]){S.id=t;S.tab="bestiaire"}
 else S.tab="partie";
 render();
 scrollTo(0,popped||isRoot(t)?mem[t]||0:0)}
addEventListener("hashchange",ev=>{try{mem[decodeURIComponent(new URL(ev.oldURL).hash.slice(1))||"partie"]=scrollY}catch(e){}route()});
const shareToken=()=>S.id||(S.defi?"defi-"+S.defi:S.tab==="partie"?"":S.tab==="livres"&&S.lv!=="ordre"?S.lv:S.tab);

/* ---------- Partage ---------- */
function shareBase(){if(!inFrame&&/^https?:$/.test(location.protocol))return location.href.split("#")[0];return LIEN.artifact||LIEN.pages}
const shareUrl=t=>shareBase()+(t?"#"+t:"");
const titleOf=t=>any(t)?any(t).nom:t.startsWith("defi-")?"ce défi":({codex:"le codex",bestiaire:"le bestiaire",livres:"l'ordre de lecture",frise:"la frise",ecrans:"les jeux et écrans",quiz:"le quiz",demander:"Demander"})[t]||"cette page";
function loadQR(){return qrLib||(qrLib=new Promise((ok,ko)=>{if(window.QRious)return ok(window.QRious);
 const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js";s.onload=()=>window.QRious?ok(window.QRious):ko();s.onerror=()=>{qrLib=null;ko()};document.head.appendChild(s)}))}
function openSheet(tok,msg){
 const url=shareUrl(tok);sheetUrl=url;sheetMsg=msg||"";
 let h=msg?`<p>Votre message est prêt : copiez-le, puis collez-le dans votre conversation.</p><textarea id="sh-m" rows="4" readonly>${esc(msg+"\n"+url)}</textarea><p><button class="pr" data-copy="sh-m">Copier le message</button></p>`
  :`<p>Envoyez ce lien à vos amis. Chacun indique sa propre avancée dans le jeu, et le compagnon ne leur dévoile rien de ce qui vient après.</p><label class="mu sm" for="sh-l">${tok?"Lien vers "+esc(titleOf(tok)):"Lien vers le compagnon"}</label><div class="cp"><input id="sh-l" type="text" readonly value="${esc(url)}"><button class="pr" data-copy="sh-l">Copier</button></div>`;
 if(!inFrame&&navigator.share)h+=`<p><button class="ch" id="sh-send">${ICO.share}Envoyer avec une application</button></p>`;
 if(tok&&!msg)h+=`<p><button class="lnk" data-share="">Partager plutôt l'accueil du compagnon</button></p>`;
 h+=`<div class="qrw" id="qrw" hidden><canvas id="qr" width="400" height="400" role="img" aria-label="QR code du lien"></canvas><p class="mu sm">À scanner avec l'appareil photo d'un téléphone.</p></div>`;
 if(location.protocol==="file:")h+=`<p class="mu sm">Vous consultez une copie enregistrée sur cet appareil. Vous pouvez aussi envoyer le fichier lui-même : il s'ouvre dans n'importe quel navigateur, même hors ligne.</p>`;
 $("#sh-body").innerHTML=h;$("#sheet").hidden=false;$("#sh-x").focus();
 loadQR().then(Q=>{const c=$("#qr");if(!c||sheetUrl!==url)return;new Q({element:c,value:url,size:400,padding:28,background:"#ffffff",foreground:"#17262c",level:"M"});$("#qrw").hidden=false}).catch(()=>{})}
const closeSheet=()=>{$("#sheet").hidden=true};
function copy(id){const el=$("#"+id);if(!el)return;
 const fail=()=>{el.focus();el.select();toast("Texte sélectionné : copiez-le avec un appui long ou Ctrl+C")};
 try{navigator.clipboard.writeText(el.value).then(()=>toast(id==="sh-m"?"Message copié":"Lien copié"),fail)}catch(e){fail()}}
function shareScore(){
 const z=S.quiz,s=score(z),n=z.qs.length,tok=z.defi?"defi-"+z.seed:"quiz";
 const msg=z.defi?`J'ai fait ${s}/${n} au défi n° ${z.seed.toUpperCase()} du Compagnon du Sorceleur. Mêmes questions pour toi, et aucun spoiler :`:`J'ai fait ${s}/${n} au quiz du Compagnon du Sorceleur. À ton tour :`;
 const url=shareUrl(tok);
 if(!inFrame&&navigator.share){navigator.share({title:"Compagnon du Sorceleur",text:msg,url}).catch(e=>{if(e&&e.name!=="AbortError")openSheet(tok,msg)});return}
 try{navigator.clipboard.writeText(msg+"\n"+url).then(()=>toast("Message copié : collez-le dans votre conversation"),()=>openSheet(tok,msg))}catch(e){openSheet(tok,msg)}}

/* ---------- Demander à Claude ---------- */
async function ask(){
 const el=$("#qs"),q=(el?el.value:S.ask.q).trim();if(!q||!SM||S.ask.busy)return;
 S.ask.q=q;S.ask.busy=true;S.ask.out="Réflexion en cours…";ctl=new AbortController();
 const set=()=>{const o=$("#out"),g=$("#go"),s=$("#stop");if(o)o.textContent=S.ask.out;if(g)g.disabled=S.ask.busy;if(s)s.hidden=!S.ask.busy};set();
 const c=C.chapitres[S.ch],w=norm(q).split(/[^a-z0-9]+/).filter(x=>x.length>2);
 const sc=(txt,name)=>{const h=norm(txt),n=norm(name);return w.reduce((a,x)=>a+(h.includes(x)?1:0)+(n.includes(x)?2:0),0)};
 const top=(l,f,k)=>l.map(x=>[f(x),x]).filter(x=>x[0]>0).sort((a,b)=>b[0]-a[0]).slice(0,k).map(x=>x[1]);
 const ce=top(E.filter(vis),e=>sc([e.nom,...(e.alias||[]),e.role,e.resume].join(" "),e.nom),8).map(e=>[`## ${e.nom} (${e.role})`,e.resume,e.livres||"",S.sp&&e.rev?e.rev:"",(e.jeu||[]).filter(jv).map(l=>l.t).join(" ")].filter(Boolean).join("\n"));
 const cm=top(M.filter(vis),m=>sc([m.nom,m.en||"",m.cl].join(" "),m.nom),3).map(m=>[`## ${m.nom} (bestiaire, ${m.cl})`,"Conseil du jeu : "+m.conseil,m.livres||"",m.origine||""].filter(Boolean).join("\n"));
 const cw=top(C.lexique,x=>sc(x.mot+" "+x.sens,x.mot),4).map(x=>`- ${x.mot} : ${x.sens}. ${x.note}`);
 const ctx=[...ce,...cm,...(cw.length?["## Langue ancienne\n"+cw.join("\n")]:[])].join("\n\n");
 const ext=[S.hos&&"Hearts of Stone",S.bw&&"Blood and Wine"].filter(Boolean).join(" et ")||"aucune";
 const lus=BOOKS.filter(b=>S.lus[b.id]).map(b=>"« "+b.nom+" »").join(", ")||"aucun";
 const prompt=`Tu es le compagnon d'un joueur de The Witcher 3: Wild Hunt et un expert des livres d'Andrzej Sapkowski (saga du Sorceleur). Réponds en français, en 8 phrases au plus, sans titres ni listes à puces, en distinguant ce qui vient des livres de ce qui vient des jeux. Si tu n'es pas sûr d'un détail, dis-le au lieu d'inventer.
Avancée du joueur : chapitre « ${c.nom} » (${c.lieux}) ; extensions commencées : ${ext}.
Livres déjà lus : ${lus}. Ordre de lecture conseillé : ${BOOKS.map(b=>b.nom).join(", ")}. Si on te demande quoi lire, tiens-en compte.
Spoilers : ne révèle rien du jeu qui dépasse ce chapitre. ${S.sp?"Le joueur accepte les spoilers sur la fin des livres.":"Ne révèle pas les rebondissements de la fin des livres : si la question l'exige, préviens d'abord et reste allusif."}

Notes du codex :
${ctx||"(aucune fiche pertinente)"}

Question : ${q}`;
 try{
  const r=await SM(prompt,{signal:ctl.signal,onText:({text})=>{S.ask.out=text;const o=$("#out");if(o)o.textContent=text}});
  S.ask.out=r.text+(r.truncated?"\n\n(Réponse tronquée : posez une question plus ciblée.)":"");
 }catch(e){
  const m={not_granted:"Autorisation refusée : la question ne peut pas être posée ici.",sampling_disabled:"Cette fonction n'est pas disponible pour votre compte.",rate_limited:"Trop de questions d'affilée, ou limite d'usage atteinte. Réessayez un peu plus tard.",session_expired:"Votre session a expiré : reconnectez-vous à Claude, puis réessayez.",refused:"Claude n'a pas voulu répondre à cette question. Essayez de la formuler autrement."};
  S.ask.out=e&&e.code==="refused"?m.refused:((e&&e.text)||"")+(e&&e.code==="cancelled"?"":((e&&e.text)?"\n\n":"")+(m[e&&e.code]||"La réponse n'a pas abouti. Vous pouvez réessayer."));
 }finally{S.ask.busy=false;set()}}

/* ---------- Actions ---------- */
function startQuiz(defi,seed){S.quiz={seed,defi,qs:makeQuiz((defi?"defi-":"solo-")+seed,defi?SAFE:now(),10),i:0,ans:[]}}
function act(a){
 const z=S.quiz;
 if(a==="vu"){S.vu=true;save();render()}
 else if(a==="solo"){startQuiz(false,newSeed());if(S.defi){S.defi=null;replaceHash("quiz")}render();scrollTo(0,0)}
 else if(a==="defi"){const s=newSeed();startQuiz(true,s);S.defi=s;replaceHash("defi-"+s);render();scrollTo(0,0)}
 else if(a==="relever"){startQuiz(true,S.defi);render();scrollTo(0,0)}
 else if(a==="next"&&z){z.i++;if(z.i>=z.qs.length){const s=score(z);if(!S.record||s/z.qs.length>S.record.s/S.record.n){S.record={s,n:z.qs.length};save()}}render();scrollTo(0,0)}
 else if(a==="quit"||a==="again"){S.quiz=null;if(S.defi){S.defi=null;replaceHash("quiz")}render();scrollTo(0,0)}
 else if(a==="sharescore"&&z)shareScore()}

document.addEventListener("click",ev=>{
 const t=ev.target.closest("button");
 if(!t){if(ev.target.id==="sheet")closeSheet();return}
 const d=t.dataset;
 if(d.i!==undefined){S.ch=+d.i;S.vu=true;save();render()}
 else if(d.o)go(d.o);
 else if(d.b!==undefined)back();
 else if(d.tab)go(d.tab);
 else if(d.t){S.ty=d.t;render()}
 else if(d.c){S.cl=d.c;render()}
 else if(d.lv)go(d.lv==="ordre"?"livres":d.lv);
 else if(d.r){S.rv[d.r]=1;render()}
 else if(d.force){S.force[d.force]=1;render()}
 else if(d.lu){const k=d.lu;if(S.lus[k])delete S.lus[k];else S.lus[k]=1;save();render();toast(S.lus[k]?"« "+ID[k].nom+" » marqué comme lu":"« "+ID[k].nom+" » retiré de vos lectures")}
 else if(d.an!==undefined){S.an++;render()}
 else if(d.ej!==undefined&&S.eclair){S.eclair.a=+d.ej;render()}
 else if(d.qa!==undefined&&S.quiz&&S.quiz.ans[S.quiz.i]==null){S.quiz.ans[S.quiz.i]=+d.qa;render()}
 else if(d.act)act(d.act);
 else if(d.share!==undefined)openSheet(d.share);
 else if(d.copy)copy(d.copy);
 else if(d.ex){S.ask.q=d.ex;const x=$("#qs");if(x){x.value=d.ex;x.focus()}}
 else if(d.askabout){S.ask.q=`Que racontent les livres et le jeu sur ${d.askabout} ?`;go("demander")}
 else if(t.id==="go")ask();
 else if(t.id==="stop"&&ctl)ctl.abort();
 else if(t.id==="share-open")openSheet(shareToken());
 else if(t.id==="sh-x")closeSheet();
 else if(t.id==="sh-send")navigator.share({title:"Compagnon du Sorceleur",text:sheetMsg||"Le lore des livres du Sorceleur, au rythme de ta partie de The Witcher 3.",url:sheetUrl}).catch(()=>{});
});
document.addEventListener("input",ev=>{const t=ev.target;
 if(t.id==="q"){S.q=t.value;$("#lst").innerHTML=lst()}
 else if(t.id==="bq"){S.bq=t.value;$("#blst").innerHTML=blst()}
 else if(t.id==="qs")S.ask.q=t.value});
document.addEventListener("keydown",ev=>{if(ev.key==="Escape"&&!$("#sheet").hidden)closeSheet();
 if(ev.key==="Enter"&&(ev.ctrlKey||ev.metaKey)&&ev.target.id==="qs")ask()});
for(const k of["hos","bw","sp"]){const el=$("#o-"+k);el.checked=!!S[k];el.onchange=()=>{S[k]=el.checked;save();render()}}

route();
(async()=>{try{if(!window.claude||!window.claude.use)return;const s=await window.claude.use("sample");
 if(s){SM=s;const f=document.activeElement;if(f&&/^(INPUT|TEXTAREA)$/.test(f.tagName))renderTabs();else render()}}catch(e){}})();
