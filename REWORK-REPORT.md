# Wildwood rework — delivery report

## 1. Actual integrated art

**25 cached local model types**: ten equipment models (carved club, two distinct axes, pickaxe, shovel, stone sword, iron blade, gold claymore, knife and torch), rigged deer/pig, textured pine, two other trees, log, two rocks, chest, workbench, campfire pit, bedroll, barrel and wood/stone supply bundles.

Kenney Survival Kit and Quaternius assets are **CC0 1.0**. Poly Haven textures remain **CC0**. The club is an original textured indexed GLB. Tom Pearl remains the user-provided custom model. Complete source/license/path/modification records: [assets/CREDITS.md](assets/CREDITS.md).

Art is intentionally stylized and muted, with cached palette remapping, rough hides/wood, neutral stone and aged metal—not photorealistic weapons surrounded by toy animals. Animal mesh UVs receive subtle neutral hide grain. GLTF material color-space handling, player-scale bounds, grip pivots, skeleton-aware cloning and model-independent saved state are implemented.

## 2. Gameplay/UI delivered

- Distinct weapon timing, reach, stamina, swing motion, impact SFX and harvest efficiency. Clubs stagger, knives thrust quickly, axes chop and pickaxes mine ore as well as rock.
- **C = field crafting**, always. **E = explicit workbench interaction** for the wider advanced workshop. Underlying recipe validation enforces the station/mode; repeated craft callbacks cannot purchase owned gear again.
- **I inventory**: authoritative resource quantities including soil, food, carried/equipped tools and armor; equipment buttons work. Overlays freeze simulation, suppress gameplay input and restore cursor/audio/input on exit.
- **Shovel digging/refill**: deterministic one-soil smooth scoops; right click / V consumes one soil and reverses an existing scoop. Reach, slope, stamina, depth, water, footing, prop, foundation, POI and cave-roof safeguards. Ground preview ring. No random precious-metal dig rewards.
- Terrain-only remeshing preserves prop object identity, HP, harvest state and colliders. Undug deterministic anchors prevent relocation on chunk reload. Shared derivative normals keep chunk edges consistent.
- **Targeted X torch recovery**: actual model ray intersection, 1-wood refund, light/list/scene cleanup, eight-torch rejection without automatic eviction or resource deduction. Distant torches release pooled lights.
- Versioned new ridge/gully/plateau variation, dressed survivor camps, modelled claimable bundles, survey mine portals/ladder transitions, chamber formations and exposed cave ore. The existing smooth terrain engine remains.
- Husk hood/coat and crawler chitin/mandibles improve retained procedural enemies. Player, hostile AI and animals share solid scenery collision. Barricade attacks still work after collision resolution.
- v3 saves migrate v2 resource defaults/torch slot, keep the old terrain generator for old camps, retain terrain edits instead of forgetting distant craters, preserve torch height and chest soil, and validate malformed quantities/scalars/lists. Saved cave positions do not eject players to the surface.

## 3. Bugs fixed during implementation/testing

- Field menu silently becoming a workbench near a station.
- Same hammer-like head reused for weapons; iron blade misclassified visually.
- Ore taking axe `chop` damage instead of pick `mine` damage.
- Unbounded/random-resource digging and terrain remesh regenerating scenery/harvest HP.
- Natural prop anchors changing after reloading edited chunks.
- Pine woody tips extending beyond foliage.
- Torch cap deleting unrelated old torches, no targeted removal, missing saved Y.
- Torch raycaster crashing on halo sprites; palette textures missing from downloaded GLBs.
- Distant torches exhausting cave light slots.
- Hostiles passing through POIs; collision preventing barricade damage.
- Cave crawler switching to surface height when the player climbed out.
- Inventory equip entries being rebuilt every paused frame, losing stable click targets.
- Inventory UI lacking the same opaque legibility/z-order as crafting.
- Resource/skeleton/material cleanup for animated animals, ore and chambers.
- Old browser-cached helper modules persisting after a refresh; v3 module URLs now invalidate those stale helpers.
- Downloaded torch flame exported below the grip; its actual mesh is now placed in the wrapped torch head before scale/pivot normalization.

## 4. Tests actually run

