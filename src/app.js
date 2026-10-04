/* Compagnon du Sorceleur : application pour téléphone.
   Navigation par ancre (#ciri, #carte, #defi-ab12…) pour que chaque écran se partage par un simple lien,
   et que le bouton retour du téléphone fonctionne comme dans une application. */
const C=window.CODEX,E=C.entrees,M=C.bestiaire,SRCS=C.sources,ID={},MID={};
E.forEach(e=>ID[e.id]=e);M.forEach(m=>MID[m.id]=m);
const BOOKS=E.filter(e=>e.t==="livre").sort((a,b)=>a.ordre-b.ordre);
const SIGNES=["Aard","Igni","Yrden","Quen","Axii"];
/* Adresses publiques du compagnon, utilisées pour les liens de partage. */
const LIEN={artifact:"https://claude.ai/artifact/XHmn6MRvrESmEH8ux3peXH",pages:"https://couefficguillaume-collab.github.io/Witcher-lore/"};
const VERSION="3.0";
const TYPES={perso:"Personnage",lieu:"Lieu",faction:"Peuple ou faction",concept:"Notion",livre:"Livre"};
const SRC={L:"Livres",J:"Jeu",LJ:"Livres et jeu"};
const LIGNEE=["lara-dorren","calanthe","pavetta","duny","ciri","geralt","yennefer","sang-ancien","emhyr"];
const svg=(p,f)=>`<svg viewBox="0 0 24 24" fill="${f||"none"}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const STAR='<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>';
const ICO={
 partie:svg('<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'),
 codex:svg('<path d="M3 5.5c3-1 6-1 9 1 3-2 6-2 9-1v13c-3-1-6-1-9 1-3-2-6-2-9-1z"/><path d="M12 6.5v13"/>'),
 carte:svg('<path d="M3 6.5l6-2 6 2 6-2v13l-6 2-6-2-6 2z"/><path d="M9 4.5v13M15 6.5v13"/>'),
 bestiaire:svg('<path d="M6 4c3 4 4 9 3 16"/><path d="M11 3c3 5 4 11 2 18"/><path d="M16 4c3 4 4 9 2 15"/>'),
 livres:svg('<path d="M6 3h12v18l-6-4-6 4z"/>'),
 quiz:svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7v.5"/><path d="M12 17h.01"/>'),
 demander:svg('<path d="M4 5h16v11H9l-5 4z"/>'),
 share:svg('<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>'),
 search:svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
 reglages:svg('<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'),
 back:svg('<path d="M15 5l-7 7 7 7"/>'),
 star:svg(STAR),starOn:svg(STAR,"currentColor"),
 pin:svg('<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>'),
 tree:svg('<circle cx="12" cy="5" r="2.2"/><circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="19" r="2.2"/><path d="M12 7.2V12M6 16.8V14h12v2.8"/>'),
 plus:svg('<path d="M12 5v14M5 12h14"/>'),minus:svg('<path d="M5 12h14"/>'),
 target:svg('<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'),
 close:svg('<path d="M6 6l12 12M18 6L6 18"/>'),
 install:svg('<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M12 8v6M9.5 11.5L12 14l2.5-2.5"/>'),
 lang:svg('<path d="M4 6h10M9 4v2M6 6c0 4 3 7 7 8M12 6c0 4-3 7-7 8"/><path d="M13 20l4-9 4 9M14.5 17h5"/>'),
 invite:svg('<circle cx="9" cy="8" r="3"/><path d="M3 19c0-3.3 2.7-5 6-5s6 1.7 6 5"/><path d="M18 8v6M15 11h6"/>'),
 conte:svg('<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>')
};
const EMBLEME='<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="none" stroke="var(--ac)" stroke-width="2"/><circle cx="24" cy="24" r="18.5" fill="none" stroke="var(--ln)" stroke-width="1"/><g fill="none" stroke-linecap="round" stroke-width="2.2"><path d="M16.5 31.2L33 13M31.5 31.2L15 13" stroke="currentColor"/><path d="M13.5 28.5l6 5.4M34.5 28.5l-6 5.4M16.5 31.2l-3.3 3.6M31.5 31.2l3.3 3.6" stroke="var(--ac)"/></g></svg>';
const TABS=[["partie","Partie"],["codex","Codex"],["carte","Carte"],["bestiaire","Bestiaire"],["livres","Livres"]];
const TABK=TABS.map(t=>t[0]);
const TITRES={partie:"Ma partie",codex:"Codex",carte:"Carte du Continent",bestiaire:"Bestiaire",livres:"Livres",quiz:"Quiz",demander:"Demander",reglages:"Réglages",recherche:"Recherche",lignee:"Lignée de Ciri"};
const PAGES={quiz:"partie",demander:"partie",reglages:null,recherche:null,lignee:"codex"};
const SEGS={contes:1,frise:1,ecrans:1};

let SM=null,ctl=null,qrLib=null,trail=[],sheetUrl="",sheetMsg="",installEvt=null,wake=null,first=true;
const mem={};
const S={ch:0,hos:false,bw:false,sp:false,lus:{},vu:false,record:null,fav:{},hist:[],serie:null,theme:"auto",taille:"normal",eveil:false,
 tab:"partie",page:null,id:null,lv:"lecture",defi:null,q:"",ty:"all",cl:"all",bq:"",an:0,rv:{},force:{},quiz:null,eclair:null,
 ask:{q:"",out:"",busy:false},pend:null,sel:null,onb:0,reset:false};
const KEEP=["ch","hos","bw","sp","lus","vu","record","fav","hist","serie","theme","taille","eveil"];
try{const o=JSON.parse(localStorage.getItem("cs")||"{}");KEEP.forEach(k=>{if(k in o)S[k]=o[k]})}catch(e){}
S.ch=Math.min(Math.max(+S.ch||0,0),C.chapitres.length-1);
for(const k of["lus","fav"])if(!S[k]||typeof S[k]!=="object")S[k]={};
if(!Array.isArray(S.hist))S.hist=[];
S.hist=S.hist.filter(i=>ID[i]||MID[i]);
const save=()=>{try{const o={};KEEP.forEach(k=>o[k]=S[k]);localStorage.setItem("cs",JSON.stringify(o))}catch(e){}};

/* ---------- Outils ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const norm=s=>String(s).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
const inFrame=(()=>{try{return window.top!==window.self}catch(e){return true}})();
const standalone=()=>{try{return matchMedia("(display-mode: standalone)").matches||navigator.standalone===true}catch(e){return false}};
const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const calme=()=>{try{return matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){return true}};
const vib=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};
const now=()=>({ch:S.ch,hos:S.hos,bw:S.bw});
const SAFE={ch:0,hos:false,bw:false};
const visIn=(x,k)=>!x.porte||(x.porte.d?!!k[x.porte.d]:x.porte.c<=k.ch);
const vis=x=>visIn(x,now());
const jv=l=>l.d?S[l.d]:l.c<=S.ch;
const any=id=>ID[id]||MID[id];
const revOK=(x,k)=>S.sp||S.rv[k||x.id]||(x.rl&&S.lus[x.rl]);
const ents=ids=>ids.map(i=>ID[i]).filter(e=>e&&vis(e));
const row=e=>`<button class="ro ${e.src}" data-o="${e.id}"><b>${esc(e.nom)}</b><small>${esc(e.role)}</small></button>`;
const SG={Igni:"#d6532b",Aard:"#4d8fd1",Yrden:"#9a68d1",Quen:"#d9a62e",Axii:"#d1659f"};
const sg=s=>`<span class="sg"><i style="background:${SG[s]||"var(--mu)"}"></i>${s}</span>`;
const mrow=m=>`<button class="ro ${m.livres?"LJ":"J"}" data-o="${m.id}"><b>${esc(m.nom)}</b><small>${esc(m.cl)}${m.signes?" · "+m.signes.map(sg).join(""):""}</small></button>`;
const anyRow=x=>MID[x.id]?mrow(x):row(x);
const chip=id=>{const x=any(id);return x&&vis(x)?`<button class="ch" data-o="${id}">${esc(x.nom)}</button>`:""};
const chips=ids=>{const h=ids.map(chip).join("");return h?`<div class="chips">${h}</div>`:""};
const oil=c=>c==="Humains"?"Venin du pendu (épée d'acier)":"Huile "+C.classes[c]+(c==="Bêtes"?"":" (épée d'argent)");
const kv=(k,v)=>v?`<p class="kv"><b>${k}</b> ${v}</p>`:"";
const bl=(t,x,j,n)=>`<div class="bl${j?" j":""}"><h3>${t}</h3><p>${esc(x)}</p>${n?`<p class="note">${n}</p>`:""}</div>`;
const pl=(n,s)=>n+" "+s+(n>1?"s":"");
const dayKey=(d=new Date())=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const livre=id=>"« "+ID[id].nom+" »";
const revBtn=(x,k)=>`<button class="sp" data-r="${k}">Révéler la suite${x.rl?" (spoilers jusqu'à "+esc(livre(x.rl))+")":" (spoilers des livres)"}</button>`;
let tt;
function toast(m,act,label){const t=$("#toast");t.innerHTML=esc(m)+(act?`<button data-act="${act}">${label}</button>`:"");t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>{t.hidden=true},act?9000:2800)}

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
 for(const s of SRCS.filter(s=>s.groupe==="contes"))mk("conte",s.id,`Quel conte Sapkowski détourne-t-il dans « ${s.oeuvre} » ?`,s.conte,SRCS.filter(x=>x.groupe==="contes").map(x=>x.conte),s.texte,s.liens[0]);
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
 return `<p class="fb ${ok?"ok":"ko"}" role="status">${ok?"Bonne réponse.":"Raté. La bonne réponse : "+esc(q.opts[q.ok])+"."}</p><p>${esc(q.why)}</p>${q.lien?chips([q.lien]):""}`}

/* ---------- Illustrations ---------- */
const credit=s=>`${s.artiste}, « ${s.conte} », ${s.annee}`;
const fig=s=>`<figure class="fig"><button data-lb="${s.id}" aria-label="Agrandir l'illustration : ${esc(credit(s))}"><img src="${s.img}" alt="${esc(s.conte)}, illustration de ${esc(s.artiste)}" loading="lazy" decoding="async"></button><figcaption>${esc(credit(s))}. Domaine public.</figcaption></figure>`;
const srcVis=s=>{const x=any(s.liens[0]);return !x||vis(x)};
const srcsFor=id=>SRCS.filter(s=>s.liens.includes(id)&&srcVis(s));
function srcBlock(id){const l=srcsFor(id);if(!l.length)return"";
 return `<h3>Aux sources</h3>`+l.map(s=>`${fig(s)}<p><b>${esc(s.conte)}</b>. ${esc(s.texte)}</p>`).join("")}

/* ---------- Vues principales ---------- */
function stepper(){
 let h=`<div class="stepper" id="route" role="group" aria-label="Où en êtes-vous dans le jeu ?">`+C.chapitres.map((c,i)=>`<button class="st${i<S.ch?" done":""}${i===S.ch?" on":""}" data-i="${i}" aria-pressed="${i===S.ch}"><i></i>${esc(c.court)}</button>`).join("")+`</div>`;
 if(S.pend!=null)h+=`<div class="pend"><p>Passer à l'étape « ${esc(C.chapitres[S.pend].nom)} » ? Les fiches de cette étape deviendront visibles.</p><div class="row"><button class="pr" data-act="pend-ok">Oui, j'y suis</button><button class="ch" data-act="pend-no">Annuler</button></div></div>`;
 return h}

function partie(){
 const c=C.chapitres[S.ch];let h=stepper();
 h+=`<p class="eb">Étape ${S.ch+1} sur ${C.chapitres.length}</p><h2>${esc(c.nom)}</h2><p class="mu">${esc(c.lieux)}</p><p>${esc(c.intro)}</p>`;
 h+=`<div class="bl"><h3>À lire dans les livres</h3><p>${esc(c.lire)}</p>${chips(c.lireIds)}</div>`;
 const ls=ents(c.entrees);if(ls.length)h+=`<h3>Autour de vous</h3>`+ls.map(row).join("");
 const ms=(c.monstres||[]).map(i=>MID[i]).filter(m=>m&&vis(m));if(ms.length)h+=`<h3>Monstres du coin</h3>`+ms.map(mrow).join("");
 for(const k of["hos","bw"])if(S[k]){const d=C.dlc[k];
  h+=`<h3>${d.nom}</h3><p>${esc(d.intro)}</p><div class="bl"><p>${esc(d.lire)}</p></div>`+ents(d.entrees).map(row).join("")+(d.monstres||[]).map(i=>MID[i]).filter(Boolean).map(mrow).join("")}
 h+=eclair();
 h+=`<div class="tiles"><button class="tile" data-o="quiz">${ICO.quiz}<b>Quiz</b><small>Dix questions selon votre avancée</small></button><button class="tile" data-act="defi">${ICO.invite}<b>Défier un ami</b><small>Les mêmes questions, sans spoiler</small></button></div>`;
 const nx=BOOKS.find(b=>!S.lus[b.id]);
 h+=nx?`<div class="card"><p class="eb">Votre prochaine lecture</p><h3 class="ct">${esc(nx.nom)}</h3><p class="mu sm">${esc(nx.role)}</p><p>${esc(nx.resume)}</p><div class="chips"><button class="ch" data-lu="${nx.id}">Je l'ai lu</button><button class="ch" data-o="${nx.id}">Voir la fiche</button></div></div>`
  :`<div class="card"><p class="eb">Bibliothèque</p><p>Vous avez lu toute la saga. Il ne reste plus qu'à la relire.</p></div>`;
 const an=C.anecdotes.filter(a=>(!a.c||a.c<=S.ch)&&(!any(a.lien)||vis(any(a.lien))));
 if(an.length){const a=an[S.an%an.length];h+=`<h3>Le saviez-vous</h3><p>${esc(a.t)}</p><div class="chips"><button class="ch" data-an>Une autre anecdote</button>${chip(a.lien)}</div>`}
 if(SM)h+=`<div class="card"><p class="eb">Une question ?</p><p>Demandez à Claude ce que les livres racontent, sans spoiler sur la suite de votre partie.</p><button class="pr" data-o="demander">${ICO.demander}Demander</button></div>`;
 const ib=installCard();if(ib)h+=ib;
 h+=`<div class="card"><p class="eb">Entre amis</p><p>Envoyez le compagnon à un ami : il règle sa propre avancée, et rien ne lui est dévoilé.</p><button class="pr" data-share="">${ICO.share}Inviter un ami</button></div>`;
 return h}

