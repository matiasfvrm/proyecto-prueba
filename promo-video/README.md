# Video editing promo (Fiverr)

## Main video: `video-editing-promo.mp4`
1920x1080 (16:9, YouTube / Facebook / long-form), 48 s, 30 fps, original music.

| Time | Scene |
|------|-------|
| 0–4 s | Rapid glitch montage → "YOUR VIDEOS / NEXT LEVEL" |
| 4–8 s | "PROFESSIONAL VIDEO EDITING": animated editor (timeline, razor cut, effects) |
| 8–14 s | "ONE EDITOR. EVERY PLATFORM.": YouTube, TikTok, Instagram and Facebook mockups with whip-pans |
| 14–22 s | GAMING: RPG, battle royale, tactical FPS and sandbox gameplay, then a montage grid |
| 22–30 s | ANY STYLE: vlogs, ads, music videos, podcasts |
| 30–36 s | Captions, color grading before/after, VFX and sound design |
| 36–41 s | "YOU ASK. I EDIT.": client chat and delivery |
| 41–48 s | "ORDER NOW ON fiverr." call to action |

`video-editing-promo-share.mp4` is a lighter copy (<30 MB) of the same video. `video-editing-promo-vertical.mp4` is the first (9:16, 27 s) version.

## Footage
The video uses real footage (clips are not committed; `./fetch_media.sh` downloads them, then `python3 prep_media.py`):

| Slot | Source |
|------|--------|
| `rpg` | UNDERTALE official trailer (Steam store) |
| `br` | Fortnite trailer (archive.org mirror of the Epic Games upload) |
| `fps` | VALORANT Team Deathmatch official trailer (archive.org mirror of the Riot Games upload) |
| `craft` | Minecraft "Ender Update" trailer (archive.org mirror of the Mojang upload) |
| `vlog`, `music`, `podcast`, `city`, `ad` | Mixkit stock videos 2168, 48509, 2956, 41161, 15954 ([free license](https://mixkit.co/license/)) |

Game trailers belong to their publishers. For paid advertising, your own gameplay recordings are the safest choice:
replace any file in `media/clips/` (same name), adjust `media/clips/starts.txt`, and re-run `prep_media.py`.
Without clips, each slot falls back to an animated stand-in.

## Files
- `promo.html` + `src/`: the animation (canvas). Open `promo.html` in a browser for a live preview (click to start music).
- `render.js`: renders frames with Playwright. `music.py`: synthesizes the soundtrack.
- `prep_media.py`: turns real clips into frame sequences.

## Render
```bash
pip install imageio-ffmpeg numpy scipy
python3 music.py music.wav
node render.js frames 30            # or split: FROM=0 TO=720 node render.js frames 30 & FROM=720 TO=1440 ...
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
$FF -framerate 30 -i frames/f%05d.jpg -i music.wav -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p \
    -c:a aac -b:a 256k -shortest -movflags +faststart video-editing-promo.mp4
```
