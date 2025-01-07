import { getMetadata, decorateIcons } from '../../scripts/lib-franklin.js';
import { ariaLabelToLink } from '../../scripts/scripts.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 1100px)');

/**
 * Create a skip to main link
 */

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const sections = nav.querySelector('.nav-sections');
    const navSectionExpanded = sections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllSections(sections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, sections);
      nav.querySelector('button').focus();
    }
  }
}

function maintainingFocus() {
  const main = document.querySelector('main');
  main.setAttribute('aria-hidden', 'true');
  const footer = document.querySelector('footer ');
  footer.setAttribute('aria-hidden', 'true');
  const mainLinks = document.querySelectorAll('main a, main button');
  mainLinks.forEach((item) => {
    item.setAttribute('tabindex', '-1');
  });
  const footerLinks = document.querySelectorAll('footer a');
  footerLinks.forEach((item) => {
    item.setAttribute('tabindex', '-1');
  });
}

function removingFocus() {
  const main = document.querySelector('main');
  main.setAttribute('aria-hidden','false');
  const footer = document.querySelector('footer ');
  footer.setAttribute('aria-hidden','false');
  const mainLinks = document.querySelectorAll('main a, main button');
  mainLinks.forEach((item) => {
    item.removeAttribute('tabindex');
  });
  const footerLinks = document.querySelectorAll('footer a');
  footerLinks.forEach((item) => {
    item.removeAttribute('tabindex');
  });
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-link';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections > ul > li.nav-drop > .nav-link').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} sections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, sections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  document.body.dataset.navOpen = !(expanded || isDesktop.matches);
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (!expanded && !isDesktop.matches) {
    const announcement = document.querySelector('body > aside.announcement');
    const height = window.innerHeight - (announcement ? announcement.offsetHeight : 0);
    nav.style.height = `${height}px`;
  } else {
    nav.removeAttribute('style');
  }
  toggleAllSections(sections, !expanded || isDesktop.matches ? 'false' : 'true');
  const button = nav.querySelector('.nav-hamburger button');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  //keeping focus inside the hamburger menu for mobile view
  if(!expanded && !isDesktop.matches){
    maintainingFocus();
  }
  if(expanded || isDesktop.matches){
    removingFocus();
  }
  // enable nav dropdown keyboard accessibility
  const navDrops = sections.querySelectorAll('.nav-link');
  navDrops.forEach((drop) => {
    if (!drop.hasAttribute('tabindex')) {
      drop.setAttribute('role', 'button');
      drop.setAttribute('tabindex', 0);
      drop.addEventListener('focus', focusNavSection);
    }
  });
  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const bodyContent = document.querySelector('body');
  // fetch nav content
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/global/nav';
  const resp = await fetch(`${navPath}.plain.html`);

  if (resp.ok) {
    const html = await resp.text();

    // decorate nav DOM
    const nav = document.createElement('nav');
    nav.id = 'nav';
    nav.innerHTML = html;

    const classes = ['brand', 'sections', 'cta', 'ctas', 'menu', 'social', 'logo'];
    classes.forEach((c, i) => {
      const section = nav.children[i];
      if (section) section.classList.add(`nav-${c}`);
    });

    // hamburger for mobile
    const hamburger = document.createElement('div');
    hamburger.classList.add('nav-hamburger');
    hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
        <span class="nav-hamburger-icon"></span>
      </button>`;
    hamburger.addEventListener('click', () => toggleMenu(nav, sections));
    nav.prepend(hamburger);

    // decorate dropdown navigation
    const sections = nav.querySelector('.nav-sections');
    if (sections) {
      sections.querySelectorAll(':scope > ul > li').forEach((navSection) => {
        if (navSection.querySelector('ul')) {
          navSection.classList.add('nav-drop');
          const drop = navSection.querySelector('ul');
          drop.remove();
          const navText = document.createElement('span');
          navText.classList.add('nav-link');
          navText.innerHTML = navSection.innerHTML.trim();
          navSection.innerHTML = '';
          navSection.append(navText, drop);
        }
        navSection.addEventListener('click', (e) => {
          if (e.target.parentElement.children.length === 1) return;
          const navLink = navSection.querySelector('.nav-link');
          const expanded = navLink.getAttribute('aria-expanded') === 'true';
          toggleAllSections(sections);
          navLink.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        });
      });
      const as = [...sections.querySelectorAll('a[href]')];
      const current = as.find((a) => {
        const { pathname } = new URL(a.href);
        return pathname === window.location.pathname;
      });
      if (current) {
        let currentDrop;
        current.setAttribute('aria-current', 'page');
        if ((bodyContent.classList.contains('nurtec-homepage')) || (bodyContent.classList.contains('nurtec-savings'))) {
          currentDrop = current.closest('.nav-drop');
        } else {
          currentDrop = current.closest('.nav-drop').querySelector('.nav-link');
        }
        if (currentDrop) {
          currentDrop.setAttribute('aria-expanded', true);
        }
      }
    }

    // decorate ctas
    const ctas = [...nav.querySelectorAll('.nav-cta a, .nav-ctas a')];
    ctas.forEach((a) => {
      a.parentElement.classList.add('button-container');
      a.className = 'button';
      a.classList.add('primary');
    });

    if(!isDesktop.matches){
      //decorate cta
      const cta = nav.querySelector('.nav-cta');
      nav.prepend(cta);

      //decorate brand
      const brand = nav.querySelector('.nav-brand');
      nav.prepend(brand);
    }
    
    // decorate social buttons
    const social = nav.querySelector('.nav-social');
    if (social) {
      social.querySelectorAll('a[href]').forEach((a) => a.classList.add('button'));
    }

    // build utility links from menu for mobile
    const menu = nav.querySelector('.nav-menu');
    if (menu) {
      const bold = menu.querySelectorAll('li strong');
      if (bold) {
        const utility = document.createElement('div');
        utility.className = 'nav-utility';
        const ul = document.createElement('ul');
        const lis = [...bold].map((b) => b.closest('li'));
        lis.forEach((li) => {
          const a = li.querySelector('a[href]');
          // remove unnecessary styling
          const cleanA = document.createElement('a');
          cleanA.href = a.href;
          cleanA.textContent = a.textContent;
          li.innerHTML = cleanA.outerHTML;
          li.className = 'nav-utility-link';
          // add to utility section for mobile
          const utilityLi = document.createElement('li');
          utilityLi.append(cleanA);
          ul.append(utilityLi);
        });
        if (utility.hasChildNodes) {
          utility.append(ul);
          nav.prepend(utility);
        }
      }
    }

    // build access buttons
    const access = nav.querySelector('.nav-access');
    if (access) {
      const utilities = access.querySelectorAll('li span.icon');
      utilities.forEach((utility) => {
        const button = document.createElement('button');
        button.setAttribute('type', 'button');
        button.append(utility.cloneNode());
        const type = utility.className.split(' ').pop().replace('icon-', '');
        button.id = `nav-access-${type}`;
        utility.replaceWith(button);
      });
    }

    nav.setAttribute('aria-expanded', 'false');
    // prevent mobile nav behavior on window resize
    toggleMenu(nav, sections, isDesktop.matches);
    // open current nav section
    const current = nav.querySelector('[aria-current]');
    if (current) {
      let currentDrop;
      if ((bodyContent.classList.contains('nurtec-homepage')) || (bodyContent.classList.contains('nurtec-savings'))) {
        currentDrop = current.closest('.nav-drop');
      } else {
        currentDrop = current.closest('.nav-drop').querySelector('.nav-link');
      }
      if (currentDrop) currentDrop.setAttribute('aria-expanded', true);
    }
    isDesktop.addEventListener('change', () => toggleMenu(nav, sections, isDesktop.matches));

    decorateIcons(nav, '/assets');
    const navWrapper = document.createElement('div');
    navWrapper.className = 'nav-wrapper';
    navWrapper.append(nav);
    block.innerHTML = '';
    block.append(navWrapper);

    //skip to content button
    const link = document.createElement('a');
    const mainContent = document.getElementById('main-content-block');
    link.classList.add('skip-button');
    link.href = '#main-content-block';
    link.textContent = 'Skip to Content';
    link.setAttribute('tabindex', '0');
    var toBody = document.querySelector('body');
    toBody.insertBefore(link, toBody.firstChild);
    link.addEventListener('click', function(e) {
      e.preventDefault();
      mainContent.scrollIntoView({behavior:'smooth'});
      mainContent.setAttribute('tabindex', '-1');
      mainContent.focus();
      link.blur();
    });
  }

  /* Width and height to pfizer outdoyesterday logo */
  const navLogo = document.querySelector('.icon-outdueyesterday img');
  navLogo.setAttribute('width', '163');
  navLogo.setAttribute('height', '94');

  ariaLabelToLink();
}
