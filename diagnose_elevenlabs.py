#!/usr/bin/env python3
"""Minimal safe account diagnostic. Prints credit status and concise errors only."""
import os, json, urllib.request, urllib.error
KEY=os.environ.get("ELEVENLABS_API_KEY","").strip()
if not KEY: raise SystemExit("KEY_MISSING")
def req(method,path,payload=None):
    body=json.dumps(payload).encode() if payload else None
    headers={"xi-api-key": KEY, "accept":"application/json"}
    if body:headers["content-type"]="application/json"
    request=urllib.request.Request("https://api.elevenlabs.io"+path,data=body,headers=headers,method=method)
    try:
      with urllib.request.urlopen(request,timeout=25) as response:
        data=response.read()
        try:return response.status,json.loads(data)
        except: return response.status,{"bytes":len(data)}
    except urllib.error.HTTPError as e:
      try:content=json.loads(e.read(4096))
      except:content={"detail":{"status":"unknown","message":"No message received"}}
      detail=content.get("detail",{})
      if isinstance(detail,dict):
        brief={"status":detail.get("status"),"message":str(detail.get("message",""))[:350]}
      else:brief={"status":str(detail)[:90]}
      return e.code,brief
    except Exception as e:
      return 0,{"error":type(e).__name__}
status,subscription=req("GET","/v1/user/subscription")
print("SUBSCRIPTION_HTTP",status,flush=True)
if status==200:
  print("SUBSCRIPTION_INFO", json.dumps({k:subscription.get(k) for k in
    ("tier","character_count","character_limit","next_character_count_reset_unix")},sort_keys=True),flush=True)
else:print("SUBSCRIPTION_ERROR",json.dumps(subscription),flush=True)
status,voices=req("GET","/v1/voices")
print("VOICES_HTTP",status,flush=True)
if status==200:
  items=voices.get("voices",[])
  print("VOICES",[(v.get("name"),v.get("category"),v.get("voice_id")) for v in items[:12]],flush=True)
else:print("VOICES_ERROR",json.dumps(voices),flush=True)
for model in ("eleven_v3","eleven_flash_v2_5"):
 status,result=req("POST","/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
           {"text":"Good morning.","model_id":model,"voice_settings":{"stability":0.5}})
 print("TTS_MODEL",model,"HTTP",status,"RESULT",json.dumps(result)[:400],flush=True)
 if status==200:break
