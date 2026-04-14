import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";
import { BiWallet, BiPlus, BiHistory } from "react-icons/bi";

interface Transaction {
  _id: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  status: "PENDING" | "SUCCESS" | "FAILED";
  paymentProvider: string;
  description: string;
  createdAt: string;
}

const Wallet: React.FC = () => {
  const { isAuth } = useAppData();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuth) {
      navigate("/login");
      return;
    }
    fetchWalletData();
  }, [isAuth]);

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [balanceRes, transRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_WALLET_SERVICE_URL}/api/wallet/balance`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_WALLET_SERVICE_URL}/api/wallet/transactions`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setBalance(balanceRes.data.balance);
      setTransactions(Array.isArray(transRes.data) ? transRes.data : []);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      toast.error("Failed to load wallet data");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="mx-auto max-w-lg px-4 pt-6">
        {/* Balance Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 to-orange-400 p-8 text-white shadow-xl shadow-red-200">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-red-100 text-sm font-medium uppercase tracking-wider">Current Balance</p>
              <h2 className="mt-1 text-5xl font-extrabold">₹{balance?.toLocaleString()}</h2>
            </div>
            <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-md">
              <BiWallet className="h-8 w-8" />
            </div>
          </div>
          
          {/* Decorative shapes */}
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-orange-400/20 blur-3xl"></div>
        </div>

        {/* Transactions Section */}
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <BiHistory className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-bold text-gray-800">Transaction History</h3>
          </div>

          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="rounded-3xl bg-white p-10 text-center text-gray-400 border border-dashed border-gray-200">
                <p>No transactions yet.</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx._id} className="group flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                      tx.type === "CREDIT" ? "bg-green-50 text-green-500" : "bg-red-50 text-red-500"
                    }`}>
                      {tx.type === "CREDIT" ? <BiPlus className="h-6 w-6" /> : <div className="h-1 w-4 bg-red-500 rounded-full"></div>}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{tx.description}</p>
                      <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()} • {tx.paymentProvider}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black ${
                      tx.type === "CREDIT" ? "text-green-500" : "text-gray-800"
                    }`}>
                      {tx.type === "CREDIT" ? "+" : "-"} ₹{tx.amount}
                    </p>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${
                      tx.status === "SUCCESS" ? "text-green-400" : tx.status === "PENDING" ? "text-orange-400" : "text-red-400"
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

export default Wallet;
