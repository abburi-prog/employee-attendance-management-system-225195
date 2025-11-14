import React from 'react';

/**
 * Basic responsive table with accessible semantics and empty state handling.
 */
// PUBLIC_INTERFACE
export default function Table({ columns = [], data = [], renderRow, empty = 'No data.' }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className="text-left text-sm font-semibold text-gray-700"
                style={{ padding: '10px 8px' }}
                scope="col"
              >
                {c.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td className="text-sm text-gray-500" style={{ padding: 8 }} colSpan={columns.length}>
                {empty}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={row.id || idx} className="border-t border-gray-100">
                {renderRow ? (
                  renderRow(row)
                ) : (
                  columns.map((c) => (
                    <td key={c.key} className="text-sm text-gray-900" style={{ padding: 8 }}>
                      {row[c.dataIndex]}
                    </td>
                  ))
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
