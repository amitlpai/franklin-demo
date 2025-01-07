import {
    sampleRUM,
    buildBlock,
    loadHeader,
    loadFooter,
    decorateButtons,
    decorateIcons,
    decorateSections,
    decorateBlocks,
    decorateTemplateAndTheme,
    waitForLCP,
    loadBlocks,
    loadCSS,
    getMetadata,
    toClassName,
    fetchPlaceholders,
    loadScript,
  } from './lib-franklin.js';
  import { waitForElements } from './pfizer-utilities.js';
  // import { isNonProduction } from './pfizer-utilities.js';
  loadScript(`../scripts/fm-slim.js`);
  const LCP_BLOCKS = []; // add your LCP blocks to the list
  const PRODUCTION_DOMAINS = ['www.nurtec.com'];
  
  //Redirect to the correct page
  if (window.location.hash.substring(1) === 'terms-and-conditions') {
    window.location.href = "/terms-and-conditions/";
  }
  
  /**
   * Turns absolute links within the domain into relative links.
   * @param {Element} main The container element
   */
  export function makeLinksRelative(main) {
    // eslint-disable-next-line no-use-before-define
    const hosts = ['hlx.page', 'hlx.live', ...PRODUCTION_DOMAINS];
    main.querySelectorAll('a[href]').forEach((a) => {
      try {
        const url = new URL(a.href);
        const hostMatch = hosts.some((host) => url.hostname.includes(host));
        if (hostMatch) {
          a.href = `${url.pathname.replace('.html', '')}${url.search}${url.hash}`;
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(`Could not make ${a.href} relative:`, error);
      }
    });
  }
  
  /**
   * Fetches metadata of page.
   * @param {string} path Pathname
   */
  export async function fetchPageMeta(path) {
    const meta = {};
    const resp = await fetch(path);
    if (resp.ok) {
      // eslint-disable-next-line no-await-in-loop
      const text = await resp.text();
      const headStr = text.split('<head>')[1].split('</head>')[0];
      const head = document.createElement('head');
      head.innerHTML = headStr;
      const metaTags = head.querySelectorAll(':scope > meta');
      metaTags.forEach((tag) => {
        const name = tag.getAttribute('name') || tag.getAttribute('property');
        const value = tag.getAttribute('content');
        if (meta[name]) meta[name] += `, ${value}`;
        else meta[name] = value;
      });
    }
    return meta;
  }
  
  /** Validate Brighcove URL.
   * @param {string} link The suspected Brightcove URL.
  */
  export function validateBrightcove(link) {
    const { hostname, pathname, searchParams } = new URL(link);
    if (hostname === 'players.brightcove.net' && searchParams) {
      const id = searchParams.get('videoId');
      if (id) {
        const [, account, type] = pathname.split('/');
        return account && type;
      }
    }
    return false;
  }
  
  /** Builds video block from a Brightcove anchor.
   * @param {Element} anchor The anchor containing the link to the Brightcove video.
   */
  export function buildVideoBlock(a) {
    const exceptionBlocks = ['video'];
    const inExceptionBlock = !exceptionBlocks.every((b) => !a.closest(`.${b}`));
    if (!inExceptionBlock) {
      const validLink = validateBrightcove(a.href);
      if (validLink) {
        const video = buildBlock('video', [[`<a href="${a.href}">${a.href}</a>`]]);
        if (a.parentElement && a.parentElement.nodeName === 'P') {
          a.parentElement.replaceWith(video);
        } else a.replaceWith(video);
      }
    }
  }
  
  /** Builds announcement bar.
   */
  async function buildAnnouncement() {
    if (getMetadata('announcement') !== 'off') {
      const resp = await fetch(`${window.location.origin}/global/announcement.plain.html`);
      if (resp.ok) {
        const wrapper = document.createElement('aside');
        wrapper.className = 'announcement';
        const announcement = document.createElement('div');
        announcement.innerHTML = await resp.text();
        decorateButtons(announcement);
        if (announcement.firstElementChild.children.length > 1) wrapper.classList.add('split');
        wrapper.append(announcement);
        wrapper.querySelectorAll('div:empty').forEach((e) => e.remove());
        if (document.querySelector('.hero.index')) {
          const hero = document.querySelector('.hero.index');
          hero.append(wrapper);
        }
        else {
          const hero = await waitForElements('.hero-container');
          hero[0].append(wrapper);
        }
      }
    }
  }
  
  async function buildWidget(main) {
    if ((getMetadata('sticky-widget') !== 'off') && (!(window.errorCode === '404'))) {
      const copaySticker = buildBlock('sticky-widget', '');
      const newSection = document.createElement('div');
      newSection.append(copaySticker);
      main.prepend(newSection);
    }
  }
  
  /**
   * Builds hero block.
   * @param {Element} main The container element
   */
  function buildHeroBlock(main) {
    if (main.querySelector('.hero')) return;
    const h1 = main.querySelector('h1');
    const picture = main.querySelector('picture');
    // eslint-disable-next-line no-bitwise
    if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
      const banner = [];
      const body = document.createElement('div');
      const section = h1.closest('main > div');
      if (!section.previousElementSibling) {
        [...section.children].forEach((child) => {
          if (child.querySelector('picture') && child.textContent.trim() === '') banner.push(child);
          else body.append(child);
        });
        section.append(buildBlock('hero', [banner, [body]]));
      } else {
        banner.push(picture);
        body.append(h1);
        const newSection = document.createElement('div');
        newSection.append(buildBlock('hero', [banner, [body]]));
        main.prepend(newSection);
      }
    }
  }
  
  function buildFragments(main) {
    main.querySelectorAll('a[href*=fragments]').forEach((a) => {
      try {
        const { origin, pathname } = new URL(a.href);
        if (origin === window.location.origin && pathname.includes('/fragments/')) {
          const fragment = buildBlock('fragment', [[`<a href="${a.href}">${a.href}</a>`]]);
          a.replaceWith(fragment);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(`Could not build fragment from ${a.href}:`, error);
      }
    });
  }
  
  function buildPagination(main) {
    const next = getMetadata('next');
    const back = getMetadata('back');
    if (next || back) {
      const pagination = buildBlock('cards', [
        [back ? `<a href="${back}">${back}</a>` : ''],
        [next ? `<a href="${next}">${next}</a>` : ''],
      ]);
      pagination.classList.add('pagination');
      decorateIcons(pagination, '/assets');
      const newSection = document.createElement('div');
      newSection.append(pagination);
      main.append(newSection);
    }
  }
  
  function buildISI(main) {
    const isiMeta = getMetadata('isi');
    if (isiMeta !== 'off' && !main.classList.contains('sidekick-library')) {
      const isiPath = (isiMeta === 'on' || !isiMeta) ? '/global/isi' : new URL(isiMeta).pathname;
      const isi = buildBlock('isi', [[`<a href="${isiPath}">${window.location.origin}/global/isi</a>`]]);
      if (isiPath === '/global/isi') isi.classList.add('isi-default');
      const newSection = document.createElement('div');
      newSection.append(isi);
      main.append(newSection);
    }
  }
  
  /**
   * Builds all synthetic blocks in a container element.
   * @param {Element} main The container element
   */
  async function buildAutoBlocks(main) {
    try {
      buildAnnouncement();
      buildHeroBlock(main);
      buildFragments(main);
      buildPagination(main);
      buildISI(main);
      buildWidget(main);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Auto Blocking failed', error);
    }
  }
  
  export function joinSubs(elem) {
    const subs = elem.querySelectorAll('sub');
    subs.forEach((sub) => {
      const p = sub.parentElement;
      if (p && p.firstElementChild.tagName === 'SUB' && p.children.length > 1) {
        p.innerHTML = `<sub>${p.textContent}</sub>`;
      }
    });
  }
  
  function trapFocus(e) {
    // add any focusable HTML element you want to include to this string
    const focusableElements = this.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
  
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (
        !e.shiftKey
        && document.activeElement === lastElement
      ) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }
  
  /**
   * Closes the modal.
   * @param {Element} modal The modal element
   */
  function closeModal(modal) {
    modal.removeEventListener('keydown', trapFocus);
    document.body.dataset.modalOpen = false;
    modal.close();
    modal.remove();
  }
  
  function closeModalOnEscape(e) {
    const modal = document.querySelector('dialog[open]');
    if (modal && e.key === 'Escape') {
      closeModal(modal);
      window.removeEventListener('keyup', closeModalOnEscape);
    }
  }
  
  /**
   * Builds and decorates modal from modal document.
   * @param {string} id The modal id
   * @param {string} path The path to the modal document
   * @param {string} destination The ultimate destination of an external link
   */
  export async function buildModal(id, path, destination) {
    const resp = await fetch(`${path}.plain.html`);
    if (resp.ok) {
      const ph = await fetchPlaceholders();
      const modal = document.createElement('dialog');
      modal.innerHTML = await resp.text();
      modal.id = id;
      modal.className = 'modal';
  
      buildFragments(modal);
      // eslint-disable-next-line no-use-before-define
      await decorateMain(modal, true);
      await loadBlocks(modal);
  
      // build modal wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'modal-wrapper';
  
      // decorate modal header
      const modalHeader = modal.firstElementChild;
      modalHeader.classList.add('modal-header');
      const title = modalHeader.querySelector('h1, h2, h3');
      if (title) {
        const labelId = toClassName(`modal-title-${title.textContent.trim()}`);
        title.id = labelId;
        modal.setAttribute('aria-labelledby', labelId);
      }
  
      // build close modal button
      const closeButton = document.createElement('button');
      closeButton.setAttribute('type', 'button');
      closeButton.className = 'modal-close';
      closeButton.setAttribute('aria-label', `${ph.modalClose}${title ? ` ${title.textContent.trim()}` : ''}`);
      closeButton.addEventListener('click', () => closeModal(modal));
      modalHeader.append(closeButton);
  
      // if header empty class is present, hide modal header
      if (modalHeader.querySelector('.header-empty')) {
        modalHeader.classList.add('hide');
        closeButton.classList.add('add-padding');
      }
  
      // decorate modal footer
      const modalFooter = modal.lastElementChild;
      if (modalFooter.querySelector('.button-container')) {
        modalFooter.classList.add('modal-footer');
        modalFooter.querySelectorAll('a[href]').forEach((a) => {
          a.addEventListener('click', () => closeModal(modal));
        });
      }
  
      // decorate modal body
      const modalBody = document.createElement('div');
      modalBody.className = 'section modal-body';
      const bodySections = [...modal.children].filter((section) => !section.className.includes('modal-'));
      bodySections.forEach((section) => {
        modalBody.classList.add(...section.classList);
        [...section.children].forEach((wrap) => modalBody.append(wrap));
      });
      modalHeader.after(modalBody);
  
      // build external modal ctas
      if (destination) {
        const primary = document.createElement('a');
        primary.className = 'button primary';
        primary.href = destination;
        primary.dataset.modal = false;
        primary.setAttribute('rel', 'noreferrer');
        primary.setAttribute('target', '_blank');
        primary.textContent = ph.externalPrimaryCta;
        primary.addEventListener('click', () => closeModal(modal));
        const secondary = document.createElement('button');
        secondary.className = 'button';
        secondary.textContent = ph.externalSecondaryCta;
        secondary.setAttribute('type', 'button');
        secondary.addEventListener('click', () => closeModal(modal));
  
        // wrap external modal ctas
        const wrap = document.createElement('p');
        wrap.className = 'button-container button-container-multi';
        wrap.append(primary, secondary);
        const container = document.createElement('div');
        container.append(wrap);
        modalFooter.append(container);
        modalFooter.className = 'section modal-footer';
      }
  
      // wrap modal content
      const content = document.createElement('div');
      content.className = 'modal-content';
      content.append(modalHeader, modalBody);
      if (modalFooter.hasChildNodes()) content.append(modalFooter);
      wrapper.append(content);
  
      [...modal.children].forEach((el) => {
        if (el.textContent.trim() === '') el.remove();
      });
      wrapper.append(content);
      modal.prepend(wrapper);
  
      // build backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
  
      backdrop.addEventListener('click', () => {
        const copayModal = document.querySelector('#modal-global-modals-copay-form');
        const signupModal = document.querySelector('#modal-global-modals-signup-form');
        if (!copayModal && !signupModal) {
          setTimeout(() => { closeModal(modal); }, 100);
        }
      });
  
      modal.append(backdrop);
  
      return modal;
    }
    return null;
  }
  
  /**
   * Updates primary CTA of modal by id.
   * @param {string} id The modal id
   * @param {string} destination The ultimate destination of an external link
   */
  function updateExternalModal(id, destination) {
    const modal = document.getElementById(id);
    if (modal) {
      const primary = modal.querySelector('.modal-footer .button.primary');
      if (primary) primary.href = destination;
    }
  }
  
  /**
   * Setup event listener on document.body for modals.
   */
  async function setupModals() {
    const respAllow = await fetch('/global/popups/external-link-allowlist.json');
    if (!respAllow.ok) {
      return;
    }
  
    const jsonLinkAllowList = await respAllow.json();
    const allowListLink = jsonLinkAllowList.data.map((obj) => {
      const flatDomain = Object.values(obj).flat()[0];
      return flatDomain;
    });
  
    const origins = [
      window.location.origin,
      ...allowListLink,
      ...PRODUCTION_DOMAINS.map((d) => `https://${d}`),
    ];
    const modalExceptions = ['pfizer', 'tel:', 'mailto:'];
  
    document.body.addEventListener('click', async (e) => {
      const a = e.target.closest('a[href]');
      if (a) {
        const { href } = a;
        try {
          const { origin, pathname, hash } = new URL(href, window.location.href);
          if (hash !== '#no-modal' && a.dataset.modal !== 'false') {
            // anchor on page
            if (hash) {
              const target = document.getElementById(hash.replace('#', ''));
              if (target && origin === window.location.origin) {
                e.preventDefault();
                const vertical = getComputedStyle(document.documentElement)
                  .getPropertyValue('--spacing-vertical')
                  .replace('rem', '') * 16 || 16;
                const scrollTo = target.tagName.startsWith('H') ? target : target.closest('.section');
                const top = scrollTo.getBoundingClientRect().top + window.scrollY - vertical;
                window.scrollTo({ top, behavior: 'smooth' });
              }
            }
            const external = !origins.includes(origin)
              && !modalExceptions.find((exception) => href.includes(exception));
            if (external || (window.location.origin === origin && pathname.includes('/modals/')) || (window.location.origin === origin && pathname.includes('/popups/'))) {
              // build modal
              e.preventDefault();
              const id = external ? 'modal-external-link' : toClassName(`modal-${pathname}`);
              if (!document.getElementById(id)) {
                const source = external ? '/global/popups/external-link' : href;
                const destination = external ? href : null;
                const modal = await buildModal(id, source, destination);
                document.body.append(modal);
              } else if (external) {
                updateExternalModal(id, href);
              }
              document.body.dataset.modalOpen = true;
              document.getElementById(id).show();
              document.getElementById(id).addEventListener('keydown', trapFocus);
              const modalBody = document.getElementById(id).querySelector('.modal-body');
              if (modalBody) modalBody.scrollTop = 0;
              window.addEventListener('keyup', closeModalOnEscape);
              // This is required to prevent blocking of Data Layer Modal tracking
              const formErrors = document.querySelectorAll('form .form-error');
              const blurred = document.querySelectorAll('form .blurred');
              const getForm = document.getElementById(id).querySelector('form');
              const isSelected = document.querySelectorAll('.is-selected');
              const loading = document.querySelector('.loading');
              if (getForm) {
                getForm.scrollIntoView({
                  behavior: 'instant',
                  block: 'start',
                });
                if (blurred.length > 0) {
                  blurred.forEach((b) => {
                    b.classList.remove('blurred');
                  });
                }
                if (formErrors.length > 0) {
                  formErrors.forEach((fe) => {
                    fe.parentNode.classList.remove('form-error-parent');
                    fe.remove();
                  });
                }
                if (isSelected.length > 0) {
                  isSelected.forEach((fe) => {
                    fe.classList.remove('is-selected');
                  });
                }
                if (loading) {
                  loading.classList.remove('loading');
                  loading.removeAttribute('disabled');
                }
                getForm.reset();
                if (document.querySelector('#smsCheckbox')) {
                  document.querySelector('#smsCheckbox').parentNode.remove();
                }
                if (document.querySelector('.address_button')) {
                  const ph = await fetchPlaceholders();
                  const addressLine1 = document.querySelector('#addressLine1');
                  const addressLine2 = document.querySelector('#addressLine2');
                  const addressCity = document.querySelector('#addressCity');
                  const addressState = document.querySelector('#addressState');
                  const addressZipCode = document.querySelector('#addressZipCode');
                  const add = [addressLine1, addressLine2, addressCity, addressState, addressZipCode];
                  document.querySelector('.address_button').firstChild.innerHTML = ph.addressCollapsedButtonText;
                  add.forEach((field) => {
                    field.parentNode.classList.add('hide');
                  });
                }
              }
            }
          } else if (hash === '#no-modal' || a.dataset.modal === 'false') {
            e.preventDefault();
            a.dataset.modal = false;
            window.open(href.replace('#no-modal', ''), '_blank');
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(`Could not open link ${a.href}:`, error);
        }
      }
    });
  }
  
  export function fixInvertedPrimaryButtons(elems) {
    elems.forEach((elem) => {
      const buttons = elem.querySelectorAll('.button');
      buttons.forEach((button) => {
        if (button.querySelector('strong')) button.classList.add('primary');
      });
    });
  }
  
  /**
   * Decorates the main element.
   * @param {Element} main The main element
   */
  // eslint-disable-next-line import/prefer-default-export
  export async function decorateMain(main, fragment = false) {
    decorateButtons(main);
    decorateIcons(main, '/assets');
    if (!fragment) await buildAutoBlocks(main);
    // decorate brightcove links
    main.querySelectorAll('a[href*=brightcove]').forEach((link) => {
      if (link.href === link.textContent) buildVideoBlock(link);
    });
    // decorate heading eyebrows
    main.querySelectorAll('p > strong').forEach((strong) => {
      const p = strong.closest('p');
      if (p.textContent.trim() === strong.textContent.trim()) {
        const next = p.nextElementSibling;
        if (next && next.nodeName.startsWith('H')) p.className = 'eyebrow';
      }
    });
    // decorate footnotes
    main.querySelectorAll('p > sub, p > strong > sub, p > em > sub').forEach((sub) => {
      sub.closest('p').className = 'footnote';
    });
    decorateSections(main);
    // decorate heading only 'sections'
    main.querySelectorAll('.section').forEach((section) => {
      if (section.children.length === 1) {
        const wrapper = section.firstElementChild;
        if ([...wrapper.children].every((child) => child.tagName.startsWith('H') || child.className === 'eyebrow')) {
          section.classList.add('heading-only');
        }
      }
    });
    // decorate heading and footnote only content-wrappers
    main.querySelectorAll('.section .default-content-wrapper').forEach((wrapper) => {
      if ([...wrapper.children].every((child) => child.className === 'footnote')) {
        wrapper.classList.add('footnote-only');
        const previous = wrapper.previousElementSibling;
        if (previous) previous.classList.add('has-footnote');
      } else if ([...wrapper.children].every((child) => child.tagName.startsWith('H') || child.className === 'eyebrow')) {
        wrapper.classList.add('heading-only');
      }
    });
    decorateBlocks(main);
    if (!fragment) setupModals();
  }
  
  /**
   * Loads everything needed to get to LCP.
   * @param {Element} doc The container element
   */
  async function loadEager(doc) {
    document.documentElement.lang = 'en';
    decorateTemplateAndTheme();
  
    // font loading
    if (window.innerWidth >= 900) loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
    try {
      if (sessionStorage.getItem('fonts-loaded')) loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
    } catch (error) {
      // do nothing
    }
  
    const main = doc.querySelector('main');
  
    /* temporary subs fix */
    // joinSubs(main);
  
    if (main) {
      await decorateMain(main);
      document.body.classList.add('appear');
      await waitForLCP(LCP_BLOCKS);
    }
  }
  
  /**
   * Adds the favicon.
   * @param {string} href The favicon URL
   */
  export function addFavIcon(href) {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = href;
    const existingLink = document.querySelector('head link[rel="icon"]');
    if (existingLink) {
      existingLink.parentElement.replaceChild(link, existingLink);
    } else {
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }
  
  /**
   * Loads everything that doesn't need to be delayed.
   * @param {Element} doc The container element
   */
  async function loadLazy(doc) {
    const main = doc.querySelector('main');
    await loadBlocks(main);
  
    const { hash } = window.location;
    const element = hash ? doc.getElementById(hash.substring(1)) : false;
    if (hash && element) element.scrollIntoView();
  
    loadHeader(doc.querySelector('header'));
    loadFooter(doc.querySelector('footer'));
  
    loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  
    loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`, () => {
      try {
        if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
      } catch (error) {
        // do nothing
      }
    });
  
    sampleRUM('lazy');
    sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
    sampleRUM.observe(main.querySelectorAll('picture > img'));
  
    // Load reviews logic
    if (window.location.hostname === 'localhost'
      || window.location.hostname.endsWith('.web.pfizer')) {
      try {
        await import(`${window.hlx.cmsBasePath}/tools/sidekick/sidekick.js`);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to import review.js:', error);
      }
    }
  }
  
  /**
   * Loads everything that happens a lot later,
   * without impacting the user experience.
   */
  function loadDelayed() {
    // eslint-disable-next-line import/no-cycle
    window.setTimeout(() => import('./delayed.js'), 0);
    // load anything that can be postponed to the latest here
  }
  
  async function loadPage() {
    // handle 404 from document
    if (window.errorCode === '404') {
      const resp = await fetch('/global/404.plain.html');
      if (resp.status === 200) {
        const html = await resp.text();
        const main = document.querySelector('main');
        main.innerHTML = html;
        main.classList.remove('error');
      }
    }
    await loadEager(document);
    await loadLazy(document);
    loadDelayed();
  }
  
  loadPage();
  
  export function ariaLabelToLink() {
    const iconList = document.querySelectorAll('span.icon');
    iconList.forEach((item) => {
      const classApplied = item.classList;
      let otherClassName;
      classApplied.forEach((clsName) => {
        otherClassName = clsName !== 'icon' ? clsName : null;
      });
      const targetElem = item.parentElement;
      if (otherClassName) {
        otherClassName = otherClassName.replace(/-/g, ' ');
        if (targetElem.tagName === 'A') {
          targetElem.setAttribute('aria-label', `${otherClassName}`);
        } else if (targetElem.parentElement.tagName === 'A') {
          targetElem.parentElement.setAttribute('aria-label', `${otherClassName}`);
        }
      }
    });
  }