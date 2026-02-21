const OBSWebSocket = require('obs-websocket-js').default;
const tmi = require('tmi.js');
const config = require('./config.json');


// OBS Auth
const obs = new OBSWebSocket();
let obsConnected = false;

async function connectOBS() {
  try {
    await obs.connect(config.obsws, config.obspasswd);
    obsConnected = true;
    console.log('✅ Connected to OBS WebSocket');
  } catch (error) {
    console.error('❌ Failed to connect to OBS:', error.message);
  }
}

obs.on('ConnectionClosed', () => {
  console.log('⚠️ OBS disconnected. Reconnecting in 5 seconds...');
  obsConnected = false;
  setTimeout(connectOBS, 5000);
});

connectOBS();

// Twitch Auth
const twitchClient = new tmi.Client({
  options: { debug: true },
  connection: {
    reconnect: true,
    secure: true
  },
  channels: [config.ChannelName]
});

twitchClient.connect()
    .then(() => console.log('✅ Connected to Twitch chat (anonymous)'))
    .catch(err => console.error('❌ Twitch connection error:', err));

//Config Options
const sceneNames = config.scenes;
const COMMAND_COOLDOWN = config.commandCooldown;
let commandLastUsed = 0;
const AUTO_SCENE_INTERVAL = config.interval * 60 * 1000;
let enableRandom = false;
let autoSceneEnabled = false;
let autoSceneInterval = null;

// Functions
function getRandomScene() {
  const randomIndex = Math.floor(Math.random() * sceneNames.length);
  return sceneNames[randomIndex];
}

async function swapScene(scene) {
  if (!obsConnected) {
    console.log('⚠️ OBS not connected.');
    return;
  }

  try {
    await obs.call('SetCurrentProgramScene', { sceneName: scene });
    console.log(`🎬 Scene changed to: ${scene}`);
  } catch (err) {
    console.error('❌ OBS Scene Change Error:', err.message);
  }
}

// Auto logic for scenes
function isPausedByTime() {
  const now = new Date();

  const [startHour, startMinute] = config.AutoSwitchPauseTime.split(':').map(Number);
  const [endHour, endMinute] = config.AutoSwitchPauseEnd.split(':').map(Number);

  const start = new Date();
  start.setHours(startHour, startMinute, 0);

  const end = new Date();
  end.setHours(endHour, endMinute, 0);

  if (end < start) {
    return now >= start || now <= end;
  }

  return now >= start && now <= end;
}

async function autoSceneSwitch() {
  if (!autoSceneEnabled) return;

  if (isPausedByTime()) {
    console.log('⏸ Auto switching paused (time window).');
    return;
  }

  const scene = getRandomScene();
  await swapScene(scene);
  console.log(`[OBS] Auto switched to ${scene}`);
}

//Chat Listener / Logger
twitchClient.on('message', async (channel, userstate, message, self) => {
  if (self) return;

  //console.log(`${userstate.username}: ${message}`);

  // Cooldown check
  if (Date.now() / 1000 < commandLastUsed + COMMAND_COOLDOWN) return;

  message = message.toLowerCase();

// Commands
  if (message.startsWith("!scene")) {
    let scene = message.split(' ').slice(1).join(' ');

    if (!scene && enableRandom) {
      scene = getRandomScene();
    }

    if (sceneNames.includes(scene)) {
      await swapScene(scene);
      commandLastUsed = Date.now() / 1000;
    } else {
      console.log('⚠ Invalid scene name.');
    }
  }

  else if (message.startsWith("!random")) {
    enableRandom = !enableRandom;
    console.log(`🎲 Random mode ${enableRandom ? "ENABLED" : "DISABLED"}`);
  }

  else if (message.startsWith("!auto")) {
    autoSceneEnabled = !autoSceneEnabled;

    if (autoSceneEnabled) {
      if (autoSceneInterval) clearInterval(autoSceneInterval);
      autoSceneInterval = setInterval(autoSceneSwitch, AUTO_SCENE_INTERVAL);
      console.log(`🔁 Auto switching enabled (every ${config.interval} minutes).`);
    } else {
      clearInterval(autoSceneInterval);
      autoSceneInterval = null;
      console.log('🛑 Auto switching disabled.');
    }
  }
});