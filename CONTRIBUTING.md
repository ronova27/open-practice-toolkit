# Contributing

OpenPractice Toolkit is in its founding phase. Contributions are welcome, but the project is intentionally starting with small, reviewable changes.

## Good Early Contributions

- Clarify user stories for students, teachers, pianists, percussionists, and self-learners.
- Improve architecture notes and product scope.
- Add small, tested prototypes behind clear module boundaries.
- Research export formats such as MIDI, MusicXML, and WAV click tracks.
- Improve accessibility, documentation, and beginner-friendly language.

## Contribution Principles

- Keep changes small and focused.
- Do not add paid infrastructure, hosted services, API keys, or billing dependencies.
- Do not overpromise AI transcription quality.
- Prefer local-first processing where feasible.
- Treat recordings, practice history, and imported files as private user data.
- Include tests or a practical verification note when changing behavior.

## Pull Request Checklist

- The change has a clear purpose.
- The change only touches the relevant module or docs.
- Privacy and local-first implications were considered.
- Export behavior, file handling, or audio/video processing is documented when changed.
- Tests or manual verification steps are included.

## Development Setup

There is no application scaffold yet. Until one exists, documentation and planning changes should be plain Markdown and should not require a build step.
