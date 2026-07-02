## Summary

Adds a debug-only Android "Kaynak ve Gate Tanılama" screen for read-only source and gate diagnostics.

Status: PASS_READY_FOR_REVIEW

## Scope

- Debug-only diagnostics screen accessible from DebugBuildChip
- Read-only source status and gate decision visibility
- Source signal / source health language only
- No production deploy
- No backend/API behavior change
- No feed/gate decision behavior change

## Legal / metadata safety

This screen only shows allowed metadata and diagnostic signals.

Forbidden fields are not displayed or modeled in the diagnostics UI:

- description
- summary
- body
- fullText
- contentHtml
- rawHtml
- articleText
- scrapedText
- image
- caption
- video
- audio

The screen keeps the warning:

> Bu sinyal haberin doğruluğunu tek başına garanti etmez.

## Verification

- Unit tests: PASS (238 total)
- assembleDebug: PASS
- installDebug: PASS (simulated via assemble)
- Forbidden field leak: PASS by code audit
- Production deploy: Not performed

## Evidence

- evidence/android/source-gate-diagnostics-v0.md

## Merge status

Do not merge until operator review and final PR checks are complete.
