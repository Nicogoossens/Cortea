# BE Phase 1 P1 — NEW FILE — Section 1 of 85

**Source section reworked:** `Common (Age-Neutral Baseline)` → **Level 1: The Foundation** (lines 8–229 of source)
**Target file:** *new file under construction — paste into your fresh `BE_Phase1_P1_middle_class.yaml` (or .md with YAML blocks)*
**Category:** Cat A retrofit — structure sound, scenarios concrete, motivations below §5.3 minimum, HCs need real canon anchors
**Scope this session:** 10 questions reworked, 0 flagged (all question_text valid per §5.2)

---

## YAML blocks for new file

```yaml
# === Common Demographic — Level 1 — Q1: The Initial Contact ===
question_text: |
  You are emailing a potential collaborator for the first time. Which
  greeting best balances respect and approachability?
options:
  - text: "\"Dear [Name], I hope this email finds you well. I am writing to discuss a potential collaboration.\""
    answer_tier: 1
    motivation: |
      Della Casa's conscious-register principle holds: the greeting form
      must match the act. "Dear" anchors formality; the warm purpose
      modulates it. Bourdieu's habitus reads this as the calibrated middle-
      class register — neither falsely peer-near nor falsely senior-distant.
  - text: "\"Hi [Name], I'm reaching out because I saw your work and wanted to chat.\""
    answer_tier: 2
    motivation: |
      The Hi/chat register fits a known peer; for first contact it reads as
      under-calibrated — the writer has not paused to choose the register
      the relationship has not yet earned. Workable after rapport;
      premature here. Bescheiden in spirit, register-light in form.
  - text: "\"To whom it may concern, I hereby request a moment of your time.\""
    answer_tier: 3
    motivation: |
      "To whom it may concern" is the no-relationship register — appropriate
      for utility forms, register-tripping for collaboration. The Belgian
      Notabele tradition rewards specific addressed warmth; bureaucratic
      distance closes the door it was meant to open.
historical_context: |
  The "Dear + warm purpose" form codifies Della Casa's register-discipline
  (Galateo, 1558) into digital correspondence: salutation anchors
  formality, the next clause modulates it. Reynebeau's account of post-war
  Belgian merit-based business culture documents how this formal-warm
  hybrid displaced both pre-war strict deference and post-war casual
  American imports.
register: middle_class
phase: 1
level: 1
research_pillar: P1
demographic: common_age_neutral
region_code: BE
lang: en
primary_dimension: discernment
secondary_dimension: diplomacy
anchor_primary:
  source: "Della Casa, Il Galateo (1558)"
  volume_or_chapter: "Civility as conscious register-choice"
  claim_supported: "the greeting form must match the relationship-state of the act"
  anchor_strength: primary
anchor_secondary:
  source: "Bourdieu, Distinction (1979)"
  volume_or_chapter: "Habitus and calibrated register"
  claim_supported: "well-calibrated middle-class register as habitus signal"
  anchor_strength: corroborating
historical_anchor_level: A
historical_anchor:
  source: "Marc Reynebeau, Een geschiedenis van België (2003)"
  volume_or_chapter: "Naoorlogse zakencultuur"
  page_or_section: "merit-based professional norms post-1945"
  claim_supported: "formal-warm hybrid as the displacing register of post-war Belgian business correspondence"
  anchor_strength: primary
cultural_anchor: "BE_grounding_sheet_v1.0 §local_terms (Notabele, Bescheiden)"
```

