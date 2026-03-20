# Testing

This document describes **which automated tests exist** in Nimmit, **what each test case covers**, and **how to run** the test suite locally.

## Current status

- **Web (Angular):** 12 spec files (`*.spec.ts`) with 129 test cases (`it(...)`)
- **Android (native):** 2 JUnit tests (1 local unit test + 1 instrumented test)
- **Web E2E/UI automation:** none at the moment (no Cypress/Playwright setup in this repo)

## Web (Angular) test setup (tooling)

- **Runner / Framework:** Vitest (via Angular CLI’s `@angular/build:unit-test` builder)
- **Angular testing utilities:** `TestBed` and `ComponentFixture`
- **DOM environment:** JSDOM (browser APIs such as `localStorage` / `matchMedia` are mocked where required)
- **Coverage:** `@vitest/coverage-v8` with reporters `lcov`, `text-summary`, `json-summary`

## Android (native) test setup (tooling)

- **Local unit tests:** JUnit (runs on the host machine/JVM)
- **Instrumented tests:** AndroidX Test + `AndroidJUnit4` runner (runs on a device/emulator)

## How to run tests

### Web (Angular)

> All commands are defined in `package.json` scripts.

- Watch mode (developer loop): `npm run test`
- Single run (CI-style, no watch): `npm run test:component`
- Single run with coverage output: `npm run test:coverage`

### Android (native)

Run these from the `android/` folder.

- Windows (Gradle wrapper):
  - `cd android`
  - Local unit tests: `./gradlew.bat test`
  - Instrumented tests (requires device/emulator): `./gradlew.bat connectedAndroidTest`

## Linting (ESLint)

Linting is **static analysis** (no app runtime, no browser) that checks code quality and style problems early.

### How to run lint

- Lint the codebase:
  - `npm run lint`
- Apply auto-fixes where possible:
  - `npm run lint:fix`

### What is linted

- Current lint scope:
  - `src/**/*.{ts,html}`

### Configuration

- ESLint is configured via the flat config file:
  - `eslint.config.mjs`

## Test reports / output

### Web (Angular)

- Coverage output is generated under `coverage/`.
  - Project coverage is stored in `coverage/nimmit/`.
  - Key files:
    - `coverage/nimmit/lcov.info`
    - `coverage/nimmit/coverage-summary.json`
    - `coverage/nimmit/lcov-report/index.html`

### Android (native)

- Gradle generates reports under `android/app/build/reports/` (unit test + instrumented test reports).

## Implemented tests and test cases

### Web (Angular)

The following `*.spec.ts` files exist in `src/` and are executed by `ng test`.

### 1) App bootstrap

#### `src/app/app.spec.ts`

**Suite:** `App`
- `should create the app`

---

### 2) Services

#### `src/app/services/theme.service.spec.ts`

**Suite:** `ThemeService`
- `should be created`

**Suite:** `initial state`
- `should have a theme value`
- `should have isDarkMode as boolean`

**Suite:** `setTheme()`
- `should set theme to light`
- `should set theme to dark`
- `should set theme to system`
- `should update isDarkMode when setting dark theme`
- `should update isDarkMode when setting light theme`

**Suite:** `toggleTheme()`
- `should toggle from light to dark`
- `should toggle from dark to light`
- `should toggle from system based on current mode`

**Suite:** `cycleTheme()`
- `should cycle from light to dark`
- `should cycle from dark to system`
- `should cycle from system to light`
- `should complete full cycle`

#### `src/app/services/shopping-list.service.spec.ts`

**Suite:** `ShoppingListService`
- `should be created`

**Suite:** `initial state`
- `should have empty items list initially`
- `should have default list name`
- `should have default list description`
- `should have allCount as 0`
- `should have progressPercentage as 0`

**Suite:** `addItem()`
- `should add a new item to the list`
- `should generate an id for the new item`
- `should set purchasedQuantity to 0`
- `should set createdAt and updatedAt`
- `should update allCount`

**Suite:** `markAsPurchased()`
- `should set purchasedQuantity to totalQuantity`
- `should update purchasedCount`
- `should update progressPercentage`

**Suite:** `markAsNotPurchased()`
- `should set purchasedQuantity to 0`

