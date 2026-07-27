/* =============================================================
   SAMADHAN — Gautam Buddha University Grievance Portal
   Frontend application logic
   -------------------------------------------------------------
   */

(() => {
  'use strict';

  /* ---------------------------------------------------------
     Shorthands, storage keys, module state
  --------------------------------------------------------- */
  const $ = id => document.getElementById(id);
  const KEY = 'samadhanTickets';
  const PROFILE = 'samadhanStudentProfile';

  let priority = 'Low';
  let isAdmin = false;
  let viewHistory = [];

  /* ---------------------------------------------------------
     Seed tickets — used only the first time localStorage is empty
  --------------------------------------------------------- */
  const seed = [
    {
      id: '#GBU-2026-A4K2',
      name: 'Aarav Sharma',
      roll: 'GBU/2024/0912',
      email: 'aarav@gbu.ac.in',
      academic: 'School of ICT · B.Tech',
      category: 'Hostel',
      priority: 'Medium',
      description: 'Water supply has been disrupted in Block C for two days.',
      status: 'In Progress',
      submitted: '2026-07-14'
    },
    {
      id: '#GBU-2026-R9G7',
      name: 'Priya Singh',
      roll: 'GBU/2023/0441',
      email: 'priya@gbu.ac.in',
      academic: 'School of Management · MBA',
      category: 'Ragging',
      priority: 'High',
      description: 'Requesting urgent confidential intervention regarding a ragging incident.',
      status: 'Pending',
      submitted: '2026-07-23'
    },
    {
      id: '#GBU-2026-M2P8',
      name: 'Kunal Verma',
      roll: 'GBU/2025/1788',
      email: 'kunal@gbu.ac.in',
      academic: 'School of Engineering · B.Tech',
      category: 'Academics',
      priority: 'Low',
      description: 'Grade not visible on the student portal.',
      status: 'Resolved',
      submitted: '2026-07-18'
    },
    {
      id: '#GBU-2026-F6Q1',
      name: 'Meera Joshi',
      roll: 'GBU/2024/0670',
      email: 'meera@gbu.ac.in',
      academic: 'School of Biotechnology · M.Tech',
      category: 'Faculty',
      priority: 'Medium',
      description: 'Request for a review of timetable overlap.',
      status: 'Pending',
      submitted: '2026-07-21'
    }
  ];

  /* ---------------------------------------------------------
     Ticket storage helpers
  --------------------------------------------------------- */
  function getTickets() {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY));
      if (Array.isArray(stored)) return stored;
    } catch (e) {
      /* corrupted storage — fall through to reseed */
    }
    localStorage.setItem(KEY, JSON.stringify(seed));
    return seed;
  }

  function setTickets(tickets) {
    localStorage.setItem(KEY, JSON.stringify(tickets));
  }

  /* ---------------------------------------------------------
     Small utilities
  --------------------------------------------------------- */
  function esc(value) {
    return String(value).replace(/[&<>'"]/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[c]));
  }

  function cls(status) {
    return status === 'In Progress' ? 'in-progress' : status.toLowerCase();
  }

  function toast(msg, icon = 'fa-circle-check') {
    const d = document.createElement('div');
    d.className = 'toast';
    d.innerHTML = `<i class="fa-solid ${icon}"></i>${esc(msg)}`;
    $('toastbox').appendChild(d);
    setTimeout(() => d.remove(), 3800);
  }

  /* ---------------------------------------------------------
     View / navigation handling
  --------------------------------------------------------- */
  function enterApp(view) {
    $('landing').classList.add('hidden');
    $('application').classList.remove('hidden');
    $('portalNav').classList.toggle('hidden', view !== 'admin');
    $('studentTrack').classList.toggle('hidden', view === 'admin' || view === 'studentAuth');
    $('signOut').classList.add('hidden');
    $('backToWelcome').classList.remove('hidden');
    $('chatFab').classList.toggle('hidden', view === 'admin');
    if (view === 'admin') $('chat').classList.remove('show');
    showView(view);
  }

  function showView(view, skipHistory = false) {
    const active = document.querySelector('.content-view.active');
    if (!skipHistory && active && active.id !== view) viewHistory.push(active.id);

    document.querySelectorAll('.content-view').forEach(x => x.classList.remove('active'));
    $(view).classList.add('active');

    $('studentTrack').classList.toggle('hidden', view === 'admin' || view === 'studentAuth');
    $('chatFab').classList.toggle('hidden', view === 'admin');
    if (view === 'admin') $('chat').classList.remove('show');

    document.querySelectorAll('.navbtn').forEach(x =>
      x.classList.toggle('active', x.dataset.view === view && !x.dataset.adminFilter)
    );

    if (view === 'admin') renderAdmin();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('.navbtn').forEach(b => b.addEventListener('click', () => {
    showView(b.dataset.view);
    if (b.dataset.adminFilter) {
      $('filterStatus').value = b.dataset.adminFilter === 'resolved' ? 'Resolved' : '';
      document.querySelectorAll('.navbtn').forEach(x => x.classList.toggle('active', x === b));
      renderRows();
    }
  }));

  $('studentTrack').onclick = () => showView('track');

  $('chooseStudent').onclick = () => { viewHistory = []; enterApp('studentAuth'); };

  $('chooseAdmin').onclick = () => { viewHistory = []; enterApp('admin'); openAdminModal(); };

  $('signOut').onclick = () => {
    isAdmin = false;
    $('application').classList.add('hidden');
    $('landing').classList.remove('hidden');
    $('portalNav').classList.add('hidden');
    $('studentTrack').classList.add('hidden');
    $('signOut').classList.add('hidden');
    $('backToWelcome').classList.add('hidden');
    $('chatFab').classList.add('hidden');
    $('chat').classList.remove('show');
  };

  /* ---------------------------------------------------------
     Auth tabs (signup / login) + student profile
  --------------------------------------------------------- */
  document.querySelectorAll('.tab').forEach(b => b.onclick = () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === b));
    $('signupForm').classList.toggle('hidden', b.dataset.auth !== 'signup');
    $('studentLoginForm').classList.toggle('hidden', b.dataset.auth !== 'login');
  });

  function saveProfile(p) {
    localStorage.setItem(PROFILE, JSON.stringify(p));
  }

  function profile() {
    try { return JSON.parse(localStorage.getItem(PROFILE)); }
    catch (e) { return null; }
  }

  function fillProfile() {
    const p = profile();
    if (!p) return;
    $('gName').value = p.name;
    $('gEmail').value = p.email;
    $('gRoll').value = p.roll;
    $('gDepartment').value = p.department;
    $('gCourse').value = p.course;
    $('gYear').value = p.year;
    $('gBranch').value = p.branch;
  }

  $('signupForm').addEventListener('submit', e => {
    e.preventDefault();
    const p = {
      name: $('suName').value.trim(),
      email: $('suEmail').value.trim(),
      roll: $('suRoll').value.trim(),
      password: $('suPass').value,
      department: $('suDepartment').value.trim(),
      course: $('suCourse').value.trim(),
      year: $('suYear').value,
      branch: $('suBranch').value.trim()
    };
    saveProfile(p);
    fillProfile();
    enterApp('submit');
    toast('Profile created. Your details have been pre-filled.');
  });

  $('studentLoginForm').addEventListener('submit', e => {
    e.preventDefault();
    const p = profile();
    if (!p || p.email.toLowerCase() !== $('liEmail').value.trim().toLowerCase() || p.password !== $('liPass').value) {
      toast('Email or password not found. Please create an account first.', 'fa-circle-exclamation');
      return;
    }
    fillProfile();
    enterApp('submit');
    toast('Welcome back, ' + p.name.split(' ')[0] + '!');
  });

  /* ---------------------------------------------------------
     Grievance form — priority buttons, category rule, counter
  --------------------------------------------------------- */
  document.querySelectorAll('[data-priority]').forEach(b => b.onclick = () => {
    priority = b.dataset.priority;
    document.querySelectorAll('[data-priority]').forEach(x => x.classList.toggle('selected', x === b));
  });

  $('gCategory').onchange = () => {
    if ($('gCategory').value === 'Ragging') {
      priority = 'High';
      document.querySelectorAll('[data-priority]').forEach(x => x.classList.toggle('selected', x.dataset.priority === 'High'));
      toast('Ragging complaints are automatically High Priority.', 'fa-triangle-exclamation');
    }
  };

  $('gDescription').oninput = () => {
    const n = $('gDescription').value.length;
    $('characterCounter').textContent = `${n} / 1000 characters used`;
    $('characterCounter').classList.toggle('warning', n > 900);
  };

  /* ---------------------------------------------------------
     Ticket tracking
  --------------------------------------------------------- */
  function track() {
    let q = $('searchTicket').value.trim().toUpperCase();
    if (q && !q.startsWith('#')) q = '#' + q;

    const t = getTickets().find(x => x.id === q);
    const box = $('ticketResult');

    if (!t) {
      box.innerHTML = '<h3 class="form-title">Ticket not found</h3><p class="sub">Please check the ticket number and try again.</p>';
      box.classList.add('show');
      return;
    }

    const age = Math.floor((Date.now() - new Date(t.submitted + 'T00:00:00').getTime()) / 86400000);
    const late = age > 7 && t.status !== 'Resolved';
    const n = t.status === 'Resolved' ? 3 : t.status === 'In Progress' ? 2 : 1;

    box.innerHTML = `
      <div class="result-head">
        <div>
          <div class="eyebrow">${esc(t.category)} grievance</div>
          <h2 class="form-title" style="margin-top:5px">${esc(t.id)}</h2>
          <p class="sub" style="margin:4px 0">Submitted ${new Date(t.submitted + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <span class="badge ${cls(t.status)}">${esc(t.status)}</span>
      </div>
      ${late ? `
        <div class="alert">
          <h3><i class="fa-solid fa-triangle-exclamation"></i> Escalation alert — action overdue</h3>
          <div>This ticket has been open for more than 7 days and is now escalated.</div>
          <div class="officer">
            <b>Dr. Anjali Saxena</b> · Deputy Registrar, Student Welfare<br>
            <i class="fa-solid fa-phone"></i> +91 120 234 4200 &nbsp; <i class="fa-solid fa-envelope"></i> grievance.officer@gbu.ac.in
          </div>
        </div>` : ''}
      <div class="steps">
        <div class="step done"><div class="dot"><i class="fa-solid fa-check"></i></div>Submitted</div>
        <div class="step ${n >= 2 ? 'done' : ''}"><div class="dot">${n >= 2 ? '<i class="fa-solid fa-check"></i>' : '2'}</div>Under review</div>
        <div class="step ${n >= 3 ? 'done' : ''}"><div class="dot">${n >= 3 ? '<i class="fa-solid fa-check"></i>' : '3'}</div>Resolved</div>
      </div>
      <div style="background:var(--soft);padding:13px;border-radius:11px;margin-top:24px"><b>Concern:</b> ${esc(t.description)}</div>
    `;
    box.classList.add('show');
  }

  $('trackButton').onclick = track;
  $('searchTicket').onkeydown = e => { if (e.key === 'Enter') track(); };

  /* ---------------------------------------------------------
     Admin login modal
  --------------------------------------------------------- */
  function openAdminModal() {
    $('adminModal').classList.remove('hidden');
    $('adminModal').style.display = 'grid';
  }

  function closeAdminModal() {
    $('adminModal').classList.add('hidden');
    $('adminModal').style.display = '';
  }

  $('adminLoginPrompt').onclick = openAdminModal;
  $('closeAdminModal').onclick = closeAdminModal;
  $('adminModal').onclick = e => { if (e.target === $('adminModal')) closeAdminModal(); };

  $('adminLoginForm').addEventListener('submit', e => {
    e.preventDefault();
    if ($('adminUser').value === 'admin' && $('adminPass').value === 'admin123') {
      isAdmin = true;
      closeAdminModal();
      renderAdmin();
      toast('Administrator access unlocked');
    } else {
      toast('Incorrect administrator credentials.', 'fa-circle-exclamation');
    }
  });

  $('adminLogout').onclick = () => {
    isAdmin = false;
    renderAdmin();
    toast('Administrator signed out', 'fa-circle-info');
  };

  /* ---------------------------------------------------------
     Admin dashboard — stats + filterable ticket table
  --------------------------------------------------------- */
  function renderAdmin() {
    $('adminGate').classList.toggle('hidden', isAdmin);
    $('dashboard').classList.toggle('hidden', !isAdmin);
    if (!isAdmin) return;

    const a = getTickets();
    const c = s => a.filter(x => x.status === s).length;

    $('stats').innerHTML = [
      ['Total', a.length, 'fa-folder-open'],
      ['Pending', c('Pending'), 'fa-clock'],
      ['In Progress', c('In Progress'), 'fa-spinner'],
      ['Resolved', c('Resolved'), 'fa-circle-check'],
      ['Emergency', a.filter(x => x.priority === 'High' || x.category === 'Ragging').length, 'fa-triangle-exclamation']
    ].map(x => `
      <div class="card stat">
        <small><i class="fa-solid ${x[2]}" style="color:#d97706"></i> ${x[0]}</small>
        <b>${x[1]}</b>
      </div>
    `).join('');

    renderRows();
  }

  function renderRows() {
    if (!isAdmin) return;

    const q = $('filterSearch').value.toLowerCase();
    const ca = $('filterCategory').value;
    const st = $('filterStatus').value;
    const pr = $('filterPriority').value;

    const list = getTickets()
      .filter(t =>
        (!q || Object.values(t).join(' ').toLowerCase().includes(q)) &&
        (!ca || t.category === ca) &&
        (!st || t.status === st) &&
        (!pr || t.priority === pr)
      )
      .sort((a, b) => (b.priority === 'High') - (a.priority === 'High'));

    $('ticketRows').innerHTML = list.map(t => `
      <tr class="${t.priority === 'High' || t.category === 'Ragging' ? 'urgent' : ''}">
        <td>
          <span class="tid">${esc(t.id)}</span>
          <div class="student">${esc(t.name)}<small>${esc(t.roll)}</small></div>
        </td>
        <td>${esc(t.category)} ${t.category === 'Ragging' ? '<i class="fa-solid fa-flag" style="color:#dc2626"></i>' : ''}</td>
        <td><span class="badge ${t.priority.toLowerCase()}">${t.priority}</span></td>
        <td>${new Date(t.submitted + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
        <td><span class="badge ${cls(t.status)}">${t.status}</span></td>
        <td>
          <select class="status-select" data-id="${t.id}">
            <option ${t.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option ${t.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option ${t.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
          </select>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--muted)">No grievances match those filters.</td></tr>';

    document.querySelectorAll('.status-select').forEach(s => s.onchange = () => {
      const a = getTickets();
      const t = a.find(x => x.id === s.dataset.id);
      t.status = s.value;
      setTickets(a);
      toast(t.id + ' updated to ' + s.value, 'fa-circle-info');
      renderAdmin();
    });
  }

  [$('filterSearch'), $('filterCategory'), $('filterStatus'), $('filterPriority')].forEach(x =>
    x.addEventListener(x.tagName === 'INPUT' ? 'input' : 'change', renderRows)
  );

  /* ---------------------------------------------------------
     Grievance submission — base handler
     (kept for compatibility; superseded at capture phase below
     by the enhanced handler that also stores department/course/
     year/branch and wires up the printable receipt)
  --------------------------------------------------------- */
  $('grievanceForm').addEventListener('submit', e => {
    e.preventDefault();
    const p = profile();
    if (!p) {
      toast('Please sign in as a student first.', 'fa-circle-exclamation');
      showView('studentAuth');
      return;
    }

    const id = '#GBU-2026-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    const t = {
      id,
      name: p.name,
      email: p.email,
      roll: p.roll,
      academic: `${p.department} · ${p.course}`,
      category: $('gCategory').value,
      priority,
      description: $('gDescription').value.trim(),
      status: 'Pending',
      submitted: new Date().toISOString().slice(0, 10)
    };

    const all = getTickets();
    all.unshift(t);
    setTickets(all);

    $('receipt').innerHTML = `
      <div class="receipt-top">
        <div>
          <div class="eyebrow" style="color:#16a34a">Grievance successfully submitted</div>
          <div class="ticketid">${id}</div>
          <p class="sub" style="margin:4px 0 0">Keep this number safe to track the resolution.</p>
        </div>
        <div>
          <button class="small-btn" id="copyId"><i class="fa-regular fa-copy"></i> Copy ID</button>
          <button class="small-btn" id="printReceipt"><i class="fa-solid fa-print"></i> Print / PDF</button>
        </div>
      </div>
    `;
    $('receipt').classList.add('show');
    $('copyId').onclick = () => navigator.clipboard && navigator.clipboard.writeText(id).then(() => toast('Ticket ID copied'));
    $('printReceipt').onclick = () => window.print();

    e.target.reset();
    priority = 'Low';
    document.querySelectorAll('[data-priority]').forEach(x => x.classList.toggle('selected', x.dataset.priority === 'Low'));
    $('characterCounter').textContent = '0 / 1000 characters used';
    toast('Grievance submitted — ' + id);
    $('receipt').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  /* ---------------------------------------------------------
     Grievance submission — enhanced handler (capture phase)
     Registered with { capture: true } and stopImmediatePropagation()
     so it runs first and blocks the base handler above from also
     firing. Stores the full profile snapshot and swaps the print
     button over to the formatted printTicket() receipt.
  --------------------------------------------------------- */
  $('grievanceForm').addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();

    const p = profile();
    if (!p) {
      toast('Please sign in as a student first.', 'fa-circle-exclamation');
      showView('studentAuth');
      return;
    }

    const id = '#GBU-2026-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    const t = {
      id,
      name: p.name,
      email: p.email,
      roll: p.roll,
      department: p.department,
      course: p.course,
      year: p.year,
      branch: p.branch,
      academic: `${p.department} · ${p.course}`,
      category: $('gCategory').value,
      priority: priority,
      description: $('gDescription').value.trim(),
      status: 'Pending',
      submitted: new Date().toISOString().slice(0, 10)
    };

    const all = getTickets();
    all.unshift(t);
    setTickets(all);

    $('receipt').innerHTML = `
      <div class="receipt-top">
        <div>
          <div class="eyebrow" style="color:#16a34a">Grievance successfully submitted</div>
          <div class="ticketid">${esc(id)}</div>
          <p class="sub" style="margin:4px 0 0">Keep this number safe to track the resolution.</p>
        </div>
        <div>
          <button class="small-btn" id="copyId"><i class="fa-regular fa-copy"></i> Copy ID</button>
          <button class="small-btn" id="printReceipt"><i class="fa-solid fa-print"></i> Print receipt / PDF</button>
        </div>
      </div>
    `;
    $('receipt').classList.add('show');

    $('copyId').onclick = () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(id).then(() => toast('Ticket ID copied'));
      } else {
        toast('Ticket ID: ' + id, 'fa-circle-info');
      }
    };
    $('printReceipt').onclick = () => printTicket(t);

    e.target.reset();
    priority = 'Low';
    document.querySelectorAll('[data-priority]').forEach(x => x.classList.toggle('selected', x.dataset.priority === 'Low'));
    $('characterCounter').textContent = '0 / 1000 characters used';
    toast('Grievance submitted — ' + id);
    $('receipt').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, true);

  /* ---------------------------------------------------------
     Printable receipt (opens in a new window and triggers print)
  --------------------------------------------------------- */
  function printTicket(t) {
    const rows = [
      ['Ticket ID', t.id],
      ['Student Name', t.name],
      ['University Email', t.email],
      ['Roll Number', t.roll],
      ['Department', t.department || '—'],
      ['Course', t.course || '—'],
      ['Year', t.year || '—'],
      ['Branch / Specialization', t.branch || '—'],
      ['Category', t.category],
      ['Priority', t.priority],
      ['Submitted', new Date(t.submitted + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
      ['Status', t.status]
    ];

    const win = window.open('', '_blank', 'width=850,height=760');
    if (!win) {
      toast('Please allow pop-ups to print your receipt.', 'fa-circle-exclamation');
      return;
    }

    win.document.write(`<!doctype html><html><head><title>Samadhan Receipt ${esc(t.id)}</title>
      <style>
        body{font-family:Arial,sans-serif;color:#0f172a;margin:42px}
        .head{display:flex;gap:14px;align-items:center;border-bottom:3px solid #d97706;padding-bottom:18px}
        .seal{width:55px;height:55px;border-radius:50%;background:#b91c1c;color:white;display:grid;place-items:center;font-weight:bold}
        .head h1{margin:0;font-size:22px}
        .head p{margin:4px 0 0;color:#64748b;font-size:12px}
        .ticket{margin:24px 0;padding:15px 18px;border-radius:10px;background:#fff7ed;font-size:20px;font-weight:bold;color:#92400e}
        .details{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden}
        .item{padding:12px;border-bottom:1px solid #e2e8f0}
        .item:nth-child(odd){border-right:1px solid #e2e8f0}
        .item b{display:block;font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:.06em;margin-bottom:4px}
        .concern{margin-top:20px;padding:16px;background:#f8fafc;border-left:4px solid #d97706;border-radius:4px}
        .concern b{display:block;margin-bottom:7px}
        .foot{margin-top:25px;color:#64748b;font-size:11px;border-top:1px solid #e2e8f0;padding-top:12px}
        @media print{body{margin:22px}}
      </style>
      </head><body>
        <div class="head">
          <div class="seal">GBU</div>
          <div><h1>Samadhan — Gautam Buddha University</h1><p>Official Grievance Submission Receipt</p></div>
        </div>
        <div class="ticket">Ticket ID: ${esc(t.id)}</div>
        <div class="details">${rows.map(r => `<div class="item"><b>${esc(r[0])}</b>${esc(r[1])}</div>`).join('')}</div>
        <div class="concern"><b>Grievance / Concern Description</b>${esc(t.description)}</div>
        <div class="foot">This is a system-generated acknowledgement. Please retain this receipt for future tracking.</div>
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  }

  /* ---------------------------------------------------------
     Theme toggle + FAQ chat bot
  --------------------------------------------------------- */
  $('theme').onclick = () => {
    document.body.classList.toggle('dark');
    $('theme').innerHTML = `<i class="fa-solid ${document.body.classList.contains('dark') ? 'fa-sun' : 'fa-moon'}"></i>`;
  };

  $('chatFab').onclick = () => $('chat').classList.toggle('show');

  document.querySelectorAll('.faq').forEach(b => b.onclick = () => $('botText').textContent = b.dataset.answer);

  /* ---------------------------------------------------------
     Back navigation (exposed globally for the header button)
  --------------------------------------------------------- */
  window.samadhanGoBack = () => {
    const previous = viewHistory.pop();
    if (previous) { showView(previous, true); return; }

    isAdmin = false;
    $('application').classList.add('hidden');
    $('landing').classList.remove('hidden');
    $('portalNav').classList.add('hidden');
    $('studentTrack').classList.add('hidden');
    $('signOut').classList.add('hidden');
    $('backToWelcome').classList.add('hidden');
    $('chatFab').classList.add('hidden');
    $('chat').classList.remove('show');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

})();

/* =============================================================
   Frontend-only "confirmation email" preview
   No email is actually transmitted — this is a prototype notice
   shown under the receipt once a grievance is submitted.
   ============================================================= */
(() => {
  const receipt = document.getElementById('receipt');

  const showEmailPreview = () => {
    const profile = JSON.parse(localStorage.getItem('samadhanStudentProfile') || '{}');
    const ticket = receipt.querySelector('.ticketid')?.textContent || 'your ticket';

    if (!receipt.classList.contains('show') || receipt.querySelector('.email-preview')) return;

    const notice = document.createElement('div');
    notice.className = 'email-preview';
    notice.style.cssText = 'margin-top:18px;padding:14px;border:1px solid #bfdbfe;background:#eff6ff;border-radius:12px;color:#1e3a8a;font-size:13px';
    notice.innerHTML = `<strong><i class="fa-solid fa-envelope-circle-check"></i> Confirmation email sent</strong><br>
      <span style="display:block;margin-top:5px">A confirmation for <b>${ticket}</b> has been sent to <b>${profile.email || 'your registered email'}</b>. This is a frontend prototype, so no real email has been sent.</span>`;
    receipt.appendChild(notice);
  };

  new MutationObserver(showEmailPreview).observe(receipt, { childList: true, subtree: true });
})();

/* Header "back" button */
document.getElementById('backToWelcome').addEventListener('click', () => window.samadhanGoBack());

/* =============================================================
   "Submit another grievance" flow
   Once a receipt is shown, the form card is swapped out for it;
   this button lets the student reset back to a fresh, pre-filled
   form without needing to re-navigate.
   ============================================================= */
(() => {
  const receipt = document.getElementById('receipt');
  const formCard = document.getElementById('grievanceCard');
  const form = document.getElementById('grievanceForm');

  const restoreProfile = () => {
    const p = JSON.parse(localStorage.getItem('samadhanStudentProfile') || '{}');
    document.getElementById('gName').value = p.name || '';
    document.getElementById('gEmail').value = p.email || '';
    document.getElementById('gRoll').value = p.roll || '';
    document.getElementById('gDepartment').value = p.department || '';
    document.getElementById('gCourse').value = p.course || '';
    document.getElementById('gYear').value = p.year || '';
    document.getElementById('gBranch').value = p.branch || '';
  };

  new MutationObserver(() => {
    if (!receipt.classList.contains('show') || receipt.querySelector('.another-grievance')) return;

    receipt.parentNode.insertBefore(receipt, formCard);
    formCard.classList.add('hidden');

    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'outline-btn another-grievance';
    action.style.cssText = 'margin-top:18px';
    action.innerHTML = '<i class="fa-solid fa-plus"></i> Submit another grievance';

    action.addEventListener('click', () => {
      form.reset();
      restoreProfile();
      document.getElementById('characterCounter').textContent = '0 / 1000 characters used';
      document.getElementById('characterCounter').classList.remove('warning');
      document.querySelectorAll('[data-priority]').forEach(x => x.classList.toggle('selected', x.dataset.priority === 'Low'));
      receipt.classList.remove('show');
      formCard.classList.remove('hidden');
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    receipt.appendChild(action);
  }).observe(receipt, { childList: true, subtree: true });
})();

/* =============================================================
   Admin dashboard — "Active" tab filter
   The Active tab hides resolved rows client-side; the Resolved
   tab instead reuses the existing status dropdown filter.
   ============================================================= */
document.addEventListener('click', event => {
  const tab = event.target.closest('[data-admin-filter]');
  if (!tab || tab.dataset.adminFilter !== 'active') return;

  document.querySelectorAll('#ticketRows tr').forEach(row => {
    const isResolved = Array.from(row.querySelectorAll('.badge')).some(b => b.textContent.trim() === 'Resolved');
    row.style.display = isResolved ? 'none' : '';
  });
});

/* =============================================================
   Working-day escalation assistance
   Appended below the ticket-tracking result once a ticket is
   found and still open. Shows the Grievance Coordinator's
   contact after 7 working days, and the Dean/Higher Authorities
   contact after 10.
   ============================================================= */
(() => {
  const result = document.getElementById('ticketResult');

  const esc = value => String(value).replace(/[&<>'"]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[c]));

  const workingDays = date => {
    const start = new Date(date + 'T00:00:00');
    const end = new Date();
    end.setHours(0, 0, 0, 0);

    let count = 0;
    const cursor = new Date(start);
    cursor.setDate(cursor.getDate() + 1);

    while (cursor <= end) {
      if (cursor.getDay() !== 0 && cursor.getDay() !== 6) count++;
      cursor.setDate(cursor.getDate() + 1);
    }
    return count;
  };

  const showDialog = (title, message) => {
    const dialog = document.createElement('div');
    dialog.className = 'assist-dialog';
    dialog.innerHTML = `
      <div class="assist-dialog-box" role="dialog" aria-modal="true">
        <h2>${esc(title)}</h2>
        <p>${esc(message)}</p>
        <div class="assist-dialog-actions">
          <button class="outline-btn" data-cancel>Cancel</button>
          <button class="primary-btn" data-continue>Continue</button>
        </div>
      </div>
    `;

    dialog.querySelector('[data-cancel]').onclick = () => dialog.remove();
    dialog.querySelector('[data-continue]').onclick = () => {
      dialog.remove();
      const toastbox = document.getElementById('toastbox');
      if (toastbox) {
        const n = document.createElement('div');
        n.className = 'toast';
        n.innerHTML = '<i class="fa-solid fa-circle-info"></i> Contact request acknowledged.';
        toastbox.appendChild(n);
        setTimeout(() => n.remove(), 3500);
      }
    };

    document.body.appendChild(dialog);
  };

  const contactCard = (kind, details, buttonText, title, message) => `
    <div class="assist-card">
      <h3><i class="fa-solid ${kind === 'Higher Authorities' ? 'fa-building-columns' : 'fa-user-shield'}"></i>${kind}</h3>
      <div class="assist-details">
        <div class="assist-detail"><b>Name</b>${esc(details.name)}</div>
        <div class="assist-detail"><b>Email</b>${esc(details.email)}</div>
        <div class="assist-detail"><b>Phone</b>${esc(details.phone)}</div>
      </div>
      <button class="outline-btn" data-dialog-title="${esc(title)}" data-dialog-message="${esc(message)}">
        ${esc(buttonText)} <i class="fa-solid fa-arrow-right"></i>
      </button>
    </div>
  `;

  const updateAssistance = () => {
    if (!result.classList.contains('show')) return;

    result.querySelector('.officer')?.remove();
    Array.from(result.children).find(el => el.textContent.trim().startsWith('Concern:'))?.remove();

    if (result.querySelector('.escalation-assistance')) return;

    const ticketId = result.querySelector('.form-title')?.textContent.trim();
    const all = JSON.parse(localStorage.getItem('samadhanTickets') || '[]');
    const ticket = all.find(t => t.id === ticketId);
    if (!ticket || ticket.status === 'Resolved') return;

    const days = workingDays(ticket.submitted);
    const section = document.createElement('section');
    section.className = 'escalation-assistance';

    let content = '<h2>Escalation Assistance</h2>';

    if (days <= 7) {
      content += `
        <div class="assist-card">
          <h3><i class="fa-solid fa-circle-info"></i>Escalation Information</h3>
          <p>Your grievance is currently under review by the assigned team. If it remains unresolved after <b>7 working days</b>, you will be able to view the contact details of your Grievance Coordinator.</p>
        </div>
      `;
    } else {
      content += contactCard(
        'Grievance Coordinator',
        { name: 'Rahul Sharma', email: 'rahul.sharma@gbu.ac.in', phone: '+91 98765 43210' },
        'Contact Grievance Coordinator',
        'Contact Grievance Coordinator?',
        'Your grievance has remained unresolved for more than 7 working days. Before escalating the matter further, please contact your Grievance Coordinator. If your grievance is still unresolved after 10 working days, you will be able to contact the higher authorities.'
      );

      if (days > 10) {
        content += contactCard(
          'Higher Authorities',
          { name: 'Dean Student Welfare', email: 'dsw@gbu.ac.in', phone: '+91 98XXXXXXXX' },
          'Contact Higher Authorities',
          'Escalate Your Grievance?',
          'Your grievance has remained unresolved for more than 10 working days. Before contacting the higher authorities, please ensure that you have already contacted your Grievance Coordinator.'
        );
      }
    }

    section.innerHTML = content;
    section.querySelectorAll('[data-dialog-title]').forEach(button =>
      button.onclick = () => showDialog(button.dataset.dialogTitle, button.dataset.dialogMessage)
    );
    result.appendChild(section);
  };

  new MutationObserver(updateAssistance).observe(result, { childList: true, subtree: true });
})();