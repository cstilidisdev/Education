import React, { useState } from "react";
import axios from "axios";
import endpoints from "../../api/endpoints";
import { useNavigate } from "react-router-dom";

function Register() {
  const [username, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = (e) => {
    e.preventDefault();
    axios
      .post(endpoints.REGISTER, {
        username: username,
        email: email,
        password: password,
      })
      .then((response) => {
        console.log("Registration successful:", response.data);

        // Display success message
        setMessage("Registration successful!");

        // Clear form fields
        setUserName("");
        setEmail("");
        setPassword("");

        // Clear the message after 3 seconds
        setTimeout(() => {
          setMessage("");
        }, 3000);
      })
      .catch((error) => {
        if (error.response && error.response.data.message) {
          console.error("Registration error:", error.response.data.message);
        } else {
          console.error("An error occurred:", error.message);
        }
      });
  };

  return (
    <div className="registerContainer">
      <h3 className="registerHeader">Register</h3>
      <form onSubmit={handleRegister} className="registerForm">
        <div className="formGroupRegister">
          <label className="registerLabel">Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUserName(e.target.value)}
            required
            className="registerInput"
          />
        </div>
        <div className="formGroupRegister">
          <label className="registerLabel">Email:</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="registerInput"
          />
        </div>
        <div className="formGroupRegister">
          <label className="registerLabel">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="registerInput"
          />
        </div>
        <button type="submit" className="registerButton">
          Register
        </button>
      </form>
      {/* Display the success or error message */}
      {message && <p className="registerMessage">{message}</p>}
    </div>
  );
}

export default Register;
