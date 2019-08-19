# Simple CurseForge API

Please use this in a reasonable way and don't spam CurseForge with requests. 
There is caching implemented in this project that you can configure, please install Redis
and use this cache. It's also recommended to set your own user agent in the config to avoid
accidental blocks and to identify yourself to CurseForge.

### Setup

1. Clone this repository
2. `npm install`
3. Copy example.config.json to config.json and edit accordingly
4. `node server.js`

### Usage
See [views/index.html](views/index.html) or open the configured port in your browser.