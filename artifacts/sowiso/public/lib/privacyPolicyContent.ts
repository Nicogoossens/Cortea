export interface PolicyTable {
  headers: string[];
  rows: string[][];
}

export interface PolicySubsection {
  id: string;
  title: string;
  body: string;
  list?: string[];
  note?: string;
}

export interface PolicySection {
  id: string;
  title: string;
  body?: string;
  list?: string[];
  table?: PolicyTable;
  note?: string;
  subsections?: PolicySubsection[];
  howToRequest?: string;
}

export interface PolicyMeta {
  title: string;
  version: string;
  effectiveDateLabel: string;
  effectiveDateValue: string;
  responsibleLabel: string;
  responsibleValue: string;
  supervisorLabel: string;
  supervisorValue: string;
  placeholderNote: string;
}

export interface PolicyContent {
  meta: PolicyMeta;
  sections: PolicySection[];
}

const PLACEHOLDER = "[to be filled in]";
const PLACEHOLDER_NL = "[invullen]";
const PLACEHOLDER_DE = "[einzutragen]";
const PLACEHOLDER_FR = "[à compléter]";
const PLACEHOLDER_ES = "[por completar]";
const PLACEHOLDER_IT = "[da compilare]";
const PLACEHOLDER_PT = "[a preencher]";
const PLACEHOLDER_JA = "[記入予定]";
const PLACEHOLDER_AR = "[يتعين تعبئته]";

export const policyContentEN: PolicyContent = {
  meta: {
    title: "Privacy Policy — Cortéa",
    version: "Version: 1.0",
    effectiveDateLabel: "Date of effect:",
    effectiveDateValue: PLACEHOLDER,
    responsibleLabel: "Controller:",
    responsibleValue: `[Company Name / Name], [Address], [Email]`,
    supervisorLabel: "Supervisory Authority:",
    supervisorValue: "Data Protection Authority (GBA) — www.gegevensbeschermingsautoriteit.be",
    placeholderNote: "Fields marked with ★ are legal placeholders that must still be completed before publication.",
  },
  sections: [
    {
      id: "s1",
      title: "1. Introduction and Identity of the Controller",
      body: `Cortéa ("we", "us", "the app") is a platform for cultural intelligence and etiquette training. It helps users understand and apply social norms, communication behaviours, and cultural customs in an international context.\n\nThe controller within the meaning of the General Data Protection Regulation (GDPR) is:`,
      note: `★ [Company Name]\n[Address]\n[Postcode, City, Country]\nE-mail: [privacy@cortea.app]\nKBO/VAT number: ${PLACEHOLDER}`,
      body2: "For all questions, requests, or complaints regarding your personal data, please contact us at the above email address.",
    } as PolicySection & { body2: string },
    {
      id: "s2",
      title: "2. Scope",
      body: "This privacy policy applies to:",
      list: [
        "The use of the Cortéa web application and any future mobile versions;",
        "All services offered via cortea.app;",
        "The processing of personal data of visitors, registered users, and subscribers.",
      ],
      note: "This policy does not apply to external websites or services to which Cortéa may refer.",
    },
    {
      id: "s3",
      title: "3. What Personal Data Do We Process?",
      subsections: [
        {
          id: "s3-1",
          title: "3.1 Account Data",
          body: "At registration we collect:",
          list: [
            "Email address (required, serves as unique identifier)",
            "Full name (optional, only if provided by the user)",
            "Year of birth (optional, for contextual personalisation)",
            "Gender identity (optional, voluntarily provided)",
            "Verification token and expiry date (temporary, for email verification via magic link)",
            "Session token (server-side stored, for authentication)",
          ],
        },
        {
          id: "s3-2",
          title: "3.2 Usage Data and Progress",
          body: "During use of Cortéa we process:",
          list: [
            "Noble Score and score histories (points per scenario, level-up events)",
            "Scenario answers (which choices you made per practice situation)",
            "Active region (the cultural area you set as context)",
            "Language preference (your UI language from 9 available languages)",
            "Activity timestamps",
          ],
        },
        {
          id: "s3-3",
          title: "3.3 Behavioural Profile (Behavioral Intelligence Layer)",
          body: `Cortéa contains an invisible behavioural intelligence layer that builds additional insights based on your answers. This layer works entirely in the background and only shows results in etiquette language — never in psychological or clinical terminology.\n\nSpecifically we process:`,
          list: [
            "Bolton clusters (attentiveness to others, assertiveness style, conflict approach) — derived from pattern recognition in your scenario answers;",
            "Non-verbal awareness score (based on the Mehrabian model for 18 cultural regions);",
            "EQ dimensions (Attentiveness, Composure, Discernment, Diplomacy, Presence) — displayed as the 'Refinement Compass' in your profile;",
            "Correction style: when you answer a scenario incorrectly, the system stores the associated mentor style to personalise guidance.",
          ],
          note: "Important: this data is used solely for personal guidance within the app. It is never shared with third parties, never used for advertising, and never analysed outside the context of your personal progress.",
        },
        {
          id: "s3-4",
          title: "3.4 Communication Data",
          list: [
            "Conversations with The Counsel (AI etiquette adviser) — processed temporarily to generate responses; content is not structurally stored unless otherwise stated;",
            "Emails for magic-link authentication.",
          ],
        },
        {
          id: "s3-5",
          title: "3.5 Technical Data",
          list: [
            "IP address (temporary, for region detection — not persistently stored unless the user confirms the region);",
            "Browser type and version (via standard HTTP headers);",
            "Time zone.",
          ],
        },
      ],
    },
    {
      id: "s4",
      title: "4. Legal Basis for Processing",
      body: "We process your personal data on the basis of the following legal grounds (Art. 6 GDPR):",
      table: {
        headers: ["Processing Activity", "Legal Basis"],
        rows: [
          ["Account management and authentication", "Performance of contract (Art. 6.1.b)"],
          ["Noble Score and progress management", "Performance of contract (Art. 6.1.b)"],
          ["Behavioural profile (Bolton/Mehrabian)", "Legitimate interest — service quality improvement (Art. 6.1.f)"],
          ["Counsel AI interactions", "Performance of contract (Art. 6.1.b)"],
          ["Billing and subscription management", "Legal obligation + performance of contract (Art. 6.1.b and 6.1.c)"],
          ["Region detection via IP", "Legitimate interest — service personalisation (Art. 6.1.f)"],
          ["Marketing communications", "Consent (Art. 6.1.a) — only if you have subscribed"],
        ],
      },
    },
    {
      id: "s5",
      title: "5. How Do We Use Your Data?",
      body: "We use your personal data exclusively for:",
      list: [
        "Providing the service — access to Atelier, Counsel, and Cultural Compass;",
        "Personalisation — tailoring scenarios, guidance, and insights to your profile and region;",
        "Progress management — tracking your Noble Score, domain mastery, and learning history;",
        "Subscription and payment management — processing your subscription tier via our payment provider;",
        "Technical operation — authentication, session management, and security;",
        "Service improvement — anonymised or aggregated analysis of usage patterns.",
      ],
      note: "We never use your data for: targeted advertising to you or third parties; selling or renting your data; profiling outside the context of your etiquette training; automated decision-making with legal effects (Art. 22 GDPR).",
    },
    {
      id: "s6",
      title: "6. Automated Processing and Profiling",
      body: `Cortéa uses automated analysis of your answer patterns to build your behavioural profile. This falls under the definition of profiling within the meaning of Art. 4(4) GDPR.\n\nWe confirm that:`,
      list: [
        "This profiling has no legal effects for you;",
        "It serves exclusively to improve your personal learning experience;",
        "You have the right to object to this profiling (see Section 9);",
        "All derived profile insights are visible only to yourself.",
      ],
    },
    {
      id: "s7",
      title: "7. Third-Party Transfers and International Transfers",
      subsections: [
        {
          id: "s7-1",
          title: "7.1 Processors",
          body: "We use the following categories of processors:",
          list: [
            "Hosting provider — Replit Inc. (US). Data is processed on servers that may be located outside the EEA. Replit is subject to standard contractual clauses (SCC) pursuant to Art. 46 GDPR.",
            "AI service provider — Anthropic PBC (US), for processing Counsel interactions. Transfer on the basis of SCC.",
            "Payment processor — Stripe Inc. (US) and/or Mollie B.V. (NL) for subscription payments. Processing in accordance with PCI-DSS and GDPR.",
            "Email provider — for sending magic-link authentication emails.",
          ],
        },
        {
          id: "s7-2",
          title: "7.2 No Sale of Data",
          body: "We do not sell, rent, or trade your personal data to third parties.",
        },
        {
          id: "s7-3",
          title: "7.3 Legal Obligations",
          body: "In exceptional cases we may be required to provide personal data by virtue of a legal order or court ruling.",
        },
      ],
    },
    {
      id: "s8",
      title: "8. Retention Periods",
      table: {
        headers: ["Data Type", "Retention Period"],
        rows: [
          ["Account data (active account)", "For as long as the account is active"],
          ["Account data after deletion", "Maximum 30 days (backup retention)"],
          ["Noble Score log and progress", "For as long as the account is active"],
          ["Behavioural profile", "For as long as the account is active; deleted upon account deletion"],
          ["Counsel conversation content", "Not structurally stored (stateless per session)"],
          ["Verification tokens", `Expire automatically after ${PLACEHOLDER}`],
          ["Session tokens", `Expire after ${PLACEHOLDER} of inactivity`],
          ["Billing data", "7 years (statutory accounting obligation)"],
          ["IP address for region detection", "Not persistently stored unless user confirms region"],
        ],
      },
    },
    {
      id: "s9",
      title: "9. Your Rights as a Data Subject",
      body: "Under the GDPR you have the following rights:",
      subsections: [
        {
          id: "s9-1",
          title: "9.1 Right of Access (Art. 15)",
          body: "You may request which personal data we process about you and receive a copy.",
        },
        {
          id: "s9-2",
          title: "9.2 Right to Rectification (Art. 16)",
          body: "You may have incorrect or incomplete data corrected via your profile page or via us.",
        },
        {
          id: "s9-3",
          title: "9.3 Right to Erasure ('Right to be Forgotten') (Art. 17)",
          body: "You may delete your account and all associated data. This includes: Noble Score log, behavioural profile, Atelier progress, and personal data. Billing data is retained for as long as legally required.\n\nIn the app: Profile → Account & Danger Zone → Delete account",
        },
        {
          id: "s9-4",
          title: "9.4 Right to Restriction of Processing (Art. 18)",
          body: "In certain circumstances you may request that the processing of your data be temporarily restricted.",
        },
        {
          id: "s9-5",
          title: "9.5 Right to Data Portability (Art. 20)",
          body: "You may request a structured, machine-readable export of your data.",
        },
        {
          id: "s9-6",
          title: "9.6 Right to Object (Art. 21)",
          body: "You may object to processing based on legitimate interest, including behavioural profiling. After objection we will cease the relevant processing unless compelling justified grounds are present.",
        },
        {
          id: "s9-7",
          title: "9.7 Right to Withdraw Consent (Art. 7.3)",
          body: "If processing is based on consent (e.g. marketing emails), you may withdraw this consent at any time without giving reasons.",
        },
      ],
      howToRequest: `Send an email to [privacy@cortea.app] stating your name, email address, and the type of request. We respond within 30 calendar days.`,
    },
    {
      id: "s10",
      title: "10. Security",
      body: "We take appropriate technical and organisational measures to protect your data:",
      list: [
        "Passwordless authentication — magic-link system eliminates risks of leaked passwords;",
        "Session tokens server-side — tokens are not stored in the browser as plaintext;",
        "HTTPS/TLS — all communication is encrypted;",
        "Access restriction — only authorised personnel have access to production data;",
        "Cascading deletion — upon account deletion all linked data is atomically deleted.",
      ],
      note: "In the event of a data breach that poses risks to your rights and freedoms, we will inform the Data Protection Authority within 72 hours (Art. 33 GDPR) and personally notify you if necessary (Art. 34 GDPR).",
    },
    {
      id: "s11",
      title: "11. Cookies and Local Storage",
      body: "Cortéa uses:",
      list: [
        "Session cookies — strictly necessary for authentication and session functionality;",
        "Functional storage — for language preferences and UI settings.",
      ],
      note: "We do not use tracking cookies, advertising cookies, or cross-site analytics.",
    },
    {
      id: "s12",
      title: "12. Minors",
      body: "Cortéa is not directed at persons under the age of 16. We do not knowingly collect personal data from minors. If you suspect that a minor has created an account, we ask you to contact us.",
    },
    {
      id: "s13",
      title: "13. Complaints",
      body: "If you believe that we are not processing your personal data correctly, you may lodge a complaint with:",
      note: `Data Protection Authority (GBA)\nDrukpersstraat 35, 1000 Brussels\ncontact@apd-gba.be | www.gegevensbeschermingsautoriteit.be\n\nWe would, however, appreciate it if you first contact us so we can resolve any issues directly.`,
    },
    {
      id: "s14",
      title: "14. Changes to This Privacy Policy",
      body: "We may periodically update this privacy policy. For material changes we will notify you by email or via a notification in the app. The date of the most recent update appears at the top of this document.",
    },
    {
      id: "s15",
      title: "15. Contact Details",
      note: `★ [Company Name]\nE-mail: [privacy@cortea.app]\nWebsite: [cortea.app/privacy]`,
      body: "For all questions about this privacy policy or your personal data:",
    },
  ],
};

