# GoalLore Lab — approval package

## A. Voice comparison (same verified script, GLL-021, same Edge settings)

All three read the identical narration of GLL-021 (Two Goals, Four Minutes Apart) with the same Edge settings.

**Listen:** the `review/goal-lore-lab` branch holds the three samples as plain MP3 files (GitHub plays them on the file page):
https://github.com/eyazan/youtube-otomasyon/tree/review/goal-lore-lab/review/goal-lore-lab/voices

| Voice | Accent | Note |
|---|---|---|
| en-GB-RyanNeural | British | current candidate in channels/goal-lore-lab/config.json (not approved) |
| en-GB-ThomasNeural | British | |
| en-US-ChristopherNeural | American | |

No voice is approved by code. Tell me your choice; it is recorded in channels/goal-lore-lab/config.json as `APPROVED by <you> <date>` only after you say so.

## B. Research review (9 verified topics)

Every quote below was copied by code from the cited source at the pinned revision (scripts/gll-research/verify.js). Nothing here is approved: record a topic only after reading it, with
`node core/pipeline/premium-publish.js review-research --channel goal-lore-lab --topic <id> --by <name>` (binds your review to the research sha256 shown).

**Estimated watchability** is the repository's existing editorial seed score (channels/goal-lore-lab/topics/topic-candidates.json: appeal / shorts / curiosity / priority), assigned before research. It is not measured data; the channel has no published GoalLore Lab videos yet.

## GLL-021 — Two Goals, Four Minutes Apart

- **Hook (first line):** Four minutes. The same player. Two very different goals.
- **Core question:** How did the 'Hand of God' and the 'Goal of the Century' happen four minutes apart?
- **Pillar:** MOMENTS
- **Estimated watchability (editorial seed, not data):** priority 81, appeal 96, shorts 80, curiosity 80
- **Research sha256:** `23dc945120371e8fd612c6aee987854312623562a493631f2aedc892a0078404`

**Narration**

1. Four minutes. The same player. Two very different goals.  _(cites F3)_
2. The 1986 World Cup quarter-final. Argentina against England.  _(cites F1)_
3. Diego Maradona put the first one in with his hand.  _(cites F2)_
4. It became known as the Hand of God.  _(cites F2)_
5. Then he dribbled past five England players and scored again.  _(cites F3)_
6. FIFA later voted it the Goal of the Century. Every goal has a story.  _(cites F4)_

**Claims and verbatim source quotes**

