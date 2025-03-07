import React, { useState, useEffect } from "react";
import axios from "axios";
import endpoints from "../../api/endpoints";
import CreateTicket from "../../Shared/CreateTicket";
import io from "socket.io-client";

const handleLogout = () => {
  localStorage.clear();
  window.location.href = "/";
};

function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState("");

  useEffect(() => {
    console.log("Admin Dashboard useEffect triggered");
    // Get username
    const username = localStorage.getItem("username");
    setUsername(username);

    // Initialize WebSocket connection
    const socket = io("http://localhost:8000"); // WebSocket server
    setSocket(socket);

    // Log connection ID when WebSocket connects
    socket.on("connect", () => {
      console.log("WebSocket connected with ID:", socket.id);
    });

    // Handle ticket-created event
    socket.on("ticket-created", () => {
      console.log("New ticket created. Refetching tickets...");
      fetchTickets();
    });

    // Listen for the "statusUpdated" event
    socket.on("status-updated", (updatedTicket) => {
      if (!updatedTicket) {
        console.error("No data received for statusUpdated event");
        return;
      }

      // Update tickets list
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket._id === updatedTicket._id ? updatedTicket : ticket
        )
      );

      // Update the selected ticket if it matches the updated ticket
      setSelectedTicket((prevSelected) =>
        prevSelected && prevSelected._id === updatedTicket._id
          ? updatedTicket
          : prevSelected
      );
    });

    // Fetch tickets
    fetchTickets();

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      console.log("WebSocket cleanup for Admin Dashboard");
    };
  }, []);

  // Get all tickets
  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      const response = await axios.get(endpoints.GET_TICKETS, {
        headers: {
          Authorization: `Bearer ${token}`,
          Role: role,
        },
      });
      setTickets(response.data);
    } catch (error) {
      console.error("Error fetching tickets:", error.message);
    }
  };

  // Get specific ticket
  const fetchTicketDetails = async (ticketId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(endpoints.GET_TICKET_BY_ID(ticketId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSelectedTicket(response.data);
    } catch (error) {
      console.error("Error fetching ticket details:", error.message);
    }
  };

  // Delete a ticket
  const deleteTicket = async (ticketId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this ticket?"
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(endpoints.DELETE_TICKET(ticketId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTickets(tickets.filter((ticket) => ticket._id !== ticketId));
      alert("Ticket deleted successfully.");
    } catch (error) {
      console.error("Error deleting ticket:", error.message);
    }
  };

  const handleUpdateTicket = async (ticketId, status) => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.put(
        endpoints.UPDATE_TICKET(ticketId),
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        const updatedTicket = response.data.updatedTicket;
        setTickets((prevTickets) =>
          prevTickets.map((ticket) =>
            ticket._id === updatedTicket._id ? updatedTicket : ticket
          )
        );
      } else {
        throw new Error("Failed to update Ticket.");
      }

      socket.emit("status-updated", response.data.updatedTicket);
    } catch (error) {
      console.error("Error updating ticket:", error.message);
      alert("Failed to update Ticket");
    }
  };

  return (
    <div>
      <header className="dashboardHeader">
        <div className="headerLeft">Welcome, {username || "[Username]"}</div>
        <h3 className="headerCenter">Admin Dashboard</h3>
        <button className="logoutButton" onClick={handleLogout}>
          Logout
        </button>
      </header>
      <hr className="divider" />

      {/* Create Ticket Section */}
      <div className="createTicketSection">
        <CreateTicket />
      </div>
      <hr className="divider" />

      {/* Tickets and Details */}
      <div className="dashboardContainer">
        {/* Ticket List Section */}
        <div className="ticketsList">
          <h3 className="sectionHeader">Ticket List</h3>
          <ul className="ticketList">
            {tickets.length > 0 ? (
              tickets.map((ticket, index) => (
                <React.Fragment key={ticket._id}>
                  <li className="ticketItem">
                    <strong>Title:</strong> {ticket.title}
                    <br />
                    <strong>Status:</strong>{" "}
                    <select
                      value={ticket.status}
                      onChange={(e) =>
                        handleUpdateTicket(ticket._id, e.target.value)
                      }
                    >
                      <option value="Waiting">Waiting</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                    <br />
                    <button onClick={() => fetchTicketDetails(ticket._id)}>
                      View Details
                    </button>
                    <button onClick={() => deleteTicket(ticket._id)}>
                      Delete
                    </button>
                  </li>
                  {index !== tickets.length - 1 && (
                    <hr className="ticketItemDivider" /> /* Add divider after each ticket */
                  )}
                </React.Fragment>
              ))
            ) : (
              <p>No tickets available</p>
            )}
          </ul>
        </div>

        {/* Ticket Details Section */}
        <div className="ticketDetails">
          <h3 className="sectionHeader">Ticket Details</h3>
          {selectedTicket ? (
            <div>
              <p>
                <strong>Title:</strong> {selectedTicket.title}
              </p>
              <p>
                <strong>Description:</strong> {selectedTicket.description}
              </p>
              <p>
                <strong>Category:</strong> {selectedTicket.category}
              </p>
              <p>
                <strong>Status:</strong> {selectedTicket.status}
              </p>
              <p>
                <strong>Created By:</strong>{" "}
                {selectedTicket.createdBy?.username || "N/A"}
              </p>
            </div>
          ) : (
            <p>Select a ticket to view details</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