function eclair(){
 const key=dayKey()+"-"+S.ch+(S.hos?"h":"")+(S.bw?"b":"");
 if(!S.eclair||S.eclair.key!==key)S.eclair={key,q:makeQuiz("jour-"+key,now(),1)[0],a:null};
 const{q,a}=S.eclair;if(!q)return"";
 const n=S.serie&&(S.serie.jour===dayKey()||S.serie.jour===dayKey(new Date(Date.now()-864e5)))?S.serie.n:0;
 return `<div class="card hi"><p class="eb">Question du jour${n>1?" · série de "+n+" jours":""}</p><p class="qq">${esc(q.q)}</p>${opts(q,a,"ej")}${a!=null?feedback(q,a):""}</div>`}

function codex(){
 const T=[["all","Tout"],["perso","Personnages"],["lieu","Lieux"],["faction","Peuples et factions"],["concept","Notions"],["livre","Livres"],["mot","Langue ancienne"],["fav","Carnet"]];
 const fav=Object.keys(S.fav).filter(i=>any(i)&&vis(any(i)));
 let h=`<button class="fake" data-act="search">${ICO.search}Chercher un nom, un surnom, une créature…</button>`;
 h+=`<div class="tiles"><button class="tile" data-o="lignee">${ICO.tree}<b>Lignée de Ciri</b><small>De Lara Dorren à Ciri</small></button><button class="tile" data-t="mot">${ICO.lang}<b>Langue ancienne</b><small>${C.lexique.length} mots elfes</small></button></div>`;
 const rec=S.hist.filter(i=>any(i)&&vis(any(i))).slice(0,6);
 if(rec.length&&S.ty==="all")h+=`<h3>Consultés récemment</h3>${chips(rec)}`;
 h+=`<div class="fl">${T.map(([k,n])=>`<button class="ch${S.ty===k?" on":""}" data-t="${k}">${n}${k==="fav"&&fav.length?" ("+fav.length+")":""}</button>`).join("")}</div><p class="mu sm">Trait bleu : issu des livres. Trait ambre : issu du jeu. Les deux : présent dans les deux.</p>`;
 if(S.ty==="mot")return h+lex("");
 if(S.ty==="fav")return h+(fav.length?fav.map(i=>anyRow(any(i))).join(""):`<p class="mu">Votre carnet est vide. Touchez l'étoile d'une fiche pour l'y ranger.</p>`);
 const l=E.filter(e=>vis(e)&&(S.ty==="all"||e.t===S.ty));
 l.sort((a,b)=>S.ty==="livre"?a.ordre-b.ordre:a.nom.localeCompare(b.nom,"fr"));
 if(S.ty!=="all")return h+l.map(row).join("");
 for(const[t,n]of[["perso","Personnages"],["lieu","Lieux"],["faction","Peuples et factions"],["concept","Notions"],["livre","Livres"]]){
  const g=l.filter(e=>e.t===t);if(t==="livre")g.sort((a,b)=>a.ordre-b.ordre);if(g.length)h+=`<h3 class="gh">${n}<span>${g.length}</span></h3>`+g.map(row).join("")}
 return h}

function lex(q){return C.lexique.filter(w=>!q||norm(w.mot+" "+w.sens+" "+w.note).includes(q)).map(w=>
 `<div class="lx"><p><b>${esc(w.mot)}</b> ${esc(w.sens)}</p><p class="mu sm">${esc(w.note)}</p>${w.lien?chips([w.lien]):""}</div>`).join("")}

function recherche(){return `<input id="q" type="search" enterkeyhint="search" placeholder="Nom, surnom, lieu, créature, mot elfe…" aria-label="Rechercher" value="${esc(S.q)}" autocomplete="off" autocapitalize="off" spellcheck="false"><div id="lst">${resultats()}</div>`}
function resultats(){
 const q=norm(S.q.trim());
 if(!q){const rec=S.hist.filter(i=>any(i)&&vis(any(i))).slice(0,8);
  return (rec.length?`<h3>Consultés récemment</h3>`+rec.map(i=>anyRow(any(i))).join(""):"")+`<h3>Suggestions</h3>${chips(["ciri","yennefer","chasse","loi-surprise","kaer-morhen","m-griffon","sang-ancien","jaskier"])}`}
 const hit=x=>norm([x.nom,...(x.alias||[]),x.role||"",x.resume||""].join(" ")).includes(q);
 const l=E.filter(e=>vis(e)&&hit(e)).sort((a,b)=>(norm(b.nom).startsWith(q)-norm(a.nom).startsWith(q))||a.nom.localeCompare(b.nom,"fr"));
 const ms=M.filter(m=>vis(m)&&norm([m.nom,m.en||"",m.cl].join(" ")).includes(q));
 const lx=lex(q),sr=SRCS.filter(s=>srcVis(s)&&norm(s.conte+" "+s.oeuvre+" "+s.artiste).includes(q));
 let h=l.map(row).join("");
 if(ms.length)h+=`<h3 class="gh">Bestiaire</h3>`+ms.map(mrow).join("");
 if(lx)h+=`<h3 class="gh">Langue ancienne</h3>`+lx;
 if(sr.length)h+=`<h3 class="gh">Aux sources</h3>`+sr.map(s=>`<button class="ro LJ" data-o="contes"><b>${esc(s.conte)}</b><small>${esc(s.oeuvre)} · ${esc(s.artiste)}</small></button>`).join("");
 return h||`<p class="mu">Rien ne correspond. Essayez un autre nom ou un surnom.</p>`}

