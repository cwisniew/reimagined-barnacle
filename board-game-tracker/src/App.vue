<template>
  <div id="app">
    <header>
      <h1>Board Game Tracker</h1>
    </header>
    <main>
      <BoardGameForm @add-game="handleAddGame" />
      <BoardGameList :games="games" />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import BoardGameForm from './components/BoardGameForm.vue';
import BoardGameList from './components/BoardGameList.vue';

const STORAGE_KEY = 'boardGamesData';

const games = ref([]); // Array of game objects

// Load games from local storage when the component is mounted
onMounted(() => {
  const storedGames = localStorage.getItem(STORAGE_KEY);
  if (storedGames) {
    try {
      games.value = JSON.parse(storedGames);
      console.log('Games loaded from local storage:', games.value);
    } catch (error) {
      console.error('Error parsing games from local storage:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }
});

// Watch for changes in the games array and save to local storage
watch(
  games,
  (newGames) => {
    console.log('Games changed, saving to local storage:', newGames);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newGames));
  },
  { deep: true }
);

function handleAddGame(newGame) {
  games.value.push(newGame);
}
</script>

<style>
/* Global Resets and Base Styles */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0; /* Basic reset for margins */
  padding: 0; /* Basic reset for paddings */
}

html {
  line-height: 1.5; /* Improved text readability */
  -webkit-font-smoothing: antialiased; /* Smooth fonts on webkit */
  -moz-osx-font-smoothing: grayscale; /* Smooth fonts on firefox */
}

body {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  background-color: #f4f4f8; /* Slightly off-white background for the body */
}

#app {
  max-width: 960px;
  margin: 40px auto; /* Adjusted top margin */
  padding: 20px;
  background-color: #fff; /* White background for the app container */
  border-radius: 8px; /* Rounded corners for the app container */
  box-shadow: 0 2px 15px rgba(0,0,0,0.1); /* Subtle shadow for depth */
}

header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px; /* Added padding */
  border-bottom: 1px solid #eee; /* Separator for header */
}

header h1 {
  color: #2c3e50;
  font-weight: 600; /* Slightly bolder h1 */
}
</style>
