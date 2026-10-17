#!/usr/bin/env python3
"""Create five short B2 listening recordings with ElevenLabs, for GitHub Pages.
The ElevenLabs key must be a GitHub Actions secret, never committed to git.
"""
import json, os, pathlib, subprocess, tempfile, time, urllib.error, urllib.request

ROOT = pathlib.Path(__file__).parent
OUT = ROOT / "audio"
OUT.mkdir(exist_ok=True)
API_KEY = os.environ.get("ELEVENLABS_API_KEY", "").strip()
if not API_KEY:
    raise SystemExit("Please set ELEVENLABS_API_KEY in GitHub Actions secrets.")
MODEL = "eleven_v3"
VOICES = {
    "Daniel": "JBFqnCBsd6RMkjVDRZzb",    # George
    "Samantha": "21m00Tcm4TlvDq8ikWAM",  # Rachel
    "Moira": "EXAVITQu4vr4xnSDxMaL",     # Bella
    "Tessa": "Xb7hH8MSUJpSbSDYk0k2",    # Alice
}
PREFERRED = {
    "Daniel": ["George", "Brian", "Adam"],
    "Samantha": ["Rachel", "Sarah", "Jessica"],
    "Moira": ["Bella", "Charlotte", "Lily"],
    "Tessa": ["Alice", "Matilda", "Emily"],
}
def request(method, endpoint, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request("https://api.elevenlabs.io" + endpoint, data=data,
        headers={"xi-api-key": API_KEY, "Accept": "audio/mpeg" if data is not None else "application/json",
                 "Content-Type": "application/json"}, method=method)
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=95) as response:
                return response.read()
        except urllib.error.HTTPError as err:
            if err.code in (429, 500, 502, 503, 504) and attempt < 4:
                time.sleep(3 * (2 ** attempt))
                continue
            try:
                details = json.loads(err.read(2000).decode()).get("detail", {})
                details = details.get("status", "") if isinstance(details, dict) else str(details)
            except Exception:
                details = "unavailable"
            # Never log key or headers.
            raise RuntimeError(f"ElevenLabs HTTP {err.code}: {str(details)[:100]}") from None

def ff(*args):
    subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
                    *map(str, args)], check=True)

def select_voices():
    selected = dict(VOICES)
    try:
        voices = json.loads(request("GET", "/v1/voices"))["voices"]
        by_name = {v["name"].lower(): v["voice_id"] for v in voices if v.get("name") and v.get("voice_id")}
        for speaker, names in PREFERRED.items():
            for name in names:
                if name.lower() in by_name:
                    selected[speaker] = by_name[name.lower()]
                    break
        print("Using available ElevenLabs voice profiles", flush=True)
    except Exception:
        print("Using default ElevenLabs narrator profiles", flush=True)
    return selected

def speak(text, voice_id, destination):
    # Natural v3 delivery: tags and punctuation influence intonation.
    if text.rstrip().endswith("?"):
        text = "[curious] " + text
    data = request("POST",
        "/v1/text-to-speech/" + voice_id + "?output_format=mp3_44100_128",
        {"text": text, "model_id": MODEL, "voice_settings": {"stability": 0.5}})
    if not (data[:3] == b"ID3" or
            (len(data)>2 and data[0] == 0xff and (data[1] & 0xe0) == 0xe0)):
        raise RuntimeError("ElevenLabs response is not MP3 audio.")
    destination.write_bytes(data)

def main():
    groups = json.loads((ROOT / "audio-source.json").read_text())["groups"]
    assert len(groups) == 5 and all(len(g) == 6 for g in groups)
    voices = select_voices()
    with tempfile.TemporaryDirectory(prefix="simo-eleven-") as temp:
        temp = pathlib.Path(temp)
        pause = temp / "pause.wav"
        ff("-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", "2.2", pause)
        for group_index, group in enumerate(groups, 1):
            playlist_files = []
            for item in group:
                number = item["number"]
                intro = temp / f"q{number}-intro.mp3"
                speak(f"Question {number}.", voices["Samantha"], intro)
                playlist_files.extend([intro, pause])
                for index, segment in enumerate(item["segments"], 1):
                    clip = temp / f"q{number}-{index}.mp3"
                    speak(segment["text"], voices.get(segment["voice"], voices["Samantha"]), clip)
                    playlist_files.append(clip)
                playlist_files.append(pause)
                print(f"Generated B2 question {number}/30", flush=True)
            wavs = []
            for index, source in enumerate(playlist_files):
                pcm = temp / f"group-{group_index}-{index}.wav"
                ff("-i", source, "-ar", "24000", "-ac", "1", pcm)
                wavs.append(pcm)
            manifest = temp / f"group-{group_index}.txt"
            manifest.write_text("".join("file '"+str(wav)+"'\n" for wav in wavs))
            target = OUT / f"group-{group_index}.mp3"
            ff("-f", "concat", "-safe", "0", "-i", manifest,
               "-codec:a", "libmp3lame", "-qscale:a", "4", target)
            if target.stat().st_size < 50000:
                raise RuntimeError("Missing or empty recording for group " + str(group_index))
            print(f"Finished group {group_index}/5, bytes={target.stat().st_size}", flush=True)
    print("Five genuine ElevenLabs recordings ready to publish from GitHub.", flush=True)

if __name__ == "__main__":
    main()