export const policyContentNL: PolicyContent = {
  meta: {
    title: "Privacybeleid — Cortéa",
    version: "Versie: 1.0",
    effectiveDateLabel: "Datum van inwerkingtreding:",
    effectiveDateValue: PLACEHOLDER_NL,
    responsibleLabel: "Verwerkingsverantwoordelijke:",
    responsibleValue: `[Bedrijfsnaam / Naam], [Adres], [E-mail]`,
    supervisorLabel: "Toezichthouder:",
    supervisorValue: "Gegevensbeschermingsautoriteit (GBA) — www.gegevensbeschermingsautoriteit.be",
    placeholderNote: "Velden gemarkeerd met ★ zijn juridische placeholders die nog ingevuld moeten worden vóór publicatie.",
  },
  sections: [
    {
      id: "s1",
      title: "1. Inleiding en identiteit van de verwerkingsverantwoordelijke",
      body: `Cortéa ("wij", "ons", "de app") is een platform voor culturele intelligentie en etiquettetraining. Het helpt gebruikers omgangsvormen, communicatiegedrag en culturele gewoontes te begrijpen en toe te passen in een internationale context.\n\nDe verwerkingsverantwoordelijke in de zin van de Algemene Verordening Gegevensbescherming (AVG/GDPR) is:`,
      note: `★ [Bedrijfsnaam]\n[Adres]\n[Postcode, Stad, Land]\nE-mail: [privacy@cortea.app]\nKBO/BTW-nummer: ${PLACEHOLDER_NL}`,
      body2: "Voor alle vragen, verzoeken of klachten met betrekking tot uw persoonsgegevens kunt u ons bereiken via bovenstaand e-mailadres.",
    } as PolicySection & { body2: string },
    {
      id: "s2",
      title: "2. Toepassingsgebied",
      body: "Dit privacybeleid is van toepassing op:",
      list: [
        "Het gebruik van de Cortéa-webapplicatie en eventuele toekomstige mobiele versies;",
        "Alle diensten aangeboden via cortea.app;",
        "De verwerking van persoonsgegevens van bezoekers, geregistreerde gebruikers en abonnees.",
      ],
      note: "Dit beleid is niet van toepassing op externe websites of diensten waarnaar Cortéa eventueel verwijst.",
    },
    {
      id: "s3",
      title: "3. Welke persoonsgegevens verwerken wij?",
      subsections: [
        {
          id: "s3-1",
          title: "3.1 Accountgegevens",
          body: "Bij registratie verzamelen wij:",
          list: [
            "E-mailadres (verplicht, dient als unieke identifier)",
            "Volledige naam (optioneel, enkel indien ingevuld door de gebruiker)",
            "Geboortejaar (optioneel, voor contextuele personalisatie)",
            "Genderidentiteit (optioneel, vrijwillig opgegeven)",
            "Verificatietoken en vervaldatum (tijdelijk, voor e-mailverificatie via magic link)",
            "Sessietoken (server-side opgeslagen, voor authenticatie)",
          ],
        },
        {
          id: "s3-2",
          title: "3.2 Gebruiksgegevens en voortgang",
          body: "Tijdens het gebruik van Cortéa verwerken wij:",
          list: [
            "Noble Score en scoreverlopen (punten per scenario, level-up events)",
            "Scenario-antwoorden (welke keuzes u maakte per oefensituatie)",
            "Actieve regio (het culturele gebied dat u als context instelt)",
            "Taalvoorkeur (uw UI-taal uit de 9 beschikbare talen)",
            "Tijdstempels van activiteit",
          ],
        },
        {
          id: "s3-3",
          title: "3.3 Gedragsprofiel (Behavioral Intelligence Layer)",
          body: `Cortéa bevat een onzichtbare gedragsintelligentie-laag die aanvullende inzichten opbouwt op basis van uw antwoorden. Deze laag werkt volledig in de achtergrond en toont uitsluitend resultaten in etiquettetaal — nooit in psychologische of klinische terminologie.\n\nConcreet verwerken wij:`,
          list: [
            "Bolton-clusters (aandacht voor anderen, assertiviteitsstijl, conflictbenadering) — afgeleid uit patroonherkenning in uw scenario-antwoorden;",
            "Nonverbale bewustzijnsscore (gebaseerd op het Mehrabian-model voor 18 culturele regio's);",
            "EQ-dimensies (Attentiveness, Composure, Discernment, Diplomacy, Presence) — weergegeven als 'Refinement Compass' in uw profiel;",
            "Correctiestijl: wanneer u een scenario onjuist beantwoordt, slaat het systeem de bijbehorende mentorstijl op om begeleiding te personaliseren.",
          ],
          note: "Belangrijk: deze gegevens worden uitsluitend gebruikt voor persoonlijke begeleiding binnen de app. Ze worden nooit gedeeld met derden, nooit gebruikt voor reclame, en nooit buiten de context van uw persoonlijke voortgang geanalyseerd.",
        },
        {
          id: "s3-4",
          title: "3.4 Communicatiegegevens",
          list: [
            "Gesprekken met The Counsel (AI-etiquetteadviseur) — tijdelijk verwerkt om antwoorden te genereren; inhoud wordt niet structureel opgeslagen tenzij anders vermeld;",
            "E-mails voor magic-link authenticatie.",
          ],
        },
        {
          id: "s3-5",
          title: "3.5 Technische gegevens",
          list: [
            "IP-adres (tijdelijk, voor regiodetectie — niet persistent opgeslagen tenzij de gebruiker de regio bevestigt);",
            "Browsertype en -versie (via standaard HTTP-headers);",
            "Tijdzone.",
          ],
        },
      ],
    },
    {
      id: "s4",
      title: "4. Rechtsgronden voor verwerking",
      body: "Wij verwerken uw persoonsgegevens op basis van de volgende rechtsgronden (art. 6 AVG):",
      table: {
        headers: ["Verwerking", "Rechtsgrond"],
        rows: [
          ["Accountbeheer en authenticatie", "Uitvoering van de overeenkomst (art. 6.1.b)"],
          ["Noble Score en voortgangsbeheer", "Uitvoering van de overeenkomst (art. 6.1.b)"],
          ["Gedragsprofiel (Bolton/Mehrabian)", "Gerechtvaardigd belang — kwaliteitsverbetering van de dienst (art. 6.1.f)"],
          ["Counsel AI-interacties", "Uitvoering van de overeenkomst (art. 6.1.b)"],
          ["Facturatie en abonnementsbeheer", "Wettelijke verplichting + uitvoering overeenkomst (art. 6.1.b en 6.1.c)"],
          ["Regiodetectie via IP", "Gerechtvaardigd belang — dienstverlening personaliseren (art. 6.1.f)"],
          ["Marketingcommunicatie", "Toestemming (art. 6.1.a) — enkel indien u zich hiervoor aanmeldt"],
        ],
      },
    },
    {
      id: "s5",
      title: "5. Hoe gebruiken wij uw gegevens?",
      body: "Wij gebruiken uw persoonsgegevens uitsluitend voor:",
      list: [
        "Het verlenen van de dienst — toegang tot de Atelier, Counsel en Cultural Compass;",
        "Personalisatie — het aanpassen van scenario's, begeleiding en inzichten aan uw profiel en regio;",
        "Voortgangsbeheer — bijhouden van uw Noble Score, domeinbeheersing en leergeschiedenis;",
        "Abonnements- en betalingsbeheer — verwerking van uw abonnementstier via onze betalingsprovider;",
        "Technische werking — authenticatie, sessiebeheer en beveiliging;",
        "Verbetering van de dienst — geanonimiseerde of geaggregeerde analyses van gebruikspatronen.",
      ],
      note: "Wij gebruiken uw gegevens nooit voor: gerichte advertenties aan u of aan derden; verkoop of verhuur van uw gegevens; profilering buiten de context van uw etiquettetraining; geautomatiseerde besluitvorming met rechtsgevolgen (art. 22 AVG).",
    },
    {
      id: "s6",
      title: "6. Geautomatiseerde verwerking en profilering",
      body: `Cortéa maakt gebruik van geautomatiseerde analyse van uw antwoordpatronen om uw gedragsprofiel op te bouwen. Dit valt onder de definitie van profilering in de zin van art. 4(4) AVG.\n\nWij bevestigen dat:`,
      list: [
        "Deze profilering geen rechtsgevolgen heeft voor u;",
        "Zij uitsluitend dient ter verbetering van uw persoonlijke leerervaring;",
        "U het recht heeft bezwaar te maken tegen deze profilering (zie Sectie 9);",
        "Alle afgeleid profiel-inzichten uitsluitend zichtbaar zijn voor uzelf.",
      ],
    },
    {
      id: "s7",
      title: "7. Doorgifte aan derden en internationale overdrachten",
      subsections: [
        {
          id: "s7-1",
          title: "7.1 Verwerkers",
          body: "Wij maken gebruik van de volgende categorieën verwerkers:",
          list: [
            "Hostingprovider — Replit Inc. (VS). Gegevens worden verwerkt op servers die mogelijk buiten de EER zijn gelegen. Replit valt onder standaard contractuele clausules (SCC) conform art. 46 AVG.",
            "AI-dienstverlener — Anthropic PBC (VS), voor de verwerking van Counsel-interacties. Overdracht op basis van SCC.",
            "Betalingsverwerker — Stripe Inc. (VS) en/of Mollie B.V. (NL) voor abonnementsbetalingen. Verwerking conform PCI-DSS en AVG.",
            "E-mailprovider — voor het verzenden van magic-link authenticatiemails.",
          ],
        },
        {
          id: "s7-2",
          title: "7.2 Geen verkoop van gegevens",
          body: "Wij verkopen, verhuren of verhandelen uw persoonsgegevens niet aan derden.",
        },
        {
          id: "s7-3",
          title: "7.3 Wettelijke verplichtingen",
          body: "In uitzonderlijke gevallen kunnen wij verplicht worden persoonsgegevens te verstrekken op grond van een wettelijk bevel of rechterlijke uitspraak.",
        },
      ],
    },
    {
      id: "s8",
      title: "8. Bewaartermijnen",
      table: {
        headers: ["Gegevenstype", "Bewaartermijn"],
        rows: [
          ["Accountgegevens (actief account)", "Zolang het account actief is"],
          ["Accountgegevens na verwijdering", "Maximaal 30 dagen (back-upretentie)"],
          ["Noble Score log en voortgang", "Zolang het account actief is"],
          ["Gedragsprofiel", `Zolang het account actief is; verwijderd bij accountverwijdering`],
          ["Counsel-gespreksinhoud", "Niet structureel opgeslagen (stateless per sessie)"],
          ["Verificatietokens", `Vervallen automatisch na ${PLACEHOLDER_NL}`],
          ["Sessietokens", `Verlopen na ${PLACEHOLDER_NL} van inactiviteit`],
          ["Facturatiegegevens", "7 jaar (wettelijke boekhoudverplichting)"],
          ["IP-adres voor regiodetectie", "Niet persistent opgeslagen tenzij gebruiker regio bevestigt"],
        ],
      },
    },
    {
      id: "s9",
      title: "9. Uw rechten als betrokkene",
      body: "Op grond van de AVG heeft u de volgende rechten:",
      subsections: [
        {
          id: "s9-1",
          title: "9.1 Recht op inzage (art. 15)",
          body: "U kunt opvragen welke persoonsgegevens wij over u verwerken en een kopie ontvangen.",
        },
        {
          id: "s9-2",
          title: "9.2 Recht op rectificatie (art. 16)",
          body: "U kunt onjuiste of onvolledige gegevens laten corrigeren via uw profielpagina of via ons.",
        },
        {
          id: "s9-3",
          title: "9.3 Recht op verwijdering (\"recht om vergeten te worden\") (art. 17)",
          body: `U kunt uw account en alle bijbehorende gegevens verwijderen. Dit omvat: Noble Score log, gedragsprofiel, Atelier-voortgang en persoonsgegevens. Facturatiegegevens worden bewaard zolang wettelijk vereist.\n\nIn de app: Profiel → Account & Danger Zone → Account verwijderen`,
        },
        {
          id: "s9-4",
          title: "9.4 Recht op beperking van de verwerking (art. 18)",
          body: "In bepaalde omstandigheden kunt u vragen de verwerking van uw gegevens tijdelijk te beperken.",
        },
        {
          id: "s9-5",
          title: "9.5 Recht op overdraagbaarheid (art. 20)",
          body: "U kunt een gestructureerde, machineleesbare export van uw gegevens opvragen.",
        },
        {
          id: "s9-6",
          title: "9.6 Recht van bezwaar (art. 21)",
          body: "U kunt bezwaar maken tegen verwerking op basis van gerechtvaardigd belang, inclusief de gedragsprofilering. Na bezwaar staken wij de betreffende verwerking tenzij dwingende gerechtvaardigde gronden aanwezig zijn.",
        },
        {
          id: "s9-7",
          title: "9.7 Recht om toestemming in te trekken (art. 7.3)",
          body: "Indien verwerking op toestemming berust (bv. marketingmails), kunt u deze toestemming te allen tijde intrekken zonder opgave van reden.",
        },
      ],
      howToRequest: `Stuur een e-mail naar [privacy@cortea.app] met vermelding van uw naam, e-mailadres en het type verzoek. Wij reageren binnen 30 kalenderdagen.`,
    },
    {
      id: "s10",
      title: "10. Beveiliging",
      body: "Wij nemen passende technische en organisatorische maatregelen om uw gegevens te beschermen:",
      list: [
        "Authenticatie zonder wachtwoord — magic-link systeem elimineert risico's van gelekte wachtwoorden;",
        "Sessietokens server-side — tokens worden niet in de browser opgeslagen als plaintext;",
        "HTTPS/TLS — alle communicatie is versleuteld;",
        "Toegangsbeperking — enkel geautoriseerd personeel heeft toegang tot productiedata;",
        "Cascaderende verwijdering — bij accountverwijdering worden alle gekoppelde gegevens atomisch verwijderd.",
      ],
      note: "Bij een datalek dat risico's inhoudt voor uw rechten en vrijheden, zullen wij de Gegevensbeschermingsautoriteit informeren binnen 72 uur (art. 33 AVG) en u persoonlijk op de hoogte stellen indien nodig (art. 34 AVG).",
    },
    {
      id: "s11",
      title: "11. Cookies en lokale opslag",
      body: "Cortéa maakt gebruik van:",
      list: [
        "Sessiecookies — strikt noodzakelijk voor authenticatie en sessiewerking;",
        "Functionele opslag — voor taalvoorkeur en UI-instellingen.",
      ],
      note: "Wij maken geen gebruik van tracking-cookies, advertentiecookies of cross-site analytics.",
    },
    {
      id: "s12",
      title: "12. Minderjarigen",
      body: "Cortéa is niet gericht op personen jonger dan 16 jaar. Wij verzamelen niet bewust persoonsgegevens van minderjarigen. Indien u vermoedt dat een minderjarige een account heeft aangemaakt, verzoeken wij u contact met ons op te nemen.",
    },
    {
      id: "s13",
      title: "13. Klachten",
      body: "Indien u van mening bent dat wij uw persoonsgegevens niet correct verwerken, kunt u een klacht indienen bij:",
      note: `Gegevensbeschermingsautoriteit (GBA)\nDrukpersstraat 35, 1000 Brussel\ncontact@apd-gba.be | www.gegevensbeschermingsautoriteit.be\n\nWij stellen het echter op prijs als u eerst contact met ons opneemt zodat wij eventuele problemen direct kunnen oplossen.`,
    },
    {
      id: "s14",
      title: "14. Wijzigingen aan dit privacybeleid",
      body: "Wij kunnen dit privacybeleid periodiek bijwerken. Bij wezenlijke wijzigingen informeren wij u via e-mail of via een melding in de app. De datum van de laatste update staat bovenaan dit document vermeld.",
    },
    {
      id: "s15",
      title: "15. Contactgegevens",
      body: "Voor alle vragen over dit privacybeleid of uw persoonsgegevens:",
      note: `★ [Bedrijfsnaam]\nE-mail: [privacy@cortea.app]\nWebsite: [cortea.app/privacy]`,
    },
  ],
};