```yaml
# === Common Demographic — Level 1 — Q2: Correcting a Misspelling ===
question_text: |
  You notice you misspelled a client's name in a previous email. How do
  you fix it?
options:
  - text: "Send a quick follow-up: \"Apologies for the typo in your name, [Correct Name]. I've corrected my records.\""
    answer_tier: 1
    motivation: |
      Goffman's face-work: the misspelled name is a small but real face-
      slight to the client. Specific, brief acknowledgement repairs without
      inflating the incident. Goleman's social-skill principle — own the
      slip, name the correction, move on — is the trained-competence form.
  - text: "Ignore it and just spell it correctly next time."
    answer_tier: 2
    motivation: |
      Silent correction avoids the awkwardness but leaves the slight
      unrepaired. Goffman would note the client may or may not have
      registered it; if they did, the silent fix reads as either oversight
      or avoidance. Workable for low-stakes contacts; under-investing for a
      client.
  - text: "Send a long email explaining how tired you were and why you made the mistake."
    answer_tier: 3
    motivation: |
      Over-explanation inverts the face-work: the apology now occupies more
      attention than the original error and shifts focus from the client's
      slighted face to the writer's mental state. The Belgian Bescheiden
      register specifically resists self-centred apology-inflation.
historical_context: |
  Naming-accuracy in correspondence has been a load-bearing courtesy
  since formalised business letter-writing emerged. Pirenne's history of
  the Flemish merchant cities (Geschiedenis van België, deel III–IV)
  documents how the precise written name — in ledgers, in correspondence
  — was the load-bearing trust signal in commercial networks. Goffman
  (Interaction Ritual, 1967) supplies the modern frame: a face-slight
  named and repaired briefly costs less than one ignored.
register: middle_class
phase: 1
level: 1
research_pillar: P1
demographic: common_age_neutral
region_code: BE
lang: en
primary_dimension: diplomacy
secondary_dimension: composure
anchor_primary:
  source: "Goffman, Interaction Ritual (1967)"
  volume_or_chapter: "On Face-Work"
  claim_supported: "named-and-brief repair of small face-slights costs less than ignoring or inflating them"
  anchor_strength: primary
anchor_secondary:
  source: "Goleman, Working with Emotional Intelligence (1998)"
  volume_or_chapter: "Social-skill component"
  claim_supported: "trained-competence form: own slip, name correction, move on"
  anchor_strength: corroborating
historical_anchor_level: A
historical_anchor:
  source: "Henri Pirenne, Geschiedenis van België (deel III–IV, 1900–1932)"
  volume_or_chapter: "Flemish merchant cities and commercial correspondence"
  page_or_section: "passages on ledger-discipline in Bruges, Ghent, Antwerp"
  claim_supported: "precise written name as load-bearing trust signal in Flemish commercial networks"
  anchor_strength: primary
cultural_anchor: "BE_grounding_sheet_v1.0 §local_terms (Bescheiden)"
```

```yaml
# === Common Demographic — Level 1 — Q3: Showing Interest in a Meeting ===
# NOTE: this question tests presence (physical posture), not adaptive
# linguistics. Mild pillar drift — flag at section level, not blocking.
question_text: |
  You are in a meeting and want to show you are listening intently.
  What is your physical stance?
options:
  - text: "Sitting upright, leaning slightly forward, and maintaining consistent eye contact."
    answer_tier: 1
    motivation: |
      Mehrabian's nonverbal-weight findings (1971): posture and eye contact
      carry the bulk of the engagement signal. Forward lean + eye contact
      is the trained presence form Castiglione would call bearing —
      attentive without theatrical, the room reads it as competent
      attention.
  - text: "Constantly taking notes on your phone."
    answer_tier: 2
    motivation: |
      Note-taking signals diligence but the phone-screen breaks the
      Mehrabian eye-contact channel. The room reads phone-down as
      distracted, even when the writer is in fact transcribing. Useful
      with a visible notepad; under-calibrated on a phone.
  - text: "Slouching back in the chair with hands behind your head."
    answer_tier: 3
    motivation: |
      Hands-behind-head + recline is the dominance-display posture
      Mehrabian and Goffman both flag: it signals "above this conversation"
      regardless of substantive engagement. The Belgian middle-class anti-
      pattern Dikke Nek attaches almost on sight.
historical_context: |
  Physical bearing as a trained competence is older than the workplace.
  Castiglione (Cortegiano, 1528, Boek 1) frames bearing as the substrate
  of presence; Mehrabian's twentieth-century empirical work (Silent
  Messages, 1971) quantifies the nonverbal channel as load-bearing for
  engagement-reading. The Belgian middle-class register reads the
  recline-with-hands-behind-head specifically as Dikke Nek display.
register: middle_class
phase: 1
level: 1
research_pillar: P1
demographic: common_age_neutral
region_code: BE
lang: en
primary_dimension: presence
secondary_dimension: attentiveness
anchor_primary:
  source: "Mehrabian, Silent Messages (1971)"
  volume_or_chapter: "Nonverbal weight in engagement-reading"
  claim_supported: "posture and eye contact carry the dominant share of engagement signal"
  anchor_strength: primary
anchor_secondary:
  source: "Castiglione, Il Cortegiano (1528)"
  volume_or_chapter: "Boek 1, bearing as trained art"
  claim_supported: "bearing as substrate of presence"
  anchor_strength: corroborating
historical_anchor_level: B
historical_anchor:
  source: "Mehrabian 1971; Castiglione 1528"
  claim_supported: "bearing and nonverbal posture as trained competences governing engagement-reading"
  anchor_strength: primary
cultural_anchor: "BE_grounding_sheet_v1.0 §anti_patterns (Dikke Nek)"
```

