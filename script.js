/* =====================================================
   rebecca chang · portfolio interactions
   ===================================================== */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none)').matches;

  /* ---- header: shadow + scroll progress ---- */
  const header = $('.site-header');
  const bar = $('#progress');
  const onScroll = () => {
    header.classList.toggle('scrolled', scrollY > 10);
    const h = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- mobile nav ---- */
  const menu = $('.menu-btn');
  const nav = $('#nav');
  if (menu && nav) {
    menu.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', open);
    });
    $$('#nav a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  }

  /* ---- looping post carousel: manual scroll + arrows, wraps around forever ---- */
  $$('.loop').forEach(box => {
    const t = $('.loop-track', box);
    const items = [...t.children];
    const reps = Math.max(1, Math.ceil(box.clientWidth / (t.scrollWidth || 1)));
    const unit = [...items];
    for (let r = 1; r < reps; r++) items.forEach(c => { const k = c.cloneNode(true); t.appendChild(k); unit.push(k); });
    [...unit].reverse().forEach(c => t.insertBefore(c.cloneNode(true), t.firstChild));
    unit.forEach(c => t.appendChild(c.cloneNode(true)));
    const real = new Set(items);
    [...t.children].filter(c => !real.has(c)).forEach(c => {
      c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('img').forEach(i => { i.alt = ''; });
    });

    const S = t.scrollWidth / 3;          // width of one full set
    box.scrollLeft = S;                   // start on the middle set
    let busy = false, timer;
    const wrap = () => {
      const x = box.scrollLeft;
      if (x < S * 0.5) box.scrollLeft = x + S;
      else if (x > S * 1.5) box.scrollLeft = x - S;
    };
    box.addEventListener('scroll', () => { if (!busy) wrap(); }, { passive: true });
    const go = dir => {
      if (busy) return;
      busy = true;
      box.scrollBy({ left: dir * Math.round(box.clientWidth * 0.8), behavior: 'smooth' });
      clearTimeout(timer);
      timer = setTimeout(() => { busy = false; wrap(); }, 600);
    };
    const wrapper = box.parentElement;
    $('.prev', wrapper)?.addEventListener('click', () => go(-1));
    $('.next', wrapper)?.addEventListener('click', () => go(1));
  });

  /* ---- picture holders: if the image file isn't there, keep the placeholder ---- */
  $$('.photo img').forEach(img => {
    const holder = img.parentElement;
    const ok = () => holder.classList.add('filled');
    const bad = () => img.remove();
    if (img.complete) {
      img.naturalWidth > 0 ? ok() : bad();
    } else {
      img.addEventListener('load', ok);
      img.addEventListener('error', bad);
    }
  });

  /* ---- scroll reveal ---- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---- count-up numbers ---- */
  const cio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const el = e.target;
      const end = +el.dataset.count;
      const suf = el.dataset.suffix || '';
      if (reduce) { el.textContent = end + suf; return; }
      const t0 = performance.now();
      const dur = 1400;
      const step = t => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---- typing role line ---- */
  const typed = $('#typed');
  if (typed && !reduce) {
    const words = JSON.parse(typed.dataset.words);
    let w = 0, i = words[0].length, deleting = false;
    const tick = () => {
      const word = words[w];
      typed.textContent = word.slice(0, i);
      let delay = deleting ? 40 : 85;
      if (!deleting && i === word.length) { deleting = true; delay = 1600; }
      else if (deleting && i === 0) { deleting = false; w = (w + 1) % words.length; delay = 300; }
      i += deleting ? -1 : 1;
      setTimeout(tick, delay);
    };
    setTimeout(tick, 1800);
  }

  /* ---- marquee: duplicate content for a seamless loop ---- */
  $$('.marquee-track').forEach(t => { t.innerHTML += t.innerHTML; });

  /* ---- tabs ---- */
  $$('[data-tabs]').forEach(group => {
    const btns = $$('[data-tab]', group);
    const panels = $$('[data-panel]', group);
    btns.forEach(b => b.addEventListener('click', () => {
      btns.forEach(x => x.classList.toggle('on', x === b));
      panels.forEach(p => p.classList.toggle('on', p.dataset.panel === b.dataset.tab));
    }));
  });

  /* ---- flip cards (hover on desktop, tap on touch, Enter on keyboard) ---- */
  $$('.flip').forEach(f => {
    f.addEventListener('click', e => {
      if (e.target.closest('a')) return;
      if (touch) f.classList.toggle('flipped');
    });
    f.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f.classList.toggle('flipped'); }
    });
  });

  /* ---- draggable stickers ---- */
  $$('[data-drag]').forEach(el => {
    let sx = 0, sy = 0, ox = 0, oy = 0, drag = false;
    el.addEventListener('pointerdown', e => {
      drag = true; sx = e.clientX - ox; sy = e.clientY - oy;
      el.setPointerCapture(e.pointerId);
      el.classList.add('dragging');
    });
    el.addEventListener('pointermove', e => {
      if (!drag) return;
      ox = e.clientX - sx; oy = e.clientY - sy;
      el.style.translate = `${ox}px ${oy}px`;
    });
    const end = () => { drag = false; el.classList.remove('dragging'); };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  });

  /* ---- filter chips (resume + marketing) ---- */
  $$('[data-filter-group]').forEach(group => {
    const items = $$(`[data-scope="${group.dataset.filterGroup}"]`);
    const chips = $$('.chip', group);
    chips.forEach(chip => chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.toggle('on', c === chip));
      const f = chip.dataset.filter;
      items.forEach(it => {
        const hide = f !== 'all' && !it.dataset.cat.split(' ').includes(f);
        it.classList.toggle('hide', hide);
        if (!hide) { it.classList.remove('pop'); void it.offsetWidth; it.classList.add('pop'); }
      });
    }));
  });

  /* ---- accordions (resume) ---- */
  $$('.job-head').forEach(h => h.addEventListener('click', () => {
    const open = h.closest('.job').classList.toggle('open');
    h.setAttribute('aria-expanded', open);
  }));

  /* ---- carousel arrows ---- */
  $$('[data-rail-target]').forEach(b => b.addEventListener('click', () => {
    const rail = document.getElementById(b.dataset.railTarget);
    if (rail) rail.scrollBy({ left: +b.dataset.dir * rail.clientWidth * 0.8, behavior: 'smooth' });
  }));

  /* ---- lightbox (with prev/next + date/time caption for galleries) ---- */
  const lb = $('#lightbox');
  if (lb) {
    const lbImg = $('img', lb);
    const cap = $('#lb-cap');
    const prev = $('.prev', lb);
    const next = $('.next', lb);
    let group = [], idx = 0;
    const show = i => {
      idx = (i + group.length) % group.length;
      const ph = group[idx];
      const im = ph.querySelector('img');
      if (!im) return;
      lbImg.src = im.src;
      lbImg.alt = im.alt;
      if (cap) cap.textContent = [ph.dataset.date, ph.dataset.time].filter(Boolean).join('  ·  ');
    };
    const open = ph => {
      const g = ph.dataset.gallery;
      group = g ? $$(`.photo.filled[data-gallery="${g}"]`) : [ph];
      if (prev) prev.hidden = group.length < 2;
      if (next) next.hidden = group.length < 2;
      show(group.indexOf(ph));
      lb.classList.add('open');
    };
    const close = () => lb.classList.remove('open');
    document.addEventListener('click', e => {
      if (lb.classList.contains('open')) {
        if (e.target.closest('.prev')) return show(idx - 1);
        if (e.target.closest('.next')) return show(idx + 1);
        if (e.target.closest('#lightbox')) return close();
        return;
      }
      const ph = e.target.closest('.photo.filled[data-zoom]');
      if (ph) open(ph);
    });
    addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft' && group.length > 1) show(idx - 1);
      if (e.key === 'ArrowRight' && group.length > 1) show(idx + 1);
    });
  }

  /* ---- copy email ---- */
  function toast(msg) {
    let t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove('show'), 1900);
  }
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); } catch (_) { /* ignore */ }
    toast('email copied ✓');
  }));

  /* ---- coursework: category chips + search ---- */
  const search = $('#course-search');
  if (search) {
    const courses = $$('.course');
    const cards = $$('.note-card');
    const chips = $$('#cw-chips .chip');
    const count = $('#cw-count');
    let cat = 'all', q = '';
    const apply = () => {
      let shown = 0;
      courses.forEach(c => {
        const okCat = cat === 'all' || c.dataset.cat === cat;
        const okQ = !q || c.textContent.toLowerCase().includes(q);
        const ok = okCat && okQ;
        c.classList.toggle('dim', !ok);
        c.classList.toggle('match', ok && !!q);
        if (ok) shown++;
      });
      cards.forEach(n => n.classList.toggle('dim', !$('.course:not(.dim)', n)));
      if (count) count.textContent = `${shown} of ${courses.length} courses`;
    };
    chips.forEach(chip => chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.toggle('on', c === chip));
      cat = chip.dataset.cw;
      apply();
    }));
    search.addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); apply(); });
    apply();
  }

  /* ---- tiny sparkle on click ---- */
  if (!reduce) {
    document.addEventListener('click', e => {
      if (e.target.closest('input')) return;
      const s = document.createElement('span');
      s.className = 'sparkle';
      s.textContent = '✦';
      s.style.left = e.clientX + 'px';
      s.style.top = e.clientY + 'px';
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 900);
    });
  }
})();