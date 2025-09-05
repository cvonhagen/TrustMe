import React from "react";
import { Box, Typography, Container, Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import layer8Logo from "../assets/layer8.png";

// Fester Footer mit Sternenhimmel-Hintergrund und Layer8-Branding
const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        position: "fixed", // Immer sichtbar beim Scrollen
        bottom: 0,
        left: 0,
        right: 0,
        py: 1.5,
        px: 2,
        backgroundImage:
          "url(/src/assets/sternenhimmel-und-mond-gemischte-medien-700-97944939.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: "white",
        textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
        minHeight: "80px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000, // Über anderen Inhalten
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.4)", // Dunkler Overlay für Lesbarkeit
          zIndex: 1,
        },
        "& *": {
          position: "relative",
          zIndex: 2,
        },
      }}
    >
      <Container maxWidth="lg">
        {/* Logo und Copyright Container */}
        <Box
          textAlign="center"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}
        >
          {/* Layer8 Logo mit Schatten */}
          <img
            src={layer8Logo}
            alt="Layer8 Logo"
            style={{
              height: "40px",
              width: "auto",
              filter: "drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.8))",
            }}
          />
          {/* Branding und Copyright */}
          <Box>
            <Typography
              variant="body1"
              component="span"
              sx={{ fontWeight: "bold" }}
            >
              TrustMe Password Manager
            </Typography>
            <Typography
              variant="body2"
              sx={{ opacity: 0.8, fontSize: "0.75rem" }}
            >
              © 2025 Layer8. Alle Rechte vorbehalten.
            </Typography>
            <Box sx={{ mt: 0.5, display: "flex", gap: 2 }}>
              <Link
                component={RouterLink}
                to="/impressum"
                sx={{
                  color: "white",
                  textDecoration: "none",
                  fontSize: "0.7rem",
                  opacity: 0.8,
                  "&:hover": {
                    opacity: 1,
                    textDecoration: "underline",
                  },
                }}
              >
                Impressum
              </Link>
              <Link
                component={RouterLink}
                to="/datenschutz"
                sx={{
                  color: "white",
                  textDecoration: "none",
                  fontSize: "0.7rem",
                  opacity: 0.8,
                  "&:hover": {
                    opacity: 1,
                    textDecoration: "underline",
                  },
                }}
              >
                Datenschutz
              </Link>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
