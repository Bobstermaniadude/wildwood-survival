# Wildwood — inventory, combat and world-state overhaul

## Delivered implementation

- [index.html](index.html): retains the smooth terrain, weather, caves, original Tom Pearl rig, camp building and first-person controls. Replaces the fixed catalogue quickbar with **nine genuinely empty-at-start item slots**. Number keys 1–9 and wheel select owned contents; empty slots use intrinsic fists. A new run has no preloaded inventory and begins with physical wood/stone/fiber/berry supplies near spawn; unarmed harvesting remains functional.
- [items.js](items.js): authoritative UID-bearing slots, stack limits, independently owned equipment, atomic recipe transactions, stack merging/splitting/swapping, armor equipment, actual chest transfer, malformed-save validation and legacy conversion. `state.inv` is a derived transactional proxy over those slots, not a second resource store. Iron/gold resources and iron/gold blades have distinct item IDs. Acquisition merges existing stacks or fills empty quickbar/backpack space without overwriting manually assigned slots. The backpack grows rather than silently discarding items.
- Visual expedition pack: owned-stack grid, quickbar, item descriptions/actions, head/chest/leg/main-hand equipment, armor reduction and actual rotating full-body survivor with idle animation, local lighting and shadows. Native drag/drop between inventory and quickbar; Shift-drag splits; compatible drops merge. Main-hand stowing and armor unequipping return real items. Preview skeletons, materials, renderer and shadow resources are cleaned up on close/restart/death.
- 47 original local [SVG icons](assets/icons/wood.svg), consistently used for items, quickbar, recipes, building choices, chest storage, pickup notifications and HUD resource summaries. Illustrated fallback, accessible image labels and SVG titles; no resource/weapon emoji substitutions.
- Field recipes: basic tools/weapons, torch, stored field dressing, basic hide armor. Workbench: advanced melee equipment, ash bow, six-arrow batches, reinforced armor and **Pearl ward cuirass** using a collected Pearl Core. Crafting creates real items, supports multiple separately owned tools and validates actual station access. Cooking converts meat to an owned cooked-food stack. Existing construction/dismantling costs/refunds use the same store.
- Armor: head/chest/legs with per-piece protection, centrally summed and clamped at 65%. Modular fitted preview shells visibly change loadout and material. Environmental drowning damage bypasses combat armor. Legacy hide lining retains its original 25% protection as an equipped legacy lining item.
- [combat.js](combat.js): ash-bow draw phase, first-person local model, moving arrows at 32m/s with gravity, segment/sphere collision against all four combat families, terrain segment sampling and scenery/building ray collision. One ammo debit per valid launch; no-ammo shots spawn nothing. Recoverable impact arrows preserve orientation and can be collected once. Flight count capped at 24; misses expire after 8s / 150m. Collision candidate arrays and vector scratch are reused; scenery matrix update happens once per projectile update, not per target.
- Stamina: original code had **no recovery delay**, so a claimed 35–50% reduction would be inaccurate. Current centralized tuning uses a short 0.45s post-effort gate with moving/resting regeneration **7.6 / 14 per second**, up from **6 / 11** (~27% faster). Sprint remains 15/s; committed attacks still cost stamina. UI calls out exhaustion and zero recovers normally.
- [art.js](art.js): cached local GLBs with skeleton-aware cloning, private hit/fade materials, scale normalization and appropriate idle/run selection. The rigged textured husk uses the same Kenney family as the survivor, muted decayed materials, a reduced head/slimmer silhouette, patrol/detection/pursuit, 7.8m/s pressure, 0.65s attack wind-up, cooldown, hit stagger, terrain/scenery/camp collision and death.
- Shared ALIVE → DYING → CORPSE → fade → physical reward → removal lifecycle. Animal deer uses its supplied death clip; pig/husk/crawler use distinct procedural fall/collapse supplements. Bodies linger roughly 3.5–5s after their fall, then fade over 1.5–2.5s. No rewards are automatically granted for kills. Meat/hide, fiber/iron and the boss Core/gold become physical pickups. Dead entities stop ordinary AI and damage immediately.
- Tom Pearl retains his recognizable gold rig. His death has a controlled forward collapse, head droop, extinguishing aura/light, rising embers, separate sound and delayed **physical Pearl Core**. Duplicate death calls do not repeat rewards. Saving during a corpse sequence serializes pending reward data once rather than a mesh or animation mixer.
- Player death has a dedicated bounded first-person fall/tilt update while normal movement is disabled, followed by the overlay at 1.8s. Pointer lock and menus are released; restart clears projectiles/corpses/loot/input and restores an empty pack.

## Graphics/world-generation root cause and correction

Three separate quality dependencies caused the defect:

