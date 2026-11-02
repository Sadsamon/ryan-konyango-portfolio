// Portfolio — main.js
// Phase 2: preloader sequence + hero entrance.
// Phase 3: Three.js globe, pin click → section jump, return-pin logic.
// Phase 4: scroll-triggered project reveals + sticky metadata panel.
// Phase 6: terminal contact — command parser, history, draggable file chips.

document.addEventListener('DOMContentLoaded', () => {
  try {
    initGlobe();
    initReturnPins();
    initProjects();
    initTerminal();
  } catch (err) {
    console.error(err);

    const preloader = document.getElementById("preloader");
    if (preloader) preloader.style.display = "none";

    alert(err.message);
  }
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


// ==========================================================================
// PHASE 6 — TERMINAL CONTACT
// ==========================================================================

const CONTACT = {
  email: 'konyangoryan@gmail.com',
  github: 'https://github.com/Sadsamon',
  linkedin: 'https://linkedin.com/in/ryankonyango'
};

function initTerminal() {
  const term = document.getElementById('terminal');
  const body = document.getElementById('terminal-body');
  const out = document.getElementById('terminal-output');
  const input = document.getElementById('terminal-input');
  if (!term || !body || !out || !input) return;

  const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const history = [];
  let historyIndex = 0;

  // ---- output helpers (textContent only; never innerHTML) ----
  function line(text, cls) {
    const el = document.createElement('div');
    el.className = 'out-line' + (cls ? ' ' + cls : '');
    el.textContent = text;
    return el;
  }

  function linkEl(label, href) {
    const a = document.createElement('a');
    a.textContent = label;
    a.href = href;
    if (!href.startsWith('mailto:')) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    return a;
  }

  function labelled(label, label2, href) {
    const el = document.createElement('div');
    el.className = 'out-line';
    const k = document.createElement('span');
    k.className = 'out-muted';
    k.textContent = label.padEnd(10);
    el.append(k, linkEl(label2, href));
    return el;
  }

  function print(...els) {
    els.forEach(el => out.appendChild(el));
    body.scrollTop = body.scrollHeight;
  }

  // ---- virtual files + commands ----
  const FILES = {
    'about.txt':   () => [
      line('I build backend systems and full-stack platforms — from cultural archives to predictive pipelines — across Africa and Asia.'),
      line('I also take on freelance web and app design work.')
    ],
    'email.txt':   () => [labelled('email', CONTACT.email, 'mailto:' + CONTACT.email)],
    'socials.txt': () => [
      labelled('github', CONTACT.github, CONTACT.github),
      labelled('linkedin', CONTACT.linkedin, CONTACT.linkedin)
    ]
  };

  const COMMANDS = {
    help: () => [
      line('available commands:'),
      line('  help       list commands'),
      line('  ls         list files'),
      line('  cat <file> read a file'),
      line('  whoami     who am i'),
      line('  contact    email + socials'),
      line('  email      show email'),
      line('  socials    show profile links'),
      line('  projects   list projects'),
      line('  status     availability'),
      line('  clear      clear the terminal')
    ],
    ls: () => [line(Object.keys(FILES).join('  '))],
    cat: (args) => {
      if (!args[0]) return [line('cat: missing file operand', 'out-err')];
      if (!has(FILES, args[0])) return [line('cat: ' + args[0] + ': No such file or directory', 'out-err')];
      return FILES[args[0]]();
    },
    whoami:  () => [line('ryan — software developer / engineer, freelance web and app designer')],
    status:  () => [line('open to all forms of employment'), line('available for freelance web and app design')],
    contact: () => [...FILES['email.txt'](), ...FILES['socials.txt']()],
    email:   () => FILES['email.txt'](),
    socials: () => FILES['socials.txt'](),
    projects: () => Array.from(document.querySelectorAll('.project-card')).map((card, i) =>
      line(String(i + 1).padStart(2, '0') + '  ' + (card.dataset.title || ''))
    )
  };

  function run(raw) {
    const cmd = raw.trim();
    if (!cmd) return;

    const echo = document.createElement('div');
    echo.className = 'out-line';
    const prompt = document.createElement('span');
    prompt.className = 'terminal-prompt';
    prompt.textContent = 'ryan@portfolio:~$ ';
    echo.append(prompt, document.createTextNode(cmd));
    print(echo);

    history.push(cmd);
    historyIndex = history.length;

    const [name, ...args] = cmd.split(/\s+/);
    if (name === 'clear') {
      out.replaceChildren();
      return;
    }
    if (has(COMMANDS, name)) {
      print(...COMMANDS[name](args));
    } else {
      print(line('bash: ' + name + ': command not found', 'out-err'));
    }
  }

  // ---- keyboard: enter, history, tab-complete ----
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      run(input.value);
      input.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex > 0) input.value = history[--historyIndex];
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        input.value = history[++historyIndex];
      } else {
        historyIndex = history.length;
        input.value = '';
      }
    } else if (e.key === 'Tab' && input.value.trim()) {
      const parts = input.value.split(/\s+/);
      const pool = parts.length === 1 ? Object.keys(COMMANDS) : Object.keys(FILES);
      const matches = pool.filter(k => k.startsWith(parts[parts.length - 1]));
      if (matches.length === 1) {
        e.preventDefault();
        parts[parts.length - 1] = matches[0];
        input.value = parts.join(' ');
      }
    }
  });

  body.addEventListener('click', () => {
    if (!window.getSelection().toString()) input.focus({ preventScroll: true });
  });

  // ---- draggable file chips (tap or keyboard also works) ----
  const overTerminal = (ev) => {
    const r = term.getBoundingClientRect();
    return ev.clientX >= r.left && ev.clientX <= r.right &&
           ev.clientY >= r.top && ev.clientY <= r.bottom;
  };

  document.querySelectorAll('.file-chip').forEach(chip => {
    chip.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return;
      const startX = e.clientX, startY = e.clientY;
      const rect = chip.getBoundingClientRect();
      const offX = startX - rect.left, offY = startY - rect.top;
      let ghost = null, moved = false;
      chip.setPointerCapture(e.pointerId);

      const cleanup = () => {
        chip.removeEventListener('pointermove', onMove);
        chip.removeEventListener('pointerup', onUp);
        chip.removeEventListener('pointercancel', onCancel);
        if (ghost) ghost.remove();
        chip.classList.remove('is-source');
        term.classList.remove('drop-ready');
      };

      const onMove = (ev) => {
        if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 6) {
          moved = true;
          ghost = chip.cloneNode(true);
          ghost.classList.add('dragging');
          ghost.setAttribute('aria-hidden', 'true');
          ghost.style.width = rect.width + 'px';
          document.body.appendChild(ghost);
          chip.classList.add('is-source');
        }
        if (moved) {
          ghost.style.left = (ev.clientX - offX) + 'px';
          ghost.style.top = (ev.clientY - offY) + 'px';
          term.classList.toggle('drop-ready', overTerminal(ev));
        }
      };

      const onUp = (ev) => {
        const drop = !moved || overTerminal(ev);
        cleanup();
        if (drop) run('cat ' + chip.dataset.file);
      };

      const onCancel = () => cleanup();

      chip.addEventListener('pointermove', onMove);
      chip.addEventListener('pointerup', onUp);
      chip.addEventListener('pointercancel', onCancel);
    });

    // Keyboard activation (Enter/Space) arrives as a click with detail 0
    chip.addEventListener('click', (e) => {
      if (e.detail === 0) run('cat ' + chip.dataset.file);
    });
  });

  print(line('Type `help` for commands, or drag a file onto this window.', 'out-muted'));
}