export const policyContentDE: PolicyContent = {
  meta: {
    title: "Datenschutzerklärung — Cortéa",
    version: "Version: 1.0",
    effectiveDateLabel: "Datum des Inkrafttretens:",
    effectiveDateValue: PLACEHOLDER_DE,
    responsibleLabel: "Verantwortlicher:",
    responsibleValue: `[Unternehmensname / Name], [Adresse], [E-Mail]`,
    supervisorLabel: "Aufsichtsbehörde:",
    supervisorValue: "Datenschutzbehörde (GBA) — www.gegevensbeschermingsautoriteit.be",
    placeholderNote: "Mit ★ gekennzeichnete Felder sind rechtliche Platzhalter, die vor der Veröffentlichung noch ausgefüllt werden müssen.",
  },
  sections: [
    {
      id: "s1",
      title: "1. Einleitung und Identität des Verantwortlichen",
      body: `Cortéa ("wir", "uns", "die App") ist eine Plattform für kulturelle Intelligenz und Etikette-Training. Sie hilft Benutzern, gesellschaftliche Umgangsformen, Kommunikationsverhalten und kulturelle Gewohnheiten zu verstehen und in einem internationalen Kontext anzuwenden.\n\nDer Verantwortliche im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:`,
      note: `★ [Unternehmensname]\n[Adresse]\n[PLZ, Stadt, Land]\nE-Mail: [privacy@cortea.app]\nUSt-IdNr.: ${PLACEHOLDER_DE}`,
      body2: "Für alle Fragen, Anfragen oder Beschwerden bezüglich Ihrer personenbezogenen Daten können Sie uns über die oben genannte E-Mail-Adresse erreichen.",
    } as PolicySection & { body2: string },
    {
      id: "s2",
      title: "2. Anwendungsbereich",
      body: "Diese Datenschutzerklärung gilt für:",
      list: [
        "Die Nutzung der Cortéa-Webanwendung und etwaiger zukünftiger mobiler Versionen;",
        "Alle über cortea.app angebotenen Dienste;",
        "Die Verarbeitung personenbezogener Daten von Besuchern, registrierten Nutzern und Abonnenten.",
      ],
      note: "Diese Erklärung gilt nicht für externe Websites oder Dienste, auf die Cortéa möglicherweise verweist.",
    },
    {
      id: "s3",
      title: "3. Welche personenbezogenen Daten verarbeiten wir?",
      subsections: [
        {
          id: "s3-1",
          title: "3.1 Kontodaten",
          body: "Bei der Registrierung erfassen wir:",
          list: [
            "E-Mail-Adresse (Pflichtfeld, dient als eindeutige Kennung)",
            "Vollständiger Name (optional, nur wenn vom Nutzer angegeben)",
            "Geburtsjahr (optional, für kontextbezogene Personalisierung)",
            "Geschlechtsidentität (optional, freiwillig angegeben)",
            "Verifizierungstoken und Ablaufdatum (temporär, für E-Mail-Verifizierung per Magic Link)",
            "Sitzungstoken (serverseitig gespeichert, zur Authentifizierung)",
          ],
        },
        {
          id: "s3-2",
          title: "3.2 Nutzungsdaten und Fortschritt",
          body: "Während der Nutzung von Cortéa verarbeiten wir:",
          list: [
            "Noble Score und Scoreverläufe (Punkte pro Szenario, Level-up-Ereignisse)",
            "Szenarioantworten (welche Entscheidungen Sie in jeder Übungssituation getroffen haben)",
            "Aktive Region (der kulturelle Bereich, den Sie als Kontext festgelegt haben)",
            "Sprachpräferenz (Ihre UI-Sprache aus 9 verfügbaren Sprachen)",
            "Aktivitäts-Zeitstempel",
          ],
        },
        {
          id: "s3-3",
          title: "3.3 Verhaltensprofil (Behavioral Intelligence Layer)",
          body: `Cortéa enthält eine unsichtbare Verhaltensintelligenz-Schicht, die auf der Grundlage Ihrer Antworten zusätzliche Erkenntnisse aufbaut. Diese Schicht arbeitet vollständig im Hintergrund und zeigt Ergebnisse ausschließlich in Etikette-Sprache — niemals in psychologischer oder klinischer Terminologie.\n\nKonkret verarbeiten wir:`,
          list: [
            "Bolton-Cluster (Aufmerksamkeit für andere, Durchsetzungsstil, Konfliktansatz) — abgeleitet aus der Mustererkennung in Ihren Szenarioantworten;",
            "Nonverbaler Bewusstseinsscore (basierend auf dem Mehrabian-Modell für 18 kulturelle Regionen);",
            "EQ-Dimensionen (Attentiveness, Composure, Discernment, Diplomacy, Presence) — angezeigt als 'Refinement Compass' in Ihrem Profil;",
            "Korrektionsstil: Wenn Sie ein Szenario falsch beantworten, speichert das System den zugehörigen Mentorstil, um die Begleitung zu personalisieren.",
          ],
          note: "Wichtig: Diese Daten werden ausschließlich zur persönlichen Begleitung innerhalb der App verwendet. Sie werden niemals an Dritte weitergegeben, niemals für Werbung verwendet und niemals außerhalb des Kontexts Ihres persönlichen Fortschritts analysiert.",
        },
        {
          id: "s3-4",
          title: "3.4 Kommunikationsdaten",
          list: [
            "Gespräche mit The Counsel (KI-Etikette-Berater) — temporär verarbeitet, um Antworten zu generieren; Inhalte werden nicht strukturell gespeichert, sofern nicht anders angegeben;",
            "E-Mails für die Magic-Link-Authentifizierung.",
          ],
        },
        {
          id: "s3-5",
          title: "3.5 Technische Daten",
          list: [
            "IP-Adresse (temporär, zur Regionserkennung — nicht dauerhaft gespeichert, es sei denn, der Nutzer bestätigt die Region);",
            "Browsertyp und -version (über Standard-HTTP-Header);",
            "Zeitzone.",
          ],
        },
      ],
    },
    {
      id: "s4",
      title: "4. Rechtsgrundlagen der Verarbeitung",
      body: "Wir verarbeiten Ihre personenbezogenen Daten auf der Grundlage folgender Rechtsgrundlagen (Art. 6 DSGVO):",
      table: {
        headers: ["Verarbeitung", "Rechtsgrundlage"],
        rows: [
          ["Kontoverwaltung und Authentifizierung", "Vertragserfüllung (Art. 6.1.b)"],
          ["Noble Score und Fortschrittsverwaltung", "Vertragserfüllung (Art. 6.1.b)"],
          ["Verhaltensprofil (Bolton/Mehrabian)", "Berechtigtes Interesse — Qualitätsverbesserung des Dienstes (Art. 6.1.f)"],
          ["Counsel KI-Interaktionen", "Vertragserfüllung (Art. 6.1.b)"],
          ["Abrechnung und Abonnementverwaltung", "Rechtliche Verpflichtung + Vertragserfüllung (Art. 6.1.b und 6.1.c)"],
          ["Regionserkennung per IP", "Berechtigtes Interesse — Personalisierung des Dienstes (Art. 6.1.f)"],
          ["Marketingkommunikation", "Einwilligung (Art. 6.1.a) — nur wenn Sie sich dafür angemeldet haben"],
        ],
      },
    },
    {
      id: "s5",
      title: "5. Wie verwenden wir Ihre Daten?",
      body: "Wir verwenden Ihre personenbezogenen Daten ausschließlich für:",
      list: [
        "Die Erbringung des Dienstes — Zugang zu Atelier, Counsel und Cultural Compass;",
        "Personalisierung — Anpassung von Szenarien, Begleitung und Erkenntnissen an Ihr Profil und Ihre Region;",
        "Fortschrittsverwaltung — Verfolgung Ihres Noble Scores, Ihrer Domänenbeherrschung und Lernhistorie;",
        "Abonnement- und Zahlungsverwaltung — Verarbeitung Ihrer Abonnementebene über unseren Zahlungsanbieter;",
        "Technischer Betrieb — Authentifizierung, Sitzungsverwaltung und Sicherheit;",
        "Dienstverbesserung — anonymisierte oder aggregierte Analysen von Nutzungsmustern.",
      ],
      note: "Wir verwenden Ihre Daten niemals für: gezielte Werbung an Sie oder Dritte; Verkauf oder Vermietung Ihrer Daten; Profiling außerhalb des Kontexts Ihres Etikette-Trainings; automatisierte Entscheidungsfindung mit Rechtswirkung (Art. 22 DSGVO).",
    },
    {
      id: "s6",
      title: "6. Automatisierte Verarbeitung und Profiling",
      body: `Cortéa nutzt die automatisierte Analyse Ihrer Antwortmuster, um Ihr Verhaltensprofil aufzubauen. Dies fällt unter die Definition des Profilings im Sinne von Art. 4(4) DSGVO.\n\nWir bestätigen, dass:`,
      list: [
        "Dieses Profiling keine Rechtswirkung für Sie hat;",
        "Es ausschließlich der Verbesserung Ihrer persönlichen Lernerfahrung dient;",
        "Sie das Recht haben, gegen dieses Profiling Widerspruch einzulegen (siehe Abschnitt 9);",
        "Alle abgeleiteten Profilerkenntnisse ausschließlich für Sie selbst sichtbar sind.",
      ],
    },
    {
      id: "s7",
      title: "7. Weitergabe an Dritte und internationale Übermittlungen",
      subsections: [
        {
          id: "s7-1",
          title: "7.1 Auftragsverarbeiter",
          body: "Wir nutzen die folgenden Kategorien von Auftragsverarbeitern:",
          list: [
            "Hosting-Anbieter — Replit Inc. (USA). Daten werden auf Servern verarbeitet, die sich möglicherweise außerhalb des EWR befinden. Replit unterliegt Standardvertragsklauseln (SCC) gemäß Art. 46 DSGVO.",
            "KI-Dienstleister — Anthropic PBC (USA), zur Verarbeitung von Counsel-Interaktionen. Übermittlung auf Basis von SCC.",
            "Zahlungsverarbeiter — Stripe Inc. (USA) und/oder Mollie B.V. (NL) für Abonnementzahlungen. Verarbeitung gemäß PCI-DSS und DSGVO.",
            "E-Mail-Anbieter — für den Versand von Magic-Link-Authentifizierungs-E-Mails.",
          ],
        },
        {
          id: "s7-2",
          title: "7.2 Kein Verkauf von Daten",
          body: "Wir verkaufen, vermieten oder handeln Ihre personenbezogenen Daten nicht an Dritte.",
        },
        {
          id: "s7-3",
          title: "7.3 Gesetzliche Verpflichtungen",
          body: "In Ausnahmefällen können wir verpflichtet sein, personenbezogene Daten aufgrund einer gesetzlichen Anordnung oder eines Gerichtsbeschlusses bereitzustellen.",
        },
      ],
    },
    {
      id: "s8",
      title: "8. Aufbewahrungsfristen",
      table: {
        headers: ["Datentyp", "Aufbewahrungsfrist"],
        rows: [
          ["Kontodaten (aktives Konto)", "Solange das Konto aktiv ist"],
          ["Kontodaten nach Löschung", "Maximal 30 Tage (Backup-Aufbewahrung)"],
          ["Noble Score-Protokoll und Fortschritt", "Solange das Konto aktiv ist"],
          ["Verhaltensprofil", "Solange das Konto aktiv ist; bei Kontolöschung gelöscht"],
          ["Counsel-Gesprächsinhalt", "Nicht strukturell gespeichert (zustandslos pro Sitzung)"],
          ["Verifizierungstoken", `Laufen automatisch nach ${PLACEHOLDER_DE} ab`],
          ["Sitzungstoken", `Laufen nach ${PLACEHOLDER_DE} Inaktivität ab`],
          ["Abrechnungsdaten", "7 Jahre (gesetzliche Buchführungspflicht)"],
          ["IP-Adresse zur Regionserkennung", "Nicht dauerhaft gespeichert, es sei denn, Nutzer bestätigt Region"],
        ],
      },
    },
    {
      id: "s9",
      title: "9. Ihre Rechte als betroffene Person",
      body: "Gemäß der DSGVO haben Sie folgende Rechte:",
      subsections: [
        { id: "s9-1", title: "9.1 Auskunftsrecht (Art. 15)", body: "Sie können erfragen, welche personenbezogenen Daten wir über Sie verarbeiten, und eine Kopie erhalten." },
        { id: "s9-2", title: "9.2 Recht auf Berichtigung (Art. 16)", body: "Sie können unrichtige oder unvollständige Daten über Ihre Profilseite oder über uns korrigieren lassen." },
        { id: "s9-3", title: "9.3 Recht auf Löschung (Art. 17)", body: `Sie können Ihr Konto und alle zugehörigen Daten löschen. Dies umfasst: Noble Score-Protokoll, Verhaltensprofil, Atelier-Fortschritt und personenbezogene Daten. Abrechnungsdaten werden so lange aufbewahrt, wie gesetzlich vorgeschrieben.\n\nIn der App: Profil → Konto & Gefahrenzone → Konto löschen` },
        { id: "s9-4", title: "9.4 Recht auf Einschränkung der Verarbeitung (Art. 18)", body: "Unter bestimmten Umständen können Sie beantragen, die Verarbeitung Ihrer Daten vorübergehend einzuschränken." },
        { id: "s9-5", title: "9.5 Recht auf Datenübertragbarkeit (Art. 20)", body: "Sie können einen strukturierten, maschinenlesbaren Export Ihrer Daten anfordern." },
        { id: "s9-6", title: "9.6 Widerspruchsrecht (Art. 21)", body: "Sie können gegen die Verarbeitung auf Grundlage berechtigter Interessen, einschließlich des Verhaltensprofiling, Widerspruch einlegen. Nach dem Widerspruch stellen wir die betreffende Verarbeitung ein, sofern keine zwingenden berechtigten Gründe vorliegen." },
        { id: "s9-7", title: "9.7 Recht auf Widerruf der Einwilligung (Art. 7.3)", body: "Wenn die Verarbeitung auf einer Einwilligung beruht (z. B. Marketing-E-Mails), können Sie diese Einwilligung jederzeit ohne Angabe von Gründen widerrufen." },
      ],
      howToRequest: "Senden Sie eine E-Mail an [privacy@cortea.app] mit Ihrem Namen, Ihrer E-Mail-Adresse und der Art der Anfrage. Wir antworten innerhalb von 30 Kalendertagen.",
    },
    {
      id: "s10",
      title: "10. Sicherheit",
      body: "Wir ergreifen geeignete technische und organisatorische Maßnahmen zum Schutz Ihrer Daten:",
      list: [
        "Authentifizierung ohne Passwort — Magic-Link-System eliminiert Risiken durch gestohlene Passwörter;",
        "Sitzungstoken serverseitig — Token werden nicht im Klartext im Browser gespeichert;",
        "HTTPS/TLS — alle Kommunikation ist verschlüsselt;",
        "Zugriffsbeschränkung — nur autorisiertes Personal hat Zugang zu Produktionsdaten;",
        "Kaskadierendes Löschen — bei Kontolöschung werden alle verknüpften Daten atomar gelöscht.",
      ],
      note: "Bei einer Datenpanne, die Risiken für Ihre Rechte und Freiheiten birgt, informieren wir die Datenschutzbehörde innerhalb von 72 Stunden (Art. 33 DSGVO) und benachrichtigen Sie persönlich, falls erforderlich (Art. 34 DSGVO).",
    },
    {
      id: "s11",
      title: "11. Cookies und lokale Speicherung",
      body: "Cortéa verwendet:",
      list: [
        "Sitzungscookies — unbedingt erforderlich für Authentifizierung und Sitzungsfunktionalität;",
        "Funktionale Speicherung — für Spracheinstellungen und UI-Einstellungen.",
      ],
      note: "Wir verwenden keine Tracking-Cookies, Werbe-Cookies oder Cross-Site-Analytics.",
    },
    {
      id: "s12",
      title: "12. Minderjährige",
      body: "Cortéa richtet sich nicht an Personen unter 16 Jahren. Wir erfassen wissentlich keine personenbezogenen Daten von Minderjährigen. Wenn Sie vermuten, dass ein Minderjähriger ein Konto erstellt hat, bitten wir Sie, uns zu kontaktieren.",
    },
    {
      id: "s13",
      title: "13. Beschwerden",
      body: "Wenn Sie der Meinung sind, dass wir Ihre personenbezogenen Daten nicht korrekt verarbeiten, können Sie eine Beschwerde einreichen bei:",
      note: `Datenschutzbehörde (GBA)\nDrukpersstraat 35, 1000 Brüssel\ncontact@apd-gba.be | www.gegevensbeschermingsautoriteit.be\n\nWir würden es jedoch begrüßen, wenn Sie sich zunächst an uns wenden, damit wir etwaige Probleme direkt lösen können.`,
    },
    {
      id: "s14",
      title: "14. Änderungen dieser Datenschutzerklärung",
      body: "Wir können diese Datenschutzerklärung regelmäßig aktualisieren. Bei wesentlichen Änderungen informieren wir Sie per E-Mail oder über eine Benachrichtigung in der App. Das Datum der letzten Aktualisierung steht am Anfang dieses Dokuments.",
    },
    {
      id: "s15",
      title: "15. Kontaktdaten",
      body: "Für alle Fragen zu dieser Datenschutzerklärung oder Ihren personenbezogenen Daten:",
      note: `★ [Unternehmensname]\nE-Mail: [privacy@cortea.app]\nWebsite: [cortea.app/privacy]`,
    },
  ],
};