1. Tree/rock/bush counts used `Q.foliage` inside a single chunk gameplay RNG stream. Different loop counts shifted every later object, including buried ore.
2. Broadleaf canopy cluster count **also** used `Q.foliage`, changing random consumption inside `makeTree()` even after the top-level counts were repaired.
3. `applyQuality()` unloaded and regenerated all chunks, resetting partial harvest HP and exposing those generator differences immediately.

Gameplay generation now uses a stable canonical High-layout stream derived from seed/chunk coordinates. It never reads graphics foliage settings. Harvestable IDs include seed, chunk, category and deterministic coordinate key. A separately seeded decorative stream produces a stable maximum visual set; quality changes visibility only. All essential colliders/resources remain.

Preset changes keep the same chunk, harvestable, collider, enemy, structure and torch objects. Terrain tessellation alone is replaced/remeshed, without prop reconstruction; collision continues using the same analytic terrain. Partial harvest state survives streaming and saving. Low still changes pixel ratio, shadows, bloom, terrain segments, decorative density, fog banks and motes; presets are not forced to Ultra.

## Saves and compatibility

Schema **v4**, same browser key `wildwood-run-v2`:

- UID-bearing inventory slots/hotbar, equipped armor, selected slot, ammo and stored healing.
- Player HP/hunger/stamina, position, seed, terrain-generator version, day/time and weather.
- Structures, actual chest slots, doors/fuel, torch XYZ, digs, harvested/mined/revealed locations, partial harvest state, claimed POIs and lore.
- Physical unclaimed loot, pending corpse rewards, living enemy/animal position/HP and boss presence.
- No live Three.js objects, skeletons, mixers or materials are serialized. Arrows in flight are transient; embedded collectible arrows are saved.

Valid v2/v3 resources and unique crafted IDs migrate exactly once; old selected torch indices map correctly. A legacy raw-save backup is stored before migrated autosaves. Malformed v4 stacks/duplicate identities reject safely without overwriting raw data. Existing High-layout saves retain canonical positions. **Historic Low/Ultra layouts from the old quality-dependent generator cannot be reconstructed exactly from the old schema**, which stored no authoritative prop manifest or per-harvest preset. Existing resource/equipment/progression/coordinate records are preserved; this limitation is not hidden as an exact historic-layout guarantee.

## Integrated art/licenses

[assets/MANIFEST.json](assets/MANIFEST.json) and [assets/CREDITS.md](assets/CREDITS.md) record actual paths, sources, creators, licenses and modifications.

- **Kenney Animated Characters Survivors — CC0**, verified from the actual downloaded archive and bundled [license](assets/models/survivors-LICENSE.txt). Survivor/zombie atlas skins plus supplied idle/run FBX clips converted to local GLBs. Longest correct clips chosen rather than the tiny auxiliary takes.
- Original local ash bow, meat cut, irregular hide, rolled fiber, Pearl Core, arrows, modular armor shells and **47 illustrated SVGs**. Original additions are dedicated under CC0; authoring sources saved.
- Existing 25 local model types remain: Kenney/Quaternius CC0, existing Poly Haven CC0 maps, Three.js MIT. Tom Pearl remains user-provided; no new license is asserted for him.
- Quaternius zombie mirror was not used because its page listed Attribution, not CC0. Wooden-bow mirror hit a browser challenge; a compatible original bow was created, not falsely claimed downloaded.

## Tests actually executed on final code

**119 browser assertions + 9 standalone item tests passed.** All browser suites use actual Edge/Chromium WebGL, native UI actions where applicable, and explicit `?qa=manual` reproducible setup/stepping. A separate `?qa=live` run exercised the real requestAnimationFrame loop. Final syntax checks passed for the inline module and all four JS modules. No TypeScript/project typecheck exists.

| Suite | Result | Evidence |
|---|---:|---|
| Core item/combat/persistence | 72/72 | [runner](.freebuff/overhaul-qa.cjs), [results](.freebuff/overhaul-results.json) |
| Preserved systems/live loop | 27/27 | [runner](.freebuff/overhaul-regression.cjs), [results](.freebuff/overhaul-regression-results.json) |
| Native UI, workshop, draw and enemy presentation | 12/12 | [runner](.freebuff/overhaul-ui-qa.cjs), [results](.freebuff/overhaul-ui-results.json) |
| Independent preset-first determinism | 8/8 | [runner](.freebuff/quality-determinism.cjs), [complete object records/results](.freebuff/quality-determinism-results.json) |
| Standalone inventory tests | 9/9 | [tests](tests/items.test.mjs), [log](.freebuff/items-tests.log) |

Coverage includes:

