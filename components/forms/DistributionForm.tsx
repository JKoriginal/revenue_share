"use client";

import { useMemo, useState, useTransition } from "react";
import { Calculator, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { money } from "@/lib/format";

type Product = { id: number; itemCode: string; itemName: string; revenue: number };
type Section = { id: number; name: string };
type Employee = { id: number; name: string; epfNumber: string; sectionId: number; roleName: string };

type SectionDraft = {
  sectionId: number;
  percentage: number;
  employees: { employeeId: number; rolePercentage: number }[];
};

export function DistributionForm({
  products,
  sections,
  employees,
  savedDistributions
}: {
  products: Product[];
  sections: Section[];
  employees: Employee[];
  savedDistributions: { productId: number; sections: SectionDraft[] }[];
}) {
  const [productId, setProductId] = useState(products[0]?.id || 0);
  const [draft, setDraft] = useState<SectionDraft[]>(() => savedDistributions.find((item) => item.productId === products[0]?.id)?.sections || []);
  const [sectionQuery, setSectionQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const product = products.find((item) => item.id === productId);
  const hasSavedDistribution = Boolean(savedDistributions.find((item) => item.productId === productId)?.sections.length);
  const preview = useMemo(() => {
    if (!product) return [];
    return draft.flatMap((sectionDraft) => {
      const section = sections.find((item) => item.id === sectionDraft.sectionId);
      const sectionAmount = product.revenue * (sectionDraft.percentage / 100);
      return sectionDraft.employees.map((employeeDraft) => {
        const employee = employees.find((item) => item.id === employeeDraft.employeeId);
        return {
          sectionName: section?.name || "",
          employeeName: employee?.name || "",
          roleName: employee?.roleName || "",
          sectionAmount,
          employeeAmount: sectionAmount * (employeeDraft.rolePercentage / 100),
          rolePercentage: employeeDraft.rolePercentage
        };
      });
    });
  }, [draft, employees, product, sections]);

  const sectionTotal = draft.reduce((sum, section) => sum + Number(section.percentage || 0), 0);
  const visibleSections = sections.filter((section) => section.name.toLowerCase().includes(sectionQuery.trim().toLowerCase()));

  function changeProduct(nextProductId: number) {
    setProductId(nextProductId);
    setMessage(null);
    setDraft(savedDistributions.find((item) => item.productId === nextProductId)?.sections || []);
  }

  function toggleSection(sectionId: number) {
    setDraft((current) =>
      current.some((section) => section.sectionId === sectionId)
        ? current.filter((section) => section.sectionId !== sectionId)
        : [...current, { sectionId, percentage: 0, employees: [] }]
    );
  }

  function updateSection(sectionId: number, percentage: number) {
    setDraft((current) => current.map((section) => (section.sectionId === sectionId ? { ...section, percentage } : section)));
  }

  function toggleEmployee(sectionId: number, employee: Employee) {
    setDraft((current) =>
      current.map((section) => {
        if (section.sectionId !== sectionId) return section;
        const exists = section.employees.some((item) => item.employeeId === employee.id);
        return {
          ...section,
          employees: exists
            ? section.employees.filter((item) => item.employeeId !== employee.id)
            : [...section.employees, { employeeId: employee.id, rolePercentage: 0 }]
        };
      })
    );
  }

  function updateEmployee(sectionId: number, employeeId: number, rolePercentage: number) {
    setDraft((current) =>
      current.map((section) =>
        section.sectionId === sectionId
          ? {
              ...section,
              employees: section.employees.map((employee) =>
                employee.employeeId === employeeId ? { ...employee, rolePercentage } : employee
              )
            }
          : section
      )
    );
  }

  function save() {
    startTransition(async () => {
      setMessage(null);
      const response = await fetch("/api/distribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, sections: draft })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(result.message || "Unable to save distribution.");
        return;
      }
      setMessage("Distribution saved successfully.");
      window.location.reload();
    });
  }

  function removeDistribution() {
    if (!product || !confirm(`Delete the saved distribution for ${product.itemCode}?`)) return;

    startTransition(async () => {
      setMessage(null);
      const response = await fetch(`/api/distribution?productId=${product.id}`, { method: "DELETE" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(result.message || "Unable to delete distribution.");
        return;
      }
      setDraft([]);
      setMessage("Distribution deleted successfully.");
      window.location.reload();
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <div className="space-y-5">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
          <label>Product</label>
          <select className="mt-1.5" value={productId} onChange={(event) => changeProduct(Number(event.target.value))}>
            {products.map((item) => (
              <option key={item.id} value={item.id}>
                {item.itemCode} - {item.itemName} ({money(item.revenue)})
              </option>
            ))}
          </select>
          {hasSavedDistribution ? (
            <p className="mt-2 text-xs font-semibold text-forest">Saved distribution loaded. Change values and save to update it.</p>
          ) : (
            <p className="mt-2 text-xs text-stone-500">No saved distribution for this product yet.</p>
          )}
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
          <label>Find Section</label>
          <input
            className="mt-1.5"
            value={sectionQuery}
            onChange={(event) => setSectionQuery(event.target.value)}
            placeholder="Search sections before assigning employees"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {visibleSections.map((section) => {
            const selected = draft.find((item) => item.sectionId === section.id);
            const sectionEmployees = employees.filter((employee) => employee.sectionId === section.id);
            const roleTotal = selected?.employees.reduce((sum, employee) => sum + Number(employee.rolePercentage || 0), 0) || 0;

            return (
              <div key={section.id} className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2">
                    <input className="h-4 w-4" type="checkbox" checked={Boolean(selected)} onChange={() => toggleSection(section.id)} />
                    {section.name}
                  </label>
                  {selected ? <span className="text-xs font-semibold text-stone-500">Employees: {roleTotal.toFixed(2)}%</span> : null}
                </div>
                {selected ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label>Section Percentage</label>
                      <input
                        type="number"
                        step="0.01"
                        value={selected.percentage}
                        onChange={(event) => updateSection(section.id, Number(event.target.value))}
                      />
                    </div>
                    <div className="max-h-96 space-y-3 overflow-auto pr-1">
                      {sectionEmployees.map((employee) => {
                        const selectedEmployee = selected.employees.find((item) => item.employeeId === employee.id);
                        return (
                          <div key={employee.id} className="rounded-md bg-stone-50 p-3">
                            <label className="flex items-center gap-2">
                              <input
                                className="h-4 w-4"
                                type="checkbox"
                                checked={Boolean(selectedEmployee)}
                                onChange={() => toggleEmployee(section.id, employee)}
                              />
                              <span>
                                {employee.name} <span className="text-xs text-stone-500">({employee.roleName})</span>
                              </span>
                            </label>
                            {selectedEmployee ? (
                              <input
                                className="mt-2"
                                type="number"
                                step="0.01"
                                value={selectedEmployee.rolePercentage}
                                onChange={(event) => updateEmployee(section.id, employee.id, Number(event.target.value))}
                              />
                            ) : null}
                          </div>
                        );
                      })}
                      {!sectionEmployees.length ? <p className="text-sm text-stone-500">No employees in this section.</p> : null}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <aside className="h-fit rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-forest" />
          <h2 className="text-lg font-bold text-ink">Calculation Preview</h2>
        </div>
        <p className={sectionTotal > 100 ? "mt-3 text-sm font-semibold text-red-600" : "mt-3 text-sm text-stone-600"}>
          Section total: {sectionTotal.toFixed(2)}%
        </p>
        <div className="mt-4 max-h-[520px] space-y-3 overflow-auto">
          {preview.map((item, index) => (
            <div key={`${item.employeeName}-${index}`} className="rounded-md bg-stone-50 p-3">
              <p className="text-sm font-semibold text-ink">{item.employeeName}</p>
              <p className="text-xs text-stone-500">
                {item.sectionName} - {item.roleName} at {item.rolePercentage}%
              </p>
              <p className="mt-2 text-sm font-bold text-forest">{money(item.employeeAmount)}</p>
            </div>
          ))}
          {!preview.length ? <p className="text-sm text-stone-500">Select sections and employees to preview earnings.</p> : null}
        </div>
        {message ? <p className="mt-4 rounded-md bg-mint px-3 py-2 text-sm font-semibold text-forest">{message}</p> : null}
        <Button className="mt-5 w-full" onClick={save} disabled={isPending || !product || sectionTotal > 100}>
          <Save className="h-4 w-4" />
          {isPending ? "Saving..." : hasSavedDistribution ? "Update Distribution" : "Save Distribution"}
        </Button>
        {hasSavedDistribution ? (
          <Button className="mt-3 w-full" variant="danger" onClick={removeDistribution} disabled={isPending || !product}>
            <Trash2 className="h-4 w-4" />
            Delete Distribution
          </Button>
        ) : null}
      </aside>
    </div>
  );
}
