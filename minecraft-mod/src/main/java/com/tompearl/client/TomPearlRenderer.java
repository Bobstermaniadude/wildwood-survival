package com.tompearl.client;

import com.mojang.blaze3d.vertex.PoseStack;
import com.tompearl.TomPearlMod;
import com.tompearl.entity.TomPearlEntity;
import net.minecraft.client.renderer.RenderType;
import net.minecraft.client.renderer.entity.EntityRenderer;
import net.minecraft.client.renderer.entity.EntityRendererProvider;
import net.minecraft.client.renderer.entity.state.EntityRenderState;
import net.minecraft.client.renderer.texture.OverlayTexture;
import net.minecraft.resources.ResourceLocation;
import org.joml.Quaternionf;

/**
 * Entity renderer for Tom Pearl.
 *
 * Translates the synced animation state (see {@link TomPearlEntity#setAnimation})
 * into baked clip playback and submits a {@link TomPearlSubmit} node to the 26.2
 * feature pipeline. The model hovers 0.5 above the ground and bobs, matching the
 * "no legs, upper body only" design.
 */
public class TomPearlRenderer extends EntityRenderer<TomPearlEntity, TomPearlRenderState> {

    private static final ResourceLocation TEXTURE = TomPearlMod.id("textures/entity/tom_pearl.png");
    private static final int[] CLIP_BY_ANIM = {
            2, // ANIM_IDLE   -> idle
            0, // ANIM_WALK   -> walk
            1, // ANIM_RUN    -> run
            3, // ANIM_SLAM   -> attack_slam
            4, // ANIM_SWIPE_L-> attack_swipe_l
            5, // ANIM_SWIPE_R-> attack_swipe_r
            6, // ANIM_STUN   -> stun
    };

    private TomPearlModelData model;

    public TomPearlRenderer(EntityRendererProvider.Context context) {
        super(context);
    }

    private TomPearlModelData model() {
        if (model == null) {
            model = TomPearlModelData.load(null);
        }
        return model;
    }

    @Override
    public TomPearlRenderState createRenderState() {
        return new TomPearlRenderState();
    }

    @Override
    public void updateRenderState(TomPearlEntity entity, TomPearlRenderState state, float partialTick) {
        super.updateRenderState(entity, state, partialTick);
        byte anim = entity.getAnimation();
        state.clip = CLIP_BY_ANIM[Math.min(Math.max(anim, 0), CLIP_BY_ANIM.length - 1)];
        state.animTime = (entity.tickCount - entity.getAnimStartTick() + partialTick) / 20f;
        state.hoverBob = entity.getHoverOffset(partialTick);
    }

    @Override
    public void render(TomPearlRenderState state, PoseStack poseStack, net.minecraft.client.renderer.SubmitNodeCollector collector) {
        poseStack.pushPose();
        // float above the ground and bob gently
        float bob = (float) Math.sin(state.animTime * 2.1) * 0.08f;
        poseStack.translate(0, state.hoverBob + bob, 0);
        poseStack.mulPose(new Quaternionf().rotateY((float) Math.toRadians(-state.yRot)));

        collector.submit(new TomPearlSubmit(
                poseStack.last(),
                RenderType.entityTranslucent(TEXTURE),
                model(),
                state.clip,
                state.animTime,
                OverlayTexture.NO_OVERLAY,
                state.lightCoords
        ));
        poseStack.popPose();
    }

    @Override
    public ResourceLocation getTextureLocation(EntityRenderState state) {
        return TEXTURE;
    }
}
