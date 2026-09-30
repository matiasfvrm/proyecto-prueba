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
curl -sfL -o br.mkv    https://archive.org/download/youtube-8o4OrKoWMBE/8o4OrKoWMBE.mkv    # Fortnite trailer
curl -sfL -o fps.mkv   https://archive.org/download/youtube-4HWAzCFg7vo/4HWAzCFg7vo.mkv    # VALORANT Team Deathmatch trailer
curl -sfL -o craft.webm https://archive.org/download/youtube-3kEobQt_xDk/3kEobQt_xDk.webm  # Minecraft Ender Update trailer
for p in vlog:2168 music:48509 podcast:2956 city:41161 ad:15954; do
  s=${p%%:*}; i=${p##*:}
  curl -sfL -o "$s.mp4" "https://assets.mixkit.co/videos/$i/$i-1080.mp4" || curl -sfL -o "$s.mp4" "https://assets.mixkit.co/videos/$i/$i-720.mp4"
done
rm -rf .bin
