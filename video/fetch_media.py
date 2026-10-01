import subprocess,json,urllib.request,urllib.parse,time,os,re,sys
UA={"User-Agent":"BurrowDocBot/1.0 (educational video; matiasfvrm)"}
def get(u,tries=5):
    for i in range(tries):
        r=subprocess.run(["curl","-sSfL","--max-time","90","-A",UA["User-Agent"],u],capture_output=True)
        if r.returncode==0 and r.stdout: return r.stdout
        print("  retry",r.stderr.decode()[:120]); time.sleep(3*(i+1))
    return None
def search(s,limit=30,mime=None):
    u="https://commons.wikimedia.org/w/api.php?"+urllib.parse.urlencode({"action":"query","format":"json","generator":"search","gsrsearch":s,"gsrnamespace":6,"gsrlimit":limit,"prop":"imageinfo","iiprop":"url|size|mime|extmetadata","iiurlwidth":1920})
    d=get(u); 
    if not d: return []
    pages=json.loads(d).get("query",{}).get("pages",{}).values()
    return sorted(pages,key=lambda p:p.get("index",0))
# (tag, query, how many, mime prefix)
Q=[("burrow","Joe Burrow",40,"image"),
   ("lsu","GA VS LSU E101318",14,"image"),
   ("tiger","Tiger Stadium LSU night",6,"image"),
   ("ohio","Ohio Stadium Columbus",5,"image"),
   ("buckeyes","Ohio State Buckeyes football",6,"image"),
   ("heisman","Heisman Trophy",5,"image"),
   ("cfp","2020 College Football Playoff National Championship",8,"image"),
   ("draft","2020 NFL Draft",5,"image"),
   ("bengals","Cincinnati Bengals Paul Brown Stadium",8,"image"),
   ("sb","Super Bowl LVI",10,"image"),
   ("sofi","SoFi Stadium",5,"image"),
   ("vid","American football filetype:video",25,"video"),
   ("vid2","NFL game filetype:video",15,"video"),
   ("vid3","stadium crowd filetype:video",10,"video")]
os.makedirs("media/raw",exist_ok=True)
credits=json.load(open("media/credits.json")) if os.path.exists("media/credits.json") else {}
for tag,s,n,mp in Q:
    got=0
    for p in search(s,50):
        if got>=n: break
        ii=p["imageinfo"][0]
        if not ii["mime"].startswith(mp): continue
        if mp=="image" and (ii["width"]<900 or ii["mime"] not in("image/jpeg","image/png")): continue
        md=ii.get("extmetadata",{})
        lic=md.get("LicenseShortName",{}).get("value","")
        art=re.sub("<[^>]+>","",md.get("Artist",{}).get("value",""))[:80]
        ext=".jpg" if mp=="image" else "."+ii["url"].rsplit(".",1)[-1]
        fn=f"media/raw/{tag}_{got:02d}{ext}"
        if not os.path.exists(fn):
            url=ii.get("thumburl") if mp=="image" else ii["url"]
            if mp=="video" and ii.get("size",0)>120e6: continue
            data=get(url)
            if not data: continue
            open(fn,"wb").write(data); time.sleep(0.5)
        credits[fn]={"title":p["title"],"license":lic,"artist":art.strip(),"src":ii.get("descriptionurl","")}
        got+=1
    print(tag,got,flush=True)
json.dump(credits,open("media/credits.json","w"),indent=1)
