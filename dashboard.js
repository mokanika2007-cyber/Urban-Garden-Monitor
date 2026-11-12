const $ = id => document.getElementById(id);
let sel = 0;

function drawBeds() {
  $('beds').innerHTML = Garden.plots.map((p, i) => {
    const j = Garden.judge(p);
    const word = p.off ? 'estimated' : j.s === 'warn' ? 'needs attention' : 'in range';
    return `<button class="bed ${j.s}" data-i="${i}" aria-pressed="${i === sel}" aria-label="Bed ${p.id}, ${p.crop}, ${word}">
      <b>${p.id} ${p.crop}</b><em>${p.m.toFixed(0)}%</em><span>${word}</span></button>`;
  }).join('');
  const total = Garden.plots.length;
  const off = Garden.plots.filter(p => p.off).length;
  const warn = Garden.plots.filter(p => Garden.judge(p).s === 'warn').length;
  const h = $('health');
  h.textContent = `${total - off} of ${total} sensors online` + (warn ? `, ${warn} need attention` : '');
  h.className = 'chip' + (off ? ' off' : warn ? ' warn' : '');
}

function drawDetail() {
  const p = Garden.plots[sel], j = Garden.judge(p), c = CROPS[p.crop];
  $('dTitle').textContent = `Bed ${p.id}: ${p.crop}`;
  $('sM').textContent = p.m.toFixed(0) + '%';
  $('sP').textContent = p.ph.toFixed(1);
  $('sT').textContent = p.t.toFixed(0) + '°C';
  $('rec').className = 'rec ' + (j.s === 'ok' ? '' : j.s);
  $('rec').textContent = j.msg;
  const W = 320, H = 120;
  const y = v => H - 6 - (v / 100) * (H - 12);
  const x = i => 4 + i * (W - 8) / 23;
  const pts = p.h.map((v, i) => `${x(i).toFixed(1)},${y(Math.max(0, Math.min(100, v))).toFixed(1)}`).join(' ');
  $('chart').innerHTML =
    `<rect x="0" y="${y(c.m[1])}" width="${W}" height="${y(c.m[0]) - y(c.m[1])}" fill="var(--okbg)"/>` +
    `<polyline points="${pts}" fill="none" stroke="${p.off ? 'var(--off)' : 'var(--water)'}" stroke-width="2.5" stroke-linejoin="round"${p.off ? ' stroke-dasharray="5 4"' : ''}/>` +
    `<text x="4" y="12" font-size="10" fill="var(--mute)">100%</text><text x="4" y="${H - 8}" font-size="10" fill="var(--mute)">0%</text>`;
}

function drawWeather() {
  const w = $('wx');
  w.textContent = Garden.wxSrc === 'live'
    ? `Sohna 29°C, rain chance ${Garden.rain}%`
    : `Weather from cache, ${Garden.wxAge} min old, backup provider active`;
  w.className = 'chip' + (Garden.wxSrc === 'live' ? '' : ' warn');
  $('rainBanner').hidden = Garden.rain < 60;
}

function drawAll() { drawBeds(); drawDetail(); drawWeather(); }

$('beds').addEventListener('click', e => {
  const b = e.target.closest('.bed');
  if (b) { sel = +b.dataset.i; drawAll(); }
});

// Fault simulations
function log(msg) {
  const l = $('log');
  if (l.dataset.fresh !== 'no') { l.innerHTML = ''; l.dataset.fresh = 'no'; }
  const li = document.createElement('li');
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  li.innerHTML = `<time>${time}</time>${msg}`;
  l.insertBefore(li, l.firstChild);
  while (l.children.length > 8) l.removeChild(l.lastChild);
}

$('t1').onclick = () => {
  const p = Garden.plots[sel];
  if (p.off) return;
  p.off = true; drawAll();
  log(`Node ${p.id} stopped reporting. Gap detected after 2 missed readings, so the bed is marked as an estimate and the last good value is held.`);
  setTimeout(() => log(`Node ${p.id} flagged unhealthy. Gardeners see an offline notice and planners see it in the sensor health panel.`), 1500);
  setTimeout(() => { p.off = false; drawAll(); log(`Node ${p.id} reconnected. Readings it buffered while offline were backfilled into the history.`); }, 7000);
};

$('t2').onclick = () => {
  if (Garden.wxSrc === 'cache') return;
  log('Weather request failed. Retrying in 1 second.');
  setTimeout(() => log('Retry failed. Waiting 2 seconds, then 4 seconds. The circuit breaker opens after the third failure.'), 1400);
  setTimeout(() => { Garden.wxSrc = 'cache'; Garden.wxAge = 12; drawAll(); log('Switched to the backup weather provider and the last cached forecast. The dashboard keeps working and labels the data as cached.'); }, 3200);
  setTimeout(() => { Garden.wxSrc = 'live'; Garden.rain = Math.min(80, Garden.rain + 30); drawAll(); log('Primary weather API is back. Live forecast restored.'); }, 9000);
};

$('t3').onclick = () => {
  const p = Garden.plots[sel];
  log(`Bed ${p.id} sent pH 14.9. That is outside the physical range of 3 to 10, so the reading was rejected and never reached the database. The previous value stays on screen.`);
};

setInterval(() => { Garden.tick(); drawAll(); }, 2500);
drawAll();
