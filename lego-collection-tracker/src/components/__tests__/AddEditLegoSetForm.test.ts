import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import AddEditLegoSetForm from '../AddEditLegoSetForm.vue';
import type { LegoSet, CreateLegoSetData } from '../../stores/legoStore';
import { createPinia, setActivePinia } from 'pinia';
import { useLegoSetStore } from '../../stores/legoStore'; // Import for mocking setup

// Mock the Pinia store
const mockAddSet = vi.fn();
const mockUpdateSet = vi.fn();

// We define the mock setup for useLegoSetStore here
// This will be hoisted by Vitest's vi.mock
vi.mock('../../stores/legoStore', async (importOriginal) => {
    const original = await importOriginal() as any;
    return {
        ...original, // Keep original exports like types
        useLegoSetStore: vi.fn(() => ({
            addSet: mockAddSet,
            updateSet: mockUpdateSet,
            error: null, // Mock reactive state properties accessed by the component
            loading: false,
            // Ensure state is mutable for tests if needed, e.g. for error simulation
            // This might require the mock to return a ref or reactive object for 'error'
        })),
    };
});


const mockLegoSet: LegoSet = {
  id: 1, name: 'Existing Set', setNumber: 'ES001', numberOfPieces: 100,
  numberOfMinifigs: 2, quantityOwned: 1, isBuilt: true, status: 'Owned',
  description: 'An existing set for editing', pictures: ['pic1.jpg'], storageLocation: 'Shelf A'
};

