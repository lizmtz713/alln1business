/* Phone navigation only; no form, chat, or email changes. */
(() => {
  const mobile = window.matchMedia('(max-width:820px)');
  document.querySelectorAll('header.nav').forEach(header => {
    const button = header.querySelector('.nav-toggle');
    const nav = header.querySelector('.nav-inner > nav');
    const panel = header.querySelector('.mobile-nav-panel');
    if (!button || !nav || !panel) return;
    nav.querySelectorAll('a').forEach(link => {
      const copy = link.cloneNode(true);
      copy.removeAttribute('id');
      copy.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
      panel.appendChild(copy);
    });
    const close = () => {
      panel.hidden = true;
      button.setAttribute('aria-expanded', 'false');
    };
    button.addEventListener('click', () => {
      if (!mobile.matches) return;
      const open = button.getAttribute('aria-expanded') !== 'true';
      panel.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
    });
    panel.addEventListener('click', event => {
      if (event.target.closest('a')) close();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !panel.hidden) {
        close();
        button.focus();
      }
    });
    document.addEventListener('click', event => {
      if (!header.contains(event.target)) close();
    });
    mobile.addEventListener('change', () => close());
  });
})();
