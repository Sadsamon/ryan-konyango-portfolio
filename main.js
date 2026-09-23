// Portfolio — main.js
// Phase 2: preloader sequence + hero entrance.
// Phase 3: Three.js globe, pin click → section jump, return-pin logic.
// Phase 4: scroll-triggered project reveals + sticky metadata panel.
// Still to come:
//   Phase 6 — terminal command parser

document.addEventListener('DOMContentLoaded', () => {
  runPreloader();
  initGlobe();
  initReturnPins();
  initProjects();
});

function runPreloader() {
  const preloader = document.getElementById('preloader');
  const countEl = document.getElementById('preloader-count');
  const counter = { value: 0 };

  const tl = gsap.timeline({
    onComplete: () => {
      preloader.style.pointerEvents = 'none';
      animateHeroIn();
    }
  });

  tl.to(counter, {
    value: 100,
    duration: 1.4,
    ease: 'power1.inOut',
    onUpdate: () => { countEl.textContent = Math.round(counter.value); }
  })
  .to(preloader, {
    autoAlpha: 0,
    duration: 0.6,
    ease: 'power1.out'
  }, '+=0.1');
}

function animateHeroIn() {
  const tl = gsap.timeline();

  tl.from('.hero-type', { autoAlpha: 0, x: -40, duration: 0.7, ease: 'power2.out' })
    .from('.hero-frame', { autoAlpha: 0, y: 30, duration: 0.7, ease: 'power2.out' }, '-=0.4')
    .from('.hero-copy', { autoAlpha: 0, y: 20, duration: 0.6, ease: 'power2.out' }, '-=0.4');
}

// ==========================================================================
// PHASE 3 — 3D GLOBE
// ==========================================================================

const REGIONS = [
  { id: 'zimbabwe',     label: 'Zimbabwe',     lat: -17.83, lon: 31.05 },
  { id: 'south-africa', label: 'South Africa', lat: -26.20, lon: 28.05 },
  { id: 'kenya',        label: 'Kenya',        lat: -1.29,  lon: 36.82 },
  { id: 'india',        label: 'India',        lat: 31.32,  lon: 75.58 },
  { id: 'china',        label: 'China',        lat: 30.27,  lon: 120.16 }
];

let scene, camera, renderer, globeGroup, pins = [];
let defaultCameraPos;
let raycaster, mouse;
let idleRotation = true;

function initGlobe() {
  const canvas = document.getElementById('globe-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const stage = canvas.parentElement;
  const rect = stage.getBoundingClientRect();

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, rect.width / rect.height, 0.1, 100);
  camera.position.set(0, 0, 6);
  defaultCameraPos = camera.position.clone();

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(rect.width, rect.height);

  globeGroup = new THREE.Group();
  scene.add(globeGroup);

  const base = new THREE.Mesh(
    new THREE.SphereGeometry(2, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0x2b2118, transparent: true, opacity: 0.9 })
  );
  globeGroup.add(base);

  const wire = new THREE.Mesh(
    new THREE.SphereGeometry(2.01, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0x8c8177, wireframe: true, transparent: true, opacity: 0.35 })
  );
  globeGroup.add(wire);

  REGIONS.forEach(region => {
    const pos = latLonToVector3(region.lat, region.lon, 2.05);
    const pin = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xe67e22 })
    );
    pin.position.copy(pos);
    pin.userData = { region: region.id };
    globeGroup.add(pin);
    pins.push(pin);
  });

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  canvas.addEventListener('click', onGlobeClick);
  document.querySelectorAll('.pin-btn').forEach(btn => {
    btn.addEventListener('click', () => goToRegion(btn.dataset.region));
  });

  window.addEventListener('resize', onGlobeResize);
  animateGlobe();
}

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function onGlobeResize() {
  const canvas = document.getElementById('globe-canvas');
  if (!canvas || !renderer) return;
  const rect = canvas.parentElement.getBoundingClientRect();
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
  renderer.setSize(rect.width, rect.height);
}

function onGlobeClick(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(pins);
  if (hits.length) goToRegion(hits[0].object.userData.region);
}

function goToRegion(regionId) {
  const region = REGIONS.find(r => r.id === regionId);
  if (!region || !camera) return;

  document.querySelectorAll('.pin-btn').forEach(btn => {
    btn.setAttribute('aria-current', btn.dataset.region === regionId ? 'true' : 'false');
  });

  idleRotation = false;
  const pinPos = latLonToVector3(region.lat, region.lon, 2.05);
  const zoomTarget = pinPos.clone().normalize().multiplyScalar(3.4);

  gsap.to(camera.position, {
    x: zoomTarget.x, y: zoomTarget.y, z: zoomTarget.z,
    duration: 1.1,
    ease: 'power2.inOut',
    onUpdate: () => camera.lookAt(0, 0, 0),
    onComplete: () => {
      const target = document.getElementById('exp-' + regionId);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

function initReturnPins() {
  document.querySelectorAll('.return-pin').forEach(btn => {
    btn.addEventListener('click', () => {
      const globeSection = document.getElementById('globe');
      if (globeSection) globeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

      if (camera && defaultCameraPos) {
        gsap.to(camera.position, {
          x: defaultCameraPos.x, y: defaultCameraPos.y, z: defaultCameraPos.z,
          duration: 1,
          ease: 'power2.inOut',
          onUpdate: () => camera.lookAt(0, 0, 0),
          onComplete: () => { idleRotation = true; }
        });
      }
      document.querySelectorAll('.pin-btn').forEach(b => b.removeAttribute('aria-current'));
    });
  });
}

function animateGlobe() {
  requestAnimationFrame(animateGlobe);
  if (idleRotation && globeGroup) globeGroup.rotation.y += 0.0018;
  renderer.render(scene, camera);
}

// ==========================================================================
// PHASE 4 — PROJECTS: scroll reveal + sticky panel
// ==========================================================================

function initProjects() {
  const cards = document.querySelectorAll('.project-card');
  if (!cards.length) return;

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        revealProjectCard(entry.target);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  cards.forEach(card => revealObserver.observe(card));

  const panelObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActiveProject(entry.target);
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  cards.forEach(card => panelObserver.observe(card));

  setActiveProject(cards[0]);
}

function revealProjectCard(card) {
  const inner = card.querySelector('.project-reveal');

  gsap.fromTo(card,
    { clipPath: 'inset(0 100% 0 0)' },
    { clipPath: 'inset(0 0% 0 0)', duration: 0.7, ease: 'steps(6)' }
  );

  gsap.fromTo(inner.children,
    { autoAlpha: 0, y: 16 },
    { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.08, delay: 0.25 }
  );
}

function setActiveProject(card) {
  const title = document.getElementById('panel-title');
  const status = document.getElementById('panel-status');
  const stackEl = document.getElementById('panel-stack');
  if (!title || !status || !stackEl) return;

  title.textContent = card.dataset.title || '—';
  status.textContent = card.dataset.status || '';

  const stack = (card.dataset.stack || '').split(',').map(s => s.trim()).filter(Boolean);
  stackEl.innerHTML = '';
  stack.forEach(item => {
    const span = document.createElement('span');
    span.textContent = item;
    stackEl.appendChild(span);
  });
}