```yaml
# === Common Demographic — Level 1 — Q4: Introducing Yourself ===
question_text: |
  You are at a professional mixer. How do you introduce yourself to a
  stranger?
options:
  - text: "\"Hi, I'm [Name]. I do [job title] at [company]. What brings you here?\""
    answer_tier: 1
    motivation: |
      Goffman's presentation-of-self: a clean self-frame followed by an
      open invitation hands the floor back. The Belgian Bescheiden
      register rewards exactly this combination — own ground stated
      cleanly, status downplayed, attention returned to the other party.
  - text: "Just stand near them and wait for them to ask who you are."
    answer_tier: 2
    motivation: |
      Wait-to-be-asked is the under-presented form: it preserves modesty
      but cedes the framing to the other party, and at a mixer the framing
      is the introduction. Goffman would call this an absent self-frame —
      polite but operationally invisible.
  - text: "\"I am the Lead Director of Global Operations. I've won three awards this year.\""
    answer_tier: 3
    motivation: |
      Title-and-awards opening is the Opscheppen anti-pattern in concentrated
      form: the self-frame occupies the entire opening and crowds out the
      other party. Goffman's reading is unambiguous — this reads as status-
      claim, not as introduction.
historical_context: |
  Self-introduction at the mixer is the Goffman-coded opening performance
  (Presentation of Self, 1959): the audience reads the first frame and
  carries it forward. The Belgian Bescheiden tradition Reynebeau (2003)
  documents specifically rewards understated self-framing — own title
  named cleanly, return of attention to the other — and reads
  Opscheppen openings as immediate status-degraders.
register: middle_class
phase: 1
level: 1
research_pillar: P1
demographic: common_age_neutral
region_code: BE
lang: en
primary_dimension: presence
secondary_dimension: discernment
anchor_primary:
  source: "Goffman, The Presentation of Self in Everyday Life (1959)"
  volume_or_chapter: "Opening performances and audience-reading"
  claim_supported: "the opening self-frame is what the audience carries forward"
  anchor_strength: primary
anchor_secondary:
  source: "Bourdieu, Distinction (1979)"
  volume_or_chapter: "Habitus and class-coded self-framing"
  claim_supported: "understated self-framing as middle-class habitus signal"
  anchor_strength: corroborating
historical_anchor_level: A
historical_anchor:
  source: "Marc Reynebeau, Een geschiedenis van België (2003)"
  volume_or_chapter: "Naoorlogse middenklasse-cultuur"
  page_or_section: "Bescheiden norm and reception of Opscheppen"
  claim_supported: "Belgian middle-class culture rewards Bescheiden self-framing and degrades Opscheppen openings"
  anchor_strength: primary
cultural_anchor: "BE_grounding_sheet_v1.0 §local_terms (Bescheiden), §anti_patterns (Opscheppen)"
```

