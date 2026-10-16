package com.tompearl.mixin;

import com.tompearl.client.TomPearlFeature;
import net.minecraft.client.renderer.feature.FeatureRenderDispatcher;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Shadow;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

import java.util.Map;

/**
 * Registers {@link TomPearlFeature} in the feature renderer map.
 *
 * This is the documented 26.2 pattern for custom features: inject into the
 * tail of the {@link FeatureRenderDispatcher} constructor and put your
 * FeatureRendererType -> FeatureRenderer entry (see the 26.1.x -> 26.2
 * migration primer, "Feature Rendering: The Takeover").
 */
@Mixin(FeatureRenderDispatcher.class)
public class FeatureDispatcherMixin {

    @Shadow
    @Final
    private Map<?, ?> featureRenderers;

    @Inject(method = "<init>", at = @At("TAIL"))
    private void tompearl$register(CallbackInfo ci) {
        @SuppressWarnings("unchecked")
        Map<Object, Object> renderers = (Map<Object, Object>) featureRenderers;
        renderers.put(TomPearlFeature.TYPE, new TomPearlFeature());
    }
}
