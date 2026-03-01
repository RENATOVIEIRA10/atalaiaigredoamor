/**
 * Helpers for Supabase queries that may exceed the 1000-row default limit.
 */

import { supabase } from '@/integrations/supabase/client';

const PAGE_SIZE = 1000;
const IN_CHUNK_SIZE = 500;

/**
 * Fetch all rows from a table, paginating automatically.
 */
export async function fetchAllRows<T = any>(
  tableName: string,
  selectClause: string,
  filters?: (query: any) => any
): Promise<T[]> {
  const allRows: T[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    let query = (supabase.from as any)(tableName).select(selectClause).range(offset, offset + PAGE_SIZE - 1);
    if (filters) query = filters(query);

    const { data, error } = await query;
    if (error) { console.error(`[fetchAllRows] ${tableName}:`, error); break; }

    const rows = (data || []) as T[];
    allRows.push(...rows);
    hasMore = rows.length >= PAGE_SIZE;
    offset += PAGE_SIZE;
  }

  return allRows;
}

/**
 * Execute a query with `.in()` filter, splitting into batches.
 */
export async function batchedInQuery<T = any>(
  tableName: string,
  selectClause: string,
  inColumn: string,
  inValues: string[],
  extraFilters?: (query: any) => any
): Promise<T[]> {
  if (inValues.length === 0) return [];

  const allRows: T[] = [];
  
  for (let i = 0; i < inValues.length; i += IN_CHUNK_SIZE) {
    const chunk = inValues.slice(i, i + IN_CHUNK_SIZE);
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      let query = (supabase.from as any)(tableName)
        .select(selectClause)
        .in(inColumn, chunk)
        .range(offset, offset + PAGE_SIZE - 1);
      if (extraFilters) query = extraFilters(query);

      const { data, error } = await query;
      if (error) { console.error(`[batchedInQuery] ${tableName}:`, error); break; }

      const rows = (data || []) as T[];
      allRows.push(...rows);
      hasMore = rows.length >= PAGE_SIZE;
      offset += PAGE_SIZE;
    }
  }

  return allRows;
}
