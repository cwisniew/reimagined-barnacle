<template>
  <div id="app-container">
    <header class="app-header">
      <nav class="main-nav">
        <router-link to="/" class="nav-link">My Collection</router-link>
        <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
      </nav>
    </header>
    <main class="app-content">
      <router-view /> <!-- Router will render components here -->
    </main>
  </div>
</template>

<script setup lang="ts">
// No specific script needed here for just router-view and static nav
</script>

<style>
/* Global styles (can be moved to style.css or a dedicated file) */
body {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  background-color: #f4f4f4;
  margin:0;
  padding:0;
}

#app-container {
  max-width: 1200px;
  margin: 0 auto; /* Changed to 0 auto for header to span width if needed */
  padding: 0 20px 20px 20px; /* No top padding if header handles it */
}

.app-header {
  background-color: #34495e; /* Darker background for header */
  padding: 15px 30px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.main-nav {
  display: flex;
  gap: 20px;
  justify-content: center; /* Center nav links */
}

.nav-link {
  color: #ecf0f1; /* Light text for dark header */
  text-decoration: none;
  font-size: 1.1em;
  font-weight: 500;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.nav-link:hover {
  background-color: #4a6572; /* Slightly lighter on hover */
}

.router-link-exact-active { /* Active link styling */
  background-color: #2c3e50; /* Even darker for active */
  color: #fff;
  font-weight: bold;
}

.app-content {
  background-color: #fff; /* White background for the main content area */
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0,0,0,0.05);
}

/* Styles for page titles if not part of individual views */
/* h1 { text-align: center; color: #34495e; margin-bottom: 30px; } */
</style>
