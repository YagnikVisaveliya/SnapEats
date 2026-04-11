import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/isAuth.middleware.js";
import { Address } from "../model/address.model.js";
import { Cart } from "../model/cart.model.js";
import { IRestaurant, Restaurant } from "../model/restaurant.model.js";
import { IManu } from "../model/manu.model.js";
import { Order } from "../model/order.model.js";
import axios from "axios";
import { publishEvent } from "../config/order.pubplisher.js";

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { paymentMethod, addressId } = req.body;

  if (!addressId) {
    return res.status(400).json({ message: "address ID are required" });
  }

  const address = await Address.findOne({ _id: addressId, userId: user._id });
  if (!address) {
    return res.status(404).json({ message: "Address not found" });
  }

  const getDistanceKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return +(R * c).toFixed(2);
  };

  const cartItems = await Cart.find({ userId: user._id })
    .populate<{ itemId: IManu }>("itemId")
    .populate<{ restaurantId: IRestaurant }>("restaurantId");
  if (cartItems.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  const fisrtCartItem = cartItems[0];
  if (!fisrtCartItem || !fisrtCartItem.restaurantId) {
    return res.status(400).json({ message: "Invalid restaurant in cart" });
  }

  const restaurantId = fisrtCartItem.restaurantId._id;

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return res.status(404).json({ message: "Restaurant not found" });
  }

  if (!restaurant.isOpen) {
    return res.status(400).json({ message: "Restaurant is not Open" });
  }

  const distance = getDistanceKm(
    address.location.coordinates[1],
    address.location.coordinates[0],
    restaurant.autoLocation.coordinates[1],
    restaurant.autoLocation.coordinates[0],
  );

  let subTotal = 0;

  const orderItems = cartItems.map((cart) => {
    const item = cart.itemId;
    if (!item) {
      throw new Error("Item not found in cart");
    }

    const itemTotal = item.price * cart.quantity;

    subTotal += itemTotal;

    return {
      itemId: item._id.toString(),
      name: item.name,
      price: item.price,
      quantity: cart.quantity,
    };
  });

  const deliveryFee = subTotal > 150 ? 0 : distance < 2 ? 34 : distance * 17;
  const platformFee = subTotal * 0.05; // Example: 5% of total price
  const totalAmount = subTotal + deliveryFee + platformFee;

  const expireAt = new Date(Date.now() + 15 * 60 * 1000);
  const [longitude, latitude] = address.location.coordinates;

  const riderEarning = Math.ceil(distance) * 17;

  const order = await Order.create({
    userId: user._id.toString(),
    restaurantId: restaurantId.toString(),
    restaurantName: restaurant.name,
    riderId: null,
    distance,
    riderEarning: riderEarning,
    items: orderItems,
    subTotal,
    deliveryCharge: deliveryFee,
    platformCharge: platformFee,
    totalAmount,
    addressId: address._id.toString(),
    deliveryAddress: {
      fromattedAddress: address.formattedAddress,
      mobile: address.mobile,
      latitude,
      longitude,
    },

    paymentMethod,
    paymentStatus: "pending",
    status: "placed",
    expireAt,
  });

  await Cart.deleteMany({ userId: user._id });

  res.status(201).json({
    message: "Order created successfully",
    orderId: order._id.toString(),
    amount: totalAmount,
  });
};

export const fetchOrderForPayment = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({
      message: "Order not found",
    });
  }

  if (order.paymentStatus !== "pending") {
    return res.status(400).json({
      message: "Order already paid",
    });
  }

  res.status(200).json({
    orderId: order._id.toString(),
    amount: order.totalAmount,
    currency: "INR",
  });
};

export const fetchRestaurantOrders = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { restaurantId } = req.params;

    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant ID is required" });
    }

    const { limit } = req.query;

    const orders = await Order.find({
      restaurantId,
      paymentStatus: "paid",
    })
      .sort({ createdAt: -1 })
      .limit(limit ? parseInt(limit as string) : 20);

    return res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Error fetching restaurant orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const ALLOWED_STATUSES = ["accepted", "preparing", "ready_for_rider"] as const;

