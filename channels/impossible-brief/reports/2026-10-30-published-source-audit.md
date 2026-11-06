# ImpossibleBrief: source audit of published videos (2026-10-30, read-only)

No published metadata was changed. Descriptions were read from YouTube (vidIQ public data) on 2026-10-30; 2 of 20 videos returned no data (NobEECFBrwo, fGCiri0k_s8) and are listed from the record only.

Finding: the upload description listed the topic-level `sources` array, which the topic generator filled per category with agency front/section pages (NASA, NOAA, USGS, NIST, NIH, CERN, IPCC, JPL, ESA, DOE). None of them is the page a specific claim was checked against. The proposed list below is each topic's fact pages (the pages whose numbers were checked at research time). They become description sources only after the claim-source ledger marks them VERIFIED (core/research/claim-sources.js); until then they are a proposal.

| Video | Topic | Generic sources in the description | Proposed claim-specific pages (to verify) |
|---|---|---|---|
| NobEECFBrwo (no public data) | what-if-sunlight-could-push-a-spaceship | U.S. Department of Energy Office of Science, NASA Science, NIST | Wikipedia: IKAROS |
| 5yPoQCElJuk | what-if-we-swam-in-europas-ocean | NASA Science, NASA Jet Propulsion Laboratory, European Space Agency | Wikipedia: Europa_(moon) |
| u0iftg8gF5w | what-if-the-dinosaur-killing-asteroid-hit-today | NASA Science, NASA Jet Propulsion Laboratory, European Space Agency | Wikipedia: Chicxulub_crater |
| fGCiri0k_s8 (no public data) | what-if-the-dinosaur-killing-asteroid-hit-today | NASA Science, NASA Jet Propulsion Laboratory, European Space Agency | Wikipedia: Chicxulub_crater |
| Vuvx5nEqcaY | what-if-you-put-saturn-in-a-bathtub | NASA Science, NASA Jet Propulsion Laboratory, European Space Agency | Wikipedia: Saturn |
| 6AdruLBoGiw | what-if-a-mountain-fell-into-a-bay | NOAA, U.S. Geological Survey, NASA Science, IPCC | Wikipedia: 1958_Lituya_Bay_earthquake_and_megatsunami |
| OFwONtLpIIM | what-if-you-spent-a-summer-in-death-valley | NOAA, U.S. Geological Survey, NASA Science, IPCC | Wikipedia: Death_Valley |
| wvn-RzNCb-M | what-if-ice-sank-instead-of-floating | NIST, CERN, NASA Science | Wikipedia: Ice |
| FezZD3MMg_A | what-if-all-fungi-disappeared | NOAA, National Institutes of Health, NIST, U.S. Geological Survey | Wikipedia: Fungus |
| sielLySz6r8 | what-if-you-lived-to-122 | National Institutes of Health, NIST | Wikipedia: Jeanne_Calment |
| Wqu8Cdg5PCc | what-if-you-held-a-teaspoon-of-neutron-star | NASA Science, CERN, NIST | Wikipedia: Neutron_star |
| 9oMvT2-bE9E | what-if-fusion-power-actually-worked | U.S. Department of Energy Office of Science, NASA Science, NIST | Wikipedia: National_Ignition_Facility |
| yIX2WcN9dEQ | what-if-ocean-plankton-disappeared | NOAA, National Institutes of Health, NIST, U.S. Geological Survey | Wikipedia: Phytoplankton |
| 6zrtuhSsLgA | what-if-we-built-a-star-on-earth | U.S. Department of Energy Office of Science, NASA Science, NIST | Wikipedia: ITER |
| G9lIDTt09R0 | what-if-we-gave-mars-a-thicker-atmosphere | U.S. Department of Energy Office of Science, NASA Science, NIST | Wikipedia: Terraforming_of_Mars |
| hzMr-vEogR0 | what-if-you-flew-through-enceladuss-geysers | NASA Science, NASA Jet Propulsion Laboratory, European Space Agency | Wikipedia: Enceladus |
| nyUpI3aKSNE | what-if-water-refused-to-freeze | NIST, CERN, NASA Science | Wikipedia: Supercooling |
| N0k8S0IMwlU | what-if-a-lake-exploded | NOAA, U.S. Geological Survey, NASA Science, IPCC | Wikipedia: Lake_Nyos_disaster |
| x5VVXKhOhMQ | what-if-mosquitoes-went-extinct | NOAA, National Institutes of Health, NIST, U.S. Geological Survey | Wikipedia: Mosquito |
| 5cNecwSkYDo | what-if-you-could-touch-earths-core | NIST, CERN, NASA Science | Wikipedia: Earth's_inner_core |

Proposed correction (owner approval required before any metadata change): for each video, replace the Sources block with the VERIFIED ledger pages once `ib-claim-ledger` has written its ledger, and drop every agency front page. 5cNecwSkYDo additionally lists "Wikipedia — Earth's inner core", which is claim-specific and stays.
