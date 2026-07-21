# Roadmap

OpenPractice Toolkit is starting with a documentation-first bootstrap so the project can grow in small, reviewable branches.

The first executable slice now exists in `app/`: a local-first metronome shell with a deterministic timing model, browser playback, visual pulse, and WAV export. The remaining roadmap stays intentionally open rather than treating this prototype as a finished workstation.

## Phase 0: Foundation

- Establish README, license, contribution guide, security policy, and issue templates.
- Document product vision and architecture boundaries.
- Create branch-based workstreams for early Codex-assisted exploration.
- Keep the repository clean and free of secrets, paid services, and deployment assumptions.

## Phase 1: Web/PWA Shell

- [x] Choose a dependency-free browser shell.
- [x] Define a cache-first service worker boundary for the static prototype.
- [x] Add an accessibility baseline for labels, keyboard tap tempo, contrast, and reduced motion.
- [x] Create a useful first app surface with no paid backends.
- [ ] Add local project/session storage after the data boundary is reviewed.

## Phase 2: Timing Core

- [x] Prototype a deterministic metronome timing model.
- [x] Schedule one-shot click events with the Web Audio API.
- [x] Add BPM, tap tempo, subdivisions, accents, tempo ramps, polyrhythms, and visual pulse.
- [x] Export mono PCM WAV click tracks locally.
- [ ] Compare long-running scheduler strategies on representative browsers and devices.
- [ ] Add calibration and transport-loop behavior after the first shell is reviewed.

## Phase 3: Notation Prehearing

- Prototype simple note input and playback.
- Evaluate VexFlow and OpenSheetMusicDisplay.
- Add looped playback and slow practice modes.
- Export MIDI and MusicXML.

## Phase 4: Practice Feedback

- Record playing, clapping, or tapping.
- Compare detected timing against a metronome or target pattern.
- Show early/late feedback and basic latency compensation.

## Phase 5: Audio-To-Notes

- Start with monophonic pitch and onset detection.
- Export approximate MIDI.
- Provide a manual correction workflow.
- Avoid claims of perfect transcription.

## Phase 6: Video-To-Rhythm

- Research local-first motion and hit detection.
- Compare MediaPipe and OpenCV-style approaches.
- Align detected motion with audio where practical.
- Keep this module explicitly experimental.
