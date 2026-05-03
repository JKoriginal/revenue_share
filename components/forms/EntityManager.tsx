"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Edit, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";

type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "email" | "password";
  options?: { value: number | string; label: string }[];
};

type Entity = { id: number; [key: string]: unknown };

export function EntityManager({
  rows,
  columns,
  fields,
  endpoint,
  formTitle,
  emptyValues
}: {
  rows: Entity[];
  columns: { key: string; header: string; render?: (row: Entity) => React.ReactNode; sortable?: boolean }[];
  fields: Field[];
  endpoint: string;
  formTitle: string;
  emptyValues: Record<string, unknown>;
}) {
  const [editing, setEditing] = useState<Entity | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm({ defaultValues: emptyValues });

  function startEdit(row: Entity) {
    setEditing(row);
    setMessage(null);
    form.reset(row);
  }

  function clearForm() {
    setEditing(null);
    setMessage(null);
    form.reset(emptyValues);
  }

  function save(values: Record<string, unknown>) {
    startTransition(async () => {
      setMessage(null);
      const url = editing ? `${endpoint}/${editing.id}` : endpoint;
      const response = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(result.message || "Unable to save record.");
        return;
      }
      window.location.reload();
    });
  }

  function remove(row: Entity) {
    if (!confirm("Delete this record?")) return;

    startTransition(async () => {
      const response = await fetch(`${endpoint}/${row.id}`, { method: "DELETE" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(result.message || "Unable to delete record. It may be used by another record.");
        return;
      }
      window.location.reload();
    });
  }

  const tableColumns = [
    ...columns,
    {
      key: "actions",
      header: "Actions",
      render: (row: Entity) => (
        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="px-3" onClick={() => startEdit(row)} title="Edit">
            <Edit className="h-4 w-4" />
          </Button>
          <Button type="button" variant="danger" className="px-3" onClick={() => remove(row)} title="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={form.handleSubmit(save)} className="h-fit rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">{editing ? `Edit ${formTitle}` : `Add ${formTitle}`}</h2>
          {editing ? (
            <Button type="button" variant="ghost" className="px-2" onClick={clearForm}>
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-1.5">
              <label>{field.label}</label>
              {field.type === "textarea" ? (
                <textarea rows={4} {...form.register(field.name)} />
              ) : field.type === "select" ? (
                <select {...form.register(field.name)}>
                  <option value="">Select...</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input step="0.01" type={field.type || "text"} {...form.register(field.name)} />
              )}
            </div>
          ))}
        </div>
        {message ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{message}</p> : null}
        <Button className="mt-5 w-full" disabled={isPending}>
          <Plus className="h-4 w-4" />
          {isPending ? "Saving..." : editing ? "Update" : "Create"}
        </Button>
      </form>
      <DataTable rows={rows} columns={tableColumns} />
    </div>
  );
}
