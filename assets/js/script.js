(() => {
  const onReady = () => {
    /* --- Mobile Detection --- */
    const isMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      return /android|ipad|iphone|ipod/i.test(userAgent) && !window.MSStream;
    };

    if (isMobile()) {
      document.body.classList.add('is-mobile');
    }

    /* --- Hamburger menu & Drawer --- */
    const toggle = document.querySelector('.menu-toggle');
    const navContainer = document.querySelector('.main-nav-container');
    const backdrop = document.querySelector('.menu-backdrop');
    const closeBtn = document.querySelector('.close-menu');
    const body = document.body;

    const openMenu = () => {
      toggle.setAttribute('aria-expanded', 'true');
      toggle.classList.add('active');
      navContainer.classList.add('is-open');
      backdrop.classList.add('active');
      body.style.overflow = 'hidden'; // Prevent scrolling
    };

    const closeMenu = () => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.classList.remove('active');
      navContainer.classList.remove('is-open');
      backdrop.classList.remove('active');
      body.style.overflow = '';
    };

    if (toggle && navContainer) {
      toggle.addEventListener('click', () => {
        const isOpen = navContainer.classList.contains('is-open');
        isOpen ? closeMenu() : openMenu();
      });

      if (backdrop) backdrop.addEventListener('click', closeMenu);
      if (closeBtn) closeBtn.addEventListener('click', closeMenu);

      /* Close when clicking a link */
      navContainer.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
      });

      /* Close on Escape key */
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navContainer.classList.contains('is-open')) {
          closeMenu();
        }
      });

      /* Mobile Dropdown Toggles */
      const dropdownToggles = navContainer.querySelectorAll('.dropdown-toggle');
      dropdownToggles.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const parent = btn.parentElement;
          const wasActive = parent.classList.contains('active');

          /* Optional: Close other dropdowns */
          /*
          navContainer.querySelectorAll('.nav-item-has-children.active').forEach(item => {
            if (item !== parent) {
              item.classList.remove('active');
              item.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
            }
          });
          */

          parent.classList.toggle('active');
          btn.setAttribute('aria-expanded', !wasActive);
        });
      });
    }

    /* --- Header scroll effect --- */
    const header = document.querySelector('.site-header');
    if (header) {
      const onScroll = () => {
        header.classList.toggle('scrolled', window.scrollY > 10);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    /* --- Smooth scroll for anchor links --- */
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', event => {
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          event.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    /* --- Scroll reveal with stagger --- */
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    if (revealElements.length === 0) return;

    if (!('IntersectionObserver' in window)) {
      revealElements.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry, i) => {
          if (!entry.isIntersecting) return;
          /* Stagger delay based on visible order */
          setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, i * 80);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
    );

    revealElements.forEach(el => observer.observe(el));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
