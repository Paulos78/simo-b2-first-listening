# Simo's B2 First Listening Practice

Original, independent **Cambridge B2 First-style Listening** practice paper for Simone. This is **not** an official Cambridge English paper.

**Student site:** https://paulos78.github.io/simo-b2-first-listening/

**Source:** https://github.com/Paulos78/simo-b2-first-listening

## Paper structure

- **Part 1:** Eight short recordings, A/B/C multiple choice (8 marks)
- **Part 2:** Extended talk, sentence completion (10 marks)
- **Part 3:** Five speakers, multiple matching, eight statements (5 marks)
- **Part 4:** Extended interview, A/B/C multiple choice (7 marks)
- 30 questions and marks in total. Listening audio is played twice in each track. 45-minute timer.

## Results

The site automatically marks and explains answers. Browser-local progress is stored while an attempt is underway. On submission the learner can download their full CSV results or copy/print a report. With explicit student consent, the site submits a detailed teacher report to the existing FormSubmit endpoint used in the previous B2 mock. Teacher email delivery depends on FormSubmit activation and the service being available; the CSV is a reliable manual backup. There is no server-side database, anti-cheating protection or durable classroom results archive in this static site. These are practice scores, not Cambridge English Scale scores.

## Audio

Four original MP3s under `audio/`. Created using macOS offline speech voices because an ElevenLabs API key was not available. Each paper part is provided in a single audio track, with every extract or interview repeated. To regenerate audio on the author's Mac, use `generate_b2_audio.py` and `content-b2.json` (not required to run the student website).

## Privacy

No API keys appear in the site. A student's name, any entered email address and their answers may be submitted through FormSubmit only if they provide consent. They should not share the CSV publicly.
