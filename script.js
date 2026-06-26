const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSbyxQf9Z7KnSpGNp0p7ti_fYzsyoa1gdE17HHn5jmwTo7W0X84a6oAu9trkMT280i5262IYodjw11_/pub?gid=0&single=true&output=csv';

// --- Sport label / dot-class mapping ---
const SPORT_LABEL = { vf: 'Varsity Football', msf: 'MS Football', bb: 'Basketball' };
const SPORT_CLASS = { vf: 'dot-vf', msf: 'dot-msf', bb: 'dot-bb' };
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

let GAMES = [];          // populated after fetch
let viewYear, viewMonth; // calendar navigation state

// ---------- Mobile nav toggle ----------
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
});
navLinks.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  })
);

// ---------- CSV fetch + parse ----------
// Handles quoted fields so opponent names with commas still work.
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).slice(1); // drop header row
  return lines.reduce((acc, raw) => {
    const line = raw.trim();
    if (!line) return acc;

    const cols = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    cols.push(cur.trim());

    if (cols.length < 5) return acc;
    const [date, sport, opponent, homeRaw, time] = cols;
    const home = /^(home|true|yes)$/i.test(homeRaw.trim());
    if (date && sport && opponent) {
      acc.push({
        date:     date.trim(),
        sport:    sport.trim().toLowerCase(),
        opponent: opponent.trim(),
        home,
        time:     time.trim()
      });
    }
    return acc;
  }, []);
}

async function fetchGames() {
  try {
    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseCSV(await res.text());
  } catch (err) {
    console.error('Schedule fetch failed:', err);
    // Show a friendly message in the sidebar if fetch fails
    const ul = document.getElementById('upcomingList');
    if (ul) {
      ul.innerHTML = '<li style="color:#c1432f;font-size:13.5px">⚠ Could not load schedule. Check the SHEET_CSV_URL in script.js.</li>';
    }
    return [];
  }
}

// ---------- Countdown timer ----------
let countdownTarget = null;

function tickCountdown() {
  const diff = countdownTarget ? Math.max(0, countdownTarget - Date.now()) : 0;
  const pad  = n => String(n).padStart(2, '0');
  document.getElementById('cd-days' ).textContent = pad(Math.floor(diff / 86400000));
  document.getElementById('cd-hours').textContent = pad(Math.floor(diff / 3600000) % 24);
  document.getElementById('cd-mins' ).textContent = pad(Math.floor(diff / 60000)  % 60);
  document.getElementById('cd-secs' ).textContent = pad(Math.floor(diff / 1000)   % 60);
}

function initCountdown(games) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const next  = [...games]
    .filter(g => new Date(g.date + 'T00:00:00') >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  if (next) {
    const [y, mo, d] = next.date.split('-').map(Number);

    // Parse time string (e.g. "7:30 PM") for accurate countdown target
    let gameDate = new Date(y, mo - 1, d, 19, 30, 0); // fallback 7:30 PM
    const tm = next.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (tm) {
      let hr = +tm[1], mn = +tm[2];
      if (/PM/i.test(tm[3]) && hr !== 12) hr += 12;
      if (/AM/i.test(tm[3]) && hr === 12)  hr  = 0;
      gameDate = new Date(y, mo - 1, d, hr, mn, 0);
    }
    countdownTarget = gameDate.getTime();

    // Update the countdown bar text dynamically
    const dateObj  = new Date(y, mo - 1, d);
    const weekday  = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const label    = SPORT_LABEL[next.sport] || next.sport;
    const vsAt     = next.home ? 'vs.' : '@';

    const barGame = document.querySelector('.countdown-game');
    const barMeta = document.querySelector('.countdown-meta');
    if (barGame) barGame.textContent = `${label} ${vsAt} ${next.opponent}`;
    if (barMeta) barMeta.textContent = `${weekday}, ${monthDay} · ${next.time} · ${next.home ? 'Home' : 'Away'}`;
  }

  tickCountdown();
  setInterval(tickCountdown, 1000);
}

