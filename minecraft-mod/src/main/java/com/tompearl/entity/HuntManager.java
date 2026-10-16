package com.tompearl.entity;

import com.tompearl.TomPearlMod;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;
import net.minecraft.core.BlockPos;
import net.minecraft.network.chat.Component;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.saveddata.SavedData;

import java.util.HashMap;
import java.util.Map;

/**
 * Hunts the player with Tom Pearl every 10 in-game nights.
 *
 * An in-game day is 24000 ticks; night begins at 13000. The night index is
 * floor((gameTime + 11000) / 24000). On the first night whose index is a
 * multiple of 10, Tom Pearl spawns ~40 blocks from each player in the
 * Overworld and hunts them until killed. Progress persists in level saved data.
 */
public final class HuntManager {
    private static final int NIGHT_LENGTH = 24000;
    private static final int NIGHT_START = 13000;
    private static final int EVERY_N_NIGHTS = 10;

    private HuntManager() {}

    public static void register() {
        ServerTickEvents.END_SERVER_TICK.register(HuntManager::tick);
    }

    private static void tick(MinecraftServer server) {
        ServerLevel level = server.overworld();
        long time = level.getGameTime();
        long nightIndex = (time + (NIGHT_LENGTH - NIGHT_START)) / NIGHT_LENGTH;
        long dayTime = time % NIGHT_LENGTH;

        HuntData data = HuntData.get(level);
        // only trigger shortly after dusk, once per hunt night
        if (dayTime < NIGHT_START || dayTime > NIGHT_START + 100) return;
        if (nightIndex % EVERY_N_NIGHTS != 0) return;
        if (data.lastHuntNight == nightIndex) return;
        data.lastHuntNight = nightIndex;
        data.setDirty();

        for (ServerPlayer player : level.players()) {
            if (player.isSpectator()) continue;
            spawnHunt(level, player);
        }
        level.getServer().getPlayerList().broadcastSystemMessage(
                Component.literal("\u00a76\u00a7lThe Gilded Man walks again. \u00a7r\u00a76Every tenth night... this night."));
    }

    private static void spawnHunt(ServerLevel level, ServerPlayer player) {
        // spawn ~40 blocks away, on the surface
        double angle = level.getRandom().nextDouble() * Math.PI * 2;
        int x = (int) (player.getX() + Math.cos(angle) * 40);
        int z = (int) (player.getZ() + Math.sin(angle) * 40);
        int y = level.getHeightmapPos(
                net.minecraft.world.level.levelgen.Heightmap.Types.MOTION_BLOCKING_NO_LEAVES,
                BlockPos.containing(x, 0, z)).getY();

        TomPearlEntity tom = TomPearlMod.TOM_PEARL.create(level);
        if (tom == null) return;
        tom.setPos(x + 0.5, y, z + 0.5);
        tom.setTarget(player);
        tom.setPersistenceRequired();
        tom.setCustomName(Component.literal("Tom Pearl"));
        tom.setCustomNameVisible(true);
        level.addFreshEntity(tom);

        level.playSound(null, BlockPos.containing(player.position()),
                SoundEvents.ELDER_GUARDIAN_CURSE, SoundSource.HOSTILE, 1.0f, 0.55f);
        player.sendSystemMessage(Component.literal("\u00a76\u00a7l\u2726 \u00a7r\u00a76Something gilded is hunting you tonight."));
    }

    /** Per-world hunt progress. */
    static final class HuntData extends SavedData {
        long lastHuntNight = -1;
        private static final Factory<HuntData> FACTORY =
                new Factory<>(HuntData::new, HuntData::load, null);

        static HuntData get(ServerLevel level) {
            return level.getDataStorage().computeIfAbsent(FACTORY, "tompearl_hunt");
        }

        static HuntData load(net.minecraft.nbt.CompoundTag tag, net.minecraft.nbt.Tag ignored) {
            HuntData d = new HuntData();
            d.lastHuntNight = tag.getLong("lastHuntNight");
            return d;
        }

        @Override
        public net.minecraft.nbt.CompoundTag save(net.minecraft.nbt.CompoundTag tag, net.minecraft.core.HolderLookup.Provider registries) {
            tag.putLong("lastHuntNight", lastHuntNight);
            return tag;
        }
    }
}