export const policyContentFR: PolicyContent = {
  meta: {
    title: "Politique de confidentialité — Cortéa",
    version: "Version: 1.0",
    effectiveDateLabel: "Date d'entrée en vigueur :",
    effectiveDateValue: PLACEHOLDER_FR,
    responsibleLabel: "Responsable du traitement :",
    responsibleValue: `[Nom de la société / Nom], [Adresse], [E-mail]`,
    supervisorLabel: "Autorité de contrôle :",
    supervisorValue: "Autorité de protection des données (APD) — www.gegevensbeschermingsautoriteit.be",
    placeholderNote: "Les champs marqués ★ sont des espaces réservés juridiques qui doivent encore être complétés avant publication.",
  },
  sections: [
    {
      id: "s1",
      title: "1. Introduction et identité du responsable du traitement",
      body: `Cortéa (« nous », « notre », « l'application ») est une plateforme d'intelligence culturelle et de formation à l'étiquette. Elle aide les utilisateurs à comprendre et à appliquer les normes sociales, les comportements de communication et les coutumes culturelles dans un contexte international.\n\nLe responsable du traitement au sens du Règlement général sur la protection des données (RGPD) est :`,
      note: `★ [Nom de la société]\n[Adresse]\n[Code postal, Ville, Pays]\nE-mail : [privacy@cortea.app]\nNuméro TVA : ${PLACEHOLDER_FR}`,
      body2: "Pour toute question, demande ou réclamation concernant vos données personnelles, vous pouvez nous contacter à l'adresse e-mail indiquée ci-dessus.",
    } as PolicySection & { body2: string },
    {
      id: "s2",
      title: "2. Champ d'application",
      body: "La présente politique de confidentialité s'applique à :",
      list: [
        "L'utilisation de l'application web Cortéa et de toute future version mobile ;",
        "Tous les services proposés via cortea.app ;",
        "Le traitement des données personnelles des visiteurs, utilisateurs enregistrés et abonnés.",
      ],
      note: "Cette politique ne s'applique pas aux sites web ou services externes auxquels Cortéa peut faire référence.",
    },
    {
      id: "s3",
      title: "3. Quelles données personnelles traitons-nous ?",
      subsections: [
        {
          id: "s3-1",
          title: "3.1 Données de compte",
          body: "Lors de l'inscription, nous collectons :",
          list: [
            "Adresse e-mail (obligatoire, sert d'identifiant unique)",
            "Nom complet (optionnel, uniquement si fourni par l'utilisateur)",
            "Année de naissance (optionnel, pour la personnalisation contextuelle)",
            "Identité de genre (optionnel, fourni volontairement)",
            "Jeton de vérification et date d'expiration (temporaire, pour la vérification e-mail via lien magique)",
            "Jeton de session (stocké côté serveur, pour l'authentification)",
          ],
        },
        {
          id: "s3-2",
          title: "3.2 Données d'utilisation et progression",
          body: "Lors de l'utilisation de Cortéa, nous traitons :",
          list: [
            "Noble Score et historiques de score (points par scénario, événements de montée de niveau)",
            "Réponses aux scénarios (les choix effectués dans chaque situation d'entraînement)",
            "Région active (la zone culturelle définie comme contexte)",
            "Préférence de langue (votre langue d'interface parmi les 9 langues disponibles)",
            "Horodatages d'activité",
          ],
        },
        {
          id: "s3-3",
          title: "3.3 Profil comportemental (Behavioral Intelligence Layer)",
          body: `Cortéa contient une couche d'intelligence comportementale invisible qui construit des informations supplémentaires sur la base de vos réponses. Cette couche fonctionne entièrement en arrière-plan et n'affiche des résultats qu'en langage d'étiquette — jamais en terminologie psychologique ou clinique.\n\nConcrètement, nous traitons :`,
          list: [
            "Clusters Bolton (attention aux autres, style d'assertivité, approche des conflits) — dérivés de la reconnaissance de motifs dans vos réponses aux scénarios ;",
            "Score de conscience non-verbale (basé sur le modèle Mehrabian pour 18 régions culturelles) ;",
            "Dimensions EQ (Attentiveness, Composure, Discernment, Diplomacy, Presence) — affichées comme la « Boussole de raffinement » dans votre profil ;",
            "Style de correction : lorsque vous répondez incorrectement à un scénario, le système enregistre le style de mentor associé pour personnaliser l'accompagnement.",
          ],
          note: "Important : ces données sont utilisées exclusivement pour l'accompagnement personnel dans l'application. Elles ne sont jamais partagées avec des tiers, jamais utilisées à des fins publicitaires, et jamais analysées hors du contexte de votre progression personnelle.",
        },
        {
          id: "s3-4",
          title: "3.4 Données de communication",
          list: [
            "Conversations avec The Counsel (conseiller en étiquette IA) — traitées temporairement pour générer des réponses ; le contenu n'est pas stocké structurellement sauf indication contraire ;",
            "E-mails pour l'authentification par lien magique.",
          ],
        },
        {
          id: "s3-5",
          title: "3.5 Données techniques",
          list: [
            "Adresse IP (temporaire, pour la détection de région — non stockée de façon persistante sauf si l'utilisateur confirme la région) ;",
            "Type et version du navigateur (via les en-têtes HTTP standard) ;",
            "Fuseau horaire.",
          ],
        },
      ],
    },
    {
      id: "s4",
      title: "4. Bases juridiques du traitement",
      body: "Nous traitons vos données personnelles sur la base des fondements juridiques suivants (Art. 6 RGPD) :",
      table: {
        headers: ["Traitement", "Base juridique"],
        rows: [
          ["Gestion de compte et authentification", "Exécution du contrat (Art. 6.1.b)"],
          ["Noble Score et gestion de la progression", "Exécution du contrat (Art. 6.1.b)"],
          ["Profil comportemental (Bolton/Mehrabian)", "Intérêt légitime — amélioration de la qualité du service (Art. 6.1.f)"],
          ["Interactions Counsel IA", "Exécution du contrat (Art. 6.1.b)"],
          ["Facturation et gestion des abonnements", "Obligation légale + exécution du contrat (Art. 6.1.b et 6.1.c)"],
          ["Détection de région via IP", "Intérêt légitime — personnalisation du service (Art. 6.1.f)"],
          ["Communications marketing", "Consentement (Art. 6.1.a) — uniquement si vous y avez souscrit"],
        ],
      },
    },
    {
      id: "s5",
      title: "5. Comment utilisons-nous vos données ?",
      body: "Nous utilisons vos données personnelles exclusivement pour :",
      list: [
        "La fourniture du service — accès à l'Atelier, au Counsel et au Cultural Compass ;",
        "La personnalisation — adapter les scénarios, l'accompagnement et les informations à votre profil et région ;",
        "La gestion de la progression — suivre votre Noble Score, la maîtrise des domaines et l'historique d'apprentissage ;",
        "La gestion des abonnements et paiements — traitement de votre niveau d'abonnement via notre prestataire de paiement ;",
        "Le fonctionnement technique — authentification, gestion de session et sécurité ;",
        "L'amélioration du service — analyses anonymisées ou agrégées des modèles d'utilisation.",
      ],
      note: "Nous n'utilisons jamais vos données pour : publicité ciblée vers vous ou des tiers ; vente ou location de vos données ; profilage hors du contexte de votre formation à l'étiquette ; prise de décision automatisée avec effets juridiques (Art. 22 RGPD).",
    },
    {
      id: "s6",
      title: "6. Traitement automatisé et profilage",
      body: `Cortéa utilise une analyse automatisée de vos schémas de réponse pour construire votre profil comportemental. Cela relève de la définition du profilage au sens de l'Art. 4(4) RGPD.\n\nNous confirmons que :`,
      list: [
        "Ce profilage n'a aucun effet juridique pour vous ;",
        "Il sert exclusivement à améliorer votre expérience d'apprentissage personnelle ;",
        "Vous avez le droit de vous opposer à ce profilage (voir Section 9) ;",
        "Toutes les informations de profil dérivées sont visibles uniquement pour vous-même.",
      ],
    },
    {
      id: "s7",
      title: "7. Transferts à des tiers et transferts internationaux",
      subsections: [
        {
          id: "s7-1",
          title: "7.1 Sous-traitants",
          body: "Nous faisons appel aux catégories de sous-traitants suivantes :",
          list: [
            "Hébergeur — Replit Inc. (États-Unis). Les données sont traitées sur des serveurs pouvant se trouver hors de l'EEE. Replit est soumis aux clauses contractuelles types (CCT) conformément à l'Art. 46 RGPD.",
            "Fournisseur IA — Anthropic PBC (États-Unis), pour le traitement des interactions Counsel. Transfert sur la base des CCT.",
            "Processeur de paiement — Stripe Inc. (États-Unis) et/ou Mollie B.V. (NL) pour les paiements d'abonnement. Traitement conforme à PCI-DSS et au RGPD.",
            "Fournisseur e-mail — pour l'envoi d'e-mails d'authentification par lien magique.",
          ],
        },
        {
          id: "s7-2",
          title: "7.2 Pas de vente de données",
          body: "Nous ne vendons, ne louons ni ne commercialisons vos données personnelles à des tiers.",
        },
        {
          id: "s7-3",
          title: "7.3 Obligations légales",
          body: "Dans des cas exceptionnels, nous pouvons être tenus de fournir des données personnelles en vertu d'une ordonnance légale ou d'une décision judiciaire.",
        },
      ],
    },
    {
      id: "s8",
      title: "8. Durées de conservation",
      table: {
        headers: ["Type de données", "Durée de conservation"],
        rows: [
          ["Données de compte (compte actif)", "Tant que le compte est actif"],
          ["Données de compte après suppression", "Maximum 30 jours (rétention de sauvegarde)"],
          ["Journal Noble Score et progression", "Tant que le compte est actif"],
          ["Profil comportemental", "Tant que le compte est actif ; supprimé lors de la suppression du compte"],
          ["Contenu des conversations Counsel", "Non stocké structurellement (sans état par session)"],
          ["Jetons de vérification", `Expirent automatiquement après ${PLACEHOLDER_FR}`],
          ["Jetons de session", `Expirent après ${PLACEHOLDER_FR} d'inactivité`],
          ["Données de facturation", "7 ans (obligation légale de comptabilité)"],
          ["Adresse IP pour détection de région", "Non stockée de façon persistante sauf si l'utilisateur confirme la région"],
        ],
      },
    },
    {
      id: "s9",
      title: "9. Vos droits en tant que personne concernée",
      body: "En vertu du RGPD, vous disposez des droits suivants :",
      subsections: [
        { id: "s9-1", title: "9.1 Droit d'accès (Art. 15)", body: "Vous pouvez demander quelles données personnelles nous traitons vous concernant et en recevoir une copie." },
        { id: "s9-2", title: "9.2 Droit de rectification (Art. 16)", body: "Vous pouvez faire corriger des données incorrectes ou incomplètes via votre page de profil ou via nous." },
        { id: "s9-3", title: "9.3 Droit à l'effacement (Art. 17)", body: `Vous pouvez supprimer votre compte et toutes les données associées. Cela comprend : le journal Noble Score, le profil comportemental, la progression Atelier et les données personnelles. Les données de facturation sont conservées aussi longtemps que légalement requis.\n\nDans l'application : Profil → Compte & Zone de danger → Supprimer le compte` },
        { id: "s9-4", title: "9.4 Droit à la limitation du traitement (Art. 18)", body: "Dans certaines circonstances, vous pouvez demander que le traitement de vos données soit temporairement limité." },
        { id: "s9-5", title: "9.5 Droit à la portabilité des données (Art. 20)", body: "Vous pouvez demander une exportation structurée et lisible par machine de vos données." },
        { id: "s9-6", title: "9.6 Droit d'opposition (Art. 21)", body: "Vous pouvez vous opposer au traitement basé sur l'intérêt légitime, y compris le profilage comportemental. Après opposition, nous cesserons le traitement en question, sauf s'il existe des motifs légitimes impérieux." },
        { id: "s9-7", title: "9.7 Droit de retrait du consentement (Art. 7.3)", body: "Si le traitement est basé sur le consentement (par exemple, e-mails marketing), vous pouvez retirer ce consentement à tout moment sans donner de raisons." },
      ],
      howToRequest: "Envoyez un e-mail à [privacy@cortea.app] en indiquant votre nom, votre adresse e-mail et le type de demande. Nous répondons dans les 30 jours calendaires.",
    },
    {
      id: "s10",
      title: "10. Sécurité",
      body: "Nous prenons des mesures techniques et organisationnelles appropriées pour protéger vos données :",
      list: [
        "Authentification sans mot de passe — le système de lien magique élimine les risques de mots de passe divulgués ;",
        "Jetons de session côté serveur — les jetons ne sont pas stockés en clair dans le navigateur ;",
        "HTTPS/TLS — toutes les communications sont chiffrées ;",
        "Restriction d'accès — seul le personnel autorisé a accès aux données de production ;",
        "Suppression en cascade — lors de la suppression du compte, toutes les données liées sont supprimées de façon atomique.",
      ],
      note: "En cas de violation de données présentant des risques pour vos droits et libertés, nous informerons l'Autorité de protection des données dans les 72 heures (Art. 33 RGPD) et vous en informerons personnellement si nécessaire (Art. 34 RGPD).",
    },
    {
      id: "s11",
      title: "11. Cookies et stockage local",
      body: "Cortéa utilise :",
      list: [
        "Cookies de session — strictement nécessaires pour l'authentification et le fonctionnement des sessions ;",
        "Stockage fonctionnel — pour les préférences de langue et les paramètres d'interface.",
      ],
      note: "Nous n'utilisons pas de cookies de suivi, de cookies publicitaires ni d'analyses inter-sites.",
    },
    {
      id: "s12",
      title: "12. Mineurs",
      body: "Cortéa ne s'adresse pas aux personnes de moins de 16 ans. Nous ne collectons pas sciemment de données personnelles auprès de mineurs. Si vous soupçonnez qu'un mineur a créé un compte, nous vous prions de nous contacter.",
    },
    {
      id: "s13",
      title: "13. Réclamations",
      body: "Si vous estimez que nous ne traitons pas correctement vos données personnelles, vous pouvez déposer une plainte auprès de :",
      note: `Autorité de protection des données (APD)\nDrukpersstraat 35, 1000 Bruxelles\ncontact@apd-gba.be | www.gegevensbeschermingsautoriteit.be\n\nNous apprécierions cependant que vous nous contactiez d'abord afin de résoudre les problèmes directement.`,
    },
    {
      id: "s14",
      title: "14. Modifications de cette politique de confidentialité",
      body: "Nous pouvons périodiquement mettre à jour cette politique de confidentialité. Pour les modifications importantes, nous vous informerons par e-mail ou via une notification dans l'application. La date de la dernière mise à jour figure en haut de ce document.",
    },
    {
      id: "s15",
      title: "15. Coordonnées",
      body: "Pour toute question sur cette politique de confidentialité ou vos données personnelles :",
      note: `★ [Nom de la société]\nE-mail : [privacy@cortea.app]\nSite web : [cortea.app/privacy]`,
    },
  ],
};

export const policyContentES: PolicyContent = {
  meta: {
    title: "Política de privacidad — Cortéa",
    version: "Versión: 1.0",
    effectiveDateLabel: "Fecha de entrada en vigor:",
    effectiveDateValue: PLACEHOLDER_ES,
    responsibleLabel: "Responsable del tratamiento:",
    responsibleValue: `[Nombre de la empresa / Nombre], [Dirección], [Correo electrónico]`,
    supervisorLabel: "Autoridad supervisora:",
    supervisorValue: "Autoridad de Protección de Datos (APD) — www.gegevensbeschermingsautoriteit.be",
    placeholderNote: "Los campos marcados con ★ son marcadores de posición legales que deben completarse antes de la publicación.",
  },
  sections: [
    {
      id: "s1",
      title: "1. Introducción e identidad del responsable del tratamiento",
      body: `Cortéa ("nosotros", "nos", "la aplicación") es una plataforma de inteligencia cultural y formación en etiqueta. Ayuda a los usuarios a comprender y aplicar las normas sociales, los comportamientos de comunicación y las costumbres culturales en un contexto internacional.\n\nEl responsable del tratamiento en el sentido del Reglamento General de Protección de Datos (RGPD) es:`,
      note: `★ [Nombre de la empresa]\n[Dirección]\n[Código postal, Ciudad, País]\nCorreo electrónico: [privacy@cortea.app]\nNúmero de IVA: ${PLACEHOLDER_ES}`,
      body2: "Para todas las preguntas, solicitudes o quejas relacionadas con sus datos personales, puede contactarnos en la dirección de correo electrónico indicada anteriormente.",
    } as PolicySection & { body2: string },
    {
      id: "s2",
      title: "2. Ámbito de aplicación",
      body: "Esta política de privacidad se aplica a:",
      list: [
        "El uso de la aplicación web Cortéa y cualquier futura versión móvil;",
        "Todos los servicios ofrecidos a través de cortea.app;",
        "El tratamiento de datos personales de visitantes, usuarios registrados y suscriptores.",
      ],
      note: "Esta política no se aplica a sitios web o servicios externos a los que Cortéa pueda hacer referencia.",
    },
    {
      id: "s3",
      title: "3. ¿Qué datos personales tratamos?",
      subsections: [
        {
          id: "s3-1",
          title: "3.1 Datos de cuenta",
          body: "Al registrarse, recopilamos:",
          list: [
            "Dirección de correo electrónico (obligatorio, sirve como identificador único)",
            "Nombre completo (opcional, solo si el usuario lo proporciona)",
            "Año de nacimiento (opcional, para personalización contextual)",
            "Identidad de género (opcional, proporcionada voluntariamente)",
            "Token de verificación y fecha de caducidad (temporal, para verificación de correo electrónico mediante enlace mágico)",
            "Token de sesión (almacenado en el servidor, para autenticación)",
          ],
        },
        {
          id: "s3-2",
          title: "3.2 Datos de uso y progreso",
          body: "Durante el uso de Cortéa procesamos:",
          list: [
            "Noble Score e historial de puntuaciones (puntos por escenario, eventos de subida de nivel)",
            "Respuestas a escenarios (las elecciones que realizó en cada situación de práctica)",
            "Región activa (la zona cultural que establece como contexto)",
            "Preferencia de idioma (su idioma de interfaz de los 9 disponibles)",
            "Marcas de tiempo de actividad",
          ],
        },
        {
          id: "s3-3",
          title: "3.3 Perfil de comportamiento (Behavioral Intelligence Layer)",
          body: `Cortéa contiene una capa de inteligencia conductual invisible que construye información adicional basada en sus respuestas. Esta capa funciona completamente en segundo plano y solo muestra resultados en lenguaje de etiqueta, nunca en terminología psicológica o clínica.\n\nConcretamente procesamos:`,
          list: [
            "Clústeres Bolton (atención a los demás, estilo de asertividad, enfoque del conflicto) — derivados del reconocimiento de patrones en sus respuestas a los escenarios;",
            "Puntuación de conciencia no verbal (basada en el modelo Mehrabian para 18 regiones culturales);",
            "Dimensiones EQ (Attentiveness, Composure, Discernment, Diplomacy, Presence) — mostradas como la 'Brújula de refinamiento' en su perfil;",
            "Estilo de corrección: cuando responde incorrectamente a un escenario, el sistema almacena el estilo de mentor asociado para personalizar la orientación.",
          ],
          note: "Importante: estos datos se utilizan exclusivamente para orientación personal dentro de la aplicación. Nunca se comparten con terceros, nunca se usan para publicidad y nunca se analizan fuera del contexto de su progreso personal.",
        },
        {
          id: "s3-4",
          title: "3.4 Datos de comunicación",
          list: [
            "Conversaciones con The Counsel (asesor de etiqueta IA) — procesadas temporalmente para generar respuestas; el contenido no se almacena de forma estructural salvo indicación contraria;",
            "Correos electrónicos para la autenticación mediante enlace mágico.",
          ],
        },
        {
          id: "s3-5",
          title: "3.5 Datos técnicos",
          list: [
            "Dirección IP (temporal, para detección de región — no almacenada de forma persistente a menos que el usuario confirme la región);",
            "Tipo y versión del navegador (a través de encabezados HTTP estándar);",
            "Zona horaria.",
          ],
        },
      ],
    },
    {
      id: "s4",
      title: "4. Bases jurídicas del tratamiento",
      body: "Tratamos sus datos personales sobre la base de los siguientes fundamentos jurídicos (Art. 6 RGPD):",
      table: {
        headers: ["Tratamiento", "Base jurídica"],
        rows: [
          ["Gestión de cuenta y autenticación", "Ejecución del contrato (Art. 6.1.b)"],
          ["Noble Score y gestión del progreso", "Ejecución del contrato (Art. 6.1.b)"],
          ["Perfil de comportamiento (Bolton/Mehrabian)", "Interés legítimo — mejora de la calidad del servicio (Art. 6.1.f)"],
          ["Interacciones con Counsel IA", "Ejecución del contrato (Art. 6.1.b)"],
          ["Facturación y gestión de suscripciones", "Obligación legal + ejecución del contrato (Art. 6.1.b y 6.1.c)"],
          ["Detección de región por IP", "Interés legítimo — personalización del servicio (Art. 6.1.f)"],
          ["Comunicaciones de marketing", "Consentimiento (Art. 6.1.a) — solo si se ha suscrito"],
        ],
      },
    },
    {
      id: "s5",
      title: "5. ¿Cómo utilizamos sus datos?",
      body: "Utilizamos sus datos personales exclusivamente para:",
      list: [
        "La prestación del servicio — acceso al Atelier, Counsel y Cultural Compass;",
        "Personalización — adaptar escenarios, orientación e información a su perfil y región;",
        "Gestión del progreso — seguimiento de su Noble Score, dominio de áreas y historial de aprendizaje;",
        "Gestión de suscripciones y pagos — procesamiento de su nivel de suscripción a través de nuestro proveedor de pagos;",
        "Funcionamiento técnico — autenticación, gestión de sesiones y seguridad;",
        "Mejora del servicio — análisis anonimizados o agregados de patrones de uso.",
      ],
      note: "Nunca utilizamos sus datos para: publicidad dirigida a usted o a terceros; venta o alquiler de sus datos; elaboración de perfiles fuera del contexto de su formación en etiqueta; toma de decisiones automatizada con efectos legales (Art. 22 RGPD).",
    },
    {
      id: "s6",
      title: "6. Tratamiento automatizado y elaboración de perfiles",
      body: `Cortéa utiliza el análisis automatizado de sus patrones de respuesta para construir su perfil de comportamiento. Esto está incluido en la definición de elaboración de perfiles en el sentido del Art. 4(4) RGPD.\n\nConfirmamos que:`,
      list: [
        "Esta elaboración de perfiles no tiene efectos legales para usted;",
        "Sirve exclusivamente para mejorar su experiencia de aprendizaje personal;",
        "Tiene derecho a oponerse a esta elaboración de perfiles (véase la Sección 9);",
        "Todos los conocimientos del perfil derivados son visibles únicamente para usted mismo.",
      ],
    },
    {
      id: "s7",
      title: "7. Transferencias a terceros y transferencias internacionales",
      subsections: [
        {
          id: "s7-1",
          title: "7.1 Encargados del tratamiento",
          body: "Utilizamos las siguientes categorías de encargados del tratamiento:",
          list: [
            "Proveedor de alojamiento — Replit Inc. (EE. UU.). Los datos se procesan en servidores que pueden estar ubicados fuera del EEE. Replit está sujeto a cláusulas contractuales estándar (CCE) de conformidad con el Art. 46 RGPD.",
            "Proveedor de IA — Anthropic PBC (EE. UU.), para el procesamiento de interacciones con Counsel. Transferencia sobre la base de CCE.",
            "Procesador de pagos — Stripe Inc. (EE. UU.) y/o Mollie B.V. (NL) para pagos de suscripción. Procesamiento conforme con PCI-DSS y RGPD.",
            "Proveedor de correo electrónico — para el envío de correos electrónicos de autenticación mediante enlace mágico.",
          ],
        },
        { id: "s7-2", title: "7.2 No venta de datos", body: "No vendemos, alquilamos ni comercializamos sus datos personales a terceros." },
        { id: "s7-3", title: "7.3 Obligaciones legales", body: "En casos excepcionales, podemos estar obligados a proporcionar datos personales en virtud de una orden legal o resolución judicial." },
      ],
    },
    {
      id: "s8",
      title: "8. Plazos de conservación",
      table: {
        headers: ["Tipo de datos", "Período de conservación"],
        rows: [
          ["Datos de cuenta (cuenta activa)", "Mientras la cuenta esté activa"],
          ["Datos de cuenta tras la eliminación", "Máximo 30 días (retención de copia de seguridad)"],
          ["Registro Noble Score y progreso", "Mientras la cuenta esté activa"],
          ["Perfil de comportamiento", "Mientras la cuenta esté activa; eliminado al eliminar la cuenta"],
          ["Contenido de conversaciones Counsel", "No almacenado estructuralmente (sin estado por sesión)"],
          ["Tokens de verificación", `Caducan automáticamente después de ${PLACEHOLDER_ES}`],
          ["Tokens de sesión", `Caducan después de ${PLACEHOLDER_ES} de inactividad`],
          ["Datos de facturación", "7 años (obligación legal de contabilidad)"],
          ["Dirección IP para detección de región", "No almacenada de forma persistente a menos que el usuario confirme la región"],
        ],
      },
    },
    {
      id: "s9",
      title: "9. Sus derechos como interesado",
      body: "De conformidad con el RGPD, usted tiene los siguientes derechos:",
      subsections: [
        { id: "s9-1", title: "9.1 Derecho de acceso (Art. 15)", body: "Puede solicitar qué datos personales tratamos sobre usted y recibir una copia." },
        { id: "s9-2", title: "9.2 Derecho de rectificación (Art. 16)", body: "Puede corregir datos incorrectos o incompletos a través de su página de perfil o a través de nosotros." },
        { id: "s9-3", title: "9.3 Derecho de supresión (Art. 17)", body: `Puede eliminar su cuenta y todos los datos asociados. Esto incluye: registro Noble Score, perfil de comportamiento, progreso en Atelier y datos personales. Los datos de facturación se conservan durante el tiempo legalmente requerido.\n\nEn la aplicación: Perfil → Cuenta y Zona de peligro → Eliminar cuenta` },
        { id: "s9-4", title: "9.4 Derecho a la limitación del tratamiento (Art. 18)", body: "En determinadas circunstancias, puede solicitar que el tratamiento de sus datos se limite temporalmente." },
        { id: "s9-5", title: "9.5 Derecho a la portabilidad de datos (Art. 20)", body: "Puede solicitar una exportación estructurada y legible por máquina de sus datos." },
        { id: "s9-6", title: "9.6 Derecho de oposición (Art. 21)", body: "Puede oponerse al tratamiento basado en interés legítimo, incluida la elaboración de perfiles de comportamiento. Tras la oposición, cesaremos el tratamiento correspondiente salvo que existan motivos legítimos imperiosos." },
        { id: "s9-7", title: "9.7 Derecho a retirar el consentimiento (Art. 7.3)", body: "Si el tratamiento se basa en el consentimiento (p. ej., correos de marketing), puede retirar este consentimiento en cualquier momento sin necesidad de justificación." },
      ],
      howToRequest: "Envíe un correo electrónico a [privacy@cortea.app] indicando su nombre, dirección de correo electrónico y el tipo de solicitud. Respondemos en un plazo de 30 días naturales.",
    },
    {
      id: "s10",
      title: "10. Seguridad",
      body: "Adoptamos medidas técnicas y organizativas adecuadas para proteger sus datos:",
      list: [
        "Autenticación sin contraseña — el sistema de enlace mágico elimina los riesgos de contraseñas filtradas;",
        "Tokens de sesión en el servidor — los tokens no se almacenan como texto sin cifrar en el navegador;",
        "HTTPS/TLS — todas las comunicaciones están cifradas;",
        "Restricción de acceso — solo el personal autorizado tiene acceso a los datos de producción;",
        "Eliminación en cascada — al eliminar la cuenta, todos los datos vinculados se eliminan de forma atómica.",
      ],
      note: "En caso de una violación de datos que suponga riesgos para sus derechos y libertades, informaremos a la Autoridad de Protección de Datos en un plazo de 72 horas (Art. 33 RGPD) y le notificaremos personalmente si es necesario (Art. 34 RGPD).",
    },
    {
      id: "s11",
      title: "11. Cookies y almacenamiento local",
      body: "Cortéa utiliza:",
      list: [
        "Cookies de sesión — estrictamente necesarias para la autenticación y el funcionamiento de la sesión;",
        "Almacenamiento funcional — para las preferencias de idioma y la configuración de la interfaz.",
      ],
      note: "No utilizamos cookies de seguimiento, cookies publicitarias ni análisis entre sitios.",
    },
    {
      id: "s12",
      title: "12. Menores",
      body: "Cortéa no está dirigida a personas menores de 16 años. No recopilamos conscientemente datos personales de menores. Si sospecha que un menor ha creado una cuenta, le pedimos que nos contacte.",
    },
    {
      id: "s13",
      title: "13. Reclamaciones",
      body: "Si considera que no estamos tratando correctamente sus datos personales, puede presentar una reclamación ante:",
      note: `Autoridad de Protección de Datos (APD)\nDrukpersstraat 35, 1000 Bruselas\ncontact@apd-gba.be | www.gegevensbeschermingsautoriteit.be\n\nNo obstante, agradeceríamos que primero se pusiera en contacto con nosotros para resolver cualquier problema directamente.`,
    },
    {
      id: "s14",
      title: "14. Cambios en esta política de privacidad",
      body: "Podemos actualizar periódicamente esta política de privacidad. Para cambios materiales, le informaremos por correo electrónico o mediante una notificación en la aplicación. La fecha de la última actualización aparece en la parte superior de este documento.",
    },
    {
      id: "s15",
      title: "15. Datos de contacto",
      body: "Para todas las preguntas sobre esta política de privacidad o sus datos personales:",
      note: `★ [Nombre de la empresa]\nCorreo electrónico: [privacy@cortea.app]\nSitio web: [cortea.app/privacy]`,
    },
  ],
};

