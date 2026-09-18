renderNav('index.html');

function drawGauge(percent){
  const wrap = document.getElementById('gauge-wrap');
  const pct = percent == null ? 0 : percent;
  const radius = 54;
  const circumference = Math.PI * radius; // semicircle
  const offset = circumference * (1 - pct / 100);
  const color = pct >= 70 ? 'var(--in-range)' : pct >= 40 ? 'var(--high)' : 'var(--low)';

  wrap.innerHTML = `
    <svg width="150" height="90" viewBox="0 0 150 90">
      <path d="M 13 82 A ${radius} ${radius} 0 0 1 137 82" fill="none"
            stroke="var(--surface-alt)" stroke-width="14" stroke-linecap="round"/>
      <path d="M 13 82 A ${radius} ${radius} 0 0 1 137 82" fill="none"
            stroke="${color}" stroke-width="14" stroke-linecap="round"
            stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
      <text x="75" y="70" text-anchor="middle" font-family="'Newsreader', serif" font-size="28" fill="var(--ink)">
        ${percent == null ? '—' : percent + '%'}
      </text>
    </svg>
  `;
}

function renderStats(readings){
  const { average } = averageGlucose(readings, 30);
  document.getElementById('stat-average').innerHTML = average
    ? `${Math.round(average)} <span class="unit">mg/dL</span>`
    : '—';

  const est = estimateA1cFromAverage(average);
  document.getElementById('stat-a1c').innerHTML = est
    ? `${est.toFixed(1)}<span class="unit">%</span>`
    : '—';

  if(readings.length){
    const last = readings[0];
    document.getElementById('stat-last').innerHTML =
      `${last.value} <span class="unit">mg/dL</span>`;
  }
}

function renderRecent(readings){
  const list = document.getElementById('recent-list');
  const recent = readings.slice(0, 6);
  if(recent.length === 0){
    list.innerHTML = `<p class="empty-state" style="margin-top:16px;"><strong>Nothing logged yet</strong>Your most recent readings will show up here.</p>`;
    return;
  }
  list.innerHTML = recent.map(r => {
    const status = classifyReading(r.type, r.value);
    return `
      <div class="entry-row">
        <div>${formatDate(r.date)}</div>
        <div>${typeLabel(r.type)}</div>
        <div class="val">${r.value}</div>
        <div><span class="tag ${status}">${classificationLabel(status)}</span></div>
        <div class="notes">${r.notes ? r.notes : ''}</div>
      </div>
    `;
  }).join('');
}

let chart;
function renderTrend(readings, days){
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const inWindow = readings
    .filter(r => new Date(r.date) >= cutoff)
    .sort((a, b) => (a.date + (a.time||'')).localeCompare(b.date + (b.time||'')));

  const canvas = document.getElementById('trend-chart');
  const emptyMsg = document.getElementById('trend-empty');

  if(inWindow.length === 0){
    canvas.style.display = 'none';
    emptyMsg.style.display = 'block';
    return;
  }
  canvas.style.display = 'block';
  emptyMsg.style.display = 'none';

  const labels = inWindow.map(r => formatDate(r.date));
  const values = inWindow.map(r => r.value);
  const pointColors = inWindow.map(r => {
    const s = classifyReading(r.type, r.value);
    return s === 'in-range' ? '#3C7A57' : s === 'high' ? '#B05A28' : '#3A5E8C';
  });

  if(chart) chart.destroy();
  chart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: '#2F6B49',
        borderWidth: 2,
        pointBackgroundColor: pointColors,
        pointRadius: 4,
        tension: 0.25,
        fill: false
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { title: { display: true, text: 'mg/dL' }, grid: { color: '#E9EFE9' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function refresh(){
  const readings = getReadings();
  const days = Number(document.getElementById('range-select').value);
  drawGauge(timeInRange(readings, 14));
  const tirDetail = document.getElementById('tir-detail');
  const win = readings.filter(r => new Date(r.date) >= new Date(Date.now() - 14*86400000));
  tirDetail.textContent = win.length ? `Based on ${win.length} reading${win.length === 1 ? '' : 's'} in the last 14 days.` : 'Log a few readings to see this filled in.';
  renderStats(readings);
  renderRecent(readings);
  renderTrend(readings, days);
}

document.getElementById('range-select').addEventListener('change', refresh);
refresh();