- **F1** claim: Argentina played England in a 1986 FIFA World Cup quarter-final at Estadio Azteca in Mexico City.
  - quote: "The Argentina 2–1 England quarter-final match of the 1986 FIFA World Cup was a football match played on 22 June 1986 between Argentina and England at Estadio Azteca in Mexico City."
  - source: [Wikipedia: Argentina v England (1986 FIFA World Cup) (revision 1382184506, 2026-10-27T03:52:07Z)](https://en.wikipedia.org/w/index.php?title=Argentina_v_England_(1986_FIFA_World_Cup)&oldid=1382184506)
- **F2** claim: Maradona's first goal, scored with his hand, became known as the Hand of God goal.
  - quote: "The first goal, referred to as the "Hand of God" goal,  was illegally scored by Maradona using his hand in the 51st minute."
  - source: [Wikipedia: Argentina v England (1986 FIFA World Cup) (revision 1382184506, 2026-10-27T03:52:07Z)](https://en.wikipedia.org/w/index.php?title=Argentina_v_England_(1986_FIFA_World_Cup)&oldid=1382184506)
- **F3** claim: Four minutes later, Maradona dribbled past five England players to score the Goal of the Century.
  - quote: "Four minutes later, Maradona dribbled past five England players to score what became known as the "Goal of the Century"."
  - source: [Wikipedia: Argentina v England (1986 FIFA World Cup) (revision 1382184506, 2026-10-27T03:52:07Z)](https://en.wikipedia.org/w/index.php?title=Argentina_v_England_(1986_FIFA_World_Cup)&oldid=1382184506)
- **F4** claim: In 2002 the goal was voted Goal of the Century on the FIFA website.
  - quote: "In 2002, the goal was voted 'Goal of the Century' as part of the buildup to the 2002 FIFA World Cup tournament on the FIFA website."
  - source: [Wikipedia: Argentina v England (1986 FIFA World Cup) (revision 1382184506, 2026-10-27T03:52:07Z)](https://en.wikipedia.org/w/index.php?title=Argentina_v_England_(1986_FIFA_World_Cup)&oldid=1382184506)

**Sources**

- https://en.wikipedia.org/w/index.php?title=Argentina_v_England_(1986_FIFA_World_Cup)&oldid=1382184506

**Risky or interpretive wording (my reading — please check)**

- "Four minutes. The same player. Two very different goals." — the contrast is an editorial framing; the quotes support the four minutes and both goals.
- "Every goal has a story." — channel tagline, not a factual claim (on every topic).

---

## GLL-025 — The Penalty That Took a Name

- **Hook (first line):** This penalty decided a European Championship final.
- **Core question:** What made Panenka's 1976 penalty so audacious?
- **Pillar:** MOMENTS
- **Estimated watchability (editorial seed, not data):** priority 83, appeal 96, shorts 80, curiosity 72
- **Research sha256:** `b8ef892a5394cb2155ee3ffacd8a982b9dcfa1012febe4090d0fc0af6d0344d7`

**Narration**

1. This penalty decided a European Championship final.  _(cites F2)_
2. Belgrade, 1976. Czechoslovakia against West Germany.  _(cites F1)_
3. The final went to penalties.  _(cites F2)_
4. West Germany's Uli Hoeneß sent his kick over the bar.  _(cites F3)_
5. Then Antonín Panenka stepped up, and the goalkeeper dived.  _(cites F4)_
6. Panenka chipped it, gently, into the middle of the net.  _(cites F4)_
7. Only confident penalty takers dare to try it. Every goal has a story.  _(cites F5)_

**Claims and verbatim source quotes**

- **F1** claim: The UEFA Euro 1976 final between Czechoslovakia and West Germany was played in Belgrade.
  - quote: "Contested by Czechoslovakia and West Germany, the match was played at Stadion Crvena Zvezda in Belgrade, Yugoslavia, on 20 June 1976."
  - source: [Wikipedia: UEFA Euro 1976 final (revision 1377074927, 2026-09-27T19:45:33Z)](https://en.wikipedia.org/w/index.php?title=UEFA_Euro_1976_final&oldid=1377074927)
- **F2** claim: Czechoslovakia won the final on penalties.
  - quote: "Following a 2–2 draw after extra time, Czechoslovakia won 5–3 on penalties to secure their only European Championship title."
  - source: [Wikipedia: UEFA Euro 1976 final (revision 1377074927, 2026-09-27T19:45:33Z)](https://en.wikipedia.org/w/index.php?title=UEFA_Euro_1976_final&oldid=1377074927)
- **F3** claim: West Germany's fourth penalty taker, Uli Hoeneß, ballooned his shot over the bar.
  - quote: "The first seven kicks were converted, until West Germany's fourth penalty taker, Uli Hoeneß, ballooned his shot over the bar."
  - source: [Wikipedia: Panenka (penalty kick) (revision 1381624147, 2026-10-23T19:09:18Z)](https://en.wikipedia.org/w/index.php?title=Panenka_(penalty_kick)&oldid=1381624147)
- **F4** claim: Panenka feigned shooting to the side, Sepp Maier dived, and Panenka gently chipped the ball into the middle of the net.
  - quote: "He feigned shooting to the side of the goal, causing German goalkeeper Sepp Maier to dive to his left, and then gently chipped the ball into the middle of the net."
  - source: [Wikipedia: Antonín Panenka (revision 1381388550, 2026-10-22T03:25:54Z)](https://en.wikipedia.org/w/index.php?title=Anton%C3%ADn_Panenka&oldid=1381388550)
- **F5** claim: The move is generally only used by confident penalty takers who dare to risk missing the kick.
  - quote: "The move is generally only used by confident penalty takers who dare to risk missing the kick."
  - source: [Wikipedia: Panenka (penalty kick) (revision 1381624147, 2026-10-23T19:09:18Z)](https://en.wikipedia.org/w/index.php?title=Panenka_(penalty_kick)&oldid=1381624147)

**Sources**

- https://en.wikipedia.org/w/index.php?title=UEFA_Euro_1976_final&oldid=1377074927
- https://en.wikipedia.org/w/index.php?title=Panenka_(penalty_kick)&oldid=1381624147
- https://en.wikipedia.org/w/index.php?title=Anton%C3%ADn_Panenka&oldid=1381388550

**Risky or interpretive wording (my reading — please check)**

- Fixed today: an earlier quote (F6) came from a different Panenka match and was removed; the Panenka lines now rest on F4, whose source article is "Antonín Panenka" (the quote itself says "He").
- "This penalty decided a European Championship final." — F2 says Czechoslovakia won 5–3 on penalties; that Panenka's kick was the decisive one is implied by the article, not stated in a quote.

---

## GLL-026 — The Free Kick That Turned

- **Hook (first line):** One of the best free kicks of the modern game.
- **Core question:** How did Roberto Carlos's 1997 free kick bend the way it did?
- **Pillar:** MOMENTS
- **Estimated watchability (editorial seed, not data):** priority 78, appeal 86, shorts 80, curiosity 80
- **Research sha256:** `0e0c0214fe1c5cdb2f7afce9836a719eaddf071da4e081afb0af1959b4ac9cef`

**Narration**

1. One of the best free kicks of the modern game.  _(cites F1)_
2. 1997. The opening match, France against Brazil.  _(cites F1)_
3. Roberto Carlos struck it from long distance.  _(cites F1)_
4. It curled, and it became known as the Banana Shot.  _(cites F1)_
5. Every goal has a story.  _(cites F1)_

**Claims and verbatim source quotes**

- **F1** claim: In the 21st minute of the opening match between France and Brazil, Roberto Carlos scored his Banana Shot free kick, curling from long distance, often considered one of the best in the modern game.
  - quote: "In the 21st minute of the opening match between France and Brazil, Roberto Carlos scored his famous Banana Shot free kick goal, curling from a 33.13-metre distance and often considered to be one of the best in the modern game."
  - source: [Wikipedia: 1997 Tournoi de France (revision 1343109846, 2026-03-12T09:11:30Z)](https://en.wikipedia.org/w/index.php?title=1997_Tournoi_de_France&oldid=1343109846)

**Sources**

- https://en.wikipedia.org/w/index.php?title=1997_Tournoi_de_France&oldid=1343109846

**Risky or interpretive wording (my reading — please check)**

- "1997" comes from the source article's title (1997 Tournoi de France), not from the quoted sentence.
- "struck it from long distance" paraphrases the quoted 33.13-metre distance.

---

## GLL-028 — The Header That Shocked Europe

- **Hook (first line):** Before this tournament, Greece had reached just one European Championship.
- **Core question:** How did Greece win Euro 2004?
- **Pillar:** MOMENTS
- **Estimated watchability (editorial seed, not data):** priority 83, appeal 76, shorts 80, curiosity 80
- **Research sha256:** `e54b803846d3d523bcaac1c0247f4d26f8d330e6a5e36e64c43c3ec34bd8c3f7`

**Narration**

1. Before this tournament, Greece had reached just one European Championship.  _(cites F4)_
2. Lisbon, 2004. The European Championship final.  _(cites F1)_
3. Greece were coached by a German, Otto Rehhagel.  _(cites F3)_
4. Charisteas met the ball about 8 yards from goal, with a powerful header.  _(cites F2)_
5. Greece were champions of Europe. Every goal has a story.  _(cites F3)_

**Claims and verbatim source quotes**

- **F1** claim: The final was played on 4 July 2004 at the Estádio da Luz in Lisbon.
  - quote: "The final was played on 4 July 2004 at the 65,000-capacity Estádio da Luz in Lisbon."
  - source: [Wikipedia: UEFA Euro 2004 final (revision 1381195808, 2026-10-20T16:28:32Z)](https://en.wikipedia.org/w/index.php?title=UEFA_Euro_2004_final&oldid=1381195808)
- **F2** claim: Charisteas met the corner and sent a powerful header past Ricardo to give Greece the lead.
  - quote: "It was met by Charisteas around 8 yards (7 m) from goal; he sent a powerful header past Ricardo to give Greece the lead."
  - source: [Wikipedia: UEFA Euro 2004 final (revision 1381195808, 2026-10-20T16:28:32Z)](https://en.wikipedia.org/w/index.php?title=UEFA_Euro_2004_final&oldid=1381195808)
- **F3** claim: Greece's German manager Otto Rehhagel became the first person to coach a nation other than his own to European Championship victory.
  - quote: "Greece's German manager Otto Rehhagel became the first person to coach a nation other than his own to victory in the UEFA European Championship."
  - source: [Wikipedia: UEFA Euro 2004 final (revision 1381195808, 2026-10-20T16:28:32Z)](https://en.wikipedia.org/w/index.php?title=UEFA_Euro_2004_final&oldid=1381195808)
- **F4** claim: Before 2004, Greece had qualified for only one European Championship, in 1980.
  - quote: "Greece's only prior appearance in a European Championship was in 1980, when they were eliminated in the group phase."
  - source: [Wikipedia: UEFA Euro 2004 final (revision 1381195808, 2026-10-20T16:28:32Z)](https://en.wikipedia.org/w/index.php?title=UEFA_Euro_2004_final&oldid=1381195808)

**Sources**

- https://en.wikipedia.org/w/index.php?title=UEFA_Euro_2004_final&oldid=1381195808

**Risky or interpretive wording (my reading — please check)**

- "Greece were champions of Europe" is inferred from F3 (Rehhagel coached a nation to victory in the European Championship).

---

## GLL-031 — The Goal the Whole Team Scored

- **Hook (first line):** One goal, often called the greatest team goal ever.
- **Core question:** How did Carlos Alberto's 1970 final goal come from a team-wide move?
- **Pillar:** MOMENTS
- **Estimated watchability (editorial seed, not data):** priority 84, appeal 96, shorts 80, curiosity 80
- **Research sha256:** `7857728711009c88dfc0f89e96acc3785e9310fc52a405c7715efa36bfdb07bb`

**Narration**

1. One goal, often called the greatest team goal ever.  _(cites F2)_
2. The 1970 World Cup final. Brazil against Italy, at the Azteca.  _(cites F1)_
3. Brazil's captain was Carlos Alberto.  _(cites F4)_
4. The move ran through the team.  _(cites F2)_
5. Pelé drew the Italian defence into the middle, and fed him on the right.  _(cites F3)_
6. Carlos Alberto scored the fourth goal. Every goal has a story.  _(cites F4)_

**Claims and verbatim source quotes**

- **F1** claim: Brazil beat Italy in the 1970 World Cup final, played at the Estadio Azteca in Mexico City.
  - quote: "The final match of the 1970 FIFA World Cup, the ninth edition of FIFA's competition for national football teams, was played at Estadio Azteca in Mexico City, Mexico, on 21 June 1970, and was contested by Brazil and Italy."
  - source: [Wikipedia: 1970 FIFA World Cup final (revision 1378370769, 2026-10-04T04:31:28Z)](https://en.wikipedia.org/w/index.php?title=1970_FIFA_World_Cup_final&oldid=1378370769)
- **F2** claim: The move is often regarded as one of the greatest team goals of all time.
  - quote: "The last goal of the game is often considered the greatest team goal of all time because it involved all but two of the team's outfield players."
  - source: [Wikipedia: Pelé (revision 1382313456, 2026-10-28T00:02:30Z)](https://en.wikipedia.org/w/index.php?title=Pel%C3%A9&oldid=1382313456)
- **F3** claim: Pelé drew the Italian defence into the centre and fed captain Carlos Alberto on the right flank for the final score.
  - quote: "Pelé capped his superb performance by drawing the Italian defence in the centre and feeding captain Carlos Alberto on the right flank for the final score."
  - source: [Wikipedia: 1970 FIFA World Cup final (revision 1378370769, 2026-10-04T04:31:28Z)](https://en.wikipedia.org/w/index.php?title=1970_FIFA_World_Cup_final&oldid=1378370769)
- **F4** claim: Carlos Alberto captained Brazil to the 1970 World Cup and scored the fourth goal in the final, considered one of the greatest goals in the tournament's history.
  - quote: "Nicknamed O Capitão, he captained the Brazil national team to victory in the 1970 World Cup, scoring the fourth goal in the final, considered one of the greatest goals in the history of the tournament."
  - source: [Wikipedia: Carlos Alberto Torres (revision 1381389994, 2026-10-22T03:39:26Z)](https://en.wikipedia.org/w/index.php?title=Carlos_Alberto_Torres&oldid=1381389994)

**Sources**

- https://en.wikipedia.org/w/index.php?title=1970_FIFA_World_Cup_final&oldid=1378370769
- https://en.wikipedia.org/w/index.php?title=Pel%C3%A9&oldid=1382313456
- https://en.wikipedia.org/w/index.php?title=Carlos_Alberto_Torres&oldid=1381389994

**Risky or interpretive wording (my reading — please check)**

- "The move ran through the team" paraphrases "involved all but two of the team's outfield players".
- "Brazil's captain was Carlos Alberto": F4 says "he captained"; the name comes from the source article's title.

---

## GLL-037 — The Save Pelé Never Forgot

- **Hook (first line):** Pelé's header looked like a goal. Then it wasn't.
- **Core question:** Why is Gordon Banks's save from Pelé in 1970 still studied?
- **Pillar:** MOMENTS
- **Estimated watchability (editorial seed, not data):** priority 85, appeal 96, shorts 80, curiosity 80
- **Research sha256:** `2c36625ffa4dc31b2ea90b7c9b773f04e9fd0f07d088597eb64ec00aed0c6cf0`

**Narration**

1. Pelé's header looked like a goal. Then it wasn't.  _(cites F1)_
2. The 1970 World Cup. Brazil against England.  _(cites F1)_
3. Pelé met the ball with a header.  _(cites F1)_
4. Pelé met the ball with a header.  _(cites F1)_
5. Pelé and many pundits later called it the greatest save in the game's history.  _(cites F2)_
6. Brazil still won, through Jairzinho.  _(cites F3)_
7. And they went on to win the final against Italy. Every goal has a story.  _(cites F4)_

**Claims and verbatim source quotes**

- **F1** claim: Pelé nearly scored with a header against England that was spectacularly saved by Gordon Banks.
  - quote: "In the first half of the match against England, Pelé nearly scored with a header that was spectacularly saved by Gordon Banks."
  - source: [Wikipedia: Brazil at the 1970 FIFA World Cup (revision 1363858420, 2026-07-12T22:39:28Z)](https://en.wikipedia.org/w/index.php?title=Brazil_at_the_1970_FIFA_World_Cup&oldid=1363858420)
- **F2** claim: Pelé and numerous journalists and pundits later described the save as the greatest in the game's history.
  - quote: "Pelé and numerous journalists and pundits would later describe the save as the greatest in the game's history."
  - source: [Wikipedia: Gordon Banks (revision 1381394608, 2026-10-22T04:26:46Z)](https://en.wikipedia.org/w/index.php?title=Gordon_Banks&oldid=1381394608)
- **F3** claim: Jairzinho scored the only goal of the match against England.
  - quote: "In the second half, he assisted Jairzinho for the only goal of the match."
  - source: [Wikipedia: Brazil at the 1970 FIFA World Cup (revision 1363858420, 2026-07-12T22:39:28Z)](https://en.wikipedia.org/w/index.php?title=Brazil_at_the_1970_FIFA_World_Cup&oldid=1363858420)
- **F4** claim: Brazil won the final 4–1 against Italy.
  - quote: "In the tournament final, Brazil won 4–1 against Italy, another FIFA two-time champion (and UEFA Euro 1968 winner)."
  - source: [Wikipedia: 1970 FIFA World Cup (revision 1380551267, 2026-10-16T12:28:29Z)](https://en.wikipedia.org/w/index.php?title=1970_FIFA_World_Cup&oldid=1380551267)

**Sources**

- https://en.wikipedia.org/w/index.php?title=Brazil_at_the_1970_FIFA_World_Cup&oldid=1363858420
- https://en.wikipedia.org/w/index.php?title=Gordon_Banks&oldid=1381394608
- https://en.wikipedia.org/w/index.php?title=1970_FIFA_World_Cup&oldid=1380551267

**Risky or interpretive wording (my reading — please check)**

- "Pelé's header looked like a goal. Then it wasn't." — dramatic framing of "nearly scored ... spectacularly saved".
- "Gordon Banks got across" — "got across" is not in the quote (it says "spectacularly saved").

---

## GLL-043 — The Ball That Would Not Fly Straight

- **Hook (first line):** The 2010 World Cup ball had players complaining.
- **Core question:** Why was the 2010 Jabulani ball criticised for its flight?
- **Pillar:** MYSTERIES
- **Estimated watchability (editorial seed, not data):** priority 84, appeal 70, shorts 90, curiosity 88
- **Research sha256:** `0a5d1a729f510e023ebda4325967ee2ccff6a23709751735072e7f1538153624`

**Narration**

1. The 2010 World Cup ball had players complaining.  _(cites F1, F3)_
2. It was called the Jabulani.  _(cites F1)_
3. Just eight moulded panels, with a textured surface.  _(cites F2)_
4. Professional players criticised how it performed.  _(cites F3)_
5. A NASA engineer described its unpredictable flight as a knuckle-ball effect.  _(cites F4)_
6. A ball's surface can change its flight. Every goal has a story.  _(cites F4)_

**Claims and verbatim source quotes**

- **F1** claim: The Jabulani was the official match ball for the 2010 FIFA World Cup.
  - quote: "It was the official match ball for the 2010 FIFA World Cup."
  - source: [Wikipedia: Adidas Jabulani (revision 1381417724, 2026-10-22T09:35:49Z)](https://en.wikipedia.org/w/index.php?title=Adidas_Jabulani&oldid=1381417724)
- **F2** claim: The ball is made from eight spherically moulded panels with a textured surface.
  - quote: "The ball is made from eight spherically moulded panels and has a textured surface intended to improve aerodynamics."
  - source: [Wikipedia: Adidas Jabulani (revision 1381417724, 2026-10-22T09:35:49Z)](https://en.wikipedia.org/w/index.php?title=Adidas_Jabulani&oldid=1381417724)
- **F3** claim: Professional players criticised the ball for poor performance.
  - quote: "He compiled feedback from professional players criticizing the ball for poor performance and asked that it be abandoned by FIFA."
  - source: [Wikipedia: Adidas Jabulani (revision 1381417724, 2026-10-22T09:35:49Z)](https://en.wikipedia.org/w/index.php?title=Adidas_Jabulani&oldid=1381417724)
- **F4** claim: A NASA aerospace engineer described its unpredictable behaviour as a knuckle-ball effect.
  - quote: "In discussing the mechanics of the balls Rabi Mehta, an aerospace engineer at NASA Ames, described the unpredictable behaviour as "a knuckle-ball effect"."
  - source: [Wikipedia: Adidas Jabulani (revision 1381417724, 2026-10-22T09:35:49Z)](https://en.wikipedia.org/w/index.php?title=Adidas_Jabulani&oldid=1381417724)

**Sources**

- https://en.wikipedia.org/w/index.php?title=Adidas_Jabulani&oldid=1381417724

**Risky or interpretive wording (my reading — please check)**

- "It was called the Jabulani" — the name comes from the source article title (Adidas Jabulani).
- "A ball's surface can change its flight" generalises F2/F4 (a textured surface meant to improve aerodynamics; a knuckle-ball effect).

---

## GLL-052 — Why Penalties Are 12 Yards

- **Hook (first line):** Why is a penalty taken from 12 yards?
- **Core question:** Why is the penalty spot 12 yards from goal?
- **Pillar:** HISTORY
- **Estimated watchability (editorial seed, not data):** priority 83, appeal 70, shorts 90, curiosity 80
- **Research sha256:** `b6f596792d80b479efed70ec6abcd5aea833915d8dfa18e08e543cbe255fed59`

**Narration**

1. Why is a penalty taken from 12 yards?  _(cites F3)_
2. The idea came from William McCrum, an Irish linen manufacturer.  _(cites F1)_
3. In 1891, the penalty kick entered the laws of the game.  _(cites F2)_
4. Then a penalty spot was introduced, 12 yards from the goal.  _(cites F3)_
5. Billy Heath of Wolves took one, and scored. Every goal has a story.  _(cites F4)_

**Claims and verbatim source quotes**

- **F1** claim: William McCrum, an Irish linen manufacturer, is most famous as the inventor of the penalty kick.
  - quote: "William McCrum (7 February 1865 – 21 December 1932) was a wealthy Irish linen manufacturer and sportsman from Ulster, most famous for being the inventor in 1890 of the penalty kick in football."
  - source: [Wikipedia: William McCrum (revision 1365195139, 2026-07-20T21:56:03Z)](https://en.wikipedia.org/w/index.php?title=William_McCrum&oldid=1365195139)
- **F2** claim: The original penalty-kick law dates from 1891.
  - quote: "The number of offences eligible for punishment by a penalty-kick, small when initially introduced in 1891, expanded rapidly thereafter."
  - source: [Wikipedia: Penalty kick (association football) (revision 1380851913, 2026-10-18T10:04:41Z)](https://en.wikipedia.org/w/index.php?title=Penalty_kick_(association_football)&oldid=1380851913)
- **F3** claim: The penalty spot was introduced, 12 yards from the goal.
  - quote: "The penalty spot was also introduced, 12 yards (11 m) from the goal."
  - source: [Wikipedia: Penalty kick (association football) (revision 1380851913, 2026-10-18T10:04:41Z)](https://en.wikipedia.org/w/index.php?title=Penalty_kick_(association_football)&oldid=1380851913)
- **F4** claim: A penalty was taken and scored by Billy Heath as Wolves won the game.
  - quote: "The penalty was taken and scored by Billy Heath as Wolves went on to win the game 5–0."
  - source: [Wikipedia: Penalty kick (association football) (revision 1380851913, 2026-10-18T10:04:41Z)](https://en.wikipedia.org/w/index.php?title=Penalty_kick_(association_football)&oldid=1380851913)

**Sources**

- https://en.wikipedia.org/w/index.php?title=William_McCrum&oldid=1365195139
- https://en.wikipedia.org/w/index.php?title=Penalty_kick_(association_football)&oldid=1380851913

**Risky or interpretive wording (my reading — please check)**

- none found beyond the channel tagline

---

## GLL-061 — The Rule That Changed Goalkeeping

- **Hook (first line):** Goalkeepers used to pick up every back pass.
- **Core question:** Why did the back-pass rule change in 1992?
- **Pillar:** HISTORY
- **Estimated watchability (editorial seed, not data):** priority 83, appeal 70, shorts 90, curiosity 80
- **Research sha256:** `1c64818321d6c941a5e348d3afd04e84793db8093a9622ca650654f23e71af91`

**Narration**

1. Goalkeepers used to pick up every back pass.  _(cites F4)_
2. The 1990 World Cup was criticised as dull, with goalkeepers holding up the ball.  _(cites F1)_
3. Caen manager Daniel Jeandupeux proposed a change, in a letter to FIFA.  _(cites F3)_
4. In 1992, the back-pass rule arrived.  _(cites F1)_
5. If a team-mate kicks it back on purpose, the goalkeeper cannot handle it.  _(cites F4)_
6. It was made to stop time-wasting. Every goal has a story.  _(cites F2)_

**Claims and verbatim source quotes**

- **F1** claim: The back-pass rule was introduced in 1992 to discourage time-wasting after the 1990 World Cup was criticised as dull, with goalkeepers holding up the ball.
  - quote: "The back-pass rule was introduced in 1992 to discourage time-wasting and unduly defensive play after the 1990 World Cup was widely criticised as excessively dull, rife with back-passing and goalkeepers holding up the ball to waste time."
  - source: [Wikipedia: Back-pass rule (revision 1381982438, 2026-10-25T22:22:08Z)](https://en.wikipedia.org/w/index.php?title=Back-pass_rule&oldid=1381982438)
- **F2** claim: The rule was introduced to discourage time-wasting and unduly defensive play.
  - quote: "The back-pass rule was introduced in 1992 to discourage time-wasting and unduly defensive play after the 1990 World Cup was widely criticised as excessively dull, rife with back-passing and goalkeepers holding up the ball to waste time."
  - source: [Wikipedia: Back-pass rule (revision 1381982438, 2026-10-25T22:22:08Z)](https://en.wikipedia.org/w/index.php?title=Back-pass_rule&oldid=1381982438)
- **F3** claim: Caen manager Daniel Jeandupeux proposed the rule in December 1990 in a letter to the FIFA technical committee.
  - quote: "Daniel Jeandupeux, then the manager of Ligue 1 team Caen, proposed the rule in December 1990 in a letter to the FIFA technical committee after analysing data from Ligue 1 goalkeepers."
  - source: [Wikipedia: Back-pass rule (revision 1381982438, 2026-10-25T22:22:08Z)](https://en.wikipedia.org/w/index.php?title=Back-pass_rule&oldid=1381982438)
- **F4** claim: The rule prohibits goalkeepers from handling the ball after it has been deliberately kicked to them by a team-mate.
  - quote: "However, the back-pass rule prohibits goalkeepers from handling the ball after it has been deliberately kicked to them by a team-mate or directly after a throw-in taken by a team-mate."
  - source: [Wikipedia: Back-pass rule (revision 1381982438, 2026-10-25T22:22:08Z)](https://en.wikipedia.org/w/index.php?title=Back-pass_rule&oldid=1381982438)

**Sources**

- https://en.wikipedia.org/w/index.php?title=Back-pass_rule&oldid=1381982438

**Risky or interpretive wording (my reading — please check)**

- "Goalkeepers used to pick up every back pass" — "every" generalises what the quotes imply (the rule now prohibits handling a deliberate back pass).

---


## Listen (run 40653574061)

- [GLL-voice-en-GB-RyanNeural.mp3](voices/GLL-voice-en-GB-RyanNeural.mp3) — 248 KB
- [GLL-voice-en-GB-ThomasNeural.mp3](voices/GLL-voice-en-GB-ThomasNeural.mp3) — 256 KB
- [GLL-voice-en-US-ChristopherNeural.mp3](voices/GLL-voice-en-US-ChristopherNeural.mp3) — 256 KB
