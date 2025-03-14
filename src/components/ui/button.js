import React from "react";

const Button = ({ children, onClick, style }) => {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 20px",
        fontSize: "16px",
        backgroundColor: "#007bff",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        transition: "background-color 0.3s ease",
        ...style, // Allow custom styles to override defaults
      }}
      onMouseOver={(e) => (e.target.style.backgroundColor = "#0056b3")}
      onMouseOut={(e) => (e.target.style.backgroundColor = "#007bff")}
    >
      {children}
    </button>
  );
};

export default Button;