export const policyContentIT: PolicyContent = {
  meta: {
    title: "Informativa sulla privacy — Cortéa",
    version: "Versione: 1.0",
    effectiveDateLabel: "Data di entrata in vigore:",
    effectiveDateValue: PLACEHOLDER_IT,
    responsibleLabel: "Titolare del trattamento:",
    responsibleValue: `[Nome dell'azienda / Nome], [Indirizzo], [E-mail]`,
    supervisorLabel: "Autorità di vigilanza:",
    supervisorValue: "Autorità per la protezione dei dati (APD) — www.gegevensbeschermingsautoriteit.be",
    placeholderNote: "I campi contrassegnati con ★ sono segnaposto legali che devono essere compilati prima della pubblicazione.",
  },
  sections: [
    {
      id: "s1",
      title: "1. Introduzione e identità del titolare del trattamento",
      body: `Cortéa ("noi", "ci", "l'app") è una piattaforma di intelligenza culturale e formazione all'etichetta. Aiuta gli utenti a comprendere e applicare le norme sociali, i comportamenti comunicativi e le consuetudini culturali in un contesto internazionale.\n\nIl titolare del trattamento ai sensi del Regolamento generale sulla protezione dei dati (GDPR) è:`,
      note: `★ [Nome dell'azienda]\n[Indirizzo]\n[CAP, Città, Paese]\nE-mail: [privacy@cortea.app]\nPartita IVA: ${PLACEHOLDER_IT}`,
      body2: "Per tutte le domande, richieste o reclami relativi ai tuoi dati personali, puoi contattarci all'indirizzo e-mail indicato sopra.",
    } as PolicySection & { body2: string },
    {
      id: "s2",
      title: "2. Ambito di applicazione",
      body: "La presente informativa sulla privacy si applica a:",
      list: [
        "L'utilizzo dell'applicazione web Cortéa e di eventuali future versioni mobili;",
        "Tutti i servizi offerti tramite cortea.app;",
        "Il trattamento dei dati personali di visitatori, utenti registrati e abbonati.",
      ],
      note: "Questa informativa non si applica a siti web o servizi esterni a cui Cortéa potrebbe fare riferimento.",
    },
    {
      id: "s3",
      title: "3. Quali dati personali trattiamo?",
      subsections: [
        {
          id: "s3-1",
          title: "3.1 Dati dell'account",
          body: "Al momento della registrazione raccogliamo:",
          list: [
            "Indirizzo e-mail (obbligatorio, funge da identificatore univoco)",
            "Nome completo (facoltativo, solo se fornito dall'utente)",
            "Anno di nascita (facoltativo, per la personalizzazione contestuale)",
            "Identità di genere (facoltativa, fornita volontariamente)",
            "Token di verifica e data di scadenza (temporanei, per la verifica e-mail tramite link magico)",
            "Token di sessione (archiviato lato server, per l'autenticazione)",
          ],
        },
        {
          id: "s3-2",
          title: "3.2 Dati di utilizzo e progressi",
          body: "Durante l'utilizzo di Cortéa trattiamo:",
          list: [
            "Noble Score e storico dei punteggi (punti per scenario, eventi di avanzamento di livello)",
            "Risposte agli scenari (le scelte effettuate in ciascuna situazione di pratica)",
            "Regione attiva (l'area culturale impostata come contesto)",
            "Preferenza linguistica (la lingua dell'interfaccia tra le 9 disponibili)",
            "Timestamp di attività",
          ],
        },
        {
          id: "s3-3",
          title: "3.3 Profilo comportamentale (Behavioral Intelligence Layer)",
          body: `Cortéa contiene un livello di intelligenza comportamentale invisibile che costruisce ulteriori informazioni basate sulle tue risposte. Questo livello funziona completamente in background e mostra i risultati esclusivamente nel linguaggio dell'etichetta, mai in terminologia psicologica o clinica.\n\nNello specifico trattiamo:`,
          list: [
            "Cluster Bolton (attenzione agli altri, stile assertivo, approccio ai conflitti) — derivati dal riconoscimento di schemi nelle tue risposte agli scenari;",
            "Punteggio di consapevolezza non verbale (basato sul modello Mehrabian per 18 regioni culturali);",
            "Dimensioni EQ (Attentiveness, Composure, Discernment, Diplomacy, Presence) — visualizzate come 'Bussola del Raffinamento' nel tuo profilo;",
            "Stile di correzione: quando rispondi erroneamente a uno scenario, il sistema memorizza lo stile di mentoring associato per personalizzare la guida.",
          ],
          note: "Importante: questi dati vengono utilizzati esclusivamente per la guida personale all'interno dell'app. Non vengono mai condivisi con terzi, mai utilizzati per la pubblicità e mai analizzati al di fuori del contesto del tuo progresso personale.",
        },
        {
          id: "s3-4",
          title: "3.4 Dati di comunicazione",
          list: [
            "Conversazioni con The Counsel (consulente di etichetta IA) — elaborate temporaneamente per generare risposte; il contenuto non viene archiviato strutturalmente salvo diversa indicazione;",
            "E-mail per l'autenticazione tramite link magico.",
          ],
        },
        {
          id: "s3-5",
          title: "3.5 Dati tecnici",
          list: [
            "Indirizzo IP (temporaneo, per il rilevamento della regione — non archiviato in modo persistente a meno che l'utente non confermi la regione);",
            "Tipo e versione del browser (tramite intestazioni HTTP standard);",
            "Fuso orario.",
          ],
        },
      ],
    },
    {
      id: "s4",
      title: "4. Basi giuridiche del trattamento",
      body: "Trattiamo i tuoi dati personali sulla base dei seguenti fondamenti giuridici (Art. 6 GDPR):",
      table: {
        headers: ["Trattamento", "Base giuridica"],
        rows: [
          ["Gestione dell'account e autenticazione", "Esecuzione del contratto (Art. 6.1.b)"],
          ["Noble Score e gestione dei progressi", "Esecuzione del contratto (Art. 6.1.b)"],
          ["Profilo comportamentale (Bolton/Mehrabian)", "Legittimo interesse — miglioramento della qualità del servizio (Art. 6.1.f)"],
          ["Interazioni con Counsel IA", "Esecuzione del contratto (Art. 6.1.b)"],
          ["Fatturazione e gestione degli abbonamenti", "Obbligo legale + esecuzione del contratto (Art. 6.1.b e 6.1.c)"],
          ["Rilevamento della regione tramite IP", "Legittimo interesse — personalizzazione del servizio (Art. 6.1.f)"],
          ["Comunicazioni di marketing", "Consenso (Art. 6.1.a) — solo se ti sei iscritto"],
        ],
      },
    },
    {
      id: "s5",
      title: "5. Come utilizziamo i tuoi dati?",
      body: "Utilizziamo i tuoi dati personali esclusivamente per:",
      list: [
        "La fornitura del servizio — accesso all'Atelier, al Counsel e al Cultural Compass;",
        "La personalizzazione — adattare scenari, guida e informazioni al tuo profilo e alla tua regione;",
        "La gestione dei progressi — monitoraggio del tuo Noble Score, padronanza dei domini e storico dell'apprendimento;",
        "La gestione degli abbonamenti e dei pagamenti — elaborazione del tuo livello di abbonamento tramite il nostro fornitore di pagamenti;",
        "Il funzionamento tecnico — autenticazione, gestione delle sessioni e sicurezza;",
        "Il miglioramento del servizio — analisi anonimizzate o aggregate dei modelli di utilizzo.",
      ],
      note: "Non utilizziamo mai i tuoi dati per: pubblicità mirata a te o a terzi; vendita o locazione dei tuoi dati; profilazione al di fuori del contesto della tua formazione all'etichetta; presa di decisioni automatizzata con effetti giuridici (Art. 22 GDPR).",
    },
    {
      id: "s6",
      title: "6. Trattamento automatizzato e profilazione",
      body: `Cortéa utilizza l'analisi automatizzata dei tuoi schemi di risposta per costruire il tuo profilo comportamentale. Ciò rientra nella definizione di profilazione ai sensi dell'Art. 4(4) GDPR.\n\nConfermiamo che:`,
      list: [
        "Questa profilazione non ha effetti giuridici per te;",
        "Serve esclusivamente a migliorare la tua esperienza di apprendimento personale;",
        "Hai il diritto di opporti a questa profilazione (vedi Sezione 9);",
        "Tutte le informazioni di profilo derivate sono visibili solo a te stesso.",
      ],
    },
    {
      id: "s7",
      title: "7. Trasferimenti a terzi e trasferimenti internazionali",
      subsections: [
        {
          id: "s7-1",
          title: "7.1 Responsabili del trattamento",
          body: "Utilizziamo le seguenti categorie di responsabili del trattamento:",
          list: [
            "Fornitore di hosting — Replit Inc. (USA). I dati vengono elaborati su server che potrebbero trovarsi al di fuori del SEE. Replit è soggetto alle clausole contrattuali standard (CCS) ai sensi dell'Art. 46 GDPR.",
            "Fornitore di IA — Anthropic PBC (USA), per l'elaborazione delle interazioni con Counsel. Trasferimento sulla base delle CCS.",
            "Processore di pagamenti — Stripe Inc. (USA) e/o Mollie B.V. (NL) per i pagamenti degli abbonamenti. Trattamento conforme a PCI-DSS e GDPR.",
            "Fornitore di e-mail — per l'invio di e-mail di autenticazione tramite link magico.",
          ],
        },
        { id: "s7-2", title: "7.2 Nessuna vendita di dati", body: "Non vendiamo, affittiamo né commercializziamo i tuoi dati personali a terzi." },
        { id: "s7-3", title: "7.3 Obblighi legali", body: "In casi eccezionali potremmo essere obbligati a fornire dati personali in virtù di un ordine legale o di una sentenza del tribunale." },
      ],
    },
    {
      id: "s8",
      title: "8. Periodi di conservazione",
      table: {
        headers: ["Tipo di dati", "Periodo di conservazione"],
        rows: [
          ["Dati dell'account (account attivo)", "Per tutto il tempo in cui l'account è attivo"],
          ["Dati dell'account dopo la cancellazione", "Massimo 30 giorni (conservazione di backup)"],
          ["Log Noble Score e progressi", "Per tutto il tempo in cui l'account è attivo"],
          ["Profilo comportamentale", "Per tutto il tempo in cui l'account è attivo; eliminato alla cancellazione dell'account"],
          ["Contenuto delle conversazioni Counsel", "Non archiviato strutturalmente (stateless per sessione)"],
          ["Token di verifica", `Scadono automaticamente dopo ${PLACEHOLDER_IT}`],
          ["Token di sessione", `Scadono dopo ${PLACEHOLDER_IT} di inattività`],
          ["Dati di fatturazione", "7 anni (obbligo legale di contabilità)"],
          ["Indirizzo IP per il rilevamento della regione", "Non archiviato in modo persistente a meno che l'utente non confermi la regione"],
        ],
      },
    },
    {
      id: "s9",
      title: "9. I tuoi diritti come interessato",
      body: "Ai sensi del GDPR hai i seguenti diritti:",
      subsections: [
        { id: "s9-1", title: "9.1 Diritto di accesso (Art. 15)", body: "Puoi richiedere quali dati personali trattiamo su di te e riceverne una copia." },
        { id: "s9-2", title: "9.2 Diritto di rettifica (Art. 16)", body: "Puoi far correggere dati errati o incompleti tramite la tua pagina del profilo o tramite noi." },
        { id: "s9-3", title: "9.3 Diritto alla cancellazione (Art. 17)", body: `Puoi eliminare il tuo account e tutti i dati associati. Ciò include: log Noble Score, profilo comportamentale, progressi nell'Atelier e dati personali. I dati di fatturazione vengono conservati per il tempo legalmente richiesto.\n\nNell'app: Profilo → Account e Zona pericolosa → Elimina account` },
        { id: "s9-4", title: "9.4 Diritto alla limitazione del trattamento (Art. 18)", body: "In determinate circostanze puoi richiedere che il trattamento dei tuoi dati venga temporaneamente limitato." },
        { id: "s9-5", title: "9.5 Diritto alla portabilità dei dati (Art. 20)", body: "Puoi richiedere un'esportazione strutturata e leggibile da macchina dei tuoi dati." },
        { id: "s9-6", title: "9.6 Diritto di opposizione (Art. 21)", body: "Puoi opporti al trattamento basato su legittimo interesse, inclusa la profilazione comportamentale. Dopo l'opposizione, cesseremo il relativo trattamento a meno che non vi siano motivi legittimi impellenti." },
        { id: "s9-7", title: "9.7 Diritto di revoca del consenso (Art. 7.3)", body: "Se il trattamento è basato sul consenso (ad es. e-mail di marketing), puoi revocare questo consenso in qualsiasi momento senza dover fornire motivazioni." },
      ],
      howToRequest: "Invia un'e-mail a [privacy@cortea.app] specificando il tuo nome, indirizzo e-mail e il tipo di richiesta. Rispondiamo entro 30 giorni di calendario.",
    },
    {
      id: "s10",
      title: "10. Sicurezza",
      body: "Adottiamo misure tecniche e organizzative adeguate per proteggere i tuoi dati:",
      list: [
        "Autenticazione senza password — il sistema con link magico elimina i rischi di password trapelate;",
        "Token di sessione lato server — i token non vengono archiviati in testo normale nel browser;",
        "HTTPS/TLS — tutte le comunicazioni sono crittografate;",
        "Restrizione dell'accesso — solo il personale autorizzato ha accesso ai dati di produzione;",
        "Eliminazione a cascata — alla cancellazione dell'account, tutti i dati collegati vengono eliminati in modo atomico.",
      ],
      note: "In caso di violazione dei dati che comporta rischi per i tuoi diritti e le tue libertà, informeremo l'Autorità per la protezione dei dati entro 72 ore (Art. 33 GDPR) e ti avviseremo personalmente se necessario (Art. 34 GDPR).",
    },
    {
      id: "s11",
      title: "11. Cookie e archiviazione locale",
      body: "Cortéa utilizza:",
      list: [
        "Cookie di sessione — strettamente necessari per l'autenticazione e il funzionamento della sessione;",
        "Archiviazione funzionale — per le preferenze linguistiche e le impostazioni dell'interfaccia.",
      ],
      note: "Non utilizziamo cookie di tracciamento, cookie pubblicitari né analisi cross-site.",
    },
    {
      id: "s12",
      title: "12. Minori",
      body: "Cortéa non è rivolta a persone di età inferiore a 16 anni. Non raccogliamo consapevolmente dati personali di minori. Se sospetti che un minore abbia creato un account, ti chiediamo di contattarci.",
    },
    {
      id: "s13",
      title: "13. Reclami",
      body: "Se ritieni che non stiamo trattando correttamente i tuoi dati personali, puoi presentare un reclamo presso:",
      note: `Autorità per la protezione dei dati (APD)\nDrukpersstraat 35, 1000 Bruxelles\ncontact@apd-gba.be | www.gegevensbeschermingsautoriteit.be\n\nApprezzeremmo tuttavia se tu ci contattassi prima, in modo da poter risolvere eventuali problemi direttamente.`,
    },
    {
      id: "s14",
      title: "14. Modifiche a questa informativa sulla privacy",
      body: "Potremmo aggiornare periodicamente questa informativa sulla privacy. Per le modifiche sostanziali, ti informeremo via e-mail o tramite una notifica nell'app. La data dell'ultimo aggiornamento appare in cima a questo documento.",
    },
    {
      id: "s15",
      title: "15. Dati di contatto",
      body: "Per tutte le domande su questa informativa sulla privacy o sui tuoi dati personali:",
      note: `★ [Nome dell'azienda]\nE-mail: [privacy@cortea.app]\nSito web: [cortea.app/privacy]`,
    },
  ],
};