**Suite:** `updateItem()`
- `should update item properties`
- `should update updatedAt timestamp`

**Suite:** `deleteItem()`
- `should remove item from list`
- `should update allCount after deletion`

**Suite:** `getFilteredItems()`
- `should return all items when filter is "all"`
- `should return only not purchased items when filter is "notPurchased"`
- `should return only purchased items when filter is "purchased"`
- `should filter by search query in name`
- `should filter by search query in category`
- `should be case-insensitive`
- `should combine filter and search`

**Suite:** `isPurchased()`
- `should return true when purchasedQuantity >= totalQuantity`
- `should return false when purchasedQuantity < totalQuantity`

**Suite:** `getStatusText()`
- `should return correct status text`

**Suite:** `updateListInfo()`
- `should update list name`
- `should update list description`

**Suite:** `computed values`
- `should calculate notPurchasedCount correctly`
- `should calculate purchasedCount correctly`
- `should calculate progressPercentage as 100% when all items purchased`

#### `src/app/services/modal.service.spec.ts`

**Suite:** `ModalService`
- `should be created`

**Suite:** `initial state`
- `should have isOpen as false initially`
- `should have config as null initially`
- `should have hasModal as false initially`

**Suite:** `open()`
- `should open modal and set isOpen to true`
- `should set config when opening modal`
- `should set hasModal to true when opened`
- `should return a promise`
- `should set default closeOnBackdropClick to true`
- `should set default closeOnEscape to true`
- `should allow overriding closeOnBackdropClick`

**Suite:** `close()`
- `should set isOpen to false`
- `should resolve promise with result`

**Suite:** `dismiss()`
- `should set isOpen to false`
- `should resolve promise with undefined`

**Suite:** `onBackdropClick()`
- `should dismiss when closeOnBackdropClick is true`
- `should not dismiss when closeOnBackdropClick is false`

**Suite:** `onEscapeKey()`
- `should dismiss when closeOnEscape is true`
- `should not dismiss when closeOnEscape is false`

#### `src/app/services/supabase.spec.ts`

**Suite:** `Supabase`
- `should be created`

---

### 3) Components

#### `src/app/components/modal-container/modal-container.spec.ts`

**Suite:** `ModalContainer`
- `should create`

**Suite:** `componentType`
- `should return null when no config`
- `should return component from config`

**Suite:** `componentInputs`
- `should return empty object when no config`
- `should return empty object when config has no data`
- `should return data wrapped in data property`

**Suite:** `onEscapeKey()`
- `should call modalService.onEscapeKey()`

**Suite:** `onBackdropClick()`
- `should call modalService.onBackdropClick when clicking backdrop`
- `should not call modalService.onBackdropClick when clicking content`

**Suite:** `modalService reference`
- `should have modalService accessible`

#### `src/app/components/add-item-modal/add-item-modal.spec.ts`

**Suite:** `AddItemModal`
- `should create`

**Suite:** `initial state (add mode)`
- `should have empty name`
- `should have default category "Sonstiges"`
- `should have quantity of 1`
- `should have empty info`
- `should have default unit "Einheit"`
- `should have undefined size`
- `should not be in edit mode`
- `should have predefined categories`
- `should have predefined units`

**Suite:** `edit mode`
- `should populate form from editItem data`

**Suite:** `incrementQuantity()`
- `should increase quantity by 1`
- `should increase multiple times`

**Suite:** `decrementQuantity()`
- `should decrease quantity by 1`
- `should not go below 1`
- `should stop at 1 when decrementing multiple times`

**Suite:** `close()`
- `should call modalService.dismiss()`

**Suite:** `submit()`
- `should not submit when name is empty`
- `should not submit when name is only whitespace`
- `should call modalService.close with result when valid`
- `should trim name before submitting`
- `should include info when provided`
- `should set info to undefined when empty`

**Suite:** `icons`
- `should have required icons defined`

#### `src/app/components/edit-list-modal/edit-list-modal.spec.ts`

**Suite:** `EditListModal`
- `should create`

**Suite:** `initial state`
- `should have empty name initially`
- `should have empty description initially`

**Suite:** `ngOnInit with data`
- `should populate form from input data`

**Suite:** `close()`
- `should call modalService.dismiss()`