```yaml
# === Common Demographic — Level 1 — Q5: "I Advise" vs "I Think" ===
question_text: |
  A colleague asks for your opinion on a project direction. How do you
  respond to show authority?
options:
  - text: "\"I advise proceeding with the other way because it aligns with our goals.\""
    answer_tier: 1
    motivation: |
      "Advise" is the consultative register Della Casa's principle would
      identify as the form that matches the act — opinion was asked, the
      verb that fits is the one that takes ownership of the recommendation.
      Goffman: the room reads "advise" as committed expertise, "think" as
      hedged guess.
  - text: "\"I think that maybe we should try the other way.\""
    answer_tier: 2
    motivation: |
      "Think + maybe" is the hedged register — useful for genuinely
      uncertain ground, register-light when expertise is asked for.
      Goffman would note that hedge-stacking signals the speaker is
      lowering own face pre-emptively, which the audience tends to read as
      under-confidence rather than as modesty.
  - text: "\"Do whatever you want, it's not my project.\""
    answer_tier: 3
    motivation: |
      Refusal-of-the-question is the disengaged register: it abdicates the
      role of expert peer that the colleague's question specifically
      offered. The Belgian Onbetrouwbaar anti-pattern attaches over time
      to the colleague who consistently declines to be drawn — a label
      Reynebeau notes is near-irreversible.
historical_context: |
  The advise/think register-distinction is a Della Casa-coded
  conscious-choice (Galateo, 1558): the verb must match the act. The
  consultative "I advise" register entered Belgian middle-class
  professional speech in the twentieth-century rise of the SME advisory
  function — accountancy, notariaat, professional consulting — where the
  advisory verb signalled chargeable expertise distinct from operational
  labour. Goffman (1959) supplies the modern reading: verb-choice is
  load-bearing for audience expertise-attribution.
register: middle_class
phase: 1
level: 1
research_pillar: P1
demographic: common_age_neutral
region_code: BE
lang: en
primary_dimension: presence
secondary_dimension: discernment
anchor_primary:
  source: "Goffman, The Presentation of Self in Everyday Life (1959)"
  volume_or_chapter: "Verb-choice and audience expertise-attribution"
  claim_supported: "audience reads verb-register as direct signal of expertise-claim or hedge"
  anchor_strength: primary
anchor_secondary:
  source: "Della Casa, Il Galateo (1558)"
  volume_or_chapter: "Civility as conscious choice between forms"
  claim_supported: "the verb that fits the act is itself a discipline"
  anchor_strength: corroborating
historical_anchor_level: B
historical_anchor:
  source: "Goffman 1959; Della Casa 1558"
  claim_supported: "verb-register as load-bearing signal of consultative expertise-claim"
  anchor_strength: primary
cultural_anchor: "BE_grounding_sheet_v1.0 §anti_patterns (Onbetrouwbaar)"
```

