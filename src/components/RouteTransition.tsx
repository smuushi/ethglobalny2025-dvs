import { Box } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface RouteTransitionProps {
  children: React.ReactNode;
}

export function RouteTransition({ children }: RouteTransitionProps) {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [currentChildren, setCurrentChildren] = useState(children);

  useEffect(() => {
    // Fade out current content
    setIsVisible(false);

    // After fade out completes, update content and fade in
    const timer = setTimeout(() => {
      setCurrentChildren(children);
      setIsVisible(true);
    }, 200);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Update children immediately if it's the same route (for dynamic content)
  useEffect(() => {
    if (isVisible) {
      setCurrentChildren(children);
    }
  }, [children, isVisible]);

  return (
    <>
      {/* Page transition overlay */}
      <Box
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(4px)",
          opacity: isVisible ? 0 : 0.3,
          pointerEvents: isVisible ? "none" : "auto",
          transition: "all 0.2s ease-in-out",
          zIndex: 1000,
        }}
      />

      {/* Main content with transition */}
      <Box
        style={{
          opacity: isVisible ? 1 : 0.7,
          transform: isVisible ? "translateY(0)" : "translateY(-8px)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          minHeight: "100%",
          position: "relative",
          zIndex: 1,
        }}
      >
        {currentChildren}
      </Box>
    </>
  );
}
