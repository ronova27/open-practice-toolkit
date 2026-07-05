# Codex Workstreams

Each workstream branch should stay narrow and produce small, reviewable changes. Agents should avoid deployments, billing setup, secrets, unrelated modules, and broad rewrites.

## Branches

| Branch | Purpose |
| --- | --- |
| `workstream/product-foundation` | README, roadmap, product vision, user stories, contribution framing. |
| `workstream/metronome-engine` | Timing architecture, Web Audio API notes, BPM/subdivision model, accuracy concerns. |
| `workstream/notation-prehear` | Notation/playback approach, MIDI/MusicXML export research, VexFlow/OpenSheetMusicDisplay comparison. |
| `workstream/practice-feedback` | Recording, timing comparison, latency compensation, visual feedback model. |
| `workstream/audio-to-notes` | Monophonic audio transcription prototype plan, pitch/onset detection, export pipeline. |
| `workstream/video-to-rhythm` | Experimental video motion/hit detection plan, MediaPipe/OpenCV options, privacy/local-first constraints. |
| `workstream/web-pwa-shell` | Frontend app shell proposal, offline-first/PWA architecture, accessibility baseline. |
| `workstream/docs-and-governance` | Contribution guide, issue templates, security policy, code of conduct, maintainer workflow. |

## Shared Agent Rules

- Work only on the assigned branch.
- Avoid touching unrelated modules.
- Keep commits or patch sets small.
- Prefer tests, examples, or verification notes over broad claims.
- Stop before destructive actions, billing, paid services, deployments, or public submissions.
- Do not add secrets or private personal data.
- Keep core practice features usable without paid APIs.
