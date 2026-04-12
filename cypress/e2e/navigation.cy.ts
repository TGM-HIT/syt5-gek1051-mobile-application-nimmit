describe('Navigation', () => {
  beforeEach(() => {
    cy.bypassSync();
    // Visit with a mocked Supabase session so route guards allow navigation
    cy.visitWithAuth('/');
    cy.waitForAppReady();
  });

  it('should navigate to Groups page', () => {
    cy.get('app-navigation a[routerLink="/groups"]:visible').click();
    cy.url().should('include', '/groups');
  });

  it('should navigate to Settings page', () => {
    cy.get('app-navigation a[routerLink="/settings"]:visible').click();
    cy.url().should('include', '/settings');
  });

  it('should navigate back to Shopping List page', () => {
    cy.visit('/settings');
    cy.get('app-navigation a[routerLink="/lists"]:visible').click();
    cy.url().should('include', '/lists');
  });
});
