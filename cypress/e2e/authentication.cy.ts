describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display login page', () => {
    cy.get('h1').contains('Anmelden');
    cy.get('input#email').should('be.visible');
    cy.get('input#password').should('be.visible');
    cy.get('button[type="submit"]').contains('Anmelden');
  });

  it('should show validation errors on empty submit', () => {
    // Focus and blur to trigger validation, or just click submit
    cy.get('button[type="submit"]').click();
    
    // Check if error messages appear
    // The component might only show error if the fields are touched. 
    // We touch them first to ensure validation triggers.
    cy.get('input#email').focus().blur();
    cy.get('input#password').focus().blur();
    
    cy.get('small.error').should('have.length.at.least', 1);
  });

  it('should navigate to register page', () => {
    cy.contains('Hier registrieren').click();
    cy.url().should('include', '/register');
    cy.get('h1').contains('Konto erstellen');
  });

  // Note: Actual login to Supabase could be simulated if we had test credentials
  // but for E2E basics we ensure the UI behaves properly.
  it('should allow user to type in credentials and attempt login', () => {
    cy.get('input#email').type('test@example.com');
    cy.get('input#password').type('wrong_password');
    cy.get('button[type="submit"]').click();

    // Just check the feedback or if the button was clicked
    // The exact error depends on Supabase response
    cy.get('.error-box').should('exist');
  });
});
