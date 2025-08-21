/* =====================================================
   App bootstrap & namespaces
   ===================================================== */
const App = {
  init(){
    Utils.stampYear('year');
    // Disable heavy 3D for small screens or when user prefers reduced motion
    const small = window.matchMedia('(max-width: 640px)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!small && !reduced && Utils.webglSupported()) {
      Scene3D.init();
    } else {
      document.querySelector('.bg-canvas')?.remove();
    }
  }
};

/* ---------- Utilities ---------- */
const Utils = {
  stampYear(id){ const el = document.getElementById(id); if(el) el.textContent = new Date().getFullYear(); },
  webglSupported(){ try{ const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl')||c.getContext('experimental-webgl'))); } catch(e){ return false; } }
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
    const body = encodeURIComponent(`${msg}

From: ${name} <${email}>`);
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

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.minDistance = 3; controls.maxDistance = 12;

    // Lights
    scene.add(new THREE.HemisphereLight(0xffffff, 0x0b1220, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 0.7); dir.position.set(5,6,4); scene.add(dir);

    // Stars backdrop (lighter)
    scene.add(makeStars(280));

    // Title panel
    const title = makeGlassPanel(2.8, 1.2, 'Teja — DevOps & Trading');
    title.position.set(0, 0.9, 0); scene.add(title);

    // Profile tile
    const texLoader = new THREE.TextureLoader();
    const profileTex = texLoader.load(ASSETS.profile);
    const profilePlane = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshStandardMaterial({ map: profileTex, roughness:0.9, metalness:0.1 }));
    profilePlane.position.set(-2.4, 0.15, 0);
    profilePlane.userData = { title:'Umesh Teja Nareddy', img:ASSETS.profile, cap:'Hello! Thanks for stopping by.' };
    scene.add(profilePlane); clickable.push(profilePlane);

    // Project tiles
    ASSETS.tiles.forEach((t, i)=>{
      const tex = texLoader.load(t.img);
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.1), new THREE.MeshStandardMaterial({ map: tex, roughness:0.9, metalness:0.08 }));
      plane.position.set((i)*2.1 - 0.2, -0.25, 0);
      plane.rotation.y = (i-1)*0.18; plane.userData = t; plane.userData.floatPhase = Math.random()*Math.PI*2;
      scene.add(plane); clickable.push(plane);
    });

    raycaster = new THREE.Raycaster(); mouse = new THREE.Vector2();
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('click', onClick);
    window.addEventListener('resize', resize);

    animate();
  }

  function makeStars(count){
    const geo = new THREE.BufferGeometry(); const positions = new Float32Array(count*3);
    for(let i=0;i<count;i++){ positions[i*3+0]=(Math.random()-0.5)*60; positions[i*3+1]=(Math.random()-0.5)*40; positions[i*3+2]=-10-Math.random()*40; }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({ size:0.05, color:0x60a5fa }));
  }

  function makeGlassPanel(w,h,text){
    const group = new THREE.Group();
    const geo = THREE.RoundedBoxGeometry ? new THREE.RoundedBoxGeometry(w, h, 0.05, 6, 0.12) : new THREE.BoxGeometry(w,h,0.05);
    const panel = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color:0x0d1a2e, roughness:0.18, metalness:0.0, transmission:0.55, thickness:0.4, transparent:true }));
    group.add(panel);
    const tex = makeTextTexture(text, 620, 220);
    const tMesh = new THREE.Mesh(new THREE.PlaneGeometry(w*0.95, h*0.5), new THREE.MeshBasicMaterial({ map: tex, transparent:true }));
    tMesh.position.set(0,0,0.03); group.add(tMesh);
    return group;
  }

  function makeTextTexture(text, w, h){
    const c = document.createElement('canvas'); c.width=w; c.height=h; const ctx=c.getContext('2d');
    ctx.font = '700 42px Inter, system-ui, -apple-system, Segoe UI, Roboto'; ctx.fillStyle = '#e6edf3'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.clearRect(0,0,w,h); ctx.fillText(text, w/2, h/2);
    const tex = new THREE.CanvasTexture(c); tex.anisotropy = 8; return tex;
  }

  function onPointerMove(e){ const r = renderer.domElement.getBoundingClientRect(); mouse.x=((e.clientX-r.left)/r.width)*2-1; mouse.y=-((e.clientY-r.top)/r.height)*2+1; }
  function onClick(){ raycaster.setFromCamera(mouse, camera); const hits = raycaster.intersectObjects(clickable); if(hits.length){ const {title,img,cap}=hits[0].object.userData||{}; if(img){ Lightbox.open(title||'Project', img, cap||''); }}}
  function animate(){ requestAnimationFrame(animate); controls.update(); clickable.forEach(m=>{ m.position.y = (m.geometry.parameters.height===1.2?0.15:-0.25)+ Math.sin(performance.now()/1000+(m.userData.floatPhase||0))*0.03; }); renderer.render(scene,camera);} 
  function resize(){ const w=window.innerWidth, h=window.innerHeight; renderer?.setSize(w,h,false); if(camera){ camera.aspect=w/h; camera.updateProjectionMatrix(); } }

  return { init };
})();

// Boot
try{ App.init(); }catch(err){ console.warn('Init failed', err); document.querySelector('.bg-canvas')?.remove(); }