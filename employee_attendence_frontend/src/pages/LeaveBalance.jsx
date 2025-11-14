import { useEffect, useState } from "react";
import { getLeaveBalance } from "../api/leaveApi";

export default function LeaveBalance() {
  const [balance, setBalance] = useState(undefined); // undefined = loading, null = unauth or no data

  useEffect(() => {
    let mounted = true;
    getLeaveBalance().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.error(error);
      // If unauthenticated, data is null by contract; reflect that
      setBalance(typeof data === "undefined" ? null : data);
    }).catch(() => {
      if (mounted) setBalance(null);
    });
    return () => { mounted = false; };
  }, []);

  if (balance === undefined) return <p className="p-6">Loading...</p>;
  if (balance === null) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Leave Balance</h1>
        <div
          className="text-sm"
          style={{
            background: "#FFF7ED",
            border: "1px solid #FED7AA",
            color: "#7C2D12",
            padding: 12,
            borderRadius: 8,
          }}
        >
          Sign in to view your leave balance.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Leave Balance</h1>

      <div className="border p-4 rounded">
        {balance.sick !== undefined && <p>Sick Leave: {balance.sick}</p>}
        {balance.casual !== undefined && <p>Casual Leave: {balance.casual}</p>}
        {balance.annual !== undefined && <p>Annual Leave: {balance.annual}</p>}
        {balance.wfh !== undefined && <p>Work From Home: {balance.wfh}</p>}
      </div>
    </div>
  );
}
