<template>
  <div id="app-container">
    <header>
      <h1>Lego Collection Tracker</h1>
    </header>

    <!-- Global Error Display -->
    <transition name="fade">
      <div v-if="legoSetStore.error" class="global-error-message global-message"> <!-- Added base class -->
        <p>Error: {{ legoSetStore.error }} <button @click="clearError">Dismiss</button></p>
      </div>
    </transition>

    <main class="container"> <!-- Added container class -->
      <!-- Global Loading Indicator for Initial Load -->
      <transition name="fade">
        <div v-if="legoSetStore.loading && initialLoadInProgress" class="global-loading-indicator global-message"> <!-- Added base class -->
          <p>Loading collection...</p>
        </div>
      </transition>

      <div v-show="!initialLoadInProgress"> <!-- Hide controls and list while initial load is happening if desired -->
        <div class="controls-area" :disabled="legoSetStore.loading">
          <button @click="openAddSetForm" class="add-new-button" :disabled="legoSetStore.loading">Add New Lego Set</button>
          <FilterControls @filters-changed="applyFilters" :disabled="legoSetStore.loading" />
        </div>

        <LegoSetList
          :sets="filteredLegoSets"
          :is-loading="legoSetStore.loading && legoSetStore.legoSets.length === 0"
          :error-message="legoSetStore.error && legoSetStore.legoSets.length === 0 ? legoSetStore.error : ''"
          @edit-set="openEditSetForm"
        />
      </div>

      <!-- Form Modal -->
      <div v-if="showSetForm" class="modal-overlay" @click.self="closeSetForm">
        <AddEditLegoSetForm
          :editing-set="setBeingEdited"
          @submit-success="handleFormSuccess"
          @cancel="closeSetForm"
          class="modal-content"
        />
      </div>
    </main>
    <footer>
      <p>&copy; {{ new Date().getFullYear() }} Lego Collection Tracker</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'; // Added onMounted
import LegoSetList from './components/LegoSetList.vue';
import FilterControls, { type LegoFilters } from './components/FilterControls.vue';
import AddEditLegoSetForm from './components/AddEditLegoSetForm.vue';
import { useLegoSetStore } from './stores/legoStore'; // NEW
import type { LegoSet } from './stores/legoStore'; // Type still useful

const legoSetStore = useLegoSetStore(); // NEW

const setBeingEdited = ref<LegoSet | null>(null);

onMounted(() => { // NEW
  legoSetStore.fetchAllSets();
});

const openAddSetForm = () => {
  setBeingEdited.value = null; // Ensure it's for adding, not editing
  showSetForm.value = true;
};

const openEditSetForm = (setId: number) => {
  const set = legoSetStore.getSetById(setId); // NEW - using Pinia getter
  if (set) {
    setBeingEdited.value = { ...set }; // Pass a copy to avoid direct mutation if store returns readonly
    showSetForm.value = true;
  } else {
    console.error("Set not found for editing:", setId);
  }
};

const closeSetForm = () => {
  showSetForm.value = false;
  setBeingEdited.value = null;
};

const handleFormSuccess = () => {
  closeSetForm();
  // Optionally, could show a success message
};

// --- Filtering Logic ---
const activeFilters = ref<LegoFilters | null>(null);

const applyFilters = (filters: LegoFilters) => {
  activeFilters.value = filters;
};

const filteredLegoSets = computed(() => {
  const allSets = legoSetStore.getAllSets; // NEW - Pinia getter
  if (!activeFilters.value) {
    return allSets;
  }

  const { status, storageLocation, name } = activeFilters.value;

  return allSets.filter(set => {
    const statusMatch = status ? set.status === status : true;
    const locationMatch = storageLocation ? (set.storageLocation || '').toLowerCase().includes(storageLocation.toLowerCase()) : true;
    const nameMatch = name ?
                        (set.name.toLowerCase().includes(name.toLowerCase()) ||
                         set.setNumber.toLowerCase().includes(name.toLowerCase()))
                       : true;
    return statusMatch && locationMatch && nameMatch;
  });
});

