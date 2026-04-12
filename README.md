![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22+-339933?logo=node.js&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwindcss&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor&logoColor=white)
![RxJS](https://img.shields.io/badge/RxJS-7-B7178C?logo=reactivex&logoColor=white)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-nimmit/blob/main/LICENSE)
[![Commits](https://img.shields.io/badge/Commits-open%20history-6e7781)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-nimmit/commits/main)
[![Issues](https://img.shields.io/badge/Issues-open%20tracker-6e7781)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-nimmit/issues)
[![CI](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-nimmit/actions/workflows/ci.yml/badge.svg?branch=main)](https://tgm-hit.github.io/syt5-gek1051-mobile-application-nimmit/reports/component-tests/index.html)
[![Coverage](.github/badges/coverage.svg)](https://tgm-hit.github.io/syt5-gek1051-mobile-application-nimmit/reports/coverage/index.html)

## CI Reports

- [Latest lint report artifact (lint-report)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-nimmit/actions/workflows/ci.yml)
- [Latest component test artifact (component-test-report)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-nimmit/actions/workflows/ci.yml)
- [Latest coverage artifact (coverage-report)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-nimmit/actions/workflows/coverage.yml)

Artifacts are generated automatically on every push and pull request run.

# Nimmit

A modern, offline-first mobile shopping list application built with Angular and Capacitor. Nimmit enables users to create, manage, and share shopping lists with automatic synchronization and conflict resolution.

## Features

- **Offline-First**: Use your shopping lists without internet connection
- **Real-Time Synchronization**: Automatic background sync when online
- **Conflict Resolution**: Smart conflict detection and resolution with push notifications
- **Multi-List Management**: Create and manage multiple shopping lists
- **Shared Lists**: Share lists with family and friends via unique codes
- **Quick Add**: Add items with a single tap
- **Search**: Fast search functionality to find items quickly
- **Smart Sorting**: Automatic categorization by store sections
- **Shopping Sessions**: Track purchases during shopping trips
- **Cross-Platform**: Available for iOS and Android

## Tech Stack

This project uses Angular 21 with Capacitor 8 for cross-platform mobile development. For a complete overview of the technology stack, see [DOCS/Techstack.md](DOCS/Techstack.md).
For a detailed architecture and implementation guide with code snippets, see [Technical Documentation](DOCS/Technologies.md).

**Key Technologies:**
- Angular 21 + TypeScript
- Capacitor (iOS & Android)
- Supabase (Backend & Authentication)
- Tailwind CSS
- RxJS
- Bluetooth LE for local synchronization

## Prerequisites

- Node.js 18+ and npm 11.8+
- Angular CLI
- For iOS development: Xcode
- For Android development: Android Studio

## Testing

For instructions on running tests, generating coverage, and running ESLint, see [DOCS/Testing.md](DOCS/Testing.md).

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/TGM-HIT/syt5-gek1051-mobile-application-nimmit.git
   cd syt5-gek1051-mobile-application-nimmit
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Supabase:
   - Set up your Supabase project
   - Update configuration files with your Supabase credentials

## Running the Application

### Web Development
```bash
npm start
```
The application will be available at `http://localhost:4200`

### Mobile Platforms

#### iOS
```bash
npm run cap:sync
npm run cap:open:ios
```

#### Android
```bash
npm run cap:sync
npm run cap:open:android
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run unit tests
- `npm run test:component` - Run component tests in CI mode
- `npm run test:coverage` - Run tests with coverage output
- `npm run lint` - Run ESLint checks
- `npm run lint:fix` - Run ESLint and apply automatic fixes
- `npm run cap:sync` - Sync web assets with native platforms
- `npm run cap:run:ios` - Build and run on iOS device/simulator
- `npm run cap:run:android` - Build and run on Android device/emulator

## Project Structure

```
src/
├── app/
│   ├── components/      # Reusable UI components
│   ├── models/          # Data models and interfaces
│   ├── navigation/      # Navigation component
│   ├── pages/           # Application pages
│   │   ├── groups/      # Group management
│   │   ├── settings/    # User settings
│   │   └── shopping-list/ # Shopping list views
│   └── services/        # Business logic and API services
├── styles.scss          # Global styles
└── main.ts             # Application entry point
```

## Documentation

- [User Stories](DOCS/STORIES.md)
- [Testing & Linting](DOCS/Testing.md)
- [Tech Stack Details](DOCS/Techstack.md)
- [Technical Documentation](DOCS/Technologies.md)
- [Supabase CLI Guide](DOCS/Supabase-cli.md)
- [Synchronization Strategy](DOCS/Synchronization.md)
- [Contributing Guidelines](CONTRIBUTING.md)

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Team

**Class 5BHIT**

- **Product Owner**: Felix Schmid
- **Technical Architect**: Franz Puerto
- **Developer**: Karol Gradkowski
- **Developer**: Georg Sinakijevic

## License

This project is licensed under the terms specified in [LICENSE](LICENSE).

---

*Mobile Application Development Project - TGM Wien*
