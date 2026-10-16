# Wildwood asset-credit manifest

## Current overhaul additions

See [MANIFEST.json](MANIFEST.json) for the complete machine-readable additions manifest. Kenney's **Animated Characters Survivors** pack supplied the actual rigged survivor and zombie skin, verified against its included [CC0 license](models/survivors-LICENSE.txt). Both are converted to bundled GLBs with idle/run clips and muted atlas materials. Original local bow, meat/hide/fiber loot and Pearl Core GLBs plus 47 cohesive SVG illustrations are authored for this rework and dedicated under CC0. The reproducible authoring sources are [.freebuff/convert-survivors.html](../.freebuff/convert-survivors.html) and [.freebuff/make-icons.py](../.freebuff/make-icons.py).

No Quaternius zombie mirror was integrated: its page showed Attribution licensing, and the wooden-bow mirror was blocked by a browser challenge. No license was inferred from the word “free.”

## Direction
Muted crafted wilderness: earth-toned palette, rough hide/wood/stone, weathered metal and readable carved silhouettes. Kenney palette textures are locally remapped to olive foliage and neutral rock; no global green post-processing cast is introduced. Models are local, not runtime CDN dependencies. Tom Pearl's recognizable custom model is retained.

## Models — CC0 1.0

| Assets | Creator / original source | Local paths | Modifications |
|---|---|---|---|
| Axe, upgraded axe, pickaxe, shovel | Kenney, [Survival Kit](https://kenney.nl/assets/survival-kit), [itch page](https://kenney-assets.itch.io/survival-kit) | `models/kenney/tool-axe.glb`, `tool-axe-upgraded.glb`, `tool-pickaxe.glb`, `tool-shovel.glb` | Normalized scale, grip pivots, distinct camera swing profiles, muted palette. |
| Trees, tall trees, fallen log, rock A/B | Same Kenney Survival Kit | `models/kenney/tree.glb`, `tree-tall.glb`, `tree-log.glb`, `rock-a.glb`, `rock-b.glb` | Palette desaturation/olive remap, deterministic size variation; harvestable identity preserved. |
| Chest, workbench, campfire pit | Same Kenney Survival Kit | `models/kenney/chest.glb`, `workbench.glb`, `campfire-pit.glb` | Player-scale normalization; existing interactions, colliders, fire and lights retained. |
| Bedroll, barrel, wood and stone bundles | Same Kenney Survival Kit | `models/kenney/bedroll.glb`, `barrel.glb`, `resource-wood.glb`, `resource-stone.glb` | Camp dressing and visible claimable supplies. |
| Shared model palette | Same Kenney Survival Kit | `models/kenney/Textures/colormap.png` | Runtime canvas remap, cached per texture; original bundled unmodified. |
| Deer | Quaternius, [Ultimate Animated Animal Pack](https://quaternius.com/packs/ultimateanimatedanimals.html); [download mirror](https://poly.pizza/m/T6Cs7tmMHJ) | `models/deer.glb` | 1.65m height, independent skeleton cloning, rough neutral hide texture; idle/walk/gallop/hit/death clips driven by AI. |
| Pig | Quaternius, [Farm Animal Pack](https://quaternius.com/packs/farmanimal.html); [mirror](https://poly.pizza/m/TNvG3QUFlp) | `models/pig.glb` | 0.95m height, independent skeletons, muted textured hide. Supplied idle clip plus authored skeletal gait; death rolls onto side. Mirror contains only idle/jump, not a run/death animation set. |
| Pine | Quaternius, [Ultimate Nature Pack](https://quaternius.com/packs/ultimatenature.html); [mirror](https://poly.pizza/m/Zt62gceKXZ) | `models/pine.glb` | Textured foliage/bark, rough nonmetallic materials, variable height. |
| Sword | Quaternius, [model source](https://poly.pizza/m/9lLmH8Et4K) | `models/stone-sword.glb` | Stone-colored, nonmetallic blade; grip pivot and scale. |
| Large sword | Quaternius, [model source](https://poly.pizza/m/ajOJ2NLz5m) | `models/iron-blade.glb` | Weathered iron blade, grip pivot and scale. |
| Claymore | Quaternius, [model source](https://poly.pizza/m/BBhN1O6TOL) | `models/gold-blade.glb` | Red blade replaced with restrained aged-gold material; long slow cleave identity. |
| Dagger | Quaternius, [model source](https://poly.pizza/m/kSMpR711Y2) | `models/knife.glb` | Short grip-relative hunting knife. |
| Wooden torch | Quaternius, [model source](https://poly.pizza/m/pNsfJzhXiD) | `models/torch.glb` | Emissive flame, held/placed versions, pooled light; scale and pivot normalization; source flame mesh repositioned from below the grip into the wrapped head. |

All model source pages state **CC0 1.0**, permitting personal and commercial use without mandatory attribution. Kenney's included license is [LICENSE.txt](models/kenney/LICENSE.txt). CC0 legal text: https://creativecommons.org/publicdomain/zero/1.0/

Quaternius's original Google Drive deer download returned “quota exceeded”; that failed response was removed. The CC0 GLB mirror was successfully downloaded through Chromium and validated with Three.js. Models were selected, not entire unrelated asset packs.

## Textures — Poly Haven CC0

Locally bundled 1K diffuse/OpenGL normal maps. [Poly Haven license](https://polyhaven.com/license).

| Asset | Creator / source | Local files | Modifications |
|---|---|---|---|
| Forest Floor | Poly Haven, https://polyhaven.com/a/forest_floor | `textures/forest_floor.jpg`, `forest_floor-normal.jpg` | Albedo desaturated in terrain shader before biome tinting. |
| Bark Brown 02 | Poly Haven, https://polyhaven.com/a/bark_brown_02 | `textures/bark_brown_02.jpg`, `bark_brown_02-normal.jpg` | Scale/roughness normalization; also used on the authored club and husk. |
| Rock Boulder Dry | Poly Haven, https://polyhaven.com/a/rock_boulder_dry | `textures/rock_boulder_dry.jpg`, `rock_boulder_dry-normal.jpg` | Existing world/cave materials retained. |
| Wood Planks Grey | Poly Haven, https://polyhaven.com/a/wood_planks_grey | `textures/wood_planks_grey.jpg`, `wood_planks_grey-normal.jpg` | Existing weathered structures retained. |

## Original assets and retained systems

- `models/club.glb`: original asymmetric indexed carved-club mesh authored for this game, with Poly Haven CC0 bark embedded. Reproducible authoring script: `.freebuff/make-club.py`.
- Hide grain texture, husk coat/hood, crawler chitin/mandibles, mine portals/ladder/markings, building geometry, field journal writing and Web Audio music/SFX: original additions for this game.
- Tom Pearl: user-provided custom model (`model-rigged.glb` and existing embedded copy). Preserved, not redistributed under a newly claimed license. Its provenance was not independently audited.
- Three.js 0.160.0: MIT; [bundled license](../vendor/three/LICENSE).

`models/kenney/structure.glb` and `structure-canvas.glb` are downloaded candidate files but **not used** by the game; the existing destructible modular shack geometry was retained so collision and door behavior are not misrepresented.
