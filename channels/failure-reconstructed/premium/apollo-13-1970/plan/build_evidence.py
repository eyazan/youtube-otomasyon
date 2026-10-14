# Extracts the Apollo 13 claims verbatim from the Report of Apollo 13 Review Board (NSSDC plain text:
# https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_13_review_board.txt, saved as ap13.txt). Exits if any
# passage is not found word for word.   python3 build_evidence.py <dir with ap13.txt> <out evidence.json>
import json, re, sys
D, OUT = sys.argv[1], sys.argv[2]
T = re.sub(r"\s+", " ", open(f"{D}/ap13.txt", errors="ignore").read())
def P(start, end):
    i = T.find(start); j = T.find(end, i) if i >= 0 else -1
    if i < 0 or j < 0: raise SystemExit(f"passage not found: {start}")
    return T[i:j + len(end)]
ev = {"schema": "fr-premium.evidence.v1", "topic": "apollo-13-1970", "sources": {
  "E1": {"title": "Report of Apollo 13 Review Board (NASA), NSSDC plain-text edition", "url": "https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_13_review_board.txt", "kind": "official-report", "publisher": "NASA"}}, "claims": {}}
def add(cid, **k): ev["claims"][cid] = {"source": "E1", "status": "verified", **k}
add("C-a13-mission", text="Apollo 13 was launched from Kennedy Space Center", kind="fact", passage=P("Apollo 13 was successfully launched", "April 11, 1970."), display="APOLLO 13", role="designation")
add("C-a13-launch", text="Launch at 2:13 p.m. e.s.t., April 11, 1970", kind="fact", passage=P("Apollo 13 was successfully launched", "April 11, 1970."), value=1970, display="1970", role="date")
add("C-a13-detank-date", text="Detanking operations were resumed on March 27, 1970", kind="fact", passage=P("On Friday, March 27, 1970, detanking", "resumed"), display="March 27, 1970", role="chronology")
add("C-a13-heaters-65v", text="During detanking the tank heaters were powered from the 65 V dc ground supply", kind="fact", passage=P("The heaters were energized with the 65 V dc", "power supply"), value=65, unit="V", display="65 V", role="context")
add("C-a13-switch-rating", text="The thermostatic switches were rated for the 28 V dc spacecraft supply and could not open properly at 65 V dc", kind="fact", passage=P("Subsequent investigations have shown that the thermostatic switches used", "could not open properly at 65 V dc."), value=28, unit="V", display="28 V", role="context")
add("C-a13-switch-80f", text="Each thermostatic switch was intended to open the heater circuit at 80 F", kind="fact", passage=P("each heater is protected with a thermostatic switch", "temperature of 80 F."), value=80, unit="°F", display="80°F", role="temperature")
add("C-a13-1000f", text="Switch failure probably let the heater tube reach about 1000 F in spots during 8 hours of heater operation", kind="estimate", passage=P("failure of the thermostatic switches probably permitted", "8-hour period of heater operation."), value=1000, unit="°F", display="about 1000°F", approximate=True, role="temperature")
add("C-a13-teflon", text="That heating severely damages the Teflon insulation on the fan motor wires", kind="fact", passage=P("Such heating has been shown by tests to severely damage the Teflon insulation", "heater assembly."), role="context")
add("C-a13-hazard", text="From then on, including on the pad, oxygen tank no. 2 was hazardous when filled and powered", kind="fact", passage=P("From that time on, including pad occupancy", "electrically powered."), role="context")
add("C-a13-fans", text="Current was applied to the oxygen tank no. 2 fan motors at 55:53:20 g.e.t.", kind="fact", passage=P("current was applied to the oxygen tank no. 2 fan motors", "55:53:20."), value=201200, unit="s", valueAsWritten="55:53:20", display="55:53:20 g.e.t.", role="event")
add("C-a13-dataloss", text="At 55:54:53.555 g.e.t. telemetry was lost almost totally for 1.8 seconds", kind="fact", passage=P("About 1-1/2 minutes later, at 55:54:53.555", "1.8 seconds."), value=201293.555, unit="s", valueAsWritten="55:54:53.555", display="55:54:53 g.e.t.", role="event")
add("C-a13-pressure", text="Oxygen tank no. 2 lost pressure in that period and the panel separated", kind="fact", passage=P("All indications are that the cryogenic oxygen tank no. 2 lost pressure", "panel separated."), role="context")
add("C-a13-cause", text="An electrically initiated fire in oxygen tank no. 2 was the cause of the accident", kind="quote", passage=P("All indications are that an electrically initiated fire", "cause of the accident."), display="an electrically initiated fire|in oxygen tank no. 2", role="finding")
add("C-a13-averted", text="A near disaster averted only by the crew and the ground control team", kind="quote", passage=P("The imperfection in Apollo 13 constituted a near disaster", "supported them."), role="context")
add("C-a13-payoff", text="Editorial summary: the flight was saved in space; the tank was lost on the ground", kind="editorial", note="editorial summary of the board's findings; not a quotation", role="editorial")
json.dump(ev, open(OUT, "w"), indent=1, ensure_ascii=False); open(OUT, "a").write("\n"); print(len(ev["claims"]), "claims")
