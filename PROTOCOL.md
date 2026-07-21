# Protocol

## 2026-07-21 Authorized publish attempt

- Committed the reviewed executable slice as `a29eb1a` and pushed `codex/continue-openpractice` to the public OpenPractice repository; the branch now tracks `origin/codex/continue-openpractice`.
- Prepared the corresponding Ronova source commit locally as `f873c2c`, but the existing `portfolio/v0.6.3` release train keeps all authoritative tags on the previous commit and its predeploy version contract rejected the follow-up commit.
- Preserved the user-provided Ronova instruction/archive files and the metadata-only release registry; no tag rewrite, invented version, or Pages deployment was performed.

## 2026-07-21 First executable metronome slice

- Restored the exact project identified from the Ronova source and public page: `https://github.com/ronova27/open-practice-toolkit`, then continued it on a dedicated local branch from `main`.
- Added a dependency-free browser/PWA shell under `app/` with accessible tempo, meter, subdivision, accent, tempo-ramp, polyrhythm, tap-tempo, visual-pulse, and local WAV-export controls.
- Added a pure deterministic timing compiler and PCM16 WAV renderer, plus six Node built-in tests covering normalization, grid timing, ramps, polyrhythm, tap tempo, and the RIFF contract.
- Added usage and architecture notes, updated the roadmap to distinguish completed prototype behavior from the remaining long-running transport and future notation/feedback/transcription workstreams, and bumped the service-worker cache key to `openpractice-shell-v2` after browser QA caught stale asset risk.
- Verification evidence: `npm run check`, `npm test` (6/6), a local Python HTTP server, WebKit browser interaction at desktop and mobile widths, no horizontal overflow at 1440px and 390px, no browser console errors, successful start/stop and tap-tempo behavior, and a downloaded `openpractice-96bpm-4x4.wav` artifact.
- No backend, secret, paid service, analytics, account system, Ronova ID integration, deployment, or public submission was added.

## 2026-07-05 Bootstrap

- Created the founding OpenPractice Toolkit repository structure.
- Added documentation, governance files, issue templates, pull request template, architecture notes, product vision, branch plan, Codex workstream notes, and OpenAI open-source application draft notes.
- Prepared branch-specific Codex prompts under `docs/codex-prompts/`.
- No application code, paid infrastructure, secrets, deployment, or form submission was added.
- Verified the local workstream branches and branch notes.
- Queued separate Codex workstream thread setups from the eight local workstream branches.
- Inspected the visible GitHub repository and OpenAI Codex for Open Source form fields in Safari.
- Created and published the public GitHub repository at `https://github.com/ronova27/open-practice-toolkit`.
- Published `main` and the eight `workstream/*` branches to the public repository.
- Filled the OpenAI Codex for Open Source form for human review, including repository qualification, Codex Security justification, API credits usage, and optional notes.
- Verified the form textareas via Safari JavaScript automation; the form was not submitted.
- Temporarily enabled Safari JavaScript from Apple Events for verification and restored it to off.
