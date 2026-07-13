import type { InstitutionDefinition, LawDefinition } from '@april-thesis/content-schema';

const hist = (sources: string[]) => ({
  classification: 'historical' as const,
  sourceIds: sources,
  historicalDate: '1921-03',
});

export const institutions: InstitutionDefinition[] = [
  { id: 'politburo', name: 'Politburo', description: 'Inner party leadership council. Decides major policy.', leadership: 'lenin', formalAuthority: 90, informalAuthority: 85, initialState: { factionInfluence: 5, playerContacts: 2, securityPenetration: 60, bureaucratization: 70, corruption: 20 }, historical: hist(['tenth-congress-1921']) },
  { id: 'central_committee', name: 'Central Committee', description: 'Elected party leadership body. Hundreds of delegates with regional power bases.', leadership: 'lenin', formalAuthority: 80, informalAuthority: 75, initialState: { factionInfluence: 10, playerContacts: 8, securityPenetration: 40, bureaucratization: 60, corruption: 25 }, historical: hist(['tenth-congress-1921']) },
  { id: 'secretariat', name: 'Party Secretariat', description: 'Administrative apparatus managing appointments, records, and cadre. Stalin is one secretary, not yet General Secretary.', leadership: 'krestinsky_molotov_stalin', formalAuthority: 70, informalAuthority: 65, initialState: { factionInfluence: 3, playerContacts: 1, securityPenetration: 50, bureaucratization: 80, corruption: 30 }, historical: hist(['tenth-congress-1921']) },
  { id: 'vtssps', name: 'All-Russian Central Council of Trade Unions', description: 'National trade-union federation. Key arena for worker politics.', leadership: 'tomsky', formalAuthority: 55, informalAuthority: 50, initialState: { factionInfluence: 25, playerContacts: 15, securityPenetration: 20, bureaucratization: 45, corruption: 15 }, historical: hist(['trade-union-debate-1921']) },
  { id: 'cheka', name: 'Cheka (VChK)', description: 'Extraordinary Commission for combating counter-revolution and sabotage.', leadership: 'dzerzhinsky', formalAuthority: 75, informalAuthority: 80, initialState: { factionInfluence: 0, playerContacts: 0, securityPenetration: 90, bureaucratization: 55, corruption: 35 }, historical: hist(['cheka-1921']) },
  { id: 'sovnarkom', name: 'Council of People\'s Commissars', description: 'Soviet government cabinet directing state administration.', leadership: 'lenin', formalAuthority: 85, informalAuthority: 70, initialState: { factionInfluence: 5, playerContacts: 3, securityPenetration: 35, bureaucratization: 65, corruption: 25 }, historical: hist(['tenth-congress-1921']) },
  { id: 'factory_committees', name: 'Factory Committees Network', description: 'Worker bodies at enterprise level. Weakened but not eliminated.', leadership: 'decentralized', formalAuthority: 30, informalAuthority: 35, initialState: { factionInfluence: 30, playerContacts: 20, securityPenetration: 15, bureaucratization: 20, corruption: 10 }, historical: hist(['factory-committees-1921']) },
  { id: 'local_soviets', name: 'Local Soviets', description: 'Regional and city councils. Nominally sovereign but increasingly subordinate.', leadership: 'decentralized', formalAuthority: 50, informalAuthority: 40, initialState: { factionInfluence: 15, playerContacts: 12, securityPenetration: 25, bureaucratization: 50, corruption: 30 }, historical: hist(['soviet-structure-1921']) },
];

function law(id: string, name: string, category: LawDefinition['category'], desc: string, levels: LawDefinition['levels'], current: number): LawDefinition {
  return { id, name, category, description: desc, levels, currentLevel: current, historical: hist(['tenth-congress-1921']) };
}

