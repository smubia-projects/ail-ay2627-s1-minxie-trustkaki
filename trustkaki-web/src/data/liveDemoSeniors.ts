import type { KnownContextItem } from "@/lib/agents/contracts";
import type { RiskLevel } from "@/lib/types";

/**
 * The fictional seniors for the live agent demo. The browser picks one by id and the API
 * builds the agents' context from this file, so a visitor can't inject a profile. The
 * profiles, routines and confirmed preferences come from the original fictional seed data
 * (supabase/seed.sql in the student's repository). Addresses are town names only.
 */
export interface LiveDemoSenior {
  id: string;
  name: string;
  age: number;
  town: string;
  livingSituation: string;
  caregiver: string;
  aacVolunteer: string;
  riskLevel: RiskLevel;
  portrait: string;
  /** Routines and preferences the care team has confirmed (stands in for the personal-memory search). */
  memory: Array<{ key: string; content: string; safeUseNotes: string }>;
  knownContext: KnownContextItem[];
  examples: string[];
}

export const LIVE_DEMO_SENIORS: LiveDemoSenior[] = [
  {
    id: "tan-ah-hock",
    name: "Mr Tan Ah Hock",
    age: 76,
    town: "Toa Payoh",
    livingSituation: "Lives alone in a HDB flat in Toa Payoh",
    caregiver: "Rachel Tan (daughter)",
    aacVolunteer: "Mei Ling",
    riskLevel: "green",
    portrait: "/seniors/mr-tan-ah-hock-photo.webp",
    memory: [
      { key: "communication_preference", content: "Prefers low-pressure one-to-one check-ins with Mei Ling.", safeUseNotes: "Use to shape outreach tone; do not pressure him to participate." },
      { key: "food_preference", content: "Often accepts simple meal support when it is framed as practical help.", safeUseNotes: "Use only as a gentle suggestion." },
    ],
    knownContext: [
      { type: "usual_routine", content: "Usually replies to morning check-ins before 9am.", safeUseNotes: "Use as a routine comparison, not a strict rule.", applicationTags: [] },
      { type: "usual_routine", content: "Usually has breakfast after taking morning medication.", safeUseNotes: "Late or missed meals should trigger a gentle check, not alarm by itself.", applicationTags: [] },
      { type: "usual_routine", content: "Usually goes downstairs or walks short distances when his knee is comfortable.", safeUseNotes: "Compare movement changes with recent knee comfort.", applicationTags: [] },
    ],
    examples: [
      "Not hungry this morning. My knee is painful again, so I stayed home.",
      "Got SMS say my SingPost parcel is held, must click link to pay $2. Can I click?",
      "Mei Ling asked me to join the community breakfast. Don't want lah, paiseh.",
    ],
  },
  {
    id: "lim-siew-lan",
    name: "Mdm Lim Siew Lan",
    age: 81,
    town: "Bishan",
    livingSituation: "Lives with her son in Bishan",
    caregiver: "Daniel Lim (son)",
    aacVolunteer: "Mei Ling",
    riskLevel: "green",
    portrait: "/seniors/mdm-lim-siew-lan-photo.webp",
    memory: [
      { key: "communication_preference", content: "Prefers voice calls in Mandarin when the message is important.", safeUseNotes: "Use to reduce confusion; avoid sending long text instructions." },
    ],
    knownContext: [
      { type: "usual_routine", content: "Usually replies to Daniel after dinner around 7pm.", safeUseNotes: "Use as a routine comparison, not a strict rule.", applicationTags: [] },
    ],
    examples: [
      "I feel a bit giddy since this morning, sat down for a while already.",
      "Is there any exercise class near Bishan for old people this week?",
    ],
  },
  {
    id: "siti-fatimah",
    name: "Mdm Siti Fatimah Binte Rahman",
    age: 79,
    town: "Bedok",
    livingSituation: "Lives alone; eldest daughter checks in after work",
    caregiver: "Nur Aishah (daughter)",
    aacVolunteer: "Mei Ling",
    riskLevel: "yellow",
    portrait: "/seniors/mdm-siti-fatimah-photo.webp",
    memory: [
      { key: "family_context", content: "Nur Aishah is the first family contact for money or bank concerns.", safeUseNotes: "Use for routing human follow-up; do not expose family details to unrelated users." },
    ],
    knownContext: [
      { type: "usual_routine", content: "Usually answers family within the same evening.", safeUseNotes: "Use as a routine comparison, not a strict rule.", applicationTags: [] },
    ],
    examples: [
      "Someone called saying they are from the bank and need my OTP to stop my account being frozen.",
      "Today I went to the market with my neighbour, very nice weather.",
    ],
  },
];

export function liveDemoSenior(id: string): LiveDemoSenior | undefined {
  return LIVE_DEMO_SENIORS.find((senior) => senior.id === id);
}
