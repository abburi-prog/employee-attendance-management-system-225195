import React from "react";

/**
 * Leave Page
 *
 * Displays a header, subheader, a stub table, and a "Request Leave" button, styled with the Ocean Professional theme.
 *
 * @compliance
 * - Security: No hardcoded secrets, only dummy placeholder data
 * - Style: Color scheme per theme requirements
 */
const theme = {
  primary: "#2563EB",
  secondary: "#F59E0B",
  error: "#EF4444",
  background: "#f9fafb",
  surface: "#ffffff",
  text: "#111827"
};

// PUBLIC_INTERFACE
export default function Leave() {
  return (
    <div
      style={{
        background: theme.background,
        minHeight: "100vh",
        padding: "2rem",
      }}
      className="leave-page"
    >
      <div
        style={{
          background: theme.surface,
          borderRadius: "1rem",
          boxShadow: "0 2px 8px 0 rgba(37,99,235,0.05)",
          padding: "2rem 2rem 2.5rem 2rem",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            color: theme.primary,
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: "0.25rem",
            letterSpacing: "-0.02em",
          }}
        >
          Leave
        </h1>
        <h2
          style={{
            color: theme.text,
            fontSize: "1.125rem",
            fontWeight: 400,
            marginBottom: "2rem",
            opacity: 0.8,
          }}
        >
          Manage leave requests
        </h2>

        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "1.5rem"
        }}>
          <button
            style={{
              background: `linear-gradient(90deg, ${theme.primary} 80%, ${theme.secondary} 120%)`,
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.6rem 1.4rem",
              fontSize: "1rem",
              fontWeight: 500,
              boxShadow: "0 2px 6px 0 rgba(37,99,235,0.08)",
              cursor: "pointer",
              transition: "box-shadow .18s, background .18s",
            }}
            onClick={() => alert('Request Leave (placeholder action)')}
            aria-label="Request Leave"
          >
            Request Leave
          </button>
        </div>

        <div
          style={{
            background: theme.background,
            borderRadius: "0.5rem",
            padding: "1rem",
            border: "1px solid #E5E7EB",
            textAlign: "center",
            color: theme.text,
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    color: theme.primary,
                    fontWeight: 600,
                    padding: "0.75rem",
                    borderBottom: "2px solid #E5E7EB"
                  }}
                >
                  Date
                </th>
                <th
                  style={{
                    color: theme.primary,
                    fontWeight: 600,
                    padding: "0.75rem",
                    borderBottom: "2px solid #E5E7EB"
                  }}
                >
                  Type
                </th>
                <th
                  style={{
                    color: theme.primary,
                    fontWeight: 600,
                    padding: "0.75rem",
                    borderBottom: "2px solid #E5E7EB"
                  }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={3}
                  style={{
                    padding: "1.5rem",
                    color: theme.text,
                    opacity: 0.7,
                  }}
                >
                  No leave requests yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
