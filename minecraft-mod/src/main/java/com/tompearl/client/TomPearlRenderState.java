package com.tompearl.client;

import net.minecraft.client.renderer.entity.state.EntityRenderState;

/** Render state for Tom Pearl: which baked clip to play and where in it. */
public class TomPearlRenderState extends EntityRenderState {
    public int clip;
    public float animTime;
    public float hoverBob;
}
