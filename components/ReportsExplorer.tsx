"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Printer, Search } from "lucide-react";
import { money, percent } from "@/lib/format";
import { escapeHtml, printHtml } from "@/lib/print";

type ReportEmployee = {
  assignmentId: number;
  employeeId: number;
  employeeName: string;
  epfNumber: string;
  roleId: number;
  roleName: string;
  rolePercentage: number;
  calculatedAmount: number;
};

type ReportSection = {
  productSectionId: number;
  sectionId: number;
  sectionName: string;
  sectionPercentage: number;
  sectionAmount: number;
  employees: ReportEmployee[];
};

type ReportProduct = {
  id: number;
  itemCode: string;
  itemName: string;
  revenue: number;
  createdAt: string;
  createdAtDisplay: string;
  sections: ReportSection[];
};

export function ReportsExplorer({
  products,
  filterOptions
}: {
  products: ReportProduct[];
  filterOptions: {
    products: { id: number; label: string }[];
    employees: { id: number; label: string }[];
    sections: { id: number; label: string }[];
    roles: { id: number; label: string }[];
  };
}) {
  const [query, setQuery] = useState("");
  const [productId, setProductId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);

  const filteredProducts = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    const fromTime = dateFrom ? new Date(dateFrom).getTime() : null;
    const toTime = dateTo ? new Date(dateTo).getTime() : null;

    return products
      .map((product) => {
        const productTime = new Date(product.createdAt).getTime();
        const dateMatches = (!fromTime || productTime >= fromTime) && (!toTime || productTime <= toTime);
        const productMatches = cleanQuery
          ? [product.itemCode, product.itemName, product.createdAtDisplay].some((value) => value.toLowerCase().includes(cleanQuery))
          : false;

        const sections = product.sections
          .map((section) => {
            const sectionMatches = cleanQuery ? section.sectionName.toLowerCase().includes(cleanQuery) : false;

            const employees = section.employees.filter((employee) => {
              const employeeMatches =
                !cleanQuery ||
                productMatches ||
                sectionMatches ||
                [
                  employee.employeeName,
                  employee.epfNumber,
                  employee.roleName,
                  String(employee.assignmentId),
                  `distribution ${employee.assignmentId}`
                ].some((value) => value.toLowerCase().includes(cleanQuery));

              return (
                employeeMatches &&
                (!employeeId || employee.employeeId === Number(employeeId)) &&
                (!roleId || employee.roleId === Number(roleId))
              );
            });

            const shouldKeepSection =
              (!sectionId || section.sectionId === Number(sectionId)) &&
              (!cleanQuery || sectionMatches || productMatches || employees.length > 0) &&
              (!employeeId && !roleId ? true : employees.length > 0);

            return shouldKeepSection ? { ...section, employees } : null;
          })
          .filter((section): section is ReportSection => Boolean(section));

        const childFiltersActive = Boolean(employeeId || sectionId || roleId);
        const shouldKeepProduct =
          (!productId || product.id === Number(productId)) &&
          dateMatches &&
          (!cleanQuery || productMatches || sections.length > 0) &&
          (!childFiltersActive || sections.length > 0);

        return shouldKeepProduct ? { ...product, sections } : null;
      })
      .filter((product): product is ReportProduct => Boolean(product));
  }, [dateFrom, dateTo, employeeId, productId, products, query, roleId, sectionId]);

  const totals = filteredProducts.reduce(
    (summary, product) => {
      summary.revenue += product.revenue;
      for (const section of product.sections) {
        summary.sectionAmount += section.sectionAmount;
        for (const employee of section.employees) {
          summary.employeeAmount += employee.calculatedAmount;
        }
      }
      return summary;
    },
    { revenue: 0, sectionAmount: 0, employeeAmount: 0 }
  );
  const totalAmount = totals.employeeAmount;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
    setExpandedProductId(null);
  }, [dateFrom, dateTo, employeeId, productId, query, roleId, sectionId]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function printFilteredReport() {
    const productSections = filteredProducts
      .map((product) => {
        const sections = product.sections
          .map((section) => {
            const employees = section.employees
              .map(
                (employee) => `
                  <tr>
                    <td>#${escapeHtml(employee.assignmentId)}</td>
                    <td>${escapeHtml(employee.employeeName)}</td>
                    <td>${escapeHtml(employee.epfNumber)}</td>
                    <td>${escapeHtml(employee.roleName)}</td>
                    <td>${escapeHtml(percent(employee.rolePercentage))}</td>
                    <td>${escapeHtml(money(employee.calculatedAmount))}</td>
                  </tr>
                `
              )
              .join("");

            return `
              <h2>${escapeHtml(section.sectionName)} - ${escapeHtml(percent(section.sectionPercentage))} - ${escapeHtml(money(section.sectionAmount))}</h2>
              <table>
                <thead>
                  <tr><th>Distribution</th><th>Employee</th><th>EPF</th><th>Role</th><th>Employee %</th><th>Amount</th></tr>
                </thead>
                <tbody>${employees || `<tr><td colspan="6">No employee assignments match these filters.</td></tr>`}</tbody>
              </table>
            `;
          })
          .join("");

        return `
          <h2>${escapeHtml(product.itemCode)} - ${escapeHtml(product.itemName)} - ${escapeHtml(money(product.revenue))}</h2>
          <p>Product date/time: ${escapeHtml(product.createdAtDisplay)}</p>
          ${sections || `<p>No distribution saved for this product.</p>`}
        `;
      })
      .join("");

    printHtml(
      "Revenue Distribution Report",
      `
        <div class="summary">
          <div><strong>Revenue</strong><br>${escapeHtml(money(totals.revenue))}</div>
          <div><strong>Section Amount</strong><br>${escapeHtml(money(totals.sectionAmount))}</div>
          <div><strong>Employee Earnings</strong><br>${escapeHtml(money(totals.employeeAmount))}</div>
          <div><strong>Total Amount</strong><br>${escapeHtml(money(totalAmount))}</div>
        </div>
        <p>Date/time from: ${escapeHtml(dateFrom || "Any")} | Date/time to: ${escapeHtml(dateTo || "Any")}</p>
        <p>${filteredProducts.length} filtered products</p>
        ${productSections || "<p>No report records match these filters.</p>"}
      `
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-forest" />
          <h2 className="text-lg font-bold text-ink">Report Filters</h2>
          <button
            className="ml-auto inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            type="button"
            onClick={printFilteredReport}
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product, employee, distribution, role, section"
            />
          </div>
          <select value={productId} onChange={(event) => setProductId(event.target.value)}>
            <option value="">All products</option>
            {filterOptions.products.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
            <option value="">All employees</option>
            {filterOptions.employees.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <select value={sectionId} onChange={(event) => setSectionId(event.target.value)}>
            <option value="">All sections</option>
            {filterOptions.sections.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <select value={roleId} onChange={(event) => setRoleId(event.target.value)}>
            <option value="">All roles</option>
            {filterOptions.roles.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <div>
            <label>From date/time</label>
            <input className="mt-1.5" type="datetime-local" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </div>
          <div>
            <label>To date/time</label>
            <input className="mt-1.5" type="datetime-local" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </div>
          <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
            <option value={5}>5 products / page</option>
            <option value={10}>10 products / page</option>
            <option value={25}>25 products / page</option>
            <option value={50}>50 products / page</option>
          </select>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-md bg-stone-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Revenue</p>
            <p className="mt-1 text-lg font-bold text-ink">{money(totals.revenue)}</p>
          </div>
          <div className="rounded-md bg-stone-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Section Amount</p>
            <p className="mt-1 text-lg font-bold text-ink">{money(totals.sectionAmount)}</p>
          </div>
          <div className="rounded-md bg-stone-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Employee Earnings</p>
            <p className="mt-1 text-lg font-bold text-forest">{money(totals.employeeAmount)}</p>
          </div>
          <div className="rounded-md bg-stone-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Total Amount</p>
            <p className="mt-1 text-lg font-bold text-forest">{money(totalAmount)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm shadow-soft md:flex-row md:items-center md:justify-between">
        <p className="text-stone-600">
          Showing {paginatedProducts.length} of {filteredProducts.length} products. Page {page} of {totalPages}.
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

      {paginatedProducts.map((product) => {
        const employeeCount = product.sections.reduce((sum, section) => sum + section.employees.length, 0);
        const isExpanded = expandedProductId === product.id;

        return (
        <div key={product.id} className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
          <button
            className="flex w-full flex-col gap-3 text-left md:flex-row md:items-center md:justify-between"
            onClick={() => setExpandedProductId((current) => (current === product.id ? null : product.id))}
          >
            <div>
              <h2 className="text-lg font-bold text-ink">{product.itemName}</h2>
              <p className="text-sm text-stone-500">
                {product.itemCode} - {product.createdAtDisplay} - {product.sections.length} sections - {employeeCount} employees
              </p>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-lg font-bold text-forest">{money(product.revenue)}</p>
              <span className="rounded-md border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600">
                {isExpanded ? "Hide" : "View"}
              </span>
            </div>
          </button>

          {isExpanded ? <div className="mt-4 space-y-4 border-t border-stone-100 pt-4">
            {product.sections.map((section) => (
              <div key={section.productSectionId} className="rounded-lg bg-stone-50 p-4">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <h3 className="font-bold text-ink">{section.sectionName}</h3>
                  <p className="text-sm font-semibold text-stone-600">
                    {percent(section.sectionPercentage)} - {money(section.sectionAmount)}
                  </p>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wide text-stone-500">
                      <tr>
                        <th className="py-2 pr-4">Distribution</th>
                        <th className="py-2 pr-4">Employee</th>
                        <th className="py-2 pr-4">EPF</th>
                        <th className="py-2 pr-4">Role</th>
                        <th className="py-2 pr-4">Employee %</th>
                        <th className="py-2 pr-4">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.employees.map((employee) => (
                        <tr key={employee.assignmentId} className="border-t border-stone-200">
                          <td className="py-2 pr-4">#{employee.assignmentId}</td>
                          <td className="py-2 pr-4">{employee.employeeName}</td>
                          <td className="py-2 pr-4">{employee.epfNumber}</td>
                          <td className="py-2 pr-4">{employee.roleName}</td>
                          <td className="py-2 pr-4">{percent(employee.rolePercentage)}</td>
                          <td className="py-2 pr-4 font-semibold text-forest">{money(employee.calculatedAmount)}</td>
                        </tr>
                      ))}
                      {!section.employees.length ? (
                        <tr>
                          <td className="py-3 text-stone-500" colSpan={6}>
                            No employee assignments match these filters.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {!product.sections.length ? <p className="text-sm text-stone-500">No distribution saved for this product.</p> : null}
          </div> : null}
        </div>
      );
      })}
      {!filteredProducts.length ? (
        <p className="rounded-lg border border-stone-200 bg-white p-6 text-sm text-stone-500">No report records match these filters.</p>
      ) : null}
    </div>
  );
}
