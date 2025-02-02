import React from "react";

export function Card({ children, className = "" }) {
  return (
    <div
      className={`shadow-lg p-4 bg-white rounded-md ${className}`}
    >
      {children}
    </div>
  );
}