function bestiaire(){
 const f=[["all","Tous"],...Object.keys(C.classes).map(c=>[c,c])].map(([k,n])=>`<button class="ch${S.cl===k?" on":""}" data-c="${k}">${n}</button>`).join("");
 return `<p class="mu">Ce que le jeu recommande, et ce que les livres en disent.</p><input id="bq" type="search" enterkeyhint="search" placeholder="Chercher une créature, en français ou en anglais" aria-label="Chercher une créature" value="${esc(S.bq)}" autocomplete="off"><div class="fl">${f}</div><div id="blst">${blst()}</div>`}
function blst(){const q=norm(S.bq.trim());
 const l=M.filter(m=>vis(m)&&(S.cl==="all"||m.cl===S.cl)&&(!q||norm([m.nom,m.en||"",m.cl].join(" ")).includes(q)));
 return l.map(mrow).join("")||`<p class="mu">Aucune créature ne correspond.</p>`}

/* ---------- Fiches ---------- */
function gate(x){const n=x.porte.d?C.dlc[x.porte.d].nom:C.chapitres[x.porte.c].nom;
 return `<div class="gate"><p class="eb">Attention, spoiler</p><h2>Fiche verrouillée</h2><p>Cette fiche concerne ${x.porte.d?"l'extension "+esc(n):"un passage du jeu situé à l'étape « "+esc(n)+" »"}, plus loin que là où vous en êtes. Un ami vous l'a peut-être envoyée.</p><div class="row"><button class="pr" data-force="${x.id}">Afficher quand même</button><button class="ch" data-b>Non merci</button></div></div>`}
function actions(x){
 const f=!!S.fav[x.id];
 let h=`<div class="acts"><button class="ch${f?" on":""}" data-fav="${x.id}" aria-pressed="${f}">${f?ICO.starOn:ICO.star}${f?"Dans le carnet":"Carnet"}</button><button class="ch" data-share="${x.id}">${ICO.share}Partager</button>`;
 if(C.carte.lieux[x.id])h+=`<button class="ch" data-map="${x.id}">${ICO.pin}Sur la carte</button>`;
 if(LIGNEE.includes(x.id))h+=`<button class="ch" data-o="lignee">${ICO.tree}Lignée</button>`;
 if(SM)h+=`<button class="ch" data-askabout="${esc(x.nom)}">${ICO.demander}Demander</button>`;
 return h+`</div>`}
function fiche(e){
 if(!vis(e)&&!S.force[e.id])return gate(e);
 const vj=(e.jeu||[]).filter(jv),sealed=(e.jeu||[]).length-vj.length;
 let h=`<p class="eb">${TYPES[e.t]} · <span class="src ${e.src}">${SRC[e.src]}</span></p><h2>${esc(e.nom)}</h2>`;
 if(e.alias&&e.alias.length)h+=`<p class="mu">Aussi appelé : ${esc(e.alias.join(", "))}</p>`;
 h+=`<p class="mu">${esc(e.role)}</p>`+actions(e)+`<p class="lead">${esc(e.resume)}</p>`;
 if(e.t==="livre")h+=kv("Titre original",esc(e.vo)+", "+e.annee)+kv("Genre",esc(e.genre))+`<p><button class="ch${S.lus[e.id]?" on":""}" data-lu="${e.id}" aria-pressed="${!!S.lus[e.id]}">${S.lus[e.id]?"Lu ✓":"Marquer comme lu"}</button></p>`;
 if(e.nouvelles)h+=`<h3>Les nouvelles</h3>`+e.nouvelles.map(n=>`<p><b>${esc(n.t)}.</b> ${esc(n.d)}</p>`).join("");
 if(e.livres)h+=bl("Dans les livres",e.livres);
 if(e.rev)h+=revOK(e)?bl("La suite dans les livres",e.rev,false,!S.sp&&!S.rv[e.id]&&e.rl?"Affiché car vous avez lu "+esc(livre(e.rl))+".":""):revBtn(e,e.id);
 if(vj.length||sealed)h+=`<div class="bl j"><h3>Dans le jeu</h3>${vj.map(l=>`<p>${esc(l.t)}</p>`).join("")}${sealed?`<p class="mu">${pl(sealed,"note")} masquée${sealed>1?"s":""} pour ne pas vous dévoiler la suite du jeu.</p>`:""}</div>`;
 h+=srcBlock(e.id);
 const dn=chips(e.dans||[]),vo=chips(e.voir||[]);
 if(dn)h+=`<h3>À lire pour le retrouver</h3>${dn}`;
 if(vo)h+=`<h3>Voir aussi</h3>${vo}`;
 return h}

function monstre(m){
 if(!vis(m)&&!S.force[m.id])return gate(m);
 return `<p class="eb">Bestiaire · ${esc(m.cl)}</p><h2>${esc(m.nom)}</h2>${m.en?`<p class="mu">En anglais : ${esc(m.en)}</p>`:""}`+actions(m)
  +kv("Huile",oil(m.cl))+kv("Signes",m.signes&&m.signes.map(sg).join(""))+kv("Bombes",m.bombes&&esc(m.bombes.join(", ")))
  +kv("Potions",m.potions&&esc(m.potions.join(", ")))+kv("Autres",m.autres&&esc(m.autres.join(", ")))+kv("Insensible à",m.immun&&sg(m.immun))
  +`<p>${esc(m.conseil)}</p>`+(m.origine?bl("Origines",m.origine):"")+(m.livres?bl("Dans les livres",m.livres):"")
  +srcBlock(m.id)+(m.lien&&chip(m.lien)?`<h3>Voir aussi</h3>${chips([m.lien])}`:"")}

function lignee(){
 const node=(id,nom,sub,cls)=>{const e=ID[id];const inner=`<b>${esc(nom)}</b>${sub?`<small>${sub}</small>`:""}`;
  return e&&vis(e)?`<button class="node ${cls||""}" data-o="${id}">${inner}</button>`:`<div class="node plain ${cls||""}">${inner}</div>`};
 const duny=revOK(ID.duny)?`le Hérisson d'Erlenwald, alias Emhyr var Emreis`:`le Hérisson d'Erlenwald`;
 return `<p>Le Sang Ancien de Lara Dorren se transmet de génération en génération jusqu'à Ciri. Touchez un nom pour ouvrir sa fiche.</p><div class="tree">
<div class="gen">${node("lara-dorren","Lara Dorren","magicienne elfe","k")}<span class="amp">et</span>${node("","Cregennan de Lod","mage humain")}</div><div class="ln"></div>
<div class="gen">${node("","Riannon","leur fille, élevée parmi les humains")}</div><div class="ln dash"></div>
<p class="gap">Plusieurs générations. Ciri porte d'ailleurs des noms hérités de sa lignée : Cirilla Fiona Elen Riannon.</p><div class="ln dash"></div>
<div class="gen">${node("calanthe","Calanthe","reine de Cintra, épouse ensuite Eist Tuirseach","k")}<span class="amp">et</span>${node("","Roegner d'Ebbing","premier époux")}</div><div class="ln"></div>
<div class="gen">${node("pavetta","Pavetta","princesse de Cintra","k")}<span class="amp">et</span>${node("duny","Duny",esc(duny),"k")}</div><div class="ln"></div>
<div class="gen">${node("ciri","Ciri","Zireael, l'enfant du Sang Ancien","me")}</div><div class="ln dash"></div>
<p class="gap">Liés à elle par le destin plutôt que par le sang</p>
<div class="gen">${node("geralt","Geralt","il l'a réclamée par la Loi de la Surprise")}${node("yennefer","Yennefer","sa mère de cœur")}</div></div>
${revOK(ID.duny)?"":revBtn(ID.duny,"duny")}${chips(["sang-ancien","loi-surprise","lara-dorren"])}`}

