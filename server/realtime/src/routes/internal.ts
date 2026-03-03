import { Router } from "express";
import { getIO } from "../socket.js";

const router = Router();

router.route('/emit').post((req, res) => {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
      return res.status(403).json({
      message: "Forbidden",
      });
    }

    const { event, payload, room } = req.body;
    if (!event || !room) {
        return res.status(400).json({
            message: "Event and payload are required",
        });
    }

    const io = getIO();
    console.log(`Emmiting event ${event} to room ${room}`);

    io.to(room).emit(event, payload);

    return res.status(200).json({
        success: true,
    });
    
})

export default router;