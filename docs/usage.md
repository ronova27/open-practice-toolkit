# Prototype Usage

The first executable OpenPractice Toolkit slice is a local-first browser metronome. It is intentionally small enough to inspect and run without installing a framework or sending data to a service.

## Start It

From the repository root:

```bash
python3 -m http.server 4173 --directory app
```

Open <http://127.0.0.1:4173/>. Serving the app over HTTP is important because browser service workers do not run from a `file://` URL.

## Controls

- Starting BPM sets the first tempo; tap tempo estimates a stable value from the latest contiguous taps.
- Ending BPM plus the ramp checkbox creates a smooth tempo change across the finite cycle.
- Beats per bar and beat unit define the displayed meter. Subdivisions add evenly spaced secondary clicks.
- Accentuate each downbeat changes the first beat of every bar without hiding the rest of the beat grid.
- The polyrhythm layer adds an independent pulse, such as three events across two beats.
- Start metronome schedules the finite cycle through Web Audio. Export WAV renders the same event list to a local mono PCM file.
- Press `Space` to tap tempo when focus is not inside a text field.

## Privacy Boundary

The prototype does not record, upload, authenticate, track, or call a paid API. It does not create an account system. Audio output and WAV generation happen in the browser; the exported file is created only after the user asks for it.

The timing engine is deterministic, but real playback depends on the browser, operating system, audio hardware, and device load. It should be treated as a practice aid rather than a precision measurement instrument.
