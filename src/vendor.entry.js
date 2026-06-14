import Chart from "chart.js/auto";
import { basicSetup, EditorView } from "codemirror";
import { html } from "@codemirror/lang-html";
import { json } from "@codemirror/lang-json";
import { createTable, getCoreRowModel, getSortedRowModel } from "@tanstack/table-core";

const editorViews = new WeakMap();
const tableState = new WeakMap();
const chartState = new Map();

function languageFor(textarea) {
  const type = textarea.getAttribute("data-codemirror");
  if (type === "html") return html();
  if (type === "json") return json();
  return [];
}

function syncTextarea(textarea, value) {
  textarea.value = value;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function syncEditorFromTextarea(textarea, view) {
  const nextValue = textarea.value || "";
  const currentValue = view.state.doc.toString();
  if (nextValue === currentValue || view.hasFocus) return;
  view.dispatch({ changes: { from: 0, to: currentValue.length, insert: nextValue } });
}

function enhanceEditors(root = document) {
  root.querySelectorAll("textarea[data-codemirror]").forEach((textarea) => {
    const existing = editorViews.get(textarea);
    if (existing) {
      syncEditorFromTextarea(textarea, existing);
      return;
    }
    const host = document.createElement("div");
    host.className = "mailflow-codemirror";
    textarea.classList.add("sr-only");
    textarea.after(host);
    const view = new EditorView({
      doc: textarea.value,
      extensions: [
        basicSetup,
        languageFor(textarea),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) syncTextarea(textarea, update.state.doc.toString());
        }),
        EditorView.theme({
          "&": { minHeight: "132px", fontSize: "13px" },
          ".cm-content": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
          ".cm-scroller": { maxHeight: "280px" }
        })
      ],
      parent: host
    });
    editorViews.set(textarea, view);
  });
}

function tableRows(table) {
  const tbody = table.tBodies[0];
  if (!tbody) return [];
  return Array.from(tbody.rows).filter((row) => !row.closest("template") && row.cells.length > 1);
}

function rowText(row) {
  return Array.from(row.cells).map((cell) => cell.textContent || "").join(" ").toLowerCase();
}

function applySmartTable(table) {
  const rows = tableRows(table);
  const state = tableState.get(table);
  if (!state) return;
  const filter = state.filter.trim().toLowerCase();
  const data = rows.map((row, index) => {
    const values = {};
    Array.from(row.cells).forEach((cell, cellIndex) => {
      values[`c${cellIndex}`] = (cell.textContent || "").trim();
    });
    return { index, text: rowText(row), values };
  });
  const columns = Array.from(table.tHead?.rows?.[0]?.cells || []).map((_cell, index) => ({
    id: `c${index}`,
    accessorFn: (row) => row.values[`c${index}`] || ""
  }));
  const instance = createTable({
    data,
    columns,
    state: { sorting: state.sorting },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });
  const ordered = instance.getRowModel().rows.map((row) => rows[row.original.index]);
  const tbody = table.tBodies[0];
  const currentOrder = Array.from(tbody?.rows || []).filter((row) => ordered.includes(row));
  const orderChanged = ordered.some((row, index) => currentOrder[index] !== row);
  ordered.forEach((row) => {
    row.style.display = !filter || rowText(row).includes(filter) ? "" : "none";
  });
  if (orderChanged) ordered.forEach((row) => tbody?.append(row));
  if (state.count) {
    state.count.textContent = `${ordered.filter((row) => row.style.display !== "none").length}/${rows.length}`;
  }
}

function enhanceSmartTables(root = document) {
  root.querySelectorAll("table[data-smart-table]").forEach((table) => {
    if (!tableState.has(table)) {
      const toolbar = document.createElement("div");
      toolbar.className = "mailflow-smart-toolbar";
      toolbar.innerHTML = `
        <label class="mailflow-smart-label">بحث سريع
          <input class="mailflow-smart-input" placeholder="ابحث داخل الجدول">
        </label>
        <span class="mailflow-smart-count" data-smart-count>0/0</span>
      `;
      table.parentElement?.insertBefore(toolbar, table);
      const input = toolbar.querySelector("input");
      const count = toolbar.querySelector("[data-smart-count]");
      const state = { filter: "", sorting: [], count };
      tableState.set(table, state);
      input?.addEventListener("input", () => {
        state.filter = input.value;
        applySmartTable(table);
      });
      Array.from(table.tHead?.rows?.[0]?.cells || []).forEach((cell, index) => {
        cell.style.cursor = "pointer";
        cell.style.userSelect = "none";
        cell.title = "Sort";
        cell.addEventListener("click", () => {
          const current = state.sorting[0];
          state.sorting = current?.id === `c${index}` ? [{ id: `c${index}`, desc: !current.desc }] : [{ id: `c${index}`, desc: false }];
          applySmartTable(table);
        });
      });
    }
    applySmartTable(table);
  });
}

function chartColor(index) {
  return ["#0f172a", "#2563eb", "#059669", "#d97706", "#7c3aed", "#dc2626"][index % 6];
}

function renderAnalyticsCharts(charts) {
  if (!Array.isArray(charts)) return;
  charts.forEach((chart, index) => {
    const canvas = document.querySelector(`canvas[data-chart-title="${CSS.escape(chart.title)}"]`);
    if (!canvas) return;
    const existing = chartState.get(chart.title);
    if (existing) existing.destroy();
    const rows = Array.isArray(chart.rows) ? chart.rows : [];
    chartState.set(
      chart.title,
      new Chart(canvas, {
        type: "bar",
        data: {
          labels: rows.map((row) => row.label || "None"),
          datasets: [{ label: chart.title, data: rows.map((row) => Number(row.value || 0)), backgroundColor: chartColor(index), borderRadius: 6 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      })
    );
  });
}

function enhanceAll(root = document) {
  enhanceEditors(root);
  enhanceSmartTables(root);
}

function scheduleEnhance() {
  setTimeout(() => enhanceAll(), 0);
  setTimeout(() => enhanceAll(), 150);
  setTimeout(() => enhanceAll(), 600);
}

document.addEventListener("DOMContentLoaded", () => {
  scheduleEnhance();
});

window.MailFlowEnhance = { enhanceAll, scheduleEnhance, renderAnalyticsCharts };
