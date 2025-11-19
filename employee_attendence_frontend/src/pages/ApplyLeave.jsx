import React from "react";
import Layout from "../components/layout/Layout";
import ApplyLeaveForm from "../components/ApplyLeaveForm";
import { useNavigate } from "react-router-dom";

/**
 * PUBLIC_INTERFACE
 * /apply-leave page - Displays leave request form using Layout
 */
export default function ApplyLeave() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Optionally redirect to user leave history or dashboard
    setTimeout(() => {
      navigate("/leave", { replace: true });
    }, 1200);
  };

  return (
    <Layout>
      <div className="py-4">
        <ApplyLeaveForm onSuccess={handleSuccess} />
      </div>
    </Layout>
  );
}
