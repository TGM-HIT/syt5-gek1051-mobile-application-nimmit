# Synchronization (PowerSync & Supabase)

## Summary

Nimmit is built **offline-first** using **PowerSync**. Unlike traditional REST-based sync, PowerSync provides a real-time, bidirectional synchronization layer between a local SQLite database and Supabase (Postgres). 

The core principle remains: **Read and write locally first, synchronize automatically in the background.**

![PowerSync Architecture](../powersync-approach.avif)

## Architecture

The synchronization architecture consists of three main components:

1.  **Local Database (PowerSync SDK):** A WASM-based SQLite database running in the browser (using OPFS for persistence). The app interacts only with this local database.
2.  **PowerSync Service:** A cloud middleware that monitors Supabase (Postgres) for changes and streams them to the client. It also handles the filtering of data based on sync rules (Sync Streams).
3.  **Supabase Backend:** The source of truth where data is persisted in Postgres and authenticated via Supabase Auth.

## Data Flow

### 1) Local-First Usage
All UI components use the `PowerSyncService` to query and mutate data. 
- **Queries:** Performed against the local SQLite DB, providing instant feedback.
- **Mutations:** Changes are written to a local "upload queue" within the SQLite DB and applied immediately to the local state.

### 2) Pull Strategy (Streaming Down)
PowerSync uses a streaming approach. Instead of periodic polling or manual "pulling," the PowerSync Service pushes changes from Supabase to the local database in real-time.
- Defined Sync Streams (e.g., `watch_lists`, `watch_items`) ensure the user only receives data they are authorized to see (based on RLS and Sync Rules).
- Data is available immediately upon app start, with incremental updates applied as they occur on the server.

### 3) Push Strategy (Uploading Up)
Local changes are processed by the `SupabaseConnector.uploadData` method:
- PowerSync maintains a transaction log of local changes.
- The `uploadData` callback iterates through these transactions and uses the `SupabaseClient` to perform `upsert`, `update`, or `delete` operations on the Postgres tables.
- If a push fails (e.g., due to network issues), PowerSync automatically retries with exponential backoff.

## Conflict Handling

PowerSync handles most synchronization complexities:
- **Last-Write-Wins:** By default, the latest update to a record (or field) is preserved.
- **Transactional Integrity:** Changes made within a single transaction locally are pushed as a unit.
- **Fatal Errors:** Errors like RLS violations (42501) or integrity constraint violations (23xxx) are caught in `uploadData`, where the failing transaction can be discarded or logged to prevent blocking the sync queue.

## Offline & Authentication Flow

Nimmit supports a seamless transition from anonymous offline usage to authenticated synchronization:

1.  **Anonymous Mode:** On first launch, a local `nimmit_user_id` is generated and stored in `localStorage`. All data created is associated with this ID.
2.  **Sign In:** When the user logs in via Supabase Auth:
    -   The `PowerSyncService` detects the session change.
    -   Local data associated with the anonymous ID is migrated to the Supabase `user.id`.
    -   The `PowerSyncDatabase` connects to the PowerSync Service using the Supabase JWT.
3.  **Synchronization Start:** Once connected, PowerSync performs an initial sync to download server data and begins uploading any pending local changes.

## Synchronized Tables

The current schema (`publicSchema`) synchronizes the following tables:
- `Lists`: Shopping lists metadata.
- `ListItem`: Junction table for items within a list, including amounts and status.
- `Item`: Global or user-specific item definitions.
- `Category`: Item categories.
- `Favorites`: User-specific favorite items.
- `UserLists`: Shared access definitions for lists.

