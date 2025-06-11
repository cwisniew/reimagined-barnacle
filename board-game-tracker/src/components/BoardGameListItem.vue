<template>
  <li class="game-list-item">
    <div class="item-header">
      <h3>{{ game.name }}</h3>
      <p v-if="game.manualLink" class="manual-link">
        <a :href="game.manualLink" target="_blank" rel="noopener noreferrer" class="btn btn-small btn-manual">View Manual</a>
      </p>
    </div>

    <p v-if="game.storageLocation" class="storage-location">
      <strong>Stored:</strong> {{ game.storageLocation }}
    </p>

    <div v-if="game.cards && game.cards.length > 0" class="details-section">
      <h4>Cards Information</h4>
      <ul class="info-list">
        <li v-for="(card, index) in game.cards" :key="`card-${game.id}-${index}`">
          <span class="card-count">{{ card.count || 0 }}x</span>
          <span class="card-type">{{ card.type || 'N/A' }}</span>
          <span class="card-sleeved">({{ card.sleeved ? 'Sleeved' : 'Not Sleeved' }})</span>
        </li>
      </ul>
    </div>

    <div v-if="game.expansions && game.expansions.length > 0 && game.expansions.some(e => e.trim() !== '')" class="details-section">
      <h4>Expansions Owned</h4>
      <ul class="info-list expansion-list">
        <li v-for="(expansion, index) in game.expansions.filter(e => e.trim() !== '')" :key="`expansion-${game.id}-${index}`">
          {{ expansion }}
        </li>
      </ul>
    </div>
  </li>
</template>

<script setup>
import { defineProps } from 'vue';

defineProps({
  game: {
    type: Object,
    required: true
  }
});
</script>

<style scoped>
.game-list-item {
  background-color: #fff; /* White background for items */
  border: 1px solid #e0e0e0; /* Match list container border */
  padding: 20px;
  border-radius: 6px; /* Slightly smaller radius than container */
  /* margin-bottom is handled by gap in BoardGameList.vue if using grid */
  list-style-type: none;
  transition: box-shadow 0.2s ease-in-out;
}

.game-list-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1); /* Subtle hover effect */
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.item-header h3 {
  margin: 0;
  color: #2c3e50; /* Darker, primary color */
  font-size: 1.4em;
  font-weight: 600;
}

.storage-location {
  font-size: 0.95em;
  color: #555;
  margin-bottom: 15px;
}
.storage-location strong {
  color: #333;
}

.details-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0; /* Lighter separator for internal sections */
}

.details-section:first-of-type { /* If storage location is absent, first details section might need this */
   /* border-top: none;
   padding-top: 0;
   margin-top: 0; */
}


.details-section h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.1em;
  color: #42b983; /* Vue green for section titles */
  font-weight: 600;
}

.info-list {
  list-style-type: none; /* Remove default bullets */
  padding-left: 0; /* Remove default padding */
  margin: 0;
}

.info-list li {
  font-size: 0.9em;
  color: #454545;
  padding: 6px 0; /* Vertical padding for list items */
  display: flex; /* For card details alignment */
  align-items: center;
  gap: 8px; /* Space between card detail spans */
  border-bottom: 1px dotted #eee; /* Dotted separator for items */
}

.info-list li:last-child {
  border-bottom: none; /* No border for the last item */
}

.card-count {
  font-weight: bold;
  min-width: 30px; /* Ensure alignment */
  display: inline-block;
}
.card-type {
  flex-grow: 1;
}
.card-sleeved {
  font-style: italic;
  font-size: 0.9em;
  color: #777;
}

.expansion-list li {
  padding-left: 10px; /* Indent expansion names slightly */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2342b983' class='bi bi-arrow-right-short' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: left center;
  background-size: 12px 12px;
}


.manual-link {
  margin: 0; /* Reset margin as it's part of flex container */
}

.btn { /* General button styling, can be moved to App.vue if used globally */
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  text-decoration: none; /* For <a> tags styled as buttons */
  display: inline-block; /* For <a> tags */
  text-align: center;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.btn-small {
  padding: 0.3rem 0.6rem;
  font-size: 0.8em;
}

.btn-manual {
  background-color: #6c757d; /* Greyish color */
  color: white;
}
.btn-manual:hover {
  background-color: #5a6268;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>