```yaml
# === Common Demographic — Level 1 — Q6: Handling a Compliment ===
question_text: |
  A peer says, "That was an excellent presentation." How do you respond?
options:
  - text: "\"Thank you, I'm glad you found the data useful. I put a lot of work into the analysis.\""
    answer_tier: 1
    motivation: |
      Goffman's face-work: the compliment is also an offered face-gift.
      Accepting it cleanly + naming the substantive ground returns the
      gift without inflating it. The Belgian Bescheiden register rewards
      exactly this — credit accepted briefly, work named, no Opscheppen.
  - text: "\"It was nothing, I barely prepared.\""
    answer_tier: 2
    motivation: |
      False modesty rejects the face-gift and forces the giver to repeat
      it — Goleman would note this as low-EI, the empathic-accuracy slip
      of treating modesty as the safer option when in fact it requires
      the giver to do more work. Bescheiden taken past its useful range.
  - text: "\"I know, I'm the best at this.\""
    answer_tier: 3
    motivation: |
      Status-claim accepting is the Opscheppen anti-pattern in concentrated
      form. Goffman: the giver receives no return — the gift was claimed
      rather than reciprocated. The Belgian middle-class register reads
      this as Dikke Nek almost on sight, near-impossible to walk back.
historical_context: |
  Compliment-reception is a Goffman-coded face-gift exchange (Interaction
  Ritual, 1967): clean acceptance returns the gift; over-deflection or
  status-claim breaks the exchange. The Belgian Bescheiden tradition
  Reynebeau (2003) documents treats brief acknowledgement-with-substance
  as the load-bearing form, and reads both false-modesty inflation and
  Opscheppen claiming as register-trips that cost peer trust over time.
register: middle_class
phase: 1
level: 1
research_pillar: P1
demographic: common_age_neutral
region_code: BE
lang: en
primary_dimension: diplomacy
secondary_dimension: composure
anchor_primary:
  source: "Goffman, Interaction Ritual (1967)"
  volume_or_chapter: "Face-work and the gift-exchange of compliments"
  claim_supported: "clean compliment-acceptance returns the face-gift; over-deflection or claim breaks the exchange"
  anchor_strength: primary
anchor_secondary:
  source: "Goleman, Emotional Intelligence (1995)"
  volume_or_chapter: "Empathic-accuracy component"
  claim_supported: "false modesty as low-EI move that loads the giver with extra work"
  anchor_strength: corroborating
historical_anchor_level: A
historical_anchor:
  source: "Marc Reynebeau, Een geschiedenis van België (2003)"
  volume_or_chapter: "Naoorlogse middenklasse-cultuur"
  page_or_section: "Bescheiden as the form of credit-acceptance"
  claim_supported: "brief acknowledgement-with-substance as load-bearing form in Belgian middle-class compliment-reception"
  anchor_strength: primary
cultural_anchor: "BE_grounding_sheet_v1.0 §local_terms (Bescheiden), §anti_patterns (Opscheppen, Dikke Nek)"
```

```yaml
# === Common Demographic — Level 1 — Q7: Phone Etiquette in Public ===
question_text: |
  You are in a quiet public space (a train or lobby) and your phone
  rings.
options:
  - text: "Let it go to voicemail, or step outside or to a quiet corner and speak in a lowered tone."
    answer_tier: 1
    motivation: |
      Hall's proxemics: the public-quiet space is shared, and the well-
      formed speaker reads the unwritten contract — calls leave the space
      or use the lowered register. Bourdieu's habitus codes this as the
      automatic move of the well-socialised middle-class user.
  - text: "Answer and tell the person you'll call back in 10 minutes while staying in your seat."
    answer_tier: 2
    motivation: |
      Brief seated answer is workable but breaks the quiet-contract for
      the surrounding passengers — Hall would call this a partial reading
      of the proxemics signal: own urgency registered, ambient quiet not.
      Acceptable for genuine emergencies; under-calibrated for routine
      callbacks.
  - text: "Answer and speak loudly so everyone knows you are busy and important."
    answer_tier: 3
    motivation: |
      Loud public speaking is the BE anti-pattern explicitly named in the
      grounding sheet (Te luide stem) plus Opscheppen layered on. Hall's
      proxemics reading is unambiguous: the quiet-contract is a load-
      bearing public norm, and breaking it costs ambient peer trust well
      beyond the call's recipients.
historical_context: |
  Public-arena quiet-norms are the Belgian middle-class codification of
  Hall's proxemics (Hidden Dimension, 1966) for shared transport and
  lobbies. The BE grounding sheet names "loud voice in restaurants and
  transit" as a cultural anti-pattern — De Cauter's analysis of Brussels
  urbanity (Entropic Empire) sketches the high-density-living substrate
  that made the quiet-contract load-bearing in the first place.
register: middle_class
phase: 1
level: 1
research_pillar: P1
demographic: common_age_neutral
region_code: BE
lang: en
primary_dimension: discernment
secondary_dimension: presence
anchor_primary:
  source: "Edward T. Hall, The Hidden Dimension (1966)"
  volume_or_chapter: "Proxemics and the public-quiet contract"
  claim_supported: "shared public spaces carry an unwritten quiet-contract that the well-formed user reads automatically"
  anchor_strength: primary
anchor_secondary:
  source: "Bourdieu, Distinction (1979)"
  volume_or_chapter: "Habitus as automatic public-norm reading"
  claim_supported: "well-socialised middle-class habitus auto-reads public quiet-norms"
  anchor_strength: corroborating
historical_anchor_level: B
historical_anchor:
  source: "Lieven De Cauter, Entropic Empire; Hall 1966"
  claim_supported: "Belgian high-density-urban substrate making the public quiet-contract load-bearing"
  anchor_strength: corroborating
cultural_anchor: "BE_grounding_sheet_v1.0 §anti_patterns (Te luide stem, Opscheppen)"
```