// ---------- Calendar ----------
function gamesOn(y, m, d) {
  const key = `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  return GAMES.filter(g => g.date === key);
}

function renderCalendar(y, m) {
  viewYear = y; viewMonth = m;
  document.getElementById('calMonthLabel').textContent = `${MONTH_NAMES[m]} ${y}`;
  const grid  = document.getElementById('calGrid');
  grid.innerHTML = '';
  const first = new Date(y, m, 1).getDay();
  const days  = new Date(y, m + 1, 0).getDate();

  for (let i = 0; i < first; i++) {
    const el = document.createElement('div');
    el.className = 'cal-cell pad';
    grid.appendChild(el);
  }
  for (let d = 1; d <= days; d++) {
    const games = gamesOn(y, m, d);
    const cell  = document.createElement('button');
    cell.type   = 'button';
    cell.className = 'cal-cell' + (games.length ? ' has-game' : '');
    cell.innerHTML = `<span>${d}</span>`;
    if (games.length) {
      const wrap = document.createElement('div');
      wrap.className = 'cal-dots';
      games.forEach(g => {
        const dot = document.createElement('span');
        dot.className = `dot ${SPORT_CLASS[g.sport] || ''}`;
        wrap.appendChild(dot);
      });
      cell.appendChild(wrap);
      cell.addEventListener('click', () => selectDay(y, m, d, cell));
      cell.setAttribute('aria-label',
        `${MONTH_NAMES[m]} ${d}: ` +
        games.map(g => `${SPORT_LABEL[g.sport] || g.sport} vs ${g.opponent}`).join(', ')
      );
    }
    grid.appendChild(cell);
  }
}

function selectDay(y, m, d, cell) {
  document.querySelectorAll('.cal-cell.selected').forEach(c => c.classList.remove('selected'));
  cell.classList.add('selected');
  renderUpcoming(gamesOn(y, m, d), true);
}

function renderUpcoming(list, isSelection) {
  const ul = document.getElementById('upcomingList');
  document.querySelector('.schedule-list h3').textContent =
    isSelection ? 'Games On This Date' : 'Upcoming Games';
  ul.innerHTML = '';
  if (!list.length) {
    const li = document.createElement('li');
    li.style.cssText = 'color:var(--gray);font-size:13.5px';
    li.textContent = 'No games scheduled.';
    ul.appendChild(li);
    return;
  }
  list.forEach(g => {
    const li = document.createElement('li');
    li.className = 'game-item';
    const dateObj   = new Date(g.date + 'T00:00:00');
    const dateLabel = dateObj.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
    const color     = g.sport === 'vf' ? 'blue-light' : g.sport === 'msf' ? 'gold' : 'orange';
    li.innerHTML    = `
      <span class="game-tag" style="background:var(--${color})"></span>
      <div class="game-info">
        <strong>${SPORT_LABEL[g.sport] || g.sport} ${g.home ? 'vs' : '@'} ${g.opponent}</strong>
        <p>${dateLabel} · ${g.time} · ${g.home ? 'Home' : 'Away'}</p>
      </div>`;
    ul.appendChild(li);
  });
}

function initSchedule() {
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const upcoming = [...GAMES]
    .filter(g => new Date(g.date + 'T00:00:00') >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const startGame = upcoming[0] || GAMES[0];
  if (startGame) {
    const sd = new Date(startGame.date + 'T00:00:00');
    renderCalendar(sd.getFullYear(), sd.getMonth());
  } else {
    const now = new Date();
    renderCalendar(now.getFullYear(), now.getMonth());
  }
  renderUpcoming(upcoming.slice(0, 6), false);
}

document.getElementById('calPrev').addEventListener('click', () => {
  let m = viewMonth - 1, y = viewYear;
  if (m < 0) { m = 11; y--; }
  renderCalendar(y, m);
});
document.getElementById('calNext').addEventListener('click', () => {
  let m = viewMonth + 1, y = viewYear;
  if (m > 11) { m = 0; y++; }
  renderCalendar(y, m);
});

// ---------- Bootstrap: fetch then render ----------
async function bootstrap() {
  document.getElementById('upcomingList').innerHTML =
    '<li style="color:var(--gray);font-size:13.5px">Loading schedule…</li>';
  GAMES = await fetchGames();
  initCountdown(GAMES);
  initSchedule();
}
bootstrap();

// ---------- Registration form ----------
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log(e.target);
  const formData = new FormData(e.target);

  try {
    await fetch("/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams(formData).toString()
    });

    e.target.reset();
    document.getElementById('registerNote').hidden = false;
  } catch (err) {
    console.error(err);
  }
});

// ---------- Impact stat count-up animation ----------
function initImpactCounters() {
  const stats = document.querySelectorAll('.impact-stat');
  if (!stats.length) return;
  const animate = el => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const numEl  = el.querySelector('.count-up');
    const t0     = performance.now();
    requestAnimationFrame(function step(now) {
      const p = Math.min((now - t0) / 1200, 1);
      numEl.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
      if (p < 1) requestAnimationFrame(step);
    });
  };
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { animate(e.target); obs.unobserve(e.target); }
    });
  }, { threshold: 0.4 });
  stats.forEach(s => obs.observe(s));
}
initImpactCounters();

// =============================================================
//  HOW TO CONNECT YOUR GOOGLE SHEET
//  ─────────────────────────────────────────────────────────────
//
//  1. CREATE THE SHEET
//     Go to sheets.google.com and create a new spreadsheet.
//     Row 1 must be a header row with exactly these labels:
//
//       A1: Date     B1: Sport    C1: Opponent    D1: Home/Away    E1: Time
//
//  2. FILL IN YOUR GAMES (one game per row), e.g.:
//
//     A           B     C                        D      E
//     2026-08-21  vf    Mount Pisgah Christian   Home   7:30 PM
//     2026-08-28  vf    King's Ridge Christian   Away   7:30 PM
//     2026-09-03  msf   Mount Pisgah Christian   Home   5:30 PM
//     2026-11-13  bb    Mount Pisgah Christian   Home   6:00 PM
//
//     Sport codes:  vf = Varsity Football
//                   msf = Middle School Football
//                   bb = Basketball
//
//     Home/Away:    Use "Home" or "Away" (or True/False)
//
//     Date format:  YYYY-MM-DD  (e.g. 2026-09-15)
//
//  3. PUBLISH THE SHEET AS CSV
//     a. Click File → Share → Publish to web
//     b. Under the first dropdown, select the sheet tab name
//        (e.g. "Sheet1")
//     c. Under the second dropdown, select
//        "Comma-separated values (.csv)"
//     d. Click Publish — confirm if prompted
//     e. Copy the URL shown (it looks like:
//        https://docs.google.com/spreadsheets/d/e/2PACX-1v…/pub?output=csv)
//
//  4. PASTE THE URL
//     Replace the placeholder at the top of this file:
//
//       const SHEET_CSV_URL = 'https://docs.google.com/…/pub?output=csv';
//
//  5. DONE — save the file and reload your site.
//     The calendar and countdown will now pull directly from
//     your sheet. To add or change a game, just edit the sheet
//     and refresh — no code changes needed.
//
//  NOTE: Google's published CSV updates every few minutes, not
//  instantly. If you don't see changes right away, wait ~2 min
//  and do a hard reload (Ctrl+Shift+R / Cmd+Shift+R).
// =============================================================
