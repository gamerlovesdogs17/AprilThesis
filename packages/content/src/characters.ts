import type { CharacterDefinition } from '@april-thesis/content-schema';

const hist = (date: string, sources: string[]) => ({
  classification: 'historical' as const,
  sourceIds: sources,
  historicalDate: date,
  confidence: 'high' as const,
});

function char(
  id: string,
  name: string,
  aliases: string[],
  title: string,
  desc: string,
  alignment: string,
  trust: number,
  offices: string[],
  positions: Record<string, number | string>,
  alliances: string[],
  conflicts: string[],
): CharacterDefinition {
  return {
    id,
    name,
    aliases,
    title,
    description: desc,
    isHistorical: true,
    positionPeriods: [{
      startDate: '1921-03',
      offices,
      issuePositions: positions,
      alliances,
      conflicts,
      confidence: 'high',
      sourceIds: ['tenth-congress-1921'],
    }],
    initialState: { trust, fear: 20, respect: 50, health: 80, factionAlignment: alignment },
    relationships: {},
    redLines: [],
    secrets: [],
    historical: hist('1921-03', ['tenth-congress-1921']),
  };
}

export const characters: CharacterDefinition[] = [
  char('lenin', 'Vladimir Lenin', ['Ulianov'], 'Chairman, Council of People\'s Commissars', 'Leader of the Bolshevik Party and Soviet state. Exhausted by civil war, now pushing NEP.', 'leninist_center', 30, ['CNK Chairman', 'Politburo'], { nep: 80, factions: 10, unions: 40 }, ['kamenev', 'zinoviev'], ['trotsky', 'workers_opposition']),
  char('trotsky', 'Leon Trotsky', ['Bronstein'], 'People\'s Commissar for Military Affairs', 'Red Army organizer advocating military modernization and labor discipline.', 'trotskyist', 15, ['War Commissar', 'Politburo'], { unions: 20, labor_discipline: 90, nep: 50 }, ['lenin'], ['stalin', 'workers_opposition']),
  char('stalin', 'Joseph Stalin', ['Dzhugashvili'], 'People\'s Commissar for Nationalities', 'Georgian Bolshevik building influence through the party apparatus.', 'secretariat', 20, ['Nat\'l Commissar', 'Orgburo'], { bureaucracy: 70, nationalities: 60, unions: 30 }, ['zinoviev', 'kamenev'], ['trotsky', 'workers_opposition']),
  char('bukharin', 'Nikolai Bukharin', [], 'Central Committee member', 'Theorist advocating gradual market socialism under NEP.', 'bukharinist', 35, ['CC Member', 'Comintern'], { nep: 90, unions: 50, peasants: 70 }, ['rykov'], ['left_communist']),
  char('zinoviev', 'Grigory Zinoviev', ['Radomyslsky', 'Zinovyev'], 'Chairman, Petrograd Soviet', 'Petrograd party boss, allied with Kamenev and Stalin.', 'zinovievist', 10, ['Petrograd Soviet', 'Comintern'], { party_unity: 85, unions: 25 }, ['kamenev', 'stalin'], ['trotsky', 'workers_opposition']),
  char('kamenev', 'Lev Kamenev', ['Rosenfeld'], 'Deputy Chairman, Sovnarkom', 'Senior party figure, pragmatic centrist.', 'leninist_center', 25, ['Sovnarkom Deputy', 'Politburo'], { nep: 70, party_unity: 80 }, ['zinoviev', 'lenin'], ['trotsky']),
  char('rykov', 'Alexei Rykov', [], 'People\'s Commissar for Economy', 'Economic administrator supporting NEP stabilization.', 'bukharinist', 30, ['Economy Commissar'], { nep: 85, production: 75 }, ['bukharin'], ['workers_opposition']),
  char('tomsky', 'Mikhail Tomsky', [], 'Chairman, All-Russian Central Council of Trade Unions', 'Trade-union leader caught between party discipline and worker interests.', 'union_leadership', 45, ['VTsSPS Chairman'], { unions: 75, party_unity: 60 }, ['shliapnikov'], ['workers_opposition']),
  char('dzerzhinsky', 'Felix Dzerzhinsky', ['Dzerzhinskii'], 'Chairman, Cheka', 'Polish Bolshevik heading political police. Ruthless but claims revolutionary necessity.', 'security_hardliner', 5, ['Cheka Chairman'], { security: 95, repression: 80 }, ['lenin'], ['workers_opposition', 'anarchists']),
  char('kollontai', 'Alexandra Kollontai', [], 'Workers\' Opposition spokesperson', 'Bolshevik feminist, former People\'s Commissar for Social Welfare, and author of the opposition pamphlet.', 'workers_opposition', 70, ['Workers\' Opposition'], { unions: 90, feminism: 95, nep: 40 }, ['shliapnikov', 'medvedev'], ['zinoviev', 'dzerzhinsky']),
  char('shliapnikov', 'Alexander Shliapnikov', ['Shlyapnikov'], 'Chairman, Metalworkers\' Union', 'Veteran metalworker and principal leader of the Workers\' Opposition.', 'workers_opposition', 75, ['Metalworkers\' Union'], { unions: 95, worker_control: 90 }, ['kollontai', 'medvedev', 'tomsky'], ['lenin', 'trotsky']),
  char('medvedev', 'Sergei Medvedev', [], 'Secretary, Metalworkers\' Union', 'Workers\' Opposition organizer and union militant.', 'workers_opposition', 65, ['Metalworkers\' Secretary'], { unions: 85, underground: 60 }, ['shliapnikov', 'kollontai'], ['dzerzhinsky']),
  char('myasnikov', 'Gavril Myasnikov', [], 'Factory committee militant', 'Left communist and factory committee advocate. More radical than the Workers\' Opposition mainstream.', 'left_communist', 40, ['Factory committee activist'], { factory_committees: 95, unions: 70 }, [], ['lenin', 'tomsky']),
  char('rakovsky', 'Christian Rakovsky', [], 'Chairman, Ukrainian Soviet government', 'Bulgarian internationalist leading Ukraine. Democratic centralist sympathies.', 'democratic_centralist', 35, ['Ukrainian Sovnarkom'], { nationalities: 70, unions: 55 }, [], ['stalin']),
  char('krupskaya', 'Nadezhda Krupskaya', [], 'Narkompros official', 'Lenin\'s wife, education commissariat. Sympathetic to inner-party democracy.', 'leninist_center', 40, ['Narkompros'], { education: 90, party_democracy: 60 }, ['lenin'], []),
];