/* ---------- Carte ---------- */
const MW=400,MH=560;
let mv={x:0,y:0,w:MW,h:MH};
const COTE=[[178,0],[174,14],[164,26],[168,40],[156,52],[160,66],[148,78],[144,92],[152,104],[140,116],[138,128],[132,138],[126,148],[128,160],[120,172],[126,184],[116,196],[110,206],[112,218],[104,230],[114,242],[106,252],[100,264],[102,276],[94,288],[100,298],[92,310],[88,320],[94,332],[90,344],[100,356],[96,368],[106,380],[102,394],[112,406],[108,420],[118,434],[114,448],[124,462],[120,478],[130,492],[126,508],[136,522],[132,540],[140,560]];
const PONTAR=[[132,140],[150,146],[172,148],[192,142],[214,150],[236,144],[258,152],[282,146],[306,154],[330,148]];
const YARUGA=[[88,320],[108,318],[128,322],[150,316],[172,322],[196,316],[220,324],[244,318],[262,322],[286,316],[310,324],[336,318],[356,326]];
const MONTS=[[298,82],[352,86],[344,110],[300,114],[366,100],[374,150],[384,172],[372,192],[386,214],[376,236],[388,258],[252,234],[262,224],[286,228]];
const FORET=[[158,266],[168,262],[178,268],[162,280],[172,284],[182,278]];
const ILES=[[44,310,12,8,-20],[28,328,8,6,10],[60,330,7,5,0],[40,344,6,4,15],[64,296,7,5,-10],[100,211,4,3,0]];
const COURT={melitele:"Ellander","verger-blanc":"Verger Blanc",yaruga:"Yaruga",nilfgaard:"Nilfgaard",korath:"Korath"};
const GAUCHE={"dol-blathanna":1,"novigrad":1,"kaer-morhen":1};
const poly=p=>"M"+p.map(q=>q.join(" ")).join("L");
const court=e=>COURT[e.id]||e.nom.replace(/^(Le |La |Les |L')/,"");
function carteSVG(){
 const cur=new Set([...C.chapitres[S.ch].entrees,...(S.hos?C.dlc.hos.entrees:[]),...(S.bw?C.dlc.bw.entrees:[])]),k=mv.w/MW;
 const pins=Object.entries(C.carte.lieux).map(([id,[x,y]])=>{const e=any(id);if(!e||!vis(e))return"";const g=GAUCHE[id];
  return `<g class="pin ${e.src}${cur.has(id)?" here":""}${S.sel===id?" sel":""}" data-pin="${id}" data-x="${x}" data-y="${y}" transform="translate(${x} ${y}) scale(${k})" tabindex="0" role="button" aria-label="${esc(e.nom)}"><circle class="hit" r="16"/>${cur.has(id)?'<circle class="ring" r="12"/>':""}<circle class="dot" r="5.5"/><text x="${g?-9:9}" y="4"${g?' text-anchor="end"':""}>${esc(court(e))}</text></g>`}).join("");
 return `<svg id="map" viewBox="${mv.x} ${mv.y} ${mv.w} ${mv.h}" style="--k:${k}" role="img" aria-label="Carte schématique du Continent">
<rect x="-50" y="-50" width="${MW+100}" height="${MH+100}" fill="var(--sea)"/>
<path class="land" d="${poly(COTE)}L${MW+60} ${MH+60}L${MW+60} -60Z"/>
${ILES.map(([x,y,rx,ry,a])=>`<ellipse class="land" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})"/>`).join("")}
${FORET.map(([x,y])=>`<circle class="fo" cx="${x}" cy="${y}" r="5"/>`).join("")}
<path class="riv" d="${poly(PONTAR)}"/><path class="riv" d="${poly(YARUGA)}"/>
<path class="mt" d="${MONTS.map(([x,y])=>`M${x-6} ${y+4}L${x} ${y-5}L${x+6} ${y+4}`).join("")}"/>
<text class="rl" x="292" y="140" style="font-size:calc(var(--k) * 11px)">Pontar</text>
${C.carte.regions.map(r=>`<text class="rg${r.mer?" mer":""}" x="${r.x}" y="${r.y}" style="font-size:calc(var(--k) * ${r.mer?12:12.5}px)">${esc(r.t)}</text>`).join("")}
${pins}</svg>`}
function mapCard(){const e=S.sel&&any(S.sel);if(!e||!vis(e))return"";
 return `<div class="mapcard" id="mapcard"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><p class="eb" style="margin:6px 0 0">${TYPES[e.t]} · <span class="src ${e.src}">${SRC[e.src]}</span></p><button class="ic" data-act="mapclose" aria-label="Fermer">${ICO.close}</button></div><h3 class="ct">${esc(e.nom)}</h3><p class="mu sm">${esc(e.role)}</p><button class="pr" data-o="${e.id}">Ouvrir la fiche</button></div>`}
function carte(){
 const pl=Object.keys(C.carte.lieux).map(i=>any(i)).filter(e=>e&&vis(e)).sort((a,b)=>a.nom.localeCompare(b.nom,"fr"));
 const hc=C.carte.horsCarte.map(i=>ID[i]).filter(e=>e&&vis(e));
 return `<div class="mapw"><div id="mapsvg">${carteSVG()}</div><div class="mapctl"><button class="ic" data-zoom="in" aria-label="Zoomer">${ICO.plus}</button><button class="ic" data-zoom="out" aria-label="Dézoomer">${ICO.minus}</button><button class="ic" data-zoom="reset" aria-label="Voir toute la carte">${ICO.target}</button></div><div id="mapcardw">${mapCard()}</div></div>
<div class="legend"><span><i style="background:var(--bk)"></i>Livres</span><span><i style="background:var(--ac)"></i>Jeu</span><span><i style="background:var(--ink)"></i>Les deux</span><span><i style="border:2px solid var(--ac)"></i>Vous êtes ici</span></div>
<p class="mu sm">Carte schématique : les positions sont indicatives et les distances ne sont pas à l'échelle. Pincez pour zoomer, faites glisser pour vous déplacer.</p>
<h3 class="gh">Lieux de la carte<span>${pl.length}</span></h3>${pl.map(row).join("")}
${hc.length?`<h3 class="gh">Hors de la carte<span>${hc.length}</span></h3><p class="mu sm">Lieux sans position connue, ou situés dans un autre monde.</p>`+hc.map(row).join(""):""}`}
function setVB(){const s=$("#map");if(!s)return;const k=mv.w/MW;s.setAttribute("viewBox",`${mv.x} ${mv.y} ${mv.w} ${mv.h}`);s.style.setProperty("--k",k);
 s.querySelectorAll("[data-pin]").forEach(g=>g.setAttribute("transform",`translate(${g.dataset.x} ${g.dataset.y}) scale(${k})`))}
function clampV(){mv.x=Math.min(Math.max(mv.x,0),MW-mv.w);mv.y=Math.min(Math.max(mv.y,0),MH-mv.h)}
function zoomAt(base,f,fx,fy){const w=Math.min(MW,Math.max(100,base.w*f)),h=w*MH/MW;mv={x:base.x+(base.w-w)*fx,y:base.y+(base.h-h)*fy,w,h};clampV();setVB()}
function selectPin(id){S.sel=id;const w=$("#mapcardw");if(w)w.innerHTML=mapCard();
 document.querySelectorAll("#map [data-pin]").forEach(g=>g.classList.toggle("sel",g.dataset.pin===id));if(id)vib(6)}
function focusPin(id){const p=C.carte.lieux[id];if(!p)return;const w=180,h=w*MH/MW;mv={x:p[0]-w/2,y:p[1]-h/2,w,h};clampV()}
function mapInit(){
 const s=$("#map");if(!s||s.dataset.ok)return;s.dataset.ok=1;
 const pts=new Map();let st=null,moved=false,downPin=null;
 const snap=()=>({mv:{...mv},pts:new Map([...pts].map(([k,v])=>[k,{...v}]))});
 s.addEventListener("pointerdown",e=>{try{s.setPointerCapture(e.pointerId)}catch(_){}pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pts.size===1){moved=false;const g=e.target.closest&&e.target.closest("[data-pin]");downPin=g?g.dataset.pin:null}st=snap()});
 s.addEventListener("pointermove",e=>{if(!pts.has(e.pointerId)||!st)return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});const r=s.getBoundingClientRect();
  if(pts.size===1&&st.pts.size===1){const a=[...st.pts.values()][0],b=[...pts.values()][0],dx=b.x-a.x,dy=b.y-a.y;
   if(Math.hypot(dx,dy)>6)moved=true;if(!moved)return;const u=st.mv.w/r.width;mv={...st.mv,x:st.mv.x-dx*u,y:st.mv.y-dy*u};clampV();setVB()}
  else if(pts.size===2&&st.pts.size===2){moved=true;const[a,b]=[...pts.values()],[a0,b0]=[...st.pts.values()];
   const f=Math.hypot(a0.x-b0.x,a0.y-b0.y)/Math.max(1,Math.hypot(a.x-b.x,a.y-b.y));
   zoomAt(st.mv,f,((a0.x+b0.x)/2-r.left)/r.width,((a0.y+b0.y)/2-r.top)/r.height)}});
 const up=e=>{if(!pts.has(e.pointerId))return;pts.delete(e.pointerId);if(!moved&&e.type==="pointerup"&&pts.size===0)selectPin(downPin);st=pts.size?snap():null};
 s.addEventListener("pointerup",up);s.addEventListener("pointercancel",up);
 s.addEventListener("wheel",e=>{e.preventDefault();const r=s.getBoundingClientRect();zoomAt({...mv},e.deltaY>0?1.15:1/1.15,(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height)},{passive:false});
 s.addEventListener("keydown",e=>{const g=e.target.closest&&e.target.closest("[data-pin]");if(g&&(e.key==="Enter"||e.key===" ")){e.preventDefault();selectPin(g.dataset.pin)}})}

/* ---------- Livres ---------- */
function livres(){
 const seg=[["lecture","Lecture"],["contes","Contes"],["frise","Frise"],["ecrans","Écrans"]];
 return `<div class="seg" role="tablist" aria-label="Rubriques">${seg.map(([k,n])=>`<button role="tab" aria-selected="${S.lv===k}" class="${S.lv===k?"on":""}" data-lv="${k}">${n}</button>`).join("")}</div>`
  +({lecture,contes,frise,ecrans}[S.lv]||lecture)()}
function lecture(){
 const nl=BOOKS.filter(b=>S.lus[b.id]).length;
 const quand=id=>C.chapitres.filter(c=>c.lireIds.includes(id)).map(c=>c.court).concat(Object.values(C.dlc).filter(d=>d.lireIds.includes(id)).map(d=>d.nom));
 return `<p>Commencez par les deux recueils de nouvelles, puis lisez les cinq romans de la saga dans l'ordre. « La Saison des orages » se glisse où vous voulez après les nouvelles, et « La Croisée des corbeaux », une préquelle, se lit à tout moment.</p><p class="mu sm">Cochez les livres lus : leurs rebondissements s'afficheront d'eux-mêmes dans les fiches.</p>
<div class="prog"><div class="bar-p"><i style="width:${Math.round(nl/BOOKS.length*100)}%"></i></div><span>${nl} sur ${BOOKS.length} lus</span></div><ol class="books">`
 +BOOKS.map((b,i)=>{const q=quand(b.id),lu=!!S.lus[b.id];
  return `<li class="${lu?"lu":""}"><span class="num">${i+1}</span><div class="bi"><h3 class="ct"><button class="lnk" data-o="${b.id}">${esc(b.nom)}</button></h3><p class="mu sm">${esc(b.genre)} · ${esc(b.vo)}, ${b.annee}</p><p>${esc(b.resume)}</p>${q.length?`<p class="sm"><b>Idéal pendant :</b> ${esc(q.join(", "))}</p>`:""}<button class="ch${lu?" on":""}" data-lu="${b.id}" aria-pressed="${lu}">${lu?"Lu ✓":"Marquer comme lu"}</button></div></li>`}).join("")
 +`</ol><p class="mu sm">En français, la saga est publiée chez Bragelonne, et en poche chez Milady, dans la traduction de Laurence Dyèvre.</p>`}
function contes(){
 const card=s=>`<div class="srcard">${fig(s)}<p class="eb">${esc(s.origine)}</p><h3 class="ct">${esc(s.conte)}</h3><p class="mu sm">Dans le Sorceleur : ${esc(s.oeuvre)}</p><p>${esc(s.texte)}</p>${chips(s.liens)}</div>`;
 const fk=SRCS.filter(s=>s.groupe==="folklore"&&srcVis(s));
 return `<p>Sapkowski aime détourner les contes de notre enfance, et le jeu puise dans le folklore slave. Voici d'où viennent quelques-unes de leurs créatures et de leurs histoires.</p>
<h3 class="gh">Contes détournés</h3>${SRCS.filter(s=>s.groupe==="contes").map(card).join("")}
${fk.length?`<h3 class="gh">Folklore slave</h3>${fk.map(card).join("")}`:""}
<p class="mu sm">Illustrations du domaine public, issues de Wikimedia Commons. Le détail des œuvres figure dans les réglages.</p>`}
function frise(){
 const l=C.chrono.map((x,i)=>({...x,k:"f"+i})).filter(x=>!x.c||x.c<=S.ch);
 return `<p class="mu">Des origines du monde jusqu'aux jeux. Point bleu : les livres. Point ambre : les jeux.</p><div class="tl">`+l.map(x=>`<div class="ti ${x.jeu?"J":"L"}"><b>${esc(x.quand)}</b><br>${esc(x.titre)}`
  +(x.rev&&!revOK(x,x.k)?revBtn(x,x.k):`<p>${esc(x.d)}</p>`)
  +(x.lien&&chip(x.lien)?`<button class="ch" data-o="${x.lien}">Voir la fiche</button>`:"")+`</div>`).join("")+`</div>`}
