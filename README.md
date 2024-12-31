
# TwitchOBSScenes

Allows the broadcaster or moderators switch the scenes in OBS.

This could be useful for streams that include cameras, A way to switch between them without having to interact with OBS client. 




## Contributing

Contributions are always welcome! If you would like to submit any code to this project please open a pull request! 




## Deployment

To get started Theres a few things that need to be changed but first, Lets start with installing the modules that are needed.

```bash
  npm i
```
This will install all needed modules After this, Go to index.js, You will need to change the twitch channel name (This is the channel it looks for the commands to be ran in the chat) this can be found on line 5. After this edit line 8 with the scene names. Once thats all done, you can run the script using the following command
```bash
  node index.js
```

That's it! its now up and running, Give it a test by running !scene and then the scene name in your twitch chat, or run !random (This selects a random scene) and then run !scene to switch to it!
## Roadmap

- Add a channel points system so that users can pay using channel points to swap the scenes (With options to enable and disable this)

- Add a config file to make it easier to get setup and running

