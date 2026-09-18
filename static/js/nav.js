const NAV_ITEMS = [
  { href: 'index.html', label: 'Dashboard' },
  { href: 'log.html', label: 'Log a reading' },
  { href: 'hba1c.html', label: 'HbA1c' },
  { href: 'medications.html', label: 'Medications' },
  { href: 'guidance.html', label: 'Daily guidance' }
];

function renderNav(activeHref){
  const slot = document.getElementById('sidebar-slot');
  if(!slot) return;

  const links = NAV_ITEMS.map(item =>
    `<li><a href="${item.href}" class="${item.href === activeHref ? 'active' : ''}">${item.label}</a></li>`
  ).join('');

  const session = typeof getSession === 'function' ? getSession() : null;

  slot.innerHTML = `
    <div class="brand">
      <span class="brand-mark"></span>
      <span class="brand-name">GlucoTrack</span>
    </div>
    <button class="menu-toggle" id="menu-toggle" aria-expanded="false" aria-controls="nav-list">
      Menu
    </button>
    <ul class="nav-list" id="nav-list">${links}</ul>
    <div class="sidebar-foot">
      ${session ? `Signed in as ${session.name}<br><button id="logout-btn" style="background:none;border:none;padding:0;margin-top:6px;color:var(--accent);font-size:.8rem;font-weight:600;cursor:pointer;text-decoration:underline;">Log out</button>` : 'Your readings stay on this device unless you connect a backend.'}
    </div>
  `;

  const logoutBtn = document.getElementById('logout-btn');
  if(logoutBtn){
    logoutBtn.addEventListener('click', () => {
      logoutUser();
      window.location.href = 'login.html';
    });
  }

  const toggle = document.getElementById('menu-toggle');
  const list = document.getElementById('nav-list');
  toggle.addEventListener('click', () => {
    const open = list.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}