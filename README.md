# Simo B2 Listening – free Kokoro AI voices

**Live exam:** https://paulos78.github.io/simo-b2-first-listening/

This is original, independent B2-level listening practice (not the official Cambridge B2 First test layout). The exam consists of **five recorded groups of six extracts** and **30 multiple-choice questions**, with a 45-minute timer, instant scoring and optional email reporting/CSV export.

## Audio

**Five MP3 files are directly hosted by GitHub Pages at `audio/group-1.mp3` through `audio/group-5.mp3`.** They are synthesized with the **open-source [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) AI voice model** (Apache 2.0), using `kokoro-onnx` (MIT) and 4 speaking styles/voices: British `bm_george`, `bf_emma` and `bf_isabella`; American `af_heart`. The audio is pre-generated locally, not synthesized in a student's browser, and incurs no API fees or ElevenLabs credits.

Run `generate_kokoro.py` with Python 3.12, the `kokoro-onnx` and `soundfile` packages, and the official Kokoro v1.0 ONNX checkpoint and voice bundle in `.kokoro-model/`. See https://github.com/thewh1teagle/kokoro-onnx for model download instructions. Then upload the five MP3s through the GitHub API. The `.kokoro-model/` directory and local caches do not belong in GitHub. The original source scripts for all 30 spoken extracts are in `audio-source.json`.

## Teacher report

At the end of the exam, students see scores and can download the full CSV report. With consent, the existing FormSubmit teacher-report endpoint receives the answer details, but delivery depends on external email service activation. This is not a remotely proctored exam or official Cambridge grading.

## Legacy

`generate_elevenlabs.py` and its optional workflow remain for reference. ElevenLabs refused its free-tier library voice API with HTTP 402; **Kokoro is the free working replacement**. Never commit API keys or repository secrets.
