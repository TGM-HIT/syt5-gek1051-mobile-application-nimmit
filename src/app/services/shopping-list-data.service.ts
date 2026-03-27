import { Injectable, inject } from '@angular/core';
import { PowerSyncService, USER_ID_PLACEHOLDER } from './powersync';
import { Category } from '../types';

export interface ListInfo {
  name: string;
  description: string;
}

export type Unit =
  | 'Einheit'
  | 'g'
  | 'dag'
  | 'kg'
  | 'mL'
  | 'L'
  | 'Flasche'
  | 'Kiste'
  | 'Dose'
  | 'Packung';

export type Currency = 'Euro' | 'CHF' |'USD';

export interface ShoppingItemRow {
  id: string;
  itemId: number;
  name: string;
  category: string;
  totalQuantity: number;
  purchasedQuantity: number;
  info?: string;
  size?: number;
  unit?: Unit;
  createdAt: string;
  updatedAt: string;
  price?: number;
  currency?: Currency;
}

export interface UpsertListItemInput {
  name: string;
  category: string;
  quantity: number;
  info?: string;
  size?: number;
  unit: Unit;
}

interface WatchResult<T> {
  rows?: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class ShoppingListDataService {
  private readonly powerSync = inject(PowerSyncService);

  async getLatestListIdForUser(userId: string | null): Promise<bigint | null> {

    const sql = `
      SELECT l.id
      FROM "UserLists" ul
      JOIN "Lists" l ON l.id = ul.list
      WHERE ul."user" = ?
      ORDER BY l.created_at DESC
      LIMIT 1
    `;
    if (!userId) {
      // eslint-disable-next-line no-param-reassign
      userId = USER_ID_PLACEHOLDER;
    }
    const result = await this.powerSync.execute(sql, [userId]);
    const rows = this.toRows<{ id: bigint }>(result.rows);
    return rows[0]?.id ?? null;
  }

  async *watchListInfo(listId: number): AsyncIterable<ListInfo> {

    const sql = `
      SELECT name, COALESCE(description, '') AS description
      FROM "Lists"
      WHERE id = ?
      LIMIT 1
    `;

    for await (const result of this.powerSync.db.watch(sql, [listId])) {
      const rows = this.toRows<ListInfo>((result as WatchResult<ListInfo>).rows);
      const info = rows[0];
      if (info) {
        yield info;
      }
    }
  }

  async *watchItems(listId: bigint): AsyncIterable<ShoppingItemRow[]> {
    const sql = `
      SELECT
        li.id,
        li.item AS itemId,
        i.name,
        COALESCE(c.name, 'Sonstiges') AS category,
        li.target_amount AS totalQuantity,
        li.curr_amount AS purchasedQuantity,
        i.description AS info,
        i.content AS size,
        li.amount_unit AS unit,
        li.created_at AS createdAt,
        li.updated_at AS updatedAt
      FROM "ListItem" li
      JOIN "Item" i ON i.id = li.item
      LEFT JOIN "Category" c ON c.id = i.category
      WHERE li.liste = ?
      ORDER BY li.created_at ASC
    `;

    for await (const result of this.powerSync.db.watch(sql, [listId])) {
      const rows = this.toRows<ShoppingItemRow>((result as WatchResult<ShoppingItemRow>).rows);
      yield rows;
    }
  }

  async listExists(listId: bigint): Promise<boolean> {
    const sql = `
      SELECT 1 as "exists"
      FROM "Lists" l
      INNER JOIN "UserLists" ul ON ul.list = l.id
      WHERE l.id = ? AND 
      ul."user" = ?
      LIMIT 1
    `;
    const result = await this.powerSync.get<{exists: number}>(sql, [listId, USER_ID_PLACEHOLDER]);
    return result.exists === 1;
  }

  async getGlobalItemFromItem(itemId: bigint): Promise<{ name: string, category: string } | null> {
    const sql = `
      SELECT name, COALESCE((SELECT name FROM "Category" WHERE id = i.category), 'Sonstiges') AS category
      FROM "Item" i
      WHERE i.id = ? AND i.global = 1
      LIMIT 1
    `;

    const result = await this.powerSync.execute(sql, [itemId]);
    const rows = this.toRows<{ name: string, category: string }>(result.rows);
    return rows[0] ?? null;
  }

  async addItemToList(listId: bigint, payload: UpsertListItemInput, userId: string | null): Promise<void> {
    const newItemId = await this.createItem(payload, userId);
    const compKey = `${listId}|${newItemId}`

    await this.powerSync.execute(
      `
      INSERT INTO "ListItem"
        (id, liste, item, created_at, updated_at, curr_amount, target_amount, amount_unit)
      VALUES
        (?, ?, ?, datetime(), datetime(), 0, ?, ?)
      `,
      [compKey, listId, newItemId, payload.quantity, payload.unit]
    );
  }

  async updateItemInList(listItemId: string, itemId: number, payload: UpsertListItemInput): Promise<void> {
    const categoryId = await this.getOrCreateCategoryId(payload.category);

    await this.execute(
      `
      UPDATE "Item"
      SET name = ?,
          category = ?,
          content = ?,
          description = ?
      WHERE id = ?
      `,
      [payload.name, categoryId, payload.size ?? null, payload.info ?? null, itemId]
    );

    await this.execute(
      `
      UPDATE "ListItem"
      SET target_amount = ?,
          amount_unit = ?,
          curr_amount = CASE
            WHEN curr_amount > ? THEN ?
            ELSE curr_amount
          END,
          updated_at = datetime()
      WHERE id = ?
      `,
      [payload.quantity, payload.unit, payload.quantity, payload.quantity, listItemId]
    );
  }

  async updateListInfo(listId: bigint, name: string, description: string): Promise<void> {
    await this.execute(
      `
      UPDATE "Lists"
      SET name = ?, description = ?
      WHERE id = ?
      `,
      [name, description || null, listId]
    );
  }

  async deleteList(listId: bigint): Promise<void> {
    // Remove child rows first to avoid FK violations when constraints are present.
    await this.execute(`DELETE FROM "ListItem" WHERE liste = ?`, [listId]);
    await this.execute(`DELETE FROM "UserLists" WHERE list = ?`, [listId]);
    await this.execute(`DELETE FROM "Lists" WHERE id = ?`, [listId]);
  }

  async setPurchasedQuantity(listItemId: string, quantity: number): Promise<void> {
    await this.execute(
      `
      UPDATE "ListItem"
      SET curr_amount = ?,
          updated_at = datetime()
      WHERE id = ?
      `,
      [quantity, listItemId]
    );
  }

  async deleteListItem(listItemId: string): Promise<void> {
    await this.execute(`DELETE FROM "ListItem" WHERE id = ?`, [listItemId]);
  }

  private async execute(sql: string, parameters: unknown[] = []): Promise<void> {
    await this.powerSync.execute(sql, parameters);
  }

  private toRows<T>(rows: unknown): T[] {
    if (Array.isArray(rows)) {
      return rows as T[];
    }

    if (rows && typeof rows === 'object') {
      const maybeArray = Reflect.get(rows, '_array');
      if (Array.isArray(maybeArray)) {
        return maybeArray as T[];
      }
    }

    return [];
  }

  public async getCategories(): Promise<Category[]> {
    const sql = `SELECT id, name, created_at FROM "Category" ORDER BY name ASC`;
    const result = await this.powerSync.db.getAll<Category>(sql);
    return result
  }

  private async getOrCreateCategoryId(categoryName: string): Promise<number> {
    const selectResult = await this.powerSync.get<{id: number}>(
      `SELECT id FROM "Category" WHERE name = ? LIMIT 1`,
      [categoryName]
    );

    if (selectResult.id) {
      return selectResult.id;
    }

    throw new Error('Kategorie konnte nicht gefunden werden.');
  }

  private async createItem(payload: UpsertListItemInput, userId: string | null): Promise<number> {

    const categoryId = await this.getOrCreateCategoryId(payload.category);
    if (!userId) {
      // eslint-disable-next-line no-param-reassign
      userId = USER_ID_PLACEHOLDER;
    }
    console.warn("Creating item with category ID:", categoryId, "for user:", userId, "with payload:", payload);
    const resp = await this.powerSync.execute(
      `
      INSERT INTO "Item"
        (id, created_at, name, category, content, description, global, user)
      VALUES
        (cast(ABS(RANDOM()) as text), datetime(), ?, ?, ?, ?, 0, ?) RETURNING id
      `,
      [payload.name, categoryId, payload.size ?? null, payload.info ?? null, userId]
    );

    const rows = this.toRows<{ id: number }>(resp.rows);
    if (!rows[0]?.id) {
      throw new Error('Item konnte nicht erstellt werden.');
    }

    return rows[0].id;
  }
}