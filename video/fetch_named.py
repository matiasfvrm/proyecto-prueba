import json,subprocess,time,urllib.parse,re,os
UA="BurrowDocBot/1.0 (educational; matiasfvrm)"
def curl(u,out=None):
    for k in range(6):
        a=["curl","-sSfL","--max-time","300","-A",UA,u]+(["-o",out] if out else [])
        r=subprocess.run(a,capture_output=True)
        if r.returncode==0 and (out or r.stdout.startswith(b"{")): return r.stdout
        time.sleep(4*(k+1))
F=[("sb_00.jpg","Super Bowl LVI Flyover.jpg"),("sb_01.jpg","PBS lit up for the Superbowl (51859154407).jpg"),
   ("bengals_00.jpg","Paul Brown Stadium 2022a.jpg"),("bengals_01.jpg","Paul Brown Stadium interior 2017.jpg"),
   ("vid_draft.webm","2021 NFL Draft (51173334206).webm"),("vid_draft2.webm","NFL Draft, Chicago 2016.webm"),
   ("vid_enter.webm","University of Notre Dame Football entering the stadium.webm"),
   ("vid_fans.webm","Football supporters.webm"),("vid_hoosiers.webm","Indiana Football Hoosiers in the house.webm")]
cr=json.load(open("media/credits.json")) if os.path.exists("media/credits.json") else {}
for fn,title in F:
    u="https://commons.wikimedia.org/w/api.php?"+urllib.parse.urlencode({"action":"query","format":"json","titles":"File:"+title,"prop":"imageinfo","iiprop":"url|size|extmetadata","iiurlwidth":1920})
    p=list(json.loads(curl(u))["query"]["pages"].values())[0]; ii=p["imageinfo"][0]; md=ii.get("extmetadata",{})
    url=ii["thumburl"] if fn.endswith(".jpg") else ii["url"]
    path="media/raw/"+fn
    if not os.path.exists(path): curl(url,path)
    cr[path]={"title":p["title"],"license":md.get("LicenseShortName",{}).get("value",""),
              "artist":re.sub("<[^>]+>","",md.get("Artist",{}).get("value",""))[:80].strip(),"src":ii.get("descriptionurl","")}
    print(fn,os.path.getsize(path) if os.path.exists(path) else "FAIL",ii.get("size"),flush=True)
json.dump(cr,open("media/credits.json","w"),indent=1)
