<template>
  <div class="filter-controls">
    <h4>Filter Collection</h4>
    <div class="filters">
      <!-- Filter by Status -->
      <div class="filter-group">
        <label for="filter-status">Status:</label>
        <select id="filter-status" v-model="currentFilters.status" @change="emitFilters" :disabled="props.disabled">
          <option value="">All</option>
          <option value="Owned">Owned</option>
          <option value="Wishlist">Wishlist</option>
          <option value="Ordered">Ordered</option>
        </select>
      </div>

      <!-- Filter by Storage Location (Text input for now) -->
      <div class="filter-group">
        <label for="filter-location">Storage Location:</label>
        <input type="text" id="filter-location" v-model.lazy="currentFilters.storageLocation" @input="emitFiltersThrottled" placeholder="e.g., Shelf A" :disabled="props.disabled" />
      </div>
      
      <!-- Filter by Name (Text input) -->
      <div class="filter-group">
        <label for="filter-name">Name/Set #:</label>
        <input type="text" id="filter-name" v-model.lazy="currentFilters.name" @input="emitFiltersThrottled" placeholder="e.g., Falcon or 75192" :disabled="props.disabled" />
      </div>

      <button @click="resetFilters" class="reset-button" :disabled="props.disabled">Reset Filters</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, defineProps } from 'vue'; // Added defineProps
import type { LegoSet } from '../stores/legoStore';

// Define props
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
});

// Define the structure for filter values
export interface LegoFilters {
  status: LegoSet['status'] | ''; // Allow empty for 'All'
  storageLocation: string;
  name: string; // For searching by name or set number
}

const emit = defineEmits<{
  (e: 'filters-changed', filters: LegoFilters): void;
}>();

const initialFilters: LegoFilters = {
  status: '',
  storageLocation: '',
  name: '',
};

const currentFilters = reactive<LegoFilters>({ ...initialFilters });

const emitFilters = () => {
  emit('filters-changed', { ...currentFilters });
};

// Basic throttle for text inputs
let throttleTimeout: number | null = null;
const emitFiltersThrottled = () => {
    if (throttleTimeout) {
        clearTimeout(throttleTimeout);
    }
    throttleTimeout = window.setTimeout(() => {
        emitFilters();
    }, 300); // Emit after 300ms of no input
};

const resetFilters = () => {
  currentFilters.status = initialFilters.status;
  currentFilters.storageLocation = initialFilters.storageLocation;
  currentFilters.name = initialFilters.name;
  emitFilters(); // Emit immediately after reset
};

</script>

<style scoped>
.filter-controls {
  background-color: #f0f0f0;
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.filter-controls h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
}

.filters {
  display: flex;
  flex-wrap: wrap; /* Allow wrapping on smaller screens */
  gap: 20px; /* Spacing between filter groups */
  align-items: flex-end; /* Align items to the bottom for a cleaner look with varying heights */
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group label {
  margin-bottom: 5px;
  font-size: 0.9em;
  color: #555;
}

.filter-group select,
.filter-group input[type="text"] {
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.95em;
}

.reset-button {
    padding: 8px 15px;
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    height: fit-content; /* Align with bottom of inputs */
}
.reset-button:hover {
    background-color: #5a6268;
}
</style>
