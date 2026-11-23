// Portfolio — main.js
document.addEventListener('DOMContentLoaded', () => {
  [
    runPreloader, initGlobe, initReturnPins, initProjects,
    initProjectTerminal, initTerminal, initContactButtons, initSafetyNet
  ].forEach((init) => {
    try { init(); } catch (err) { console.error(init.name + ' failed:', err); }
  });
});

function runPreloader() {
  const preloader = document.getElementById('preloader');
  const countEl = document.getElementById('preloader-count');
  if (!preloader || !countEl) return;

  if (typeof gsap === 'undefined') {
    preloader.style.display = 'none';
    return;
  }

  const counter = { value: 0 };
  const tl = gsap.timeline({
    onComplete: () => {
      preloader.style.pointerEvents = 'none';
      animateHeroIn();
    }
  });

  tl.to(counter, {
    value: 100, duration: 1.4, ease: 'power1.inOut',
    onUpdate: () => { countEl.textContent = Math.round(counter.value); }
  }).to(preloader, { autoAlpha: 0, duration: 0.6, ease: 'power1.out' }, '+=0.1');
}

function animateHeroIn() {
  if (typeof gsap === 'undefined') return;
  const tl = gsap.timeline();
  tl.from('.hero-type', { autoAlpha: 0, x: -40, duration: 0.7, ease: 'power2.out' })
    .from('.hero-frame', { autoAlpha: 0, y: 30, duration: 0.7, ease: 'power2.out' }, '-=0.4')
    .from('.hero-copy', { autoAlpha: 0, y: 20, duration: 0.6, ease: 'power2.out' }, '-=0.4');
}

// ==========================================================================
// 3D GLOBE
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
  document.querySelectorAll('.pin-btn').forEach(btn => {
    btn.addEventListener('click', () => goToRegion(btn.dataset.region));
  });

  const canvas = document.getElementById('globe-canvas');
  if (!canvas) return;
  if (typeof THREE === 'undefined') {
    canvas.parentElement.style.display = 'none';
    return;
  }

  try {
    const stage = canvas.parentElement;
    const rect = stage.getBoundingClientRect();
    const width = rect.width || 300;
    const height = rect.height || 300;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 6);
    defaultCameraPos = camera.position.clone();

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const base = new THREE.Mesh(new THREE.SphereGeometry(2, 24, 24), new THREE.MeshBasicMaterial({ color: 0x2b2118, transparent: true, opacity: 0.9 }));
    globeGroup.add(base);

    const wire = new THREE.Mesh(new THREE.SphereGeometry(2.01, 24, 16), new THREE.MeshBasicMaterial({ color: 0x8c8177, wireframe: true, transparent: true, opacity: 0.35 }));
    globeGroup.add(wire);

    REGIONS.forEach(region => {
      const pos = latLonToVector3(region.lat, region.lon, 2.05);
      const pin = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), new THREE.MeshBasicMaterial({ color: 0xe67e22 }));
      pin.position.copy(pos);
      pin.userData = { region: region.id };
      globeGroup.add(pin);
      pins.push(pin);
    });

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    canvas.addEventListener('click', onGlobeClick);
    window.addEventListener('resize', onGlobeResize);
    animateGlobe();
  } catch (error) {
    console.error('WebGL failed.', error);
    canvas.parentElement.style.display = 'none';
  }
}

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
}