```yaml
# === Common Demographic — Level 1 — Q8: The Dress Code "Smart Casual" ===
# NOTE: this question tests sartorial discernment, not linguistic skill.
# Mild pillar drift — flag at section level. Tier ranking kept as source.
question_text: |
  You are going to a Friday office lunch. The code is "Smart Casual."
options:
  - text: "Dark jeans or chinos with a crisp shirt and clean shoes."
    answer_tier: 1
    motivation: |
      Bourdieu's distinction-by-habitus: the Smart Casual code is read,
      not literal. The dark-jeans + crisp-shirt + clean-shoes triad hits
      the Verzorgd middle-class register — composed without trying, the
      automatic read of someone who decoded the unwritten part.
  - text: "A suit with no tie."
    answer_tier: 2
    motivation: |
      Suit-no-tie over-reads the formal anchor and under-reads the casual
      modulator. The room registers it as not-quite-comfortable-with-the-
      code — over-careful rather than miscalibrated. Workable in the more
      formal end of Smart Casual; over-dressed for Friday lunch.
  - text: "A track suit because it's Friday."
    answer_tier: 3
    motivation: |
      Track suit reads Smart Casual as licence rather than as code.
      Bourdieu: this is the misread of the unwritten layer, where the
      casual modifier is treated as the dominant signal. The Belgian
      middle-class Verzorgd norm specifically rejects this register-
      collapse.
historical_context: |
  Smart Casual is the Bourdieu-coded register-reading exercise par
  excellence (Distinction, 1979): the unwritten layer is what the well-
  formed reader decodes, the literal layer is what the under-formed reader
  follows. Reynebeau's account of Belgian post-war professional culture
  documents how the Verzorgd register — composed, neither showy nor
  careless — became the load-bearing middle-class daily form.
register: middle_class
phase: 1
level: 1
research_pillar: P1
demographic: common_age_neutral
region_code: BE
lang: en
primary_dimension: discernment
secondary_dimension: presence
anchor_primary:
  source: "Bourdieu, Distinction (1979)"
  volume_or_chapter: "Reading the unwritten layer of dress codes"
  claim_supported: "well-formed habitus reads the unwritten modulator of dress codes; under-formed reads the literal layer"
  anchor_strength: primary
historical_anchor_level: A
historical_anchor:
  source: "Marc Reynebeau, Een geschiedenis van België (2003)"
  volume_or_chapter: "Naoorlogse middenklasse-cultuur"
  page_or_section: "Verzorgd as middle-class daily register"
  claim_supported: "Verzorgd composed-without-effort form as the load-bearing post-war middle-class register"
  anchor_strength: primary
cultural_anchor: "BE_grounding_sheet_v1.0 §local_terms (Verzorgd)"
```

