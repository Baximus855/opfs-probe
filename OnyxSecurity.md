# Security Policy

## About this repository

This repository contains proof-of-concept code replicating and extending published academic research into browser storage timing side-channels (the FROST technique, Weissteiner et al., Graz University of Technology, presented at DIMVA 2026). The original research targeted desktop browsers. This repository documents an independent replication and extension, testing mobile Brave and Chrome on Android.

**This is not a novel vulnerability disclosure.** The underlying technique is published, peer-reviewed academic research. What's published here is independent replication, methodology, and raw test data, offered for transparency and reproducibility.

## Scope

This policy covers:

- Bugs or errors in the test harness code itself (the JavaScript workers, HTML test pages, or server scripts in this repo)
- Inaccuracies in the documented methodology or results

This policy does **not** cover:

- The underlying browser storage timing side-channel itself. That is the subject of the original published research. Any coordinated disclosure with browser vendors regarding the side-channel is handled separately and is not the function of this repository.

## Reporting an issue

If you find a bug, inaccuracy, or reproducibility problem in this repository's code or documented methodology, please open a GitHub issue, or contact:

- X: [@BaximusCyber85](https://x.com/BaximusCyber85)
- Email: onyxdigitalintelligence85@protonmail.com

## Responsible use

This code is published for research, education, and reproducibility. It is not intended to fingerprint or track users without their knowledge or consent. If you build on this work, please cite the original Weissteiner et al. paper and this repository.

## Methodology standard

Findings in this repository follow a tiered evidence standard: results are reported with their reproduction status made explicit (single run, partial replication, or confirmed across multiple runs/devices/browsers). Known limitations and open questions are documented in `docs/FINDINGS.md` rather than omitted.
