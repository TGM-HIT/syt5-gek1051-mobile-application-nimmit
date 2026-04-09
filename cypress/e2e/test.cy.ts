describe('Test', () => {
  it('debug', () => {
    cy.bypassSync();
    cy.login();
    cy.visit('/list?listId=1234567890');
    
    // Catch JS errors to see if there is a unhandled rejection
    cy.on('uncaught:exception', (err, runnable) => {
      console.error('Cypress error caught!', err);
      return false; // prevent Cypress from failing the test
    });

    cy.get('.add-item-btn').first().click();
    cy.get('#name').type("MyTestItem");
    cy.get('.submit-btn').click();

    cy.wait(1000);
    cy.window().then(async (win: any) => {
        const ps = win.powerSync;
        if (ps) {
           const exactly = await ps.getAll(`
      SELECT 
       i.id as "itemId",
       i.name as "name", 
       i.global as "global", 
       i.description as "description", 
       i.category as "categoryId", 
       c.name as "categoryName",
       li.curr_amount as "currentAmount",
       li.target_amount as "targetAmount",
       li.amount_unit as "amountUnit",
       li.created_at as "createdAt",
       li.updated_at as "updatedAt"
      FROM ListItem li
      JOIN Item i ON li.item = i.id
      JOIN Category c ON i.category = c.id
      WHERE li.liste = ?
      ORDER BY i.name ASC`, ['1234567890']);
           return { exactly };
        }
        return {};
    }).then((debugInfo) => {
        cy.writeFile('cypress/debug-output.txt', JSON.stringify(debugInfo, null, 2));
        cy.log(JSON.stringify(debugInfo, null, 2));
    });

  });
});
