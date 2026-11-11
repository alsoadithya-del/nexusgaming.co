# NEXUS — Cloud Gaming Website Prototype

A responsive, dark-mode, free-to-play gaming hub prototype for solo and multiplayer discovery. The demo has no payment, subscription, or paid unlock flow.

## Run it

1. Unzip the project.
2. Open `index.html` in a modern browser, or serve the folder from a local web server (recommended for the browser's Web Crypto API).
3. Create a demo player account, favorite games, launch a simulated session, and save progress.

For the most reliable account-demo experience, serve the folder with a local server, for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Free-to-play promise

- No payment required to use this prototype.
- No subscription or paid game unlocks are included.
- Accounts, favorites, and progress are demo features stored locally in your browser.

## Included interactions

- Solo, multiplayer, and all-games filters, plus genre filtering, sorting, and search.
- Game detail views and simulated cloud-session launch / save.
- Demo player registration and sign-in, player stats, favorites, achievements, and saved game progress.
- Create-room invite codes and simulated lobby joins.
- Responsive layout for desktop, tablet, and mobile.

## Important prototype limits

This is a front-end demo. Account records and progress are stored in the current browser's local storage, so they do not sync across devices and can be cleared by the browser. The password is hashed in-browser for this demo, but client-side authentication is not production security. Never reuse a real password here.

Actual cloud gaming needs a backend identity service, a database for player saves, game licensing and hosting, GPU instances, a streaming stack (for example WebRTC or a provider SDK), matchmaking, and operational monitoring. The “launch” experience in this prototype simulates a session; it does not stream a real game. Running real cloud-streamed games may have infrastructure costs, so a genuinely free production service would need a sustainable free hosting plan or usage limits.
