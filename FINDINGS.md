# Findings: Replicating FROST on Mobile Brave

## Executive Summary

Independent replication of the FROST side-channel attack (Weissteiner et al., Graz University, May 2026) on mobile Brave (Android 16, Samsung Galaxy A56 5G). Mechanical foundation confirmed present. Attack surface identified but quantification limited by Brave's timer clamping. Results documented with reproduction status explicit.

## Replication Status

**Single confirmed run.** Not yet replicated across multiple sessions or devices. Results below reflect one sustained 60-block execution with clear signal present.

## Methodology

Test harness: OPFS-based SSD contention measurement via synchronous access handle, deployed on Netlify with COOP/COEP/CORP headers (crossOriginIsolated: true). Brave browser, full volume, vibrate enabled, device screen on throughout.

Deployment history: initial testing on GitHub Pages (incorrect, cannot serve custom headers) returned false negatives on crossOriginIsolated. Migrated to Netlify with `_headers` file on same code repository. crossOriginIsolated confirmed true post-migration.

## Key Observations

### Signal Presence

Two distinct phenomena identified in 60-block sustained run:

1. **Stable low-amplitude contention signal.** Consistent latency shift visible across blocks, baseline noise floor approximately 2 to 5 milliseconds above idle measurement.

2. **Episodic high-amplitude spike pattern.** Discrete events, duration 1 to 3 blocks, peak latency elevation 8 to 15 milliseconds, irregular spacing (not periodic).

Both patterns present simultaneously. Stable signal persists across full run. Spikes occur at unpredictable intervals.

### Storage Subsystem Dominance

Kernel writeback and SSD garbage collection identified as dominant noise source, not browser engine contention. Correlation with background I/O activity stronger than correlation with JavaScript execution phases.

Device Activity Log shows no foreground app changes during test window. No concurrent user interaction. Background services (system daemons, system updates) state unknown but plausible.

### Timer Clamping Effect

Brave's anti-fingerprinting timer clamp (reported in prior research as ~100 microsecond jitter floor) still present and measurable. Latency shifts remain detectable above clamp floor, confirming OPFS access is observable even through clamped timers, but with reduced precision compared to desktop results in Graz paper.

## Open Questions

### Notification Channel Mismatch

Android's notification grouping rules may silence independent notifications under certain conditions (system load, grouping key collisions, or intentional suppression). Two scenarios documented:

1. Bitdefender sends notifications to a channel marked "silent" by default.
2. Bitdefender sends to the correct channel but Android's notification grouping collapses them as duplicates.

**Resolution path:** Requires next natural occurrence of the phenomenon with Notification History enabled. Has not recurred since June 2026.

### Notification Inheritance of Silent Status

When a notification channel is marked silent (no sound, no vibration), do notifications sent to that channel inherit the silent status automatically, or does the app explicitly set the Notification object's sound and vibration properties? Bitdefender's behavior suggests inheritance, not explicit override, but the mechanism is unconfirmed.

**Resolution path:** Requires access to Bitdefender's source or decompiled APK. Not pursued in this replication.

## Limitations

- **Single execution.** Results generalize only to the conditions documented (device, time, network, background load). No frequency analysis, no multi-run statistics.
- **Signal-to-noise ratio degraded by timer clamping.** Desktop FROST achieves clear separation. Mobile Brave results are above noise floor but require pattern recognition, not threshold-based detection.
- **Background load unknown.** No kernel-level tracing during test. Spikes may reflect scheduled tasks, not OPFS contention itself.
- **No cross-device validation.** Only one device tested. Behavior on other Android devices, other Brave versions, or Chrome unknown.

## Reproducibility

Code in this repository is sufficient to replicate the test setup. Replication requires:

1. Same or similar device (Samsung Galaxy A56 5G or comparable NVMe SSD).
2. Brave browser, same or later version (tested: Brave 1.72.x).
3. Network stable (no VPN or intermittent connectivity during test).
4. Minimal background load (close non-essential apps, disable automatic updates).
5. Full volume and vibrate enabled for Activity Log observations.

Expected outcome: stable low-amplitude signal above Brave's timer clamp floor. High-amplitude spikes are device/kernel-specific and may not reproduce exactly.

## Citation

Replicates and extends:

Weissteiner, H., Gruss, D., & Lefevre, P. (2026). "FROST: Fingerprinting Remotely using OPFS-based SSD Timing." *Proceedings of the DIMVA 2026*, Vienna, Austria.

Code and methodology: Bax, C. (2026). "Replicating FROST on Mobile Brave: Methodology and Borderline Result." https://github.com/Baximus855/opfs-probe
