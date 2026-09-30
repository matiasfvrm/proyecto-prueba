# Video editing promo (Fiverr)

- `video-editing-promo.mp4` — final video, 1080x1920 (9:16), 27 s, 30 fps, with original music.
- `promo.html` — the animation. Open it in a browser to preview it live.
- `render.js` — renders `promo.html` frame by frame with Playwright.
- `music.py` — synthesizes the background music (no copyrighted audio).

Re-render after editing texts in `promo.html`:

```bash
pip install imageio-ffmpeg numpy
node render.js frames 30
python3 music.py music.wav
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
$FF -framerate 30 -i frames/f%05d.png -i music.wav -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -shortest video-editing-promo.mp4
```
