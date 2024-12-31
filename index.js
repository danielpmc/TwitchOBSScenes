const { OBSWebSocket } = require('obs-websocket-js');
const { Client } = require('twitch-js');

const client = new Client({
  channels: ['danielpmc2014'], // Use an array for channel names
});

const sceneNames = ["1", "2"]; // Array of scene names
const COMMAND_NAME = "!scene"; // Command to type in chat
const COMMAND_COOLDOWN = 5; // Cooldown in seconds
let commandLastUsed = 0;

const obs = new OBSWebSocket();

async function getRandomScene() {
  const randomIndex = Math.floor(Math.random() * sceneNames.length);
  return sceneNames[randomIndex];
}

async function swapScene(scene) {
  try {
    await obs.connect('ws://localhost:4444');
    console.log('Opening OBS Websocket to change scene!');

    await obs.call('SetCurrentProgramScene', { sceneName: scene });

    await obs.disconnect();
    console.log('Changed scene, Closing websocket!');
  } catch (err) {
    console.error('Error:', err);
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
  if (message.startsWith(COMMAND_NAME)) {
    const scene = message.split(' ').slice(1).join(' ') || await getRandomScene(); // Get scene name or random
    if (sceneNames.includes(scene)) {
      await swapScene(scene);
      console.log(`[OBS] (log): Switching to scene: ${scene}, command sent from ${userstate.username}.`);
      commandLastUsed = Date.now() / 1000;
    }
  }
});

client.connect();
