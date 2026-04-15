import { Request, Response } from "express";
import Wallet from "../model/Wallet.model.js";
import Transaction from "../model/Transaction.model.js";
import axios from "axios";
import { sendLoyaltyBonusEmail } from "../utils/mail.js";

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
