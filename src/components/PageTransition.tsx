import { Box } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // Start transition
    setIsTransitioning(true);

    // Short delay to allow fade out animation
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsTransitioning(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [location.pathname, children]);

  return (
    <Box
      style={{
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? "translateY(10px)" : "translateY(0)",
        transition: "all 0.3s ease-in-out",
        minHeight: "100%",
      }}
    >
      {displayChildren}
    </Box>
  );
}
