"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CustomToast() {
  return (
    <ToastContainer
      position="bottom-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="colored" // Ensures the color scheme follows the light/dark theme
      toastClassName="!bg-[var(--surface-card)] !text-[var(--text-primary)] !border !border-[var(--border-primary)] !rounded-[var(--radius-md)] !shadow-[var(--shadow-md)]"
      progressClassName="!bg-[var(--primary)]"
      // Customize different toast types for light and dark themes
      style={{
        // Light theme colors for different toast types
        "--toastify-color-light": "var(--surface-card)", // Default background color for light theme
        "--toastify-color-dark": "var(--surface-card)", // Default background color for dark theme
        "--toastify-color-info-light": "var(--info)", // Info background color for light theme
        "--toastify-color-success-light": "var(--success)", // Success background color for light theme
        "--toastify-color-warning-light": "var(--warning)", // Warning background color for light theme
        "--toastify-color-error-light": "var(--error)", // Error background color for light theme
        
        // Dark theme colors for different toast types
        "--toastify-color-info-dark": "var(--info)", // Info background color for dark theme
        "--toastify-color-success-dark": "var(--success)", // Success background color for dark theme
        "--toastify-color-warning-dark": "var(--warning)", // Warning background color for dark theme
        "--toastify-color-error-dark": "var(--error)", // Error background color for dark theme
        
        // Text colors for light and dark themes
        "--toastify-text-color-light": "var(--text-primary)", // Text color for light theme
        "--toastify-text-color-dark": "var(--text-primary)", // Text color for dark theme
        "--toastify-text-color-info-light": "var(--text-inverted)", // Info text color for light theme
        "--toastify-text-color-success-light": "var(--text-inverted)", // Success text color for light theme
        "--toastify-text-color-warning-light": "var(--text-inverted)", // Warning text color for light theme
        "--toastify-text-color-error-light": "var(--text-inverted)", // Error text color for light theme
        
        "--toastify-text-color-info-dark": "var(--text-primary)", // Info text color for dark theme
        "--toastify-text-color-success-dark": "var(--text-primary)", // Success text color for dark theme
        "--toastify-text-color-warning-dark": "var(--text-primary)", // Warning text color for dark theme
        "--toastify-text-color-error-dark": "var(--text-primary)", // Error text color for dark theme
      }}
    />
  );
}