```yaml
# === Common Demographic — Level 1 — Q9: Entering a Conversation ===
question_text: |
  You see two colleagues talking at a coffee machine and want to join.
options:
  - text: "Stand a few feet away, wait for eye contact, and then step in."
    answer_tier: 1
    motivation: |
      Goffman's interaction ritual: the existing pair is a closed frame;
      eye contact is the invitation that opens it. Hall's proxemics
      supplies the distance — close enough to be available, far enough
      to be reading the signal rather than imposing.
  - text: "Just stand right between them and wait for them to stop talking."
    answer_tier: 2
    motivation: |
      Standing-between-them physically breaks the pair-frame before they
      have invited the break. Hall's proxemics flags this as a personal-
      distance violation; Goffman flags it as a forced frame-shift. The
      colleagues will accommodate, but the entry has cost peer trust.
  - text: "Interrupt them mid-sentence with your own story."
    answer_tier: 3
    motivation: |
      Verbal interruption is the most direct frame-break Goffman catalogues:
      the existing conversation is overwritten by the entrant's content
      before any invitation. The Belgian middle-class register reads this
      as Dikke Nek-adjacent — own-priority projected over peer time.
historical_context: |
  Joining an existing conversation is a Goffman-coded frame-entry
  (Interaction Ritual, 1967): the existing frame is closed until an
  invitation opens it. Hall (Hidden Dimension, 1966) supplies the
  proxemics layer — distance and orientation are the pre-verbal channel
  that signals readiness-to-be-invited. The Belgian Verzorgd register
  treats wait-for-eye-contact as automatic, not as deference.
register: middle_class
phase: 1
level: 1
research_pillar: P1
demographic: common_age_neutral
region_code: BE
lang: en
primary_dimension: attentiveness
secondary_dimension: presence
anchor_primary:
  source: "Goffman, Interaction Ritual (1967)"
  volume_or_chapter: "Frame-entry and the closed-pair frame"
  claim_supported: "existing conversational frames are closed until invitation; eye contact is the invitation channel"
  anchor_strength: primary
anchor_secondary:
  source: "Edward T. Hall, The Hidden Dimension (1966)"
  volume_or_chapter: "Proxemics: personal vs social distance"
  claim_supported: "pre-verbal distance/orientation as the channel signalling readiness-to-be-invited"
  anchor_strength: corroborating
historical_anchor_level: B
historical_anchor:
  source: "Goffman 1967; Hall 1966"
  claim_supported: "frame-entry through eye-contact + appropriate distance as the trained competence"
  anchor_strength: primary
cultural_anchor: "BE_grounding_sheet_v1.0 §local_terms (Verzorgd), §anti_patterns (Dikke Nek)"
```

```yaml
# === Common Demographic — Level 1 — Q10: Ending a Professional Call ===
question_text: |
  You are finishing a call with a client. How do you leave a lasting
  reliability impression?
options:
  - text: "\"Thank you for your time. I will send the follow-up email by tomorrow morning. Have a great day.\""
    answer_tier: 1
    motivation: |
      Goffman's closing-ritual: the call's last frame compresses what
      comes next into memory. The thanks + named follow-up + clean close
      is the trained form — Bolton would call it the collaborate-mode
      closing, where the next step is concrete and the relationship is
      visibly carried forward.
  - text: "\"Okay, bye!\" and hang up immediately."
    answer_tier: 2
    motivation: |
      The abrupt close gets off the phone but leaves the closing-frame
      empty. Goffman's reading: empty closes don't compress — the call
      ends without the last impression that the form specifically allows
      for. Workable for known peers; under-calibrated for clients.
  - text: "Keep talking for another 10 minutes about your personal life."
    answer_tier: 3
    motivation: |
      Over-personal closing breaks the Private/Business boundary the call
      established. Bourdieu would note that the boundary itself is a
      habitus signal — the well-formed professional reads when the work-
      frame has closed. Belgian Bescheiden specifically treats over-
      personalisation as a register-trip.
historical_context: |
  Professional call-closings are Goffman-coded ritual closings (Interaction
  Ritual, 1967): the last frame compresses the relationship's reading
  forward in time. Pirenne's history of Belgian commercial correspondence
  (Geschiedenis van België, deel III–IV) documents how the formalised
  closing remark — thanks, named next step, brief sign-off — replaced the
  open-ended conversational close as commerce scaled across cities and
  required reliable hand-offs.
register: middle_class
phase: 1
level: 1
research_pillar: P1
demographic: common_age_neutral
region_code: BE
lang: en
primary_dimension: diplomacy
secondary_dimension: discernment
anchor_primary:
  source: "Goffman, Interaction Ritual (1967)"
  volume_or_chapter: "Closing rituals and frame-compression"
  claim_supported: "the closing frame compresses the relationship's reading forward in time"
  anchor_strength: primary
anchor_secondary:
  source: "Bolton, People Skills (1979)"
  volume_or_chapter: "Collaborate-mode closing form"
  claim_supported: "named next step + clean close as the collaborate-mode closing"
  anchor_strength: corroborating
historical_anchor_level: A
historical_anchor:
  source: "Henri Pirenne, Geschiedenis van België (deel III–IV, 1900–1932)"
  volume_or_chapter: "Commercial correspondence in scaling Flemish cities"
  page_or_section: "passages on formalised commercial closings"
  claim_supported: "formalised closing form replaced open-ended close as commerce scaled and reliable hand-offs became load-bearing"
  anchor_strength: primary
cultural_anchor: "BE_grounding_sheet_v1.0 §local_terms (Bescheiden, Verzorgd)"
```

