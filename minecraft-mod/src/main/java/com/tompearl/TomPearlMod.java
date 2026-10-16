package com.tompearl;

import com.tompearl.entity.HuntManager;
import com.tompearl.entity.TomPearlEntity;
import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.object.builder.v1.entity.FabricDefaultAttributeRegistry;
import net.minecraft.core.Registry;
import net.minecraft.core.registries.Registries;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.MobCategory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Tom Pearl — The Gilded Man.
 *
 * A floating, upper-body-only gilded boss with 40 hearts (80 HP) that deals
 * 10 hearts (20 HP) of damage, hunts the player every 10 in-game nights,
 * and is very hard to kill. Model and rig baked from model-rigged.glb.
 */
public class TomPearlMod implements ModInitializer {
    public static final String MOD_ID = "tompearl";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    public static EntityType<TomPearlEntity> TOM_PEARL;

    public static ResourceLocation id(String path) {
        return ResourceLocation.fromNamespaceAndPath(MOD_ID, path);
    }

    @Override
    public void onInitialize() {
        TOM_PEARL = Registry.register(
                Registries.ENTITY_TYPE,
                id("tom_pearl"),
                EntityType.Builder.of(TomPearlEntity::new, MobCategory.MONSTER)
                        .sized(1.6f, 2.4f)
                        .eyeHeight(2.1f)
                        .clientTrackingRange(12)
                        .updateInterval(2)
                        .fireImmune()
                        .build("tom_pearl"));

        FabricDefaultAttributeRegistry.register(TOM_PEARL, TomPearlEntity.createAttributes());
        HuntManager.register();
        LOGGER.info("Tom Pearl — The Gilded Man is watching.");
    }
}
