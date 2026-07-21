# OpenPractice Toolkit

A free, open-source, local-first music practice toolkit for metronome work, notation prehearing, rhythm training, audio transcription, and beginner-friendly self-practice.

## Status

OpenPractice Toolkit is still in its founding phase, but the repository now includes a first usable browser vertical slice: a dependency-free advanced metronome prototype under [`app/`](app/). It is not a finished product yet; notation, recording feedback, transcription, and video research remain separate workstreams.

## What This Project Is

OpenPractice Toolkit is intended to become a web-first practice companion for students, pianists, percussionists, teachers, and self-learners who need useful practice tools without subscription barriers.

The project should be useful before it is fancy. Initial work will focus on clear timing tools, simple notation playback, practical feedback, open export formats, and privacy-respecting local processing where feasible.

## Run The Prototype

Serve the `app/` directory over HTTP so the Web Audio and service-worker boundaries behave like they will on a hosted static site:

```bash
python3 -m http.server 4173 --directory app
```

Then open <http://127.0.0.1:4173/>. The current metronome supports BPM, tap tempo, time signatures, subdivisions, downbeat accents, tempo ramps, a 3:2-style polyrhythm layer, visual pulse feedback, and local WAV click-track export.

The dependency-free verification lane is:

```bash
npm run check
npm test
```

See [docs/usage.md](docs/usage.md) for the interaction and privacy boundaries of this first slice.

## Why Open Source Matters

Music practice tools are often fragmented, locked behind subscriptions, or opaque about how recordings and analysis are handled. An open-source toolkit can make the basics accessible, inspectable, teachable, and adaptable for classrooms, studios, and independent learners.

## Initial MVP Modules

1. Advanced metronome
   - BPM and tap tempo
   - Time signatures and subdivisions
   - Accents, tempo ramps, polyrhythms, and visual pulse
   - Click-track export

2. Notation prehearing
   - Simple note input
   - Playback of notes and chords before practice
   - Measure loops and slow playback
   - MIDI and MusicXML export

3. Practice feedback
   - Record playing, clapping, or tapping
   - Compare timing against a target or metronome
   - Show early/late timing with simple feedback

4. Audio-to-notes
   - Monophonic transcription first
   - Pitch, onset, and rhythm detection
   - Approximate MIDI export
   - Manual correction workflow

5. Video-to-rhythm
   - Experimental local-first research track
   - Detect visible hit or motion timing
   - Support percussion, taiko, clapping, and piano rhythm analysis where practical
   - Align with audio where possible

## Local-First And Privacy Goals

The project should process audio, video, and practice data locally whenever feasible. Any optional cloud or AI-assisted workflow must be clearly marked, avoid becoming required for core practice, and avoid uploading recordings without explicit user intent.

## Planned Export Formats

- MIDI for notes, timing, and practice material
- MusicXML for notation exchange
- WAV click tracks for practice and teaching
- Plain structured data formats where useful for debugging and research

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the founding roadmap and workstream sequence.

## Contributing

This repository is open to early discussion, issue refinement, documentation, research notes, and small prototype proposals. See [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

MIT. See [LICENSE](LICENSE).
