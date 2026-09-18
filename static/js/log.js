renderNav('log.html');

const form = document.getElementById('reading-form');
const dateInput = document.getElementById('reading-date');
const timeInput = document.getElementById('reading-time');
const valueInput = document.getElementById('reading-value');
const notesInput = document.getElementById('reading-notes');
const idInput = document.getElementById('reading-id');
const cancelBtn = document.getElementById('cancel-edit');
const submitBtn = document.getElementById('submit-btn');
const heading = document.getElementById('form-heading');

function todayISO(){
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function nowHHMM(){
  const d = new Date();
  return d.toTimeString().slice(0, 5);
}
dateInput.value = todayISO();
timeInput.value = nowHHMM();

function resetForm(){
  form.reset();
  idInput.value = '';
  dateInput.value = todayISO();
  timeInput.value = nowHHMM();
  document.getElementById('type-fasting').checked = true;
  submitBtn.textContent = 'Save reading';
  heading.textContent = 'Log a reading';
  cancelBtn.style.display = 'none';
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const type = form.querySelector('input[name="type"]:checked').value;
  const reading = {
    id: idInput.value || undefined,
    date: dateInput.value,
    time: timeInput.value,
    type,
    value: Number(valueInput.value),
    notes: notesInput.value.trim()
  };
  saveReading(reading);
  showToast(idInput.value ? 'Reading updated' : 'Reading saved');
  resetForm();
  renderList();
});

cancelBtn.addEventListener('click', resetForm);

function startEdit(reading){
  idInput.value = reading.id;
  dateInput.value = reading.date;
  timeInput.value = reading.time || '';
  valueInput.value = reading.value;
  notesInput.value = reading.notes || '';
  document.getElementById('type-' + reading.type).checked = true;
  submitBtn.textContent = 'Update reading';
  heading.textContent = 'Edit reading';
  cancelBtn.style.display = 'inline-flex';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderList(){
  const filter = document.getElementById('filter-type').value;
  const list = document.getElementById('reading-list');
  let readings = getReadings();
  if(filter !== 'all') readings = readings.filter(r => r.type === filter);

  if(readings.length === 0){
    list.innerHTML = `<p class="empty-state" style="margin-top:16px;"><strong>No readings here yet</strong>Use the form above to log your first one.</p>`;
    return;
  }

  list.innerHTML = readings.map(r => {
    const status = classifyReading(r.type, r.value);
    return `
      <div class="entry-row">
        <div>${formatDate(r.date)}${r.time ? ' · ' + r.time : ''}</div>
        <div>${typeLabel(r.type)}</div>
        <div class="val">${r.value}</div>
        <div><span class="tag ${status}">${classificationLabel(status)}</span></div>
        <div class="row-actions">
          <button data-edit="${r.id}">Edit</button>
          <button data-delete="${r.id}">Delete</button>
        </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const reading = getReadings().find(r => r.id === btn.dataset.edit);
      if(reading) startEdit(reading);
    });
  });
  list.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(confirm('Delete this reading?')){
        deleteReading(btn.dataset.delete);
        showToast('Reading deleted');
        renderList();
      }
    });
  });
}

document.getElementById('filter-type').addEventListener('change', renderList);
renderList();
