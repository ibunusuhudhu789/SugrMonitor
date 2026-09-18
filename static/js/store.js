/* ===================================================================
   GlucoTrack — data layer
   -------------------------------------------------------------------
   Every read/write goes through the functions below. Right now they
   talk to localStorage so the site works stand-alone. To wire this up
   to your own backend, this is the ONLY file that needs to change:
   replace the body of each function with a fetch() call to your API
   and keep the same function names / return shapes, and every page
   keeps working unmodified.
=================================================================== */

const STORE_KEYS = {
  readings: 'glucotrack_readings',
  a1c: 'glucotrack_a1c',
  meds: 'glucotrack_medications'
};

function uid(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function readAll(key){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error('GlucoTrack: could not read', key, e);
    return [];
  }
}

function writeAll(key, arr){
  localStorage.setItem(key, JSON.stringify(arr));
}

/* ---------------- readings (blood glucose log) ---------------- */
// shape: { id, date: 'YYYY-MM-DD', time: 'HH:MM', type: 'fasting'|'random'|'postmeal'|'bedtime', value: Number(mg/dL), notes }

function getReadings(){
  return readAll(STORE_KEYS.readings).sort((a, b) =>
    (b.date + (b.time || '')).localeCompare(a.date + (a.time || ''))
  );
}

function saveReading(reading){
  const all = readAll(STORE_KEYS.readings);
  if(reading.id){
    const i = all.findIndex(r => r.id === reading.id);
    if(i > -1) all[i] = reading;
    else all.push(reading);
  } else {
    reading.id = uid();
    all.push(reading);
  }
  writeAll(STORE_KEYS.readings, all);
  return reading;
}

function deleteReading(id){
  writeAll(STORE_KEYS.readings, readAll(STORE_KEYS.readings).filter(r => r.id !== id));
}

/* ---------------- HbA1c lab results (manually entered) ---------------- */
// shape: { id, date: 'YYYY-MM-DD', value: Number(percent), notes }

function getA1cRecords(){
  return readAll(STORE_KEYS.a1c).sort((a, b) => b.date.localeCompare(a.date));
}

function saveA1cRecord(rec){
  const all = readAll(STORE_KEYS.a1c);
  if(rec.id){
    const i = all.findIndex(r => r.id === rec.id);
    if(i > -1) all[i] = rec;
    else all.push(rec);
  } else {
    rec.id = uid();
    all.push(rec);
  }
  writeAll(STORE_KEYS.a1c, all);
  return rec;
}

function deleteA1cRecord(id){
  writeAll(STORE_KEYS.a1c, readAll(STORE_KEYS.a1c).filter(r => r.id !== id));
}

/* ---------------- medications ---------------- */
// shape: { id, name, dosage, frequency, times: ['08:00'], startDate, notes }

function getMedications(){
  return readAll(STORE_KEYS.meds).sort((a, b) => a.name.localeCompare(b.name));
}

function saveMedication(med){
  const all = readAll(STORE_KEYS.meds);
  if(med.id){
    const i = all.findIndex(m => m.id === med.id);
    if(i > -1) all[i] = med;
    else all.push(med);
  } else {
    med.id = uid();
    all.push(med);
  }
  writeAll(STORE_KEYS.meds, all);
  return med;
}

function deleteMedication(id){
  writeAll(STORE_KEYS.meds, readAll(STORE_KEYS.meds).filter(m => m.id !== id));
}

/* ===================================================================
   Glucose interpretation
   Targets follow commonly used ADA-style reference ranges. These are
   general guidance, not a substitute for a clinician's target range —
   every page that shows a tag should read from here so the whole site
   stays consistent, and a clinician's personalised targets can be
   swapped in here in one place later.
=================================================================== */

const READING_TYPES = [
  { id: 'fasting',  label: 'Fasting' },
  { id: 'random',   label: 'Random' },
  { id: 'postmeal', label: 'After a meal' },
  { id: 'bedtime',  label: 'Bedtime' }
];

function classifyReading(type, value){
  if(value < 70) return 'low';
  if(type === 'fasting'){
    if(value <= 99) return 'in-range';
    if(value <= 125) return 'high';
    return 'high';
  }
  // random, post-meal, bedtime all use a shared upper bound
  const ceiling = type === 'postmeal' ? 180 : 140;
  return value <= ceiling ? 'in-range' : 'high';
}

function classificationLabel(status){
  return { 'in-range': 'In range', high: 'High', low: 'Low' }[status] || 'Logged';
}

/* ===================================================================
   Estimated HbA1c
   Uses the ADAG study relationship between average glucose (eAG) and
   HbA1c: eAG(mg/dL) = 28.7 x A1c - 46.7, solved for A1c.
   This is an ESTIMATE from logged readings, not a lab result — pages
   must always label it that way next to any lab-entered value.
=================================================================== */

function estimateA1cFromAverage(avgMgDl){
  if(avgMgDl == null || Number.isNaN(avgMgDl)) return null;
  return (avgMgDl + 46.7) / 28.7;
}

function averageGlucose(readings, days){
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const inWindow = readings.filter(r => new Date(r.date) >= cutoff);
  if(inWindow.length === 0) return { average: null, count: 0 };
  const sum = inWindow.reduce((s, r) => s + Number(r.value), 0);
  return { average: sum / inWindow.length, count: inWindow.length };
}

function timeInRange(readings, days){
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const inWindow = readings.filter(r => new Date(r.date) >= cutoff);
  if(inWindow.length === 0) return null;
  const inRangeCount = inWindow.filter(r => classifyReading(r.type, r.value) === 'in-range').length;
  return Math.round((inRangeCount / inWindow.length) * 100);
}

function formatDate(iso){
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function typeLabel(id){
  const t = READING_TYPES.find(t => t.id === id);
  return t ? t.label : id;
}

function showToast(message){
  let toast = document.querySelector('.toast');
  if(!toast){
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}
