import json, subprocess, wave
lines=[l.strip().replace("…","...") for l in open("script.txt") if l.strip()]
segs=[]; t=0.0; parts=[]
for i,l in enumerate(lines):
    f=f"audio/line_{i:02d}.wav"
    subprocess.run(["piper","-m","voices/en_US-ryan-high.onnx","--length-scale","1.08","-f",f],input=l.encode(),check=True,capture_output=True)
    d=wave.open(f).getnframes()/wave.open(f).getframerate()
    pause=0.35 if l.endswith("...") else 0.7
    segs.append({"i":i,"text":l,"start":round(t,3),"end":round(t+d,3)})
    parts.append((f,pause)); t+=d+pause
with open("audio/concat.txt","w") as c:
    for f,p in parts:
        c.write(f"file '{f.split('/')[1]}'\n")
        subprocess.run(["ffmpeg","-y","-v","error","-f","lavfi","-i","anullsrc=r=22050:cl=mono","-t",str(p),f"audio/sil_{p}.wav"])
        c.write(f"file 'sil_{p}.wav'\n")
json.dump(segs,open("audio/timings.json","w"),indent=1)
print(len(lines),"lines",round(t,1),"s")
