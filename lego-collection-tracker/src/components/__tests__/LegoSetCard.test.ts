import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import LegoSetCard from '../LegoSetCard.vue'; // Adjust path as necessary
import type { LegoSet } from '../../stores/legoStore'; // Adjust path for type
import { createPinia, setActivePinia } from 'pinia';

// Mock the store
const mockDeleteSet = vi.fn();
vi.mock('../../stores/legoStore', async (importOriginal) => {
    const original = await importOriginal() as any; // Import original to get LegoSet type etc.
    return {
        ...original, // Keep original exports like types
        useLegoSetStore: vi.fn(() => ({
            deleteSet: mockDeleteSet,
            error: null, // Mock any state properties read by the component
            // Add other state/getters/actions if the component uses them
        })),
    };
});


const mockSet: LegoSet = {
  id: 1,
  name: 'Test Lego Set',
  setNumber: '12345',
  description: 'A great test set.',
  pictures: ['image1.jpg', 'image2.jpg'],
  numberOfPieces: 500,
  numberOfMinifigs: 4,
  quantityOwned: 1,
  storageLocation: 'Test Shelf',
  isBuilt: true,
  status: 'Owned',
};

describe('LegoSetCard.vue', () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    // Setup Pinia for each test to ensure clean state for store mocks
    setActivePinia(createPinia());
    mockDeleteSet.mockReset().mockResolvedValue(true); // Reset mock before each test

    wrapper = mount(LegoSetCard, {
      props: {
        set: mockSet,
      },
      // global: { // Pinia setup is handled by setActivePinia
      //   plugins: [createPinia()],
      // },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Restore any other spies or mocks
  });

  it('renders set information correctly', () => {
    expect(wrapper.text()).toContain(mockSet.name);
    expect(wrapper.text()).toContain(mockSet.setNumber);
    expect(wrapper.text()).toContain(mockSet.description);
    expect(wrapper.text()).toContain(`Pieces: ${mockSet.numberOfPieces}`);
    expect(wrapper.text()).toContain(`Minifigures: ${mockSet.numberOfMinifigs}`);
    expect(wrapper.text()).toContain(`Stored In: ${mockSet.storageLocation}`);
    expect(wrapper.text()).toContain(`Status: ${mockSet.status}`); // Relies on span class for specific styling, text is direct
    expect(wrapper.text()).toContain('Built: Yes');
    const images = wrapper.findAll('.lego-set-image');
    expect(images.length).toBe(mockSet.pictures!.length);
    expect(images[0].attributes('src')).toBe(mockSet.pictures![0]);
  });

  it('emits "edit-set" event with set id when edit button is clicked', async () => {
    // Using a more robust selector that doesn't rely on a custom class yet
    const editButton = wrapper.findAll('button').find(button => button.text() === 'Edit');
    expect(editButton).toBeDefined();
    await editButton!.trigger('click');
    expect(wrapper.emitted('edit-set')).toBeTruthy();
    expect(wrapper.emitted('edit-set')![0]).toEqual([mockSet.id]);
  });

  it('calls store deleteSet action and handles confirmation when delete button is clicked', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const deleteButton = wrapper.findAll('button').find(button => button.text().includes('Delete'));
    expect(deleteButton).toBeDefined();
    await deleteButton!.trigger('click');

    expect(confirmSpy).toHaveBeenCalledWith(`Are you sure you want to delete "${mockSet.name}"? This action cannot be undone.`);
    expect(mockDeleteSet).toHaveBeenCalledWith(mockSet.id);

    confirmSpy.mockRestore();
  });

  it('does not call store deleteSet action if confirmation is cancelled', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    const deleteButton = wrapper.findAll('button').find(button => button.text().includes('Delete'));
    expect(deleteButton).toBeDefined();
    await deleteButton!.trigger('click');

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockDeleteSet).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('disables delete button and shows "Deleting..." text during deletion', async () => {
    vi.useFakeTimers(); // Use fake timers for this test
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    // Make deleteSet promise not resolve immediately
    mockDeleteSet.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 50)));

    const deleteButton = wrapper.findAll('button').find(button => button.text().includes('Delete'));
    expect(deleteButton).toBeDefined();

    // Trigger click without awaiting the full async operation within deleteSet
    deleteButton!.trigger('click');

    await wrapper.vm.$nextTick(); // Allow Vue to react to isDeleting state change

    // Check button state immediately after click (isDeleting should be true)
    const deleteButtonAfterClick = wrapper.findAll('button').find(button => button.text().includes('Deleting...'));
    expect(deleteButtonAfterClick).toBeDefined();
    expect(deleteButtonAfterClick!.attributes('disabled')).toBeDefined();

    // Advance timers to resolve the promise
    vi.advanceTimersByTime(100);
    await wrapper.vm.$nextTick(); // Allow component to re-render after promise resolves

    const deleteButtonAfterResolved = wrapper.findAll('button').find(button => button.text().includes('Delete'));
    expect(deleteButtonAfterResolved).toBeDefined();
    expect(deleteButtonAfterResolved!.attributes('disabled')).toBeUndefined(); // No longer disabled

    confirmSpy.mockRestore();
    vi.useRealTimers(); // Restore real timers
  });
});
