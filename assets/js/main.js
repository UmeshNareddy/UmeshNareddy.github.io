/* =====================================================
App bootstrap & namespaces
===================================================== */
const App = {
init(){
Utils.stampYear('year');
Scene3D.init();
}
};

/* ---------- Utilities ---------- */
const Utils = {
stampYear(id){ const el = document.getElementById(id); if(el) el.textContent = new Date().getFullYear(); }
};

/* ---------- Lightbox ---------- */
const Lightbox = {
el: document.getElementById('lightbox'),
open(title, src, cap){
document.getElementById('lb-title').textContent = title || '';
const img = document.getElementById('lb-img');
img.src = src || ''; img.alt = title || '';
document.getElementById('lb-cap').textContent = cap || '';
this.el.classList.add('open');
},
close(){ this.el.classList.remove('open'); },
};
Lightbox.el?.addEventListener('click', (e)=>{ if(e.target === Lightbox.el){ Lightbox.close(); } });
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape'){ Lightbox.close(); }});

/* ---------- Contact Form ---------- */
const ContactForm = {
submit(e){
e.preventDefault();
const name = document.getElementById('name').value.trim();
const email = document.getElementById('email').value.trim();
const msg = document.getElementById('message').value.trim();
const subject = encodeURIComponent('Website inquiry from ' + name);
const body = encodeURIComponent(`${msg}\n\nFrom: ${name} <${email}>`);
window.location.href = `mailto:nareddyumesh@gmail.com?subject=${subject}&body=${body}`;
document.getElementById('form-status').textContent = 'Opening your email app…';
}
};

/* ---------- 3D Scene (Three.js) ---------- */
const Scene3D = (()=>{
let renderer, scene, camera, controls, raycaster, mouse;
const clickable = [];

// Assets
const ASSETS = {
profile: 'assets/profile.jpg',
tiles: [
{img:'assets/project_cost.webp', title:'Kubernetes Cost Guard', cap:'Rightsizing & autoscaling (‑28% cost)'},
{img:'assets/project_observability.webp', title:'Observability Hub', cap:'Unified logs/metrics/traces (‑35% MTTR)'},
{img:'assets/project_trade.webp', title:'Intraday Strategy Lab', cap:'Event‑driven backtests & live PnL'}
]
};

function init(){
const canvas = document.getElementById('scene3d');
renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
resize();

scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 200);
camera.position.set(0, 1.6, 6);

try{ App.init(); }catch(err){ console.warn('Init failed', err); document.getElementById('scene3d').style.display='none'; }