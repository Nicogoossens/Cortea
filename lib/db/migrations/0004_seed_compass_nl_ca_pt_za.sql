-- Migration: Seed missing ACTIVE_REGIONS — NL, CA, PT, ZA
-- Applied: 2026-04-27
-- Context: 17 priority countries were seeded in the original compass seed run,
--          but NL (one of the original three), CA, PT, and ZA were present in
--          frontend ACTIVE_REGIONS without matching is_published=true DB rows.
--          This migration adds en-GB etiquette content for all four and marks
--          them as is_published=true so they appear in the Cultural Compass.

UPDATE compass_regions
SET
  is_published = true,
  content = content || '{
    "en-GB": {
      "region_name": "Netherlands",
      "core_value": "Directness, equality, and pragmatism above all else",
      "biggest_taboo": "Pretension, status-flaunting, or evasive communication",
      "dining_etiquette": "Punctuality is expected; going Dutch on costs is entirely normal. Hosts serve a fixed menu; compliments should be sincere and brief. Finish your plate — wasting food is considered disrespectful.",
      "language_notes": "Dutch is the official language; English is spoken near-universally. Blunt, direct communication is a mark of respect rather than rudeness — do not mistake candour for hostility.",
      "gift_protocol": "Modest, practical gifts are appropriate. Wine or flowers (not chrysanthemums) suit social visits. Gifts are opened immediately upon receipt.",
      "dress_code": "Smart casual is the standard across most settings. Business attire is conservative and understated. Ostentatious displays of wealth are viewed with mild contempt.",
      "dos": ["Be direct and honest — circumlocution is considered impolite", "Arrive precisely on time for all appointments", "Engage in substantive, issue-focused conversation", "Respect personal space and established queuing etiquette"],
      "donts": ["Flaunt wealth, status, or luxury goods", "Be evasive, ambiguous, or overly diplomatic", "Expect ceremonial formality in routine meetings", "Leave food on your plate at a hosted dinner"]
    }
  }'::jsonb
WHERE region_code = 'NL';

UPDATE compass_regions
SET
  is_published = true,
  content = content || '{
    "en-GB": {
      "region_name": "Canada",
      "core_value": "Politeness, inclusivity, and genuine multicultural openness",
      "biggest_taboo": "Mistaking Canadians for Americans; imposing cultural assumptions on a diverse society",
      "dining_etiquette": "Business dining is convivial and unhurried. Tipping 15-20% is standard and expected. Sharing and open conversation at the table are common. Regional specialities vary widely.",
      "language_notes": "English and French are both official languages. In Quebec, French is primary and its use signals cultural respect. Bilingual awareness is greatly appreciated.",
      "gift_protocol": "Modest gifts are welcomed. Wine, quality chocolates, or regional specialities are appropriate. Avoid lavish corporate gifting.",
      "dress_code": "Smart casual to business formal, depending on sector and city. Dress with regional awareness.",
      "dos": ["Acknowledge the bilingual, bicultural character of the country", "Hold doors open and apologise readily", "Queue properly and allow others to merge in traffic", "Show genuine interest in regional identity"],
      "donts": ["Confuse Canadian customs with American ones", "Reduce Canada to stereotypes about cold weather or hockey", "Adopt an aggressive, transactional negotiating posture", "Ignore the significant cultural weight of Indigenous heritage"]
    }
  }'::jsonb
WHERE region_code = 'CA';

UPDATE compass_regions
SET
  is_published = true,
  content = content || '{
    "en-GB": {
      "region_name": "Portugal",
      "core_value": "Saudade — a poetic longing for the beautiful; warmth, loyalty, and endurance",
      "biggest_taboo": "Rushing relationships; treating the Portuguese as merely Spanish-adjacent",
      "dining_etiquette": "Meals are long, sociable, and taken seriously. Bacalhau (salt cod) is a national institution. Sharing dishes is expected. Wine and port are integral to the table.",
      "language_notes": "Portuguese is the language of pride; Spanish is understood but use it judiciously. Formal address (Senhor / Senhora) signals respect in first encounters.",
      "gift_protocol": "Local produce, wine, or thoughtfully chosen gifts resonate. Overly corporate gifting feels cold; personal thoughtfulness is far more valued.",
      "dress_code": "Conservative and presentable in business contexts. Stylish informality in social settings. The Portuguese dress with quiet pride.",
      "dos": ["Invest in personal rapport before raising business matters", "Show genuine curiosity about Portuguese history, literature, and Fado", "Accept hospitality graciously and reciprocate in kind", "Be patient — relationships and decisions mature at their own rhythm"],
      "donts": ["Compare Portugal unfavourably to Spain", "Rush through pleasantries to reach the transaction", "Decline offered food or drink without a sincere apology", "Raise sensitive historical topics without established trust"]
    }
  }'::jsonb
WHERE region_code = 'PT';

UPDATE compass_regions
SET
  is_published = true,
  content = content || '{
    "en-GB": {
      "region_name": "South Africa",
      "core_value": "Ubuntu — a person is a person through other people; communal warmth and resilience",
      "biggest_taboo": "Racial insensitivity or assumptions based on appearance; ignoring South Africa layered complexity",
      "dining_etiquette": "The braai (barbecue) is a cultural institution and near-sacred social ritual. Meals are communal, unhurried, and generous. Refusing hospitality without cause is considered impolite.",
      "language_notes": "South Africa has 11 official languages; English serves as the business lingua franca. Learning even a few words of Zulu or Xhosa is received with extraordinary warmth.",
      "gift_protocol": "Practical gifts or quality local crafts are appreciated. Visiting a home warrants bringing something. The gesture matters more than the value.",
      "dress_code": "Smart casual in major city business contexts. More conservative attire for traditional communities and formal occasions. Climate varies dramatically by region.",
      "dos": ["Embrace the Ubuntu spirit: communal engagement and warmth open all doors", "Show authentic curiosity about South Africa cultural and linguistic diversity", "Invest in relationship-building before pursuing business objectives", "Learn a few words of a local language"],
      "donts": ["Make assumptions tied to race, ethnicity, or background", "Reduce South Africa to its political challenges or crime statistics", "Behave with cold formality where warmth is the expected register", "Treat negotiations as purely transactional — trust precedes business here"]
    }
  }'::jsonb
WHERE region_code = 'ZA';
