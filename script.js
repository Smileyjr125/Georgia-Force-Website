// ---------- Mobile nav toggle ----------
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
});
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navLinks.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
}));

// ---------- Countdown timer ----------
const NEXT_GAME = new Date('2026-08-21T19:30:00');
function tickCountdown(){
  const now = new Date();
  let diff = NEXT_GAME - now;
  if (diff < 0) diff = 0;
  const days = Math.floor(diff / (1000*60*60*24));
  const hours = Math.floor((diff / (1000*60*60)) % 24);
  const mins = Math.floor((diff / (1000*60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);
  const pad = n => String(n).padStart(2,'0');
  document.getElementById('cd-days').textContent = pad(days);
  document.getElementById('cd-hours').textContent = pad(hours);
  document.getElementById('cd-mins').textContent = pad(mins);
  document.getElementById('cd-secs').textContent = pad(secs);
}
tickCountdown();
setInterval(tickCountdown, 1000);

// ---------- Sample schedule data ----------
// sport codes: vf = Varsity Football, msf = Middle School Football, bb = Basketball
const GAMES = [
  {date:'2026-08-21', sport:'vf', opponent:'Mount Pisgah Christian', home:true, time:'7:30 PM'},
  {date:'2026-08-28', sport:'vf', opponent:"King's Ridge Christian", home:false, time:'7:30 PM'},
  {date:'2026-09-03', sport:'msf', opponent:'Mount Pisgah Christian', home:true, time:'5:30 PM'},
  {date:'2026-09-04', sport:'vf', opponent:'Hebron Christian', home:true, time:'7:30 PM'},
  {date:'2026-09-10', sport:'msf', opponent:'Hebron Christian', home:false, time:'5:30 PM'},
  {date:'2026-09-11', sport:'vf', opponent:'Whitefield Academy', home:false, time:'7:30 PM'},
  {date:'2026-09-17', sport:'msf', opponent:'Whitefield Academy', home:true, time:'5:30 PM'},
  {date:'2026-09-18', sport:'vf', opponent:'Athens Christian', home:true, time:'7:30 PM'},
  {date:'2026-09-24', sport:'msf', opponent:'Athens Christian', home:false, time:'5:30 PM'},
  {date:'2026-09-25', sport:'vf', opponent:"Eagle's Landing Christian", home:false, time:'7:30 PM'},
  {date:'2026-10-01', sport:'msf', opponent:"Eagle's Landing Christian", home:true, time:'5:30 PM'},
  {date:'2026-10-02', sport:'vf', opponent:"Holy Innocents' Episcopal", home:true, time:'7:30 PM'},
  {date:'2026-10-08', sport:'msf', opponent:"Holy Innocents' Episcopal", home:false, time:'5:30 PM'},
  {date:'2026-10-09', sport:'vf', opponent:'First Presbyterian Day', home:false, time:'7:30 PM'},
  {date:'2026-10-15', sport:'msf', opponent:'Strong Rock Christian', home:true, time:'5:30 PM'},
  {date:'2026-10-16', sport:'vf', opponent:'Strong Rock Christian', home:true, time:'7:30 PM'},
  {date:'2026-10-23', sport:'vf', opponent:'Heritage Prep', home:false, time:'7:30 PM'},
  {date:'2026-10-30', sport:'vf', opponent:'Christian Heritage', home:true, time:'7:30 PM'},
  {date:'2026-11-13', sport:'bb', opponent:'Mount Pisgah Christian', home:true, time:'6:00 PM'},
  {date:'2026-11-17', sport:'bb', opponent:"King's Ridge Christian", home:false, time:'6:00 PM'},
  {date:'2026-11-20', sport:'bb', opponent:'Hebron Christian', home:true, time:'6:00 PM'},
  {date:'2026-12-01', sport:'bb', opponent:'Whitefield Academy', home:false, time:'6:00 PM'},
  {date:'2026-12-04', sport:'bb', opponent:'Athens Christian', home:true, time:'6:00 PM'},
  {date:'2026-12-08', sport:'bb', opponent:"Eagle's Landing Christian", home:false, time:'6:00 PM'},
  {date:'2027-01-12', sport:'bb', opponent:"Holy Innocents' Episcopal", home:true, time:'6:00 PM'},
  {date:'2027-01-15', sport:'bb', opponent:'First Presbyterian Day', home:false, time:'6:00 PM'},
  {date:'2027-01-19', sport:'bb', opponent:'Strong Rock Christian', home:true, time:'6:00 PM'},
  {date:'2027-01-26', sport:'bb', opponent:'Heritage Prep', home:false, time:'6:00 PM'},
  {date:'2027-01-29', sport:'bb', opponent:'Christian Heritage', home:true, time:'6:00 PM'},
  {date:'2027-02-02', sport:'bb', opponent:'Mount Pisgah Christian', home:false, time:'6:00 PM'},
];
const SPORT_LABEL = {vf:'Varsity Football', msf:'MS Football', bb:'Basketball'};
const SPORT_CLASS = {vf:'dot-vf', msf:'dot-msf', bb:'dot-bb'};

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
let viewYear, viewMonth;

function gamesOn(y,m,d){
  const key = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  return GAMES.filter(g => g.date === key);
}

function renderCalendar(y,m){
  viewYear = y; viewMonth = m;
  document.getElementById('calMonthLabel').textContent = `${MONTH_NAMES[m]} ${y}`;
  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';
  const firstDay = new Date(y,m,1).getDay();
  const daysInMonth = new Date(y,m+1,0).getDate();
  for(let i=0;i<firstDay;i++){
    const pad = document.createElement('div');
    pad.className = 'cal-cell pad';
    grid.appendChild(pad);
  }
  for(let d=1; d<=daysInMonth; d++){
    const cell = document.createElement('button');
    cell.type = 'button';
    const games = gamesOn(y,m,d);
    cell.className = 'cal-cell' + (games.length ? ' has-game' : '');
    cell.innerHTML = `<span>${d}</span>`;
    if(games.length){
      const dotsWrap = document.createElement('div');
      dotsWrap.className = 'cal-dots';
      games.forEach(g => {
        const dot = document.createElement('span');
        dot.className = 'dot ' + SPORT_CLASS[g.sport];
        dotsWrap.appendChild(dot);
      });
      cell.appendChild(dotsWrap);
      cell.addEventListener('click', () => selectDay(y,m,d,cell));
      cell.setAttribute('aria-label', `${MONTH_NAMES[m]} ${d}: ${games.map(g=>SPORT_LABEL[g.sport]+' vs '+g.opponent).join(', ')}`);
    }
    grid.appendChild(cell);
  }
}

function selectDay(y,m,d,cell){
  document.querySelectorAll('.cal-cell.selected').forEach(c => c.classList.remove('selected'));
  cell.classList.add('selected');
  const games = gamesOn(y,m,d);
  renderUpcoming(games, true);
}

function renderUpcoming(list, isSelection){
  const ul = document.getElementById('upcomingList');
  ul.innerHTML = '';
  const heading = document.querySelector('.schedule-list h3');
  heading.textContent = isSelection ? 'Games On This Date' : 'Upcoming Games';
  if(!list.length){
    const li = document.createElement('li');
    li.style.color = 'var(--gray)';
    li.style.fontSize = '13.5px';
    li.textContent = 'No games scheduled.';
    ul.appendChild(li);
    return;
  }
  list.forEach(g => {
    const li = document.createElement('li');
    li.className = 'game-item';
    const dateObj = new Date(g.date + 'T00:00:00');
    const dateLabel = dateObj.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
    li.innerHTML = `
      <span class="game-tag" style="background:var(--${g.sport==='vf'?'blue-light':g.sport==='msf'?'gold':'orange'})"></span>
      <div class="game-info">
        <strong>${SPORT_LABEL[g.sport]} ${g.home ? 'vs' : '@'} ${g.opponent}</strong>
        <p>${dateLabel} · ${g.time} · ${g.home ? 'Home' : 'Away'}</p>
      </div>`;
    ul.appendChild(li);
  });
}

function initSchedule(){
  const today = new Date();
  today.setHours(0,0,0,0);
  const upcoming = GAMES.filter(g => new Date(g.date+'T00:00:00') >= today)
                         .sort((a,b) => new Date(a.date) - new Date(b.date));
  const startGame = upcoming.length ? upcoming[0] : GAMES[0];
  const sd = new Date(startGame.date + 'T00:00:00');
  renderCalendar(sd.getFullYear(), sd.getMonth());
  renderUpcoming(upcoming.slice(0,6), false);
}

document.getElementById('calPrev').addEventListener('click', () => {
  let m = viewMonth - 1, y = viewYear;
  if(m < 0){ m = 11; y--; }
  renderCalendar(y,m);
});
document.getElementById('calNext').addEventListener('click', () => {
  let m = viewMonth + 1, y = viewYear;
  if(m > 11){ m = 0; y++; }
  renderCalendar(y,m);
});

initSchedule();

// ---------- Forms (front-end only — no backend wired up) ----------
document.getElementById('registerForm').addEventListener('submit', e => {
  e.preventDefault();
  document.getElementById('registerNote').hidden = false;
  e.target.reset();
});

// ---------- Impact stat count-up animation ----------
function initImpactCounters(){
  const stats = document.querySelectorAll('.impact-stat');
  if(!stats.length) return;
  const animate = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const numEl = el.querySelector('.count-up');
    const duration = 1200;
    const start = performance.now();
    function step(now){
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      numEl.textContent = Math.round(eased * target);
      if(progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, {threshold:0.4});
  stats.forEach(s => observer.observe(s));
}
initImpactCounters();
