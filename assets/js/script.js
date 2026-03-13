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

    /* --- Catalog card enhancements --- */
    const rankingCards = Array.from(document.querySelectorAll('.product-rank-card'));
    if (rankingCards.length > 0) {
      const locale = (document.documentElement.lang || 'es').toLowerCase();
      const labelsByLocale = {
        en: {
          reviews: 'Read reviews',
          similar: 'Similar products',
          prev: 'Previous image',
          next: 'Next image',
          gallery: 'Product gallery'
        },
        fr: {
          reviews: 'Lire les avis',
          similar: 'Produits similaires',
          prev: 'Image precedente',
          next: 'Image suivante',
          gallery: 'Galerie produit'
        },
        it: {
          reviews: 'Leggi opinioni',
          similar: 'Prodotti simili',
          prev: 'Immagine precedente',
          next: 'Immagine successiva',
          gallery: 'Galleria prodotto'
        },
        es: {
          reviews: 'Leer opiniones',
          similar: 'Productos similares',
          prev: 'Imagen anterior',
          next: 'Imagen siguiente',
          gallery: 'Galeria del producto'
        }
      };
      const labels = labelsByLocale[locale.slice(0, 2)] || labelsByLocale.es;

      const parseGalleryImages = (imageNode) => {
        if (!imageNode) return [];

        const rawValue = imageNode.getAttribute('data-gallery-images') || '';
        let parsed = [];

        if (rawValue) {
          try {
            const jsonValue = JSON.parse(rawValue);
            if (Array.isArray(jsonValue)) parsed = jsonValue;
          } catch (error) {
            parsed = rawValue.split('|');
          }
        }

        return [imageNode.currentSrc || imageNode.src, ...parsed]
          .map((value) => (value || '').trim())
          .filter(Boolean)
          .filter((value, index, collection) => collection.indexOf(value) === index);
      };

      const createIcon = (pathD) => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathD);
        svg.appendChild(path);
        return svg;
      };

      const rankingPool = rankingCards.map((card, index) => {
        const link = card.querySelector('.product-rank-cta');
        const image = card.querySelector('.product-rank-image img');
        const title = card.querySelector('.product-rank-title');

        return {
          index,
          href: link ? link.href : '#',
          image: image ? image.getAttribute('src') || '' : '',
          title: title ? title.textContent.trim() : ''
        };
      });

      rankingCards.forEach((card, currentIndex) => {
        const interaction = card.querySelector('.product-rank-interaction');
        const primaryCta = interaction ? interaction.querySelector('.product-rank-cta') : null;
        const priceBlock = interaction ? interaction.querySelector('.product-rank-price') : null;
        const imageBox = card.querySelector('.product-rank-image');
        const imageNode = imageBox ? imageBox.querySelector('img') : null;

        card.classList.add('catalog-card-enhanced');

        if (interaction && primaryCta && !interaction.querySelector('.product-rank-cta-secondary')) {
          const reviewLink = document.createElement('a');
          const normalizedHref = primaryCta.href.includes('#') ? primaryCta.href.split('#')[0] : primaryCta.href;
          reviewLink.href = normalizedHref.includes('amazon.') ? `${normalizedHref}#customerReviews` : normalizedHref;
          reviewLink.className = 'product-rank-cta-secondary';
          reviewLink.target = '_blank';
          reviewLink.rel = 'nofollow sponsored noopener';
          reviewLink.appendChild(createIcon('M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z'));
          reviewLink.append(` ${labels.reviews}`);
          primaryCta.insertAdjacentElement('afterend', reviewLink);
        }

        if (interaction && !interaction.querySelector('.amazon-logo-container')) {
          const logoWrap = document.createElement('div');
          logoWrap.className = 'amazon-logo-container';
          const logo = document.createElement('img');
          logo.src = '/assets/img/amazon-logo.svg';
          logo.alt = 'Disponible en Amazon';
          logoWrap.appendChild(logo);
          interaction.appendChild(logoWrap);
        }

        if (interaction && !interaction.querySelector('.product-similar-panel')) {
          const similarItems = rankingPool.filter((item) => item.index !== currentIndex).slice(0, 3);

          if (similarItems.length > 0) {
            const similarPanel = document.createElement('div');
            similarPanel.className = 'product-similar-panel';

            const similarTitle = document.createElement('p');
            similarTitle.className = 'product-similar-title';
            similarTitle.textContent = labels.similar;
            similarPanel.appendChild(similarTitle);

            const similarList = document.createElement('div');
            similarList.className = 'product-similar-list';

            similarItems.forEach((item) => {
              const itemLink = document.createElement('a');
              itemLink.className = 'product-similar-item';
              itemLink.href = item.href;
              itemLink.target = '_blank';
              itemLink.rel = 'nofollow sponsored noopener';

              const thumb = document.createElement('span');
              thumb.className = 'product-similar-thumb';
              const thumbImg = document.createElement('img');
              thumbImg.src = item.image;
              thumbImg.alt = item.title;
              thumbImg.loading = 'lazy';
              thumb.appendChild(thumbImg);

              const name = document.createElement('span');
              name.className = 'product-similar-name';
              name.textContent = item.title;

              itemLink.appendChild(thumb);
              itemLink.appendChild(name);
              similarList.appendChild(itemLink);
            });

            similarPanel.appendChild(similarList);
            const amazonLogo = interaction.querySelector('.amazon-logo-container');
            if (amazonLogo) {
              interaction.insertBefore(similarPanel, amazonLogo);
            } else {
              interaction.appendChild(similarPanel);
            }
          }
        }

        if (imageBox && imageNode && !imageBox.querySelector('.product-gallery')) {
          const galleryImages = parseGalleryImages(imageNode);

          if (galleryImages.length > 1) {
            const gallery = document.createElement('div');
            gallery.className = 'product-gallery';

            const stage = document.createElement('div');
            stage.className = 'product-gallery-stage';
            stage.setAttribute('aria-label', labels.gallery);

            const mainImage = imageNode.cloneNode(true);
            mainImage.classList.add('product-gallery-main');
            mainImage.removeAttribute('data-gallery-images');
            mainImage.removeAttribute('data-asin-image');

            const counter = document.createElement('span');
            counter.className = 'product-gallery-counter';

            const thumbs = document.createElement('div');
            thumbs.className = 'product-gallery-thumbs';

            let activeIndex = 0;
            let touchStartX = 0;

            const setActiveImage = (nextIndex) => {
              activeIndex = (nextIndex + galleryImages.length) % galleryImages.length;
              mainImage.src = galleryImages[activeIndex];
              counter.textContent = `${activeIndex + 1}/${galleryImages.length}`;

              thumbs.querySelectorAll('.product-gallery-thumb').forEach((thumbButton, thumbIndex) => {
                thumbButton.classList.toggle('is-active', thumbIndex === activeIndex);
                thumbButton.setAttribute('aria-pressed', String(thumbIndex === activeIndex));
              });
            };

            ['prev', 'next'].forEach((direction) => {
              const button = document.createElement('button');
              button.type = 'button';
              button.className = `product-gallery-nav ${direction}`;
              button.setAttribute('aria-label', direction === 'prev' ? labels.prev : labels.next);
              button.textContent = direction === 'prev' ? '‹' : '›';
              button.addEventListener('click', () => {
                setActiveImage(activeIndex + (direction === 'next' ? 1 : -1));
              });
              stage.appendChild(button);
            });

            galleryImages.forEach((src, thumbIndex) => {
              const thumbButton = document.createElement('button');
              thumbButton.type = 'button';
              thumbButton.className = 'product-gallery-thumb';
              thumbButton.setAttribute('aria-label', `${labels.gallery} ${thumbIndex + 1}`);
              const thumbImage = document.createElement('img');
              thumbImage.src = src;
              thumbImage.alt = imageNode.alt;
              thumbImage.loading = 'lazy';
              thumbButton.appendChild(thumbImage);
              thumbButton.addEventListener('click', () => setActiveImage(thumbIndex));
              thumbs.appendChild(thumbButton);
            });

            stage.addEventListener('touchstart', (event) => {
              touchStartX = event.changedTouches[0].clientX;
            }, { passive: true });

            stage.addEventListener('touchend', (event) => {
              const deltaX = event.changedTouches[0].clientX - touchStartX;
              if (Math.abs(deltaX) < 30) return;
              setActiveImage(activeIndex + (deltaX < 0 ? 1 : -1));
            }, { passive: true });

            stage.appendChild(mainImage);
            stage.appendChild(counter);
            gallery.appendChild(stage);
            gallery.appendChild(thumbs);

            imageBox.textContent = '';
            imageBox.appendChild(gallery);
            setActiveImage(0);
          }
        }

        if (interaction && priceBlock) {
          interaction.insertBefore(priceBlock, interaction.firstChild);
        }
      });
    }

    /* --- Footer privacy center --- */
    const cookieStorageKey = 'descanso-inteligente-cookie-preferences';
    const analyticsMeasurementId = 'G-B06YM5N4P8';
    const cookieDefaults = {
      necessary: true,
      analytics: false,
      marketing: false
    };
    let analyticsBooted = false;
    let analyticsScriptPromise = null;

    const safeParse = (value) => {
      try {
        return JSON.parse(value);
      } catch (error) {
        return null;
      }
    };

    const getCookiePreferences = () => {
      const saved = safeParse(window.localStorage.getItem(cookieStorageKey));
      return {
        necessary: true,
        analytics: Boolean(saved && saved.analytics),
        marketing: Boolean(saved && saved.marketing)
      };
    };

    const saveCookiePreferences = (preferences) => {
      const payload = {
        necessary: true,
        analytics: Boolean(preferences.analytics),
        marketing: Boolean(preferences.marketing),
        updatedAt: new Date().toISOString()
      };

      window.localStorage.setItem(cookieStorageKey, JSON.stringify(payload));
      document.documentElement.dataset.cookieAnalytics = String(payload.analytics);
      document.documentElement.dataset.cookieMarketing = String(payload.marketing);
      window.dispatchEvent(new CustomEvent('cookiePreferencesUpdated', { detail: payload }));
      return payload;
    };

    const updateGoogleConsent = (preferences) => {
      if (typeof window.gtag !== 'function') return;

      window.gtag('consent', 'update', {
        analytics_storage: preferences.analytics ? 'granted' : 'denied',
        ad_storage: preferences.marketing ? 'granted' : 'denied',
        ad_user_data: preferences.marketing ? 'granted' : 'denied',
        ad_personalization: preferences.marketing ? 'granted' : 'denied'
      });
    };

    const loadAnalyticsScript = () => {
      if (analyticsScriptPromise) return analyticsScriptPromise;

      analyticsScriptPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[data-analytics-id="${analyticsMeasurementId}"]`);
        if (existingScript) {
          if (existingScript.dataset.loaded === 'true') {
            resolve();
            return;
          }

          existingScript.addEventListener('load', () => resolve(), { once: true });
          existingScript.addEventListener('error', reject, { once: true });
          return;
        }

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsMeasurementId}`;
        script.dataset.analyticsId = analyticsMeasurementId;
        script.addEventListener('load', () => {
          script.dataset.loaded = 'true';
          resolve();
        }, { once: true });
        script.addEventListener('error', reject, { once: true });
        document.head.appendChild(script);
      });

      return analyticsScriptPromise;
    };

    const bootAnalytics = async (preferences) => {
      if (!preferences.analytics && !preferences.marketing) return;

      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function gtag() {
        window.dataLayer.push(arguments);
      };

      try {
        await loadAnalyticsScript();
      } catch (error) {
        return;
      }

      if (!analyticsBooted) {
        window.gtag('js', new Date());
        window.gtag('consent', 'default', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied'
        });
        window.gtag('config', analyticsMeasurementId, { send_page_view: false });
        analyticsBooted = true;
      }

      updateGoogleConsent(preferences);

      if (preferences.analytics) {
        window.gtag('event', 'page_view', {
          page_title: document.title,
          page_location: window.location.href,
          page_path: window.location.pathname + window.location.search
        });
      }
    };

    const initialCookiePreferences = getCookiePreferences();
    document.documentElement.dataset.cookieAnalytics = String(initialCookiePreferences.analytics);
    document.documentElement.dataset.cookieMarketing = String(initialCookiePreferences.marketing);
    bootAnalytics(initialCookiePreferences);

    const footerNodes = Array.from(document.querySelectorAll('.site-footer'));
    if (footerNodes.length > 0) {
      const locale = document.documentElement.lang || 'es';
      const copy = {
        en: {
          policyLink: 'Cookie policy',
          openSettings: 'Cookie settings',
          affiliateNote: 'We may earn a commission from affiliate links to the products featured on this site.',
          modalTitle: 'Privacy preferences center',
          modalIntro: 'You can review which types of cookies you accept on Descanso Inteligente. Required cookies stay active so the site works correctly.',
          necessaryTitle: 'Strictly necessary cookies',
          necessaryBody: 'They enable basic site functionality, security, stability and the minimum storage needed for your preferences.',
          necessaryStatus: 'Always active',
          analyticsTitle: 'Analytics cookies',
          analyticsBody: 'They help us understand which content performs best and where we can improve navigation without personally identifying you.',
          marketingTitle: 'Advertising and affiliate cookies',
          marketingBody: 'They help us measure affiliate links, limit repetition and show more relevant messages related to our content.',
          analyticsLabel: 'Enable analytics cookies',
          marketingLabel: 'Enable advertising and affiliate cookies',
          reject: 'Reject optional cookies',
          save: 'Save preferences',
          feedbackRejected: 'Optional cookies have been rejected.',
          feedbackSaved: 'Your preferences have been saved correctly.',
          closeLabel: 'Close cookie preferences',
          legalHeading: 'Information',
          trademarksNotice: 'Amazon, Amazon Prime and their logos are trademarks of Amazon.com, Inc. or its affiliates.'
        },
        fr: {
          policyLink: 'Politique de cookies',
          openSettings: 'Parametres des cookies',
          affiliateNote: 'Nous pouvons recevoir une commission via les liens d affiliation vers les produits presentes sur ce site.',
          modalTitle: 'Centre des preferences de confidentialite',
          modalIntro: 'Vous pouvez choisir les types de cookies acceptes sur Descanso Inteligente. Les cookies necessaires restent actifs pour garantir le bon fonctionnement du site.',
          necessaryTitle: 'Cookies strictement necessaires',
          necessaryBody: 'Ils permettent les fonctions de base du site, la securite, la stabilite et l enregistrement minimum de vos preferences.',
          necessaryStatus: 'Toujours actifs',
          analyticsTitle: 'Cookies d analyse',
          analyticsBody: 'Ils nous aident a comprendre quels contenus fonctionnent le mieux et ou ameliorer la navigation sans vous identifier personnellement.',
          marketingTitle: 'Cookies publicitaires et d affiliation',
          marketingBody: 'Ils servent a mesurer les liens d affiliation, limiter les repetitions et afficher des messages plus pertinents lies a nos contenus.',
          analyticsLabel: 'Activer les cookies d analyse',
          marketingLabel: 'Activer les cookies publicitaires et d affiliation',
          reject: 'Refuser les optionnels',
          save: 'Enregistrer mes preferences',
          feedbackRejected: 'Les cookies optionnels ont ete refuses.',
          feedbackSaved: 'Vos preferences ont bien ete enregistrees.',
          closeLabel: 'Fermer les preferences de cookies',
          legalHeading: 'Informations',
          trademarksNotice: 'Amazon, Amazon Prime et leurs logos sont des marques deposees d Amazon.com, Inc. ou de ses societes affiliees.'
        },
        it: {
          policyLink: 'Politica cookie',
          openSettings: 'Impostazioni cookie',
          affiliateNote: 'Potremmo ricevere una commissione tramite i link di affiliazione ai prodotti presenti in questo sito.',
          modalTitle: 'Centro preferenze privacy',
          modalIntro: 'Puoi scegliere quali tipi di cookie accettare su Descanso Inteligente. I cookie necessari restano attivi per garantire il corretto funzionamento del sito.',
          necessaryTitle: 'Cookie strettamente necessari',
          necessaryBody: 'Consentono le funzioni di base del sito, la sicurezza, la stabilita e il salvataggio minimo delle tue preferenze.',
          necessaryStatus: 'Sempre attivi',
          analyticsTitle: 'Cookie analitici',
          analyticsBody: 'Ci aiutano a capire quali contenuti funzionano meglio e dove migliorare la navigazione senza identificarti personalmente.',
          marketingTitle: 'Cookie pubblicitari e di affiliazione',
          marketingBody: 'Servono a misurare i link di affiliazione, limitare le ripetizioni e mostrare messaggi piu rilevanti legati ai nostri contenuti.',
          analyticsLabel: 'Attivare i cookie analitici',
          marketingLabel: 'Attivare i cookie pubblicitari e di affiliazione',
          reject: 'Rifiuta opzionali',
          save: 'Salva preferenze',
          feedbackRejected: 'I cookie opzionali sono stati rifiutati.',
          feedbackSaved: 'Le tue preferenze sono state salvate correttamente.',
          closeLabel: 'Chiudi preferenze cookie',
          legalHeading: 'Informazioni',
          trademarksNotice: 'Amazon, Amazon Prime e i relativi loghi sono marchi registrati di Amazon.com, Inc. o delle sue affiliate.'
        },
        es: {
          policyLink: 'Politica de cookies',
          openSettings: 'Configuracion de cookies',
          affiliateNote: 'Podemos ganar una compensacion por enlaces de afiliados para los productos listados en esta web.',
          modalTitle: 'Centro de preferencias de privacidad',
          modalIntro: 'Puedes revisar que tipos de cookies aceptas en Descanso Inteligente. Las cookies necesarias permanecen activas para que la web funcione correctamente.',
          necessaryTitle: 'Cookies estrictamente necesarias',
          necessaryBody: 'Permiten funciones basicas del sitio, estabilidad, seguridad y almacenamiento minimo de tus preferencias.',
          necessaryStatus: 'Activas siempre',
          analyticsTitle: 'Cookies de analitica',
          analyticsBody: 'Nos ayudan a entender que contenidos funcionan mejor y a detectar mejoras de navegacion sin identificarte personalmente.',
          marketingTitle: 'Cookies publicitarias y de afiliacion',
          marketingBody: 'Sirven para medir enlaces de afiliados, limitar repeticiones y mostrar mensajes mas relevantes relacionados con nuestros contenidos.',
          analyticsLabel: 'Activar cookies de analitica',
          marketingLabel: 'Activar cookies publicitarias y de afiliacion',
          reject: 'Rechazar opcionales',
          save: 'Guardar preferencias',
          feedbackRejected: 'Has rechazado las cookies opcionales.',
          feedbackSaved: 'Tus preferencias se han guardado correctamente.',
          closeLabel: 'Cerrar preferencias de cookies',
          legalHeading: 'Informacion',
          trademarksNotice: 'Amazon, Amazon Prime y sus logotipos son marcas registradas de Amazon.com, Inc. o sus afiliados.'
        }
      }[locale] || {
        policyLink: 'Politica de cookies',
        openSettings: 'Configuracion de cookies',
        affiliateNote: 'Podemos ganar una compensacion por enlaces de afiliados para los productos listados en esta web.',
        modalTitle: 'Centro de preferencias de privacidad',
        modalIntro: 'Puedes revisar que tipos de cookies aceptas en Descanso Inteligente. Las cookies necesarias permanecen activas para que la web funcione correctamente.',
        necessaryTitle: 'Cookies estrictamente necesarias',
        necessaryBody: 'Permiten funciones basicas del sitio, estabilidad, seguridad y almacenamiento minimo de tus preferencias.',
        necessaryStatus: 'Activas siempre',
        analyticsTitle: 'Cookies de analitica',
        analyticsBody: 'Nos ayudan a entender que contenidos funcionan mejor y a detectar mejoras de navegacion sin identificarte personalmente.',
        marketingTitle: 'Cookies publicitarias y de afiliacion',
        marketingBody: 'Sirven para medir enlaces de afiliados, limitar repeticiones y mostrar mensajes mas relevantes relacionados con nuestros contenidos.',
        analyticsLabel: 'Activar cookies de analitica',
        marketingLabel: 'Activar cookies publicitarias y de afiliacion',
        reject: 'Rechazar opcionales',
        save: 'Guardar preferencias',
        feedbackRejected: 'Has rechazado las cookies opcionales.',
        feedbackSaved: 'Tus preferencias se han guardado correctamente.',
        closeLabel: 'Cerrar preferencias de cookies',
        legalHeading: 'Informacion',
        trademarksNotice: 'Amazon, Amazon Prime y sus logotipos son marcas registradas de Amazon.com, Inc. o sus afiliados.'
      };

      footerNodes.forEach((footer) => {
        const columns = Array.from(footer.querySelectorAll('.footer-content > div'));
        if (columns[1]) columns[1].classList.add('footer-column-info');
        if (columns[2]) columns[2].classList.add('footer-column-legal');

        const brand = footer.querySelector('.footer-brand');
        if (brand && !brand.querySelector('.footer-affiliate-note')) {
          const affiliateNote = document.createElement('p');
          affiliateNote.className = 'footer-affiliate-note';
          affiliateNote.textContent = copy.affiliateNote;
          brand.appendChild(affiliateNote);
        }

        const legalHeading = footer.querySelector('.footer-column-legal .footer-heading');
        if (legalHeading && legalHeading.textContent.trim().length < 14) {
          legalHeading.textContent = copy.legalHeading;
        }

        const utilityContainer = document.createElement('div');
        utilityContainer.className = 'footer-utility-links';
        utilityContainer.innerHTML = `
          <a href="/politica-cookies/">${copy.policyLink}</a>
          <button type="button" class="footer-legal-trigger" data-cookie-open>${copy.openSettings}</button>
        `;

        const footerBottom = footer.querySelector('.footer-bottom');
        if (footerBottom && !footerBottom.querySelector('[data-cookie-open]')) {
          footerBottom.appendChild(utilityContainer);
        }

        if (footerBottom && !footerBottom.querySelector('.footer-meta-note')) {
          const metaNote = document.createElement('p');
          metaNote.className = 'footer-meta-note';
          metaNote.textContent = copy.trademarksNotice;
          footerBottom.appendChild(metaNote);
        }
      });

      const modal = document.createElement('div');
      modal.className = 'cookie-modal';
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML = `
        <div class="cookie-modal-backdrop" data-cookie-close></div>
        <section class="cookie-modal-panel" role="dialog" aria-modal="true" aria-labelledby="cookie-modal-title">
          <header class="cookie-modal-header">
            <div>
              <h2 id="cookie-modal-title" class="cookie-modal-title">${copy.modalTitle}</h2>
              <p class="cookie-modal-intro">${copy.modalIntro}</p>
            </div>
            <button type="button" class="cookie-modal-close" aria-label="${copy.closeLabel}" data-cookie-close>&times;</button>
          </header>
          <div class="cookie-modal-body">
            <article class="cookie-category">
              <div class="cookie-category-head">
                <div>
                  <h3>${copy.necessaryTitle}</h3>
                  <p>${copy.necessaryBody}</p>
                </div>
                <div>
                  <div class="cookie-status">${copy.necessaryStatus}</div>
                  <button type="button" class="cookie-toggle" aria-checked="true" disabled></button>
                </div>
              </div>
            </article>
            <article class="cookie-category">
              <div class="cookie-category-head">
                <div>
                  <h3>${copy.analyticsTitle}</h3>
                  <p>${copy.analyticsBody}</p>
                </div>
                <button type="button" class="cookie-toggle" role="switch" aria-checked="false" data-cookie-toggle="analytics" aria-label="${copy.analyticsLabel}"></button>
              </div>
            </article>
            <article class="cookie-category">
              <div class="cookie-category-head">
                <div>
                  <h3>${copy.marketingTitle}</h3>
                  <p>${copy.marketingBody}</p>
                </div>
                <button type="button" class="cookie-toggle" role="switch" aria-checked="false" data-cookie-toggle="marketing" aria-label="${copy.marketingLabel}"></button>
              </div>
            </article>
            <p class="cookie-feedback" data-cookie-feedback></p>
          </div>
          <footer class="cookie-modal-footer">
            <div class="cookie-modal-actions">
              <button type="button" class="cookie-btn cookie-btn-secondary" data-cookie-reject>${copy.reject}</button>
              <button type="button" class="cookie-btn cookie-btn-primary" data-cookie-save>${copy.save}</button>
            </div>
          </footer>
        </section>
      `;
      document.body.appendChild(modal);

      const closeButtons = modal.querySelectorAll('[data-cookie-close]');
      const openButtons = document.querySelectorAll('[data-cookie-open]');
      const toggles = Array.from(modal.querySelectorAll('[data-cookie-toggle]'));
      const feedback = modal.querySelector('[data-cookie-feedback]');
      const saveButton = modal.querySelector('[data-cookie-save]');
      const rejectButton = modal.querySelector('[data-cookie-reject]');
      let workingPreferences = getCookiePreferences();
      let lastFocusedElement = null;

      const syncToggleUi = () => {
        toggles.forEach((toggle) => {
          const key = toggle.getAttribute('data-cookie-toggle');
          toggle.setAttribute('aria-checked', String(Boolean(workingPreferences[key])));
        });
      };

      const openCookieModal = () => {
        lastFocusedElement = document.activeElement;
        workingPreferences = getCookiePreferences();
        syncToggleUi();
        if (feedback) feedback.textContent = '';
        modal.classList.add('is-visible');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      };

      const closeCookieModal = () => {
        modal.classList.remove('is-visible');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastFocusedElement instanceof HTMLElement) {
          lastFocusedElement.focus();
        }
      };

      openButtons.forEach((button) => {
        button.addEventListener('click', openCookieModal);
      });

      closeButtons.forEach((button) => {
        button.addEventListener('click', closeCookieModal);
      });

      toggles.forEach((toggle) => {
        toggle.addEventListener('click', () => {
          const key = toggle.getAttribute('data-cookie-toggle');
          if (!key) return;
          workingPreferences[key] = !workingPreferences[key];
          syncToggleUi();
        });
      });

      if (rejectButton) {
        rejectButton.addEventListener('click', () => {
          workingPreferences = { ...cookieDefaults };
          syncToggleUi();
          saveCookiePreferences(workingPreferences);
          bootAnalytics(workingPreferences);
          if (feedback) feedback.textContent = copy.feedbackRejected;
          window.setTimeout(closeCookieModal, 220);
        });
      }

      if (saveButton) {
        saveButton.addEventListener('click', () => {
          saveCookiePreferences(workingPreferences);
          bootAnalytics(workingPreferences);
          if (feedback) feedback.textContent = copy.feedbackSaved;
          window.setTimeout(closeCookieModal, 220);
        });
      }

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('is-visible')) {
          closeCookieModal();
        }
      });
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