export const laws: LawDefinition[] = [
  law('nep_scope', 'NEP Scope', 'economic', 'Extent of market activity permitted', [
    { value: 0, label: 'War Communism', description: 'Full state control, requisitioning', effects: { peasantUnrest: 20, grainReserves: -10 } },
    { value: 1, label: 'Restricted NEP', description: 'Tax in kind, limited private trade', effects: { peasantCompliance: 10, blackMarketActivity: 5 } },
    { value: 2, label: 'Broad NEP', description: 'Expanded private trade and concessions', effects: { urbanFoodSupply: 10, corruption: 10 } },
  ], 1),
  law('grain_policy', 'Grain Policy', 'agriculture', 'Method of extracting grain from countryside', [
    { value: 0, label: 'Requisitioning', description: 'Compulsory grain seizures', effects: { peasantUnrest: 25, grainReserves: 15 } },
    { value: 1, label: 'Tax in Kind', description: 'Fixed percentage tax, surplus tradeable', effects: { peasantCompliance: 15, blackMarketActivity: 10 } },
    { value: 2, label: 'Free Grain Trade', description: 'Minimal state extraction', effects: { urbanFoodSupply: -10, peasantCompliance: 20 } },
  ], 1),
  law('union_independence', 'Union Independence', 'labor', 'Degree of trade-union autonomy from party', [
    { value: 0, label: 'Union Subordination', description: 'Unions as transmission belts', effects: { workerMorale: -10, partyUnity: 10 } },
    { value: 1, label: 'Union Consultation', description: 'Unions consulted but not decisive', effects: { workerMorale: 5 } },
    { value: 2, label: 'Union Independence', description: 'Unions manage economy', effects: { workerMorale: 15, partyUnity: -15 } },
  ], 0),
  law('factory_committees', 'Factory Committee Power', 'labor', 'Authority of worker factory committees', [
    { value: 0, label: 'Abolished', description: 'One-man management only', effects: { workerMorale: -15, industrialProduction: 5 } },
    { value: 1, label: 'Advisory', description: 'Committees consult but do not decide', effects: { workerMorale: 0 } },
    { value: 2, label: 'Co-management', description: 'Shared worker-manager authority', effects: { workerMorale: 10, industrialProduction: -5 } },
  ], 1),
  law('party_factions', 'Party Factions', 'political', 'Status of organized intra-party groups', [
    { value: 0, label: 'Factions Banned', description: 'On Party Unity resolution in force', effects: { partyUnity: 15, politicalRepression: 10 } },
    { value: 1, label: 'Debate Permitted', description: 'Discussion without organization', effects: { partyUnity: -5, sovietParticipation: 5 } },
    { value: 2, label: 'Factions Legal', description: 'Organized currents permitted', effects: { partyUnity: -20, exposure: -20 } },
  ], 0),
  law('press_restrictions', 'Press Restrictions', 'political', 'Censorship and publication controls', [
    { value: 0, label: 'Full Censorship', description: 'All publications state-approved', effects: { politicalRepression: 15, publicLegitimacy: -10 } },
    { value: 1, label: 'Party Press Only', description: 'Party publications with oversight', effects: { politicalRepression: 5 } },
    { value: 2, label: 'Limited Pluralism', description: 'Some non-party socialist press', effects: { sovietParticipation: 10, partyUnity: -10 } },
  ], 0),
  law('security_authority', 'Security Service Authority', 'political', 'Powers of the Cheka/GPU', [
    { value: 0, label: 'Limited', description: 'Judicial oversight required', effects: { politicalRepression: -10, regimeStability: -5 } },
    { value: 1, label: 'Standard', description: 'Administrative arrest permitted', effects: { politicalRepression: 5 } },
    { value: 2, label: 'Expanded', description: 'Extrajudicial measures authorized', effects: { politicalRepression: 20, publicExhaustion: 10 } },
  ], 1),
  law('strike_rights', 'Right to Strike', 'labor', 'Legal status of worker strikes', [
    { value: 0, label: 'Prohibited', description: 'Strikes are counter-revolutionary', effects: { workerMorale: -15, workerDiscipline: 10 } },
    { value: 1, label: 'Restricted', description: 'Permitted with party approval', effects: { workerMorale: 0 } },
    { value: 2, label: 'Protected', description: 'Legal strike rights for unions', effects: { workerMorale: 15, workerDiscipline: -10 } },
  ], 0),
  law('nationalities_policy', 'Nationalities Policy', 'nationalities', 'Relationship between center and republics', [
    { value: 0, label: 'Centralized', description: 'Moscow appoints all leaders', effects: { nationalityTensions: 15, administrativeCapacity: 5 } },
    { value: 1, label: 'Cultural Autonomy', description: 'Language rights, central appointments', effects: { nationalityTensions: 5 } },
    { value: 2, label: 'Federal Autonomy', description: 'Republican self-government', effects: { nationalityTensions: -10, regimeStability: -5 } },
  ], 1),
  law('labor_discipline', 'Labor Discipline', 'labor', 'Workplace discipline enforcement', [
    { value: 0, label: 'Militarized', description: 'Labor armies and compulsion', effects: { workerMorale: -20, industrialProduction: 10 } },
    { value: 1, label: 'Standard', description: 'Normal workplace rules', effects: {} },
    { value: 2, label: 'Lenient', description: 'Worker-friendly discipline', effects: { workerMorale: 10, industrialProduction: -5 } },
  ], 1),
  law('private_trade', 'Private Retail Trade', 'economic', 'Legal scope of NEP private commerce', [
    { value: 0, label: 'Banned', description: 'State distribution only', effects: { urbanFoodSupply: -15, blackMarketActivity: 20 } },
    { value: 1, label: 'Restricted', description: 'Small-scale private trade', effects: { urbanFoodSupply: 5, corruption: 5 } },
    { value: 2, label: 'Broad', description: 'Large private retail sector', effects: { urbanFoodSupply: 15, corruption: 15, revolutionaryEnthusiasm: -10 } },
  ], 1),
  law('political_amnesty', 'Political Amnesty', 'political', 'Treatment of political prisoners', [
    { value: 0, label: 'None', description: 'Political prisoners remain detained', effects: { politicalRepression: 10 } },
    { value: 1, label: 'Partial', description: 'Some categories released', effects: { sovietParticipation: 5 } },
    { value: 2, label: 'Broad', description: 'Most socialist prisoners freed', effects: { sovietParticipation: 15, partyUnity: -10 } },
  ], 0),
];
