# Metronome Engine Workstream

Branch: `workstream/metronome-engine`

## Purpose

Plan the timing core for an advanced metronome that can support BPM, tap tempo, time signatures, subdivisions, accents, tempo ramps, polyrhythms, visual pulse, and click-track export.

## Scope

- Document Web Audio API scheduling assumptions.
- Define a simple BPM, subdivision, and accent model.
- Identify timing accuracy risks and browser constraints.
- Plan WAV click-track export without requiring a backend.

## Guardrails

- Do not promise perfect timing on every device.
- Do not add paid infrastructure, secrets, deployments, or analytics.
- Keep any prototype small and testable.
