export default function DataTable({ columns, rows, actions, emptyText = 'No records found' }) {
  return (
    <div className="card overflow-x-auto">
      <table className="table-base">
        <thead>
          <tr>
            {columns.map((c) => <th key={c.key}>{c.label}</th>)}
            {actions && <th className="text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="text-center text-slate-400 py-10">{emptyText}</td></tr>
          )}
          {rows.map((row, i) => (
            <tr key={row.id || i} className="hover:bg-slate-50">
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
              ))}
              {actions && <td className="text-right whitespace-nowrap">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
