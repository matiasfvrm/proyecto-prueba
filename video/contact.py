import sys,glob
from PIL import Image,ImageDraw
fs=sorted(sum([glob.glob(p) for p in sys.argv[2:]],[]))
W=6; tw,th=320,200
sheet=Image.new("RGB",(W*tw,((len(fs)+W-1)//W)*th),"black"); d=ImageDraw.Draw(sheet)
for i,f in enumerate(fs):
    im=Image.open(f).convert("RGB"); im.thumbnail((tw,th-16))
    x,y=(i%W)*tw,(i//W)*th; sheet.paste(im,(x,y)); d.text((x+3,y+th-15),f.split("/")[-1],fill="yellow")
sheet.save(sys.argv[1]); print(len(fs))
