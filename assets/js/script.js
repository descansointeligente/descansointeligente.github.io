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

    /* --- Social Sharing --- */
    const shareContainer = document.querySelector('.social-share-container');
    if (shareContainer) {
      shareContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.share-btn');
        if (!btn) return;

        const network = btn.getAttribute('data-network');
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent(document.title);

        let shareUrl = '';
        switch (network) {
          case 'x':
            shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
            break;
          case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
            break;
          case 'whatsapp':
            shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
            break;
          case 'linkedin':
            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
            break;
          case 'copy':
            navigator.clipboard.writeText(window.location.href).then(() => {
              const originalText = btn.textContent;
              btn.textContent = '¡Copiado!';
              setTimeout(() => btn.textContent = originalText, 2000);
            });
            return;
        }

        if (shareUrl) {
          window.open(shareUrl, 'share-popup', 'width=600,height=500');
        }
      });
    }

    /* --- Homepage search / discovery --- */
    const searchSection = document.querySelector('.site-search');
    if (searchSection) {
      const input = searchSection.querySelector('#site-search-input');
      const clearButton = searchSection.querySelector('.site-search-clear');
      const cards = Array.from(searchSection.querySelectorAll('.search-result-card'));
      const tags = Array.from(searchSection.querySelectorAll('[data-search-tag]'));
      const emptyState = searchSection.querySelector('[data-search-empty]');
      const countNode = searchSection.querySelector('[data-search-count]');

      const normalize = (value) => value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

      const applySearch = (rawTerm) => {
        const term = normalize(rawTerm || '');
        let visibleCount = 0;

        cards.forEach((card) => {
          const haystack = normalize(`${card.dataset.search || ''} ${card.textContent || ''}`);
          const matches = !term || haystack.includes(term);
          card.hidden = !matches;
          if (matches) visibleCount += 1;
        });

        if (countNode) {
          countNode.textContent = String(visibleCount);
        }

        if (clearButton) {
          clearButton.hidden = !term;
        }

        if (emptyState) {
          emptyState.hidden = visibleCount > 0;
        }
      };

      if (input) {
        input.addEventListener('input', () => applySearch(input.value));
        input.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter') return;

          const firstVisibleCard = cards.find((card) => !card.hidden);
          if (!firstVisibleCard) return;

          window.location.href = firstVisibleCard.href;
        });

        const params = new URLSearchParams(window.location.search);
        const query = params.get('q');
        if (query) {
          input.value = query;
        }
      }

      if (clearButton && input) {
        clearButton.addEventListener('click', () => {
          input.value = '';
          applySearch('');
          input.focus();
        });
      }

      tags.forEach((tag) => {
        tag.addEventListener('click', () => {
          const query = tag.getAttribute('data-search-tag') || '';
          if (input) {
            input.value = query;
            input.focus();
          }
          applySearch(query);
        });
      });

      applySearch(input ? input.value : '');
    }

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

    /* --- Sticky Mobile CTA Logic --- */
    const stickyContainer = document.querySelector('.sticky-mobile-container');
    const firstProductCard = document.querySelector('.product-rank-card.top-1') || document.querySelector('.product-rank-card') || document.querySelector('.hero');

    if (stickyContainer && firstProductCard) {
      stickyContainer.classList.add('active');

      const stickyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          /* Show sticky CTA if the element is scrolled ABOVE the viewport */
          if (!entry.isIntersecting && entry.boundingClientRect.bottom < 0) {
            stickyContainer.classList.add('visible');
          } else {
            stickyContainer.classList.remove('visible');
          }
        });
      }, {
        threshold: 0,
        rootMargin: "0px"
      });

      stickyObserver.observe(firstProductCard);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
