describe('Navigation', () => {
  beforeEach(() => {
    cy.bypassSync();
    cy.login();
    // Navigating to the home page redirects or opens the default page (shopping list)
    cy.visit('/');
  });

  it('should navigate to Groups page', () => {
    cy.get('nav.bottom-navigation a[routerLink="/groups"]').click();
    cy.url().should('include', '/groups');
  });

  it('should navigate to Settings page', () => {
    cy.get('nav.bottom-navigation a[routerLink="/settings"]').click();
    cy.url().should('include', '/settings');
  });

  it('should navigate back to Shopping List page', () => {
    cy.visit('/settings');
    cy.get('nav.bottom-navigation a[routerLink="/list"]').click();
    cy.url().should('include', '/list');
  });
});
