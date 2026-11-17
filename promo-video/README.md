# Video editing promo (Fiverr)

## Main video: `video-editing-promo.mp4`
1920x1080 (16:9, YouTube / Facebook / long-form), 48 s, 30 fps, original music.

| Time | Scene |
|------|-------|
| 0–4 s | Cold open: eight fast cuts, then "Good footage deserves a better edit." |
| 4–8 s | The edit: timeline whose preview follows the playhead while effects switch on |
| 8–14 s | "One editor. Every platform.": YouTube, TikTok, Instagram, Facebook |
| 14–22 s | Gaming: four gameplay edits with speed ramps, then a six-game grid |
| 22–30 s | Any style: vlogs, ads, music videos, podcasts |
| 30–36 s | Finishing: captions, colour grade before/after, speed ramps |
| 36–40 s | "You ask. I edit.": client chat and delivery |
| 40–48 s | "Let's make your next video." call to action |

Look: condensed white capitals (Anton) with yellow marker lettering and hand-drawn underlines (Permanent Marker), footage first.
Scenes and the theme table live in `src/reel.js`; other looks: `promo.html?theme=cinema|blocks|editorial` (render with `THEME=...`).

`video-editing-promo-share.mp4` is a lighter copy (<30 MB) of the same video. `video-editing-promo-vertical.mp4` is the first (9:16, 27 s) version.

## Footage
The video uses real footage (clips are not committed; `./fetch_media.sh` downloads them, then `python3 prep_media.py`):

| Slot | Source |
|------|--------|
| `rpg` | UNDERTALE official trailer (Steam store) |
| `br` | Fortnite trailer (archive.org mirror of the Epic Games upload) |
| `fps` | VALORANT Team Deathmatch official trailer (archive.org mirror of the Riot Games upload) |
| `craft` | Minecraft "Ender Update" trailer (archive.org mirror of the Mojang upload) |
| `hk`, `amongus` | Hollow Knight and Among Us trailers (Steam store) |
| `vlog`, `music`, `podcast`, `city`, `ad`, `skate`, `car`, `food`, `dance`, `fashion`, `travel`, `drone` | Mixkit stock videos 2168, 48509, 2956, 41161, 15954, 36498, 35540, 49231, 452, 42298, 5363, 15919 ([free license](https://mixkit.co/license/)) |

Game trailers belong to their publishers. For paid advertising, your own gameplay recordings are the safest choice:
replace any file in `media/clips/` (same name), adjust `media/clips/starts.txt`, and re-run `prep_media.py`.
Without clips, each slot falls back to an animated stand-in.

## Files
- `promo.html` + `src/`: the animation (canvas). Open `promo.html` in a browser for a live preview (click to start music).
- `render.js`: renders frames with Playwright.
- `soundtrack.py`: builds `soundtrack.wav` from the music track "House Vibes" (Mixkit music 129, 120 BPM,
  [Mixkit Stock Music Free License](https://mixkit.co/license/#musicFree)) plus transition sounds; cuts sit on its bar lines.
- `prep_media.py`: turns real clips into frame sequences.

## Render
```bash
python3 -m pip install imageio-ffmpeg numpy scipy librosa pillow yt-dlp
./fetch_media.sh && python3 prep_media.py
python3 soundtrack.py media/music/129.mp3 soundtrack.wav
node render.js frames 30            # or split: FROM=0 TO=720 node render.js frames 30 & FROM=720 TO=1440 ...
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
$FF -framerate 30 -i frames/f%05d.jpg -i soundtrack.wav -vf scale=in_range=pc:out_range=tv,format=yuv420p -c:v libx264 -preset slow -crf 18 \
    -c:a aac -b:a 256k -shortest -movflags +faststart video-editing-promo.mp4
```

## Fiverr thumbnail
`fiverr-thumbnail.png` (1280x769, Fiverr gig image size) and `fiverr-thumbnail-hd.png` (1920x1154).
Edit `thumbnail.html`, then `node render-thumbnail.js` and downscale the HD file to 1280x769.
