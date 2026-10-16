package com.tompearl.client;

import com.tompearl.TomPearlMod;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.rendering.v1.EntityRendererRegistry;

/** Client entrypoint: registers Tom Pearl's renderer. */
public class TomPearlClient implements ClientModInitializer {

    @Override
    public void onInitializeClient() {
        EntityRendererRegistry.register(TomPearlMod.TOM_PEARL, TomPearlRenderer::new);
    }
}
