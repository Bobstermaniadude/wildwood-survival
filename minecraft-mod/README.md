# Tom Pearl — The Gilded Man (Minecraft 26.2, Fabric)

The Tom Pearl boss from the game, ported to Minecraft **Java Edition 26.2** as a
Fabric mod. Uses the **same rigged `model-rigged.glb` model** — mesh, skeleton
and the `walk_relaxed` run cycle — baked into a runtime format, plus
synthesized attack animations on the same rig.

## What the boss does

| | |
|---|---|
| Health | **40 hearts** (80 HP) + 20 armor, 10 toughness |
| Damage | **10 hearts** (20 HP) per hit, heavy knockback |
| Defense | Takes half damage from projectiles; immune to fire, lava, fall |
| Hunts | **Every 10 in-game nights**, at dusk he spawns ~40 blocks away and hunts you until killed |
| Boss bar | Golden notched boss bar: "TOM PEARL — THE GILDED MAN" |
| Animations | `walk`, `run` (arms pump faster when chasing), `idle`, `attack_slam`, `attack_swipe_l`, `attack_swipe_r`, `stun` |
| Design | Upper-body only — he **floats** above the ground with a hover bob |

## Folder layout

```
minecraft-mod/
├── build.gradle / settings.gradle / gradle.properties   Fabric Loom 1.17, Gradle 9.5.1
├── tools/gltf_bake.py         bakes ../model-rigged.glb → runtime model + texture
└── src/main/
    ├── resources/
    │   ├── fabric.mod.json
    │   ├── tompearl.mixins.json
    │   └── assets/tompearl/
    │       ├── models/tom_pearl.bin          baked mesh + 52 bones + 7 clips
    │       └── textures/entity/tom_pearl.png base color from the GLB
    └── java/com/tompearl/
        ├── TomPearlMod.java            entity registration
        ├── entity/TomPearlEntity.java  boss stats, AI, attack sequencing
        ├── entity/TomAttackGoal.java   attack animation triggers
        ├── entity/HuntManager.java     the every-10-nights hunt (persists per world)
        ├── client/TomPearlModelData.java  mesh loader + CPU skinning + clip player
        ├── client/TomPearlRenderer.java   entity renderer → submits draw nodes
        ├── client/TomPearlSubmit.java     26.2 submit node
        ├── client/TomPearlFeature.java    26.2 feature renderer (uploads skinned verts)
        ├── client/TomPearlClient.java     client entrypoint
        └── mixin/FeatureDispatcherMixin.java  registers the feature renderer
```

## Build

Requires **JDK 21** and internet (Loom downloads Minecraft + mappings).

```bash
cd minecraft-mod
# if the gradle wrapper jar is missing: gradle wrapper --gradle-version 9.5.1
./gradlew build          # Windows: gradlew.bat build
```

The mod jar lands in `build/libs/tompearl-1.0.0.jar`. To play:

1. Install **Fabric Loader 0.19.3+** for Minecraft 26.2.
2. Drop the jar and **Fabric API** (26.2 build) into `mods/`.
3. Create a world, sleep/advance to a 10th night (night 10, 20, 30 …) — at dusk
   the hunt begins. `/summon tompearl:tom_pearl` also works to fight him early.

Re-baking the model (after changing the GLB):

```bash
python tools/gltf_bake.py
```

## 26.2 API notes (read before first build)

This was written against the **26.1.x → 26.2 migration primer** (feature-render
takeover, `RenderTypeFeatureRenderer`, `SubmitNodeCollector`) and has **not
been compiled here** — no Minecraft toolchain was available in this workspace.
Most of the mod (entity, AI, hunt scheduler, model loading/skinning) uses
long-stable APIs. These three call sites track brand-new 26.2 surface area and
may need small signature fixes on first compile:

1. `TomPearlRenderer#render` — the entity-renderer submission entry
   (`SubmitNodeCollector#submit` and the `render` signature).
2. `TomPearlFeature#buildGroup` — `getVertexBuilder(RenderType)` and the
   `VertexConsumer` builder chain names.
3. `FeatureDispatcherMixin` — the `featureRenderers` field name in
   `FeatureRenderDispatcher` (the primer shows this exact injection point).

The primer's code samples line up with the usage in these files; if Loom
reports a renamed method, the fix is a one-liner in one of those files.

## Tuning

Everything is in plain constants:

* `TomPearlEntity#createAttributes` — hearts, damage, armor, speed.
* `HuntManager` — `EVERY_N_NIGHTS` (10), spawn distance (40), dusk window.
* `tools/gltf_bake.py` — `TARGET_HEIGHT` (2.6 blocks), synthesized attack
  keyframes (make the swings bigger/longer here!), clip names/order (the
  `CLIP_BY_ANIM` table in `TomPearlRenderer` must match).
