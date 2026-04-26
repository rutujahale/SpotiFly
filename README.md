# SpotiFly

Download a Spotify song using the Spotify Link

1. Download the files and open them in VS Code

2. Then run - use cd 'File Location.'

3. run command - npm install

4. and - npm start

____________________________________________________________________________________________________________________________________________________________

SpotiFly is a Node.js web app that lets you download Spotify songs as MP3 files.
How it works:

You paste a Spotify track link into the app
The app uses the RapidAPI Spotify Downloader (by dotty9) to fetch the song's info — title, artist, album art, and duration
When you click Download, the same API finds the MP3 and streams it directly to your browser
The song saves to your device as an MP3 file

What we built/fixed:

Set up user login and signup with session-based auth
Built a clean dashboard with download history and stats
Replaced the original yt-dlp based downloader with RapidAPI so no extra tools need to be installed
Used dotenv to keep API keys safe in a .env file
Removed the Spotify Web API dependency (which requires Premium) — the app now only needs a free RapidAPI key to work

Tech used: Node.js, Express, HTML/CSS/JavaScript, RapidAPI Spotify Downloader
