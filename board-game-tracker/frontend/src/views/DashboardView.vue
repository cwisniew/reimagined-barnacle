<template>
  <div class="dashboard-view">
    <h1>Collection Dashboard</h1>

    <div v-if="boardGameStore.loading && loadingGames" class="loading-indicator">Loading statistics...</div>
    <div v-else-if="boardGameStore.error" class="error-message">Error loading data: {{ boardGameStore.error }}</div>
    <div v-else-if="boardGameStore.games.length === 0" class="no-data-message">
      No games in your collection yet to display stats. <router-link to="/">Add some games!</router-link>
    </div>

    <div v-else class="dashboard-grid">
      <div class="stat-card">
        <h2>Total Base Games</h2>
        <p class="stat-value">{{ totalBaseGamesCount }}</p>
      </div>
      <div class="stat-card">
        <h2>Total Expansions</h2>
        <p class="stat-value">{{ totalExpansionsCount }}</p>
      </div>
      <div class="stat-card">
        <h2>Total Play Sessions</h2>
        <p class="stat-value">{{ totalPlaySessionsCount }}</p>
      </div>

      <div class="stat-list-card">
        <h3>Games by Status</h3>
        <ul v-if="statusCounts.length > 0">
          <li v-for="statusItem in statusCounts" :key="statusItem.statusName">
            {{ statusItem.statusName }}: <strong>{{ statusItem.count }}</strong>
          </li>
        </ul>
        <p v-else>No games with status information.</p>
      </div>

      <div class="stat-list-card">
        <h3>Most Played Games (Top 3)</h3>
        <ul v-if="mostPlayedGames.length > 0">
          <li v-for="game in mostPlayedGames" :key="game.id">
            <router-link :to="{ name: 'GameDetail', params: { id: game.id } }">{{ game.name }}</router-link>
            ({{ game.playCount }} plays)
          </li>
        </ul>
        <p v-else>No play sessions logged yet.</p>
      </div>

      <div class="stat-list-card">
        <h3>Highest BGG Rated (Top 3)</h3>
        <ul v-if="highestRatedBggGames.length > 0">
          <li v-for="game in highestRatedBggGames" :key="game.id">
            <router-link :to="{ name: 'GameDetail', params: { id: game.id } }">{{ game.name }}</router-link>
            (⭐ {{ game.bggRating?.toFixed(1) }})
          </li>
        </ul>
        <p v-else>No games with BGG ratings.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useBoardGameStore } from "../stores/boardGameStore";
import type { BoardGame } from "../types";

const boardGameStore = useBoardGameStore();
const loadingGames = ref(false);

onMounted(async () => {
  if (boardGameStore.games.length === 0 && !boardGameStore.loading) {
    loadingGames.value = true;
    await boardGameStore.fetchGames();
    loadingGames.value = false;
  }
});

const totalBaseGamesCount = computed(() => {
  return boardGameStore.games.filter(game => !game.isExpansion).length;
});

const totalExpansionsCount = computed(() => {
  return boardGameStore.games.filter(game => game.isExpansion === true).length;
});

const statusCounts = computed(() => {
  const counts: Record<string, number> = {};
  boardGameStore.games.forEach(game => {
    if (game.status) {
      counts[game.status] = (counts[game.status] || 0) + 1;
    } else {
      counts["N/A"] = (counts["N/A"] || 0) + 1;
    }
  });
  return Object.entries(counts)
    .map(([statusName, count]) => ({ statusName, count }))
    .sort((a,b) => b.count - a.count);
});

const totalPlaySessionsCount = computed(() => {
  return boardGameStore.games.reduce((total, game) => total + (game.plays?.length || 0), 0);
});

const mostPlayedGames = computed(() => {
  return [...boardGameStore.games]
    .map(game => ({
      id: game.id,
      name: game.name,
      playCount: game.plays?.length || 0,
    }))
    .filter(game => game.playCount > 0)
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 3);
});

const highestRatedBggGames = computed(() => {
  return [...boardGameStore.games]
    .filter(game => typeof game.bggRating === "number")
    .sort((a, b) => (b.bggRating || 0) - (a.bggRating || 0))
    .slice(0, 3)
    .map(game => ({
      id: game.id,
      name: game.name,
      bggRating: game.bggRating,
    }));
});

</script>

<style scoped>
.dashboard-view { padding: 20px; max-width: 1000px; margin: auto; }
.dashboard-view h1 { text-align: center; margin-bottom: 30px; color: #333; }
.loading-indicator, .error-message, .no-data-message { text-align: center; padding: 20px; font-size: 1.1em; }
.no-data-message a { color: #007bff; text-decoration: underline; }

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.stat-card, .stat-list-card {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.stat-card h2 {
  font-size: 1.1em;
  color: #555;
  margin-top: 0;
  margin-bottom: 10px;
  text-align: center;
}
.stat-card .stat-value {
  font-size: 2.5em;
  font-weight: bold;
  color: #007bff;
  text-align: center;
  margin: 0;
}

.stat-list-card h3 {
  font-size: 1.2em;
  color: #333;
  margin-top: 0;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}
.stat-list-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.stat-list-card li {
  padding: 6px 0;
  font-size: 0.95em;
  border-bottom: 1px solid #f5f5f5;
}
.stat-list-card li:last-child {
  border-bottom: none;
}
.stat-list-card li a {
  text-decoration: none;
  color: #0056b3;
}
.stat-list-card li a:hover {
  text-decoration: underline;
}
.stat-list-card p {
  font-size: 0.95em;
  color: #777;
}
</style>
