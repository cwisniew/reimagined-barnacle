<template>
  <div class="game-list">
    <h2>Board Games</h2>
    <button @click="store.fetchGames()" :disabled="store.loading" v-if="!store.games.length && !store.loading && !store.error">
      Refresh Games
    </button>
    <div v-if="store.loading">Loading games...</div>
    <div v-else-if="store.error" class="error">Error fetching games: {{ store.error }}</div>
    <ul v-else-if="store.games.length > 0">
      <li v-for="game in store.games" :key="game.id">
        <h3>{{ game.name }}</h3>
        <p v-if="game.version" class="version">Version: {{ game.version }}</p>
        <p>{{ game.description }}</p>
      </li>
    </ul>
    <p v-else>No games available. Try adding one or fetching!</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useBoardGameStore } from "../stores/boardGameStore";

const store = useBoardGameStore();

onMounted(() => {
  // Only fetch if games arent already loaded (e.g. by HMR or previous navigation)
  if (store.games.length === 0) {
    store.fetchGames();
  }
});
</script>

<style scoped>
.game-list {
  margin-bottom: 20px;
}
.error {
  color: red;
}
li {
  list-style: none;
  border: 1px solid #eee;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
  background-color: #fff;
}
h3 {
  margin-top: 0;
}
.version {
  font-style: italic;
  font-size: 0.9em;
  color: #555;
}
button {
  margin-bottom: 10px;
  padding: 8px 12px;
  cursor: pointer;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 3px;
}
button:disabled {
  background-color: #aaa;
}
</style>
