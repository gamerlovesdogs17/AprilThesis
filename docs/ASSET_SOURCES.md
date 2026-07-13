# Asset Sources

The sole machine-readable manifest is `apps/web/public/assets/assets-manifest.json`. The old root manifest was removed, and validation fails if it returns.

| Group | Origin | Status |
| --- | --- | --- |
| Natural Earth context | Natural Earth 1:110m countries | Public domain |
| Congress hall | Original project-directed generated reconstruction | Labeled artistic reconstruction |
| Ambience, effects, interface cues | `scripts/generate-audio-assets.mjs` | Original deterministic PCM synthesis |
| Seven music tracks | `scripts/generate-audio-assets.mjs` | Original deterministic instrumental score |
| Thirteen portraits | Individually verified Wikimedia Commons files | Public domain or CC0; local copies |

## Portraits

The complete subject, date, creator, Commons file page, license, and display-crop record is in `apps/web/public/assets/portraits/sources.json`. The selected images cover Kollontai (1923), Shliapnikov (undated period photograph), Lenin (1920), Trotsky (1918), Stalin (1920), Bukharin (circa 1920s), Zinoviev (1920), Kamenev (before 1923), Dzerzhinsky (1919), Tomsky (before 1930), Rykov (1924), Rakovsky (1925), and Krupskaya (1920s).

The project does not alter source pixels, colorize, or claim restoration. CSS uses a center `object-fit` display crop and mild sepia/contrast treatment. Medvedev retains an explicitly labeled fallback because no clearly identified licensed portrait was established. Myasnikov also retains the designed fallback.

## Workers' Opposition emblem research

Searches of the faction's 1921 texts, scholarly overview material, Wikimedia Commons, and general historical records located pamphlets, leaders, and union context but no documented distinct faction badge, flag, or logo. This is an inference from the reviewed record, not proof that no informal mark ever existed. The game therefore uses a typographic identity and leader portraits; its code-native mark is labeled a modern interface insignia in the intro, campaign, setup, and credits.

## Reproduction

```bash
node scripts/build-map-context.mjs
node scripts/generate-audio-assets.mjs
node scripts/fetch-historical-portraits.mjs
npm run validate:assets
```

The portrait fetch script is a reproducibility aid and requires network access. Gameplay does not.
