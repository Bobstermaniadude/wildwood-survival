# Wildwood — The Pearl Signal

## Current item/combat overhaul

The current implementation supersedes the older rework notes below. See [OVERHAUL-REPORT.md](OVERHAUL-REPORT.md) for verified features, tests, asset licenses and honest limitations.

- **Nine real item quickbar slots, empty at start.** 1–9 / mouse wheel select; empty slots use fists. Collect physical loose spawn supplies or gather unarmed. Items auto-stack / fill free slots, never overwrite assigned contents.
- **I expedition pack:** owned item grid, drag/drop swaps/merges, Shift-drag splits, rotating rigged survivor, visible armor, head/chest/legs/main-hand equip/stow and inspected-item actions.
- **C field crafting; E workbench:** actual owned tools, healing, hide armor; workshop unlocks bow/arrows/reinforced armor and Pearl Core cuirass. Bow has a brief draw phase, moving ballistic arrows and once-only recoverable impacts.
- Enemies fall, linger and fade before physical loot appears. Tom Pearl releases a unique collectible Core. Player death has a controlled camera fall before the overlay.
- Graphics presets change rendering, **not gameplay object generation**. Partial harvest state, edits, structures, torches and enemy state remain intact.
- Save **v4** keeps `wildwood-run-v2`, migrates v2/v3 resources/tools/legacy armor, preserves chest stacks and physical rewards, and stores a legacy backup.
- Run standalone item tests: `node --test tests/items.test.mjs`. Browser QA runners/results are linked in the report.

Keep [items.js](items.js) and [combat.js](combat.js) with the original game modules when serving the directory. New asset/license details: [MANIFEST.json](assets/MANIFEST.json).

---

## Historical v3 rework notes (superseded where noted above)

Smooth-terrain, first-person wilderness survival. The current rework keeps Tom Pearl, terrain streaming, natural color correction, weather, harvesting and modular camp construction.

## Play

The local Preview runs at http://127.0.0.1:8087/.

```bash
python -m http.server 8087 --bind 127.0.0.1
```

Serve the directory, rather than opening the HTML with `file://`. Keep `index.html`, `survival.js`, `art.js`, `assets/` and `vendor/` together. No package installation or third-party runtime model server is required.

## Controls

- WASD move; Shift sprint; Space jump / swim up; Ctrl swim down.
- Click captures the mouse; subsequent left clicks use the equipped item. E also uses/attacks.
- When capture is unavailable, hold right mouse and drag to look; E uses. V fills with the shovel without conflicting with drag look.
- **C** always opens field crafting, even beside a workbench.
- **E** interacting with a workbench opens its separate advanced workshop.
- **I** opens the pack: resources, soil, food, carried equipment and armor. Click an equipment entry to equip it.
- **Escape** closes the active overlay or pauses. Close buttons also restore play.
- Equipment: 1 fists; 2 club; 3 wood axe; 4 pick; 5 stone axe; 6 stone sword; 7 iron blade; 8 gold blade; **9 shovel**; **0 knife**; **minus torch**. Q / wheel cycle equipment.
- Shovel: left click / E scoops soil. **Right click while captured, or V**, fills one existing scoop using one soil. The ground ring previews the area.
- Torch: click / E places for 1 wood. Aim at its actual model and **X** recovers that specific torch and refunds 1 wood. Limit: eight; no automatic eviction.
- **B** construction / cancel placement; R rotate; wheel select pieces; click / E place.
- **X** dismantles aimed construction and returns half its materials plus chest contents.
- E door / chest / campfire: open-close / storage / cook-add wood.
- **F** eat, cooked meat first; **J** journal.
- **E** at marked survey-mine entrances descends; E beside the underground ladder climbs back out. Bring a torch.

## Gameplay and art

25 cached local model types replace the shared weapon head, primitive animals and repeated props. Distinct equipment models use grip-relative viewmodel pivots and attack profiles. Axes chop; picks mine rock **and ore**; blades specialize in combat; clubs stagger; knives strike quickly; only shovels excavate.

Animals have skeleton-aware clones, AI-driven animation, fleeing, hit feedback, meat drops and cleanup. Deer uses authored idle/walk/gallop/hit/death clips. The downloaded pig has idle/jump only; its walk/flee gait is added to the actual skeleton and its death rolls it onto its side.

Field crafting offers immediate survival equipment and a healing poultice. The two-column workshop offers improved axes, stone/iron/gold blades and permanent hide lining (25% damage reduction). Ingredients show owned/required counts, descriptions and disabled reasons; logic enforces station restrictions and prevents repeated ownership deductions.

Soil scoops are deterministic 0.24m smooth depressions of radius 1.65m, yielding one soil. Filling reverses existing scoops only; it cannot build above original terrain. Depth is capped at 2.4m with slope/reach/stamina safeguards. Water, trees/rocks, foundations, POIs, cave roofs and the player's footing are protected. Digging does not randomly award iron/gold: expose a vein and use the pickaxe. Terrain updates do not regenerate props or reset their HP.

New landscapes add restrained ridge, gully and plateau variation. Existing camps keep their old terrain generator. Mine portals make bounded underground chambers accessible without pretending a heightfield supports arbitrary tunnels. Camps include modelled bedrolls, barrels and claimable supply bundles. Husk hood/coats and crawler chitin improve their existing silhouettes. Enemies share scenery/building collision; this is collision resolution, not a full navigation mesh.

## Persistence

Save schema v3 retains the existing browser storage key (`wildwood-run-v2`) and safely migrates v2 saves. Resources, equipment, chest contents, structures, torch XYZ positions, all bounded terrain edits, harvested/mined locations, journals, day/weather and position are saved. Old torch slot 8 migrates to the new torch slot. Invalid resource values are sanitized; missing soil defaults to zero. Old base terrain stays unchanged.

Autosave: every 35 simulated seconds, tab hiding, crafting, terrain edits, torch changes and construction. Save Camp remains in the pause menu. Saves are local to the browser/origin, not cloud saves. Live enemy positions are not serialized.

## QA and limitations

See [REWORK-REPORT.md](REWORK-REPORT.md), [.freebuff/rework-qa-results.json](.freebuff/rework-qa-results.json) and [.freebuff/rework-polish-results.json](.freebuff/rework-polish-results.json).

Browser QA uses actual Edge/Chromium rendering, UI buttons/keys and the existing explicit `?qa=manual` test interface for reproducible gameplay setups. Software-rendered timings are not hardware FPS claims. No TypeScript project/typecheck or pre-existing test runner exists; Node syntax checks cover all game modules.

Survey entrances use a clear descend/climb transition, not seamless connected tunnels. Existing caves in old saves retain their original excavation access. Water retains the existing lowland surface representation; no fluid rewrite was attempted. Husks/crawlers are improved authored procedural models, not newly imported animated enemy rigs. Physical-device audio balance, hardware performance and extended multi-night balance remain unverified.

## Credits

[assets/CREDITS.md](assets/CREDITS.md) records each actual model, creator, source, local file, CC0 license and modifications. Three.js remains MIT. Tom Pearl is the retained user-provided custom model; no new license is claimed for it.
