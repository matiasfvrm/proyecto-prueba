import json, numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile
SR=44100; DUR=84.0; N=int(SR*DUR)
L=np.zeros(N); R=np.zeros(N); rng=np.random.default_rng(11)
def bp(x,lo,hi): return sosfilt(butter(2,[lo,hi],'band',fs=SR,output='sos'),x)
def lp(x,f): return sosfilt(butter(2,f,'low',fs=SR,output='sos'),x)
def add(x,t,g=1.0,pan=0.0):
    i=int(t*SR); j=min(N,i+len(x))
    if i<0 or j<=i: return
    L[i:j]+=x[:j-i]*g*np.sqrt(0.5*(1-pan)); R[i:j]+=x[:j-i]*g*np.sqrt(0.5*(1+pan))
def whoosh(d=0.55):
    n=int(d*SR); t=np.arange(n)/SR; nz=rng.standard_normal(n); out=np.zeros(n); seg=1024
    for i in range(0,n,seg):
        c=400+3500*np.sin(np.pi*i/n)
        out[i:i+seg]=bp(nz[max(0,i-4096):i+seg],c*0.6,c*1.4)[-len(nz[i:i+seg]):]
    return out*np.sin(np.pi*t/d)**2
def impact(d=1.4):
    t=np.arange(int(d*SR))/SR
    f=90*np.exp(-t*10)+40
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*4)+lp(rng.standard_normal(len(t)),2500)*np.exp(-t*30)*0.5
def shutter():
    t=np.arange(int(0.12*SR))/SR; x=bp(rng.standard_normal(len(t)),1500,9000)
    return x*(np.exp(-t*90)+0.6*np.exp(-np.maximum(t-0.05,0)*90)*(t>0.05))
def cash(d=1.6):
    t=np.arange(int(d*SR))/SR
    return sum(np.sin(2*np.pi*f*t)*np.exp(-t*k) for f,k in((2093,4),(2637,5),(3136,6)))*0.3
E=json.load(open("edit_decisions.json"))
for k,e in enumerate(E[1:],1):
    t=e["t0"]; dur=e["t1"]-e["t0"]
    if dur<0.9 and e["flash"]: add(shutter(),t,0.5,pan=rng.uniform(-.4,.4)); continue
    add(whoosh(),t-0.35,0.22,pan=(-0.5 if k%2 else 0.5))
    if e["flash"] or e["punch"]: add(impact(),t,0.45)
add(cash(),0.9,0.25); add(impact(),0.75,0.5)
# room tone / distant stadium wash
wash=lp(rng.standard_normal(N),500)*0.015
mix=np.stack([L+wash,R+wash],1); mix/=max(1,np.max(np.abs(mix))*1.05)
wavfile.write("audio/sfx.wav",SR,(mix*32767).astype(np.int16)); print("ok")