function ecrans(){
 return `<p class="mu">Les jeux et adaptations nés des livres de Sapkowski. Point bleu : films et séries. Point ambre : jeux.</p><div class="tl">`
  +C.ecrans.map(x=>`<div class="ti ${x.jeu?"J":"L"}"><b>${esc(x.quand)}</b><br>${esc(x.titre)}<p>${esc(x.d)}</p></div>`).join("")+`</div>`}

/* ---------- Quiz ---------- */
function quiz(){
 const z=S.quiz;
 if(S.defi&&(!z||z.seed!==S.defi))return `<div class="card hi"><p class="eb">Défi n° ${esc(S.defi.toUpperCase())}</p><p>Un ami vous lance un défi : dix questions sur l'univers du Sorceleur, les mêmes pour tout le monde. Aucune ne dévoile la suite du jeu ni la fin des livres.</p><button class="pr wide" data-act="relever">Relever le défi</button></div><p><button class="ch" data-act="quit">Faire plutôt un quiz adapté à ma partie</button></p>`;
 if(!z)return `<p>Dix questions sur les livres, le bestiaire, les contes et la langue ancienne.</p><div class="card"><h3 class="ct">Quiz de ma partie</h3><p>Les questions s'adaptent à votre avancée dans le jeu et aux extensions commencées.</p><button class="pr wide" data-act="solo">Commencer</button></div><div class="card"><h3 class="ct">Défi entre amis</h3><p>Lancez un défi puis envoyez le lien : vos amis répondent aux mêmes questions, sans aucun spoiler pour personne.</p><button class="pr wide" data-act="defi">Lancer un défi</button></div>${S.record?`<p class="mu">Votre record : ${S.record.s} sur ${S.record.n}.</p>`:""}`;
 const n=z.qs.length,s=score(z);
 if(z.i>=n){const r=rang(s,n);
  return `<div class="card res"><p class="eb">${z.defi?"Défi n° "+esc(z.seed.toUpperCase()):"Résultat"}</p><p class="big">${s}<span> / ${n}</span></p><p class="eb">${r.t}</p><p>${r.d}</p></div><div class="row"><button class="pr" data-act="sharescore">${ICO.share}${z.defi?"Envoyer le défi":"Partager mon score"}</button><button class="ch" data-act="again">Rejouer</button></div>`
   +`<h3>Récapitulatif</h3><ol class="recap">`+z.qs.map((q,i)=>`<li class="${z.ans[i]===q.ok?"ok":"ko"}">${esc(q.q)}<br><span class="mu">${esc(q.opts[q.ok])}</span></li>`).join("")+`</ol>`}
 const q=z.qs[z.i],a=z.ans[z.i];
 return `${z.defi?`<p class="eb">Défi n° ${esc(z.seed.toUpperCase())}</p>`:""}<div class="prog"><div class="bar-p"><i style="width:${Math.round((z.i+(a!=null?1:0))/n*100)}%"></i></div><span>${z.i+1} / ${n} · ${pl(s,"point")}</span></div><p class="qq">${esc(q.q)}</p>${opts(q,a,"qa")}`
  +(a!=null?feedback(q,a)+`<p><button class="pr wide" data-act="next">${z.i+1<n?"Question suivante":"Voir mon score"}</button></p>`:"")
  +`<p><button class="ch" data-act="quit">Abandonner</button></p>`}

function demander(){
 if(!SM)return `<p>Les questions à Claude ne sont possibles que dans la version du compagnon publiée sur Claude.</p>${LIEN.artifact?`<p><a href="${esc(LIEN.artifact)}" target="_blank" rel="noopener">Ouvrir cette version</a></p>`:""}`;
 const ex=["Qu'est-ce que la Loi de la Surprise ?","Pourquoi Geralt a-t-il les cheveux blancs ?","Quelle différence entre les Aen Seidhe et les Aen Elle ?","Quel livre lire en ce moment ?"];
 return `<p class="mu">Posez une question sur les livres ou le monde du Sorceleur. La réponse tient compte de votre avancée dans le jeu et des livres que vous avez lus.</p><div class="chips">${ex.map(x=>`<button class="ch" data-ex="${esc(x)}">${esc(x)}</button>`).join("")}</div><textarea id="qs" rows="3" placeholder="Par exemple : qui sont les Aen Elle ?" aria-label="Votre question">${esc(S.ask.q)}</textarea><p class="row"><button class="pr" id="go"${S.ask.busy?" disabled":""}>Poser la question</button><button class="ch" id="stop"${S.ask.busy?"":" hidden"}>Arrêter</button></p><div id="out" class="out" aria-live="polite">${esc(S.ask.out)}</div><p class="mu sm">Réponse générée par Claude à partir du codex et de ses propres connaissances : vérifiez les détails importants dans les livres.</p>`}

/* ---------- Installation, réglages ---------- */
function installHow(){
 if(standalone())return `<p>Le compagnon est installé sur cet appareil.</p>`;
 if(inFrame)return `<p>Pour l'installer comme une application, ouvrez-le depuis son site, puis ajoutez-le à votre écran d'accueil.</p><p><a href="${esc(LIEN.pages)}" target="_blank" rel="noopener">Ouvrir le site du compagnon</a></p>`;
 if(installEvt)return `<p>Ajoutez le compagnon à votre écran d'accueil : il s'ouvre comme une application et fonctionne hors ligne.</p><button class="pr" data-act="install">${ICO.install}Installer l'application</button>`;
 if(isIOS)return `<ol class="steps"><li>Touchez le bouton Partager de Safari, le carré avec une flèche vers le haut.</li><li>Choisissez « Sur l'écran d'accueil ».</li><li>Touchez « Ajouter ». Le compagnon s'ouvre ensuite comme une application, même hors ligne.</li></ol>`;
 return `<p>Dans le menu de votre navigateur, choisissez « Installer l'application » ou « Ajouter à l'écran d'accueil ». Le compagnon s'ouvrira ensuite comme une application, même hors ligne.</p>`}
