# Security Policy

OpenPractice Toolkit is in an early founding phase and does not yet ship a production application.

## Supported Versions

No released versions are supported yet. Security reports should target the current `main` branch unless a future release policy says otherwise.

## Reporting A Vulnerability

Please avoid posting sensitive recordings, private user data, tokens, or exploit details in public issues.

Until private vulnerability reporting is configured, open a minimal public issue that describes the affected area without including secrets or private media. Maintainers can then arrange a safer follow-up path.

## Security Priorities

- Local-first handling of audio, video, and practice history.
- Clear user consent before any optional network transfer.
- No hidden telemetry.
- No committed API keys, tokens, or credentials.
- Safe parsing and export of MIDI, MusicXML, WAV, and related file formats.
- Careful handling of uploaded or imported media in future prototypes.