export const updateOrderStatus = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { orderId } = req.params;
    const { status } = req.body;

    if (!ALLOWED_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({
          message: `Invalid status. Allowed statuses are: ${ALLOWED_STATUSES.join(", ")}`,
        });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus !== "paid") {
      return res
        .status(400)
        .json({ message: "Cannot update status of unpaid order" });
    }

    const restaurant = await Restaurant.findById(order.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    if (restaurant.ownerId.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not the owner of the restaurant" });
    }

    order.status = status;
    await order.save();

    await axios.post(
      `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
      {
        event: "order:status_updated",
        room: `user:${order.userId}`,
        payload: {
          orderId: order._id.toString(),
          status: order.status,
        },
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
        },
      },
    );
    //now assign rider if order is ready for pickup
    if (status === "ready_for_rider") {
      console.log("Publishing Order Ready for rider", order._id);
      await publishEvent("ORDER_READY_FOR_RIDER", {
        orderId: order._id.toString(),
        restaurantId: restaurant._id.toString(),
        location: restaurant.autoLocation,
      });
      console.log("Event Published Successfully");
    }

    res.json({ message: "Order status updated successfully", order });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getMyOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const orders = await Order.find({
      userId: user._id.toString(),
      paymentStatus: "paid",
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSingleOrder = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to view this order" });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error fetching single order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const assignRiderToOrder = async (req: Request, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  const { orderId, riderId, riderName, riderPhone } = req.body;

  const orderAvailable = await Order.findOne({ riderId, status: { $ne: "delivered" } });
  if (orderAvailable) {
    return res.status(409).json({
      message: "Rider is currently assigned to another order",
    });
  }

  const order = await Order.findById(orderId);
  if (order?.riderId !== null) {
    return res.status(404).json({
      message: "Order Already Assign",
    });
  }

  const updatedOrder = await Order.findOneAndUpdate(
    {
      _id: orderId,
      riderId: null,
    },
    {
      riderId,
      riderName,
      riderPhone,
      status: "rider_assigned",
    },
    {
      new: true,
    },
  );
  await axios.post(
    `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
    {
      event: "order:rider_assigned",
      room: `user:${order.userId}`,
      payload: order,
    },
    {
      headers: {
        "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
      },
    },
  );
  await axios.post(
    `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
    {
      event: "order:rider_assigned",
      room: `restaurant:${order.restaurantId}`,
      payload: order,
    },
    {
      headers: {
        "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
      },
    },
  );

  res.json({
    message: "Rider assigned successfully",
    success: true,
    order: updatedOrder,
  });
};

export const getCurrentOrdersForRider = async (req: Request, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  const { riderId } = req.query;
  if (!riderId) {
    return res.status(400).json({
      message: "Rider id is required",
    });
  }

  const order = await Order.findOne({
    riderId,
    status: { $ne: "delivered" },
  }).populate("restaurantId");

  if (!order) {
    return res.status(404).json({
      message: "Order not found",
    });
  }

  res.json(order);
};

export const getOrderPreviewForRider = async (req: Request, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  const { orderId } = req.params;
  if (!orderId) {
    return res.status(400).json({
      message: "Order id is required",
    });
  }

  const order = await Order.findById(orderId).select(
    "restaurantName totalAmount riderEarning distance deliveryAddress status riderId",
  );

  if (!order) {
    return res.status(404).json({
      message: "Order not found",
    });
  }

  if (order.riderId) {
    return res.status(409).json({
      message: "Order already assigned",
    });
  }

  if (order.status !== "ready_for_rider") {
    return res.status(409).json({
      message: "Order is no longer available for riders",
    });
  }

  return res.json({
    order: {
      _id: order._id,
      restaurantName: order.restaurantName,
      totalAmount: order.totalAmount,
      riderEarning: order.riderEarning,
      distance: order.distance,
      deliveryAddress: order.deliveryAddress,
    },
  });
};

export const getDeliveredOrdersForRider = async (req: Request, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  const riderId = (req.query?.riderId as string | undefined)?.trim();
  const range = (req.query?.range as string | undefined)?.trim() || "week";

  if (!riderId) {
    return res.status(400).json({
      message: "Rider id is required",
    });
  }

  const now = new Date();
  let startDate: Date | null = null;

  if (range === "day") {
    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else if (range === "week") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === "month") {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (range !== "all") {
    return res.status(400).json({
      message: "Invalid range. Use day, week, month, or all",
    });
  }

  const query: any = {
    riderId,
    status: "delivered",
    paymentStatus: "paid",
  };

  if (startDate) {
    query.updatedAt = { $gte: startDate };
  }

  const orders = await Order.find(query)
    .sort({ updatedAt: -1 })
    .select(
      "_id restaurantName totalAmount riderEarning distance deliveryAddress status updatedAt createdAt",
    );

  const totalEarning = orders.reduce((sum, order) => sum + (order.riderEarning || 0), 0);
  const totalDistance = orders.reduce((sum, order) => sum + (order.distance || 0), 0);

  return res.json({
    filter: range,
    summary: {
      totalDelivered: orders.length,
      totalEarning,
      totalDistance: Number(totalDistance.toFixed(2)),
      averageEarning: orders.length ? Number((totalEarning / orders.length).toFixed(2)) : 0,
    },
    orders,
  });
};
export const updateOrderStatusByRider = async (req: Request, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  const orderId =
    (req.body?.orderId as string | undefined) ||
    (req.query?.orderId as string | undefined);

  if (!orderId) {
    return res.status(400).json({
      message: "Order id is required",
    });
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({
      message: "Order not found",
    });
  }

  if (order.status === "rider_assigned") {
    order.status = "picked_up";

    await order.save();

    await axios.post(
      `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `restaurant:${order.restaurantId}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
        },
      },
    );

    await axios.post(
      `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `user:${order.userId}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
        },
      },
    );

    return res.json({
      message: "Order status updated to picked up",
    });
  }

  if (order.status === "picked_up"){
    order.status = "delivered";
    await order.save();

    await axios.post(
      `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `restaurant:${order.restaurantId}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
        },
      },
    );

    await axios.post(
      `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `user:${order.userId}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
        },
      },
    );

    return res.json({
      message: "Order status updated to delivered",
    });
  }

  return res.status(400).json({
    message: `Cannot update order from status ${order.status}`,
  });
};

export const getRestaurantSalesAnalytics = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { restaurantId } = req.params;
    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant ID is required" });
    }

    const range = (req.query?.range as string | undefined)?.trim() || "week";

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || restaurant.ownerId.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const now = new Date();
    let startDate: Date | null = null;

    if (range === "day") {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (range === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "month") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range !== "all") {
      return res.status(400).json({
        message: "Invalid range. Use day, week, month, or all",
      });
    }

    const query: any = {
      restaurantId,
      status: "delivered",
      paymentStatus: "paid",
    };

    if (startDate) {
      query.updatedAt = { $gte: startDate };
    }

    const orders = await Order.find(query).select("totalAmount deliveryCharge items updatedAt");

    const totalRevenue = orders.reduce((sum, order) => {
      // Restaurant revenue is typically subtotal, but we'll use totalAmount without delivery/platform charge if possible
      // Using totalAmount for simplicity as requested "total sales amount"
      return sum + (order.totalAmount || 0);
    }, 0);

    // Grouping by Date for timeSeries (Chart)
    const timeSeriesMap: Record<string, number> = {};
    const itemMap: Record<string, { name: string; quantity: number; revenue: number }> = {};

    orders.forEach((order) => {
      // TimeSeries grouping
      const dateStr = order.updatedAt.toISOString().split("T")[0] as string; // YYYY-MM-DD
      timeSeriesMap[dateStr] = (timeSeriesMap[dateStr] || 0) + order.totalAmount;

      // Itemwise totals
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (!itemMap[item.itemId]) {
            itemMap[item.itemId] = { name: item.name, quantity: 0, revenue: 0 };
          }
          itemMap[item.itemId]!.quantity += item.quantity || 0;
          itemMap[item.itemId]!.revenue += (item.price || 0) * (item.quantity || 0);
        });
      }
    });

    // Format timeseries for chart
    const timeSeriesData = Object.entries(timeSeriesMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Format itemwise data
    const itemWiseData = Object.values(itemMap)
      .sort((a, b) => b.revenue - a.revenue); // Sort by highest revenue

    return res.json({
      success: true,
      filter: range,
      summary: {
        totalOrders: orders.length,
        totalRevenue: Number(totalRevenue.toFixed(2)),
      },
      timeSeriesData,
      itemWiseData,
    });
  } catch (error) {
    console.error("Error fetching restaurant sales analytics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
