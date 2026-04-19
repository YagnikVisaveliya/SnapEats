import { Request, Response } from "express";
import Wallet from "../model/Wallet.model.js";
import Transaction from "../model/Transaction.model.js";
import Referral from "../model/Referral.model.js";
import { sendFirstOrderCashbackEmail, sendLoyaltyBonusEmail, sendReferralRewardEmail } from "../utils/mail.js";
import axios from "axios";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const getBalance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = await Wallet.create({ userId, balance: 0 });
    }

    res.json({ balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 }).limit(50);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// INTERNAL: Refund to wallet
export const internalRefund = async (req: Request, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const { userId, amount, orderId, description } = req.body;

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) wallet = await Wallet.create({ userId, balance: 0 });

    wallet.balance += amount;
    await wallet.save();

    await Transaction.create({
      userId,
      amount,
      type: "CREDIT",
      status: "SUCCESS",
      paymentProvider: "WALLET",
      description: description || `Refund for order #${orderId}`,
      orderId,
    });

    res.json({ message: "Refund successful", balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// INTERNAL: Debit wallet balance (supports partial debit)
export const internalDebit = async (req: Request, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const { userId, amount, orderId, description } = req.body;

    const requestedAmount = Number(amount ?? 0);
    if (!userId || !Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      return res.status(400).json({ message: "Valid userId and amount are required" });
    }

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) wallet = await Wallet.create({ userId, balance: 0 });

    const safeBalance = Number(wallet.balance ?? 0);
    const debitedAmount = Math.min(safeBalance, requestedAmount);
    const roundedDebit = Number(debitedAmount.toFixed(2));

    wallet.balance = Number((safeBalance - roundedDebit).toFixed(2));
    await wallet.save();

    if (roundedDebit > 0) {
      await Transaction.create({
        userId,
        amount: roundedDebit,
        type: "DEBIT",
        status: "SUCCESS",
        paymentProvider: "WALLET",
        description: description || `Wallet used for order #${orderId}`,
        orderId,
      });
    }

    res.json({
      message: "Wallet debited",
      debitedAmount: roundedDebit,
      remainingBalance: wallet.balance,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// INTERNAL: Loyalty Bonus
export const internalLoyaltyBonus = async (req: Request, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const { userId, userEmail, orderCount } = req.body;
    const bonusAmount = Math.floor(Math.random() * (50 - 20 + 1)) + 20; // Random bonus between 20 and 50

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) wallet = await Wallet.create({ userId, balance: 0 });

    wallet.balance += bonusAmount;
    await wallet.save();

    await Transaction.create({
      userId,
      amount: bonusAmount,
      type: "CREDIT",
      status: "SUCCESS",
      paymentProvider: "LOYALTY",
      description: `Loyalty bonus for completing ${orderCount} orders`,
    });

    // Send email notification (non-blocking)
    if (userEmail) {
      sendLoyaltyBonusEmail(userEmail, bonusAmount, orderCount).catch((err) => {
        console.error("Failed to send loyalty bonus email:", err);
      });
    }
    
    res.json({ message: "Loyalty bonus credited", amount: bonusAmount });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// INTERNAL: First order cashback (one-time, fixed amount)
export const internalFirstOrderCashback = async (req: Request, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const { userId, userEmail, orderId } = req.body;
    const cashbackAmount = 50;

    if (!userId || !orderId) {
      return res.status(400).json({ message: "userId and orderId are required" });
    }

    const existingFirstOrderCashback = await Transaction.findOne({
      userId,
      type: "CREDIT",
      status: "SUCCESS",
      paymentProvider: "LOYALTY",
      description: { $regex: /^First order cashback/i },
    });

    if (existingFirstOrderCashback) {
      return res.json({
        message: "First order cashback already credited",
        amount: 0,
        alreadyCredited: true,
      });
    }

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) wallet = await Wallet.create({ userId, balance: 0 });

    wallet.balance = Number((Number(wallet.balance ?? 0) + cashbackAmount).toFixed(2));
    await wallet.save();

    await Transaction.create({
      userId,
      amount: cashbackAmount,
      type: "CREDIT",
      status: "SUCCESS",
      paymentProvider: "LOYALTY",
      description: "First order cashback credited",
      orderId,
    });

    if (userEmail) {
      sendFirstOrderCashbackEmail(userEmail, cashbackAmount).catch((err) => {
        console.error("Failed to send first-order cashback email:", err);
      });
    }

    return res.json({
      message: "First order cashback credited",
      amount: cashbackAmount,
      balance: wallet.balance,
      alreadyCredited: false,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// INTERNAL: Referral Reward
export const internalReferralReward = async (req: Request, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const { refereeId, refereeEmail, orderId, deviceId } = req.body;
    
    if (!refereeId || !orderId) {
      return res.status(400).json({ message: "refereeId and orderId are required" });
    }

    // 1. Check if referral reward was already given to this referee
    const existingReferral = await Referral.findOne({ refereeId });
    if (existingReferral) {
      return res.json({ message: "Referral reward already processed for this user", status: "skipped" });
    }

    const authUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3000";
    
    const { data: refereeUser } = await axios.get(`${authUrl}/api/auth/internal/user/${refereeId}`, {
      headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY }
    });

    if (!refereeUser || !refereeUser.referredBy) {
      return res.json({ message: "User was not referred by anyone", status: "skipped" });
    }

    const { data: referrerUser } = await axios.get(`${authUrl}/api/auth/internal/user-by-code/${refereeUser.referredBy}`, {
      headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY }
    });

    if (!referrerUser) {
      return res.status(404).json({ message: "Referrer not found" });
    }
    
    const referrerId = referrerUser._id;
    
    if (referrerId === refereeId) {
      return res.status(400).json({ message: "Cannot self-refer" });
    }

    // Reward Amounts
    const referrerRewardAmount = 70;
    const refereeRewardAmount = 50;

    // Credit Referrer
    let referrerWallet = await Wallet.findOne({ userId: referrerId });
    if (!referrerWallet) referrerWallet = await Wallet.create({ userId: referrerId, balance: 0 });
    referrerWallet.balance += referrerRewardAmount;
    await referrerWallet.save();

    await Transaction.create({
      userId: referrerId,
      amount: referrerRewardAmount,
      type: "CREDIT",
      status: "SUCCESS",
      paymentProvider: "REFERRAL",
      description: `Referral bonus for inviting ${refereeUser.name || 'a friend'}`,
      orderId,
    });

    // Credit Referee
    let refereeWallet = await Wallet.findOne({ userId: refereeId });
    if (!refereeWallet) refereeWallet = await Wallet.create({ userId: refereeId, balance: 0 });
    refereeWallet.balance += refereeRewardAmount;
    await refereeWallet.save();

    await Transaction.create({
      userId: refereeId,
      amount: refereeRewardAmount,
      type: "CREDIT",
      status: "SUCCESS",
      paymentProvider: "REFERRAL",
      description: `Welcome referral bonus via ${referrerUser.name || 'friend'}'s code`,
      orderId,
    });

    // Create Referral completion record
    await Referral.create({
      referrerId,
      refereeId,
      refereeEmail,
      deviceId: deviceId || null,
      referrerReward: referrerRewardAmount,
      refereeReward: refereeRewardAmount,
      triggeredByOrderId: orderId,
      status: "completed",
    });

    // Send Emails asynchronously
    if (referrerUser.email) {
      sendReferralRewardEmail(referrerUser.email, referrerRewardAmount, true).catch(e => console.error(e));
    }
    if (refereeEmail) {
      sendReferralRewardEmail(refereeEmail, refereeRewardAmount, false).catch(e => console.error(e));
    }

    res.json({
      message: "Referral rewards processed successfully",
      referrerReward: referrerRewardAmount,
      refereeReward: refereeRewardAmount,
    });
  } catch (error) {
    console.error("Referral reward error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const internalReferralSummary = async (req: Request, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }
  try {
    const list = await Referral.find().sort({ createdAt: -1 }).limit(10);
    const count = await Referral.countDocuments();
    res.json({ count, recent: list });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// INTERNAL: Transaction history for admin service
export const internalTransactions = async (req: Request, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const limitRaw = Number(req.query.limit ?? 100);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(500, Math.floor(limitRaw)))
      : 100;

    const filter =
      req.query.type === "loyalty"
        ? {
            $or: [
              { paymentProvider: "LOYALTY" },
              { description: { $regex: /^Loyalty bonus/i } },
              { description: { $regex: /^First order cashback/i } },
            ],
          }
        : {};

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// INTERNAL: Summarize loyalty bonus payouts for net revenue calculation
export const internalLoyaltySummary = async (req: Request, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const result = await Transaction.aggregate([
      {
        $match: {
          status: "SUCCESS",
          type: "CREDIT",
          $or: [
            { paymentProvider: "LOYALTY" },
            { description: { $regex: /^Loyalty bonus/i } },
            { description: { $regex: /^First order cashback/i } },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalLoyaltyBonus: { $sum: "$amount" },
          totalLoyaltyTransactions: { $sum: 1 },
        },
      },
    ]);

    const summary = result[0] ?? {
      totalLoyaltyBonus: 0,
      totalLoyaltyTransactions: 0,
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
