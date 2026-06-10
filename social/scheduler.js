/**
 * JM Productions — Scheduler X (Twitter)
 * Publica 4 posts al dia: 9:00, 12:00, 15:00, 19:00 (hora Madrid)
 *
 * VARIEDAD DIARIA:
 * Cada dia de la semana tiene un orden de categorias distinto,
 * asi el tipo de contenido cambia segun la hora cada dia.
 *
 * REQUISITOS:
 *   npm install twitter-api-v2 node-cron dotenv
 *   Crear archivo .env con las claves de X Developer (ver SETUP.txt)
 */

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
const { posts } = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'content.json'), 'utf8')
);

// Agrupar posts por categoria
const byCategory = {};
posts.forEach(p => {
  if (!byCategory[p.category]) byCategory[p.category] = [];
  byCategory[p.category].push(p);
});

/**
 * Orden de categorias por dia de la semana (0=Dom ... 6=Sab).
 * Cada dia mezcla las categorias en un orden diferente para
 * que el mismo horario no tenga siempre el mismo tipo de post.
 *
 * Categorias disponibles:
 *   estadistica | consejo | caso_uso | motivacion
 *   ia_tendencia | error   | cta
 */
const WEEKLY_ORDERS = [
  // Dom: estadistica -> consejo -> caso_uso -> motivacion
  ['estadistica', 'consejo',     'caso_uso',   'motivacion' ],
  // Lun: consejo -> caso_uso -> motivacion -> estadistica
  ['consejo',     'caso_uso',    'motivacion', 'estadistica' ],
  // Mar: caso_uso -> motivacion -> estadistica -> consejo
  ['caso_uso',    'motivacion',  'estadistica','consejo'     ],
  // Mie: motivacion -> estadistica -> consejo -> caso_uso
  ['motivacion',  'estadistica', 'consejo',    'caso_uso'    ],
  // Jue: estadistica -> ia_tendencia -> caso_uso -> motivacion
  ['estadistica', 'ia_tendencia','caso_uso',   'motivacion'  ],
  // Vie: error -> consejo -> motivacion -> cta
  ['error',       'consejo',     'motivacion', 'cta'         ],
  // Sab: consejo -> estadistica -> caso_uso -> motivacion
  ['consejo',     'estadistica', 'caso_uso',   'motivacion'  ],
];

// --- Estado persistente ---
const STATE_FILE = path.join(__dirname, '.state.json');

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  return {
    lastDate:   '',
    todayCount: 0,
    todayQueue: [],   // IDs de los 4 posts de hoy
    catIndices: {},   // cuantos posts de cada categoria ya se usaron
  };
}

function saveState(s) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2));
}

/**
 * Construye la cola de 4 posts para el dia de hoy.
 * Usa el dia de la semana para determinar el orden de categorias.
 * Dentro de cada categoria, cicla por sus posts sin repetir
 * hasta haberlos usado todos.
 */
function buildTodayQueue(state) {
  const dayOfWeek = new Date().getDay(); // 0 Dom, 1 Lun ... 6 Sab
  const order     = WEEKLY_ORDERS[dayOfWeek];

  return order.map(cat => {
    // Fallback: si la categoria no existe o se agota, usar motivacion
    const pool = byCategory[cat] || byCategory['motivacion'];
    const idx  = state.catIndices[cat] || 0;
    // Avanzar el indice para la proxima vez que toque esta categoria
    state.catIndices[cat] = (idx + 1) % pool.length;
    return pool[idx].id;
  });
}

// --- Publicar en X ---
async function tweetPost(text) {
  try {
    const res = await client.v2.tweet(text);
    log(`✅ Tweet publicado [id: ${res.data.id}]`);
    return true;
  } catch (err) {
    log(`❌ ERROR al publicar: ${err.message}`);
    return false;
  }
}

function log(msg) {
  const ts = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
  console.log(`[${ts}] ${msg}`);
}

// --- Funcion principal ---
async function publishNext() {
  const state   = loadState();
  const todayStr = new Date().toISOString().split('T')[0];

  // Nuevo dia: resetear contador y generar cola de hoy
  if (state.lastDate !== todayStr) {
    state.todayCount = 0;
    state.lastDate   = todayStr;
    state.todayQueue = buildTodayQueue(state);

    const dayNames = ['Domingo','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'];
    const dow      = new Date().getDay();
    log(`Nuevo dia (${dayNames[dow]}). Cola: ${state.todayQueue.join(', ')}`);
    saveState(state);
  }

  if (state.todayCount >= 4) {
    log('Limite diario alcanzado (4 posts). Esperando manana.');
    return;
  }

  // Obtener el post que toca en este horario
  const postId = state.todayQueue[state.todayCount];
  const post   = posts.find(p => p.id === postId);

  if (!post) {
    log(`Post ${postId} no encontrado. Saltando.`);
    state.todayCount++;
    saveState(state);
    return;
  }

  log(`Publicando post #${post.id} [${post.category}] (${state.todayCount + 1}/4 hoy)`);
  const ok = await tweetPost(post.x);

  if (ok) {
    state.todayCount++;
    saveState(state);
    log(`Posts hoy: ${state.todayCount}/4`);
  }
}

// --- Cron: 9:00, 12:00, 15:00, 19:00 hora Madrid ---
cron.schedule('0 9  * * *', publishNext, { timezone: 'Europe/Madrid' });
cron.schedule('0 12 * * *', publishNext, { timezone: 'Europe/Madrid' });
cron.schedule('0 15 * * *', publishNext, { timezone: 'Europe/Madrid' });
cron.schedule('0 19 * * *', publishNext, { timezone: 'Europe/Madrid' });

log('Scheduler activo — publica a las 9:00, 12:00, 15:00 y 19:00 (Madrid).');
log(`Banco: ${posts.length} posts en ${Object.keys(byCategory).length} categorias.`);

// Mostrar el calendario de la semana al arrancar
const dayNames = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'];
log('Orden de categorias esta semana:');
WEEKLY_ORDERS.forEach((order, i) => {
  log(`  ${dayNames[i]}: 9h=${order[0]}  12h=${order[1]}  15h=${order[2]}  19h=${order[3]}`);
});
