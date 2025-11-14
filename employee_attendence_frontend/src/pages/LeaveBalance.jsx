import { useEffect, useState } from "react";
import { getLeaveBalance } from "../api/leaveApi";

export default function LeaveBalance() {
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    getLeaveBalance().then(({ data, error }) => {
      if (error) console.error(error);
      setBalance(data || null);
    });
  }, []);

  if (!balance) return <p className="p-6">Loading...</p>;

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
