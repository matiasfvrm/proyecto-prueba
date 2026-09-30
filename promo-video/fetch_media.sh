#!/usr/bin/env bash
# Downloads the footage used by the video into media/clips/, then run: python3 prep_media.py
# Game trailers: official trailers (Steam / archive.org mirrors of the publishers' uploads).
# Stock footage: Mixkit (free license, commercial use allowed): https://mixkit.co/license/
set -e
cd "$(dirname "$0")/media/clips"
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
mkdir -p .bin && ln -sf "$FF" .bin/ffmpeg
# Undertale (Steam store trailer)
url=$(curl -s "https://store.steampowered.com/api/appdetails?appids=391540&filters=movies" | python3 -c "import sys,json;print(json.load(sys.stdin)['391540']['data']['movies'][0]['hls_h264'])")
yt-dlp -q --ffmpeg-location .bin -o rpg.mp4 "$url"
# Hollow Knight + Among Us (Steam store trailers)
for a in 367520:hk:0 945360:amongus:2; do
  id=${a%%:*}; rest=${a#*:}; name=${rest%%:*}; idx=${rest##*:}
  url=$(curl -s "https://store.steampowered.com/api/appdetails?appids=$id" | python3 -c "import sys,json;print(json.load(sys.stdin)['$id']['data']['movies'][$idx]['hls_h264'])")
  yt-dlp -q --ffmpeg-location .bin -o "$name.mp4" "$url"
done
curl -sfL -o br.mkv    https://archive.org/download/youtube-8o4OrKoWMBE/8o4OrKoWMBE.mkv    # Fortnite trailer
curl -sfL -o fps.mkv   https://archive.org/download/youtube-4HWAzCFg7vo/4HWAzCFg7vo.mkv    # VALORANT Team Deathmatch trailer
curl -sfL -o craft.webm https://archive.org/download/youtube-3kEobQt_xDk/3kEobQt_xDk.webm  # Minecraft Ender Update trailer
for p in vlog:2168 music:48509 podcast:2956 city:41161 ad:15954 skate:36498 car:35540 food:49231 dance:452 fashion:42298 travel:5363 drone:15919; do
  s=${p%%:*}; i=${p##*:}
  curl -sfL -o "$s.mp4" "https://assets.mixkit.co/videos/$i/$i-1080.mp4" || curl -sfL -o "$s.mp4" "https://assets.mixkit.co/videos/$i/$i-720.mp4"
done
rm -rf .bin
# Thumbnail images (Mixkit 42283 = creator with platform signs, 23145 = editor at work)
mkdir -p ../thumb && FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
curl -sfL -o /tmp/t1.mp4 https://assets.mixkit.co/videos/42283/42283-1080.mp4 && "$FF" -loglevel error -y -ss 2 -i /tmp/t1.mp4 -frames:v 1 ../thumb/platforms.png
curl -sfL -o /tmp/t2.mp4 https://assets.mixkit.co/videos/23145/23145-720.mp4 && "$FF" -loglevel error -y -ss 12 -i /tmp/t2.mp4 -frames:v 1 -vf scale=1920:-1 ../thumb/editor.png
