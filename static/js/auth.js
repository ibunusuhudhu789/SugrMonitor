/* ===================================================================
   GlucoTrack — auth
   -------------------------------------------------------------------
   Demo-only, localStorage-backed accounts so login/register work
   before you have a backend. Exactly like store.js, every page only
   calls the functions below (registerUser, loginUser, logoutUser,
   getSession) — swap their bodies for fetch() calls to your API and
   nothing else needs to change.

   IMPORTANT: this stores passwords as plain text in the browser. That
   is only acceptable for a local demo. A real backend must hash and
   salt passwords server-side (e.g. bcrypt/argon2) and never send the
   password back in any response — never port this file's storage
   approach as-is.
=================================================================== */

const AUTH_KEYS = {
  users: 'glucotrack_users',
  session: 'glucotrack_session'
};

function getUsers(){
  try{
    return JSON.parse(localStorage.getItem(AUTH_KEYS.users)) || [];
  }catch(e){ return []; }
}

function saveUsers(users){
  localStorage.setItem(AUTH_KEYS.users, JSON.stringify(users));
}

function isValidEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Creates an account and immediately signs the person in.
 * Returns { ok: true } or { ok: false, error }.
 */
function registerUser({ name, email, password }){
  email = (email || '').trim().toLowerCase();
  name = (name || '').trim();

  if(!name) return { ok: false, error: 'Enter your name.' };
  if(!isValidEmail(email)) return { ok: false, error: 'Enter a valid email address.' };
  if(!password || password.length < 8) return { ok: false, error: 'Use a password of at least 8 characters.' };

  const users = getUsers();
  if(users.some(u => u.email === email)){
    return { ok: false, error: 'An account with that email already exists.' };
  }

  users.push({ id: uid(), name, email, password });
  saveUsers(users);
  startSession({ name, email });
  return { ok: true };
}

/**
 * Checks credentials and starts a session.
 * Returns { ok: true } or { ok: false, error }.
 */
function loginUser({ email, password }){
  email = (email || '').trim().toLowerCase();
  const user = getUsers().find(u => u.email === email);

  if(!user || user.password !== password){
    return { ok: false, error: 'Email or password is incorrect.' };
  }
  startSession({ name: user.name, email: user.email });
  return { ok: true };
}

function startSession(user){
  localStorage.setItem(AUTH_KEYS.session, JSON.stringify(user));
}

function getSession(){
  try{
    return JSON.parse(localStorage.getItem(AUTH_KEYS.session));
  }catch(e){ return null; }
}

function logoutUser(){
  localStorage.removeItem(AUTH_KEYS.session);
}

/**
 * Drop this at the top of any app page's script to keep signed-out
 * visitors out: requireAuth();
 */
function requireAuth(){
  if(!getSession()){
    window.location.href = 'login.html';
  }
}

function uid(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}