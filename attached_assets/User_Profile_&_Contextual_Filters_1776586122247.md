# Database Schema: User Profile & Contextual Filters

## 1. Gender Dynamics
- **ID:** `GEN_001`
- **Field: Interaction_Rules**
  - *M_to_M:* Rules for men interacting with men.
  - *M_to_V:* Rules for men interacting with women.
  - *V_to_V:* Rules for women interacting with women.
  - *V_to_M:* Rules for women interacting with men.
  - *X_Protocol:* Guidelines for non-binary or gender-neutral interactions.

## 2. Age Brackets (Life Stages)
- **ID:** `AGE_002`
- **Field: Youth_Expectations (0-18)**
  - *Focus:* Respect for elders, basic table manners, learning phase.
- **Field: Active_Adult (19-65)**
  - *Focus:* Business etiquette, social climbing, networking, romantic etiquette.
- **Field: Senior_Status (65+)**
  - *Focus:* Receiving respect, traditionalism, authority roles.

## 3. The "Upgrade" Levels (Monetization)
- **ID:** `LVL_003`
- **Field: Level_Access**
  - *Free:* General "Survival" etiquette (Airport, basic street behavior).
  - *Premium:* "Socialite" level (Dinners, weddings, basic business).
  - *Elite:* "Diplomat" level (High-society, complex negotiations, royal protocols).