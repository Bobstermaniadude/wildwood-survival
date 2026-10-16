package com.tompearl.entity;

import com.tompearl.TomPearlMod;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.network.chat.Component;
import net.minecraft.network.syncher.EntityDataAccessor;
import net.minecraft.network.syncher.EntityDataSerializers;
import net.minecraft.network.syncher.SynchedEntityData;
import net.minecraft.server.level.ServerBossEvent;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.sounds.SoundSource;
import net.minecraft.tags.DamageTypeTags;
import net.minecraft.world.BossEvent;
import net.minecraft.world.damagesource.DamageSource;
import net.minecraft.world.entity.*;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.ai.goal.*;
import net.minecraft.world.entity.ai.goal.target.HurtByTargetGoal;
import net.minecraft.world.entity.ai.goal.target.NearestAttackableTargetGoal;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.level.Level;

/**
 * Tom Pearl — floating gilded upper-body boss.
 *
 * Stats: 40 hearts (80 HP), 10 hearts (20) melee damage, heavy armor and
 * toughness, knockback immune, fire/lava/fall immune. Attack animations are
 * baked clips (attack_slam / attack_swipe_l / attack_swipe_r) synced to
 * clients through entity data.
 */
public class TomPearlEntity extends Monster {

    /** Baked animation ids (must match the clip order in tom_pearl.bin). */
    public static final byte ANIM_IDLE = 0;
    public static final byte ANIM_WALK = 1;
    public static final byte ANIM_RUN = 2;
    public static final byte ANIM_SLAM = 3;
    public static final byte ANIM_SWIPE_L = 4;
    public static final byte ANIM_SWIPE_R = 5;
    public static final byte ANIM_STUN = 6;

    private static final EntityDataAccessor<Byte> ANIMATION =
            SynchedEntityData.defineId(TomPearlEntity.class, EntityDataSerializers.BYTE);
    private static final EntityDataAccessor<Integer> ANIM_START =
            SynchedEntityData.defineId(TomPearlEntity.class, EntityDataSerializers.INT);

    private final ServerBossEvent bossEvent = new ServerBossEvent(
            Component.literal("TOM PEARL \u2014 THE GILDED MAN"),
            BossEvent.BossBarColor.YELLOW, BossEvent.BossBarOverlay.NOTCHED_10);

    /** Server-side attack sequencing. */
    private int attackCooldown;
    private int attackWindup;      // ticks until the hit lands
    private byte pendingAttack;
    private int animLock;          // ticks during which movement is slowed

    public TomPearlEntity(EntityType<? extends Monster> type, Level level) {
        super(type, level);
        this.xpReward = 500;
    }

    public static AttributeSupplier.Builder createAttributes() {
        return Monster.createMonsterAttributes()
                // 40 hearts
                .add(Attributes.MAX_HEALTH, 80.0)
                // 10 hearts of damage per hit
                .add(Attributes.ATTACK_DAMAGE, 20.0)
                .add(Attributes.ATTACK_KNOCKBACK, 1.5)
                .add(Attributes.FOLLOW_RANGE, 128.0)
                .add(Attributes.MOVEMENT_SPEED, 0.34)
                .add(Attributes.FLYING_SPEED, 0.34)
                // very hard to kill
                .add(Attributes.ARMOR, 20.0)
                .add(Attributes.ARMOR_TOUGHNESS, 10.0)
                .add(Attributes.KNOCKBACK_RESISTANCE, 1.0);
    }

    @Override
    protected void defineSynchedData(SynchedEntityData.Builder builder) {
        super.defineSynchedData(builder);
        builder.define(ANIMATION, ANIM_IDLE);
        builder.define(ANIM_START, 0);
    }

    @Override
    protected void registerGoals() {
        this.goalSelector.addGoal(0, new FloatGoal(this));
        this.goalSelector.addGoal(1, new TomAttackGoal(this));
        this.goalSelector.addGoal(2, new LookAtPlayerGoal(this, Player.class, 24.0f));
        this.goalSelector.addGoal(3, new RandomLookAroundGoal(this));
        this.targetSelector.addGoal(1, new HurtByTargetGoal(this));
        this.targetSelector.addGoal(2, new NearestAttackableTargetGoal<>(this, Player.class, true));
    }

    // ------------------------------------------------------------- combat

    @Override
    public boolean doHurtTarget(Entity target) {
        boolean did = super.doHurtTarget(target);
        if (did && target instanceof LivingEntity living) {
            living.knockback(1.2, this.getX() - living.getX(), this.getZ() - living.getZ());
            this.level().playSound(null, this.blockPosition(),
                    SoundEvents.PLAYER_ATTACK_SWEEP, SoundSource.HOSTILE, 1.0f, 0.6f);
        }
        return did;
    }

