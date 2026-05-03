"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Printer, Search } from "lucide-react";
import { escapeHtml, printHtml } from "@/lib/print";

type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
};

export function DataTable<T extends { id: number }>({
  rows,
  columns,
  searchPlaceholder = "Filter records"
}: {
  rows: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filteredRows = useMemo(() => {
    const cleanQuery = query.toLowerCase().trim();
    const filtered = cleanQuery
      ? rows.filter((row) => JSON.stringify(row).toLowerCase().includes(cleanQuery))
      : rows;

    if (!sortKey) return filtered;

    return [...filtered].sort((a, b) => {
      const aValue = String((a as Record<string, unknown>)[sortKey] ?? "");
      const bValue = String((b as Record<string, unknown>)[sortKey] ?? "");
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });
  }, [query, rows, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  function printFilteredRows() {
    const printableColumns = columns.filter((column) => String(column.key) !== "actions");
    const header = printableColumns.map((column) => `<th>${escapeHtml(column.header)}</th>`).join("");
    const body = filteredRows
      .map((row) => {
        const cells = printableColumns
          .map((column) => `<td>${escapeHtml((row as Record<string, unknown>)[String(column.key)])}</td>`)
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");

    printHtml(
      "Selected Results",
      `<p>${filteredRows.length} filtered records</p><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            className="pl-9"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <span>{filteredRows.length} records</span>
          <button
            className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-3 py-2 font-semibold text-stone-700 hover:bg-stone-50"
            onClick={printFilteredRows}
            type="button"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <select className="w-28" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
              <tr>
                {columns.map((column) => (
                  <th key={String(column.key)} className="px-4 py-3">
                    {column.sortable ? (
                      <button className="inline-flex items-center gap-1" onClick={() => toggleSort(String(column.key))}>
                        {column.header}
                        <ArrowDownUp className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {paginatedRows.map((row) => (
                <tr key={row.id} className="hover:bg-stone-50">
                  {columns.map((column) => (
                    <td key={String(column.key)} className="px-4 py-3 text-stone-700">
                      {column.render ? column.render(row) : String((row as Record<string, unknown>)[String(column.key)] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
              {!filteredRows.length ? (
                <tr>
                  <td className="px-4 py-8 text-center text-stone-500" colSpan={columns.length}>
                    No records found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm shadow-soft md:flex-row md:items-center md:justify-between">
        <p className="text-stone-600">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            className="rounded-md border border-stone-200 px-3 py-1.5 font-semibold text-stone-700 disabled:opacity-50"
            disabled={page === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </button>
          <button
            className="rounded-md border border-stone-200 px-3 py-1.5 font-semibold text-stone-700 disabled:opacity-50"
            disabled={page === totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
