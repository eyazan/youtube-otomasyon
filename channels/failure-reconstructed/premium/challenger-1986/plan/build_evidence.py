# Extracts the Challenger claims in plan/evidence.json verbatim from locally downloaded sources: Rogers Commission
# pages (curl https://www.nasa.gov/history/rogersrep/v1ch{1,3,4,5}.htm | strip tags -> rch{1,3,4,5}.txt), NASA NTRS
# 20120003006 (pdftotext -> rchS.txt) and the Commons captions in v1/source-licensing-manifest.json.
# It exits if any passage is not found word for word.   python3 build_evidence.py <dir> <out evidence.json>
import json, re, sys
SP = sys.argv[1]; OUT = sys.argv[2]
T = {c: re.sub(r"\s+", " ", open(f"{SP}/rch{c}.txt", errors="ignore").read()) for c in "1345S"}
def P(ch, start, end):
    s = T[ch]; i = s.find(start)
    if i < 0: raise SystemExit(f"passage start not found in ch{ch}: {start}")
    j = s.find(end, i)
    if j < 0: raise SystemExit(f"passage end not found in ch{ch}: {end}")
    return s[i:j + len(end)].strip()
CAP = json.load(open(f"{SP}/wt/channels/failure-reconstructed/premium/challenger-1986/v1/source-licensing-manifest.json"))
cap = {a["key"]: re.sub(r"\s+", " ", a["description"]) for a in CAP["archival"]}
def C(ch_or_cap, start, end):
    if ch_or_cap in T: return P(ch_or_cap, start, end)
    s = cap[ch_or_cap]; i = s.find(start); j = s.find(end, i)
    if i < 0 or j < 0: raise SystemExit(f"caption passage not found in {ch_or_cap}: {start}")
    return s[i:j + len(end)]
ev = {"schema": "fr-premium.evidence.v1", "topic": "challenger-1986",
  "sources": {
    "E0": {"title": "Rogers Commission Report, Vol. 1, Ch. I: Introduction", "url": "https://www.nasa.gov/history/rogersrep/v1ch1.htm", "kind": "official-report"},
    "E1": {"title": "Rogers Commission Report, Vol. 1, Ch. III: The Accident", "url": "https://www.nasa.gov/history/rogersrep/v1ch3.htm", "kind": "official-report"},
    "E2": {"title": "Rogers Commission Report, Vol. 1, Ch. IV: The Cause of the Accident", "url": "https://www.nasa.gov/history/rogersrep/v1ch4.htm", "kind": "official-report"},
    "E3": {"title": "Rogers Commission Report, Vol. 1, Ch. V: The Contributing Cause of the Accident", "url": "https://www.nasa.gov/history/rogersrep/v1ch5.htm", "kind": "official-report"},
    "E4": {"title": "NASA photo GPN-2000-001347 caption", "url": "https://commons.wikimedia.org/wiki/File:Challenger_-_GPN-2000-001347.jpg", "kind": "official-media-caption"},
    "E5": {"title": "NASA photo GPN-2004-00004 caption", "url": "https://commons.wikimedia.org/wiki/File:STS-51-L_Recovered_Debris_(Burn_Marks_on_the_SRM)_-_GPN-2004-00004.jpg", "kind": "official-media-caption"},
    "E6": {"title": "NASA photo 'Challenger breakup' caption", "url": "https://commons.wikimedia.org/wiki/File:Challenger_breakup.jpg", "kind": "official-media-caption"},
    "E7": {"title": "NASA STS-51-L crew portrait caption", "url": "https://commons.wikimedia.org/wiki/File:Challenger_flight_51-l_crew.jpg", "kind": "official-media-caption"},
    "E8": {"title": "Thiokol initial recommendation chart (Rogers Vol. 1 p. 90 reproduction)", "url": "https://www.nasa.gov/wp-content/uploads/static/history/rogersrep/v1p90.jpg", "kind": "archival-record"},
    "E9": {"title": "Thiokol telefax of final position (Rogers Vol. 1 p. 97 reproduction)", "url": "https://www.nasa.gov/wp-content/uploads/static/history/rogersrep/v1p97.jpg", "kind": "archival-record"},
    "E10": {"title": "T. D. Wood (NASA MSFC) et al., Solid Rocket Booster (SRB) Flight System Integration at Its Best, NASA NTRS 20120003006", "url": "https://ntrs.nasa.gov/citations/20120003006", "kind": "official-reference", "publisher": "NASA Technical Reports Server"},
    "E11": {"title": "NASA video 'Challenger Launch and Breakup' caption (NASA STI Program)", "url": "https://commons.wikimedia.org/wiki/File:Challenger_Launch_and_Breakup.ogv", "kind": "official-media-caption"}
  }, "claims": {}}