    @Override
    public boolean hurt(DamageSource source, float amount) {
        // very hard to kill: arrows and projectiles deal half damage
        if (source.is(DamageTypeTags.IS_PROJECTILE)) {
            amount *= 0.5f;
        }
        boolean did = super.hurt(source, amount);
        if (did && source.getEntity() instanceof LivingEntity) {
            setAnimation(ANIM_STUN);
        }
        return did;
    }

    @Override
    public boolean isInvulnerableTo(DamageSource source) {
        return source.is(DamageTypeTags.IS_FALL)
                || source.is(DamageTypeTags.IS_FIRE)
                || source == this.damageSources().lava()
                || super.isInvulnerableTo(source);
    }

    @Override
    public void die(DamageSource source) {
        super.die(source);
        if (!this.level().isClientSide && this.level() instanceof ServerLevel server) {
            server.sendParticles(ParticleTypes.TOTEM_OF_UNDYING,
                    this.getX(), this.getY() + 1.2, this.getZ(), 120, 0.8, 1.2, 0.8, 0.2);
            this.level().playSound(null, this.blockPosition(),
                    SoundEvents.TOTEM_USE, SoundSource.HOSTILE, 1.0f, 0.7f);
            if (source.getEntity() instanceof Player player) {
                player.sendSystemMessage(Component.literal("\u00a76The Gilded Man falls. The night is yours."));
            }
        }
    }

    // ------------------------------------------------------------- animation

    public void setAnimation(byte anim) {
        this.entityData.set(ANIMATION, anim);
        this.entityData.set(ANIM_START, this.tickCount);
    }

    public byte getAnimation() {
        return this.entityData.get(ANIMATION);
    }

    public int getAnimStartTick() {
        return this.entityData.get(ANIM_START);
    }

    // ------------------------------------------------------------- ticking

    @Override
    public void aiStep() {
        super.aiStep();
        if (!this.level().isClientSide) {
            this.bossEvent.setProgress(this.getHealth() / this.getMaxHealth());

            if (attackCooldown > 0) attackCooldown--;
            if (animLock > 0) animLock--;
            if (attackWindup > 0 && --attackWindup == 0) {
                landAttack();
            }

            // pick a locomotion animation when free to move
            if (animLock <= 0 && attackWindup <= 0) {
                LivingEntity target = getTarget();
                boolean moving = target != null && this.getDeltaMovement().horizontalDistanceSqr() > 1.0e-4;
                byte want = moving ? (distanceToSqr(target) < 400 ? ANIM_RUN : ANIM_WALK) : ANIM_IDLE;
                if (getAnimation() != want && getAnimation() != ANIM_STUN) {
                    setAnimation(want);
                }
            }
        }
    }

    private void landAttack() {
        LivingEntity target = getTarget();
        if (target != null && this.distanceTo(target) < 3.6f && this.hasLineOfSight(target)) {
            this.doHurtTarget(target);
        }
        this.level().playSound(null, this.blockPosition(),
                SoundEvents.IRON_GOLEM_ATTACK, SoundSource.HOSTILE, 1.0f, 0.8f);
    }

    /** Starts one of the three attack animations; the hit lands mid-clip. */
    public void startAttack(byte anim) {
        pendingAttack = anim;
        attackWindup = anim == ANIM_SLAM ? 14 : 9;
        animLock = anim == ANIM_SLAM ? 22 : 16;
        attackCooldown = anim == ANIM_SLAM ? 34 : 22;
        setAnimation(anim);
    }

    // ------------------------------------------------------------- boss bar

    @Override
    public void startSeenByPlayer(ServerPlayer player) {
        super.startSeenByPlayer(player);
        this.bossEvent.addPlayer(player);
    }

    @Override
    public void stopSeenByPlayer(ServerPlayer player) {
        super.stopSeenByPlayer(player);
        this.bossEvent.removePlayer(player);
    }

    // ------------------------------------------------------------- misc

    @Override
    public void checkDespawn() {
        // a boss does not despawn
    }

    @Override
    public boolean removeWhenFarAway(double distance) {
        return false;
    }

    @Override
    public boolean shouldDropExperience() {
        return true;
    }

    /** Visual float: the model is an upper body, so it hovers above the ground. */
    public float getHoverOffset(float partialTick) {
        return 0.5f;
    }
}
