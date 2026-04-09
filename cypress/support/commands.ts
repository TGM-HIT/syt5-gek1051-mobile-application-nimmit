// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Simulates a logged in Supabase session by populating the local storage.
       */
      login(): Chainable<void>;

      /**
       * Mocks Supabase sync network requests.
       */
      bypassSync(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', () => {
  cy.window().then((win) => {
    const fakeToken = {
      "access_token": "fake-jwt-token",
      "token_type": "bearer",
      "expires_in": 3600,
      "expires_at": Math.floor(Date.now() / 1000) + 3600,
      "refresh_token": "fake-refresh-token",
      "user": {
        "id": "mock-user-123",
        "aud": "authenticated",
        "role": "authenticated",
        "email": "test@example.com",
        "email_confirmed_at": new Date().toISOString(),
        "app_metadata": { "provider": "email", "providers": ["email"] },
        "user_metadata": { "username": "TestUser" },
        "identities": [],
        "created_at": new Date().toISOString(),
        "updated_at": new Date().toISOString()
      }
    };
    win.localStorage.setItem('sb-oioegtvwcxizjbbvktdv-auth-token', JSON.stringify(fakeToken));
  });
});

Cypress.Commands.add('bypassSync', () => {
    // Intercept Supabase network requests to simulate an offline state or prevent real DB mutation during UI tests
    cy.intercept('GET', '**/rest/v1/**', { statusCode: 200, body: [] }).as('mockSupabaseGet');
    cy.intercept('POST', '**/rest/v1/**', { statusCode: 200, body: 0 }).as('mockSupabasePost');
    cy.intercept('PATCH', '**/rest/v1/**', { statusCode: 200, body: {} }).as('mockSupabasePatch');
    cy.intercept('DELETE', '**/rest/v1/**', { statusCode: 200, body: {} }).as('mockSupabaseDelete');
});
