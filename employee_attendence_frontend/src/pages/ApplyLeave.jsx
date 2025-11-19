import React from "react";
import ApplyLeaveForm from "../components/ApplyLeaveForm";
import { useNavigate } from "react-router-dom";

/**
 * PUBLIC_INTERFACE
 * /apply-leave page - Displays leave request form. Layout is already applied via router.
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
    <div className="py-4">
      <ApplyLeaveForm onSuccess={handleSuccess} />
    </div>
  );
}