describe('AddEditLegoSetForm.vue', () => {
  let wrapper: VueWrapper<any>;
  // This variable will hold the reactive error property of the mocked store
  let storeErrorRef: { value: string | null };


  beforeEach(() => {
    setActivePinia(createPinia());

    // Reset mocks and their default implementations
    mockAddSet.mockReset().mockResolvedValue({ id: 2, name: 'New Set', setNumber: 'NS001', numberOfPieces: 50, numberOfMinifigs: 1, quantityOwned: 1, isBuilt: false, status: 'Owned' });
    mockUpdateSet.mockReset().mockResolvedValue({ ...mockLegoSet, name: 'Updated Name' });

    // Update the mock for useLegoSetStore to return a potentially mutable error for testing
    storeErrorRef = { value: null }; // Simple object to hold reactive-like error
    (useLegoSetStore as any).mockImplementation(() => ({
        addSet: mockAddSet,
        updateSet: mockUpdateSet,
        get error() { return storeErrorRef.value; }, // Getter for error
        set error(newError: string | null) { storeErrorRef.value = newError; }, // Setter for error
        loading: false,
    }));

  });

  afterEach(() => {
    vi.restoreAllMocks(); // This is good, but specific mockResets are often better.
    if (wrapper && wrapper.exists()) {
      wrapper.unmount();
    }
  });

  // Helper function to fill form
  async function fillForm(wrapperComponent: VueWrapper<any>, data: Partial<CreateLegoSetData>) {
    if (data.name) await wrapperComponent.find('input#name').setValue(data.name);
    if (data.setNumber) await wrapperComponent.find('input#setNumber').setValue(data.setNumber);
    if (data.description) await wrapperComponent.find('textarea#description').setValue(data.description);
    if (data.pictures) await wrapperComponent.find('input#pictures').setValue(data.pictures.join(', '));
    if (data.numberOfPieces !== undefined) await wrapperComponent.find('input#numberOfPieces').setValue(data.numberOfPieces);
    if (data.numberOfMinifigs !== undefined) await wrapperComponent.find('input#numberOfMinifigs').setValue(data.numberOfMinifigs);
    if (data.quantityOwned !== undefined) await wrapperComponent.find('input#quantityOwned').setValue(data.quantityOwned);
    if (data.storageLocation) await wrapperComponent.find('input#storageLocation').setValue(data.storageLocation);
    if (data.status) await wrapperComponent.find('select#status').setValue(data.status);
    if (data.isBuilt !== undefined) await wrapperComponent.find('input#isBuilt').setValue(data.isBuilt);
  }

  it('renders correctly for adding a new set (no editingSet prop)', () => {
    wrapper = mount(AddEditLegoSetForm);
    expect(wrapper.find('h3').text()).toBe('Add New Lego Set');
    expect(wrapper.find('input#name').element.value).toBe('');
    expect(wrapper.find('button[type="submit"]').text()).toBe('Add Set');
  });

  it('renders correctly for editing an existing set (with editingSet prop)', () => {
    wrapper = mount(AddEditLegoSetForm, { props: { editingSet: mockLegoSet } });
    expect(wrapper.find('h3').text()).toBe('Edit Lego Set');
    expect(wrapper.find('input#name').element.value).toBe(mockLegoSet.name);
    expect(wrapper.find('input#setNumber').element.value).toBe(mockLegoSet.setNumber);
    expect(wrapper.find('textarea#description').element.value).toBe(mockLegoSet.description);
    expect(wrapper.find('input#pictures').element.value).toBe(mockLegoSet.pictures!.join(', '));
    expect(wrapper.find('input#numberOfPieces').element.value).toBe(mockLegoSet.numberOfPieces.toString());
    expect(wrapper.find('select#status').element.value).toBe(mockLegoSet.status);
    expect((wrapper.find('input#isBuilt').element as HTMLInputElement).checked).toBe(mockLegoSet.isBuilt);
    expect(wrapper.find('button[type="submit"]').text()).toBe('Update Set');
  });

  it('calls store addSet action with form data on submit for new set', async () => {
    wrapper = mount(AddEditLegoSetForm);
    const newSetData: CreateLegoSetData = {
      name: 'Super Speeder', setNumber: 'SS002', numberOfPieces: 250,
      numberOfMinifigs: 1, quantityOwned: 1, isBuilt: false, status: 'Wishlist',
      description: 'A speedy car', pictures: [], storageLocation: ''
    };
    await fillForm(wrapper, newSetData);
    await wrapper.find('form').trigger('submit.prevent');

    expect(mockAddSet).toHaveBeenCalledWith(expect.objectContaining(newSetData));
    expect(wrapper.emitted('submit-success')).toBeTruthy();
  });

  it('calls store updateSet action with form data on submit for existing set', async () => {
    wrapper = mount(AddEditLegoSetForm, { props: { editingSet: mockLegoSet } });
    const updatedName = 'Super Duper Speeder';
    await wrapper.find('input#name').setValue(updatedName);
    await wrapper.find('form').trigger('submit.prevent');

    expect(mockUpdateSet).toHaveBeenCalledWith(
      mockLegoSet.id,
      // The form sends the whole formData object, not just the changed field
      expect.objectContaining({ ...mockLegoSet, name: updatedName })
    );
    expect(wrapper.emitted('submit-success')).toBeTruthy();
  });

  it('displays an error message if addSet fails (store sets error)', async () => {
    wrapper = mount(AddEditLegoSetForm);
    const errorMessage = "Network error during add";

    // Simulate store action failing and setting the store's error state
    mockAddSet.mockImplementationOnce(async () => {
      storeErrorRef.value = errorMessage; // Simulate setting the error in the store's reactive state
      return null; // Simulate action returning null on failure
    });

    await fillForm(wrapper, { name: 'Fail Set', setNumber: 'F001', numberOfPieces: 10, numberOfMinifigs: 0, quantityOwned: 1, isBuilt: false, status: 'Owned' });
    await wrapper.find('form').trigger('submit.prevent');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('submit-success')).toBeFalsy();
    expect(wrapper.find('.form-error-message').exists()).toBe(true);
    expect(wrapper.find('.form-error-message').text()).toContain(errorMessage);
  });


  it('displays an error message if addSet throws an error', async () => {
    wrapper = mount(AddEditLegoSetForm);
    const errorMessage = "Network error during add - THROWN";
    mockAddSet.mockRejectedValueOnce(new Error(errorMessage)); // Simulate store action throwing error

    await fillForm(wrapper, { name: 'Fail Set', setNumber: 'F001', numberOfPieces: 10, numberOfMinifigs: 0, quantityOwned: 1, isBuilt: false, status: 'Owned' });
    await wrapper.find('form').trigger('submit.prevent');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('submit-success')).toBeFalsy();
    expect(wrapper.find('.form-error-message').exists()).toBe(true);
    expect(wrapper.find('.form-error-message').text()).toContain(errorMessage);
  });


  it('emits "cancel" event when cancel button is clicked', async () => {
    wrapper = mount(AddEditLegoSetForm);
    await wrapper.find('button[type="button"]').trigger('click'); // Assuming cancel is type="button"
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('form fields are disabled during submission', async () => {
    vi.useFakeTimers();
    wrapper = mount(AddEditLegoSetForm);
    mockAddSet.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({id: 1, name: 'Test', setNumber: '123', numberOfPieces: 10, numberOfMinifigs: 1, quantityOwned: 1, isBuilt: false, status: 'Owned'}), 50)));

    await fillForm(wrapper, { name: 'Test', setNumber: 'T001', numberOfPieces: 10, numberOfMinifigs: 0, quantityOwned: 1, isBuilt: false, status: 'Owned' });
    // Trigger submit but don't wait for the async handleSubmit to complete fully
    wrapper.find('form').trigger('submit.prevent');

    await wrapper.vm.$nextTick(); // Allow Vue to react to isSubmitting state change

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined();
    expect(wrapper.find('button[type="button"]').attributes('disabled')).toBeDefined();
    // Optionally check other fields too
    expect(wrapper.find('input#name').attributes('disabled')).toBeUndefined(); // Assuming only buttons are disabled by default

    await vi.runAllTimersAsync(); // Resolve the submission
    await wrapper.vm.$nextTick(); // Allow component to re-render after promise resolves

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined();
    expect(wrapper.find('button[type="button"]').attributes('disabled')).toBeUndefined();
    vi.useRealTimers();
  });
});
