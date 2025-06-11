import { mount } from '@vue/test-utils';
import BoardGameListItem from '@/components/BoardGameListItem.vue';

describe('BoardGameListItem.vue', () => {
  const sampleGame = {
    id: 1,
    name: 'Wingspan',
    storageLocation: 'Living Room Shelf',
    cards: [
      { type: 'Bird', count: 170, sleeved: true },
      { type: 'Bonus', count: 20, sleeved: false },
    ],
    manualLink: 'https://www.stonemaiergames.com/games/wingspan/',
    expansions: ['European Expansion', 'Oceania Expansion']
  };

  const minimalGame = {
    id: 2,
    name: 'Patchwork',
    // No storageLocation, cards, manualLink, or expansions
  };

  const gameWithEmptyExpansion = {
    id: 3,
    name: 'Test Game with Empty Expansion',
    expansions: ['Real Expansion', '  ', null, 'Another One'] // Test filtering of empty/whitespace only strings
  };


  it('renders game name', () => {
    const wrapper = mount(BoardGameListItem, { props: { game: sampleGame } });
    expect(wrapper.find('h3').text()).toBe(sampleGame.name);
  });

  it('renders storage location if provided', () => {
    const wrapper = mount(BoardGameListItem, { props: { game: sampleGame } });
    expect(wrapper.find('.storage-location').text()).toContain(sampleGame.storageLocation);
  });

  it('does not render storage location if not provided', () => {
    const wrapper = mount(BoardGameListItem, { props: { game: minimalGame } });
    expect(wrapper.find('.storage-location').exists()).toBe(false);
  });

  it('renders card details if cards are provided', () => {
    const wrapper = mount(BoardGameListItem, { props: { game: sampleGame } });
    const cardItems = wrapper.findAll('.details-section:first-of-type .info-list li'); // Assuming cards is the first details section
    expect(cardItems.length).toBe(sampleGame.cards.length);
    expect(cardItems[0].text()).toContain(`${sampleGame.cards[0].count}x`);
    expect(cardItems[0].text()).toContain(sampleGame.cards[0].type);
    expect(cardItems[0].text()).toContain('Sleeved'); // Sleeved: Yes
    expect(cardItems[1].text()).toContain('Not Sleeved'); // Sleeved: No
  });

  it('does not render card details section if no cards are provided', () => {
    const wrapper = mount(BoardGameListItem, { props: { game: minimalGame } });
     // Check for a class specific to the cards section or its h4 title
    const cardsSection = wrapper.findAll('.details-section').filter(section => section.find('h4').text().includes('Cards Information'));
    expect(cardsSection.length).toBe(0);
  });

  it('renders "N/A" for card type if not provided', () => {
    const gameWithNAType = { id: 4, name: "Card N/A Test", cards: [{ count: 10, sleeved: false }] }; // type is undefined
    const wrapper = mount(BoardGameListItem, { props: { game: gameWithNAType } });
    const cardText = wrapper.find('.details-section .info-list li').text();
    expect(cardText).toContain('N/A');
  });


  it('renders expansion details if expansions are provided and non-empty', () => {
    const wrapper = mount(BoardGameListItem, { props: { game: sampleGame } });
    const expansionItems = wrapper.findAll('.details-section .expansion-list li');
    expect(expansionItems.length).toBe(sampleGame.expansions.length);
    expect(expansionItems[0].text()).toBe(sampleGame.expansions[0]);
  });

  it('filters out empty or whitespace-only expansions', () => {
    const wrapper = mount(BoardGameListItem, { props: { game: gameWithEmptyExpansion } });
    const expansionItems = wrapper.findAll('.details-section .expansion-list li');
    expect(expansionItems.length).toBe(2); // "Real Expansion" and "Another One"
    expect(expansionItems[0].text()).toBe('Real Expansion');
    expect(expansionItems[1].text()).toBe('Another One');
  });

  it('does not render expansion details section if no expansions are provided', () => {
    const wrapper = mount(BoardGameListItem, { props: { game: minimalGame } });
    const expansionsSection = wrapper.findAll('.details-section').filter(section => section.find('h4').text().includes('Expansions Owned'));
    expect(expansionsSection.length).toBe(0);
  });

  it('does not render expansion details section if expansions array is present but all items are empty strings', () => {
    const gameWithOnlyEmptyExpansions = { id: 5, name: "Empty Expansions Test", expansions: ["", "   "] };
    const wrapper = mount(BoardGameListItem, { props: { game: gameWithOnlyEmptyExpansions } });
    const expansionsSection = wrapper.findAll('.details-section').filter(section => section.find('h4').text().includes('Expansions Owned'));
    expect(expansionsSection.length).toBe(0);
  });


  it('renders manual link if provided', () => {
    const wrapper = mount(BoardGameListItem, { props: { game: sampleGame } });
    const manualLink = wrapper.find('.manual-link a.btn-manual');
    expect(manualLink.exists()).toBe(true);
    expect(manualLink.attributes('href')).toBe(sampleGame.manualLink);
    expect(manualLink.text()).toBe('View Manual');
  });

  it('does not render manual link if not provided', () => {
    const wrapper = mount(BoardGameListItem, { props: { game: minimalGame } });
    expect(wrapper.find('.manual-link a.btn-manual').exists()).toBe(false);
  });
});