**Suite:** `submit()`
- `should not submit when name is empty`
- `should not submit when name is only whitespace`
- `should call modalService.close with result when valid`
- `should trim name before submitting`
- `should trim description before submitting`
- `should allow empty description`

**Suite:** `icons`
- `should have X icon defined`

---

### 4) Pages / Navigation

#### `src/app/navigation/navigation.spec.ts`

**Suite:** `Navigation`
- `should create`

**Suite:** `icons`
- `should have List icon defined`
- `should have Users icon defined`
- `should have Settings icon defined`
- `should have Plus icon defined`

**Suite:** `addNewItem()`
- `should open AddItemModal`
- `should add item when modal returns result`
- `should not add item when modal is dismissed`
- `should not add item when modal returns null`
- `should handle item without info`

---

### 5) Authentication pages

#### `src/app/authentication/login/login.spec.ts`

**Suite:** `Login`
- `should create`

#### `src/app/authentication/register/register.spec.ts`

**Suite:** `Register`
- `should create`

#### `src/app/authentication/account/account.spec.ts`

**Suite:** `Account`
- `should create`

---

### Android (native)

These are the default Capacitor/Android template tests.

#### `android/app/src/test/java/com/getcapacitor/myapp/ExampleUnitTest.java`

**Suite:** `ExampleUnitTest`
- `addition_isCorrect` (asserts `2 + 2 == 4`)

#### `android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java`

**Suite:** `ExampleInstrumentedTest`
- `useAppContext` (asserts the app context package name matches the expected application id)


## End-to-End (E2E) Testing with Cypress

### Overview
We use Cypress for end-to-end testing to ensure that the core use cases of the application work seamlessly from a user's perspective. Our tests simulate user interactions to cover navigation, shopping list management, and authentication flows. Synchronization features are currently excluded from testing as they are not yet fully implemented.

### Setup and Running Tests
Cypress was installed via NPM and the \package.json\ was updated with relevant scripts:

- \
pm run cypress:open\ - Opens the Cypress interactive Test Runner.
- \
pm run cypress:run\ - Runs the Cypress tests in headless mode (useful for CI/CD).

### Documented Use Cases

#### 1. Navigation (\cypress/e2e/navigation.cy.ts\)
**Goal:** Verify that the bottom navigation bar correctly routes the user between different pages.
- **Navigate to Groups**: Clicks the 'Groups' icon in the navigation bar and verifies that the URL changes to \/groups\.
- **Navigate to Settings**: Clicks the 'Settings' icon and verifies that the URL changes to \/settings\.
- **Navigate to Shopping List**: Clicks the 'List' icon from another page to ensure the user is routed back to \/list\.

#### 2. Shopping List (\cypress/e2e/shopping-list.cy.ts\)
**Goal:** Ensure users can manage items on their shopping list.
- **Display List**: Verifies that the initial shopping list UI and search input render correctly.
- **Open Add Item Modal**: Clicks the global add button to open the modal and verifies its visibility.
- **Add New Item**: Fills out the 'Add Item' form (name, quantity, size, info) and submits it. Verifies the newly created item appears in the list.
- **Delete Item**: Expands an existing item card and clicks the delete button, then verifies the item is removed from the DOM.

#### 3. Authentication (\cypress/e2e/authentication.cy.ts\)
**Goal:** Test the display and client-side validation of the login/register flows.
- **Display Login Page**: Verifies that the email input, password input, and login button render properly.
- **Validation Errors**: Triggers form submission or blur events on empty fields to ensure that the proper validation messages appear.
- **Navigate to Register**: Tests the link to switch from the login page to the registration screen.
- **Attempt Login**: Simulates an invalid user login to verify that an error message is returned from the system.


- **Filter by Search Query**: Verifies that typing a term into the search bar successfully filters the visible items down to those matching the criteria, and that a 'No Results' view is shown for non-existent items.
- **Filter by Category**: Ensures that assigning an item a category and clicking the matching category tab only shows items belonging to that category, and toggles back properly when clicked again.

- **Add directly from Search**: Ensures that when searching for an item that doesn't exist, clicking the 'Hinzufügen' fallback button auto-fills the queried string into the item creation modal.