- Nine empty quickbar slots/no locked icons; physical spawn supplies; collection exactly once; SVGs; capped stacks; splitting/merging/swapping; invalid drops/negative counts; atomic failed recipes; actual tool ownership; native pack drag/drop and rotation; armor UI equip/unequip and main-hand stow.
- Field/bench separation, native ammo/Core recipe buttons, exact costs, multiple tool instances, chest stacks/tools, transfers and save/reload.
- No armor/one piece/multiple piece actual incoming damage; visible armor; legacy 25% migration.
- Moving arrows hit pig/husk/crawler/Tom Pearl exactly once; terrain impact/recovery; no ammo; expiry; native delayed draw/fire; ammo once.
- Each entity's linger/pause/fade/physical reward/once-only collection. Animal hit reset and independent skeleton/materials. Boss death no ordinary AI. Corpse reward saving, living injured animal and physical Core restoration.
- Controlled delayed enemy/drowning-reason death, cursor/menu cleanup, restart; real live main loop/preview.
- Actual shovel dig/fill and no free terrain, scenery identity, 30 torch recovery cycles conserving inventory/lights/list, aimed model removal, foundation costs/repeat guard/refund once, solid door, campfire cooking, cave descent/ore/ladder, streaming and save edits.
- Ultra → High → Medium → Low → Ultra repeated three times in an edited active world with partial harvesting, structures and torches. Independent fresh boot under all presets compares **complete identities/XYZ/type/HP/ore and terrain/biome records**. Four additional move-180m/return quality round trips compare exact records. No JS errors in final suites; core also records no failed asset requests.
- GLB container lengths and manifest local paths validated.

Failures caught and corrected, then rerun: boss mixer cleanup assumed an animal-only visual root; old selected indices shifted after adding bow; a migration harness reload triggered the real pagehide autosave (harness corrected rather than weakening game autosave); broadleaf canopy quality RNG consumption; audio ambient update accessed a failed/null AudioContext; armor shell height mismatch; tiny run take selection. These are not reported as passes from an earlier revision.

### Visual review

Screenshots captured and inspected with the shared browser: [inventory](.freebuff/overhaul-inventory.png), [armor](.freebuff/overhaul-armor.png), [husk/bow](.freebuff/overhaul-husk.png), [corpse](.freebuff/overhaul-corpse.png), [boss death](.freebuff/overhaul-boss-death.png), [live pack](.freebuff/overhaul-live.png). The game retains stylized assets; it is not claimed photorealistic.

### Measurement, not a speedup claim

Final representative SwiftShader/software-rendered run, 1280×820: **120 simulation updates / 186.1ms (~1.55ms per update)**. Same scene Low: **159 calls / 44,742 triangles**; High: **175 / 56,456**. This demonstrates differing render budgets, not hardware FPS or a measured speedup over an old version. Concurrent automated runs/software rendering can vary substantially.

## Explicit limitations / unverified work

- Husk is now a genuine textured rig, but Kenney's stylized head/skin remains recognizable; this is a coherent stylized horror direction, not a custom high-detail monster. Its attack/death use procedural transforms because the verified pack supplies idle/run/jump, not authored attack/death. Crawler remains the existing textured procedural creature; pig death is a procedural supplement. Modular armor shells are fitted original meshes, not a separately imported high-detail armor kit.
- AI shares terrain/prop/camp collision and wind-ups, but does not have a navigation mesh or strategic pathfinding around whole buildings. Long multi-night difficulty, physical-device audio mix, hardware FPS, GPU-memory soak and cross-browser/mobile interaction coverage remain unverified.
- Drowning damage reason and dedicated camera death were tested with deterministic damage setup, **not a full timed natural underwater drowning session**. Weather/day/night updates ran in the real loop, but every weather transition across multiple full nights was not individually verified.
- Survey chambers still use explicit descend/climb entrances, not seamless arbitrary tunnels. Smooth heightfield/terrain remains; no voxel conversion or fluid rewrite.
- Infinite historical physical loot is retained for save integrity and culled visually by distance, not expired. Extended huge-world memory/storage stress remains unverified. Existing 2,000-dig / 180-structure / 8-torch safeguards remain. Backpack overflow expands; no new burden meter was introduced.
- The portrait uses stable idle with fitted static armor shells rather than fully skinned imported modular armor; equipment follows character rotation, not every small idle limb motion. Narrow-panel responsive layout scrolls; phone-touch drag/drop remains unverified.
- Legacy saves from the old broken quality-specific layouts lack the data needed to restore their exact former non-High object distribution; canonical deterministic layout is used going forward. Invalid saves are retained, not silently replaced.

The local game remains available at **http://127.0.0.1:8087/** in Preview. Nothing was committed, pushed or deployed.