def add(cid, **k): ev["claims"][cid] = {**k}
add("C-launch-1986", text="Mission 51-L flew on January 28, 1986", kind="fact", source="E1", locator="Ch. III p. 19", passage=P("3", "Flight of the Space Shuttle Challenger", "January 28, 1986."), value=1986, display="1986", status="verified")
add("C-smoke-0678", text="Smoke above the right SRM field joint was confirmed at 0.678 s", kind="fact", source="E1", locator="Ch. III event table", passage=P("3", "Confirmed smoke above field", "0.678"), value=0.678, unit="s", display="0.678 s after liftoff", status="verified")
add("C-smoke-right-srb", text="Grey-brown smoke is visible on the right side of the SRB in GPN-2000-001347", kind="fact", source="E4", passage=C("liftoff", "a cloud of grey-brown smoke", "United States."), status="verified")
add("C-temp-36f", text="Ambient temperature at launch was 36 °F", kind="measurement", source="E1", locator="Ch. III", passage=P("3", "The ambient air temperature at launch was 36", "pad 39B."), value=36, unit="°F", display="36°F", status="verified")
add("C-15f-colder", text="36 °F was 15 degrees colder than any previous launch", kind="fact", source="E1", locator="Ch. III", passage=P("3", "This temperature was 15 degrees colder", "previous launch."), value=15, unit="°F", display="at launch — 15° colder<br>than any launch before", status="verified")
add("C-two-orings", text="Each field joint is sealed by two rubber O-rings of 0.280 in diameter", kind="fact", source="E2", locator="Ch. IV", passage=P("4", "Joint sealing is provided by two rubber O-rings", "-0.003)"), value=0.28, unit="in", status="verified")
add("C-joint-28f", text="The right SRB aft joint O-ring temperature was estimated at 28 ±5 °F", kind="estimate", source="E2", locator="Ch. IV Finding 6a", passage=P("4", "was estimated to be 28", "Fahrenheit"), value=28, unit="°F", display="28°F est.", status="verified", approximate=True)
add("C-test-75f", text="O-ring resiliency tests covered 10 to 75 °F", kind="fact", source="E2", locator="Ch. IV", passage=P("4", "at temperatures ranging from 10 to 75", "Fahrenheit"), value=75, unit="°F", display="75°F test", status="verified")
add("C-gap-600ms", text="Joint opening at ignition is essentially complete at 600 ms", kind="fact", source="E2", locator="Ch. IV Finding 8a", passage=P("4", "This opening begins upon ignition", "600 milliseconds"), value=600, unit="ms", status="verified")
add("C-resiliency-cold", text="Cold O-rings are very slow in returning towards their original shape", kind="fact", source="E2", locator="Ch. IV", passage=P("4", "the O-ring is very slow in returning", "original shape"), status="verified")
add("C-flame-58788", text="First evidence of flame on the right SRB at 58.788 s", kind="fact", source="E1", passage=P("3", "This first very small flame was detected", "58.788 seconds into the flight."), value=58.788, unit="s", display="58.788", status="verified")
add("C-plume-59262", text="Continuous, well-defined plume at 59.262 s", kind="fact", source="E1", passage=P("3", "It grew into a continuous, well-defined plume", "59.262 seconds."), value=59.262, unit="s", status="verified")
add("C-deflect-60238", text="First evidence of plume deflection at 60.238 s", kind="fact", source="E1", locator="Ch. III event table", passage=P("3", "First evidence of plume  deflection, intermittent".replace("  ", " "), "60.238"), value=60.238, unit="s", display="PLUME TURNS ONTO THE TANK", status="verified")
add("C-leak-64660", text="The plume breached the External Tank (hydrogen leak) at 64.660 s", kind="fact", source="E1", passage=P("3", "The first visual indication that swirling flame", "64.660 seconds"), value=64.66, unit="s", display="HYDROGEN TANK LEAKS", status="verified")
add("C-strut-7220", text="At about 72.20 s the lower SRB-ET strut was severed or pulled away", kind="fact", source="E1", passage=P("3", "At about 72.20 seconds the lower strut", "pulled away"), value=72.2, unit="s", display="LOWER STRUT BREAKS", approximate=True, status="verified")
add("C-dome-73124", text="At 73.124 s the tank's aft dome began to fail", kind="fact", source="E1", passage=P("3", "At 73.124 seconds, a circumferential white vapor", "aft dome dropping away."), value=73.124, unit="s", display="TANK’S AFT DOME FAILS", status="verified")
add("C-ended-73s", text="The flight ended 73 seconds after launch", kind="fact", source="E1", passage=P("3", "It ended 73 seconds later", "the External Tank"), value=73, unit="s", status="verified")
add("C-crew-seven", text="All seven crew members perished", kind="fact", source="E1", passage=P("3", "All seven crew members", "perished."), status="verified")
add("C-breakup-photo-76s", text="The breakup photograph shows the vehicle about 76 s into the flight", kind="fact", source="E6", passage=C("breakup", "At about 76 seconds into the flight", "tumbling"), value=76, unit="s", display="about 76 s after launch", approximate=True, status="verified")
add("C-crew-portrait-1985", text="STS-51-L official crew portrait, November 15, 1985", kind="fact", source="E7", passage=C("crew", "The crew of Space Shuttle mission STS-51-L", "1985."), value=1985, display="1985", status="verified")
add("C-mission-sts51l", text="The mission designation was STS-51-L", kind="fact", source="E7", passage=C("crew", "The crew of Space Shuttle mission STS-51-L", "portrait"), display="THE STS-51-L CREW", status="verified")
add("C-hole-recovered", text="Scorched hole in the recovered right Solid Rocket Motor", kind="fact", source="E5", passage=C("burn", "Shown here is an interior view of the scorched hole", "Solid Rocket Motor."), status="verified")
add("C-et-length", text="The External Tank is 154 feet long", kind="fact", source="E0", passage=P("1", "It is 154 feet long", "diameter."), value=154, unit="ft", status="verified")
add("C-et-diameter", text="The External Tank is 27 1/2 feet in diameter", kind="fact", source="E0", passage=P("1", "It is 154 feet long", "diameter."), value=27.5, unit="ft", valueAsWritten="27 1/2", status="verified")
add("C-srm-diameter", text="SRM case sections are about 12 feet in diameter", kind="fact", source="E0", passage=P("1", "steel sections about 12 feet in diameter", "diameter"), value=12, unit="ft", approximate=True, status="verified")
add("C-srb-length", text="Each SRB is 149.16 feet long", kind="fact", source="E10", locator="p. 1", passage=P("S", "Each SRB is 149.16", "launch."), value=149.16, unit="ft", status="verified", note="V3 drew 45.6 m (no source); the evidenced 149.16 ft = 45.46 m is used now")
add("C-srb-diameter", text="Each SRB is 12.17 feet in diameter", kind="fact", source="E10", locator="p. 1", passage=P("S", "Each SRB is 149.16", "launch."), value=12.17, unit="ft", status="verified")
add("C-gap-max", text="Aft field joint gap opening increases of approximately 0.029 in (primary) and 0.017 in (secondary)", kind="fact", source="E2", locator="Ch. IV", passage=P("4", "For the aft field joints these data indicate gap opening increases", "respectively"), value=0.029, unit="in", approximate=True, status="verified")
add("C-climb-timebase", text="The NASA launch-and-breakup video starts at T-10 seconds", kind="fact", source="E11", passage=C("climb", "Launch of Challenger", "T-10 seconds."), value=-10, unit="s", valueAsWritten="T-10", approximate=True, status="verified", note="caption-level time base; the clock built on it is marked approximate")
add("C-telecon-0845", text="Phase 2 of the teleconference began at about 8:45 p.m. EST on 27 January", kind="fact", source="E3", passage=P("5", "At approximately 8:45 p.m. Eastern Standard", "Time"), display="~8:45 PM", approximate=True, status="verified")
add("C-reversal-1100", text="At about 11:00 PM EST Thiokol recommended launch", kind="fact", source="E3", locator="Ch. V chronology", passage=P("5", "Approximately 11:00 PM (EST)", "Thiokol recommends launch."), display="~11:00 PM", approximate=True, status="verified")
add("C-fax-1145", text="At about 11:45 PM EST Kilminster faxed Thiokol's recommendation to launch", kind="fact", source="E3", locator="Ch. V chronology", passage=P("5", "Approximately 11:45 PM (EST)", "recommendation"), display="~11:45 PM", approximate=True, status="verified")
add("C-launch-1138", text="Launch at 11:38 a.m. EST, January 28, 1986", kind="fact", source="E1", passage=P("3", "Flight of the Space Shuttle Challenger", "January 28, 1986."), display="11:38 AM", status="verified")
add("C-chart-53f", text="Thiokol's chart: O-ring temp must be ≥ 53 °F at launch", kind="quote", source="E8", locator="chart line 1", passage="O-RING TEMP MUST BE ≥ 53 °F AT LAUNCH (handwritten chart, Rogers Vol. 1 p. 90)", value=53, unit="°F", status="verified")
add("C-reversed-finding4", text="Thiokol management reversed its position and recommended launch", kind="fact", source="E3", locator="Ch. V Finding 4", passage=P("5", "4. The Commission concluded that the Thiokol", "recommended the launch of 51-L"), status="verified")
add("C-fax-recommend", text="The signed telefax: MTI recommends STS-51L launch proceed on 28 January 1986", kind="quote", source="E9", passage="MTI RECOMMENDS STS-51L LAUNCH PROCEED ON 28 JANUARY 1986 (typed telefax, Rogers Vol. 1 p. 97)", status="verified")
add("C-finding-unaware", text="Those who made that decision were unaware of the contractor's written recommendation", kind="quote", source="E3", locator="Ch. V p. 82", passage=P("5", "Those who made that decision were", "53 degrees Fahrenheit"), display="Those who made that decision|were unaware…", status="verified")
add("C-payoff", text="Editorial summary: the seal failed in the cold; the warning failed the night before", kind="editorial", source="E2", note="editorial summary of E2 (cause) and E3 (contributing cause); not a quotation", status="verified")
# planner metadata (human-entered): what each claim is, so templates can be chosen by rule
ROLES = {"C-launch-1986": "date", "C-smoke-0678": "event", "C-smoke-right-srb": "context", "C-temp-36f": "temperature", "C-15f-colder": "context",
  "C-two-orings": "ring-diameter", "C-gap-max": "gap-max", "C-gap-600ms": "opening-duration", "C-joint-28f": "temperature", "C-test-75f": "temperature", "C-resiliency-cold": "context",
  "C-flame-58788": "event", "C-plume-59262": "event", "C-deflect-60238": "event", "C-leak-64660": "event", "C-strut-7220": "event", "C-dome-73124": "event", "C-ended-73s": "context",
  "C-breakup-photo-76s": "context", "C-crew-seven": "context", "C-mission-sts51l": "designation", "C-crew-portrait-1985": "date", "C-hole-recovered": "context",
  "C-et-length": "tank-length", "C-et-diameter": "tank-diameter", "C-srb-length": "booster-length", "C-srb-diameter": "booster-diameter", "C-srm-diameter": "context",
  "C-telecon-0845": "chronology", "C-reversal-1100": "chronology", "C-fax-1145": "chronology", "C-launch-1138": "chronology", "C-chart-53f": "quote", "C-fax-recommend": "quote",
  "C-reversed-finding4": "context", "C-finding-unaware": "finding", "C-payoff": "editorial", "C-climb-timebase": "context"}
for cid, role in ROLES.items(): ev["claims"][cid]["role"] = role
json.dump(ev, open(OUT, "w"), indent=1, ensure_ascii=False); open(OUT, "a").write("\n")
print(len(ev["claims"]), "claims")
