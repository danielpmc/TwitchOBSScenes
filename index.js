const { OBSWebSocket } = require('obs-websocket-js');
const { Client } = require('twitch-js');
const config = require('./config.json');

const client = new Client({
  channels: config.ChannelName, // Use an array for channel names
});

const sceneNames = config.scenes; // Array of scene names
const COMMAND_COOLDOWN = config.commandCooldown; // Cooldown in seconds
let commandLastUsed = 0;
const AUTO_SCENE_INTERVAL = config.interval * 60 * 1000; // 30 minutes in milliseconds (Auto scene switching)

const obs = new OBSWebSocket();

// Flag to enable/disable random scene switching
let enableRandom = false; // Initially disabled

// Flag to enable/disable auto scene switching
let autoSceneEnabled = false; // Initially disabled
let autoSceneInterval; // Variable to store the interval ID

async function getRandomScene() {
  const randomIndex = Math.floor(Math.random() * sceneNames.length);
  return sceneNames[randomIndex];
}

async function swapScene(scene) {
  try {
    await obs.connect(config.obsws);
    console.log('Opening OBS Websocket to change scene!');

    await obs.call('SetCurrentProgramScene', { sceneName: scene });

    await obs.disconnect();
    console.log('Changed scene, Closing websocket!');
  } catch (err) {
    console.error('Error:', err);
  }
}

// Function for auto scene switching
async function autoSceneSwitch() {
  if (autoSceneEnabled) { 
    const scene = await getRandomScene(); // Choose a random scene
    await swapScene(scene);
    console.log(`[OBS] (log): Auto scene switching to ${scene}`);
  }
}

// Twitch chat listener
client.on('chat', async (channel, userstate, message, self) => {
  // Log message (optional)
  // console.log(message);

  // Check for cooldown and permissions
  if (Date.now() / 1000 < commandLastUsed + COMMAND_COOLDOWN) return;
  if (!(userstate.badges?.broadcaster || userstate.mod)) return;

  // Handle command
  message = message.toLowerCase();
  if (message.startsWith("!scene")) {
    const scene = message.split(' ').slice(1).join(' ') || (enableRandom ? await getRandomScene() : ""); // Use random if enabled

    if (sceneNames.includes(scene)) {
      await swapScene(scene);
      console.log(`[OBS] (log): Switching to scene: ${scene}, command sent from ${userstate.username}.`);
      commandLastUsed = Date.now() / 1000;
    }
  } else if (message.startsWith("!random")) {
    // Toggle random scene switching
    enableRandom = !enableRandom;
    console.log(`[OBS] (log): Random scene switching ${enableRandom ? "enabled" : "disabled"}.`);
  } else if (message.startsWith("!auto")) {
    // Toggle auto scene switching
    autoSceneEnabled = !autoSceneEnabled;
    if (autoSceneEnabled) {
      autoSceneInterval = setInterval(autoSceneSwitch, AUTO_SCENE_INTERVAL);
      console.log(`[OBS] (log): Auto scene switching enabled, changing scenes every ${AUTO_SCENE_INTERVAL / 1000} seconds.`);
    } else {
      clearInterval(autoSceneInterval);
      console.log(`[OBS] (log): Auto scene switching disabled.`);
    }
  }
});

client.connect();
