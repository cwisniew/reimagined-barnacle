<template>
  <div class="form-container">
    <h3>{{ editingSet ? 'Edit Lego Set' : 'Add New Lego Set' }}</h3>
    <form @submit.prevent="handleSubmit">
      <div class="form-grid">
        <!-- Name -->
        <div class="form-group">
          <label for="name">Set Name *</label>
          <input type="text" id="name" v-model="formData.name" required />
        </div>

        <!-- Set Number -->
        <div class="form-group">
          <label for="setNumber">Set Number *</label>
          <input type="text" id="setNumber" v-model="formData.setNumber" required />
        </div>

        <!-- Description -->
        <div class="form-group full-width">
          <label for="description">Description</label>
          <textarea id="description" v-model="formData.description"></textarea>
        </div>

        <!-- Pictures (comma-separated URLs for simplicity) -->
        <div class="form-group full-width">
          <label for="pictures">Pictures (comma-separated URLs)</label>
          <input type="text" id="pictures" v-model="picturesString" placeholder="e.g., url1.jpg, url2.jpg" />
        </div>

        <!-- Number of Pieces -->
        <div class="form-group">
          <label for="numberOfPieces">Pieces *</label>
          <input type="number" id="numberOfPieces" v-model.number="formData.numberOfPieces" required min="0" />
        </div>

        <!-- Number of Minifigs -->
        <div class="form-group">
          <label for="numberOfMinifigs">Minifigures *</label>
          <input type="number" id="numberOfMinifigs" v-model.number="formData.numberOfMinifigs" required min="0" />
        </div>

        <!-- Quantity Owned -->
        <div class="form-group">
          <label for="quantityOwned">Quantity Owned *</label>
          <input type="number" id="quantityOwned" v-model.number="formData.quantityOwned" required min="1" />
        </div>

        <!-- Storage Location -->
        <div class="form-group">
          <label for="storageLocation">Storage Location</label>
          <input type="text" id="storageLocation" v-model="formData.storageLocation" />
        </div>

        <!-- Status -->
        <div class="form-group">
          <label for="status">Status *</label>
          <select id="status" v-model="formData.status" required>
            <option value="Owned">Owned</option>
            <option value="Wishlist">Wishlist</option>
            <option value="Ordered">Ordered</option>
          </select>
        </div>

        <!-- Is Built -->
        <div class="form-group form-group-checkbox">
          <input type="checkbox" id="isBuilt" v-model="formData.isBuilt" />
          <label for="isBuilt">Is it built?</label>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit">{{ editingSet ? 'Update Set' : 'Add Set' }}</button>
        <button type="button" @click="handleCancel">Cancel</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, type PropType } from 'vue';
import legoStore, { type LegoSet, type CreateLegoSetData, type UpdateLegoSetData } from '../stores/legoStore';

const props = defineProps({
  editingSet: {
    type: Object as PropType<LegoSet | null>,
    default: null,
  },
});

const emit = defineEmits<{
  (e: 'submit-success'): void;
  (e: 'cancel'): void;
}>();

// Reactive form data structure. Initialize with defaults or editingSet values.
// Using a function to initialize to ensure reactivity and proper reset.
const getInitialFormData = (): Omit<LegoSet, 'id'> => {
  if (props.editingSet) {
    return { ...props.editingSet }; // Spread to make it mutable for the form
  }
  return {
    name: '',
    setNumber: '',
    description: '',
    pictures: [],
    numberOfPieces: 0,
    numberOfMinifigs: 0,
    quantityOwned: 1,
    storageLocation: '',
    isBuilt: false,
    status: 'Owned',
  };
};

const formData = ref<Omit<LegoSet, 'id'>>(getInitialFormData());

// Computed property to handle pictures as a comma-separated string
const picturesString = computed({
  get: () => formData.value.pictures?.join(', ') || '',
  set: (value: string) => {
    formData.value.pictures = value.split(',').map(url => url.trim()).filter(url => url);
  }
});

// Watch for changes in the editingSet prop to reset the form if it changes
watch(() => props.editingSet, (newSet) => {
  formData.value = getInitialFormData();
}, { immediate: true }); // immediate: true to run on component mount

const handleSubmit = () => {
  // Basic validation already handled by `required` attributes, but can add more here.
  if (props.editingSet && props.editingSet.id) {
    // Update existing set
    const updateData: UpdateLegoSetData = { ...formData.value };
    legoStore.updateSet(props.editingSet.id, updateData);
  } else {
    // Add new set
    // Ensure all required fields for CreateLegoSetData are present
    const createData: CreateLegoSetData = {
        name: formData.value.name,
        setNumber: formData.value.setNumber,
        description: formData.value.description,
        pictures: formData.value.pictures,
        numberOfPieces: formData.value.numberOfPieces,
        numberOfMinifigs: formData.value.numberOfMinifigs,
        quantityOwned: formData.value.quantityOwned,
        storageLocation: formData.value.storageLocation,
        isBuilt: formData.value.isBuilt,
        status: formData.value.status,
    };
    legoStore.addSet(createData);
  }
  emit('submit-success');
  // Optionally reset form after submission if not automatically closed
  // formData.value = getInitialFormData(); // Reset only if not closing immediately
};

const handleCancel = () => {
  emit('cancel');
  // formData.value = getInitialFormData(); // Reset form on cancel
};

</script>

<style scoped>
.form-container {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 700px; /* Limit form width */
  margin: 20px auto; /* Center form */
}

.form-container h3 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* Two columns */
  gap: 15px 20px; /* Row and column gap */
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1; /* Span full width */
}

.form-group label {
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea,
.form-group select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.form-group-checkbox {
  flex-direction: row;
  align-items: center;
  grid-column: 1 / -1; /* Span full width for better layout */
}

.form-group-checkbox input[type="checkbox"] {
  margin-right: 10px;
  width: auto; /* Override default input width for checkbox */
  height: auto; /* Override default input height for checkbox */
}

.form-group-checkbox label {
  margin-bottom: 0; /* Align with checkbox */
  font-weight: normal;
}

.form-actions {
  margin-top: 25px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.form-actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 1em;
  cursor: pointer;
}

.form-actions button[type="submit"] {
  background-color: #28a745; /* Green */
  color: white;
}
.form-actions button[type="submit"]:hover {
  background-color: #218838;
}

.form-actions button[type="button"] {
  background-color: #6c757d; /* Gray */
  color: white;
}
.form-actions button[type="button"]:hover {
  background-color: #5a6268;
}
</style>
