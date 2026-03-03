import { useEffect, useState } from "react";
import { BiCheckCircle, BiCopy, BiHomeAlt, BiReceipt } from "react-icons/bi";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { useAppData } from "../context/AppContext";

const PaymentSuccess = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const { fetchCart } = useAppData();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const copyPaymentId = async () => {
    if (!paymentId) return;

    try {
      await navigator.clipboard.writeText(paymentId);
      setCopied(true);
      toast.success("Payment ID copied");

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      toast.error("Unable to copy Payment ID");
    }
  };

  return (
    <div className="min-h-[85vh] bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <BiCheckCircle size={46} />
        </div>

        <h1 className="text-3xl font-bold text-slate-900">Payment Successful</h1>
        <p className="mt-2 text-sm text-slate-500">
          Your order has been confirmed and is now being prepared.
        </p>

        <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Payment ID
          </p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="break-all text-sm font-semibold text-slate-800">
              {paymentId || "Unavailable"}
            </p>
            <button
              onClick={copyPaymentId}
              disabled={!paymentId}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <BiCopy size={14} />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => navigate("/")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <BiHomeAlt size={18} />
            Back to Home
          </button>

          <button
            onClick={() => navigate("/account")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <BiReceipt size={18} />
            Go to Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;