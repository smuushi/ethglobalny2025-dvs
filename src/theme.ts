export const iglooTheme = {
  colors: {
    primary: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      200: "#bae6fd",
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9",
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e",
    },
    ice: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
    snow: "#ffffff",
    frost: "#f8fafc",
  },
  gradients: {
    iglooMain: "linear-gradient(135deg, #f0f9ff 0%, #bae6fd 50%, #7dd3fc 100%)",
    iceBlue: "linear-gradient(90deg, #e0f2fe 0%, #bae6fd 100%)",
    frostWhite: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    coolBlue: "linear-gradient(45deg, #0ea5e9 0%, #38bdf8 100%)",
    headerWhite:
      "linear-gradient(90deg, #ffffff 0%, #f0f9ff 50%, #e0f2fe 100%)",
  },
  shadows: {
    ice: "0 4px 20px rgba(14, 165, 233, 0.15)",
    frost: "0 2px 10px rgba(125, 211, 252, 0.1)",
    igloo: "0 8px 32px rgba(14, 165, 233, 0.12)",
  },
  borderRadius: {
    igloo: "24px",
    dome: "50%",
    arch: "16px",
  },
};

export const iglooStyles = {
  card: {
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    border: `1px solid #e2e8f0`,
    borderRadius: "24px",
    boxShadow: "0 4px 20px rgba(14, 165, 233, 0.15)",
    backdropFilter: "blur(10px)",
  },
  button: {
    primary: {
      background: "linear-gradient(45deg, #0ea5e9 0%, #38bdf8 100%)",
      color: "#ffffff",
      border: "none",
      borderRadius: "16px",
      boxShadow: "0 2px 10px rgba(125, 211, 252, 0.1)",
      padding: "12px 24px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
    },
    secondary: {
      background: "#ffffff",
      color: "#0284c7",
      border: `2px solid #bae6fd`,
      borderRadius: "16px",
      boxShadow: "0 2px 10px rgba(125, 211, 252, 0.1)",
      padding: "12px 24px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
    },
  },
  header: {
    background: "linear-gradient(90deg, #ffffff 0%, #f0f9ff 50%, #e0f2fe 100%)",
    borderBottom: `1px solid #e2e8f0`,
    backdropFilter: "blur(10px)",
    boxShadow: "0 2px 10px rgba(125, 211, 252, 0.1)",
  },
  container: {
    background:
      "linear-gradient(135deg, #f0f9ff 0%, #bae6fd 50%, #7dd3fc 100%)",
    minHeight: "100vh",
  },
};
