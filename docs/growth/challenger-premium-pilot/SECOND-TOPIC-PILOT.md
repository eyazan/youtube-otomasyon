# Second-topic pilot: candidates and recommendation (2026-10-14)

**Proposal only.**
- Nothing rendered; no assets downloaded beyond the source checks named below.
- Facts quoted here are from the primary texts checked. Every claim still goes through the evidence schema (verbatim passage, status) before any shot.

## 1. Candidates

| | **Apollo 13 oxygen tank (1970)** | **Columbia (STS-107, 2003)** | **Hyatt Regency walkways (1981)** |
|---|---|---|---|
| Primary source | *Report of Apollo 13 Review Board* (NASA TM X-65270, 15 June 1970); full text at NSSDC (checked) | *Columbia Accident Investigation Board Report*, Vol. I (August 2003; NASA NTRS 20030093634, checked) | NBS Building Science Series 143, *Investigation of the Kansas City Hyatt Regency Walkways Collapse* (May 1982; NIST, checked) |
| Licence of primary material | US Government work (NASA), public domain | US Government work, public domain | US Government work (NBS), public domain; check per figure |
| Visual assets | NASA photos of the damaged service module (e.g. AS13-59-8500, AS13-58-8458 on Commons, NASA PD); mission control and crew photos; tank and heater diagrams in the report | NASA ET-208 ascent camera footage (Commons); board test-impact footage (Commons; NASA/SwRI, licence to confirm); CAIB figures | NBS report figures and photos (some on Commons as "Kansas City Hyatt Regency Walkways Collapse" files); **news photos are typically copyrighted and are excluded** |
| Mechanical cause and effect | **Very clear chain, all in the board's words.** Thermostatic switches "rated as satisfactory for the 28 V dc spacecraft power supply, could not open properly at 65 V dc"; during detanking the heater tube "may have reached as much as 1000 F", damaging the "Teflon insulation on the fan motor wires"; in flight the fans were switched on, and at 55:54:53.555 telemetry was lost as "oxygen tank no. 2 lost pressure" | Clear: a foam strike during ascent breached the left wing leading edge (RCC panel 8); hot gas entered during entry | Very clear and highly visual: a change from one continuous hanger rod to two offset rods doubled the load on the 4th-floor box-beam connection (to be extracted from BSS 143) |
| Templates reused | `archival-plate`, `trace-over-photo` (damaged bay on the photo), `document-desk` (switch rating, detanking record), `event-sequence` (mission-time event table), `timeline`, `payoff` | `archival-plate` (ascent film with a documented time base), `trace-over-photo`, `event-sequence` (sensor timeline), `document-desk` (CAIB e-mails and briefing charts), `payoff` | `document-desk` (the drawing change), `trace-over-photo` (report photos), `archival-plate`, `payoff` |
| New template needed | **component-section** (tank cutaway: heater tube, thermostat, fan wiring, insulation), built on the `JointSection` materials and light | leading-edge section (RCC panel and spar), the same family | **load-path connection** (rod, nut, box beam, with force arrows and doubling); the most different from existing templates |
| Sensitivity | Crew survived; lower loss-of-life sensitivity | Seven crew lost; the second shuttle-loss film in a row on the channel | 114 deaths reported (to verify in BSS 143); high sensitivity |

## 2. Ranking (1 = weak, 5 = strong; "human effort" 5 = least effort)

| Criterion | Apollo 13 | Columbia | Hyatt Regency |
|---|---|---|---|
| Audience hook potential | 5: "the explosion was set up weeks before launch, by a voltage" | 5 | 4 |
| Source quality | 5: one primary report with an exact event table and findings | 5 | 5 |
| Available, reusable visuals | 5: NASA PD photos of the actual damage | 4: film is good; some test footage needs licence checks | 3: limited to report figures; news photos excluded |
| Template reuse | 4: 6 of 7 shot types exist; one new section template | 5: highest reuse | 3: needs the most different new template |
| Expected human effort | 4 | 4 | 3 |
| **Total** | **23** | **23** | **18** |

Apollo 13 and Columbia tie on points. **Apollo 13 is recommended** for three reasons:
- **Different engine test:** a second shuttle-loss film immediately after Challenger would make the channel repetitive. It would also test the engine on almost the same material: same vehicle family, same templates.
- **Wider coverage:** Apollo 13 exercises the document-led and event-table path on a new vehicle, and needs one new mechanism template that is generic (a component cutaway).
- **Lower sensitivity:** the crew survived.

## 3. Recommended pilot: Apollo 13 oxygen tank (not rendered)

| Shot | Template | Evidence and asset |
|---|---|---|
| Hook: the damaged service module, the missing panel ringed | `archival-plate` + mark | NASA AS13-59-8500; board description of the panel |
| Where: tank no. 2 in bay 4, traced on the photo | `trace-over-photo` | photo anchors (manual) |
| Why: the 28 V switch on a 65 V ground supply | `document-desk` | board text on the switches; the report's tank and heater figures |
| Mechanism: heater on, switch welded, tube about 1000 °F, insulation damaged | **`component-section`** (new) | board text; temperatures as claims; any scale declared |
| Flight: fans on at 55:53:20, data loss at 55:54:53.555 | `event-sequence` (generalised to a mission-elapsed-time clock) | board event table |
| Human beat: crew portrait | `archival-plate` | NASA portrait |
| Payoff | `payoff` | editorial claim (labelled) |

**Effort estimate:**

| Item | Work | Estimate |
|---|---|---|
| Development | `component-section` template (shares `JointSection` materials, light and labels) | 4–6 days |
| Development | `event-sequence` generalised from the shuttle stack to a mission-time panel (template variant; no topic hacks) | 1–2 days |
| Per video (human) | claims and passages from the board report | 3–4 h |
| Per video (human) | assets, licences, anchors | about 2 h |
| Per video (human) | shot-plan JSON (hand-authored; the planner does not exist yet) | 4–6 h |
| Per video (human) | review | 1–2 h |
| **Pilot total** | | **about 1.5 weeks** (development plus about 1.5 days of human work) |

**Gates before any render:**
1. The owner approves the topic.
2. Validator VALID.
3. Storyboard stills reviewed.
4. Narration voice approval. It is still unapproved, and that stays a production blocker.
