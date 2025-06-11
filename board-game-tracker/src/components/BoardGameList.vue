<template>
  <div class="board-game-list-container">
    <div v-if="!games || games.length === 0" class="no-games-message">
      <p>No board games added yet.</p>
      <p>Use the form above to add your first game!</p>
    </div>
    <ul v-else class="game-list">
      <BoardGameListItem v-for="game in games" :key="game.id" :game="game" />
    </ul>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import BoardGameListItem from './BoardGameListItem.vue';

defineProps({
  games: {
    type: Array,
    required: true
  }
});
</script>

<style scoped>
.board-game-list-container {
  margin-top: 30px; /* Increased margin from form */
  padding: 20px;
  background-color: #fdfdfd; /* Slightly off-white, if #app is white */
  border: 1px solid #e0e0e0; /* Softer border */
  border-radius: 8px;
}

.no-games-message {
  text-align: center;
  color: #666; /* Slightly darker text */
  font-size: 1.1em;
  padding: 30px 20px; /* More padding */
  border: 2px dashed #d0d0d0; /* More prominent dash */
  border-radius: 8px;
  background-color: #f9f9f9;
}

.no-games-message p {
  margin-bottom: 0.5rem;
}

.no-games-message p:last-child {
  margin-bottom: 0;
}

.game-list {
  list-style-type: none; /* Ensure no bullets if not already handled by reset */
  padding: 0;
  margin: 0;
  display: grid; /* Using grid for layout */
  gap: 20px; /* Spacing between items */
  /* For a single column list, grid is not strictly necessary but can be useful for future multi-column layouts */
  /* If you want a strict single column, you might not need grid here, just let items flow */
}
</style>