Final runs on **Edge/Chromium with real WebGL/Three.js**, through UI buttons/keys plus the existing explicit `?qa=manual` deterministic gameplay interface:

- **55/55 core checks passed**: new run; C crafting and exact costs; I inventory/pause; distinct local equipment; bench separation/gates; tree/rock harvest; pig/deer/husk/crawler combat dispatch; flee/death/drop/skeleton isolation; valid digging/refill; insufficient-soil rejection; bounded depletion; prop identity/HP; boundary remesh/chunk revisit; exact torch selection/refund/limit; cave descend/light/ore/climb; structure place/repeated-place/refund; SAVE → reload → CONTINUE; migrated/malformed saves; death/restart and SFX calls. [Raw results](.freebuff/rework-qa-results.json), [test runner](.freebuff/rework-qa.cjs).
- **19/19 polish checks passed**: native Playwright Escape for inventory/crafting (after pointer capture is released); pause/resume; WASD movement; fallback drag look; workshop layout; hostile wall/POI collision and barricade attacks; 60 repeated torch cycles conserving wood, scene children and lights; protected tree; pick/ore efficiency; cave save/reload; crawler underground height before/after player exits; representative timing and console checks. [Raw results](.freebuff/rework-polish-results.json), [runner](.freebuff/rework-polish-qa.cjs).
- **9/9 final integration checks passed** after a torch-flame position repair: actual flame above grip; retained Tom Pearl custom rig/mixer, blade damage dispatch and banishment rewards; deer supplied hit/gallop/death clips. [Results](.freebuff/final-integration-results.json), [runner](.freebuff/final-integration-check.cjs). Both core and polish suites were rerun after this repair.
- **No captured JavaScript/console errors or failed asset requests** in the final core run. No captured console errors in final polish run.
- Node syntax checks passed for the inline game module, [survival.js](survival.js) and [art.js](art.js). There is no TypeScript configuration or existing typecheck/test package in this static project.
- Bounds/material/clip/skeleton probe loaded models using the actual GLTFLoader. [Model probe](.freebuff/model-probe.cjs).
- Captured and visually inspected all ten equipment silhouettes, inventory, workshop and cave screenshots. [Visual review](.freebuff/visual-review.html), [world](.freebuff/rework-world.png), [inventory](.freebuff/rework-inventory.png), [workshop](.freebuff/rework-workbench.png), [cave](.freebuff/rework-cave.png).

**Measured medium preset** (1280×720, SwiftShader software renderer): simulation update ~0.61ms; single-chunk terrain remesh ~10.03ms; ~153 draw calls / 61,058 triangles in the measured scene. Render timing ~92.9ms in that run and varied substantially across software-rendered runs. This is **not** a hardware FPS benchmark or a claimed speedup.

Two polish runs stalled in headless Edge's native Escape/pointer-lock interaction. Releasing the actual pointer lock before the native Escape action resolved the harness stall; subsequent final checks passed. This is not claimed as a full physical-device input matrix.

## 5. Remaining limitations

- Stylized—not AAA photorealistic. Husks/crawlers remain improved original procedural meshes, not imported fully animated rigs.
- Pig source mirror has idle/jump only: actual rig gait and side-roll death are authored supplements. Deer has supplied walk/run/hit/death clips.
- Cave access is an explicit marked descend/climb transition, not seamless connected tunnels. Old saves retain their original cave access; their landscape is intentionally preserved.
- Existing lowland water geometry is retained. No shoreline triangulation/fluid rewrite or arbitrary flooding was introduced.
- Shared obstacle collision prevents penetration but does not provide strategic pathfinding around whole buildings.
- 2,000 terrain edits maximum; reaching the cap rejects further edits rather than silently losing older ones. Legacy huge craters can be filled gradually with collected soil; new digging cannot deepen them.
- Resource accounting/persistence, model rendering and synthesized audio calls were tested. Subjective audio mix, multi-night balance, physical hardware FPS, a long GPU-memory soak and cross-browser/device coverage remain unverified.
- Continue is local-browser storage, not cloud synchronization. Live enemy positions are deliberately not saved.

The healthy local server remains available at http://127.0.0.1:8087/ in the Preview panel. Nothing was deployed, committed or pushed.
