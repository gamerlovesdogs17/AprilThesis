import type { RegionDefinition } from '@april-thesis/content-schema';

const hist = (date: string, sourceIds: string[]) => ({
  classification: 'historical' as const,
  sourceIds,
  historicalDate: date,
});

function region(
  id: string,
  name: string,
  cities: string[],
  desc: string,
  urban: number,
  rural: number,
  profile: string,
  ethnic: string,
  cx: number,
  cy: number,
  state: Partial<RegionDefinition['initialState']> & { influence?: Record<string, number> },
): RegionDefinition {
  return {
    id,
    name,
    majorCities: cities,
    description: desc,
    urbanPopulation: urban,
    ruralPopulation: rural,
    economicProfile: profile,
    ethnicComposition: ethnic,
    mapPath: '',
    centerX: cx,
    centerY: cy,
    influenceNodes: [{ id: `${id}-main`, x: cx, y: cy, type: 'city', name: cities[0] ?? name }],
    initialState: {
      administrativeCapacity: state.administrativeCapacity ?? 40,
      influence: state.influence ?? {},
      peasantResistance: state.peasantResistance ?? 20,
      nationalMovementStrength: state.nationalMovementStrength ?? 5,
      whiteActivity: state.whiteActivity ?? 2,
      localSovietAutonomy: state.localSovietAutonomy ?? 25,
      tradeUnionOrganization: state.tradeUnionOrganization ?? 30,
      factoryCommitteeOrganization: state.factoryCommitteeOrganization ?? 25,
      chekaPresence: state.chekaPresence ?? 40,
      redArmyLoyalty: state.redArmyLoyalty ?? 60,
      industrialProduction: state.industrialProduction ?? 20,
      agriculturalProduction: state.agriculturalProduction ?? 30,
      foodSupply: state.foodSupply ?? 25,
      famineSeverity: state.famineSeverity ?? 30,
      infrastructure: state.infrastructure ?? 30,
      railwayAccess: state.railwayAccess ?? 35,
      publicUnrest: state.publicUnrest ?? 25,
      strikeActivity: state.strikeActivity ?? 15,
      workerSupport: state.workerSupport ?? 25,
      partyMembership: state.partyMembership ?? 35,
      intelligenceReliability: state.intelligenceReliability ?? 50,
    },
    historical: hist('1921-03', ['tenth-congress-1921']),
  };
}

