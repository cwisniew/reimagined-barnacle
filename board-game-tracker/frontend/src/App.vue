<template>
  <div id="app-container">
    <h1>Board Game Tracker</h1>
    <div class="layout-container">
      <div class="main-content">
        <AddBoardGameForm />
        <BoardGameList />
      </div>
      <aside class="sidebar">
        <BggSearch />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import BoardGameList from "./components/BoardGameList.vue";
import AddBoardGameForm from "./components/AddBoardGameForm.vue";
import BggSearch from "./components/BggSearch.vue"; // Import BGG Search
</script>

<style>
/* Basic global styles */
body {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background-color: #f4f4f4; /* Light gray background for the page */
  margin: 0;
  padding: 0;
}

#app-container {
  max-width: 1200px; /* Wider container for two columns */
  margin: 20px auto;
  padding: 20px;
  background-color: #fff; /* White background for the app itself */
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  border-radius: 8px;
}

h1 {
  text-align: center;
  color: #34495e;
  margin-bottom: 30px;
}

.layout-container {
  display: flex;
  flex-wrap: wrap; /* Allow wrapping on smaller screens */
  gap: 20px;
}

.main-content {
  flex: 2; /* Takes 2/3 of the space */
  min-width: 300px; /* Minimum width before wrapping */
}

.sidebar {
  flex: 1; /* Takes 1/3 of the space */
  min-width: 280px; /* Minimum width before wrapping */
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .layout-container {
    flex-direction: column;
  }
  .main-content, .sidebar {
    flex: none; /* Reset flex property */
    width: 100%; /* Full width on smaller screens */
  }
}
</style>
