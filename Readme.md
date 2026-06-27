# FROST cross-origin isolation harness

Tests the one variable the last run didn't have: a page actually served
with COOP/COEP headers, so crossOriginIsolated is true instead of false.

## Files

- serve_coi.py    local server, adds the COOP/COEP/CORP headers
- harness.html    the test page (environment probe + contention test)
- measure-worker.js   worker that does the timed reads
- load-worker.js  worker(s) that generate real background disk contention

## Running it on the phone (Termux)

1. Copy this folder onto the device, into Termux's storage, e.g.:
   ~/frost_coi/

2. In Termux:
   cd ~/frost_coi
   python3 serve_coi.py

   You should see:
   Serving with COOP/COEP on http://127.0.0.1:8000/harness.html

3. Open mobile Brave on the SAME device and go to:
   http://127.0.0.1:8000/harness.html

   (127.0.0.1 / localhost count as a secure context even over plain
   http, so this works without setting up TLS.)

4. The page immediately logs the environment, including
   crossOriginIsolated. If that line reads false, stop here, something
   is wrong with how the page is being served or loaded (e.g. opened
   via file:// instead of through the server), fix that before running
   the contention test, the result will be meaningless otherwise.

5. If crossOriginIsolated is true, hit "Start test". It mirrors the
   prior run's structure: 16 blocks, 250 reads each, alternating
   idle/load, same units (microseconds), same stats (median, mean,
   p90, p99, delta), so the two runs are directly comparable.

6. "Copy results" puts the full log on the clipboard for pasting
   straight into a post or a note.

## What would actually count as a real finding here

- crossOriginIsolated: true, and the performance.now() resolution step
  comes back well under 100us. That alone tells you whether Brave's
  isolation path unclamps the timer on mobile or re-clamps it anyway
  for fingerprinting reasons.
- If the timer does unclamp, watch whether the median (not just the
  mean) actually separates between idle and load this time. Last run's
  median delta was +0.0us, only the tail moved. A real result here
  means the center of the distribution shifts, not just p90/p99.
- If crossOriginIsolated is true but the medians still don't separate,
  that's still a finding, it would mean Brave's mobile timer clamping
  survives isolation, which is itself worth a line in the post, just
  not the "shield drops" line.
