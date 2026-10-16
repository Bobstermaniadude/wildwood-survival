package com.tompearl.client;

import com.mojang.blaze3d.vertex.VertexConsumer;
import net.minecraft.client.renderer.RenderType;
import net.minecraft.client.renderer.feature.FeatureFrameContext;
import net.minecraft.client.renderer.feature.FeatureRenderer;
import net.minecraft.client.renderer.feature.FeatureRendererType;
import net.minecraft.client.renderer.feature.RenderTypeFeatureRenderer;

import java.util.List;

/**
 * Feature renderer for the baked Tom Pearl mesh.
 *
 * 26.2 replaced MultiBufferSource with the feature pipeline: entity renderers
 * submit {@link TomPearlSubmit} nodes, and this renderer stages and draws them.
 * See "Feature Rendering: The Takeover" in the 26.1.x -> 26.2 migration primer.
 */
public class TomPearlFeature extends RenderTypeFeatureRenderer<TomPearlSubmit> {

    public static final FeatureRendererType<TomPearlSubmit> TYPE =
            FeatureRenderer.type("tompearl:tom_pearl");

    @Override
    protected void buildGroup(FeatureFrameContext context, List<TomPearlSubmit> submits) {
        for (TomPearlSubmit submit : submits) {
            TomPearlModelData model = submit.model();
            float[] p = model.skin(submit.clip(), submit.animTime());
            float[] n = model.getSkinnedNormal();
            VertexConsumer buf = this.getVertexBuilder(submit.renderType());
            var pose = submit.pose();

            int[] idx = model.indices;
            for (int i = 0; i < idx.length; i += 3) {
                for (int c = 0; c < 3; c++) {
                    int v = idx[i + c];
                    buf.addVertex(pose, p[v * 3], p[v * 3 + 1], p[v * 3 + 2])
                       .setColor(0xFFFFFFFF)
                       .setUv(model.uv[v * 2], model.uv[v * 2 + 1])
                       .setOverlay(submit.overlay())
                       .setLight(submit.light())
                       .setNormal(pose, n[v * 3], n[v * 3 + 1], n[v * 3 + 2]);
                }
            }
        }
    }
}
