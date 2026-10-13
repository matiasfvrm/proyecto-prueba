# Licensing

## Permissive vs. copyleft

**Permissive licenses** (MIT, Apache-2.0, BSD) let anyone use, modify and redistribute the code — including inside closed-source products — as long as the copyright notice is kept. They maximise adoption and are simple for companies to accept. The trade-off: improvements made by others can stay private.

**Copyleft licenses** (GPL, AGPL, MPL) also allow use and modification, but require that distributed modified versions stay under the same license, so improvements remain open. Strength varies:

- **MPL-2.0** — file-level copyleft. Modified files stay open; the rest of a combined product can be closed.
- **GPL-3.0** — whole-program copyleft when *distributed*. Running a modified version as a website is not distribution, so a hosted fork can stay closed.
- **AGPL-3.0** — GPL plus §13: if you let users interact with a modified version **over a network**, you must offer them its source.

## Choice for UNsolved

**Code: AGPL-3.0-or-later.** UNsolved is a web application whose value comes from shared, open infrastructure for knowledge. Under a permissive or plain GPL license, someone could run an improved closed fork as a hosted service, splitting the community and its knowledge graph. AGPL keeps every hosted improvement available to everyone, while still allowing anyone — including organisations and companies — to run, study, modify and self-host the platform.

Implications for operators: if you run a modified instance, link users to your source (the footer's GitHub link is driven by `NEXT_PUBLIC_REPO_URL`).

Trade-off acknowledged: some organisations avoid AGPL. If that becomes a real barrier to the mission, maintainers may consider relicensing specific reusable libraries (for example the graph layout or domain model) under a permissive license.

**Content: CC BY 4.0.** Problem descriptions, reviews and documentation written by contributors should be reusable anywhere — including in papers, teaching material and other platforms — with attribution. A share-alike content license was considered and rejected because it complicates reuse in academic publishing.

**Data and sources.** Links to third-party sources do not change those sources' licenses. Datasets contributed to tasks keep the license stated by their authors; tasks require that license to be recorded.
