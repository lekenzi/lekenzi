// Trial: little pixel-art cats that walk along the bottom of the page.
// Grab one by the scruff and drag it around (it turns to face you), click to make it hop.
// Remove this file + its <script> tag to undo.
(() => {
  const PX = 4, G = 16, W = G * PX, H = G * PX, GRAVITY = 1800;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // o outline · b fur · d stripes · w belly · e eyes · p pink (nose, inner ears)
  const COATS = [
    { o: '#5a2e0e', b: '#f29b4b', d: '#c96f22', w: '#fde8cf', e: '#1b1b1f', p: '#f48a9a' }, // orange tabby
    { o: '#33363e', b: '#9aa0ad', d: '#6c717e', w: '#e6e8ee', e: '#1b1b1f', p: '#f0a0ae' }, // gray
    { o: '#08090b', b: '#2b2d33', d: '#1d1f24', w: '#4a4d56', e: '#f2d548', p: '#d9798a' }, // black, yellow eyes
    { o: '#6b5434', b: '#f1e4cd', d: '#d6c19e', w: '#ffffff', e: '#1b1b1f', p: '#f48a9a' }, // cream
  ];

  const side = [
    '..........o...o.', '.........opo.opo', '.o.......obbbbbo', 'obo......obebbeo', 'obo......obbppbo',
    '.obooooooobbbbo.', '..obbbbbbbbbwwo.', '..obdbbdbbdbbwo.', '..obbbbbbbbbbbo.',
  ];
  const front = [
    '....o......o....', '...opo....opo...', '...obboooobbo...', '...obbbbbbbbo...',
    '...obebbbbebo...', '...obbbppbbbo...', '...obbbbbbbbo...', '..oooowwwwoooo..',
  ];
  const SPRITES = {
    walk1: [...side, '..obdo....obdo..', '.obo.do..obo.do.', '.oo...oo.oo...oo'],
    walk2: [...side, '...obdo...obdo..', '...obdo...obdo..', '...oooo...oooo..'],
    sit: [
      '..........o...o.', '.........opo.opo', '.........obbbbbo', '.........obebbeo', '..o......obbppbo',
      '.obo....obbbbbo.', '.obo...obbbbwwo.', '..obooobbdbbwwo.', '...obbbbdbbbwwo.', '...obbbbbbbbwwo.',
      '...obbbbbbbobbo.', '...oooooooooooo.',
    ],
    held1: [...front,
      '.obbobwwwwbobbo.', '.obbobwwwwbobbo.', '.oooobwwwwboooo.', '....obwwwwbo....',
      '....obbbbbbo.od.', '....obo..obo.od.', '....obo..obo.od.', '....ooo..ooo..o.'],
    held2: [...front,
      '.obbobwwwwbobbo.', '.oooobwwwwboooo.', '....obwwwwbo....', '....obwwwwbo....',
      '....obbbbbbo..od', '....obo..obo..od', '....ooo..obo..od', '.........ooo...o'],
  };
  const SCRUFF = { x: W / 2, y: 2 * PX }; // between the ears on the front-facing sprite

  // Render every frame for every coat once, as crisp data URLs.
  const render = (rows, coat) => {
    const c = document.createElement('canvas');
    c.width = c.height = G;
    const g = c.getContext('2d');
    const pad = G - rows.length; // sprites sit on the bottom edge
    rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (coat[ch]) { g.fillStyle = coat[ch]; g.fillRect(x, y + pad, 1, 1); }
    }));
    return c.toDataURL();
  };
  const FRAMES = COATS.map(coat => Object.fromEntries(Object.entries(SPRITES).map(([k, r]) => [k, render(r, coat)])));

  const style = document.createElement('style');
  style.textContent = `
  .cat{position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:50;cursor:grab;touch-action:none;
    user-select:none;-webkit-user-select:none;will-change:transform}
  .cat.held{cursor:grabbing;z-index:51}
  .cat .pose{width:100%;height:100%;transform-origin:${SCRUFF.x}px ${SCRUFF.y}px;transition:transform .3s steps(4)}
  .cat.held .pose{transition:transform .1s steps(2)}
  .cat img{width:100%;height:100%;display:block;image-rendering:pixelated;image-rendering:crisp-edges;
    transform-origin:50% 100%;pointer-events:none;-webkit-user-drag:none}
  .cat.left:not(.held):not(.fall) img{transform:scaleX(-1)}
  .cat.land img{transform:scale(1.25,.75)!important}
  .cat.left.land img{transform:scale(-1.25,.75)!important}
  .cat .meow{position:absolute;left:50%;top:-14px;transform:translateX(-50%);font:11px/1 var(--mono,monospace);
    color:var(--ink,#161922);background:var(--bg,#fff);border:2px solid var(--ink,#161922);border-radius:0;
    box-shadow:2px 2px 0 var(--ink,#161922);padding:3px 6px;opacity:0;pointer-events:none;white-space:nowrap}
  .cat .meow.on{opacity:1}`;
  document.head.appendChild(style);

  const floor = () => innerHeight - H;
  const snap = v => Math.round(v / PX) * PX;
  const pick = a => a[Math.random() * a.length | 0];
  const cats = [];

  COATS.forEach((_, i) => {
    const el = document.createElement('div');
    el.className = 'cat';
    el.innerHTML = '<div class="pose"><img alt=""></div><span class="meow"></span>';
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', 'A pixel cat. Drag to pick it up.');
    document.body.appendChild(el);
    const cat = {
      el, frames: FRAMES[i], img: el.querySelector('img'), pose: el.querySelector('.pose'), meow: el.querySelector('.meow'),
      x: Math.random() * (innerWidth - W), y: floor(), vy: 0, px: 0, vx: 0, anim: 0, frame: '',
      dir: Math.random() < .5 ? -1 : 1, speed: 26 + Math.random() * 20,
      state: 'walk', timer: 2 + Math.random() * 5, held: false, moved: false, downAt: null,
    };
    cats.push(cat);
    setState(cat, 'walk');
    bindDrag(cat);
  });

  function setState(cat, s) {
    cat.state = s; cat.anim = 0;
    for (const k of ['walk', 'sit', 'held', 'fall']) cat.el.classList.toggle(k, s === k);
  }

  function show(cat, name) {
    if (cat.frame !== name) { cat.frame = name; cat.img.src = cat.frames[name]; }
  }

  function say(cat, text) {
    cat.meow.textContent = text;
    cat.meow.classList.add('on');
    clearTimeout(cat.meowT);
    cat.meowT = setTimeout(() => cat.meow.classList.remove('on'), 900);
  }

  function bindDrag(cat) {
    const el = cat.el;
    let grabTimer;
    const pickUp = () => {
      cat.moved = true;
      setState(cat, 'held');
      say(cat, pick(['!?', 'mrow!', 'hey!', '...']));
    };
    el.addEventListener('pointerdown', e => {
      el.setPointerCapture(e.pointerId);
      cat.held = true; cat.moved = false; cat.downAt = [e.clientX, e.clientY];
      cat.grabX = e.clientX; cat.grabY = e.clientY; cat.px = cat.x; cat.vx = 0;
      grabTimer = setTimeout(pickUp, 180); // a long press also picks it up
      e.preventDefault();
    });
    el.addEventListener('pointermove', e => {
      if (!cat.held) return;
      cat.grabX = e.clientX; cat.grabY = e.clientY;
      if (!cat.moved && Math.hypot(e.clientX - cat.downAt[0], e.clientY - cat.downAt[1]) > 4) {
        clearTimeout(grabTimer); pickUp();
      }
    });
    const release = () => {
      if (!cat.held) return;
      clearTimeout(grabTimer);
      cat.held = false;
      cat.pose.style.transform = '';
      if (!cat.moved) { cat.vy = -420; say(cat, pick(['meow', 'mrrp?', 'prrr', 'mew!'])); }
      else cat.vy = 0;
      setState(cat, 'fall');
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
  }

  function land(cat) {
    cat.el.classList.add('land');
    setTimeout(() => cat.el.classList.remove('land'), 140);
  }

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(.05, (now - last) / 1000) || .016; last = now;
    const fl = floor();
    for (const cat of cats) {
      cat.anim += dt;
      if (cat.held && cat.state === 'held') {
        // Dangle from the scruff, belly toward the viewer, swinging with horizontal speed.
        cat.x = Math.max(-W / 2, Math.min(innerWidth - W / 2, cat.grabX - SCRUFF.x));
        cat.y = Math.max(-SCRUFF.y, Math.min(fl, cat.grabY - SCRUFF.y));
        const v = (cat.x - cat.px) / dt; cat.px = cat.x;
        cat.vx += (v - cat.vx) * .2;
        const swing = Math.round(Math.max(-30, Math.min(30, -cat.vx * .04)) / 10) * 10; // chunky steps
        cat.pose.style.transform = swing ? `rotate(${swing}deg)` : '';
        show(cat, (cat.anim * 4 | 0) % 2 ? 'held2' : 'held1');
      } else if (!cat.held) {
        if (cat.state === 'fall') {
          cat.vy += GRAVITY * dt; cat.y += cat.vy * dt;
          show(cat, (cat.anim * 10 | 0) % 2 ? 'held2' : 'held1'); // flailing on the way down
          if (cat.y >= fl) {
            const hard = cat.vy > 300;
            cat.y = fl; cat.vy = 0; setState(cat, 'walk'); cat.timer = 2 + Math.random() * 4;
            if (hard) land(cat);
          }
        } else {
          cat.y = fl;
          cat.timer -= dt;
          if (cat.timer <= 0) {
            if (cat.state === 'walk') { setState(cat, 'sit'); cat.timer = 1.5 + Math.random() * 3; }
            else { setState(cat, 'walk'); if (Math.random() < .4) cat.dir *= -1; cat.timer = 3 + Math.random() * 6; }
          }
          if (cat.state === 'walk' && !reduced) {
            cat.x += cat.dir * cat.speed * dt;
            if (cat.x <= 0) { cat.x = 0; cat.dir = 1; }
            if (cat.x >= innerWidth - W) { cat.x = innerWidth - W; cat.dir = -1; }
            show(cat, (cat.anim * 5 | 0) % 2 ? 'walk2' : 'walk1');
          } else show(cat, cat.state === 'sit' ? 'sit' : 'walk2');
        }
        cat.x = Math.max(0, Math.min(innerWidth - W, cat.x));
      }
      cat.el.classList.toggle('left', cat.dir < 0);
      // Snap to the pixel grid so movement feels like a sprite, not a smooth vector.
      cat.el.style.transform = `translate(${snap(cat.x)}px,${snap(cat.y)}px)`;
    }
    requestAnimationFrame(tick);
  }
  addEventListener('resize', () => cats.forEach(c => { c.x = Math.min(c.x, innerWidth - W); if (c.y > floor()) c.y = floor(); }));
  requestAnimationFrame(tick);
})();
