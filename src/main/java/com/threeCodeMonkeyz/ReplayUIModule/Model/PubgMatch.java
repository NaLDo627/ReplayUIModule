package com.threeCodeMonkeyz.ReplayUIModule.Model;

import java.util.List;

public class PubgMatch {
    private String id;
    private String shardId;
    private String gameMode;
    private String playedAt;
    private String mapName;
    private int durationSeconds;
    private String telemetryUrl;
    private List<PubgPlayer> players;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getShardId() {
        return shardId;
    }

    public void setShardId(String shardId) {
        this.shardId = shardId;
    }

    public String getGameMode() {
        return gameMode;
    }

    public void setGameMode(String gameMode) {
        this.gameMode = gameMode;
    }

    public String getPlayedAt() {
        return playedAt;
    }

    public void setPlayedAt(String playedAt) {
        this.playedAt = playedAt;
    }

    public String getMapName() {
        return mapName;
    }

    public void setMapName(String mapName) {
        this.mapName = mapName;
    }

    public int getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(int durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public String getTelemetryUrl() {
        return telemetryUrl;
    }

    public void setTelemetryUrl(String telemetryUrl) {
        this.telemetryUrl = telemetryUrl;
    }

    public List<PubgPlayer> getPlayers() {
        return players;
    }

    public void setPlayers(List<PubgPlayer> players) {
        this.players = players;
    }
}
