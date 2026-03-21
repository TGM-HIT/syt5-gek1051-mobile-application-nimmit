# Technologies and Architecture

This document describes the primary technologies used in Nimmit and details the usage, implementations, and roles of the core Angular components, services, and modules within the application.

## Core Technologies

### 1. Angular 21
Nimmit is built on the latest version of Angular, heavily utilizing new modern features:
- **Standalone Components:** All views and components avoid NgModules for improved developer experience and better tree-shaking. Bootstrap is configured directly via `bootstrapApplication`.

```typescript
// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
```

- **Signals:** Reactive state management across the app is implemented using Angular Signals (`signal`, `computed`, `effect`) ensuring optimized and clean reactivity without extensive `RxJS` boilerplate.
- **RxJS:** Retained for complex asynchronous flows, especially handling network calls and bridging streaming events with signals.

### 2. Capacitor 8
Capacitor forms the cross-platform mobile runtime. It bundles the compiled Angular standard web application.
- **Native Bridges:** Provides native bridging to the host SDK APIs like iOS / Android features.
- Enables building offline-first apps smoothly with local storage integrations that persist flawlessly on mobile devices.

### 3. Supabase
Supabase is used as the Backend-as-a-Service (BaaS) replacing traditional APIs.
- **Row Level Security (RLS) & Auth:** Nimmit relies securely on Supabase Auth.
- **Real-time Synchronization:** Manages synchronized cloud persistence of shopping lists across devices when online. 
- **Synchronization Details:** See [Synchronization Strategy](Synchronization.md).

### 4. TailwindCSS v4
Used for almost all styling needs through utility classes, resulting in rapid development and consistent UI. We integrate directly via `@tailwindcss/postcss`.

### 5. Lucide-Angular
A clean icon library delivering crisp SVGs directly into the Angular context via `lucide-angular`.

### 6. Vitest
Vitest powers all unit and component testing, providing high-performance headless runs and `lcov` coverage reporting.

---

## Application Structure

### Services
Services in Nimmit are organized as Singletons (`providedIn: 'root'`) and orchestrate business logic, data models, and API/external integrations.

#### `ShoppingListService` (`shopping-list.service.ts`)
The central core of the application managing all shopping list logic.
- **State Management:** Holds signals for `_items`, `_listName`, and `_listDescription`.
- **Features:** Integrates local storage (offline-first auto-save using `effect`) and dynamic calculations utilizing `computed`.

```typescript
// Example snippet from ShoppingListService
@Injectable({
  providedIn: 'root'
})
export class ShoppingListService {
  private readonly STORAGE_KEY = 'nimmit_shopping_list';
  private readonly _items = signal<ShoppingItem[]>([]);
  
  // Computed reactive state
  readonly items = this._items.asReadonly();
  readonly allCount = computed(() => this._items().length);
  readonly purchasedCount = computed(() => this._items().filter(i => i.purchased).length);

  constructor() {
    this.loadFromStorage();
    // Auto-save effect triggered anytime _items signals update
    effect(() => {
      this.saveToStorage(this._items());
    });
  }
}
```

#### `ThemeService` (`theme.service.ts`)
Controls user appearance preferences.
- Manages the `light`, `dark`, or `system` modes using signals.
- Evaluates system media queries (`(prefers-color-scheme: dark)`) in real-time.

```typescript
// Example snippet from ThemeService
export type Theme = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  readonly currentTheme = signal<Theme>('system');
  readonly isDarkMode = signal<boolean>(this.mediaQuery.matches);

  constructor() {
    this.mediaQuery.addEventListener('change', (e) => {
      if (this.currentTheme() === 'system') {
        this.isDarkMode.set(e.matches);
        this.applyTheme();
      }
    });
  }
}
```

#### `ModalService` (`modal.service.ts`)
Abstract and programmatic layout rendering mechanism for dialog windows without littering HTML.
- Manages an internal state configuration (the targeted component class, backdrops, and data injections).
- Generates `Promises` matching modal inputs and resolving with data when modals are closed by the user.

```typescript
// Example snippet from ModalService
export interface ModalConfig<T = any> {
  component: Type<any>;
  data?: T;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  private _activeModal = signal<ModalConfig | null>(null);
  readonly activeModal = this._activeModal.asReadonly();
  
  private resolvePromise: ((value: any) => void) | null = null;

  async open<R = any, T = any>(component: Type<any>, data?: T): Promise<R | undefined> {
    this._activeModal.set({ component, data });
    return new Promise((resolve) => {
      this.resolvePromise = resolve;
    });
  }

  close(result?: any) {
    if (this.resolvePromise) {
      this.resolvePromise(result);
      this.resolvePromise = null;
    }
    this._activeModal.set(null);
  }
}
```

#### `SupabaseService` (`supabase.ts`)
The API wrapper mediating all connectivity to the Supabase backend.
- Wraps the auth endpoints (Register, Login, Session Management).
- Performs relational queries fetching profiles and settings.

### Components
Nimmit leans on reusable standalone view components.

#### `ModalContainer` (`modal-container`)
A root-level overlay component.
- Consumes `ModalService`.
- Uses `NgComponentOutlet` to dynamically project other modal components on the fly based on the active state.

```typescript
// Example snippet from ModalContainer
@Component({
  selector: 'app-modal-container',
  standalone: true,
  imports: [NgComponentOutlet],
  template: `
    @if (modalConfig()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
           <ng-container *ngComponentOutlet="modalConfig()!.component"></ng-container>
        </div>
      </div>
    }
  `
})
export class ModalContainer {
  private modalService = inject(ModalService);
  modalConfig = this.modalService.activeModal;
}
```

#### `AddItemModal` (`add-item-modal`)
A projected modal dialog component for inputting cart items.
- Provides forms and model bindings for new `ShoppingItem`s (Name, Category, Units, Quantity).
- Injects `MODAL_DATA` token internally when spun up programmatically via `ModalService`.

#### `EditListModal` (`edit-list-modal`)
Projected modal dialog component used exclusively to define or rename the Shopping List metadata, capturing the title and description text.

### Pages (Routing Destinations)

#### `ShoppingList` (`shopping-list.ts`)
Main entry point for active lists. Directly loops over the reactive output from `ShoppingListService`, rendering actual items, search bars, and filtering buttons.

#### `Settings` (`settings.ts`)
Displays preferences for user adjustment, manipulating endpoints exposed via `ThemeService` and potentially `SupabaseService` auth profiles.

#### `Groups` (`groups.ts`)
The feature interface allowing users to group elements and manage multi-list allocations or collaborative sharing concepts.

### Authentication Modules (`/src/app/authentication`)
Organized flows strictly related to the user identity loop:
- **`Login`:** View for existing users to authenticate.
- **`Register`:** View for signing up securely against the Supabase DB.
- **`Account`:** Authenticated-only view handling user session teardown, profile visibility, and secure route restrictions.