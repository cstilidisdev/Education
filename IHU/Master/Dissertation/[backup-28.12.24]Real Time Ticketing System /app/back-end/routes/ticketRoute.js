import express from "express";
import Ticket from "../models/ticketModel.js";
import { sendMessage } from "../services/kafkaProducer.js";
import authenticateJWT from "../middleware/authMiddleware.js";

// Create an instance of Router interface
const router = express.Router();

// Create new ticket
router.post("/create", authenticateJWT, async (req, res) => {
  try {
    // Extract fields from the request body
    const { title, description, category } = req.body;
    const userId = req.user.id;

    // Create ticket object
    const ticketData = {
      title,
      description,
      category,
      status: "Waiting",
      createdBy: userId,
    };

    // Send the new ticket data to Kafka
    const messageData = JSON.stringify(ticketData);
    await sendMessage("new-ticket", messageData);

    // Emit "ticket-created" event
    const io = req.app.get("io");
    if (io) {
      io.emit("ticket-created", ticketData);
      console.log("Emitting ticket-created event:", ticketData);
    }

    return res.status(201).json(ticketData);
  } catch (error) {
    if (error.message.includes("Kafka")) {
      return res
        .status(503)
        .json({ error: "Failed to send ticket data to Kafka." });
    }

    console.error("Error creating ticket:", error.message);
    res.status(500).json({
      error: "An unexpected error occurred while creating the ticket.",
    });
  }
});

// Get all tickets
router.get("/", authenticateJWT, async (req, res) => {
  try {
    const { role, department, id } = req.user;

    let tickets;
    if (role === "user") {
      // Get tickets for the logged-in user
      tickets = await Ticket.find({ createdBy: id });
    } else if (role === "agent") {
      // Get tickets for the agent's department
      tickets = await Ticket.find({ category: department });
    } else if (role === "admin") {
      // Admin gets all tickets with createdBy populated
      tickets = await Ticket.find().populate("createdBy", "username");
    } else {
      return res.status(403).json({ message: "Unauthorized role" });
    }
    res.status(200).json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get ticket by id
router.get("/:id", async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate(
      "createdBy",
      "username"
    ); // Populate createdBy field with username
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    res.status(200).json(ticket);
  } catch (err) {
    console.error("Error fetching ticket by ID:", err.message);
    res.status(500).json({ message: err.message });
  }
});

/// Update ticket
router.put("/:id", authenticateJWT, async (req, res) => {
  try {
    const { role } = req.user;
    const { status } = req.body;

    if (role !== "agent" && role !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized to update tickets" });
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("createdBy", "username");

    if (!updatedTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Emit "statusUpdated" event
    const io = req.app.get("io");
    if (io) {
      io.emit("status-updated", updatedTicket); // Broadcast the update
    }

    res.status(200).json({
      message: "Ticket status updated successfully",
      updatedTicket,
    });
  } catch (error) {
    console.error("Error in updating ticket:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete ticket
router.delete("/:id", async (req, res) => {
  try {
    // Extract the ticket ID
    const ticketId = req.params.id;

    // Find and delete the ticket
    const ticketToDelete = await Ticket.findByIdAndDelete(req.params.id);

    // Check if exist
    if (!ticketToDelete)
      return res.status(404).json({ message: "Ticket not found" });

    // Emit the "ticket-delete" event
    const io = req.app.get("io");
    if (io) {
      io.emit("ticket-deleted", { ticketId });
    }

    res.status(200).json("Ticket deleted successfully");
  } catch (err) {
    console.error("Error deleting ticket:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
