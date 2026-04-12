describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.waitForAppReady();
  });

  it('should display login page', () => {
    // Don't assert translated strings here (CI locale can differ).
    cy.location('pathname').should('include', '/login');
    cy.get('section.login-card').should('be.visible');
    cy.get('input#email').should('be.visible');
    cy.get('input#password').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
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
    cy.get('button[type="button"].login-btn').click();
    cy.location('pathname').should('include', '/register');
    cy.get('section.register-card').should('be.visible');
    cy.get('input#username').should('be.visible');
  });

  // Note: Actual login to Supabase could be simulated if we had test credentials
  // but for E2E basics we ensure the UI behaves properly.
  it('should allow user to type in credentials and attempt login', () => {
    cy.intercept('POST', '**/auth/v1/token?grant_type=password', {
      statusCode: 400,
      body: { error: 'invalid_credentials', error_description: 'Invalid login credentials' }
    }).as('loginRequest');

    cy.get('input#email').type('test@example.com');
    cy.get('input#password').type('wrong_password');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');

    // Just check the feedback or if the button was clicked
    // The exact error depends on Supabase response
    cy.get('.error-box').should('exist');
  });
});
