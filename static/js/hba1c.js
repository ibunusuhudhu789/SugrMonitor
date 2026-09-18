renderNav('hba1c.html');

function renderEstimate(){
  const days = Number(document.getElementById('est-range').value);
  const readings = getReadings();
  const { average, count } = averageGlucose(readings, days);
  const est = estimateA1cFromAverage(average);

  document.getElementById('est-value').textContent = est ? est.toFixed(1) + '%' : '—';
  document.getElementById('est-caption').textContent = average ? `avg. ${Math.round(average)} mg/dL` : '';
  document.getElementById('est-note').textContent = count
    ? `Based on ${count} reading${count === 1 ? '' : 's'} over the last ${days} days.`
    : 'Log some readings to see an estimate here.';
}
document.getElementById('est-range').addEventListener('change', renderEstimate);

document.getElementById('a1c-date').value = new Date().toISOString().slice(0, 10);

document.getElementById('a1c-form').addEventListener('submit', e => {
  e.preventDefault();
  saveA1cRecord({
    date: document.getElementById('a1c-date').value,
    value: Number(document.getElementById('a1c-value').value),
    notes: document.getElementById('a1c-notes').value.trim()
  });
  showToast('HbA1c result saved');
  e.target.reset();
  document.getElementById('a1c-date').value = new Date().toISOString().slice(0, 10);
  renderAll();
});

let a1cChart;
function renderChart(records){
  const canvas = document.getElementById('a1c-chart');
  const empty = document.getElementById('a1c-empty');
  if(records.length === 0){
    canvas.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  canvas.style.display = 'block';
  empty.style.display = 'none';

  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  if(a1cChart) a1cChart.destroy();
  a1cChart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: sorted.map(r => formatDate(r.date)),
      datasets: [{
        data: sorted.map(r => r.value),
        borderColor: '#2F6B49',
        backgroundColor: '#2F6B49',
        borderWidth: 2,
        pointRadius: 4,
        tension: 0.2
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { title: { display: true, text: 'HbA1c %' } } }
    }
  });
}

function renderList(records){
  const list = document.getElementById('a1c-list');
  if(records.length === 0){
    list.innerHTML = `<p class="empty-state" style="margin-top:16px;"><strong>No lab results logged</strong>Add one using the form above.</p>`;
    return;
  }
  list.innerHTML = records.map(r => `
    <div class="entry-row" style="grid-template-columns:120px 90px 1fr auto;">
      <div>${formatDate(r.date)}</div>
      <div class="val">${r.value}%</div>
      <div class="notes">${r.notes || ''}</div>
      <div class="row-actions">
        <button data-delete="${r.id}">Delete</button>
      </div>
    </div>
  `).join('');
  list.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(confirm('Delete this HbA1c result?')){
        deleteA1cRecord(btn.dataset.delete);
        showToast('Result deleted');
        renderAll();
      }
    });
  });
}

function renderAll(){
  const records = getA1cRecords();
  renderChart(records);
  renderList(records);
  renderEstimate();
}
renderAll();
