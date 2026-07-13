import { z } from 'zod';

export const HistoricalMetadataSchema = z.object({
  classification: z.enum(['historical', 'historically_plausible', 'counterfactual', 'fictional_composite']),
  sourceIds: z.array(z.string()),
  historicalDate: z.string().optional(),
  divergenceRequirements: z.array(z.string()).optional(),
  designerNotes: z.string().optional(),
});

export const CharacterPositionPeriodSchema = z.object({
  startDate: z.string(),
  endDate: z.string().optional(),
  offices: z.array(z.string()),
  issuePositions: z.record(z.union([z.number(), z.string()])),
  alliances: z.array(z.string()),
  conflicts: z.array(z.string()),
  confidence: z.enum(['high', 'medium', 'low']),
  sourceIds: z.array(z.string()),
});

export const RegionDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  majorCities: z.array(z.string()),
  description: z.string(),
  urbanPopulation: z.number(),
  ruralPopulation: z.number(),
  economicProfile: z.string(),
  ethnicComposition: z.string(),
  mapPath: z.string(),
  centerX: z.number(),
  centerY: z.number(),
  influenceNodes: z.array(z.object({
    id: z.string(),
    x: z.number(),
    y: z.number(),
    type: z.enum(['city', 'factory', 'mine', 'railway', 'military', 'port', 'union', 'party_office']),
    name: z.string(),
  })),
  initialState: z.object({
    administrativeCapacity: z.number(),
    influence: z.record(z.number()),
    peasantResistance: z.number(),
    nationalMovementStrength: z.number(),
    whiteActivity: z.number(),
    localSovietAutonomy: z.number(),
    tradeUnionOrganization: z.number(),
    factoryCommitteeOrganization: z.number(),
    chekaPresence: z.number(),
    redArmyLoyalty: z.number(),
    industrialProduction: z.number(),
    agriculturalProduction: z.number(),
    foodSupply: z.number(),
    famineSeverity: z.number(),
    infrastructure: z.number(),
    railwayAccess: z.number(),
    publicUnrest: z.number(),
    strikeActivity: z.number(),
    workerSupport: z.number(),
    partyMembership: z.number(),
    intelligenceReliability: z.number(),
  }),
  historical: HistoricalMetadataSchema,
});

export const CharacterDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  aliases: z.array(z.string()),
  title: z.string(),
  description: z.string(),
  portraitPath: z.string().optional(),
  isHistorical: z.boolean(),
  positionPeriods: z.array(CharacterPositionPeriodSchema),
  initialState: z.object({
    trust: z.number(),
    fear: z.number(),
    respect: z.number(),
    health: z.number(),
    factionAlignment: z.string(),
  }),
  relationships: z.record(z.number()),
  redLines: z.array(z.string()),
  secrets: z.array(z.string()),
  historical: HistoricalMetadataSchema,
});

export const InstitutionDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  leadership: z.string(),
  formalAuthority: z.number(),
  informalAuthority: z.number(),
  initialState: z.object({
    factionInfluence: z.number(),
    playerContacts: z.number(),
    securityPenetration: z.number(),
    bureaucratization: z.number(),
    corruption: z.number(),
  }),
  historical: HistoricalMetadataSchema,
});

export const LawDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['economic', 'labor', 'political', 'nationalities', 'agriculture', 'military']),
  description: z.string(),
  levels: z.array(z.object({
    value: z.number(),
    label: z.string(),
    description: z.string(),
    effects: z.record(z.number()),
  })),
  currentLevel: z.number(),
  historical: HistoricalMetadataSchema,
});

export const EventChoiceSchema = z.object({
  id: z.string(),
  text: z.string(),
  requirements: z.record(z.union([z.number(), z.string(), z.boolean()])).optional(),
  backgroundOnly: z.array(z.string()).optional(),
  effects: z.record(z.union([z.number(), z.string(), z.boolean()])).optional(),
  flags: z.record(z.union([z.boolean(), z.number(), z.string()])).optional(),
  nextEventId: z.string().optional(),
  narrative: z.string().optional(),
});

export const EventDefinitionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  month: z.string().optional(),
  phase: z.enum(['briefing', 'faction_management', 'regional_operations', 'party_politics', 'consequences']).optional(),
  priority: z.number().default(0),
  requirements: z.record(z.union([z.number(), z.string(), z.boolean()])).optional(),
  excludeIfFlags: z.array(z.string()).optional(),
  requireFlags: z.array(z.string()).optional(),
  choices: z.array(EventChoiceSchema),
  autoEffects: z.record(z.union([z.number(), z.string(), z.boolean()])).optional(),
  historical: HistoricalMetadataSchema,
});

export const OperationDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  regionTypes: z.array(z.string()).optional(),
  cost: z.record(z.number()),
  duration: z.number(),
  risks: z.object({
    exposureIncrease: z.number().optional(),
    securityDecrease: z.number().optional(),
    arrestChance: z.number().optional(),
  }).optional(),
  effects: z.record(z.number()),
  requirements: z.record(z.union([z.number(), z.string()])).optional(),
  historical: HistoricalMetadataSchema,
});

export const EndingDefinitionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  epilogue: z.string(),
  requirements: z.record(z.union([z.number(), z.string(), z.boolean()])),
  historical: HistoricalMetadataSchema,
});

export const PublicationDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  bias: z.string(),
  reliability: z.number(),
  accessLevel: z.string(),
  audience: z.string(),
  visualStyle: z.string(),
});

export type RegionDefinition = z.infer<typeof RegionDefinitionSchema>;
export type CharacterDefinition = z.infer<typeof CharacterDefinitionSchema>;
export type InstitutionDefinition = z.infer<typeof InstitutionDefinitionSchema>;
export type LawDefinition = z.infer<typeof LawDefinitionSchema>;
export type EventDefinition = z.infer<typeof EventDefinitionSchema>;
export type OperationDefinition = z.infer<typeof OperationDefinitionSchema>;
export type EndingDefinition = z.infer<typeof EndingDefinitionSchema>;
export type PublicationDefinition = z.infer<typeof PublicationDefinitionSchema>;

export function validateContent<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid ${label}: ${errors}`);
  }
  return result.data;
}

export function validateContentArray<T>(schema: z.ZodSchema<T>, data: unknown[], label: string): T[] {
  return data.map((item, i) => validateContent(schema, item, `${label}[${i}]`));
}