// --- Make LegoSetList take a prop for sets ---
// This requires modifying LegoSetList.vue to accept `sets` as a prop
// instead of directly accessing `legoStore.state.legoSets`.
// This change makes App.vue responsible for passing the (potentially filtered) list.
// The subtask for LegoSetList.vue will need to be updated or a new one created.
// For now, this App.vue assumes LegoSetList is ready for this.
// Let's proceed with this structure for App.vue and then adjust LegoSetList.vue.

// Computed property to determine if initial load might be in progress
const initialLoadInProgress = computed(() => {
  return legoSetStore.loading && legoSetStore.legoSets.length === 0;
});

const clearError = () => {
  legoSetStore.error = null; // Pinia allows direct mutation of state from components (though actions are preferred for complex logic)
};

</script>

<style>
/* CSS Variables for theming */
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --warning-color: #ffc107;
  --info-color: #17a2b8;
  --light-color: #f8f9fa;
  --dark-color: #343a40;
  --background-color: #f4f7f9; /* Slightly lighter background */
  --text-color: #212529; /* Darker text for better contrast */
  --text-muted-color: #6c757d;
  --border-color: #dee2e6;
  --border-radius: 0.3rem; /* Consistent border radius */
  --box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  --font-family-sans-serif: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Global styles */
body {
  font-family: var(--font-family-sans-serif);
  margin: 0;
  background-color: var(--background-color);
  color: var(--text-color);
  line-height: 1.6;
}

#app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

header {
  background-color: var(--primary-color);
  color: var(--light-color);
  padding: 1rem 1.5rem;
  text-align: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1); /* Slightly more pronounced shadow */
}

header h1 {
  margin: 0;
  font-size: 1.75rem; /* Slightly adjusted size */
  font-weight: 500;
}

main.container { /* Apply to main element with class container */
  flex-grow: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem; /* Consistent padding */
  width: 100%;
  box-sizing: border-box;
}

/* Global messages styling */
.global-message {
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem; /* Space below the message */
  border: 1px solid transparent;
  border-radius: var(--border-radius);
  text-align: center;
  opacity: 1;
  transition: opacity 0.3s ease-in-out;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.global-error-message {
  background-color: #f8d7da;
  color: var(--danger-color);
  border-color: #f5c6cb;
}

.global-error-message button {
  margin-left: 1rem;
  padding: 0.25rem 0.75rem;
  background-color: var(--danger-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.global-error-message button:hover {
  background-color: #c82333; /* Darken danger color */
}

.global-loading-indicator {
  padding: 2rem; /* More padding for loading indicator */
  font-size: 1.25rem;
  color: var(--primary-color);
}

/* Controls area styling */
.controls-area {
  margin-bottom: 1.5rem;
  padding: 1.25rem; /* Increased padding */
  background-color: #fff;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  transition: opacity 0.3s ease;
}

.controls-area[disabled] {
    pointer-events: none;
    opacity: 0.6; /* Clearer disabled state */
}

.add-new-button {
    background-color: var(--success-color);
    color: white;
    padding: 0.6rem 1rem;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 1rem;
    display: inline-block; /* More flexible than block */
    transition: background-color 0.2s ease, box-shadow 0.2s ease;
}
.add-new-button:hover:not(:disabled) {
    background-color: #218838; /* Darken success color */
    box-shadow: 0 0.125rem 0.5rem rgba(0,0,0,0.1);
}
.add-new-button:disabled {
  background-color: var(--secondary-color);
  opacity: 0.7;
  cursor: not-allowed;
}

/* Modal styles refinement */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.55); /* Slightly darker overlay */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050; /* Ensure it's above other content */
  padding: 1rem;
}

.modal-content {
  background-color: #fff;
  padding: 0; /* Form component should handle its internal padding */
  border-radius: var(--border-radius);
  box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.15); /* More defined shadow */
  width: auto;
  max-width: 700px; /* Ensure form is not too wide */
  max-height: 90vh;
  overflow-y: auto;
}

footer {
  text-align: center;
  padding: 1.25rem; /* Increased padding */
  background-color: var(--dark-color);
  color: var(--light-color);
  font-size: 0.9rem;
  margin-top: auto; /* Ensures footer is at the bottom of viewport if content is short */
}
</style>
