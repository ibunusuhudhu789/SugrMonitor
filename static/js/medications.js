renderNav('medications.html');

const medForm = document.getElementById('med-form');
const medIdInput = document.getElementById('med-id');
const medCancel = document.getElementById('med-cancel');
const medSubmit = document.getElementById('med-submit');
const medHeading = document.getElementById('med-heading');

function resetMedForm(){
  medForm.reset();
  medIdInput.value = '';
  medSubmit.textContent = 'Add medication';
  medHeading.textContent = 'Medications';
  medCancel.style.display = 'none';
}

medForm.addEventListener('submit', e => {
  e.preventDefault();
  const times = document.getElementById('med-times').value
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  saveMedication({
    id: medIdInput.value || undefined,
    name: document.getElementById('med-name').value.trim(),
    dosage: document.getElementById('med-dosage').value.trim(),
    frequency: document.getElementById('med-frequency').value,
    startDate: document.getElementById('med-start').value,
    times,
    notes: document.getElementById('med-notes').value.trim()
  });
  showToast(medIdInput.value ? 'Medication updated' : 'Medication added');
  resetMedForm();
  renderMeds();
});

medCancel.addEventListener('click', resetMedForm);

function startEditMed(med){
  medIdInput.value = med.id;
  document.getElementById('med-name').value = med.name;
  document.getElementById('med-dosage').value = med.dosage || '';
  document.getElementById('med-frequency').value = med.frequency || 'Once daily';
  document.getElementById('med-start').value = med.startDate || '';
  document.getElementById('med-times').value = (med.times || []).join(', ');
  document.getElementById('med-notes').value = med.notes || '';
  medSubmit.textContent = 'Update medication';
  medHeading.textContent = 'Edit medication';
  medCancel.style.display = 'inline-flex';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderMeds(){
  const list = document.getElementById('med-list');
  const meds = getMedications();
  if(meds.length === 0){
    list.innerHTML = `<p class="empty-state"><strong>No medications added yet</strong>Use the form above to add the first one.</p>`;
    return;
  }
  list.innerHTML = meds.map(m => `
    <div class="med-row">
      <div>
        <h3>${m.name}</h3>
        <div class="med-meta">
          ${m.dosage ? m.dosage + ' · ' : ''}${m.frequency}${m.startDate ? ' · since ' + formatDate(m.startDate) : ''}
        </div>
        ${m.times && m.times.length ? `<div class="med-times">${m.times.map(t => `<span class="pill">${t}</span>`).join('')}</div>` : ''}
        ${m.notes ? `<p style="margin-top:8px; font-size:.88rem;">${m.notes}</p>` : ''}
      </div>
      <div class="row-actions" style="flex-shrink:0;">
        <button data-edit="${m.id}">Edit</button>
        <button data-delete="${m.id}">Delete</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const med = getMedications().find(m => m.id === btn.dataset.edit);
      if(med) startEditMed(med);
    });
  });
  list.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(confirm('Remove this medication?')){
        deleteMedication(btn.dataset.delete);
        showToast('Medication removed');
        renderMeds();
      }
    });
  });
}
renderMeds();
