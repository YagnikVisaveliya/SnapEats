import { Request, Response } from "express";
import Wallet from "../model/Wallet.model.js";
import Transaction from "../model/Transaction.model.js";
import { sendFirstOrderCashbackEmail, sendLoyaltyBonusEmail } from "../utils/mail.js";

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
