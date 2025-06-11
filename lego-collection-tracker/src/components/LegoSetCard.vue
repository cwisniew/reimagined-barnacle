<template>
  <div class="lego-set-card">
    <h3>{{ set.name }} ({{ set.setNumber }})</h3>
    <div v-if="set.pictures && set.pictures.length > 0" class="pictures">
      <img v-for="(picUrl, index) in set.pictures" :key="index" :src="picUrl" :alt="`${set.name} picture ${index + 1}`" class="lego-set-image">
    </div>
    <p v-else class="no-picture">No pictures available</p>

    <p><strong>Description:</strong> {{ set.description || 'N/A' }}</p>
    <p><strong>Pieces:</strong> {{ set.numberOfPieces }}</p>
    <p><strong>Minifigures:</strong> {{ set.numberOfMinifigs }}</p>
    <p><strong>Quantity Owned:</strong> {{ set.quantityOwned }}</p>
    <p><strong>Stored In:</strong> {{ set.storageLocation || 'N/A' }}</p>
    <p><strong>Status:</strong> <span :class="`status-${set.status.toLowerCase()}`">{{ set.status }}</span></p>
    <p><strong>Built:</strong> {{ set.isBuilt ? 'Yes' : 'No' }}</p>

    <!-- Basic actions - will be implemented later -->
    <div class="actions">
      <button @click="editSet">Edit</button>
      <button @click="deleteSet" :disabled="isDeleting">
        {{ isDeleting ? 'Deleting...' : 'Delete' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, type PropType, ref } from 'vue'; // Added ref
import type { LegoSet } from '../stores/legoStore';
import { useLegoSetStore } from '../stores/legoStore'; // NEW

const legoSetStore = useLegoSetStore(); // NEW

// Define the props this component accepts
const props = defineProps({
  set: {
    type: Object as PropType<LegoSet>,
    required: true
    // No default needed here if required is true and always provided.
    // If a default is desired for some reason, it must match the LegoSet structure.
  }
});

// Define emits for actions
// Type safety for emitted events can be added like this:
const emit = defineEmits<{
  (e: 'edit-set', id: number): void;
  // Delete event is re-emitted by LegoSetList, but actual deletion is handled here now
  // (e: 'delete-set', id: number): void; // This might be removed if App.vue doesn't need it directly
}>();

const isDeleting = ref(false); // Local loading state for delete

function editSet() {
  // props.set should be guaranteed by `required: true`
  emit('edit-set', props.set!.id);
}

async function deleteSet() {
  if (!props.set || props.set.id === undefined) return; // Guard

  // Confirmation is good, keep it.
  if (confirm(`Are you sure you want to delete "${props.set.name}"? This action cannot be undone.`)) {
    isDeleting.value = true;
    try {
      const success = await legoSetStore.deleteSet(props.set.id); // NEW
      if (!success) {
        // Error message is in legoSetStore.error
        alert(`Failed to delete set: ${legoSetStore.error || 'Unknown error'}`); // NEW
      }
      // No need to emit 'delete-set' upwards if card handles deletion directly with store
      // and list reacts to store changes. If App.vue needs to know for other reasons, it can be emitted.
    } catch (error: any) {
      console.error('Error during deleteSet in LegoSetCard:', error);
      alert(`An error occurred while deleting the set: ${error.message || 'Unknown error'}`);
    } finally {
      isDeleting.value = false;
    }
  }
}
</script>

<style scoped>
.lego-set-card {
  background-color: #fff;
  border: 1px solid var(--border-color, #dee2e6); /* Use CSS var with fallback */
  border-radius: var(--border-radius, 0.3rem);
  padding: 1rem; /* Consistent padding */
  margin-bottom: 1rem; /* Consistent margin */
  box-shadow: var(--box-shadow, 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075));
  display: flex;
  flex-direction: column;
}

.lego-set-card h3 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  font-size: 1.25rem; /* Slightly larger */
  color: var(--text-color, #212529);
  font-weight: 500;
}

.pictures {
  display: flex;
  gap: 0.5rem; /* Reduced gap */
  margin-bottom: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem; /* Space for scrollbar */
}

.lego-set-image {
  width: 120px; /* Fixed width */
  height: 120px; /* Fixed height */
  object-fit: cover; /* Ensure image covers the area, might crop */
  border-radius: var(--border-radius, 0.3rem);
  border: 1px solid var(--border-color, #dee2e6);
  background-color: #f0f0f0; /* Placeholder color */
}

.no-picture {
  font-style: italic;
  color: var(--text-muted-color, #6c757d);
  margin-bottom: 0.75rem;
  text-align: center;
  padding: 2rem 0; /* More space if no picture */
  background-color: #f9f9f9;
  border-radius: var(--border-radius, 0.3rem);
}

.lego-set-card p {
  margin: 0.3rem 0; /* Reduced margin */
  color: var(--text-muted-color, #555); /* Softer text color */
  font-size: 0.9rem; /* Slightly smaller for details */
}

.lego-set-card strong {
  color: var(--text-color, #444); /* Darker for emphasis */
  font-weight: 500; /* Consistent with h3 */
}

.status-badge { /* Base class for status */
  display: inline-block;
  padding: 0.25em 0.6em;
  font-size: 0.75em;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: var(--border-radius, 0.3rem);
}

.status-owned {
  background-color: var(--success-color, green);
  color: white;
}
.status-wishlist {
  background-color: var(--warning-color, orange);
  color: #212529; /* Dark text on light orange */
}
.status-ordered {
  background-color: var(--info-color, blue);
  color: white;
}

.actions {
  margin-top: 1rem; /* More space above actions */
  display: flex;
  gap: 0.5rem; /* Consistent gap */
  border-top: 1px solid var(--border-color, #eee); /* Separator */
  padding-top: 1rem;
}

.actions button {
  padding: 0.5rem 0.75rem; /* Adjusted padding */
  border: none;
  border-radius: var(--border-radius, 0.3rem);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.actions button:first-child { /* Edit button */
  background-color: var(--primary-color, #007bff);
  color: white;
}
.actions button:first-child:hover:not(:disabled) {
  background-color: #0056b3; /* Darken primary */
  box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.1);
}

.actions button:last-child { /* Delete button */
  background-color: var(--danger-color, #dc3545);
  color: white;
}
.actions button:last-child:hover:not(:disabled) {
  background-color: #c82333; /* Darken danger */
  box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.1);
}

.actions button:disabled {
  background-color: var(--secondary-color, #6c757d);
  opacity: 0.65;
  cursor: not-allowed;
}
</style>
