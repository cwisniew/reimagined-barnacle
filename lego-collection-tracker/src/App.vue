<template>
  <div id="app-container">
    <header>
      <h1>Lego Collection Tracker</h1>
    </header>

    <!-- Global Error Display -->
    <div v-if="legoStore.state.error" class="global-error-message">
      <p>Error: {{ legoStore.state.error }} <button @click="clearError">Dismiss</button></p>
    </div>

    <main>
      <!-- Global Loading Indicator for Initial Load -->
      <div v-if="legoStore.state.loading && initialLoadInProgress" class="global-loading-indicator">
        <p>Loading collection...</p>
      </div>

      <div v-show="!initialLoadInProgress"> <!-- Hide controls and list while initial load is happening if desired -->
        <div class="controls-area" :disabled="legoStore.state.loading">
          <button @click="openAddSetForm" class="add-new-button" :disabled="legoStore.state.loading">Add New Lego Set</button>
          <FilterControls @filters-changed="applyFilters" :disabled="legoStore.state.loading" />
        </div>

        <LegoSetList
          :sets="filteredLegoSets"
          :is-loading="legoStore.state.loading && legoStore.state.legoSets.length === 0" 
          :error-message="legoStore.state.error && legoStore.state.legoSets.length === 0 ? legoStore.state.error : ''"
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
import { ref, computed } from 'vue';
import LegoSetList from './components/LegoSetList.vue';
import FilterControls, { type LegoFilters } from './components/FilterControls.vue';
import AddEditLegoSetForm from './components/AddEditLegoSetForm.vue';
import legoStore, { type LegoSet } from './stores/legoStore';

// --- State for Form Modal ---
const showSetForm = ref(false);
const setBeingEdited = ref<LegoSet | null>(null);

const openAddSetForm = () => {
  setBeingEdited.value = null; // Ensure it's for adding, not editing
  showSetForm.value = true;
};

const openEditSetForm = (setId: number) => {
  const set = legoStore.getSetById(setId);
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
  const allSets = legoStore.getAllSets(); // Assuming this returns all sets reactively
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
  return legoStore.state.loading && legoStore.state.legoSets.length === 0;
});

const clearError = () => {
  legoStore.state.error = null; // Simple way to clear error, store could have a dedicated action
};

</script>

<style>
.global-error-message {
  background-color: #f8d7da; /* Light red */
  color: #721c24; /* Dark red */
  padding: 10px 20px;
  text-align: center;
  border-bottom: 1px solid #f5c6cb;
}
.global-error-message button {
  margin-left: 15px;
  padding: 3px 8px;
  background-color: #721c24;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.global-loading-indicator {
  text-align: center;
  padding: 30px;
  font-size: 1.2em;
  color: #007bff;
}
/* Consider disabling interactions on controls if needed */
.controls-area[disabled] {
    pointer-events: none;
    opacity: 0.7;
}

/* Global styles (or move to main.css/index.css) */
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  margin: 0;
  background-color: #eef2f5;
  color: #333;
}

#app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

header {
  background-color: #007bff; /* Primary blue */
  color: white;
  padding: 15px 30px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

header h1 {
  margin: 0;
  font-size: 1.8em;
}

main {
  flex-grow: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto; /* Center main content */
  width: 100%;
  box-sizing: border-box;
}

.controls-area {
  margin-bottom: 25px;
  padding: 15px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.add-new-button {
    background-color: #28a745; /* Green */
    color: white;
    padding: 10px 15px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
    margin-bottom: 15px; /* Space before filter controls */
    display: block; /* Make it block to take full width or add margin auto */
    width: fit-content;
}
.add-new-button:hover {
    background-color: #218838;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* Ensure it's on top */
}

.modal-content {
  background-color: #fff; /* Form has its own background, but good for container */
  padding: 0; /* Form itself has padding */
  border-radius: 8px; /* Form has its own border-radius */
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  width: auto; /* Let the form define its width up to its max-width */
  max-height: 90vh; /* Max height for the modal content area */
  overflow-y: auto; /* Allow scrolling within the modal if content is too tall */
}

footer {
  text-align: center;
  padding: 15px;
  background-color: #343a40; /* Dark gray/black */
  color: #f8f9fa; /* Light text */
  font-size: 0.9em;
}
</style>
