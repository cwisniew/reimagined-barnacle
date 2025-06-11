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
/* Using CSS variables defined in App.vue's global style, with fallbacks */
.filter-controls {
  /* Background and padding are handled by .controls-area in App.vue */
  /* This component might not need its own distinct background if always inside .controls-area */
}

.filter-controls h4 {
  margin-top: 0;
  margin-bottom: 0.75rem; /* Consistent margin */
  font-size: 1.1rem; /* Adjusted size */
  color: var(--text-color, #212529);
  font-weight: 500;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.5rem; /* Consistent gap */
  align-items: flex-end; /* Align form elements nicely */
}

.filter-group {
  display: flex;
  flex-direction: column;
  flex-grow: 1; /* Allow groups to grow */
  min-width: 180px; /* Minimum width for filter groups */
}

.filter-group label {
  margin-bottom: 0.3rem;
  font-weight: 500;
  color: var(--text-muted-color, #6c757d);
  font-size: 0.85rem; /* Slightly smaller label */
}

.filter-group select,
.filter-group input[type="text"] {
  padding: 0.5rem 0.75rem; /* Standardized padding */
  border: 1px solid var(--border-color, #ced4da);
  border-radius: var(--border-radius, 0.3rem);
  font-size: 0.9rem; /* Standardized font size */
  background-color: #fff;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}
.filter-group select:focus,
.filter-group input[type="text"]:focus {
  border-color: var(--primary-color, #007bff);
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}
.filter-group select:disabled,
.filter-group input[type="text"]:disabled {
  background-color: #e9ecef; /* Disabled background */
  opacity: 0.7;
}

.reset-button {
    padding: 0.5rem 1rem; /* Consistent padding */
    background-color: var(--secondary-color, #6c757d);
    color: white;
    border: none;
    border-radius: var(--border-radius, 0.3rem);
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: background-color 0.2s ease;
    height: fit-content; /* Aligns with bottom of inputs if they have different heights */
    align-self: flex-end; /* Ensures it aligns with the bottom of other items in .filters */
}
.reset-button:hover:not(:disabled) {
    background-color: #545b62; /* Darken secondary */
}
.reset-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>
