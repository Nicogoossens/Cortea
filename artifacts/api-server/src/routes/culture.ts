import { Router } from "express";
import { db } from "@workspace/db";
import { cultureProtocolsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const COMPASS_DATA: Record<string, {
  region_name: string;
  flag_emoji: string;
  core_value: string;
  biggest_taboo: string;
  dining_etiquette: string;
  language_notes: string;
  gift_protocol: string;
  dress_code: string;
  dos: string[];
  donts: string[];
}> = {
  GB: {
    region_name: "United Kingdom",
    flag_emoji: "🇬🇧",
    core_value: "Understatement & Tradition",
    biggest_taboo: "Being too direct about money or personal matters",
    dining_etiquette: "Continental style: fork in left hand, knife in right. Soup spoon moves away from you. Do not begin eating until the host does.",
    language_notes: "Titles are strictly observed. 'Mr', 'Mrs', 'Dr' followed by surname. Avoid first names until explicitly invited.",
    gift_protocol: "Modest, thoughtful gifts are appropriate. Avoid overly expensive presents which may cause discomfort. Wine or flowers for a dinner invitation.",
    dress_code: "Err on the side of formality. Business formal for meetings. Smart casual for social occasions. Black Tie requires a dinner jacket.",
    dos: [
      "Queue with patience and dignity",
      "Offer and accept tea graciously",
      "Use understatement when expressing opinions",
      "Observe punctuality — five minutes early is on time",
      "Thank the host the following day"
    ],
    donts: [
      "Ask directly about salary or personal wealth",
      "Skip a queue under any circumstance",
      "Speak loudly in public spaces",
      "Inquire about family matters until invited to do so",
      "Refuse a cup of tea without good reason"
    ]
  },
  CN: {
    region_name: "China",
    flag_emoji: "🇨🇳",
    core_value: "Mianzi (Face) & Guanxi (Relationships)",
    biggest_taboo: "Causing someone to lose face publicly",
    dining_etiquette: "Wait to be seated according to seniority. The host orders and pays. Never place chopsticks vertically in rice. Pouring tea for others before yourself shows respect.",
    language_notes: "Address by family name followed by title. Seniority dictates speaking order in meetings. Business cards are exchanged with both hands and a slight bow.",
    gift_protocol: "Present and receive gifts with both hands. Gifts are not opened immediately. Avoid clocks (association with death) and green hats. Red envelopes for money are appropriate.",
    dress_code: "Conservative and formal for business. Avoid white or black for celebratory occasions. Modest dress for temple visits.",
    dos: [
      "Present business cards with both hands",
      "Allow the host to order at meals",
      "Accept all food and drink offered",
      "Show deference to seniority in all interactions",
      "Build relationships before discussing business"
    ],
    donts: [
      "Cause anyone to lose face publicly",
      "Refuse food or drink without explanation",
      "Give clocks or shoes as gifts",
      "Point with your index finger",
      "Discuss Taiwan, Tibet, or Tiananmen"
    ]
  },
  CA: {
    region_name: "Canada",
    flag_emoji: "🇨🇦",
    core_value: "Equality, Inclusivity & Courtesy",
    biggest_taboo: "Assuming someone's cultural background or language",
    dining_etiquette: "Informally professional. The bill is often split. Tipping 15-20% is expected. Dietary preferences are respected and commonly accommodated.",
    language_notes: "Bilingual (English and French) in many contexts. In Quebec, French is the primary language. Inclusive language is valued. First names are used relatively quickly.",
    gift_protocol: "Thoughtful but not excessive. Wine, local specialties, or a book are appropriate. Host gifts are appreciated. Not expected at business meetings.",
    dress_code: "Smart casual for most business contexts. Formal when specified. Outdoor casual is acceptable in many social situations.",
    dos: [
      "Acknowledge the land's Indigenous heritage when appropriate",
      "Hold doors for those behind you",
      "Apologise readily — it is a cultural courtesy",
      "Respect personal space (roughly an arm's length)",
      "Acknowledge both French and English cultural contexts"
    ],
    donts: [
      "Assume everyone speaks English or French exclusively",
      "Compare Canada to the United States unfavourably",
      "Ignore personal boundaries",
      "Arrive late without notice",
      "Make assumptions about cultural or national identity"
    ]
  }
};

const ProtocolsQuerySchema = z.object({
  region_code: z.string().min(1),
  pillar: z.coerce.number().int().min(1).max(5).optional(),
  context: z.string().optional(),
});

const RegionCodeParamSchema = z.object({
  regionCode: z.string().min(1).max(10),
});

router.get("/culture/protocols", async (req, res) => {
  try {
    const parsed = ProtocolsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "A region must be specified to retrieve cultural protocols." });
    }

    const { region_code, pillar, context } = parsed.data;
    const conditions = [eq(cultureProtocolsTable.region_code, region_code)];

    if (pillar !== undefined) {
      conditions.push(eq(cultureProtocolsTable.pillar, pillar));
    }

    if (context !== undefined) {
      conditions.push(eq(cultureProtocolsTable.context, context));
    }

    const protocols = await db.select()
      .from(cultureProtocolsTable)
      .where(and(...conditions));

    return res.json(protocols);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch culture protocols");
    return res.status(500).json({ message: "Cultural protocols are momentarily unavailable. Please allow a moment." });
  }
});

router.get("/culture/compass", async (req, res) => {
  try {
    const entries = Object.entries(COMPASS_DATA).map(([region_code, data]) => ({
      region_code,
      region_name: data.region_name,
      flag_emoji: data.flag_emoji,
      core_value: data.core_value,
      biggest_taboo: data.biggest_taboo,
    }));
    return res.json(entries);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch compass");
    return res.status(500).json({ message: "The Cultural Compass is momentarily unavailable." });
  }
});

router.get("/culture/compass/:regionCode", (req, res) => {
  try {
    const paramParsed = RegionCodeParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      return res.status(400).json({ message: "The region code provided is not valid." });
    }

    const regionCode = paramParsed.data.regionCode.toUpperCase();
    const data = COMPASS_DATA[regionCode];

    if (!data) {
      return res.status(404).json({ message: `The region '${regionCode}' is not yet within our compass. Further regions are being added in due course.` });
    }

    return res.json({
      region_code: regionCode,
      ...data,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch compass region");
    return res.status(500).json({ message: "The Cultural Compass is momentarily unavailable." });
  }
});

export default router;
