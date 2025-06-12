<template>
  <div class="game-detail-view" v-if="game">
    <div class="detail-header"><h1>{{ game.name }}</h1> <!-- ... actions ... --></div>
    <!-- ... (other detail sections: status, BGG info, tags, location, crowdfunding, links, card sets, plays) ... -->

    <section class="detail-section" v-if="game.bggVideoLinks && game.bggVideoLinks.length > 0">
      <h3>BGG Video Links</h3>
      <ul class="links-list">
        <li v-for="(video, index) in game.bggVideoLinks" :key="`bggvid-${index}`">
          <a :href="video.url" target="_blank" rel="noopener noreferrer">{{ video.title }}</a>
          <span v-if="video.language"> ({{ video.language }})</span>
          <span v-if="video.uploader"> - by {{ video.uploader }}</span>
          <span v-if="video.postDate"> ({{ formatDate(video.postDate) }})</span>
        </li>
      </ul>
    </section>

    <section class="detail-section" v-if="game.bggReimplementations && game.bggReimplementations.length > 0">
      <h3>Reimplementations (BGG)</h3> <!-- ... (same as before) ... -->
    </section>
    <!-- ... (other sections) ... -->
  </div>
  <div v-else-if="loading"><p>Loading...</p></div> <div v-else><p>Not found.</p></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue"; /* ... */
import type { BoardGame } from "../types"; /* ... */
const game = ref<BoardGame | null>(null); const loading = ref(false); /* ... */
async function fetchGame(id: string) { /* ... */ }
onMounted(()=>fetchGame(useRoute().params.id as string));
const formatDate = (ds?:string) => { if(!ds) return ""; const date = new Date(ds); return isNaN(date.getTime()) ? ds : date.toLocaleDateString(); };
// ... (other functions: goBack, editThisGame, confirmDeleteThisGame, statusClass, etc.)
</script>

<style scoped>
/* ... (existing styles) ... */
.links-list { list-style:disc; margin-left:20px; padding:0; }
.links-list li { margin-bottom: 5px; }
.links-list li a { text-decoration:underline; color:#007bff; }
.links-list li span { font-size: 0.85em; color: #555; }
</style>
