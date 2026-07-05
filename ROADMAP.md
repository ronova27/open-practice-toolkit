# Roadmap

OpenPractice Toolkit is starting with a documentation-first bootstrap so the project can grow in small, reviewable branches.

## Phase 0: Foundation

- Establish README, license, contribution guide, security policy, and issue templates.
- Document product vision and architecture boundaries.
- Create branch-based workstreams for early Codex-assisted exploration.
- Keep the repository clean and free of secrets, paid services, and deployment assumptions.

## Phase 1: Web/PWA Shell

- Choose a minimal web stack.
- Define offline-first storage and service worker expectations.
- Add accessibility baseline for keyboard, screen reader, contrast, and reduced-motion behavior.
- Create a placeholder app shell with no paid backends.

## Phase 2: Timing Core

- Prototype the metronome timing model.
- Compare scheduling approaches using Web Audio API.
- Add BPM, tap tempo, subdivisions, accents, tempo ramps, and visual pulse.
- Export WAV click tracks.

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
