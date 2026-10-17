#!/usr/bin/env python3
"""Generate five English B2 listening recordings using free offline Kokoro ONNX.

Requires Python 3.12, kokoro-onnx, soundfile, ffmpeg, local pretrained ONNX
and voice embedding files. No API key and no cloud TTS charges.

Source: audio-source.json. Publishes audio/group-1 ... group-5.mp3.
"""
import json, pathlib, re, subprocess, sys, tempfile, time
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

BASE=pathlib.Path(__file__).resolve().parent
MODEL=BASE/".kokoro-model"/"kokoro-v1.0.onnx"
VOICES=BASE/".kokoro-model"/"voices-v1.0.bin"
DATA=json.loads((BASE/"audio-source.json").read_text())
assert len(DATA["groups"])==5 and all(len(x)==6 for x in DATA["groups"])
DEST=BASE/"audio"
DEST.mkdir(exist_ok=True)
SPEAKERS={"Daniel":"bm_george","Samantha":"bf_emma","Moira":"bf_isabella","Tessa":"af_heart"}
VOICE_LANG={"bm_george":"en-gb","bf_emma":"en-gb","bf_isabella":"en-gb","af_heart":"en-us"}
TTS=Kokoro(str(MODEL),str(VOICES))
RATE=24000
PAUSE=int(1.7*RATE)
STEPPAUSE=int(0.20*RATE)
def chunk(text, limit=230):
    sentences=re.split(r"(?<=[.!?])\s+",text.strip())
    buf=""
    for sent in sentences:
        if len(sent)>limit:
            if buf:yield buf;buf=""
            words=sent.split()
            part=""
            for word in words:
                if part and len(part)+len(word)+1>limit:yield part;part=""
                part=(part+" "+word).strip()
            if part:yield part
        elif len(buf)+len(sent)+1<=limit:buf=(buf+" "+sent).strip()
        else:
            if buf:yield buf
            buf=sent
    if buf:yield buf

def make_audio(text,voice):
    parts=[]
    for fragment in chunk(text):
        if not fragment:continue
        audio,rate=TTS.create(fragment,voice=voice,speed=0.99,lang=VOICE_LANG[voice])
        arr=np.asarray(audio,dtype=np.float32).reshape(-1)
        if not np.isfinite(arr).all() or arr.size<100:
            raise RuntimeError("Invalid TTS output")
        if rate!=RATE:
            raise ValueError("Unexpected TTS sample rate: "+str(rate))
        parts.append(arr)
        parts.append(np.zeros(STEPPAUSE,dtype=np.float32))
    return np.concatenate(parts) if parts else np.zeros(STEPPAUSE,dtype=np.float32)

def main():
    print("KOKORO_LOADED",flush=True)
    allstart=time.monotonic()
    cache_dir=BASE/".kokoro-cache";cache_dir.mkdir(exist_ok=True)
    for gi,group in enumerate(DATA["groups"],1):
        combined=[]
        for item in group:
            qi=item["number"]
            intro=cache_dir/f"intro-{qi}.wav"
            if intro.exists():
                intro_audio,_=sf.read(intro,dtype="float32")
            else:
                intro_audio=make_audio("Question "+str(qi)+".","bf_emma")
                sf.write(intro,intro_audio,RATE)
            combined.extend([intro_audio,np.zeros(int(0.75*RATE),dtype=np.float32)])
            for si,segment in enumerate(item["segments"],1):
                speaker=segment["voice"]
                wav=cache_dir/f"question-{qi}-{si}.wav"
                if wav.exists():
                    piece,_=sf.read(wav,dtype="float32")
                else:
                    piece=make_audio(segment["text"],SPEAKERS[speaker])
                    sf.write(wav,piece,RATE)
                combined.extend([np.asarray(piece,dtype=np.float32),np.zeros(int(0.3*RATE),dtype=np.float32)])
            combined.append(np.zeros(PAUSE,dtype=np.float32))
            print(f"QUESTION {qi:02d}/30 — {speaker}, {len(item['segments'])} turns",flush=True)
        tmp=cache_dir/f"group-{gi}.wav"
        sf.write(tmp,np.concatenate(combined),RATE,subtype="PCM_16")
        mp3=DEST/f"group-{gi}.mp3"
        subprocess.run(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y",
                        "-i",str(tmp),"-codec:a","libmp3lame","-qscale:a","4",str(mp3)],check=True)
        duration=float(subprocess.check_output(["ffprobe","-v","error",
            "-show_entries","format=duration","-of","default=nw=1:nk=1",str(mp3)],text=True))
        assert 90<duration<500,(gi,duration)
        print(f"GROUP {gi}/5: {duration:.1f}s, {mp3.stat().st_size} bytes — Kokoro voice",flush=True)
    print("ALL_FIVE_KOKORO_RECORDINGS_COMPLETE",round(time.monotonic()-allstart,1),flush=True)
if __name__=="__main__":
    try:main()
    finally:
        try:TTS.voices.close()
        except Exception:pass