function onGlobeResize() {
  const canvas = document.getElementById('globe-canvas');
  if (!canvas || !renderer) return;
  const rect = canvas.parentElement.getBoundingClientRect();
  const width = rect.width || 300;
  const height = rect.height || 300;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
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
  if (!region) return;

  document.querySelectorAll('.pin-btn').forEach(btn => {
    btn.setAttribute('aria-current', btn.dataset.region === regionId ? 'true' : 'false');
  });

  if (!camera) {
    const fallbackTarget = document.getElementById('exp-' + regionId);
    if (fallbackTarget) fallbackTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  idleRotation = false;
  const pinPos = latLonToVector3(region.lat, region.lon, 2.05);
  const zoomTarget = pinPos.clone().normalize().multiplyScalar(3.4);

  const target = document.getElementById('exp-' + regionId);
  
  if (typeof gsap !== 'undefined') {
    gsap.to(camera.position, {
      x: zoomTarget.x, y: zoomTarget.y, z: zoomTarget.z, duration: 1.1, ease: 'power2.inOut',
      onUpdate: () => camera.lookAt(0, 0, 0),
      onComplete: () => { if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  } else {
    camera.position.set(zoomTarget.x, zoomTarget.y, zoomTarget.z);
    camera.lookAt(0, 0, 0);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function initReturnPins() {
  document.querySelectorAll('.return-pin').forEach(btn => {
    btn.addEventListener('click', () => {
      const globeSection = document.getElementById('globe');
      if (globeSection) globeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (camera && defaultCameraPos) {
        if (typeof gsap !== 'undefined') {
          gsap.to(camera.position, {
            x: defaultCameraPos.x, y: defaultCameraPos.y, z: defaultCameraPos.z,
            duration: 1, ease: 'power2.inOut', onUpdate: () => camera.lookAt(0, 0, 0), onComplete: () => { idleRotation = true; }
          });
        } else {
          camera.position.set(defaultCameraPos.x, defaultCameraPos.y, defaultCameraPos.z);
          camera.lookAt(0, 0, 0); idleRotation = true;
        }
      }
      document.querySelectorAll('.pin-btn').forEach(b => b.removeAttribute('aria-current'));
    });
  });
}

function animateGlobe() {
  requestAnimationFrame(animateGlobe);
  if (idleRotation && globeGroup) globeGroup.rotation.y += 0.0018;
  if (renderer && scene && camera) renderer.render(scene, camera);
}

// ==========================================================================
// PROJECTS: scroll reveal & HUD
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
  if (!inner || typeof gsap === 'undefined') return;
  gsap.fromTo(card, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.7, ease: 'steps(6)' });
  gsap.fromTo(inner.children, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.08, delay: 0.25 });
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
// SHARED TERMINAL HELPERS
// ==========================================================================

// Draggable file chips: drop on the terminal to run, or tap / press Enter.
function enableFileChips(chips, term, runFile) {
  const overTerminal = (ev) => {
    const r = term.getBoundingClientRect();
    return ev.clientX >= r.left && ev.clientX <= r.right &&
           ev.clientY >= r.top && ev.clientY <= r.bottom;
  };

  chips.forEach(chip => {
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
        if (drop) runFile(chip.dataset.file);
      };

      const onCancel = () => cleanup();

      chip.addEventListener('pointermove', onMove);
      chip.addEventListener('pointerup', onUp);
      chip.addEventListener('pointercancel', onCancel);
    });

    // Keyboard activation (Enter/Space) arrives as a click with detail 0
    chip.addEventListener('click', (e) => {
      if (e.detail === 0) runFile(chip.dataset.file);
    });
  });
}

// ==========================================================================
// PROJECT TERMINAL
// ==========================================================================
function initProjectTerminal() {
  const term = document.getElementById('project-terminal');
  const body = document.getElementById('project-terminal-body');
  const out = document.getElementById('project-terminal-output');
  const input = document.getElementById('project-terminal-input');
  if (!term || !body || !out || !input) return;

  const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const history = [];
  let historyIndex = 0;

  function line(text, cls) {
    const el = document.createElement('div');
    el.className = 'out-line' + (cls ? ' ' + cls : '');
    el.textContent = text;
    return el;
  }

  function print(...els) {
    els.forEach(el => out.appendChild(el));
    body.scrollTop = body.scrollHeight;
  }

  const PROJECT_FILES = {
    'annsana.txt': () => [
      line('--- ANNSANA (Cultural Preservation Platform) ---'),
      line('Inspiration: History, heritage, and cultural identity deserve robust, modern digital homes. I wanted to build a platform that transcends static archives and actively preserves cultural data with integrity and speed.'),
      line('Tools: Django 5, PostgreSQL 16, Celery, Redis, Tailwind CSS, Docker, and versioned REST APIs.'),
      line('Experience: Designing Annsana pushed me to master asynchronous media pipelines and complex relational data modeling. Handling heavy media assets cleanly in the background without blocking the main thread taught me invaluable lessons about real-world system responsiveness and data integrity.')
    ],
    'kenzim.txt': () => [
      line('--- KENZIM (Cross-Border Community & Social Media Platform) ---'),
      line('Inspiration: Born from my role bridging communities between Zimbabwe and Kenya, I needed a centralized space to manage joint initiatives, coordinate leadership efforts, and archive public events effectively.'),
      line('Tools: React, Tailwind CSS, Supabase (Auth + Postgres), Leaflet with OpenStreetMap, and Vercel, shipped as an installable PWA.'),
      line('Experience: Kenzim taught me to design around real constraints: role-based access for a multi-tier leadership structure, an admin review flow for new members, and an offline-capable app that runs entirely on free-tier infrastructure.')
    ],
    'unitrack.txt': () => [
      line('--- UNITRACK (Smart Notification & Attendance Engine) ---'),
      line('Inspiration: Academic administration shouldn\'t rely on guesswork. I wanted to build an intelligent tracking system that goes beyond simple logs to actively predict attendance patterns and keep stakeholders informed instantly.'),
      line('Tools: Node.js, MongoDB, Firebase triggers, and a Python Scikit-learn predictive model.'),
      line('Experience: Merging classical relational backend logic with a machine learning predictive pipeline (achieving 92% accuracy) was a breakthrough moment in understanding how data science and backend engineering feed into each other.')
    ],
    'etl.txt': () => [
      line('--- CONSTRUCTION ETL PIPELINE & FORECASTING MODEL ---'),
      line('Inspiration: Raw market data is messy and unstructured. I wanted to build a reliable data engineering pipeline that could ingest, clean, and forecast market pricing trends with high historical reliability.'),
      line('Tools: Python, PostgreSQL, Pandas, and Random Forest regression.'),
      line('Experience: Back-testing this pipeline over 5 years and hitting 82% forecasting accuracy taught me the rigorous discipline of data hygiene, schema design, and tuning automated ETL jobs for fault tolerance.')
    ],
    'ai-security.txt': () => [
      line('--- AI ASSISTANT & LOG AUDITING SECURITY FRAMEWORK ---'),
      line('Inspiration: Modern security monitoring produces an overwhelming ocean of logs. I wanted an intelligent guardian that could audit system logs autonomously and flag anomalies before they become vulnerabilities.'),
      line('Tools: Python, LangChain/LLMs, Celery, Redis, and PostgreSQL.'),
      line('Experience: Combining asynchronous task queues with LLM-driven inference required strict safety boundaries and efficient prompt-to-queue orchestration—sharpening my skills in building autonomous background agents.')
    ],
    'freelance.txt': () => [
      line('--- FREELANCE WEB APPLICATION (Zimbabwe Client) ---'),
      line('Inspiration: Real-world client delivery demands clean contracts, modular design, and razor-sharp execution under commercial timelines.'),
      line('Tools: React frontend, Supabase backend, PostgreSQL, and Tailwind CSS.'),
      line('Experience: Managing a client relationship independently while delivering a performant, production-grade web app at a professional hourly rate reinforced my ability to translate vague business requirements into clean, deployable software.')
    ],
    'community.txt': () => [
      line('--- COMMUNITY DEVELOPMENT & LEADERSHIP (Harare) ---'),
      line('Inspiration: Technology means nothing if we don\'t uplift the communities around us. Organizing a two-way development project at a local orphanage in Harare was about rolling up my sleeves and creating physical, lasting infrastructure for students.'),
      line('Tools: Project management, fundraising campaigns, brick-and-mortar execution, and grassroots leadership.'),
      line('Experience: Leading teams through high-stakes community projects taught me empathy, resilience, and cross-functional organization—skills that directly translate into how I lead technical teams today.')
    ]
  };

  const COMMAND_NAMES = ['help', 'ls', 'cat', 'clear'];

  function run(raw) {
    const cmd = raw.trim();
    if (!cmd) return;

    const echo = document.createElement('div');
    echo.className = 'out-line';
    const prompt = document.createElement('span');
    prompt.className = 'terminal-prompt';
    prompt.textContent = 'ryan@projects:~$ ';
    echo.append(prompt, document.createTextNode(cmd));
    print(echo);

    history.push(cmd);
    historyIndex = history.length;

    const [name, ...args] = cmd.split(/\s+/);
    if (name === 'clear') {
      out.replaceChildren();
    } else if (name === 'help') {
      print(line('available commands: ls, cat <file>, clear, help'));
    } else if (name === 'ls') {
      print(line(Object.keys(PROJECT_FILES).join('  ')));
    } else if (name === 'cat') {
      if (!args[0]) {
        print(line('cat: missing file operand', 'out-err'));
      } else if (!has(PROJECT_FILES, args[0])) {
        print(line('cat: ' + args[0] + ': No such file. Try `ls`', 'out-err'));
      } else {
        print(...PROJECT_FILES[args[0]]());
      }
    } else {
      print(line('bash: ' + name + ': command not found. Try `ls` or `cat <file>`', 'out-err'));
    }
  }

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
      const pool = parts.length === 1 ? COMMAND_NAMES : Object.keys(PROJECT_FILES);
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

  enableFileChips(document.querySelectorAll('#projects .file-chip'), term, (file) => run('cat ' + file));
}

// ==========================================================================
// CONTACT TERMINAL
// ==========================================================================
const CONTACT = {
  email:     'konyangoryan@gmail.com',
  github:    'https://github.com/Sadsamon',
  linkedin:  'https://www.linkedin.com/in/ryan-konyango-431800232',
  instagram: 'https://www.instagram.com/tech_no_talk',
  phone:     '+8618657168171'
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
    if (!href.startsWith('mailto:') && !href.startsWith('tel:')) {
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

  const FILES = {
    'about.txt': () => [
      line('I am Ryan Kevin Omondi Konyango (瑞安) — Backend Engineer & System Architect.'),
      line('Building resilient APIs, asynchronous pipelines, and scalable digital experiences across borders.'),
      line('Originally from Zimbabwe, I specialize in distributed systems, Python/Django, and data flows. Currently studying in Hangzhou, China.')
    ],
    'email.txt': () => [labelled('email', CONTACT.email, 'mailto:' + CONTACT.email)],
    'phone.txt': () => [labelled('phone', CONTACT.phone, 'tel:' + CONTACT.phone)],
    'socials.txt': () => [
      labelled('github', 'Sadsamon', CONTACT.github),
      labelled('linkedin', 'ryan-konyango', CONTACT.linkedin),
      labelled('instagram', '@tech_no_talk', CONTACT.instagram)
    ]
  };

  const COMMANDS = {
    help: () => [
      line('available commands:'),
      line('  help       list commands'),
      line('  ls         list files'),
      line('  cat <file> read a file'),
      line('  whoami     who am i'),
      line('  contact    email, phone + socials'),
      line('  email      show email'),
      line('  phone      show phone number'),
      line('  socials    show profile links'),
      line('  projects   list projects'),
      line('  status     availability'),
      line('  clear      clear the terminal')
    ],
    ls: () => [line(Object.keys(FILES).join('  '))],
    cat: (args) => {
      if (!args[0]) return [line('cat: missing file operand', 'out-err')];
      if (!has(FILES, args[0])) return [line('cat: ' + args[0] + ': No such file', 'out-err')];
      return FILES[args[0]]();
    },
    whoami:  () => [line('Ryan — Backend Engineer & System Architect.')],
    status:  () => [line('open to all forms of employment'), line('available for freelance web and app design')],
    contact: () => [...FILES['email.txt'](), ...FILES['phone.txt'](), ...FILES['socials.txt']()],
    email:   () => FILES['email.txt'](),
    phone:   () => FILES['phone.txt'](),
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

  enableFileChips(document.querySelectorAll('#contact .file-chip'), term, (file) => run('cat ' + file));

  print(line('Backend Engineer & System Architect. Building resilient APIs, asynchronous pipelines, and scalable digital experiences across borders.', 'out-muted'));
  print(line('Type `help` for commands, or drag a file onto this window.', 'out-muted'));
}

// ==========================================================================
// CONTACT BUTTONS + SAFETY NET
// ==========================================================================
function initContactButtons() {
  document.querySelectorAll('[data-copy-email]').forEach((btn) => {
    const label = btn.textContent;

    btn.addEventListener('click', async () => {
      const email = btn.dataset.copyEmail;
      let copied = false;

      try {
        await navigator.clipboard.writeText(email);
        copied = true;
      } catch (err) {
        const field = document.createElement('textarea');
        field.value = email;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        try { copied = document.execCommand('copy'); } catch (e) { /* ignore */ }
        field.remove();
      }

      // If copying is blocked, show the address itself so it can be copied by hand
      btn.textContent = copied ? 'Copied' : email;
      setTimeout(() => { btn.textContent = label; }, 2500);
    });
  });
}

// Never trap visitors behind the preloader if a library is slow or blocked
function initSafetyNet() {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  setTimeout(() => {
    const style = getComputedStyle(preloader);
    if (style.visibility !== 'hidden' && style.opacity !== '0') preloader.style.display = 'none';
  }, 8000);
}