function installCard(){if(standalone())return"";return `<div class="card"><p class="eb">Application</p><h3 class="ct">Gardez-le sous le pouce</h3>${installHow()}</div>`}
const sw=(id,on,label,sub)=>`<label class="line" for="${id}"><span>${label}${sub?`<small>${sub}</small>`:""}</span><input class="sw" type="checkbox" id="${id}"${on?" checked":""}></label>`;
function reglages(){
 const seg=(name,cur,list)=>`<div class="seg" role="radiogroup">${list.map(([k,n])=>`<button role="radio" aria-checked="${cur===k}" class="${cur===k?"on":""}" data-${name}="${k}">${n}</button>`).join("")}</div>`;
 return `<div class="set"><h3>Où en êtes-vous dans le jeu ?</h3>${C.chapitres.map((c,i)=>`<button class="pick" data-setch="${i}" aria-pressed="${i===S.ch}"><i></i><span>${esc(c.nom)}<small>${esc(c.lieux)}</small></span></button>`).join("")}
${sw("o-hos",S.hos,"J'ai commencé Hearts of Stone")}${sw("o-bw",S.bw,"J'ai commencé Blood and Wine")}</div>
<div class="set"><h3>Livres lus</h3><p class="mu sm">Les rebondissements d'un livre coché s'affichent d'eux-mêmes.</p>${BOOKS.map(b=>sw("lu-"+b.id,!!S.lus[b.id],esc(b.nom),esc(b.genre)+", "+b.annee)).join("")}
${sw("o-sp",S.sp,"Tout révéler des livres","Affiche toutes les suites, même des livres non cochés")}</div>
<div class="set"><h3>Affichage</h3>${inFrame?"":`<p class="sm">Thème</p>${seg("theme",S.theme,[["auto","Automatique"],["light","Clair"],["dark","Sombre"]])}`}
<p class="sm">Taille du texte</p>${seg("taille",S.taille,[["normal","Normale"],["grand","Grande"],["tres-grand","Très grande"]])}
${"wakeLock" in navigator?sw("o-eveil",S.eveil,"Garder l'écran allumé","Pratique quand le téléphone est posé près de la manette"):""}</div>
<div class="set"><h3>Application</h3>${installHow()}<div class="chips"><button class="ch" data-share="">${ICO.share}Partager le compagnon</button><button class="ch" data-act="onb">Revoir l'accueil</button></div>
${S.reset?`<div class="pend"><p>Effacer votre avancée, vos lectures et votre carnet sur cet appareil ?</p><div class="row"><button class="pr" data-act="reset-ok">Tout effacer</button><button class="ch" data-act="reset-no">Annuler</button></div></div>`:`<p><button class="lnk" data-act="reset">Effacer mes données</button></p>`}</div>
<div class="set"><h3>Crédits des illustrations</h3><p class="mu sm">Œuvres du domaine public, via Wikimedia Commons.</p>${SRCS.map(s=>`<p class="sm">${esc(credit(s))}. <a href="${esc(s.page)}" target="_blank" rel="noopener">Source</a></p>`).join("")}</div>
<p class="mu sm">Compagnon du Sorceleur, version ${VERSION}. Guide non officiel, réalisé par des fans. La saga du Sorceleur est l'œuvre d'Andrzej Sapkowski ; The Witcher est une série de jeux de CD Projekt Red.</p>`}

/* ---------- Accueil guidé ---------- */
function renderOnb(){
 const o=$("#onb");if(S.vu){o.hidden=true;o.innerHTML="";return}
 const n=standalone()?3:4,st=Math.min(S.onb,n-1);
 const dots=`<div class="dots" aria-hidden="true">${Array.from({length:n},(_,i)=>`<i class="${i===st?"on":""}"></i>`).join("")}</div>`;
 let h="";
 if(st===0)h=`<div class="hero">${EMBLEME}</div><h2>Compagnon du Sorceleur</h2><p>Le lore des livres d'Andrzej Sapkowski, au rythme de votre partie de The Witcher 3.</p><ul class="feat"><li>${ICO.codex}<span>Un codex de ${E.length} fiches qui ne dévoile rien de ce qui vient après dans le jeu.</span></li><li>${ICO.carte}<span>La carte du Continent, le bestiaire et la lignée de Ciri.</span></li><li>${ICO.invite}<span>Un quiz et des défis à envoyer à vos amis.</span></li></ul><div class="grow"></div>${dots}<button class="pr wide" data-onb="next">Commencer</button>`;
 else if(st===1)h=`<p class="eb">Étape 1</p><h2>Où en êtes-vous dans le jeu ?</h2><p class="mu">Tout ce qui vient après restera caché. Vous pourrez changer à tout moment.</p>${C.chapitres.map((c,i)=>`<button class="pick" data-onbch="${i}" aria-pressed="${i===S.ch}"><i></i><span>${esc(c.nom)}<small>${esc(c.lieux)}</small></span></button>`).join("")}${sw("onb-hos",S.hos,"J'ai commencé Hearts of Stone")}${sw("onb-bw",S.bw,"J'ai commencé Blood and Wine")}<div class="grow"></div>${dots}<div class="onbb"><button class="ch" data-onb="prev">Retour</button><button class="pr" data-onb="next">Continuer</button></div>`;
 else if(st===2)h=`<p class="eb">Étape 2</p><h2>Quels livres avez-vous lus ?</h2><p class="mu">Leurs rebondissements s'afficheront dans les fiches. Les autres resteront cachés derrière un bouton.</p>${BOOKS.map(b=>sw("onb-lu-"+b.id,!!S.lus[b.id],esc(b.nom),esc(b.genre))).join("")}<div class="grow"></div>${dots}<div class="onbb"><button class="ch" data-onb="prev">Retour</button><button class="pr" data-onb="${n===3?"done":"next"}">${n===3?"C'est parti":"Continuer"}</button></div>`;
 else h=`<p class="eb">Dernière étape</p><h2>Installez l'application</h2><p class="mu">Le compagnon s'ouvrira depuis votre écran d'accueil, en plein écran, même sans connexion.</p>${installHow()}<div class="grow"></div>${dots}<div class="onbb"><button class="ch" data-onb="prev">Retour</button><button class="pr" data-onb="done">${installEvt?"Plus tard":"C'est parti"}</button></div>`;
 o.innerHTML=`<div class="onbc" role="dialog" aria-modal="true" aria-label="Bienvenue">${h}</div>`;o.hidden=false}

/* ---------- Rendu ---------- */
const footer=()=>`<footer class="ft"><p>Guide non officiel, réalisé par des fans. La saga du Sorceleur est l'œuvre d'Andrzej Sapkowski ; The Witcher est une série de jeux de CD Projekt Red.</p></footer>`;
function renderBar(){
 const pushed=!!(S.id||S.page);
 const t=S.page?TITRES[S.page]:TITRES[S.tab];
 const left=pushed?`<button class="ic" data-b aria-label="Retour">${ICO.back}</button>`:`<span class="ic em" aria-hidden="true">${EMBLEME}</span>`;
 const right=(S.page==="recherche"?"":`<button class="ic" data-act="search" aria-label="Rechercher">${ICO.search}</button>`)
  +(pushed?(S.page==="reglages"?"":`<button class="ic" data-share="${esc(shareToken())}" aria-label="Partager cette page">${ICO.share}</button>`):`<button class="ic" data-o="reglages" aria-label="Réglages">${ICO.reglages}</button>`);
 $("#bar").innerHTML=`${left}<h1>${esc(t)}</h1>${right}`}
function renderTabs(){$("#tabs").innerHTML=TABS.map(([k,n])=>`<button data-tab="${k}" class="${k===S.tab?"on":""}"${k===S.tab?' aria-current="page"':""}>${ICO[k]}<span>${n}</span></button>`).join("")}
function render(){
 renderBar();renderTabs();
 const v=S.id?(ID[S.id]?fiche(ID[S.id]):monstre(MID[S.id])):S.page?({quiz,demander,reglages,recherche,lignee}[S.page])():({partie,codex,carte,bestiaire,livres}[S.tab]||partie)();
 $("#main").innerHTML=v+(S.page==="reglages"?"":footer());
 const r=$("#route .on");if(r){const p=r.parentNode;p.scrollLeft=r.offsetLeft-p.clientWidth/2+r.offsetWidth/2}
 if(S.tab==="carte"&&!S.id&&!S.page)mapInit();
 renderOnb()}

/* ---------- Navigation ---------- */
const cur=()=>{try{return decodeURIComponent(location.hash.slice(1))}catch(e){return""}};
const isRoot=t=>TABK.includes(t)||SEGS[t];
function go(t){if(cur()===t){mem[t]=0;route()}else location.hash=t}
function replaceHash(t){try{history.replaceState(null,"","#"+t)}catch(e){}trail[trail.length-1]=t}
function back(){if(trail.length>1)history.back();else go(S.page&&PAGES[S.page]||S.tab)}
function parse(t){
 const from=S.tab;S.id=null;S.page=null;S.defi=null;
 if(SEGS[t]){S.tab="livres";S.lv=t}
 else if(t==="livres"){S.tab="livres";S.lv="lecture"}
 else if(TABK.includes(t))S.tab=t;
 else if(t in PAGES){S.page=t;if(PAGES[t])S.tab=PAGES[t]}
 else if(/^defi-[a-z0-9]{3,12}$/.test(t)){S.page="quiz";S.tab="partie";S.defi=t.slice(5)}
 else if(ID[t]){S.id=t;S.tab=ID[t].t==="livre"?"livres":ID[t].t==="lieu"&&from==="carte"?"carte":"codex"}
 else if(MID[t]){S.id=t;S.tab="bestiaire"}
 else S.tab="partie";
 if(S.id&&(vis(any(S.id))||S.force[S.id])){S.hist=[S.id,...S.hist.filter(i=>i!==S.id)].slice(0,12);save()}}
function route(){
 const t=cur()||"partie",prevRoot=isRoot(trail[trail.length-1]||"partie");
 const popped=trail.length>1&&trail[trail.length-2]===t;
 if(isRoot(t))trail=[t];else if(popped)trail.pop();else if(trail[trail.length-1]!==t)trail.push(t);
 parse(t);
 const apply=()=>{render();scrollTo(0,popped||isRoot(t)?mem[t]||0:0)};
 if(!first&&document.startViewTransition&&!calme()){document.documentElement.dataset.nav=popped?"pop":isRoot(t)&&prevRoot?"tab":"push";document.startViewTransition(apply)}
 else apply();
 first=false}