export const policyContentPT: PolicyContent = {
  meta: {
    title: "Política de privacidade — Cortéa",
    version: "Versão: 1.0",
    effectiveDateLabel: "Data de entrada em vigor:",
    effectiveDateValue: PLACEHOLDER_PT,
    responsibleLabel: "Responsável pelo tratamento:",
    responsibleValue: `[Nome da empresa / Nome], [Endereço], [E-mail]`,
    supervisorLabel: "Autoridade supervisora:",
    supervisorValue: "Autoridade de Proteção de Dados (APD) — www.gegevensbeschermingsautoriteit.be",
    placeholderNote: "Os campos marcados com ★ são marcadores jurídicos que devem ser preenchidos antes da publicação.",
  },
  sections: [
    {
      id: "s1",
      title: "1. Introdução e identidade do responsável pelo tratamento",
      body: `A Cortéa ("nós", "nos", "a aplicação") é uma plataforma de inteligência cultural e formação em etiqueta. Ajuda os utilizadores a compreender e aplicar normas sociais, comportamentos de comunicação e costumes culturais num contexto internacional.\n\nO responsável pelo tratamento, na aceção do Regulamento Geral sobre a Proteção de Dados (RGPD), é:`,
      note: `★ [Nome da empresa]\n[Endereço]\n[Código postal, Cidade, País]\nE-mail: [privacy@cortea.app]\nNIF: ${PLACEHOLDER_PT}`,
      body2: "Para todas as questões, pedidos ou reclamações relacionados com os seus dados pessoais, pode contactar-nos através do endereço de e-mail indicado acima.",
    } as PolicySection & { body2: string },
    {
      id: "s2",
      title: "2. Âmbito de aplicação",
      body: "Esta política de privacidade aplica-se a:",
      list: [
        "A utilização da aplicação web da Cortéa e de eventuais futuras versões móveis;",
        "Todos os serviços oferecidos através de cortea.app;",
        "O tratamento de dados pessoais de visitantes, utilizadores registados e assinantes.",
      ],
      note: "Esta política não se aplica a websites ou serviços externos para os quais a Cortéa possa remeter.",
    },
    {
      id: "s3",
      title: "3. Que dados pessoais tratamos?",
      subsections: [
        {
          id: "s3-1",
          title: "3.1 Dados de conta",
          body: "No momento do registo, recolhemos:",
          list: [
            "Endereço de e-mail (obrigatório, serve como identificador único)",
            "Nome completo (opcional, apenas se fornecido pelo utilizador)",
            "Ano de nascimento (opcional, para personalização contextual)",
            "Identidade de género (opcional, fornecida voluntariamente)",
            "Token de verificação e data de expiração (temporários, para verificação de e-mail por link mágico)",
            "Token de sessão (armazenado no servidor, para autenticação)",
          ],
        },
        {
          id: "s3-2",
          title: "3.2 Dados de utilização e progresso",
          body: "Durante a utilização da Cortéa tratamos:",
          list: [
            "Noble Score e histórico de pontuações (pontos por cenário, eventos de subida de nível)",
            "Respostas a cenários (as escolhas que fez em cada situação de prática)",
            "Região ativa (a área cultural que definiu como contexto)",
            "Preferência de idioma (o seu idioma de interface dos 9 disponíveis)",
            "Timestamps de atividade",
          ],
        },
        {
          id: "s3-3",
          title: "3.3 Perfil de comportamento (Behavioral Intelligence Layer)",
          body: `A Cortéa contém uma camada de inteligência comportamental invisível que constrói informações adicionais com base nas suas respostas. Esta camada funciona completamente em segundo plano e apresenta resultados exclusivamente em linguagem de etiqueta — nunca em terminologia psicológica ou clínica.\n\nConcretamente tratamos:`,
          list: [
            "Clusters Bolton (atenção aos outros, estilo de assertividade, abordagem de conflitos) — derivados do reconhecimento de padrões nas suas respostas aos cenários;",
            "Pontuação de consciência não verbal (baseada no modelo Mehrabian para 18 regiões culturais);",
            "Dimensões EQ (Attentiveness, Composure, Discernment, Diplomacy, Presence) — apresentadas como a 'Bússola de Refinamento' no seu perfil;",
            "Estilo de correção: quando responde incorretamente a um cenário, o sistema armazena o estilo de mentoria associado para personalizar a orientação.",
          ],
          note: "Importante: estes dados são utilizados exclusivamente para orientação pessoal dentro da aplicação. Nunca são partilhados com terceiros, nunca utilizados para publicidade e nunca analisados fora do contexto do seu progresso pessoal.",
        },
        {
          id: "s3-4",
          title: "3.4 Dados de comunicação",
          list: [
            "Conversas com The Counsel (consultor de etiqueta IA) — processadas temporariamente para gerar respostas; o conteúdo não é armazenado estruturalmente salvo indicação contrária;",
            "E-mails para autenticação por link mágico.",
          ],
        },
        {
          id: "s3-5",
          title: "3.5 Dados técnicos",
          list: [
            "Endereço IP (temporário, para deteção de região — não armazenado de forma persistente a menos que o utilizador confirme a região);",
            "Tipo e versão do browser (através de cabeçalhos HTTP padrão);",
            "Fuso horário.",
          ],
        },
      ],
    },
    {
      id: "s4",
      title: "4. Bases jurídicas do tratamento",
      body: "Tratamos os seus dados pessoais com base nos seguintes fundamentos jurídicos (Art. 6.º RGPD):",
      table: {
        headers: ["Tratamento", "Base jurídica"],
        rows: [
          ["Gestão de conta e autenticação", "Execução do contrato (Art. 6.1.b)"],
          ["Noble Score e gestão do progresso", "Execução do contrato (Art. 6.1.b)"],
          ["Perfil de comportamento (Bolton/Mehrabian)", "Interesse legítimo — melhoria da qualidade do serviço (Art. 6.1.f)"],
          ["Interações com Counsel IA", "Execução do contrato (Art. 6.1.b)"],
          ["Faturação e gestão de subscrições", "Obrigação legal + execução do contrato (Art. 6.1.b e 6.1.c)"],
          ["Deteção de região por IP", "Interesse legítimo — personalização do serviço (Art. 6.1.f)"],
          ["Comunicações de marketing", "Consentimento (Art. 6.1.a) — apenas se subscreveu"],
        ],
      },
    },
    {
      id: "s5",
      title: "5. Como utilizamos os seus dados?",
      body: "Utilizamos os seus dados pessoais exclusivamente para:",
      list: [
        "A prestação do serviço — acesso ao Atelier, Counsel e Cultural Compass;",
        "Personalização — adaptar cenários, orientação e informações ao seu perfil e região;",
        "Gestão do progresso — acompanhamento do seu Noble Score, domínio de áreas e historial de aprendizagem;",
        "Gestão de subscrições e pagamentos — processamento do seu nível de subscrição através do nosso fornecedor de pagamentos;",
        "Funcionamento técnico — autenticação, gestão de sessões e segurança;",
        "Melhoria do serviço — análises anonimizadas ou agregadas de padrões de utilização.",
      ],
      note: "Nunca utilizamos os seus dados para: publicidade direcionada a si ou a terceiros; venda ou aluguer dos seus dados; criação de perfis fora do contexto da sua formação em etiqueta; tomada de decisões automatizada com efeitos jurídicos (Art. 22.º RGPD).",
    },
    {
      id: "s6",
      title: "6. Tratamento automatizado e criação de perfis",
      body: `A Cortéa utiliza análise automatizada dos seus padrões de resposta para construir o seu perfil de comportamento. Isto enquadra-se na definição de criação de perfis na aceção do Art. 4.º, n.º 4 do RGPD.\n\nConfirmamos que:`,
      list: [
        "Esta criação de perfis não tem efeitos jurídicos para si;",
        "Serve exclusivamente para melhorar a sua experiência de aprendizagem pessoal;",
        "Tem o direito de se opor a esta criação de perfis (ver Secção 9);",
        "Todas as informações de perfil derivadas são visíveis apenas para si próprio.",
      ],
    },
    {
      id: "s7",
      title: "7. Transferências a terceiros e transferências internacionais",
      subsections: [
        {
          id: "s7-1",
          title: "7.1 Subcontratantes",
          body: "Utilizamos as seguintes categorias de subcontratantes:",
          list: [
            "Fornecedor de alojamento — Replit Inc. (EUA). Os dados são processados em servidores que podem estar localizados fora do EEE. A Replit está sujeita a cláusulas contratuais padrão (CCP) nos termos do Art. 46.º do RGPD.",
            "Fornecedor de IA — Anthropic PBC (EUA), para o processamento de interações com Counsel. Transferência com base em CCP.",
            "Processador de pagamentos — Stripe Inc. (EUA) e/ou Mollie B.V. (NL) para pagamentos de subscrições. Processamento em conformidade com PCI-DSS e RGPD.",
            "Fornecedor de e-mail — para envio de e-mails de autenticação por link mágico.",
          ],
        },
        { id: "s7-2", title: "7.2 Sem venda de dados", body: "Não vendemos, alugamos nem comercializamos os seus dados pessoais a terceiros." },
        { id: "s7-3", title: "7.3 Obrigações legais", body: "Em casos excecionais, podemos ser obrigados a fornecer dados pessoais por força de uma ordem legal ou decisão judicial." },
      ],
    },
    {
      id: "s8",
      title: "8. Prazos de conservação",
      table: {
        headers: ["Tipo de dados", "Prazo de conservação"],
        rows: [
          ["Dados de conta (conta ativa)", "Enquanto a conta estiver ativa"],
          ["Dados de conta após eliminação", "Máximo 30 dias (retenção de cópia de segurança)"],
          ["Registo Noble Score e progresso", "Enquanto a conta estiver ativa"],
          ["Perfil de comportamento", "Enquanto a conta estiver ativa; eliminado na eliminação da conta"],
          ["Conteúdo de conversas Counsel", "Não armazenado estruturalmente (stateless por sessão)"],
          ["Tokens de verificação", `Expiram automaticamente após ${PLACEHOLDER_PT}`],
          ["Tokens de sessão", `Expiram após ${PLACEHOLDER_PT} de inatividade`],
          ["Dados de faturação", "7 anos (obrigação legal de contabilidade)"],
          ["Endereço IP para deteção de região", "Não armazenado de forma persistente a menos que o utilizador confirme a região"],
        ],
      },
    },
    {
      id: "s9",
      title: "9. Os seus direitos como titular dos dados",
      body: "Ao abrigo do RGPD, tem os seguintes direitos:",
      subsections: [
        { id: "s9-1", title: "9.1 Direito de acesso (Art. 15.º)", body: "Pode solicitar quais os dados pessoais que tratamos sobre si e receber uma cópia." },
        { id: "s9-2", title: "9.2 Direito de retificação (Art. 16.º)", body: "Pode solicitar a correção de dados incorretos ou incompletos através da sua página de perfil ou através de nós." },
        { id: "s9-3", title: "9.3 Direito ao apagamento (Art. 17.º)", body: `Pode eliminar a sua conta e todos os dados associados. Isto inclui: registo Noble Score, perfil de comportamento, progresso no Atelier e dados pessoais. Os dados de faturação são conservados durante o tempo legalmente exigido.\n\nNa aplicação: Perfil → Conta e Zona de perigo → Eliminar conta` },
        { id: "s9-4", title: "9.4 Direito à limitação do tratamento (Art. 18.º)", body: "Em determinadas circunstâncias, pode solicitar que o tratamento dos seus dados seja temporariamente limitado." },
        { id: "s9-5", title: "9.5 Direito à portabilidade dos dados (Art. 20.º)", body: "Pode solicitar uma exportação estruturada e legível por máquina dos seus dados." },
        { id: "s9-6", title: "9.6 Direito de oposição (Art. 21.º)", body: "Pode opor-se ao tratamento com base em interesse legítimo, incluindo a criação de perfis comportamentais. Após a oposição, cessaremos o tratamento em causa, salvo se existirem fundamentos legítimos imperiosos." },
        { id: "s9-7", title: "9.7 Direito de retirar o consentimento (Art. 7.º, n.º 3)", body: "Se o tratamento se basear no consentimento (por exemplo, e-mails de marketing), pode retirar esse consentimento a qualquer momento sem necessidade de justificação." },
      ],
      howToRequest: "Envie um e-mail para [privacy@cortea.app] indicando o seu nome, endereço de e-mail e o tipo de pedido. Respondemos no prazo de 30 dias de calendário.",
    },
    {
      id: "s10",
      title: "10. Segurança",
      body: "Tomamos medidas técnicas e organizativas adequadas para proteger os seus dados:",
      list: [
        "Autenticação sem palavra-passe — o sistema de link mágico elimina os riscos de palavras-passe expostas;",
        "Tokens de sessão no servidor — os tokens não são armazenados em texto simples no browser;",
        "HTTPS/TLS — todas as comunicações são encriptadas;",
        "Restrição de acesso — apenas o pessoal autorizado tem acesso aos dados de produção;",
        "Eliminação em cascata — na eliminação da conta, todos os dados associados são eliminados de forma atómica.",
      ],
      note: "Em caso de violação de dados que coloque em risco os seus direitos e liberdades, informaremos a Autoridade de Proteção de Dados no prazo de 72 horas (Art. 33.º RGPD) e notificá-lo-emos pessoalmente se necessário (Art. 34.º RGPD).",
    },
    {
      id: "s11",
      title: "11. Cookies e armazenamento local",
      body: "A Cortéa utiliza:",
      list: [
        "Cookies de sessão — estritamente necessários para autenticação e funcionamento da sessão;",
        "Armazenamento funcional — para preferências de idioma e definições de interface.",
      ],
      note: "Não utilizamos cookies de rastreamento, cookies publicitários nem análises entre sites.",
    },
    {
      id: "s12",
      title: "12. Menores",
      body: "A Cortéa não se destina a pessoas com menos de 16 anos. Não recolhemos conscientemente dados pessoais de menores. Se suspeitar que um menor criou uma conta, pedimos-lhe que nos contacte.",
    },
    {
      id: "s13",
      title: "13. Reclamações",
      body: "Se considerar que não estamos a tratar corretamente os seus dados pessoais, pode apresentar uma reclamação junto de:",
      note: `Autoridade de Proteção de Dados (APD)\nDrukpersstraat 35, 1000 Bruxelas\ncontact@apd-gba.be | www.gegevensbeschermingsautoriteit.be\n\nAgradecemos, no entanto, que nos contacte primeiro para que possamos resolver eventuais problemas diretamente.`,
    },
    {
      id: "s14",
      title: "14. Alterações a esta política de privacidade",
      body: "Podemos atualizar periodicamente esta política de privacidade. Para alterações materiais, informá-lo-emos por e-mail ou através de uma notificação na aplicação. A data da última atualização consta no topo deste documento.",
    },
    {
      id: "s15",
      title: "15. Dados de contacto",
      body: "Para todas as questões sobre esta política de privacidade ou os seus dados pessoais:",
      note: `★ [Nome da empresa]\nE-mail: [privacy@cortea.app]\nSite: [cortea.app/privacy]`,
    },
  ],
};

