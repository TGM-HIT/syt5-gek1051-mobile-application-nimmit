describe('Shopping List', () => {
  beforeEach(() => {
    cy.bypassSync();
    cy.visitWithAuth('/list?listId=1234567890');
    cy.waitForAppReady();
  });

  it('should display the shopping list page', () => {
    cy.get('.list-header').should('be.visible');
    cy.get('.search-input').should('be.visible');
  });

  it('should open add item modal from navigation add button', () => {
    // Click the visible navigation add button (bottom bar on mobile, sidebar on desktop)
    cy.get('app-navigation .nav-item.add-button:visible').click();
    cy.get('.modal-content').should('be.visible');
    cy.get('.modal-title').should('contain.text', 'Produkt hinzufügen');
    cy.get('.close-btn').click();
    cy.get('.modal-content').should('not.exist');
  });

  it('should add a new item to the shopping list', () => {
    const itemName = 'Cypress Test Apple ' + Date.now();
    
    // Open modal via the main screen add button
    cy.get('.add-item-btn').first().click();
    
    // Type item name
    cy.get('#name').type(itemName);
    
    // Select category (optional, using arrow down to pick first or typing)
    cy.get('#category').select(1, { force: true });

    // Click on increment quantity
    cy.get('.quantity-btn').last().click();
    
    // Add size
    cy.get('.size-input').type('2');

    // Add info
    cy.get('#info').type('Very sweet apples for testing.');
    
    // Submit
    cy.get('.submit-btn').click();

    // The modal should close
    cy.get('.modal-content').should('not.exist');

    // The item should be visible in the list
    cy.get('.item-name').contains(itemName).should('be.visible');
  });

  it('should expand item and then delete it', () => {
    const itemName = 'Cypress Delete Target ' + Date.now();
    
    // Add an item to delete
    cy.get('.add-item-btn').first().click();
    cy.get('#name').type(itemName);
    cy.get('.submit-btn').click();
    
    // Wait until modal is gone
    cy.get('.modal-content').should('not.exist');

    // Find the item by name and click to expand
    cy.get('.item-name').contains(itemName).parents('.item-card').as('deleteCard');

    // Desktop shows actions in the header; mobile shows them in the expanded section.
    cy.get('@deleteCard').then(($card) => {
      const hasDesktopActions = $card.find('.item-header-actions:visible').length > 0;

      if (hasDesktopActions) {
        cy.wrap($card).find('.item-header-action-btn.delete').should('be.visible').click();
        return;
      }

      cy.wrap($card).find('.item-header-main').click();
      cy.wrap($card).find('.action-btn.delete').should('be.visible').click();
    });

    // Confirm deletion
    cy.get('.modal-content').should('be.visible');
    cy.get('.confirm-btn').should('be.visible').click();
    cy.get('.modal-content').should('not.exist');

    // The item should no longer exist
    cy.contains('.item-name', itemName).should('not.exist');
  });

  it('should switch to purchased tab', () => {
    // Basic navigation testing for the filter tabs
    cy.get('.filter-tab').contains('Eingekauft').click();
    cy.get('.filter-tab').contains('Eingekauft').should('have.class', 'active');
  });

  it('should filter items by search query', () => {
    const itemName = 'Cypress Search Item ' + Date.now();
    
    // Add item first
    cy.get('.add-item-btn').first().click();
    cy.get('#name').type(itemName);
    cy.get('.submit-btn').click();
    cy.get('.modal-content').should('not.exist');
    
    // Search for the uniquely named item
    cy.get('.search-input').type(itemName);
    
    // It should be visible
    cy.get('.item-name').contains(itemName).should('be.visible');
    
    // Search for something gibberish
    cy.get('.search-input').clear().type('XYZ NonExistent Item XYZ');
    
    // No results should be displayed
    cy.get('.no-results').should('be.visible');
    cy.get('.item-name').should('not.exist');
    
    // Clear search
    cy.get('.search-input').clear();
  });

  it('should filter items by category', () => {
    const itemName = 'Cypress Category Item ' + Date.now();
    
    // Add item with a specific category
    cy.get('.add-item-btn').first().click();
    cy.get('#name').type(itemName);
    
    // Select the category at index 1 (skip default if empty, or just use index 1)
    cy.get('#category').select(1, { force: true });
    
    // Read the category name so we can click the correct tab later
    cy.get('#category option:selected').invoke('text').then((categoryName) => {
      cy.get('.submit-btn').click();
      cy.get('.modal-content').should('not.exist');
      
      // Click the specific category tab
      cy.get('.category-tab').contains(categoryName.trim()).click();
      
      // Ensure the category tab is active
      cy.get('.category-tab').contains(categoryName.trim()).should('have.class', 'active');
      
      // Our item should be visible in this category filter
      cy.get('.item-name').contains(itemName).should('be.visible');
      
      // Click it again to deselect the category filter
      cy.get('.category-tab').contains(categoryName.trim()).click();
      cy.get('.category-tab').contains(categoryName.trim()).should('not.have.class', 'active');
    });
  });
  it('should add item from search when not found, auto-filling name', () => {
    const itemName = 'Apfel Spezial ' + Date.now();

    cy.get('.search-input').type(itemName);
    cy.get('.no-results').should('be.visible');
    cy.get('.add-not-found-btn').should('contain.text', itemName).click();
    cy.get('.modal-content').should('be.visible');
    cy.get('#name').should('have.value', itemName);
    cy.get('#category').select(1, { force: true });
    cy.get('.submit-btn').click();
    cy.get('.modal-content').should('not.exist');
    cy.get('.item-name').contains(itemName).should('be.visible');
    cy.get('.search-input').clear();
  });

  it('should add item from search when not found via Enter', () => {
    const itemName = 'Birne Spezial ' + Date.now();

    cy.get('.search-input').type(itemName);
    cy.get('.no-results').should('be.visible');
    cy.get('.search-input').type('{enter}');

    cy.get('.modal-content').should('be.visible');
    cy.get('#name').should('have.value', itemName);
    cy.get('#category').select(1, { force: true });
    cy.get('.submit-btn').click();
    cy.get('.modal-content').should('not.exist');
    cy.get('.item-name').contains(itemName).should('be.visible');
  });

  it('should prevent submitting if name is empty', () => {
    cy.get('.add-item-btn').first().click();
    cy.get('.modal-content').should('be.visible');

    // The submit button should be disabled natively when name is empty
    cy.get('.submit-btn').should('be.disabled');

    // Type name, button becomes enabled
    cy.get('#name').type('A test Name');
    cy.get('.submit-btn').should('not.be.disabled');

    // Clear name, button becomes disabled again
    cy.get('#name').clear();
    cy.get('.submit-btn').should('be.disabled');

    // Close modal
    cy.get('.close-btn').click();
  });

  it('should be able to edit an existing item', () => {
    const itemName = 'To Edit ' + Date.now();
    const newName = 'Totally New Name ' + Date.now();

    // Add item first
    cy.get('.add-item-btn').first().click();
    cy.get('#name').type(itemName);
    cy.get('.submit-btn').click();
    cy.get('.modal-content').should('not.exist');

    // Locate the item card
    cy.get('.item-name').contains(itemName).parents('.item-card').as('editCard');

    // Desktop shows actions in the header; mobile shows them in the expanded section.
    cy.get('@editCard').then(($card) => {
      const hasDesktopActions = $card.find('.item-header-actions:visible').length > 0;

      if (hasDesktopActions) {
        cy.wrap($card).find('.item-header-action-btn.edit').should('be.visible').click();
        return;
      }

      cy.wrap($card).find('.item-header-main').click();
      cy.wrap($card).find('.action-btn.edit').should('be.visible').click();
    });
    cy.get('.modal-content').should('be.visible');

    // Verify modal is in edit mode
    cy.get('.modal-title').should('contain.text', 'Produkt bearbeiten');
    cy.get('#name').should('have.value', itemName);

    // Change name and submit
    cy.get('#name').clear().type(newName);
    cy.get('.submit-btn').click();

    // Verify item name changed in list
    cy.get('.item-name').contains(newName).should('be.visible');
    cy.get('.item-name').contains(itemName).should('not.exist');
  });
});
