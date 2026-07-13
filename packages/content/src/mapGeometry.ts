import type { MapRegionGeometry } from '@april-thesis/map-engine';

// Simplified strategic map geometry for 1921 Soviet Russia
// Regions are gameplay abstractions, not exact historical borders
export const mapGeometries: MapRegionGeometry[] = [
  { id: 'petrograd', path: 'M85,140 L110,130 L115,155 L100,170 L80,165 Z', centerX: 98, centerY: 155, labelX: 88, labelY: 148 },
  { id: 'moscow', path: 'M155,175 L185,168 L190,195 L170,205 L150,195 Z', centerX: 170, centerY: 188, labelX: 158, labelY: 182 },
  { id: 'central_industrial', path: 'M145,165 L175,158 L180,180 L155,190 L140,178 Z', centerX: 162, centerY: 173, labelX: 148, labelY: 168 },
  { id: 'tula', path: 'M160,200 L185,195 L188,220 L168,228 L155,215 Z', centerX: 172, centerY: 212, labelX: 162, labelY: 208 },
  { id: 'upper_volga', path: 'M210,155 L260,148 L270,180 L240,195 L205,185 Z', centerX: 238, centerY: 170, labelX: 220, labelY: 165 },
  { id: 'middle_volga', path: 'M230,200 L290,190 L300,230 L260,245 L220,235 Z', centerX: 258, centerY: 218, labelX: 240, labelY: 215 },
  { id: 'lower_volga', path: 'M260,240 L320,230 L335,275 L285,290 L250,275 Z', centerX: 290, centerY: 258, labelX: 270, labelY: 255 },
  { id: 'tambov', path: 'M185,220 L230,210 L240,250 L200,260 L180,245 Z', centerX: 210, centerY: 238, labelX: 195, labelY: 235 },
  { id: 'don_basin', path: 'M175,255 L220,245 L230,285 L190,295 L168,278 Z', centerX: 198, centerY: 270, labelX: 182, labelY: 268 },
  { id: 'donbas', path: 'M155,265 L200,255 L210,300 L170,310 L148,290 Z', centerX: 178, centerY: 282, labelX: 162, labelY: 278 },
  { id: 'kuban', path: 'M155,300 L210,290 L220,335 L175,345 L145,325 Z', centerX: 182, centerY: 318, labelX: 165, labelY: 315 },
  { id: 'northern_caucasus', path: 'M200,310 L260,300 L275,350 L220,360 L195,340 Z', centerX: 235, centerY: 330, labelX: 215, labelY: 325 },
  { id: 'crimea', path: 'M130,320 L170,310 L180,345 L145,355 L120,340 Z', centerX: 150, centerY: 332, labelX: 138, labelY: 328 },
  { id: 'central_ukraine', path: 'M120,260 L175,250 L185,300 L140,310 L110,290 Z', centerX: 148, centerY: 278, labelX: 130, labelY: 275 },
  { id: 'western_ukraine', path: 'M80,250 L125,240 L135,290 L95,300 L70,280 Z', centerX: 102, centerY: 270, labelX: 88, labelY: 268 },
  { id: 'belarus', path: 'M120,175 L165,168 L175,210 L140,220 L115,205 Z', centerX: 145, centerY: 193, labelX: 128, labelY: 190 },
  { id: 'karelia', path: 'M100,90 L145,80 L155,120 L115,130 L90,115 Z', centerX: 122, centerY: 105, labelX: 108, labelY: 102 },
  { id: 'northern_russia', path: 'M140,100 L200,90 L215,140 L170,155 L135,140 Z', centerX: 172, centerY: 122, labelX: 155, labelY: 118 },
  { id: 'urals', path: 'M280,155 L350,145 L365,200 L310,215 L275,195 Z', centerX: 318, centerY: 178, labelX: 295, labelY: 175 },
  { id: 'western_siberia', path: 'M340,140 L420,128 L435,185 L370,200 L335,180 Z', centerX: 382, centerY: 162, labelX: 360, labelY: 158 },
  { id: 'central_siberia', path: 'M400,170 L500,155 L520,220 L430,240 L395,215 Z', centerX: 455, centerY: 195, labelX: 425, labelY: 190 },
  { id: 'far_east', path: 'M480,180 L600,165 L620,240 L510,260 L475,230 Z', centerX: 545, centerY: 210, labelX: 510, labelY: 205 },
  { id: 'turkestan', path: 'M350,290 L440,278 L455,360 L370,375 L340,350 Z', centerX: 398, centerY: 328, labelX: 375, labelY: 325 },
  { id: 'kazakhstan', path: 'M310,240 L400,228 L420,300 L340,320 L300,295 Z', centerX: 358, centerY: 272, labelX: 335, labelY: 268 },
  { id: 'armenia', path: 'M240,350 L290,342 L300,385 L255,395 L230,378 Z', centerX: 265, centerY: 368, labelX: 248, labelY: 365 },
  { id: 'azerbaijan', path: 'M270,355 L330,345 L345,395 L285,408 L260,388 Z', centerX: 302, centerY: 375, labelX: 282, labelY: 372 },
  { id: 'georgia', path: 'M220,360 L275,350 L290,400 L240,412 L210,395 Z', centerX: 252, centerY: 380, labelX: 232, labelY: 378 },
  { id: 'baltic_frontier', path: 'M90,155 L130,148 L140,185 L105,195 L80,180 Z', centerX: 110, centerY: 172, labelX: 98, labelY: 168 },
];

// Update region definitions with map paths
export function getRegionPath(regionId: string): string {
  return mapGeometries.find(g => g.id === regionId)?.path ?? '';
}
