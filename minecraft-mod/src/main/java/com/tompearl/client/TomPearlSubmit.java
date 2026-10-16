package com.tompearl.client;

import com.mojang.blaze3d.vertex.PoseStack;
import net.minecraft.client.renderer.RenderType;

/**
 * Submit node for one Tom Pearl mesh draw in the 26.2 feature-render pipeline.
 *
 * The entity renderer produces these; {@link TomPearlFeature} consumes them in
 * buildGroup and writes the CPU-skinned vertices through the RenderType's
 * VertexConsumer (the 26.2 replacement for MultiBufferSource).
 */
public record TomPearlSubmit(
        PoseStack.Pose pose,
        RenderType renderType,
        TomPearlModelData model,
        int clip,
        float animTime,
        int overlay,
        int light
) {
}