export const policyContentJA: PolicyContent = {
  meta: {
    title: "プライバシーポリシー — Cortéa",
    version: "バージョン：1.0",
    effectiveDateLabel: "発効日：",
    effectiveDateValue: PLACEHOLDER_JA,
    responsibleLabel: "データ管理者：",
    responsibleValue: `[会社名 / 氏名]、[住所]、[メールアドレス]`,
    supervisorLabel: "監督機関：",
    supervisorValue: "データ保護局（GBA）— www.gegevensbeschermingsautoriteit.be",
    placeholderNote: "★のマークが付いたフィールドは、公開前に記入が必要な法的プレースホルダーです。",
  },
  sections: [
    {
      id: "s1",
      title: "1. はじめに及びデータ管理者の身元",
      body: `Cortéa（「私たち」、「当社」、「このアプリ」）は、文化的インテリジェンスとエチケットトレーニングのプラットフォームです。国際的な文脈において、社会的規範、コミュニケーション行動、文化的慣習を理解し実践するために、ユーザーをサポートします。\n\n一般データ保護規則（GDPR）の意味におけるデータ管理者は：`,
      note: `★ [会社名]\n[住所]\n[郵便番号、市区町村、国]\nメール：[privacy@cortea.app]\n法人番号：${PLACEHOLDER_JA}`,
      body2: "個人データに関するすべてのご質問、ご要望、またはご不満については、上記のメールアドレスよりお問い合わせください。",
    } as PolicySection & { body2: string },
    {
      id: "s2",
      title: "2. 適用範囲",
      body: "このプライバシーポリシーは以下に適用されます：",
      list: [
        "Cortéaウェブアプリケーション及び将来のモバイル版の使用；",
        "cortea.appを通じて提供されるすべてのサービス；",
        "訪問者、登録ユーザー、購読者の個人データの処理。",
      ],
      note: "このポリシーは、Cortéaが参照する可能性のある外部ウェブサイトやサービスには適用されません。",
    },
    {
      id: "s3",
      title: "3. どのような個人データを処理しますか？",
      subsections: [
        {
          id: "s3-1",
          title: "3.1 アカウントデータ",
          body: "登録時に収集する情報：",
          list: [
            "メールアドレス（必須、一意の識別子として使用）",
            "氏名（任意、ユーザーが入力した場合のみ）",
            "生年（任意、文脈的なパーソナライズのため）",
            "性自認（任意、任意で提供）",
            "確認トークンと有効期限（一時的、マジックリンクによるメール確認用）",
            "セッショントークン（サーバーサイドに保存、認証用）",
          ],
        },
        {
          id: "s3-2",
          title: "3.2 使用データと進捗",
          body: "Cortéaの使用中に処理するデータ：",
          list: [
            "Noble Scoreとスコア履歴（シナリオごとのポイント、レベルアップイベント）",
            "シナリオへの回答（各練習状況での選択内容）",
            "アクティブなリージョン（コンテキストとして設定した文化エリア）",
            "言語設定（9つの利用可能な言語から選択したUI言語）",
            "活動タイムスタンプ",
          ],
        },
        {
          id: "s3-3",
          title: "3.3 行動プロファイル（Behavioral Intelligence Layer）",
          body: `Cortéaには、ユーザーの回答に基づいて追加の洞察を構築する、見えない行動インテリジェンス層があります。この層は完全にバックグラウンドで動作し、エチケット言語でのみ結果を表示します。心理的または臨床的な用語は一切使用しません。\n\n具体的に処理するデータ：`,
          list: [
            "Boltonクラスター（他者への注意、主張スタイル、対立へのアプローチ）— シナリオの回答パターン認識から導出；",
            "非言語的認識スコア（18の文化的地域に対するMehrabianモデルに基づく）；",
            "EQディメンション（Attentiveness, Composure, Discernment, Diplomacy, Presence）— プロフィールの「洗練コンパス」として表示；",
            "修正スタイル：シナリオに誤答した場合、システムが関連するメンタースタイルを保存してガイダンスをパーソナライズ。",
          ],
          note: "重要：これらのデータはアプリ内での個人的なガイダンスのためのみに使用されます。第三者と共有されること、広告に使用されること、または個人の進捗状況のコンテキスト外で分析されることは一切ありません。",
        },
        {
          id: "s3-4",
          title: "3.4 通信データ",
          list: [
            "The Counsel（AIエチケットアドバイザー）との会話 — 回答生成のために一時的に処理；特に明記されない限り、コンテンツは構造的に保存されない；",
            "マジックリンク認証のためのメール。",
          ],
        },
        {
          id: "s3-5",
          title: "3.5 技術データ",
          list: [
            "IPアドレス（一時的、地域検出用 — ユーザーが地域を確認しない限り永続的に保存されない）；",
            "ブラウザの種類とバージョン（標準HTTPヘッダー経由）；",
            "タイムゾーン。",
          ],
        },
      ],
    },
    {
      id: "s4",
      title: "4. 処理の法的根拠",
      body: "以下の法的根拠に基づいてお客様の個人データを処理します（GDPR第6条）：",
      table: {
        headers: ["処理", "法的根拠"],
        rows: [
          ["アカウント管理と認証", "契約の履行（第6.1.b条）"],
          ["Noble Scoreと進捗管理", "契約の履行（第6.1.b条）"],
          ["行動プロファイル（Bolton/Mehrabian）", "正当な利益 — サービス品質の向上（第6.1.f条）"],
          ["Counsel AIインタラクション", "契約の履行（第6.1.b条）"],
          ["請求とサブスクリプション管理", "法的義務 + 契約の履行（第6.1.b条および6.1.c条）"],
          ["IPによる地域検出", "正当な利益 — サービスのパーソナライズ（第6.1.f条）"],
          ["マーケティングコミュニケーション", "同意（第6.1.a条）— 登録した場合のみ"],
        ],
      },
    },
    {
      id: "s5",
      title: "5. データをどのように使用しますか？",
      body: "個人データは以下のためのみに使用します：",
      list: [
        "サービスの提供 — Atelier、Counsel、Cultural Compassへのアクセス；",
        "パーソナライゼーション — プロフィールと地域に合わせたシナリオ、ガイダンス、洞察の調整；",
        "進捗管理 — Noble Score、ドメイン習熟度、学習履歴の追跡；",
        "サブスクリプションと支払い管理 — 決済プロバイダーを通じたサブスクリプション層の処理；",
        "技術的運用 — 認証、セッション管理、セキュリティ；",
        "サービス改善 — 使用パターンの匿名化または集計分析。",
      ],
      note: "お客様のデータは以下のために決して使用しません：ターゲット広告；データの売買；エチケットトレーニングのコンテキスト外でのプロファイリング；法的影響を持つ自動意思決定（GDPR第22条）。",
    },
    {
      id: "s6",
      title: "6. 自動処理とプロファイリング",
      body: `CortéaはGDPR第4条(4)の意味におけるプロファイリングの定義に該当する、回答パターンの自動分析を使用して行動プロファイルを構築します。\n\n確認事項：`,
      list: [
        "このプロファイリングにはお客様への法的影響はない；",
        "個人的な学習体験の向上のためにのみ機能する；",
        "このプロファイリングに異議を申し立てる権利がある（第9節参照）；",
        "導出されたプロファイルの洞察はお客様自身のみが閲覧可能。",
      ],
    },
    {
      id: "s7",
      title: "7. 第三者への移転及び国際的な移転",
      subsections: [
        {
          id: "s7-1",
          title: "7.1 処理者",
          body: "以下のカテゴリの処理者を使用しています：",
          list: [
            "ホスティングプロバイダー — Replit Inc.（米国）。データはEEA外のサーバーで処理される可能性があります。ReplotはGDPR第46条に基づく標準契約条項（SCC）の対象です。",
            "AIサービスプロバイダー — Anthropic PBC（米国）、Counselインタラクションの処理用。SCCに基づく移転。",
            "決済処理業者 — Stripe Inc.（米国）および/またはMollie B.V.（NL）、サブスクリプション支払い用。PCI-DSSおよびGDPR準拠の処理。",
            "メールプロバイダー — マジックリンク認証メールの送信用。",
          ],
        },
        { id: "s7-2", title: "7.2 データの売買なし", body: "個人データを第三者に販売、貸与、または取引することはありません。" },
        { id: "s7-3", title: "7.3 法的義務", body: "例外的な場合に、法的命令または裁判所の判決によって個人データを提供することが求められる場合があります。" },
      ],
    },
    {
      id: "s8",
      title: "8. 保持期間",
      table: {
        headers: ["データの種類", "保持期間"],
        rows: [
          ["アカウントデータ（アクティブなアカウント）", "アカウントがアクティブな間"],
          ["削除後のアカウントデータ", "最大30日（バックアップ保持）"],
          ["Noble Scoreログと進捗", "アカウントがアクティブな間"],
          ["行動プロファイル", "アカウントがアクティブな間；アカウント削除時に削除"],
          ["Counsel会話コンテンツ", "構造的に保存されない（セッションごとにステートレス）"],
          ["確認トークン", `${PLACEHOLDER_JA}後に自動的に期限切れ`],
          ["セッショントークン", `非アクティブ後${PLACEHOLDER_JA}で期限切れ`],
          ["請求データ", "7年（法的な会計義務）"],
          ["地域検出用IPアドレス", "ユーザーが地域を確認しない限り永続的に保存されない"],
        ],
      },
    },
    {
      id: "s9",
      title: "9. データ主体としての権利",
      body: "GDPRに基づき、以下の権利があります：",
      subsections: [
        { id: "s9-1", title: "9.1 アクセス権（第15条）", body: "当社が処理するお客様の個人データを照会し、コピーを受け取ることができます。" },
        { id: "s9-2", title: "9.2 訂正権（第16条）", body: "プロフィールページまたは当社を通じて、不正確または不完全なデータを修正できます。" },
        { id: "s9-3", title: "9.3 削除権（第17条）", body: `アカウントと関連するすべてのデータを削除できます。これには、Noble Scoreログ、行動プロファイル、Atelierの進捗状況、個人データが含まれます。請求データは法的に必要な期間保持されます。\n\nアプリ内：プロフィール → アカウント＆危険ゾーン → アカウントを削除` },
        { id: "s9-4", title: "9.4 処理の制限権（第18条）", body: "特定の状況において、データの処理を一時的に制限するよう求めることができます。" },
        { id: "s9-5", title: "9.5 データポータビリティ権（第20条）", body: "データの構造化された機械可読エクスポートを要求できます。" },
        { id: "s9-6", title: "9.6 異議申し立て権（第21条）", body: "行動プロファイリングを含む正当な利益に基づく処理に異議を申し立てることができます。異議申し立て後、差し迫った正当な理由がない限り、当該処理を停止します。" },
        { id: "s9-7", title: "9.7 同意撤回権（第7.3条）", body: "処理が同意に基づいている場合（例：マーケティングメール）、理由を述べることなくいつでも同意を撤回できます。" },
      ],
      howToRequest: "[privacy@cortea.app]に、お名前、メールアドレス、リクエストの種類を記載してメールを送信してください。30暦日以内に回答します。",
    },
    {
      id: "s10",
      title: "10. セキュリティ",
      body: "データを保護するために適切な技術的・組織的措置を講じています：",
      list: [
        "パスワードレス認証 — マジックリンクシステムにより漏洩パスワードのリスクを排除；",
        "サーバーサイドセッショントークン — トークンはブラウザにプレーンテキストで保存されない；",
        "HTTPS/TLS — すべての通信が暗号化；",
        "アクセス制限 — 権限のある担当者のみが本番データにアクセス可能；",
        "カスケード削除 — アカウント削除時に関連するすべてのデータが原子的に削除。",
      ],
      note: "お客様の権利と自由にリスクをもたらすデータ侵害が発生した場合、72時間以内にデータ保護局に通知し（GDPR第33条）、必要に応じて個人的にお知らせします（GDPR第34条）。",
    },
    {
      id: "s11",
      title: "11. CookieとローカルストレージCortéaは以下を使用します：",
      body: "Cortéaは以下を使用します：",
      list: [
        "セッションCookie — 認証とセッション機能に必要不可欠；",
        "機能的ストレージ — 言語設定とUI設定用。",
      ],
      note: "トラッキングCookie、広告Cookie、またはクロスサイト分析は使用していません。",
    },
    {
      id: "s12",
      title: "12. 未成年者",
      body: "Cortéaは16歳未満の方を対象としていません。未成年者の個人データを意図的に収集することはありません。未成年者がアカウントを作成したと思われる場合は、ご連絡ください。",
    },
    {
      id: "s13",
      title: "13. 苦情",
      body: "個人データの処理が適切でないと思われる場合は、以下に苦情を申し立てることができます：",
      note: `データ保護局（GBA）\nDrukpersstraat 35, 1000 Brussels\ncontact@apd-gba.be | www.gegevensbeschermingsautoriteit.be\n\nただし、まず当社にご連絡いただき、問題を直接解決できるようご協力をお願いします。`,
    },
    {
      id: "s14",
      title: "14. プライバシーポリシーの変更",
      body: "このプライバシーポリシーを定期的に更新することがあります。重要な変更については、メールまたはアプリ内の通知でお知らせします。最終更新日はこの文書の冒頭に記載されています。",
    },
    {
      id: "s15",
      title: "15. 連絡先情報",
      body: "このプライバシーポリシーまたは個人データに関するすべてのご質問：",
      note: `★ [会社名]\nメール：[privacy@cortea.app]\nウェブサイト：[cortea.app/privacy]`,
    },
  ],
};

