require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');
const cron          = require('node-cron');
const fs            = require('fs');
const path          = require('path');

// --- Cliente X ---
const client = new TwitterApi({
  appKey:       process.env.X_API_KEY,
  appSecret:    process.env.X_API_SECRET,
  accessToken:  process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

// --- Banco de contenido ---
const { posts } = require('./content');

// Agrupar posts por categoria
const byCategory = {};
posts.forEach(p => {
  if (!byCategory[p.category]) byCategory[p.category] = [];
  byCategory[p.category].push(p);
});

const WEEKLY_ORDERS = [
  ['estadistica', 'consejo',      'caso_uso',    'motivacion' ],  // Dom
  ['consejo',     'caso_uso',     'motivacion',  'estadistica'],  // Lun
  ['caso_uso',    'motivacion',   'estadistica', 'consejo'    ],  // Mar
  ['motivacion',  'estadistica',  'consejo',     'caso_uso'   ],  // Mie
  ['estadistica', 'ia_tendencia', 'caso_uso',    'motivacion' ],  // Jue
  ['error',       'consejo',      'motivacion',  'cta'        ],  // Vie
  ['consejo',     'estadistica',  'caso_uso',    'motivacion' ],  // Sab
];

// --- Estado persistente ---
const STATE_FILE = path.join(__dirname, '.state.json');

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  return { lastDate: '', todayCount: 0, todayQueue: [], catIndices: {} };
}

function saveState(s) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2));
}

function buildTodayQueue(state) {
  const dayOfWeek = new Date().getDay();
  const order     = WEEKLY_ORDERS[dayOfWeek];
  return order.map(cat => {
    const pool = byCategory[cat] || byCategory['motivacion'];
    const idx  = state.catIndices[cat] || 0;
    state.catIndices[cat] = (idx + 1) % pool.length;
    return pool[idx].id;
  });
}

async function tweetPost(text) {
  try {
    const res = await client.v2.tweet(text);
    log('Tweet publicado [id: ' + res.data.id + ']');
    return true;
  } catch (err) {
    log('ERROR al publicar: ' + err.message);
    return false;
  }
}

function log(msg) {
  const ts = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
  console.log('[' + ts + '] ' + msg);
}

async function publishNext() {
  const state    = loadState();
  const todayStr = new Date().toISOString().split('T')[0];

  if (state.lastDate !== todayStr) {
    state.todayCount = 0;
    state.lastDate   = todayStr;
    state.todayQueue = buildTodayQueue(state);
    const dayNames   = ['Domingo','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'];
    log('Nuevo dia (' + dayNames[new Date().getDay()] + '). Cola: ' + state.todayQueue.join(', '));
    saveState(state);
  }

  if (state.todayCount >= 4) {
    log('Limite diario alcanzado (4 posts). Esperando manana.');
    return;
  }

  const postId = state.todayQueue[state.todayCount];
  const post   = posts.find(p => p.id === postId);

  if (!post) {
    log('Post ' + postId + ' no encontrado. Saltando.');
    state.todayCount++;
    saveState(state);
    return;
  }

  log('Publicando post #' + post.id + ' [' + post.category + '] (' + (state.todayCount + 1) + '/4 hoy)');
  const ok = await tweetPost(post.x);

  if (ok) {
    state.todayCount++;
    saveState(state);
    log('Posts hoy: ' + state.todayCount + '/4');
  }
}

// --- Cron: 9:00, 12:00, 15:00, 19:00 hora Madrid ---
cron.schedule('0 9  * * *', publishNext, { timezone: 'Europe/Madrid' });
cron.schedule('0 12 * * *', publishNext, { timezone: 'Europe/Madrid' });
cron.schedule('0 15 * * *', publishNext, { timezone: 'Europe/Madrid' });
cron.schedule('0 19 * * *', publishNext, { timezone: 'Europe/Madrid' });

log('Scheduler activo — publica a las 9:00, 12:00, 15:00 y 19:00 (Madrid).');
log('Banco: ' + posts.length + ' posts en ' + Object.keys(byCategory).length + ' categorias.');

const dayNames = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'];
log('Orden de categorias esta semana:');
WEEKLY_ORDERS.forEach(function(order, i) {
  log('  ' + dayNames[i] + ': 9h=' + order[0] + '  12h=' + order[1] + '  15h=' + order[2] + '  19h=' + order[3]);
});
