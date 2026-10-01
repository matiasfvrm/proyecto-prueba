import numpy as np, json
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile
SR=44100; OFF=0.8; DUR=84.0
N=int(SR*DUR); L=np.zeros(N); R=np.zeros(N)
T=json.load(open("audio/timings.json")); st=[s["start"]+OFF for s in T]
rng=np.random.default_rng(7)
def n2f(n): return 440*2**((n-69)/12)
def add(sig,t0,gain=1.0,pan=0.0):
    i=int(t0*SR); j=min(N,i+len(sig))
    if j<=i: return
    L[i:j]+=sig[:j-i]*gain*np.sqrt(0.5*(1-pan)); R[i:j]+=sig[:j-i]*gain*np.sqrt(0.5*(1+pan))
def lp(x,fc,o=2): return sosfilt(butter(o,fc,'low',fs=SR,output='sos'),x)
def hp(x,fc,o=2): return sosfilt(butter(o,fc,'high',fs=SR,output='sos'),x)
def env(n,a,r):
    e=np.ones(n); ai=int(a*SR); ri=int(r*SR)
    if ai: e[:ai]=np.linspace(0,1,ai)
    if ri: e[-ri:]*=np.linspace(1,0,ri)
    return e
# --- chords (D minor: Dm Bb F C / Gm) ---
prog=[[50,57,62,65],[46,53,58,62],[53,57,60,65],[48,55,60,64],[43,50,58,62]]
def pad(notes,dur,bright=1200):
    t=np.arange(int(dur*SR))/SR; x=np.zeros_like(t)
    for n in notes:
        for d in (-0.08,0,0.07):
            f=n2f(n)*2**(d/12)
            ph=rng.uniform(0,6.28)
            x+=sum(np.sin(2*np.pi*f*k*t+ph)/k**1.3 for k in range(1,7))
    x=lp(x,bright)*(1+0.15*np.sin(2*np.pi*0.2*t))
    return x/np.max(np.abs(x))*env(len(t),1.5,1.5)
def piano(n,dur=3.0):
    t=np.arange(int(dur*SR))/SR; f=n2f(n)
    x=sum(np.sin(2*np.pi*f*k*t*(1+0.0004*k*k))*np.exp(-t*(1.2+k*0.9))/k for k in range(1,9))
    x[:200]*=np.linspace(0,1,200); return x*0.6
def sub(dur=0.5,f=45):
    t=np.arange(int(dur*SR))/SR
    return np.sin(2*np.pi*f*t)*np.exp(-t*6)
def taiko(dur=1.6):
    t=np.arange(int(dur*SR))/SR
    f=110*np.exp(-t*12)+48
    x=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*3.5)
    x+=lp(rng.standard_normal(len(t)),900)*np.exp(-t*25)*0.6
    return x
def boom(dur=5.0):
    t=np.arange(int(dur*SR))/SR
    f=70*np.exp(-t*4)+30
    x=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*1.2)*1.2
    x+=lp(rng.standard_normal(len(t)),300)*np.exp(-t*1.5)*0.8
    x+=hp(rng.standard_normal(len(t)),2000)*np.exp(-t*6)*0.25
    return x
def riser(dur):
    t=np.arange(int(dur*SR))/SR; nz=rng.standard_normal(len(t)); out=np.zeros_like(t)
    seg=int(0.05*SR)
    for i in range(0,len(t),seg):
        fc=300+ (i/len(t))**2*7000
        out[i:i+seg]=lp(nz[max(0,i-2000):i+seg],fc)[-len(nz[i:i+seg]):]
    tone=np.sin(2*np.pi*np.cumsum(200+600*(t/dur)**2)/SR)*0.25
    return (out+tone)*(t/dur)**2.2
def tick(dur=0.15):
    t=np.arange(int(dur*SR))/SR
    return hp(rng.standard_normal(len(t)),5000)*np.exp(-t*60)
# Section A: 0 - montage start (st[10]) : dark pads + sparse piano
mont=st[10]; fight=st[17]; calm=st[18]; endv=T[-1]["end"]+OFF
chord_len=5.33
t=0.0; ci=0
while t<mont-0.5:
    c=prog[[0,1,2,3][ci%4]]; d=min(chord_len+1.5,mont-t+1.0)
    add(pad(c,d,700 if t<20 else 1100),t,0.16)
    t+=chord_len; ci+=1
# piano motif (D minor) on sparse beats
motif=[74,72,69,72,74,77,76,72]
beat=0.6667
for k,tt in enumerate(np.arange(2.0,mont-1,beat*2)):
    add(piano(motif[k%len(motif)]),tt,0.11 if tt<20 else 0.14,pan=0.3*np.sin(k))
# heartbeat sub pulses in build (st[6]..mont)
for tt in np.arange(st[6],mont,beat*2):
    add(sub(0.45),tt,0.55); add(sub(0.35),tt+0.22,0.35)
# riser into montage
add(riser(4.0),mont-4.0,0.22)
add(boom(4),mont,0.7)
# Section B montage: driving pulse + taiko on each "to ..." line
for tt in np.arange(mont,fight,beat/2):
    add(sub(0.25,55),tt,0.30)
    add(tick(),tt+beat/4,0.05,pan=0.5)
cB=[prog[0],prog[1],prog[2],prog[3],prog[4],prog[0]]
t=mont; k=0
while t<fight:
    add(pad(cB[k%6],3.6,2200),t,0.20); t+=3.3; k+=1
for i in range(11,17): add(taiko(),st[i],0.9); add(taiko(),st[i]+beat,0.45)
# strings swell rising
sw=pad([62,65,69,74],fight-mont,3000)*np.linspace(0.1,1,int((fight-mont)*SR))
add(sw,mont,0.12)
add(riser(3.0),fight-3.0,0.25)
# fight impact
add(boom(6),fight,1.0); add(taiko(),fight,1.0)
# Section C: calm, piano + pad
add(pad(prog[0],calm-fight+8,800),fight+0.3,0.14)
t=calm+2; k=0
while t<endv-4:
    c=prog[[1,2,3,0][k%4]]; add(pad(c,chord_len+1.5,900+k*120),t,0.13+0.015*k); t+=chord_len; k+=1
for k,tt in enumerate(np.arange(calm,endv-2,beat*2)):
    add(piano(motif[(k+2)%8]-12*(k%5==0)),tt,0.14,pan=0.3*np.cos(k))
# final swell + hit
add(riser(5),endv-5,0.25)
add(pad([38,50,57,62,65,69],DUR-endv,1500),endv,0.25)
add(boom(5),endv,1.0)
# reverb
ir_t=np.arange(int(2.8*SR))/SR
for ch in (0,1):
    ir=rng.standard_normal(len(ir_t))*np.exp(-ir_t*2.2); ir=lp(ir,4000); ir/=np.sqrt(np.sum(ir**2))
    x=L if ch==0 else R
    wet=fftconvolve(x,ir)[:N]
    if ch==0: L=x*0.8+wet*0.45
    else: R=x*0.8+wet*0.45
mix=np.stack([L,R],1); mix=np.tanh(mix*1.2); mix/=np.max(np.abs(mix))*1.12
fo=int(1.5*SR); mix[-fo:]*=np.linspace(1,0,fo)[:,None]
wavfile.write("audio/music.wav",SR,(mix*32767).astype(np.int16))
print("ok",DUR)
