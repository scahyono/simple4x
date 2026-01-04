# Focus Reign

Focus Reign is a minimalist 4X-inspired browser game where you race an opposing faction to claim a procedurally generated map. Move warriors across tiles, capture territory, and reach 50% map control to win.

## Play Now
- **Web:** [Focus Reign Demo](https://scahyono.github.io/pocket-reign/index.html)

### Install as a PWA on Android Chrome
1. Open the link above in Chrome on Android.
2. Tap the **⋮** menu and choose **Add to Home screen**.
3. Launch Focus Reign from your home screen for a fullscreen, standalone experience.


## How to Play
- **Win Condition:** Control **50%** of the land before your rival does.
- **Move & Claim:** Select a unit and click an adjacent tile to move; entering a tile automatically claims it.
- **Recruit:** Spend **50 Gold** to recruit a Warrior from your capital using the **Recruit Warrior** button.
- **End Turn:** Press **End Turn** after issuing your moves to advance the round.
- **Factions:** Each match randomly pairs your faction with a rival; icons in the HUD show the matchup. The **Rest vs Restlessness** sleep theme is listed in the faction help panel all day, but random rolls only surface it between **10 PM and 6 AM** with a **50%** chance. It links to a calming session on [YouTube](https://youtu.be/m8p3Ba_VJAQ?si=oWwliXAKsEuhIrYN).
- **Cooldowns & Replays:** After a match, a cooldown timer locks the gray **Play Again** button until it expires. While waiting, tap the **Time to Act** CTA to open Google Calendar and schedule your next move.
- **Rank Protection:** Three hours of abstinence after your last session locks in Rank 10 protection for the rest of the day. If you haven’t played since yesterday and it’s already past noon, the game assumes you’ve satisfied that 3-hour window and lets protection trigger immediately once you finish a run.

## Terrain Legend
- 🌿 **Grass:** Movement cost **1**.
- 🌲 **Forest:** Movement cost **2**.
- 🏜️ **Desert:** Movement cost **1**.
- ⛰️ **Mountain:** Impassable (blocked).
- 🌊 **Water:** Impassable (blocked).
- 🟩 **Your Territory:** Tiles you control.
- 🟥 **Enemy Territory:** Tiles the rival controls.

## Tips
- Expand early on cheap terrain like Grass and Desert to maximize coverage.
- Avoid bottlenecks of Mountains and Water when plotting paths.
- Track Gold in the top bar to time new Warrior recruits for critical pushes.
- Keep an eye on the turn counter to pace your expansion against the AI.

## Tech Stack
- HTML5 Canvas for rendering
- Vanilla JavaScript for gameplay logic
- CSS for UI styling

## Screenshots

### Web
![Web Interface](screenshots/web_screenshot.png)

### Mobile
| Android | iPhone |
|:-------:|:------:|
| <img src="screenshots/android_screenshot.png" width="300"> | <img src="screenshots/iphone_screenshot.png" width="300"> |