addEventListener("hashchange",ev=>{try{mem[decodeURIComponent(new URL(ev.oldURL).hash.slice(1))||"partie"]=scrollY}catch(e){}route()});
const shareToken=()=>S.id||(S.defi?"defi-"+S.defi:S.page&&S.page!=="reglages"&&S.page!=="recherche"?S.page:S.tab==="partie"?"":S.tab==="livres"&&S.lv!=="lecture"?S.lv:S.tab);
/* La recherche s'ouvre sans délai pour que le clavier apparaisse aussi sur iPhone. */
function openSearch(){
 mem[cur()||"partie"]=scrollY;
 if(cur()!=="recherche"){try{history.pushState(null,"","#recherche")}catch(e){location.hash="recherche";return}trail.push("recherche")}
 parse("recherche");render();scrollTo(0,0);const q=$("#q");if(q){q.focus();q.select()}}
/* Glisser depuis le bord gauche pour revenir en arrière dans l'application installée sur iPhone. */
let swipe=null;
if(isIOS&&navigator.standalone){
 addEventListener("touchstart",e=>{const t=e.touches[0];swipe=e.touches.length===1&&t.clientX<24&&(S.id||S.page)?{x:t.clientX,y:t.clientY}:null},{passive:true});
 addEventListener("touchmove",e=>{if(!swipe)return;const dx=e.touches[0].clientX-swipe.x;$("#main").style.transform=dx>0?`translateX(${Math.min(dx,140)*.4}px)`:""},{passive:true});
 addEventListener("touchend",e=>{if(!swipe)return;const t=e.changedTouches[0];$("#main").style.transform="";if(t.clientX-swipe.x>70&&Math.abs(t.clientY-swipe.y)<70)back();swipe=null});
}