export const policyContentAR: PolicyContent = {
  meta: {
    title: "سياسة الخصوصية — Cortéa",
    version: "الإصدار: 1.0",
    effectiveDateLabel: "تاريخ السريان:",
    effectiveDateValue: PLACEHOLDER_AR,
    responsibleLabel: "المسؤول عن المعالجة:",
    responsibleValue: `[اسم الشركة / الاسم]، [العنوان]، [البريد الإلكتروني]`,
    supervisorLabel: "السلطة الإشرافية:",
    supervisorValue: "هيئة حماية البيانات (GBA) — www.gegevensbeschermingsautoriteit.be",
    placeholderNote: "الحقول المحددة بعلامة ★ هي عناصر نائبة قانونية يجب تعبئتها قبل النشر.",
  },
  sections: [
    {
      id: "s1",
      title: "1. المقدمة وهوية المسؤول عن المعالجة",
      body: `Cortéa ("نحن"، "لنا"، "التطبيق") هو منصة للذكاء الثقافي والتدريب على آداب السلوك. يساعد المستخدمين على فهم وتطبيق الأعراف الاجتماعية وسلوكيات التواصل والعادات الثقافية في سياق دولي.\n\nالمسؤول عن المعالجة بمفهوم اللائحة العامة لحماية البيانات (GDPR) هو:`,
      note: `★ [اسم الشركة]\n[العنوان]\n[الرمز البريدي، المدينة، الدولة]\nالبريد الإلكتروني: [privacy@cortea.app]\nرقم ضريبة القيمة المضافة: ${PLACEHOLDER_AR}`,
      body2: "لجميع الأسئلة أو الطلبات أو الشكاوى المتعلقة ببياناتك الشخصية، يمكنك التواصل معنا عبر عنوان البريد الإلكتروني المذكور أعلاه.",
    } as PolicySection & { body2: string },
    {
      id: "s2",
      title: "2. نطاق التطبيق",
      body: "تنطبق سياسة الخصوصية هذه على:",
      list: [
        "استخدام تطبيق الويب Cortéa وأي إصدارات مستقبلية للجوال؛",
        "جميع الخدمات المقدمة عبر cortea.app؛",
        "معالجة البيانات الشخصية للزوار والمستخدمين المسجلين والمشتركين.",
      ],
      note: "لا تنطبق هذه السياسة على مواقع الويب أو الخدمات الخارجية التي قد تُحيل إليها Cortéa.",
    },
    {
      id: "s3",
      title: "3. ما هي البيانات الشخصية التي نعالجها؟",
      subsections: [
        {
          id: "s3-1",
          title: "3.1 بيانات الحساب",
          body: "عند التسجيل، نجمع:",
          list: [
            "عنوان البريد الإلكتروني (إلزامي، يُستخدم كمعرّف فريد)",
            "الاسم الكامل (اختياري، فقط إذا أدخله المستخدم)",
            "سنة الميلاد (اختيارية، للتخصيص السياقي)",
            "الهوية الجندرية (اختيارية، تُقدَّم طوعاً)",
            "رمز التحقق وتاريخ انتهاء الصلاحية (مؤقت، للتحقق من البريد الإلكتروني عبر الرابط السحري)",
            "رمز الجلسة (مُخزَّن على الخادم، للمصادقة)",
          ],
        },
        {
          id: "s3-2",
          title: "3.2 بيانات الاستخدام والتقدم",
          body: "أثناء استخدام Cortéa، نعالج:",
          list: [
            "Noble Score وسجلات النقاط (نقاط لكل سيناريو، أحداث الارتقاء بالمستوى)",
            "إجابات السيناريو (الخيارات التي أجريتها في كل موقف تدريبي)",
            "المنطقة النشطة (المنطقة الثقافية التي حددتها كسياق)",
            "تفضيل اللغة (لغة واجهة المستخدم من بين 9 لغات متاحة)",
            "الطوابع الزمنية للنشاط",
          ],
        },
        {
          id: "s3-3",
          title: "3.3 الملف الشخصي السلوكي (Behavioral Intelligence Layer)",
          body: `تحتوي Cortéa على طبقة ذكاء سلوكي غير مرئية تبني رؤى إضافية بناءً على إجاباتك. تعمل هذه الطبقة بالكامل في الخلفية وتعرض النتائج حصراً بلغة آداب السلوك — وليس بمصطلحات نفسية أو سريرية.\n\nتحديداً، نعالج:`,
          list: [
            "مجموعات Bolton (الاهتمام بالآخرين، أسلوب الحزم، نهج التعامل مع النزاعات) — مستنبطة من التعرف على الأنماط في إجاباتك على السيناريوهات؛",
            "درجة الوعي غير اللفظي (استناداً إلى نموذج Mehrabian لـ18 منطقة ثقافية)؛",
            "أبعاد الذكاء العاطفي (Attentiveness, Composure, Discernment, Diplomacy, Presence) — تُعرض كـ'بوصلة التهذيب' في ملفك الشخصي؛",
            "أسلوب التصحيح: عندما تجيب بشكل خاطئ على سيناريو، يخزّن النظام أسلوب الإرشاد المرتبط لتخصيص التوجيه.",
          ],
          note: "مهم: تُستخدم هذه البيانات حصراً للتوجيه الشخصي داخل التطبيق. لا تُشارَك مطلقاً مع أطراف ثالثة، ولا تُستخدم للإعلانات، ولا تُحلَّل خارج سياق تقدمك الشخصي.",
        },
        {
          id: "s3-4",
          title: "3.4 بيانات الاتصال",
          list: [
            "المحادثات مع The Counsel (مستشار آداب السلوك بالذكاء الاصطناعي) — تُعالَج مؤقتاً لتوليد الإجابات؛ لا يُخزَّن المحتوى بشكل منظم ما لم يُذكر خلاف ذلك؛",
            "رسائل البريد الإلكتروني للمصادقة عبر الرابط السحري.",
          ],
        },
        {
          id: "s3-5",
          title: "3.5 البيانات التقنية",
          list: [
            "عنوان IP (مؤقت، لاكتشاف المنطقة — لا يُخزَّن بشكل دائم ما لم يؤكد المستخدم المنطقة)؛",
            "نوع المتصفح وإصداره (عبر رؤوس HTTP القياسية)؛",
            "المنطقة الزمنية.",
          ],
        },
      ],
    },
    {
      id: "s4",
      title: "4. الأسس القانونية للمعالجة",
      body: "نعالج بياناتك الشخصية استناداً إلى الأسس القانونية التالية (المادة 6 من GDPR):",
      table: {
        headers: ["المعالجة", "الأساس القانوني"],
        rows: [
          ["إدارة الحساب والمصادقة", "تنفيذ العقد (المادة 6.1.ب)"],
          ["Noble Score وإدارة التقدم", "تنفيذ العقد (المادة 6.1.ب)"],
          ["الملف الشخصي السلوكي (Bolton/Mehrabian)", "المصلحة المشروعة — تحسين جودة الخدمة (المادة 6.1.و)"],
          ["تفاعلات Counsel بالذكاء الاصطناعي", "تنفيذ العقد (المادة 6.1.ب)"],
          ["الفوترة وإدارة الاشتراكات", "التزام قانوني + تنفيذ العقد (المادة 6.1.ب و6.1.ج)"],
          ["اكتشاف المنطقة عبر IP", "المصلحة المشروعة — تخصيص الخدمة (المادة 6.1.و)"],
          ["الاتصالات التسويقية", "الموافقة (المادة 6.1.أ) — فقط في حال الاشتراك"],
        ],
      },
    },
    {
      id: "s5",
      title: "5. كيف نستخدم بياناتك؟",
      body: "نستخدم بياناتك الشخصية حصراً من أجل:",
      list: [
        "تقديم الخدمة — الوصول إلى Atelier وCounsel وCultural Compass؛",
        "التخصيص — تكييف السيناريوهات والتوجيه والرؤى مع ملفك الشخصي ومنطقتك؛",
        "إدارة التقدم — تتبع Noble Score الخاص بك وإتقان المجالات وسجل التعلم؛",
        "إدارة الاشتراكات والمدفوعات — معالجة مستوى اشتراكك عبر مزود الدفع لدينا؛",
        "التشغيل التقني — المصادقة وإدارة الجلسات والأمان؛",
        "تحسين الخدمة — تحليلات مجهولة الهوية أو مجمّعة لأنماط الاستخدام.",
      ],
      note: "نحن لا نستخدم بياناتك مطلقاً من أجل: الإعلانات المستهدفة لك أو لأطراف ثالثة؛ بيع بياناتك أو تأجيرها؛ التنميط خارج سياق تدريبك على آداب السلوك؛ صنع القرار الآلي ذو الأثر القانوني (المادة 22 من GDPR).",
    },
    {
      id: "s6",
      title: "6. المعالجة الآلية والتنميط",
      body: `تستخدم Cortéa التحليل الآلي لأنماط إجاباتك لبناء ملفك الشخصي السلوكي. يندرج هذا ضمن تعريف التنميط بمفهوم المادة 4(4) من GDPR.\n\nنؤكد أن:`,
      list: [
        "هذا التنميط ليس له أثر قانوني عليك؛",
        "يخدم حصراً تحسين تجربة التعلم الشخصية لديك؛",
        "لديك الحق في الاعتراض على هذا التنميط (انظر القسم 9)؛",
        "جميع الرؤى المستنبطة من الملف الشخصي مرئية لك وحدك.",
      ],
    },
    {
      id: "s7",
      title: "7. النقل إلى أطراف ثالثة والنقل الدولي",
      subsections: [
        {
          id: "s7-1",
          title: "7.1 المعالجون",
          body: "نستعين بالفئات التالية من المعالجين:",
          list: [
            "مزود الاستضافة — Replit Inc. (الولايات المتحدة). تُعالَج البيانات على خوادم قد تقع خارج المنطقة الاقتصادية الأوروبية. تخضع Replit لبنود العقود القياسية (SCC) وفق المادة 46 من GDPR.",
            "مزود خدمة الذكاء الاصطناعي — Anthropic PBC (الولايات المتحدة)، لمعالجة تفاعلات Counsel. النقل على أساس SCC.",
            "معالج الدفع — Stripe Inc. (الولايات المتحدة) و/أو Mollie B.V. (NL) لمدفوعات الاشتراك. المعالجة وفقاً لمعيار PCI-DSS ولوائح GDPR.",
            "مزود البريد الإلكتروني — لإرسال رسائل بريد إلكتروني للمصادقة عبر الرابط السحري.",
          ],
        },
        { id: "s7-2", title: "7.2 لا بيع للبيانات", body: "نحن لا نبيع بياناتك الشخصية أو نؤجرها أو نتاجر بها مع أطراف ثالثة." },
        { id: "s7-3", title: "7.3 الالتزامات القانونية", body: "في حالات استثنائية، قد نضطر إلى تقديم بيانات شخصية بموجب أمر قانوني أو حكم قضائي." },
      ],
    },
    {
      id: "s8",
      title: "8. فترات الاحتفاظ",
      table: {
        headers: ["نوع البيانات", "فترة الاحتفاظ"],
        rows: [
          ["بيانات الحساب (حساب نشط)", "طالما الحساب نشطاً"],
          ["بيانات الحساب بعد الحذف", "30 يوماً كحد أقصى (احتفاظ بالنسخ الاحتياطية)"],
          ["سجل Noble Score والتقدم", "طالما الحساب نشطاً"],
          ["الملف الشخصي السلوكي", "طالما الحساب نشطاً؛ يُحذف عند حذف الحساب"],
          ["محتوى محادثات Counsel", "غير مُخزَّن بشكل منظم (عديم الحالة لكل جلسة)"],
          ["رموز التحقق", `تنتهي صلاحيتها تلقائياً بعد ${PLACEHOLDER_AR}`],
          ["رموز الجلسة", `تنتهي صلاحيتها بعد ${PLACEHOLDER_AR} من الخمول`],
          ["بيانات الفوترة", "7 سنوات (التزام محاسبي قانوني)"],
          ["عنوان IP لاكتشاف المنطقة", "غير مُخزَّن بشكل دائم ما لم يؤكد المستخدم المنطقة"],
        ],
      },
    },
    {
      id: "s9",
      title: "9. حقوقك بوصفك صاحب بيانات",
      body: "بموجب GDPR، لديك الحقوق التالية:",
      subsections: [
        { id: "s9-1", title: "9.1 حق الوصول (المادة 15)", body: "يمكنك الاستفسار عن البيانات الشخصية التي نعالجها بشأنك وتلقي نسخة منها." },
        { id: "s9-2", title: "9.2 حق التصحيح (المادة 16)", body: "يمكنك تصحيح البيانات غير الدقيقة أو غير المكتملة عبر صفحة ملفك الشخصي أو من خلالنا." },
        { id: "s9-3", title: "9.3 حق المحو (المادة 17)", body: `يمكنك حذف حسابك وجميع البيانات المرتبطة به. يشمل ذلك: سجل Noble Score، الملف الشخصي السلوكي، تقدم Atelier، والبيانات الشخصية. تُحتفظ ببيانات الفوترة طالما تقتضي ذلك المتطلبات القانونية.\n\nفي التطبيق: الملف الشخصي ← الحساب ومنطقة الخطر ← حذف الحساب` },
        { id: "s9-4", title: "9.4 حق التقييد (المادة 18)", body: "في ظروف معينة، يمكنك طلب تقييد معالجة بياناتك مؤقتاً." },
        { id: "s9-5", title: "9.5 حق قابلية نقل البيانات (المادة 20)", body: "يمكنك طلب تصدير منظم وقابل للقراءة آلياً لبياناتك." },
        { id: "s9-6", title: "9.6 حق الاعتراض (المادة 21)", body: "يمكنك الاعتراض على المعالجة القائمة على المصلحة المشروعة، بما في ذلك التنميط السلوكي. بعد الاعتراض، سنوقف المعالجة المعنية ما لم تكن هناك أسباب مشروعة ملحّة." },
        { id: "s9-7", title: "9.7 حق سحب الموافقة (المادة 7.3)", body: "إذا كانت المعالجة تستند إلى الموافقة (مثل رسائل البريد الإلكتروني التسويقية)، يمكنك سحب هذه الموافقة في أي وقت دون إبداء أسباب." },
      ],
      howToRequest: "أرسل بريداً إلكترونياً إلى [privacy@cortea.app] مع ذكر اسمك وعنوان بريدك الإلكتروني ونوع الطلب. نرد في غضون 30 يوماً تقويمياً.",
    },
    {
      id: "s10",
      title: "10. الأمان",
      body: "نتخذ التدابير التقنية والتنظيمية المناسبة لحماية بياناتك:",
      list: [
        "المصادقة بدون كلمة مرور — يلغي نظام الرابط السحري مخاطر تسرب كلمات المرور؛",
        "رموز الجلسة على الخادم — لا تُخزَّن الرموز كنص عادي في المتصفح؛",
        "HTTPS/TLS — جميع الاتصالات مشفرة؛",
        "تقييد الوصول — يقتصر الوصول إلى بيانات الإنتاج على الموظفين المخوّلين؛",
        "الحذف المتتالي — عند حذف الحساب، تُحذف جميع البيانات المرتبطة بشكل ذري.",
      ],
      note: "في حالة اختراق بيانات يشكّل خطراً على حقوقك وحرياتك، سنُخطر هيئة حماية البيانات في غضون 72 ساعة (المادة 33 من GDPR) وسنُعلمك شخصياً إذا لزم الأمر (المادة 34 من GDPR).",
    },
    {
      id: "s11",
      title: "11. ملفات تعريف الارتباط والتخزين المحلي",
      body: "تستخدم Cortéa:",
      list: [
        "ملفات تعريف ارتباط الجلسة — ضرورية للغاية للمصادقة وعمل الجلسة؛",
        "التخزين الوظيفي — لتفضيلات اللغة وإعدادات واجهة المستخدم.",
      ],
      note: "نحن لا نستخدم ملفات تعريف الارتباط للتتبع أو الإعلانات أو التحليلات عبر المواقع.",
    },
    {
      id: "s12",
      title: "12. القاصرون",
      body: "لا تستهدف Cortéa الأشخاص الذين تقل أعمارهم عن 16 عاماً. نحن لا نجمع بيانات شخصية عن القاصرين عن قصد. إذا اشتبهت في أن قاصراً قد أنشأ حساباً، نطلب منك التواصل معنا.",
    },
    {
      id: "s13",
      title: "13. الشكاوى",
      body: "إذا كنت تعتقد أننا لا نعالج بياناتك الشخصية بشكل صحيح، يمكنك تقديم شكوى إلى:",
      note: `هيئة حماية البيانات (GBA)\nDrukpersstraat 35, 1000 Brussels\ncontact@apd-gba.be | www.gegevensbeschermingsautoriteit.be\n\nنقدر، مع ذلك، أن تتواصل معنا أولاً حتى نتمكن من حل أي مشكلات مباشرة.`,
    },
    {
      id: "s14",
      title: "14. التغييرات في سياسة الخصوصية هذه",
      body: "قد نقوم بتحديث سياسة الخصوصية هذه بشكل دوري. بالنسبة للتغييرات الجوهرية، سنُعلمك عبر البريد الإلكتروني أو من خلال إشعار داخل التطبيق. تاريخ آخر تحديث يظهر في أعلى هذه الوثيقة.",
    },
    {
      id: "s15",
      title: "15. بيانات الاتصال",
      body: "لجميع الأسئلة المتعلقة بسياسة الخصوصية هذه أو بياناتك الشخصية:",
      note: `★ [اسم الشركة]\nالبريد الإلكتروني: [privacy@cortea.app]\nالموقع الإلكتروني: [cortea.app/privacy]`,
    },
  ],
};

export const POLICY_CONTENT_BY_LANG: Record<string, PolicyContent> = {
  en: policyContentEN,
  nl: policyContentNL,
  de: policyContentDE,
  fr: policyContentFR,
  es: policyContentES,
  it: policyContentIT,
  pt: policyContentPT,
  ja: policyContentJA,
  ar: policyContentAR,
};

export function getPolicyContent(language: string): PolicyContent {
  return POLICY_CONTENT_BY_LANG[language] ?? policyContentEN;
}
