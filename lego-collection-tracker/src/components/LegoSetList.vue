<template>
  <div class="lego-set-list-container">
    <!-- Title was here, App.vue has a global title, list could have its own sub-title if needed -->
    <!-- <h2>My Lego Collection</h2> -->

    <div v-if="props.isLoading && props.sets.length === 0" class="loading-message list-message"> <!-- Added base class -->
      <p>Loading sets...</p>
    </div>
    <div v-else-if="props.errorMessage" class="error-message list-message"> <!-- Added base class -->
      <p>Error loading sets: {{ props.errorMessage }}</p>
      <p>Please try refreshing or check back later.</p>
    </div>
    <div v-else-if="props.sets && props.sets.length > 0" class="lego-set-list">
      <LegoSetCard
        v-for="set in props.sets"
        :key="set.id"
        :set="set"
        @edit-set="handleEditSet"
        @delete-set="handleDeleteSet"
      />
    </div>
    <div v-else class="empty-list-message list-message"> <!-- Added base class -->
      <p>No Lego sets match your current filters, or your collection is empty. Try adding some!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, type PropType } from 'vue'; // Keep defineEmits
import LegoSetCard from './LegoSetCard.vue';
import type { LegoSet } from '../stores/legoStore';
import { useLegoSetStore } from '../stores/legoStore'; // NEW

const legoSetStore = useLegoSetStore(); // NEW

const props = defineProps({
  sets: {
    type: Array as PropType<LegoSet[]>,
    required: true,
    default: () => []
  },
  isLoading: { // New prop
    type: Boolean,
    default: false
  },
  errorMessage: { // New prop
    type: String,
    default: ''
  }
});

const emit = defineEmits<{ // Keep existing emits
  (e: 'edit-set', id: number): void;
  (e: 'delete-set', id: number): void;
}>();

// Handlers remain largely the same, re-emitting events.
const handleEditSet = (setId: number) => {
  console.log('LegoSetList: Edit event received, re-emitting for App.vue. ID:', setId);
  emit('edit-set', setId);
};

const handleDeleteSet = (setId: number) => {
  // LegoSetCard handles the actual deletion. This is more of a notification/re-emit.
  console.log('LegoSetList: Delete event received, re-emitting for App.vue. ID:', setId);
  emit('delete-set', setId);
};
</script>

<style scoped>
.lego-set-list-container {
  /* Container padding is handled by App.vue's .container class */
}

.lego-set-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); /* Increased min-width for cards */
  gap: 1.25rem; /* Using rem for gap */
}

/* Base style for all messages (loading, error, empty) */
.list-message {
  text-align: center;
  padding: 2rem 1rem; /* Consistent padding */
  margin-top: 1rem; /* Consistent margin */
  border-radius: var(--border-radius, 0.3rem); /* Use CSS var with fallback */
  background-color: var(--light-color, #f8f9fa);
  border: 1px solid var(--border-color, #dee2e6);
  box-shadow: var(--box-shadow, 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075));
}
.list-message p {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-muted-color, #6c757d);
}
.list-message p:last-child:not(:first-child) { /* Add space if there are multiple paragraphs */
    margin-top: 0.5rem;
    font-size: 0.9rem;
}


.loading-message p {
  /* Specific styling for loading message text if needed */
  color: var(--primary-color, #007bff);
}

.error-message {
  background-color: #f8d7da; /* Consistent with App.vue global error */
  border-color: #f5c6cb;
}
.error-message p {
  color: var(--danger-color, #721c24); /* Consistent error text color */
}

.empty-list-message p {
  /* Specific styling for empty list message text if needed */
}
</style>
