import { useState, useEffect } from "react";
import axios from "axios";
import { useAppData } from "../context/AppContext";
import toast from "react-hot-toast";
import { BiGift, BiCopy, BiCheckCircle, BiInfoCircle, BiShareAlt } from "react-icons/bi";
import { motion } from "framer-motion";

const ReferAndEarn = () => {
    const { user } = useAppData();
    const [referralInfo, setReferralInfo] = useState<{
        referralCode: string;
        referredBy: string | null;
        hasAppliedCode: boolean;
    } | null>(null);
    const [referralCodeInput, setReferralCodeInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);

    const fetchReferralInfo = async () => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/auth/referral-info`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setReferralInfo(data);
        } catch (error) {
            console.error("Error fetching referral info:", error);
            toast.error("Failed to load referral details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReferralInfo();
    }, []);

    const copyToClipboard = () => {
        if (referralInfo?.referralCode) {
            navigator.clipboard.writeText(referralInfo.referralCode);
            toast.success("Referral code copied!");
        }
    };

    const handleApplyReferral = async () => {
        if (!referralCodeInput.trim()) {
            return toast.error("Please enter a referral code");
        }

        setApplying(true);
        try {
            const token = localStorage.getItem("token");
            const { data } = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/auth/apply-referral`,
                { referralCode: referralCodeInput },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(data.message || "Code applied successfully!");
            fetchReferralInfo();
            setReferralCodeInput("");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to apply code");
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent shadow-lg"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] px-4 py-8">
            <div className="mx-auto max-w-2xl">
                {/* Header Section */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 text-center"
                >
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xl shadow-red-200">
                        <BiGift className="h-10 w-10" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Refer & Earn</h1>
                    <p className="mt-2 text-gray-500">Invite friends and get rewards on their first order!</p>
                </motion.div>

                <div className="grid gap-6">
                    {/* Share Section */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="overflow-hidden rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5"
                    >
                        <h2 className="text-xl font-semibold text-gray-900">Your Referral Code</h2>
                        <p className="mt-1 text-sm text-gray-500">Share this code with your friends</p>
                        
                        <div className="mt-6 flex items-center gap-3 overflow-hidden rounded-2xl bg-gray-50 p-2 ring-1 ring-gray-200">
                            <div className="flex-1 px-4 py-3 text-center text-2xl font-bold tracking-widest text-red-600">
                                {referralInfo?.referralCode}
                            </div>
                            <button 
                                onClick={copyToClipboard}
                                className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100 active:scale-95"
                            >
                                <BiCopy className="h-5 w-5" />
                                Copy
                            </button>
                        </div>

                        <div className="mt-8 flex items-center justify-between gap-4 border-t border-gray-100 pt-8">
                            <div className="text-center flex-1">
                                <div className="text-2xl font-bold text-gray-900">70 INR</div>
                                <div className="text-xs font-medium uppercase tracking-wider text-gray-400">You Get</div>
                            </div>
                            <div className="h-10 w-[1px] bg-gray-100"></div>
                            <div className="text-center flex-1">
                                <div className="text-2xl font-bold text-gray-900">50 INR</div>
                                <div className="text-xs font-medium uppercase tracking-wider text-gray-400">They Get</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Apply Section */}
                    {!referralInfo?.hasAppliedCode ? (
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white shadow-lg"
                        >
                            <h2 className="text-xl font-semibold">Been referred by a friend?</h2>
                            <p className="mt-1 text-sm text-gray-300">Enter their code to get 50 INR in your wallet!</p>
                            
                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                <input 
                                    type="text" 
                                    placeholder="Enter Code (e.g. SNAP1234)"
                                    value={referralCodeInput}
                                    onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                                    className="flex-1 rounded-2xl border-0 bg-white/10 px-5 py-4 text-white placeholder-gray-400 outline-none ring-1 ring-white/20 transition focus:bg-white/15 focus:ring-red-500/50"
                                />
                                <button 
                                    onClick={handleApplyReferral}
                                    disabled={applying}
                                    className="rounded-2xl bg-white px-8 py-4 font-bold text-gray-900 shadow-lg transition hover:bg-gray-100 disabled:opacity-50 active:scale-95"
                                >
                                    {applying ? "Applying..." : "Apply Code"}
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-4 rounded-3xl bg-green-50 p-6 text-green-700 ring-1 ring-green-100"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white">
                                <BiCheckCircle className="h-7 w-7" />
                            </div>
                            <div>
                                <h3 className="font-bold">Referral program active!</h3>
                                <p className="text-sm opacity-90">Applied friend's code: <span className="font-bold">{referralInfo.referredBy}</span></p>
                            </div>
                        </motion.div>
                    )}

                    {/* How it works */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5"
                    >
                        <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                            <BiInfoCircle className="text-red-500" />
                            How it works
                        </h2>
                        <div className="mt-6 space-y-6">
                            <div className="flex gap-4">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-600 text-sm">1</div>
                                <p className="text-gray-600 text-sm py-1.5">Share your unique referral code with friends who haven't ordered on SnapEats yet.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-600 text-sm">2</div>
                                <p className="text-gray-600 text-sm py-1.5">When they apply your code and complete their **first order**, both of you get rewarded!</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-600 text-sm">3</div>
                                <p className="text-gray-600 text-sm py-1.5">Your reward (70 INR) and their reward (50 INR) will be credited automatically to your wallets.</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ReferAndEarn;