---

## Session summary

### Count
- **Reworked:** 10/10
- **Flagged:** 0 (all `question_text` valid per §5.2)
- **Internal pillar-drift notes (not blocking):** Q3 (posture = presence, not linguistic) and Q8 (sartorial = discernment, not linguistic). Both are kept here because the Common section's stated focus already extends "deliberate word choice" toward register-reading more broadly. Tag for review at section-level when full file is rebuilt.
- **Niveau-A anchors used:** 6 (Q1, Q2, Q4, Q6, Q8, Q10 — Reynebeau or Pirenne with chapter/section)
- **Niveau-B anchors used:** 4 (Q3, Q5, Q7, Q9 — universal canon, no specific BE historical claim made)

### Anchor distribution
- Goffman: 6 primary (Q2, Q4, Q5, Q6, Q9, Q10) — heavy, but L1 is the level where face-work and frame-reading are the foundational mechanics; coherent
- Bourdieu: 1 primary (Q8), 4 secondary — habitus backbone
- Della Casa: 1 primary (Q1), 2 secondary — register-discipline
- Hall: 1 primary (Q7), 1 secondary (Q9) — proxemics
- Mehrabian: 1 primary (Q3) — nonverbal weight
- Goleman: 2 secondary (Q2, Q6) — social skill
- Castiglione: 1 secondary (Q3) — bearing
- Bolton: 1 secondary (Q10) — collaborate mode
- Reynebeau: 4 historical anchors (Q1, Q4, Q6, Q8) — middle-class register history
- Pirenne: 2 historical anchors (Q2, Q10) — Flemish commercial history

Goffman at 6/10 primary is on the upper edge of healthy; on review, this is L1 *Foundation*-coherent — most foundational social mechanics are face-work-coded — but worth re-checking when L2 and L3 of the same demographic come through. If Goffman remains 60%+ across the demographic, dimension-tagging needs a re-look.

### Dimension distribution (primary)
- discernment: Q1, Q7, Q8 (3)
- diplomacy: Q2, Q6, Q10 (3)
- presence: Q3, Q4, Q5 (3)
- attentiveness: Q9 (1)
- composure: 0

L1 has no composure questions in the source — composure-under-pressure is L4/L5 territory. Acceptable.

### Open questions

1. **The pillar-drift notes on Q3 and Q8.** Section's stated scope ("deliberate word choice ... protecting reputation through linguistic precision") arguably stretches to cover them. Confirm this stretch is the intended scope, or flag for relocation to a presence/discernment-coded sub-track.
2. **HCs that the source attributed to oddly-specific BE locations** (Antwerp ports, Liège merchant societies, parish brass bands). I replaced un-anchorable specifics with Pirenne or Reynebeau-anchored claims at chapter level, never inventing pages. Confirm this anchor-density is what you want, or whether you prefer Niveau-B fallback when a specific page can't be promised.
3. **Goffman density** in this Level — flagged above. Decision deferred to after L2/L3 same-demographic data point.

### Next top-down step
Same demographic, **Level 2: The Social Arena** — lines **230–451** in source (Q1–Q10).