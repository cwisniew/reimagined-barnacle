<template>
  <div class="bgg-search">
    <h3>Search BoardGameGeek</h3>
    <div class="search-form">
      <input type="text" v-model="searchQuery" placeholder="Enter game name" @keyup.enter="performSearch" />
      <button @click="performSearch" :disabled="isLoading">
        {{ isLoading ? 'Searching...' : 'Search BGG' }}
      </button>
    </div>
    <div v-if="isLoading" class="loading">Loading results...</div>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <ul v-if="searchResults.length > 0" class="search-results">
      <li v-for="game in searchResults" :key="game.id" @click="selectGame(game)" class="result-item">
        {{ game.name }} ({{ game.yearPublished }})
      </li>
    </ul>
    <div v-if="!isLoading && searchResults.length === 0 && attemptedSearch" class="no-results">
      No results found for "{{ previousSearchQuery }}".
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const searchQuery = ref('');
const previousSearchQuery = ref(''); // To display in "no results" message
const searchResults = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');
const attemptedSearch = ref(false); // To only show "no results" after a search

const emit = defineEmits(['bgg-game-selected']);

async function performSearch() {
  if (!searchQuery.value.trim()) {
    errorMessage.value = 'Please enter a game name to search.';
    return;
  }
  isLoading.value = true;
  attemptedSearch.value = true;
  previousSearchQuery.value = searchQuery.value;
  errorMessage.value = '';
  searchResults.value = [];

  const searchUrl = `/api/bgg/search?type=boardgame&query=${encodeURIComponent(searchQuery.value)}`;

  try {
    const response = await axios.get(searchUrl);

    // Handle BGG's 202 Accepted response (queued search)
    if (response.status === 202) {
        errorMessage.value = 'BGG is processing the search. Please try again in a few moments.';
        isLoading.value = false;
        return;
    }

    if (response.status !== 200) {
        throw new Error(`BGG API returned status ${response.status}`);
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response.data, "text/xml");
    const items = xmlDoc.getElementsByTagName("item");

    const games = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const id = item.getAttribute("id");
      const nameElement = item.querySelector("name[type='primary']");
      const yearPublishedElement = item.querySelector("yearpublished");

      if (id && nameElement && nameElement.getAttribute("value")) {
        games.push({
          id: id,
          name: nameElement.getAttribute("value"),
          yearPublished: yearPublishedElement ? yearPublishedElement.getAttribute("value") : 'N/A',
        });
      }
    }
    searchResults.value = games;
    if (games.length === 0) {
      // No technical error, but no games found for the query
      // errorMessage.value = `No results found for "${searchQuery.value}".`; // Or use the dedicated no-results div
    }

  } catch (error) {
    console.error("Error searching BGG:", error);
    if (error.message.includes('Network Error')) {
        errorMessage.value = 'Network Error. Could not connect to the BGG API via the proxy. Ensure the development server is running correctly.';
    } else if (error.response) {
        // If error.response exists, it means the server (proxy or BGG) responded with an error status
        // The proxy should ideally return a 5xx if it can't reach BGG, or BGG's actual error.
        errorMessage.value = `Error from BGG API: ${error.response.statusText} (Status: ${error.response.status})`;
    } else {
        errorMessage.value = `Error searching BGG: ${error.message}`;
    }
  } finally {
    isLoading.value = false;
  }
}

function selectGame(game) {
  emit('bgg-game-selected', {
    bggId: game.id,
    name: game.name,
    yearPublished: game.yearPublished
  });
}
</script>

<style scoped>
.bgg-search {
  border: 1px solid #ccc;
  padding: 1rem;
  margin-top: 1rem;
  border-radius: 4px;
  background-color: #f9f9f9;
}
.search-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.search-form input[type="text"] {
  flex-grow: 1;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.loading, .error-message, .no-results {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 4px;
}
.loading {
  background-color: #e0e0e0;
}
.error-message {
  background-color: #ffdddd;
  border: 1px solid #ffaaaa;
  color: #d8000c;
}
.no-results {
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  color: #856404;
}
.search-results {
  list-style-type: none;
  padding: 0;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #eee;
}
.result-item {
  padding: 0.5rem;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}
.result-item:last-child {
  border-bottom: none;
}
.result-item:hover {
  background-color: #e9e9e9;
}
</style>
