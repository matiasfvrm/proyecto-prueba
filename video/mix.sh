#!/bin/sh
# Final mix: voice (delayed 0.8 s) + ducked music + SFX, muxed onto the rendered picture.
set -e
cd "$(dirname "$0")"
ffmpeg -y -v error -i output/video_silent.mp4 -i audio/voiceover.mp3 -i audio/music.wav -i audio/sfx.wav -filter_complex "
[1:a]aresample=44100,aformat=channel_layouts=stereo,adelay=800|800,volume=1.6,asplit=2[vo][vokey];
[2:a]volume=0.85[mus];
[mus][vokey]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=450[musd];
[3:a]volume=0.9[sfx];
[vo][musd][sfx]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
 -map 0:v -map "[a]" -c:v libx264 -preset slow -crf 21 -maxrate 8M -bufsize 16M -pix_fmt yuv420p -c:a aac -b:a 256k -shortest -movflags +faststart output/joe_burrow_final.mp4
echo done
