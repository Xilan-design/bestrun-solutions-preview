/* BRS motion: progressive enhancement, native scrolling and readable source HTML. */
// Run in the head, before hero markup can paint. A failed library still leaves
// readable HTML: release the CSS guard here or through the bounded fallback.
const heroBootRoot = document.documentElement;
if (!matchMedia('(prefers-reduced-motion: reduce)').matches && !location.hash) {
  heroBootRoot.classList.add('brs-hero-pending');
  setTimeout(() => heroBootRoot.classList.remove('brs-hero-pending'), 3500);
}
document.addEventListener('DOMContentLoaded', () => {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) {
    heroBootRoot.classList.remove('brs-hero-pending');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const seen = new WeakSet();
  const completed = new WeakSet();
  const configs = new Map();
  const collect = (selector, kind) => {
    document.querySelectorAll(selector).forEach(node => {
      const closed = node.closest('details:not([open])');
      if ((!closed || closed === node) && !configs.has(node)) configs.set(node, kind);
    });
  };
  collect('main .brs-section-header, main .brs-section__column > .brs-title', 'heading');
  collect('main .brs-section__column > .brs-copy, main .brs-section__column > .brs-intro, main .brs-editorial__body > .brs-copy, main .brs-editorial__body > .brs-intro', 'text');
  collect('main .brs-grid > *', 'card');
  collect('main .brs-metrics > .teams-item', 'metric');
  collect('main .brs-step-flow > li', 'step');
  collect('main .brs-lifecycle > li', 'route');
  collect('main .brs-rate, main .brs-competencies > li, main .brs-faq-item', 'row');
  collect('main .brs-case, main .brs-section__column > .brs-proof-panel, main .brs-contracts > article, main .contacts__content, main .contacts .card, footer .footer__column', 'panel');
  const ordered = [...configs.keys()].sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
  const routeStages = ordered.filter(node => configs.get(node) === 'route');
  let routeStarted = false;
  const hero = document.querySelector('.preview--corporate, .brs-service-hero');
  const heroGroups = hero ? [...hero.querySelector('.preview__column, .preview-portfolio__column').children] : [];
  const allTargets = [...heroGroups, ...ordered];
  const media = gsap.matchMedia();
  let refreshTimer;
  const refresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => ScrollTrigger.refresh(true), 80);
  };

  media.add({ desktop: '(min-width: 1025px)', mobile: '(max-width: 1024px)', reduce: '(prefers-reduced-motion: reduce)' }, context => {
    const { desktop, reduce } = context.conditions;
    if (reduce) {
      heroBootRoot.classList.remove('brs-hero-pending');
      document.documentElement.dataset.brsMotionMode = 'reduced';
      allTargets.forEach(node => { seen.add(node); node.dataset.brsMotion = 'ready'; });
      routeStages.forEach(node => { node.dataset.routeState = 'complete'; });
      routeStarted = true;
      return;
    }
    document.documentElement.dataset.brsMotionMode = 'enabled';
    const listeners = [];
    let cancelIntro = () => {};
    const faqStates = new Map();
    const sapResets = [];
    const listen = (node, event, handler) => {
      node.addEventListener(event, handler);
      listeners.push(() => node.removeEventListener(event, handler));
    };
    const ready = node => {
      gsap.set(node, { clearProps: 'opacity,transform,willChange' });
      node.dataset.brsMotion = 'ready';
      if (!completed.has(node)) {
        completed.add(node);
        node.dispatchEvent(new CustomEvent('brs:revealed', { bubbles: true }));
      }
    };
    context.add('finish', nodes => {
      if (!nodes.length) return;
      nodes.forEach(node => { seen.add(node); gsap.killTweensOf(node); });
      gsap.set(nodes, { clearProps: 'opacity,transform,willChange' });
      nodes.forEach(ready);
    });
    context.add('reveal', batch => {
      const groups = new Map();
      batch.filter(node => !seen.has(node)).forEach(node => {
        const rect = node.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= innerHeight) { context.finish([node]); return; }
        seen.add(node);
        node.dataset.brsMotion = 'revealing';
        let kind = configs.get(node);
        if (desktop && node.closest('#about')) kind = node.matches('.brs-title') ? 'aboutTitle' : 'aboutCopy';
        if (!groups.has(kind)) groups.set(kind, []);
        groups.get(kind).push(node);
      });
      groups.forEach((nodes, kind) => {
        const y = kind === 'row' ? 10 : kind === 'text' ? 14 : desktop ? 22 : 14;
        const from = kind === 'aboutTitle' ? { x: -16, y: 0 } : kind === 'aboutCopy' ? { x: 16, y: 0 } : { x: 0, y };
        // Opacity keeps source text available to assistive technology during entrances.
        gsap.set(nodes, { willChange: 'transform,opacity' });
        gsap.fromTo(nodes, { ...from, opacity: 0 }, {
          x: 0, y: 0, opacity: 1, duration: kind === 'row' ? .5 : .7,
          stagger: { each: kind === 'metric' ? .09 : .065, amount: Math.min((nodes.length - 1) * (kind === 'metric' ? .09 : .065), .3) },
          ease: 'power3.out', overwrite: 'auto', clearProps: 'opacity,transform,willChange',
          onComplete: () => nodes.forEach(ready),
        });
      });
    });

    const pending = ordered.filter(node => {
      if (configs.get(node) === 'route') return false;
      if (seen.has(node) || node.getBoundingClientRect().bottom <= 0) { ready(node); seen.add(node); return false; }
      return true;
    });
    pending.forEach(node => { node.dataset.brsMotion = 'pending'; });
    if (pending.length) gsap.set(pending, { opacity: 0 });
    if (pending.length) ScrollTrigger.batch(pending, {
      start: 'top 90%', interval: .06, batchMax: 6, once: true,
      onEnter: context.reveal, onEnterBack: context.reveal, onLeave: context.finish,
    });

    const intro = heroGroups.filter(node => !seen.has(node));
    if (intro.length && heroBootRoot.classList.contains('brs-hero-pending') && hero.getBoundingClientRect().bottom > 0 && scrollY < 200) {
      const timeline = gsap.timeline({ paused: true, defaults: { duration: .9, ease: 'power2.out' } });
      gsap.set(intro, { opacity: 0, y: (index, node) => node.matches('h1') ? 26 : 16 });
      intro.forEach((node, index) => {
        seen.add(node);
        node.dataset.brsMotion = 'pending';
        timeline.to(node, {
          y: 0, opacity: 1, clearProps: 'opacity,transform', onComplete: () => ready(node),
        }, index * .16);
      });
      // Font loading used to consume the whole entrance while glyphs were hidden.
      // Keep the timeline paused until fonts settle (bounded for slow/offline fonts).
      let cancelled = false, started = false, frame;
      const start = () => {
        if (cancelled || started) return;
        started = true;
        clearTimeout(fontTimeout);
        frame = requestAnimationFrame(() => {
          frame = requestAnimationFrame(() => {
            if (cancelled) return;
            if (hero.getBoundingClientRect().bottom <= 0 || scrollY >= 200) { context.finish(intro); return; }
            intro.filter(node => !completed.has(node)).forEach(node => { node.dataset.brsMotion = 'revealing'; });
            timeline.play(0);
          });
        });
      };
      const fontTimeout = setTimeout(start, 1800);
      Promise.resolve(document.fonts?.ready).then(start, start);
      cancelIntro = () => { cancelled = true; clearTimeout(fontTimeout); cancelAnimationFrame(frame); };
    } else {
      heroGroups.forEach(node => { seen.add(node); ready(node); });
    }
    heroBootRoot.classList.remove('brs-hero-pending');

    const clearRouteStyles = stage => {
      stage.style.removeProperty('--route-progress');
      stage.querySelectorAll('.brs-step-number, .brs-route-copy').forEach(node => {
        node.style.removeProperty('opacity');
        node.style.removeProperty('transform');
      });
    };
    context.add('routeFinish', stages => {
      stages.forEach(stage => {
        gsap.killTweensOf([stage, ...stage.querySelectorAll('.brs-step-number, .brs-route-copy')]);
        seen.add(stage);
        stage.dataset.routeState = 'complete';
        clearRouteStyles(stage);
        ready(stage);
      });
    });
    if (routeStages.length) {
      if (routeStarted || routeStages.every(stage => stage.getBoundingClientRect().bottom <= 0)) {
        context.routeFinish(routeStages);
      } else {
        const routeTimeline = gsap.timeline({ paused: true });
        routeStages.forEach(stage => {
          stage.dataset.brsMotion = 'pending';
          stage.dataset.routeState = 'pending';
          gsap.set(stage, { '--route-progress': 0 });
          gsap.set(stage.querySelector('.brs-step-number'), { opacity: .4, scale: .85 });
          gsap.set(stage.querySelectorAll('.brs-route-copy'), { opacity: 0, y: 12 });
        });
        context.add('routeReveal', stages => {
          stages.filter(stage => !seen.has(stage)).forEach(stage => {
            if (stage.getBoundingClientRect().bottom <= 0) { context.routeFinish([stage]); return; }
            routeStarted = true;
            seen.add(stage);
            stage.dataset.brsMotion = 'revealing';
            const start = Math.max(routeTimeline.duration(), routeTimeline.time());
            routeTimeline.to(stage.querySelector('.brs-step-number'), {
              opacity: 1, scale: 1, duration: .42, ease: 'back.out(1.3)',
              onStart: () => { stage.dataset.routeState = 'active'; },
            }, start).to(stage.querySelectorAll('.brs-route-copy'), {
              opacity: 1, y: 0, duration: .45, stagger: .04, ease: 'power2.out',
            }, start + .12).to(stage, {
              '--route-progress': 1, duration: .55, ease: 'power2.inOut',
            }, start + .25).call(() => context.routeFinish([stage]), null, start + .8);
          });
          routeTimeline.play();
        });
        if (desktop) ScrollTrigger.create({
          trigger: routeStages[0].parentElement, start: 'top 85%', once: true,
          onEnter: () => context.routeReveal(routeStages), onEnterBack: () => context.routeReveal(routeStages),
          onLeave: () => context.routeFinish(routeStages),
        });
        else routeStages.forEach(stage => ScrollTrigger.create({
          trigger: stage, start: 'top 85%', once: true,
          onEnter: () => context.routeReveal([stage]), onEnterBack: () => context.routeReveal([stage]),
          onLeave: () => context.routeFinish([stage]),
        }));
      }
    }

    // A keyboard jump completes the relevant entrance before the control is used.
    listen(document, 'focusin', event => {
      const parents = allTargets.filter(node => node.contains(event.target) && node.dataset.brsMotion !== 'ready');
      context.finish(parents);
    });
    context.add('navigation', event => {
      const nodes = [...document.querySelectorAll('.mobile-nav .mobile__nav li, .mobile-nav__column > .button_v2')];
      gsap.killTweensOf(nodes);
      if (event.detail.open) gsap.fromTo(nodes, { opacity: .35, y: 10 }, { opacity: 1, y: 0, stagger: .025, duration: .32, ease: 'power2.out', clearProps: 'opacity,transform' });
      else gsap.set(nodes, { clearProps: 'opacity,transform' });
    });
    listen(document, 'brs:navigation', context.navigation);
    context.add('services', event => {
      const menu = document.querySelector('.nav-services__menu');
      gsap.killTweensOf(menu);
      if (event.detail.open) gsap.fromTo(menu, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: .22, ease: 'power2.out', clearProps: 'opacity,transform' });
      else gsap.set(menu, { clearProps: 'opacity,transform' });
    });
    listen(document, 'brs:services', context.services);

    // One short response per pointer entry, using the existing brand icons.
    const iconMoves = [
      [{ rotation: -7 }, { rotation: 7 }, { rotation: -3 }],
      [{ y: -4, scale: 1.08 }, { y: 1, scale: .98 }],
      [{ rotationY: 22, scale: 1.06 }, { rotationY: -12 }],
      [{ x: -5 }, { x: 6, y: -2 }, { x: 2, y: 0 }],
      [{ rotation: -5, y: -2 }, { rotation: 5, y: -2 }],
      [{ scaleY: .9, y: 2 }, { scaleY: 1.07, y: -2 }],
      [{ y: -5, rotation: -4 }, { y: -2, rotation: 3 }],
      [{ rotationY: -14, scale: 1.06 }, { rotationY: 10 }],
    ];
    document.querySelectorAll('.brs-solutions-grid > .brs-solution').forEach((card, index) => {
      const icon = card.querySelector('img');
      context.add(`solutionEnter${index}`, event => {
        if (event.pointerType !== 'mouse') return;
        gsap.killTweensOf(icon);
        const sequence = gsap.timeline({ defaults: { duration: .16, ease: 'power2.inOut' } });
        sequence.set(icon, { x: 0, y: 0, rotation: 0, rotationY: 0, scale: 1 });
        iconMoves[index % iconMoves.length].forEach(move => sequence.to(icon, move));
        sequence.to(icon, { x: 0, y: 0, rotation: 0, rotationY: 0, scale: 1, duration: .24, ease: 'power2.out', clearProps: 'transform' });
      });
      context.add(`solutionLeave${index}`, event => {
        if (event.pointerType !== 'mouse') return;
        gsap.killTweensOf(icon);
        gsap.to(icon, { x: 0, y: 0, rotation: 0, rotationY: 0, scale: 1, duration: .2, ease: 'power2.out', clearProps: 'transform' });
      });
      listen(card, 'pointerenter', context[`solutionEnter${index}`]);
      listen(card, 'pointerleave', context[`solutionLeave${index}`]);
    });

    // Larger SAP icons animate their individual SVG parts, not the whole image.
    document.querySelectorAll('#sap-services .brs-sap-card').forEach((card, index) => {
      const icon = card.querySelector('[data-sap-icon]');
      const parts = [...icon.querySelectorAll('[data-sap-part]')];
      const accents = [...icon.querySelectorAll('.brs-sap-accent')];
      const part = name => icon.querySelectorAll(`[data-sap-part="${name}"]`);
      let sequence;
      const reset = () => {
        sequence?.kill();
        gsap.killTweensOf(parts);
        gsap.set(parts, { clearProps: 'all' });
        parts.forEach(node => { node.removeAttribute('transform'); node.removeAttribute('data-svg-origin'); });
      };
      sapResets.push(reset);
      context.add(`sapEnter${index}`, event => {
        if (event.type === 'pointerenter' && event.pointerType !== 'mouse') return;
        reset();
        sequence = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onComplete: reset });
        if (icon.dataset.sapIcon === 'implementation') {
          sequence.to(part('hand'), { rotation: 360, svgOrigin: '24 13', duration: .95 }, 0)
            .to(part('node'), { scale: 1.3, transformOrigin: '50% 50%', duration: .24, stagger: .14, repeat: 1, yoyo: true }, .2)
            .fromTo(part('signal'), { strokeDashoffset: 1, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, duration: .7 }, .1)
            .to(part('signal'), { opacity: 0, duration: .25 }, .85);
        } else if (icon.dataset.sapIcon === 'support') {
          sequence.to(part('cap'), { y: -2.5, duration: .35, repeat: 1, yoyo: true }, 0)
            .to(part('layer'), { y: 2, duration: .28, stagger: .13, repeat: 1, yoyo: true }, .12)
            .fromTo(part('scan'), { y: 0, opacity: 0 }, { y: 22, opacity: .95, duration: .7, ease: 'none' }, .1)
            .to(part('scan'), { opacity: 0, duration: .25 }, .8);
        } else {
          sequence.to(part('back'), { x: 4, y: -2, duration: .3 }, 0)
            .to(part('back'), { x: 0, y: 0, duration: .4 }, .3)
            .to(part('front'), { x: -3, y: 1, duration: .3 }, .06)
            .to(part('front'), { x: 0, y: 0, duration: .4 }, .36)
            .fromTo(part('halo'), { scale: .75, opacity: 0, svgOrigin: '18 22' }, { scale: 1.15, opacity: .9, duration: .5 }, .1)
            .to(part('halo'), { opacity: 0, duration: .3 }, .65);
        }
      });
      context.add(`sapLeave${index}`, event => {
        if (event.type === 'pointerleave' && event.pointerType !== 'mouse') return;
        if (event.type === 'focusout' && card.contains(event.relatedTarget)) return;
        if (!parts.some(node => gsap.isTweening(node))) { reset(); return; }
        sequence?.kill();
        gsap.killTweensOf(parts);
        gsap.to(parts, { x: 0, y: 0, rotation: '0_short', scale: 1, duration: .24, ease: 'power2.out', onComplete: reset });
        gsap.to(accents, { opacity: 0, duration: .18 });
      });
      listen(card, 'pointerenter', context[`sapEnter${index}`]);
      listen(card, 'pointerleave', context[`sapLeave${index}`]);
      listen(card, 'focusin', context[`sapEnter${index}`]);
      listen(card, 'focusout', context[`sapLeave${index}`]);
    });

    // Native details semantics are kept; height changes only for this user action.
    document.querySelectorAll('.brs-faq-item').forEach(details => {
      const summary = details.querySelector('summary');
      const answer = summary.nextElementSibling;
      faqStates.set(details, details.open);
      context.add(`faq${faqStates.size}`, event => {
        event.preventDefault();
        const open = !faqStates.get(details);
        faqStates.set(details, open);
        const start = details.getBoundingClientRect().height;
        gsap.killTweensOf([details, answer]);
        context.finish([details]);
        details.open = true;
        const border = parseFloat(getComputedStyle(details).borderBottomWidth) || 0;
        const end = summary.getBoundingClientRect().height + border + (open ? answer.getBoundingClientRect().height : 0);
        gsap.fromTo(details, { height: start, overflow: 'hidden' }, {
          height: end, duration: open ? .34 : .24, ease: 'power2.inOut',
          onComplete: () => { details.open = open; gsap.set(details, { clearProps: 'height,overflow' }); refresh(); },
        });
        gsap.to(answer, { opacity: open ? 1 : 0, duration: .2, overwrite: 'auto', clearProps: 'opacity' });
      });
      listen(summary, 'click', context[`faq${faqStates.size}`]);
    });
    const legacy = document.querySelector('#company-updates');
    if (legacy) {
      context.add('legacy', () => {
        refresh();
        if (!legacy.open) return;
        const nodes = [...legacy.querySelectorAll('.brs-title, .career-item, .brs-news')];
        if (seen.has(legacy)) return;
        seen.add(legacy);
        gsap.fromTo(nodes, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .55, stagger: .055, ease: 'power3.out', clearProps: 'opacity,transform' });
      });
      listen(legacy, 'toggle', context.legacy);
    }
    return () => {
      cancelIntro();
      listeners.forEach(remove => remove());
      faqStates.forEach((open, details) => { details.open = open; });
      // Interrupted hover tweens can save intermediate transforms in their
      // context. Restore the icon's CSS state after the context reverts them.
      document.querySelectorAll('.brs-solutions-grid img').forEach(icon => icon.style.removeProperty('transform'));
      sapResets.forEach(reset => reset());
      routeStages.forEach(clearRouteStyles);
    };
  }, document.body);

  window.addEventListener('load', refresh, { once: true });
  window.addEventListener('pageshow', refresh);
  window.addEventListener('hashchange', refresh);
  document.fonts?.ready.then(refresh);
  document.querySelectorAll('img').forEach(image => { if (!image.complete) image.addEventListener('load', refresh, { once: true }); });
});
