/**
 * JM Productions — Scheduler automatico para X (Twitter)
 * Publica 4 posts al dia: 9:00, 12:00, 15:00, 19:00 (hora Madrid)
 *
 * REQUISITOS:
 *   npm install twitter-api-v2 node-cron dotenv
 *
 * CONFIGURACION:
 *   Crea un archivo .env con tus credenciales de X Developer.
 *   Ver instrucciones en social/SETUP.txt
 */

require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

// --- Cliente X API ---
const client = new TwitterApi({
  appKey:      process.env.X_API_KEY,
  appSecret:   process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret:process.env.X_ACCESS_SECRET,
});

// --- Cargar banco de contenido ---
const content = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'content.json'), 'utf8')
);
const posts = content.posts;

// --- Estado: guarda qué post toca y cuántos se han enviado hoy ---
const stateFile = path.join(__dirname, '.state.json');

function loadState() {
  if (fs.existsSync(stateFile)) {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  }
  return { index: 0, todayCount: 0, lastDate: '' };
}

function saveState(state) {
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

// --- Publicar en X ---
async function tweetPost(text) {
  try {
    const res = await client.v2.tweet(text);
    log(`Tweet publicado [id: ${res.data.id}]`);
    return true;
  } catch (err) {
    log(`ERROR al publicar: ${err.message}`);
    return false;
  }
}

// --- Log con timestamp ---
function log(msg) {
  const ts = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
  console.log(`[${ts}] ${msg}`);
}

// --- Funcion principal: publica el siguiente post ---
async function publishNext() {
  const state = loadState();
  const today = new Date().toISOString().split('T')[0];

  // Resetear contador diario si es un dia nuevo
  if (state.lastDate !== today) {
    state.todayCount = 0;
    state.lastDate = today;
  }

  // No publicar mas de 4 veces al dia
  if (state.todayCount >= 4) {
    log('Limite diario alcanzado (4 posts). Esperando manana.');
    return;
  }

  // Obtener el post que toca (cicla cuando llega al final)
  const post = posts[state.index % posts.length];
  log(`Publicando post #${post.id} [${post.category}]...`);

  const success = await tweetPost(post.x);

  if (success) {
    state.index = (state.index + 1) % posts.length;
    state.todayCount++;
    saveState(state);
    log(`Posts de hoy: ${state.todayCount}/4`);
  }
}

// --- Cron: 9:00, 12:00, 15:00, 19:00 hora Madrid ---
cron.schedule('0 9  * * *', publishNext, { timezone: 'Europe/Madrid' });
cron.schedule('0 12 * * *', publishNext, { timezone: 'Europe/Madrid' });
cron.schedule('0 15 * * *', publishNext, { timezone: 'Europe/Madrid' });
cron.schedule('0 19 * * *', publishNext, { timezone: 'Europe/Madrid' });

log('Scheduler activo. Publica a las 9:00, 12:00, 15:00 y 19:00 (Madrid).');
log(`Banco de contenido: ${posts.length} posts. Ciclo completo cada ${Math.ceil(posts.length / 4)} dias.`);
