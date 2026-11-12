const sortBox = document.getElementById('sort');
const rows = document.getElementById('prows');

function render() {
  const key = sortBox.value;
  const list = [...Garden.sites].sort((a, b) =>
    key === 'name' ? a.name.localeCompare(b.name) : b[key] - a[key]);
  rows.innerHTML = list.map(s => `
    <div class="row">
      <span>${s.name}<br><small>${s.shade}, ${s.beds} beds, ${s.water.toLowerCase()} water use</small></span>
      <div class="track" role="img" aria-label="Yield index ${s.yield} out of 100"><i style="width:${s.yield}%"></i></div>
      <strong>${s.yield}</strong>
    </div>`).join('');

  const avg = Math.round(Garden.sites.reduce((n, s) => n + s.yield, 0) / Garden.sites.length);
  const low = Garden.sites.filter(s => s.yield < 60).map(s => s.name);
  document.getElementById('summary').textContent =
    `City average yield index: ${avg}.` +
    (low.length ? ` ${low.join(' and ')} scored below 60 and may need more sun, drainage or soil work.` : '');
}

sortBox.addEventListener('change', render);
render();
