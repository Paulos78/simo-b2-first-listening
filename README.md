# Simo — B2 Listening exam, 5 short clips

**Live exam:** https://paulos78.github.io/simo-b2-first-listening/

The online exam has five listening recordings (~3 minutes each), six B2-level multiple-choice questions per recording, a 45-minute limit, automatically marked results, and an optional teacher report plus CSV export. It is independent B2 listening practice and not the official Cambridge B2 First examination layout.

## ElevenLabs narration — served directly from this GitHub repo

The five site recordings are committed as `audio/group-1.mp3` through `audio/group-5.mp3`, so GitHub Pages serves them with no live ElevenLabs API requests from the student's device.

The repeatable ElevenLabs conversion is provided by `.github/workflows/elevenlabs-audio.yml` and `generate_elevenlabs.py`, using the exact spoken scripts in `audio-source.json`. It uses expressive **Eleven v3**, multiple voices, numbered extracts, and short pauses, then commits five MP3s directly to this repository.

**Current status:** The website currently uses provisional Mac-generated audio. To replace it with actual ElevenLabs audio:

1. Open **Settings > Secrets and variables > Actions** for this repository and create the secret `ELEVENLABS_API_KEY`. Store only the key value, never include it in source files or workflow inputs.
2. Open **Actions > Generate ElevenLabs B2 Audio > Run workflow** and trigger the workflow on `main`.
3. Wait for the workflow run to complete successfully and GitHub Pages to deploy. The final public MP3s will be the ElevenLabs recordings; the site credits ElevenLabs after a successful conversion.

**Important:** The user's supplied key must be rotated because it was shared in chat. Add a new restricted key in GitHub Actions secrets rather than committing the exposed value. The workflow may use ElevenLabs account credits. If the key is missing or insufficient, the job fails without replacing existing audio.

## Result delivery

The teacher email report uses the existing FormSubmit endpoint. Successful email delivery requires correct external configuration; students can download their answer report as CSV and results are autosaved in their browser. It is not a proctored exam or an official Cambridge English qualification.
