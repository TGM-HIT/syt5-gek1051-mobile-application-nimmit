import { Injectable, inject } from '@angular/core';
import { PowerSyncService, USER_ID_PLACEHOLDER } from './powersync';

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
      SELECT l.li_id
      FROM "UserLists" ul
      JOIN "Lists" l ON l.li_id = ul.list
      WHERE ul."user" = ?
      ORDER BY l.created_at DESC
      LIMIT 1
    `;
    if (!userId) {
      // eslint-disable-next-line no-param-reassign
      userId = USER_ID_PLACEHOLDER;
    }
    const result = await this.powerSync.execute(sql, [userId]);
    const rows = this.toRows<{ li_id: bigint }>(result.rows);
    return rows[0]?.li_id ?? null;
  }

  async *watchListInfo(listId: number): AsyncIterable<ListInfo> {

    const sql = `
      SELECT name, COALESCE(description, '') AS description
      FROM "Lists"
      WHERE li_id = ?
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

  async *watchItems(listId: number): AsyncIterable<ShoppingItemRow[]> {
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
      FROM "ListItems" li
      JOIN "Item" i ON i.i_id = li.item
      LEFT JOIN "Category" c ON c.c_id = i.category
      WHERE li.liste = ?
      ORDER BY li.created_at ASC
    `;

    for await (const result of this.powerSync.db.watch(sql, [listId])) {
      const rows = this.toRows<ShoppingItemRow>((result as WatchResult<ShoppingItemRow>).rows);
      yield rows;
    }
  }

  async getGlobalItemFromItem(itemId: number): Promise<{ name: string, category: string } | null> {
    const sql = `
      SELECT name, COALESCE((SELECT name FROM "Category" WHERE c_id = i.category), 'Sonstiges') AS category
      FROM "Item" i
      WHERE i.i_id = ? AND i.global = 1
      LIMIT 1
    `;

    const result = await this.powerSync.execute(sql, [itemId]);
    const rows = this.toRows<{ name: string, category: string }>(result.rows);
    return rows[0] ?? null;
  }

  async addItemToList(listId: bigint, payload: UpsertListItemInput, userId: string | null): Promise<void> {
    const newItemId = await this.createItem(payload, userId);

    const resp = await this.powerSync.execute(
      `
      INSERT INTO "ListItems"
        (id, liste, item, created_at, updated_at, curr_amount, target_amount, amount_unit)
      VALUES
        (uuid(), ?, ?, datetime(), datetime(), 0, ?, ?)
        RETURNING *
      `,
      [listId, newItemId, payload.quantity, payload.unit]
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
      WHERE i_id = ?
      `,
      [payload.name, categoryId, payload.size ?? null, payload.info ?? null, itemId]
    );

    await this.execute(
      `
      UPDATE "ListItems"
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
      WHERE li_id = ?
      `,
      [name, description || null, listId]
    );
  }

  async setPurchasedQuantity(listItemId: string, quantity: number): Promise<void> {
    await this.execute(
      `
      UPDATE "ListItems"
      SET curr_amount = ?,
          updated_at = datetime()
      WHERE id = ?
      `,
      [quantity, listItemId]
    );
  }

  async deleteListItem(listItemId: string): Promise<void> {
    await this.execute(`DELETE FROM "ListItems" WHERE id = ?`, [listItemId]);
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

  private async getOrCreateCategoryId(categoryName: string): Promise<number> {

    const selectResult = await this.powerSync.db.execute(
      `SELECT c_id FROM "Category" WHERE name = ? LIMIT 1`,
      [categoryName]
    );

    const existingRows = this.toRows<{ c_id: number }>(selectResult.rows);
    if (existingRows[0]?.c_id) {
      return existingRows[0].c_id;
    }

    await this.execute(
      `INSERT INTO "Category" (id, c_id, created_at, name) VALUES (uuid(), ABS(RANDOM()), datetime(), ?)`,
      [categoryName]
    );

    const createdResult = await this.powerSync.db.execute(
      `SELECT c_id FROM "Category" WHERE name = ? ORDER BY c_id DESC LIMIT 1`,
      [categoryName]
    );

    const createdRows = this.toRows<{ c_id: number }>(createdResult.rows);
    if (!createdRows[0]?.c_id) {
      throw new Error('Kategorie konnte nicht erstellt werden.');
    }

    return createdRows[0].c_id;
  }

  private async createItem(payload: UpsertListItemInput, userId: string | null): Promise<number> {

    const categoryId = await this.getOrCreateCategoryId(payload.category);
    if (!userId) {
      // eslint-disable-next-line no-param-reassign
      userId = USER_ID_PLACEHOLDER;
    }
    const resp = await this.powerSync.execute(
      `
      INSERT INTO "Item"
        (id, i_id, created_at, name, category, content, description, global, user)
      VALUES
        (uuid(), ABS(RANDOM()), datetime(), ?, ?, ?, ?, 0, ?) RETURNING i_id
      `,
      [payload.name, categoryId, payload.size ?? null, payload.info ?? null, userId]
    );

    const rows = this.toRows<{ i_id: number }>(resp.rows);
    if (!rows[0]?.i_id) {
      throw new Error('Item konnte nicht erstellt werden.');
    }

    return rows[0].i_id;
  }
}