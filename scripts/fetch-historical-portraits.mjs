import { mkdir, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const output=resolve(import.meta.dirname,'../apps/web/public/assets/portraits');
const portraits=[
  ['kollontai.jpg','https://upload.wikimedia.org/wikipedia/commons/9/9b/Alexandra-Kollontai-1923.jpg'],
  ['shliapnikov.jpg','https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Shliapnikov-alexander.jpg/960px-Shliapnikov-alexander.jpg'],
  ['lenin.jpg','https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Lenin_in_1920_%28cropped%29.jpg/960px-Lenin_in_1920_%28cropped%29.jpg'],
  ['trotsky.jpg','https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Leon_Trotsky_1918_%283x4_rotated_cropped_b%29.jpg/960px-Leon_Trotsky_1918_%283x4_rotated_cropped_b%29.jpg'],
  ['stalin.jpg','https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Stalin_1920-1.jpg/960px-Stalin_1920-1.jpg'],
  ['bukharin.jpg','https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/N.I._Bukharin_%281888-1938%29_Crop.jpg/960px-N.I._Bukharin_%281888-1938%29_Crop.jpg'],
  ['zinoviev.jpg','https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Grigorii_Zinovieff_1920_%28cropped%29%28b%29.jpg/960px-Grigorii_Zinovieff_1920_%28cropped%29%28b%29.jpg'],
  ['kamenev.jpg','https://upload.wikimedia.org/wikipedia/commons/0/07/Lev_Kamenev_1920s_%28cropped%29%28b%29.jpg'],
  ['dzerzhinsky.jpg','https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Feliks_Dzier%C5%BCy%C5%84ski.jpg/960px-Feliks_Dzier%C5%BCy%C5%84ski.jpg'],
  ['tomsky.jpg','https://upload.wikimedia.org/wikipedia/commons/6/63/MichailTomski.jpg'],
  ['rykov.jpg','https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/M._Rykof%2C_successeur_de_Lenine_%28grosse_t%C3%AAte%29_-_btv1b90238365_Crop.jpg/960px-M._Rykof%2C_successeur_de_Lenine_%28grosse_t%C3%AAte%29_-_btv1b90238365_Crop.jpg'],
  ['rakovsky.png','https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/M._Rakowski%2C_Ambassadeur_des_Soviets_%C3%A0_Paris_1925_Crop.png/960px-M._Rakowski%2C_Ambassadeur_des_Soviets_%C3%A0_Paris_1925_Crop.png'],
  ['krupskaya.jpg','https://upload.wikimedia.org/wikipedia/commons/7/70/Krupskaya_photo.jpg'],
];

await mkdir(output,{recursive:true});
for(const [file,url] of portraits){
  const destination=resolve(output,file);
  try { if((await stat(destination)).size>1000){console.log(`Kept ${file}`);continue;} } catch { /* Download missing file. */ }
  let response;
  for(let attempt=0;attempt<4;attempt+=1){
    response=await fetch(url,{headers:{'User-Agent':'AprilThesis historical-asset builder/0.4 (local educational project)'}});
    if(response.status!==429)break;
    await new Promise(resolveDelay=>setTimeout(resolveDelay,5000*(attempt+1)));
  }
  if(!response)throw new Error(`No response while downloading ${url}`);
  if(!response.ok)throw new Error(`${response.status} while downloading ${url}`);
  const contentType=response.headers.get('content-type')??'';
  if(!contentType.startsWith('image/'))throw new Error(`Unexpected ${contentType} for ${url}`);
  await writeFile(destination,Buffer.from(await response.arrayBuffer()));
  console.log(`Downloaded ${file}`);
  await new Promise(resolveDelay=>setTimeout(resolveDelay,1800));
}
