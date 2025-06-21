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

    <section class="detail-section" v-if="game.attachments && game.attachments.length > 0">
      <h3>Game Attachments</h3>
      <ul class="links-list attachments-display-list">
        <li v-for="attachment in game.attachments" :key="attachment.id" class="attachment-display-item">
          <a :href="attachment.fileUrl" target="_blank" rel="noopener noreferrer">
            <strong>{{ attachment.title }}</strong> ({{ attachment.originalName }})
          </a>
          <span class="file-type">[{{ attachment.fileType || 'unknown' }}]</span>
          <p v-if="attachment.notes" class="attachment-notes">Notes: {{ attachment.notes }}</p>
          <p class="attachment-date">Uploaded: {{ formatDate(attachment.uploadedAt) }}</p>
        </li>
      </ul>
    </section>

    <!-- ... (other sections) ... -->
  </div>
  <div v-else-if="loading"><p>Loading...</p></div> <div v-else><p>Not found.</p></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue"; /* ... */
import type { BoardGame, GameAttachment } from "../types"; /* ... */
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

.attachments-display-list .attachment-display-item {
  background-color: #f9f9f9;
  border: 1px solid #eee;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 4px;
}
.attachments-display-list .attachment-display-item strong {
  font-weight: bold;
}
.attachments-display-list .file-type {
  margin-left: 8px;
  font-style: italic;
}
.attachments-display-list .attachment-notes,
.attachments-display-list .attachment-date {
  font-size: 0.9em;
  color: #333;
  margin-top: 4px;
  margin-bottom: 2px;
}
</style>
