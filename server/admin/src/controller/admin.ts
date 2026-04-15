import axios from 'axios';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { Response } from 'express';

const getWalletServiceBaseUrl = () =>
    process.env.WALLET_SERVICE_URL || process.env.WALLET_SERVICE || "http://localhost:3007";

export const getAllRestaurants = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { data } = await axios.get(`${process.env.RESTAURANT_SERVICE}/api/restaurant/all-restaurants`, {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
                authorization: req.headers.authorization,
            },
        });
        res.json(data);
    } catch (error: any) {
        const status = error?.response?.status ?? 500;
        const message = error?.response?.data?.message ?? "Failed to fetch restaurants";
        res.status(status).json({ message });
    }
}

export const getunverifiedRestaurants = async (req: AuthenticatedRequest, res: Response) => {
    try{
        const { data } = await axios.get(`${process.env.RESTAURANT_SERVICE}/api/restaurant/unverified`, {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
                authorization: req.headers.authorization,
            }  
         });
        res.json(data);
    }catch (error: any) {
        const status = error?.response?.status ?? 500;
        const message = error?.response?.data?.message ?? "Failed to fetch unverified restaurants";
        res.status(status).json({ message });
    }
}

export const verifyRestaurant = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id: restaurantId } = req.params;
        const { data } = await axios.put(`${process.env.RESTAURANT_SERVICE}/api/restaurant/verify`, {
            restaurantId,
            isVerified: true,
        }, {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
                authorization: req.headers.authorization,
            }
        });
        res.json(data);
        
    } catch (error: any) {
        const status = error?.response?.status ?? 500;
        const message = error?.response?.data?.message ?? "Failed to verify restaurant";
        res.status(status).json({ message });
    }
}

export const getAllriders = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { data } = await axios.get(`${process.env.RIDER_SERVICE}/api/rider/all`, {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
                authorization: req.headers.authorization,
            },
        });
        res.json(data);
    } catch (error: any) {
        const status = error?.response?.status ?? 500;
        const message = error?.response?.data?.message ?? "Failed to fetch riders";
        res.status(status).json({ message });
    }
}

export const getunverifiedRiders = async (req: AuthenticatedRequest, res: Response) => {
    try{
        const { data } = await axios.get(`${process.env.RIDER_SERVICE}/api/rider/unverified`, {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
                authorization: req.headers.authorization,
            }
         });
         res.json(data);
    }catch (error: any) {
        const status = error?.response?.status ?? 500;
        const message = error?.response?.data?.message ?? "Failed to fetch unverified riders";
        res.status(status).json({ message });
    }
}

export const verifyRider = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const riderId = req.params.id ?? req.body.riderId;
        const { data } = await axios.post(`${process.env.RIDER_SERVICE}/api/rider/verify`, {
            riderId,
        }, {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
                authorization: req.headers.authorization,
            }
        });
        res.json(data);
    } catch (error: any) {
        const status = error?.response?.status ?? 500;
        const message = error?.response?.data?.message ?? "Failed to verify rider";
        res.status(status).json({ message });
    }
}

export const getallOrders = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { data } = await axios.get(`${process.env.RESTAURANT_SERVICE}/api/order/all`, {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
        });
        res.json(data);
    } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch orders" });
    }
}

export const getTotalRevenue = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { data } = await axios.get(`${process.env.RESTAURANT_SERVICE}/api/order/all`, {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
        });

        const orders = Array.isArray(data) ? data : (Array.isArray(data?.orders) ? data.orders : []);

        let grossRevenue = 0;
        let totalOrders = 0;

        orders.forEach((order: any) => {
            if (order.paymentStatus !== "paid") return;

            totalOrders++;

            const subTotal = Number(order.subTotal ?? 0);
            const platformCharge = Number(order.platformCharge ?? 0);
            const deliveryCharge = Number(order.deliveryCharge ?? 0);
            const riderEarning = Number(order.riderEarning ?? 0);

            const commission = subTotal * 0.13;
            const deliveryMargin = deliveryCharge - riderEarning;

            grossRevenue +=
                commission +
                platformCharge +
                deliveryMargin;
        });

        let loyaltyPayout = 0;
        try {
            const { data: loyaltySummary } = await axios.get(
                `${getWalletServiceBaseUrl()}/api/wallet/internal/loyalty-summary`,
                {
                    headers: {
                        "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
                    },
                },
            );

            loyaltyPayout = Number(loyaltySummary?.totalLoyaltyBonus ?? 0);
        } catch (walletError) {
            loyaltyPayout = 0;
        }

        const totalRevenue = grossRevenue - loyaltyPayout;

    res.json({
      totalRevenue,
      netRevenue: totalRevenue,
      grossRevenue,
      loyaltyPayout,
      totalOrders,
    });
    } catch (error: any) {
        res.status(500).json({ message: "Failed to fetch total revenue" });
    }
}

export const getWalletTransactions = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { data } = await axios.get(
            `${getWalletServiceBaseUrl()}/api/wallet/internal/transactions?limit=120`,
            {
                headers: {
                    "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
                },
            },
        );

        res.json(data);
    } catch (error: any) {
        const status = error?.response?.status ?? 500;
        const message = error?.response?.data?.message ?? "Failed to fetch wallet transactions";
        res.status(status).json({ message });
    }
}

export const getTopRestaurants = async (req: AuthenticatedRequest, res: Response) => {
  try {
        const { data } = await axios.get(
      `${process.env.RESTAURANT_SERVICE}/api/order/all`,
      {
        headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY },
      }
    );

    const orders = Array.isArray(data) ? data : (Array.isArray(data?.orders) ? data.orders : []);

    const map: Record<string, number> = {};

    orders.forEach((order: any) => {
      if (order.paymentStatus !== "paid") return;

            const restaurantId = String(order.restaurantId ?? "");
            if (!restaurantId) return;

            const subTotal = Number(order.subTotal ?? 0);
            const platformCharge = Number(order.platformCharge ?? 0);

      const revenue =
                subTotal * 0.13 + platformCharge;

            if (!map[restaurantId]) {
                map[restaurantId] = 0;
      }

            map[restaurantId] += revenue;
    });

    const sorted = Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    res.json(sorted);
  } catch (error) {
    res.status(500).json({ message: "Failed to get top restaurants" });
  }
};

