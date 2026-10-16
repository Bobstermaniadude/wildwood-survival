package com.tompearl.entity;

import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.ai.goal.MeleeAttackGoal;

/**
 * Melee attack goal that triggers Tom Pearl's baked attack animations.
 * The hit lands mid-clip (see {@link TomPearlEntity#startAttack}).
 */
public class TomAttackGoal extends MeleeAttackGoal {
    private final TomPearlEntity tom;

    public TomAttackGoal(TomPearlEntity mob) {
        super(mob, 1.25, true);
        this.tom = mob;
    }

    @Override
    protected void checkAndPerformAttack(LivingEntity target) {
        if (this.canPerformAttack(target)) {
            this.resetAttackCooldown();
            double dist = this.mob.distanceToSqr(target);
            byte anim;
            if (dist < 4.0 && this.mob.getRandom().nextFloat() < 0.45f) {
                anim = TomPearlEntity.ANIM_SLAM;
            } else {
                anim = this.mob.getRandom().nextBoolean()
                        ? TomPearlEntity.ANIM_SWIPE_L
                        : TomPearlEntity.ANIM_SWIPE_R;
            }
            tom.startAttack(anim);
        }
    }

    @Override
    protected double getAttackReachSqr(LivingEntity target) {
        // generous reach: his sweeps cover a wide arc
        return (double) (this.mob.getBbWidth() * 2.2f * this.mob.getBbWidth() * 2.2f)
                + target.getBbWidth();
    }
}