/* ---------- Partage ---------- */
function shareBase(){if(!inFrame&&/^https?:$/.test(location.protocol))return location.href.split("#")[0];return LIEN.pages}
const shareUrl=t=>shareBase()+(t?"#"+t:"");
const titleOf=t=>any(t)?any(t).nom:t.startsWith("defi-")?"ce défi":TITRES[t]||({contes:"les contes",frise:"la frise",ecrans:"les jeux et écrans"})[t]||"cette page";
function loadQR(){return qrLib||(qrLib=new Promise((ok,ko)=>{if(window.QRious)return ok(window.QRious);
 const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js";s.onload=()=>window.QRious?ok(window.QRious):ko();s.onerror=()=>{qrLib=null;ko()};document.head.appendChild(s)}))}
const drawQR=(c,url)=>loadQR().then(Q=>{new Q({element:c,value:url,size:c.width,padding:Math.round(c.width/14),background:"#ffffff",foreground:"#17262c",level:"M"});c.hidden=false});
function openSheet(tok,msg){
 const url=shareUrl(tok);sheetUrl=url;sheetMsg=msg||"";
 let h=msg?`<p>Votre message est prêt : copiez-le, puis collez-le dans votre conversation.</p><textarea id="sh-m" rows="4" readonly>${esc(msg+"\n"+url)}</textarea><p><button class="pr" data-copy="sh-m">Copier le message</button></p>`
  :`<p>Envoyez ce lien à vos amis. Chacun indique sa propre avancée dans le jeu, et le compagnon ne leur dévoile rien de ce qui vient après.</p><label class="mu sm" for="sh-l">${tok?"Lien vers "+esc(titleOf(tok)):"Lien vers le compagnon"}</label><div class="cp"><input id="sh-l" type="text" readonly value="${esc(url)}"><button class="pr" data-copy="sh-l">Copier</button></div>`;
 if(!inFrame&&navigator.share)h+=`<p><button class="pr wide" id="sh-send">${ICO.share}Envoyer avec une application</button></p>`;
 if(tok&&!msg)h+=`<p><button class="lnk" data-share="">Partager plutôt l'accueil du compagnon</button></p>`;
 h+=`<div class="qrw"><canvas id="qr" width="400" height="400" role="img" aria-label="QR code du lien" hidden></canvas><p class="mu sm">À scanner avec l'appareil photo d'un téléphone.</p></div>`;
 if(location.protocol==="file:")h+=`<p class="mu sm">Vous consultez une copie enregistrée sur cet appareil. Vous pouvez aussi envoyer le fichier lui-même : il s'ouvre dans n'importe quel navigateur.</p>`;
 $("#sh-body").innerHTML=h;$("#sheet").hidden=false;$("#sh-x").focus();
 drawQR($("#qr"),url).catch(()=>{const w=$(".qrw");if(w)w.hidden=true})}
const closeSheet=()=>{$("#sheet").hidden=true};
function copy(id){const el=$("#"+id);if(!el)return;
 const fail=()=>{el.focus();el.select();toast("Texte sélectionné : copiez-le avec un appui long")};
 try{navigator.clipboard.writeText(el.value).then(()=>{toast(id==="sh-m"?"Message copié":"Lien copié");vib(8)},fail)}catch(e){fail()}}
function shareScore(){
 const z=S.quiz,s=score(z),n=z.qs.length,tok=z.defi?"defi-"+z.seed:"quiz";
 const msg=z.defi?`J'ai fait ${s}/${n} au défi n° ${z.seed.toUpperCase()} du Compagnon du Sorceleur. Mêmes questions pour toi, et aucun spoiler :`:`J'ai fait ${s}/${n} au quiz du Compagnon du Sorceleur. À ton tour :`;
 const url=shareUrl(tok);
 if(!inFrame&&navigator.share){navigator.share({title:"Compagnon du Sorceleur",text:msg,url}).catch(e=>{if(e&&e.name!=="AbortError")openSheet(tok,msg)});return}
 try{navigator.clipboard.writeText(msg+"\n"+url).then(()=>toast("Message copié : collez-le dans votre conversation"),()=>openSheet(tok,msg))}catch(e){openSheet(tok,msg)}}
function openLb(id){const s=SRCS.find(x=>x.id===id);if(!s)return;const l=$("#lb");
 l.innerHTML=`<img src="${s.img}" alt="${esc(s.conte)}"><p>${esc(credit(s))}. Domaine public.</p><button class="ch" id="lb-x">Fermer</button>`;l.hidden=false;$("#lb-x").focus()}

/* ---------- Demander à Claude ---------- */
async function ask(){
 const el=$("#qs"),q=(el?el.value:S.ask.q).trim();if(!q||!SM||S.ask.busy)return;
 S.ask.q=q;S.ask.busy=true;S.ask.out="Réflexion en cours…";ctl=new AbortController();
 const set=()=>{const o=$("#out"),g=$("#go"),s=$("#stop");if(o)o.textContent=S.ask.out;if(g)g.disabled=S.ask.busy;if(s)s.hidden=!S.ask.busy};set();
 const c=C.chapitres[S.ch],w=norm(q).split(/[^a-z0-9]+/).filter(x=>x.length>2);
 const sc=(txt,name)=>{const h=norm(txt),n=norm(name);return w.reduce((a,x)=>a+(h.includes(x)?1:0)+(n.includes(x)?2:0),0)};
 const top=(l,f,k)=>l.map(x=>[f(x),x]).filter(x=>x[0]>0).sort((a,b)=>b[0]-a[0]).slice(0,k).map(x=>x[1]);
 const ce=top(E.filter(vis),e=>sc([e.nom,...(e.alias||[]),e.role,e.resume].join(" "),e.nom),8).map(e=>[`## ${e.nom} (${e.role})`,e.resume,e.livres||"",e.rev&&revOK(e)?e.rev:"",(e.jeu||[]).filter(jv).map(l=>l.t).join(" ")].filter(Boolean).join("\n"));
 const cm=top(M.filter(vis),m=>sc([m.nom,m.en||"",m.cl].join(" "),m.nom),3).map(m=>[`## ${m.nom} (bestiaire, ${m.cl})`,"Conseil du jeu : "+m.conseil,m.livres||"",m.origine||""].filter(Boolean).join("\n"));
 const cw=top(C.lexique,x=>sc(x.mot+" "+x.sens,x.mot),4).map(x=>`- ${x.mot} : ${x.sens}. ${x.note}`);
 const ctx=[...ce,...cm,...(cw.length?["## Langue ancienne\n"+cw.join("\n")]:[])].join("\n\n");
 const ext=[S.hos&&"Hearts of Stone",S.bw&&"Blood and Wine"].filter(Boolean).join(" et ")||"aucune";
 const lus=BOOKS.filter(b=>S.lus[b.id]).map(b=>"« "+b.nom+" »").join(", ")||"aucun";
 const prompt=`Tu es le compagnon d'un joueur de The Witcher 3: Wild Hunt et un expert des livres d'Andrzej Sapkowski (saga du Sorceleur). Réponds en français, en 8 phrases au plus, sans titres ni listes à puces, en distinguant ce qui vient des livres de ce qui vient des jeux. Si tu n'es pas sûr d'un détail, dis-le au lieu d'inventer.
Avancée du joueur : chapitre « ${c.nom} » (${c.lieux}) ; extensions commencées : ${ext}.
Livres déjà lus : ${lus}. Ordre de lecture conseillé : ${BOOKS.map(b=>b.nom).join(", ")}. Si on te demande quoi lire, tiens-en compte.
Spoilers : ne révèle rien du jeu qui dépasse ce chapitre. ${S.sp?"Le joueur accepte les spoilers sur la fin des livres.":"Ne révèle pas les rebondissements des livres qu'il n'a pas lus : si la question l'exige, préviens d'abord et reste allusif."}

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

/* ---------- Thème, écran, installation ---------- */
function applyDisplay(){
 const r=document.documentElement;
 if(!inFrame){if(S.theme==="auto")delete r.dataset.theme;else r.dataset.theme=S.theme}
 if(S.taille==="normal")delete r.dataset.taille;else r.dataset.taille=S.taille;
 const bg=getComputedStyle(r).getPropertyValue("--bg").trim();
 let m=document.getElementById("tc");if(!m){m=document.createElement("meta");m.name="theme-color";m.id="tc";document.head.prepend(m)}
 m.content=bg||"#17262c"}
async function setWake(on){
 try{if(on&&"wakeLock" in navigator){if(!wake){wake=await navigator.wakeLock.request("screen");wake.addEventListener("release",()=>{wake=null})}}
  else if(wake){await wake.release();wake=null}}catch(e){if(on&&document.visibilityState==="visible")toast("Impossible de garder l'écran allumé sur cet appareil")}}
document.addEventListener("visibilitychange",()=>{if(S.eveil&&document.visibilityState==="visible")setWake(true)});
try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",applyDisplay)}catch(e){}
addEventListener("beforeinstallprompt",e=>{e.preventDefault();installEvt=e;if(S.page==="reglages"||S.tab==="partie"||!S.vu)render()});
addEventListener("appinstalled",()=>{installEvt=null;toast("Compagnon installé sur votre écran d'accueil");render()});
async function install(){if(!installEvt)return;installEvt.prompt();try{await installEvt.userChoice}catch(e){}installEvt=null;render()}

/* ---------- Actions ---------- */
function startQuiz(defi,seed){S.quiz={seed,defi,qs:makeQuiz((defi?"defi-":"solo-")+seed,defi?SAFE:now(),10),i:0,ans:[]}}
function setCh(i){S.ch=i;S.pend=null;S.eclair=null;save()}
function act(a){
 const z=S.quiz;
 if(a==="search")openSearch();
 else if(a==="pend-ok"){setCh(S.pend);render()}
 else if(a==="pend-no"){S.pend=null;render()}
 else if(a==="solo"){startQuiz(false,newSeed());if(S.defi){S.defi=null;replaceHash("quiz")}render();scrollTo(0,0)}
 else if(a==="defi"){const s=newSeed();startQuiz(true,s);if(S.page==="quiz"){S.defi=s;replaceHash("defi-"+s);render();scrollTo(0,0)}else go("defi-"+s)}
 else if(a==="relever"){startQuiz(true,S.defi);render();scrollTo(0,0)}
 else if(a==="next"&&z){z.i++;if(z.i>=z.qs.length){const s=score(z);if(!S.record||s/z.qs.length>S.record.s/S.record.n){S.record={s,n:z.qs.length};save()}}render();scrollTo(0,0)}
 else if(a==="quit"||a==="again"){S.quiz=null;if(S.defi){S.defi=null;replaceHash("quiz")}render();scrollTo(0,0)}
 else if(a==="sharescore"&&z)shareScore();
 else if(a==="mapclose")selectPin(null);
 else if(a==="install")install();
 else if(a==="onb"){S.vu=false;S.onb=0;render()}
 else if(a==="reset"){S.reset=true;render()}
 else if(a==="reset-no"){S.reset=false;render()}
 else if(a==="reset-ok"){try{localStorage.removeItem("cs")}catch(e){}Object.assign(S,{ch:0,hos:false,bw:false,sp:false,lus:{},vu:false,record:null,fav:{},hist:[],serie:null,theme:"auto",taille:"normal",eveil:false,reset:false,onb:0,quiz:null,eclair:null});setWake(false);applyDisplay();go("partie");render()}
 else if(a==="reload")location.reload()}

function onbStep(d){
 if(d==="next")S.onb++;else if(d==="prev")S.onb=Math.max(0,S.onb-1);
 else if(d==="done"){S.vu=true;S.onb=0;save();toast("Bonne route, sorceleur");render();return}
 renderOnb();const o=$("#onb");if(o)o.scrollTop=0}

document.addEventListener("click",ev=>{
 const t=ev.target.closest("button");
 if(!t){if(ev.target.id==="sheet")closeSheet();else if(ev.target.closest("#lb"))$("#lb").hidden=true;return}
 const d=t.dataset;
 if(d.i!==undefined){const i=+d.i;if(i>S.ch)S.pend=i;else setCh(i);render()}
 else if(d.o)go(d.o);
 else if(d.b!==undefined)back();
 else if(d.tab){if(d.tab===S.tab&&!S.id&&!S.page)scrollTo({top:0,behavior:calme()?"auto":"smooth"});else go(d.tab)}
 else if(d.t){S.ty=d.t;if(S.tab!=="codex"||S.id||S.page)go("codex");else render()}
 else if(d.c){S.cl=d.c;render()}
 else if(d.lv)go(d.lv==="lecture"?"livres":d.lv);
 else if(d.r){S.rv[d.r]=1;render()}
 else if(d.force){S.force[d.force]=1;parse(cur());render()}
 else if(d.lu){const k=d.lu;if(S.lus[k])delete S.lus[k];else S.lus[k]=1;save();render();vib(8);toast(S.lus[k]?"« "+ID[k].nom+" » marqué comme lu":"« "+ID[k].nom+" » retiré de vos lectures")}
 else if(d.fav){const k=d.fav;if(S.fav[k])delete S.fav[k];else S.fav[k]=1;save();render();vib(8);toast(S.fav[k]?"Ajouté au carnet":"Retiré du carnet")}
 else if(d.map){focusPin(d.map);S.sel=d.map;go("carte")}
 else if(d.zoom){if(d.zoom==="reset"){mv={x:0,y:0,w:MW,h:MH};setVB()}else zoomAt({...mv},d.zoom==="in"?1/1.4:1.4,.5,.5)}
 else if(d.an!==undefined){S.an++;render()}
 else if(d.ej!==undefined&&S.eclair&&S.eclair.a==null){S.eclair.a=+d.ej;vib(S.eclair.a===S.eclair.q.ok?12:[20,40,20]);
  const td=dayKey(),hier=dayKey(new Date(Date.now()-864e5));if(!S.serie||S.serie.jour!==td){S.serie={jour:td,n:S.serie&&S.serie.jour===hier?S.serie.n+1:1};save()}render()}
 else if(d.qa!==undefined&&S.quiz&&S.quiz.ans[S.quiz.i]==null){S.quiz.ans[S.quiz.i]=+d.qa;vib(+d.qa===S.quiz.qs[S.quiz.i].ok?12:[20,40,20]);render()}
 else if(d.act)act(d.act);
 else if(d.onb)onbStep(d.onb);
 else if(d.onbch!==undefined){S.ch=+d.onbch;S.eclair=null;save();renderOnb()}
 else if(d.setch!==undefined){setCh(+d.setch);render()}
 else if(d.theme){S.theme=d.theme;save();applyDisplay();render()}
 else if(d.taille){S.taille=d.taille;save();applyDisplay();render()}
 else if(d.share!==undefined)openSheet(d.share);
 else if(d.copy)copy(d.copy);
 else if(d.lb)openLb(d.lb);
 else if(d.ex){S.ask.q=d.ex;const x=$("#qs");if(x){x.value=d.ex;x.focus()}}
 else if(d.askabout){S.ask.q=`Que racontent les livres et le jeu sur ${d.askabout} ?`;go("demander")}
 else if(t.id==="go")ask();
 else if(t.id==="stop"&&ctl)ctl.abort();
 else if(t.id==="sh-x")closeSheet();
 else if(t.id==="lb-x")$("#lb").hidden=true;
 else if(t.id==="sh-send")navigator.share({title:"Compagnon du Sorceleur",text:sheetMsg||"Le lore des livres du Sorceleur, au rythme de ta partie de The Witcher 3.",url:sheetUrl}).catch(()=>{});
});
document.addEventListener("change",ev=>{const t=ev.target,id=t.id;if(!id)return;
 if(id==="o-hos"||id==="onb-hos"){S.hos=t.checked;S.eclair=null}
 else if(id==="o-bw"||id==="onb-bw"){S.bw=t.checked;S.eclair=null}
 else if(id==="o-sp")S.sp=t.checked;
 else if(id==="o-eveil"){S.eveil=t.checked;setWake(t.checked)}
 else if(id.startsWith("lu-")||id.startsWith("onb-lu-")){const k=id.replace(/^(onb-)?lu-/,"");if(t.checked)S.lus[k]=1;else delete S.lus[k]}
 else return;
 save();if(!id.startsWith("onb-"))render()});
document.addEventListener("input",ev=>{const t=ev.target;
 if(t.id==="q"){S.q=t.value;$("#lst").innerHTML=resultats()}
 else if(t.id==="bq"){S.bq=t.value;$("#blst").innerHTML=blst()}
 else if(t.id==="qs")S.ask.q=t.value});
document.addEventListener("keydown",ev=>{
 if(ev.key==="Escape"){if(!$("#lb").hidden)$("#lb").hidden=true;else if(!$("#sheet").hidden)closeSheet()}
 if(ev.key==="Enter"&&(ev.ctrlKey||ev.metaKey)&&ev.target.id==="qs")ask();
 if(ev.key==="Enter"&&ev.target.id==="q")ev.target.blur()});

/* ---------- Démarrage ---------- */
applyDisplay();
route();
if(S.eveil)setWake(true);
try{navigator.serviceWorker&&navigator.serviceWorker.addEventListener("message",e=>{if(e.data==="maj")toast("Nouvelle version du compagnon disponible","reload","Recharger")})}catch(e){}
if(matchMedia("(min-width: 900px)").matches){const c=$("#desk-qr");if(c)drawQR(c,LIEN.pages).catch(()=>{})}
(async()=>{try{if(!window.claude||!window.claude.use)return;const s=await window.claude.use("sample");
 if(s){SM=s;const f=document.activeElement;if(!(f&&/^(INPUT|TEXTAREA)$/.test(f.tagName)))render()}}catch(e){}})();