export const regions: RegionDefinition[] = [
  region('petrograd', 'Petrograd', ['Petrograd', 'Kronstadt'], 'Former capital, industrial hub, site of Kronstadt rebellion', 1200, 400, 'Shipbuilding, metalworking, textiles', 'Russian majority, Finnish minority', 95, 155, {
    administrativeCapacity: 55, influence: { workersOpposition: 30, zinoviev: 45, centralCommittee: 40 }, tradeUnionOrganization: 55, factoryCommitteeOrganization: 45, strikeActivity: 35, famineSeverity: 40, workerSupport: 40,
  }),
  region('moscow', 'Moscow', ['Moscow'], 'Capital of Soviet Russia, party and state headquarters', 1100, 600, 'Textiles, metalworking, administration', 'Russian majority', 180, 200, {
    administrativeCapacity: 70, influence: { centralCommittee: 60, secretariat: 45, workersOpposition: 20 }, chekaPresence: 65, partyMembership: 60, workerSupport: 30,
  }),
  region('central_industrial', 'Central Industrial Region', ['Ivanovo-Voznesensk', 'Kostroma'], 'Textile manufacturing belt', 450, 800, 'Textiles, light industry', 'Russian majority', 165, 185, {
    influence: { workersOpposition: 35, centralCommittee: 35 }, tradeUnionOrganization: 50, factoryCommitteeOrganization: 40, strikeActivity: 30,
  }),
  region('tula', 'Tula', ['Tula'], 'Armaments and metalworking center', 200, 500, 'Armaments, metallurgy', 'Russian majority', 175, 215, {
    influence: { workersOpposition: 25, trotsky: 30 }, industrialProduction: 45, redArmyLoyalty: 70,
  }),
  region('upper_volga', 'Upper Volga', ['Kazan', 'Simbirsk'], 'Multi-ethnic agricultural and industrial zone', 350, 1200, 'Agriculture, oil, light industry', 'Russians, Tatars, Chuvash', 240, 195, {
    famineSeverity: 55, nationalMovementStrength: 25, peasantResistance: 35,
  }),
  region('middle_volga', 'Middle Volga', ['Saratov', 'Samara'], 'Grain belt, famine epicenter', 300, 1500, 'Agriculture, grain', 'Russian majority', 255, 225, {
    famineSeverity: 75, foodSupply: 10, peasantResistance: 50, agriculturalProduction: 40,
  }),
  region('lower_volga', 'Lower Volga', ['Astrakhan', 'Tsaritsyn'], 'Fishing, grain transit, Cossack territories', 250, 900, 'Fishing, grain, oil', 'Russians, Kalmyks', 290, 250, {
    famineSeverity: 65, whiteActivity: 8, peasantResistance: 40,
  }),
  region('tambov', 'Tambov', ['Tambov'], 'Site of major peasant uprising, agricultural', 150, 1100, 'Agriculture', 'Russian majority', 210, 240, {
    peasantResistance: 70, whiteActivity: 15, famineSeverity: 60, chekaPresence: 55,
  }),
  region('don_basin', 'Don Basin', ['Novocherkassk'], 'Cossack agricultural region', 180, 700, 'Agriculture, cattle', 'Cossacks, Russians', 200, 280, {
    peasantResistance: 45, nationalMovementStrength: 15, whiteActivity: 10,
  }),
  region('donbas', 'Donbas', ['Kharkov', 'Yuzovka'], 'Coal and steel heartland', 600, 400, 'Coal, steel, heavy industry', 'Russian, Ukrainian workers', 175, 270, {
    influence: { workersOpposition: 40, centralCommittee: 35 }, industrialProduction: 55, tradeUnionOrganization: 50, workerSupport: 45,
  }),
  region('kuban', 'Kuban', ['Krasnodar'], 'Agricultural south, Cossack settlements', 200, 800, 'Agriculture, oil', 'Cossacks, Russians, Ukrainians', 185, 310, {
    peasantResistance: 35, agriculturalProduction: 50,
  }),
  region('northern_caucasus', 'Northern Caucasus', ['Vladikavkaz', 'Grozny'], 'Oil, mountain peoples, ethnic complexity', 150, 600, 'Oil, agriculture', 'Chechens, Ingush, Ossetians, Russians', 230, 320, {
    nationalMovementStrength: 40, chekaPresence: 50,
  }),
  region('crimea', 'Crimea', ['Simferopol', 'Sevastopol'], 'Strategic peninsula, mixed population', 200, 300, 'Agriculture, naval base', 'Russians, Tatars, Ukrainians', 155, 330, {
    nationalMovementStrength: 30, redArmyLoyalty: 65,
  }),
  region('central_ukraine', 'Central Ukraine', ['Kiev', 'Poltava'], 'Agricultural heartland, nationalist sentiment', 400, 1800, 'Agriculture, sugar', 'Ukrainians, Russians, Jews', 155, 285, {
    nationalMovementStrength: 45, famineSeverity: 50, peasantResistance: 40,
  }),
  region('western_ukraine', 'Western Ukraine', ['Kamenets-Podolsky'], 'Borderland, nationalist and peasant unrest', 200, 900, 'Agriculture', 'Ukrainians, Poles, Jews', 120, 275, {
    nationalMovementStrength: 55, whiteActivity: 12,
  }),
  region('belarus', 'Belarus', ['Minsk', 'Vitebsk'], 'Forests, agriculture, western borderlands', 250, 700, 'Forestry, agriculture, textiles', 'Belarusians, Jews, Poles', 145, 210, {
    nationalMovementStrength: 20, famineSeverity: 45,
  }),
  region('karelia', 'Karelia', ['Petrozavodsk'], 'Forests, Finnish border, sparse population', 80, 200, 'Forestry, fishing', 'Karelians, Russians, Finns', 130, 120, {
    nationalMovementStrength: 15, infrastructure: 20,
  }),
  region('northern_russia', 'Northern Russia', ['Arkhangelsk', 'Vologda'], 'Timber, White Sea ports', 150, 500, 'Timber, fishing', 'Russian majority', 175, 130, {
    infrastructure: 25, famineSeverity: 35,
  }),
  region('urals', 'Urals', ['Ekaterinburg', 'Perm', 'Ufa'], 'Mining, metallurgy, diverse industry', 500, 600, 'Mining, metallurgy, chemicals', 'Russians, Bashkirs, Tatars', 310, 195, {
    influence: { workersOpposition: 35, centralCommittee: 40 }, industrialProduction: 50, tradeUnionOrganization: 45,
  }),
  region('western_siberia', 'Western Siberia', ['Omsk', 'Tobolsk'], 'Agriculture, exile destination', 200, 800, 'Agriculture, fur trade', 'Russians, Siberian peoples', 380, 175, {
    famineSeverity: 40, infrastructure: 20,
  }),
  region('central_siberia', 'Central Siberia', ['Krasnoyarsk', 'Irkutsk'], 'Vast interior, mining, exile', 150, 400, 'Mining, forestry', 'Russians, indigenous peoples', 450, 200, {
    infrastructure: 15, administrativeCapacity: 25,
  }),
  region('far_east', 'Far East', ['Vladivostok', 'Chita'], 'Pacific frontier, Japanese intervention legacy', 200, 300, 'Fishing, mining, military', 'Russians, Chinese, Koreans', 580, 230, {
    nationalMovementStrength: 10, redArmyLoyalty: 55, administrativeCapacity: 30,
  }),
  region('turkestan', 'Turkestan', ['Tashkent', 'Bukhara'], 'Cotton, Islamic peoples, national tensions', 200, 1500, 'Cotton, irrigation agriculture', 'Uzbeks, Tajiks, Russians', 420, 340, {
    nationalMovementStrength: 50, chekaPresence: 45,
  }),
  region('kazakhstan', 'Kazakhstan', ['Orenburg', 'Semipalatinsk'], 'Nomadic peoples, emerging settlements', 100, 600, 'Pastoralism, emerging mining', 'Kazakhs, Russians', 360, 290, {
    nationalMovementStrength: 35, famineSeverity: 45,
  }),
  region('armenia', 'Armenia', ['Yerevan'], 'Mountain republic, genocide refugees', 120, 200, 'Agriculture, crafts', 'Armenians', 270, 355, {
    nationalMovementStrength: 55, famineSeverity: 50,
  }),
  region('azerbaijan', 'Azerbaijan', ['Baku'], 'Oil capital of the Caucasus', 250, 300, 'Oil, industry', 'Azerbaijanis, Armenians, Russians', 295, 360, {
    industrialProduction: 60, nationalMovementStrength: 40, workerSupport: 35,
  }),
  region('georgia', 'Georgia', ['Tbilisi', 'Batumi'], 'Newly Sovietized republic after the Red Army invasion displaced the Menshevik government', 200, 400, 'Agriculture, manganese, tea', 'Georgians, Armenians, Russians', 255, 370, {
    nationalMovementStrength: 60, localSovietAutonomy: 70, influence: { centralCommittee: 25 },
  }),
  region('baltic_frontier', 'Baltic Frontier', ['Pskov', 'Reval border zone'], 'Border with newly independent Baltic states', 150, 400, 'Agriculture, timber', 'Russians, Estonians, Latvians', 115, 175, {
    nationalMovementStrength: 25, whiteActivity: 8,
  }),
];
