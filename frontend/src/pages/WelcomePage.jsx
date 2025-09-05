import React from "react";
import { Container, Typography, Box, Button, Paper, Link } from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useThemeContext } from "../ThemeContext";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import logoImage from "../assets/layer8.png";

// WelcomePage-Komponente zeigt eine Willkommensseite mit Logo und Beschreibung vor dem Login
const WelcomePage = () => {
  const navigate = useNavigate();
  const { toggleColorMode, mode } = useThemeContext();

  const handleContinue = () => {
    navigate("/login");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Theme Toggle Button - Fixed Position */}
      <Box sx={{ position: "fixed", top: 20, right: 20, zIndex: 1000 }}>
        <Button
          onClick={toggleColorMode}
          color="inherit"
          sx={{
            minWidth: "unset",
            padding: "12px",
            borderRadius: "50%",
            backgroundColor: "background.paper",
            boxShadow: 2,
            "&:hover": {
              boxShadow: 4,
            },
          }}
        >
          {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
        </Button>
      </Box>

      <Container
        component="main"
        maxWidth="lg"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          color: "text.primary",
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 4, sm: 6, md: 8 },
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: { xs: 3, sm: 4, md: 5 },
            width: "100%",
            maxWidth: "800px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: "background.paper",
            borderRadius: 4,
            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
            textAlign: "center",
            position: "relative",
            backdropFilter: "blur(10px)",
            maxHeight: "90vh",
            overflow: "hidden",
          }}
        >
          {/* Logo */}
          <Box
            sx={{
              mb: { xs: 2, md: 3 },
              transform: "scale(1)",
              transition: "transform 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            <img
              src={logoImage}
              alt="TrustMe Logo"
              style={{
                width: "100px",
                height: "100px",
                objectFit: "contain",
                filter: mode === "dark" ? "brightness(0.9)" : "none",
                borderRadius: "16px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
              }}
            />
          </Box>

          {/* Haupttitel */}
          <Typography
            variant="h2"
            component="h1"
            sx={{
              mb: 2,
              fontWeight: "bold",
              background: "linear-gradient(45deg, #1976d2, #42a5f5)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: { xs: "2rem", md: "2.8rem" },
            }}
          >
            TrustMe
          </Typography>

          {/* Untertitel */}
          <Typography
            variant="h5"
            sx={{
              mb: 3,
              color: "text.secondary",
              fontWeight: 300,
              fontSize: { xs: "1.1rem", md: "1.3rem" },
            }}
          >
            DEIN sicherer Password Manager
          </Typography>

          {/* Beschreibung */}
          <Box sx={{ mb: { xs: 3, md: 4 }, maxWidth: "600px", width: "100%" }}>
            <Typography
              variant="body1"
              sx={{
                mb: 3,
                color: "text.primary",
                fontSize: { xs: "0.95rem", md: "1rem" },
                lineHeight: 1.5,
              }}
            >
              Willkommen bei TrustMe - dem Password Manager, dem DU vertrauen
              kannst! Deine Passwörter werden mit modernster Verschlüsselung
              geschützt und bleiben immer unter DEINER Kontrolle!
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: { xs: 1.5, md: 2 },
                textAlign: "left",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: "action.hover",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "action.selected",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <Box sx={{ fontSize: "1.2rem" }}>🔒</Box>
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: "bold", fontSize: "0.9rem" }}
                  >
                    End-to-End Verschlüsselung
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: "action.hover",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "action.selected",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <Box sx={{ fontSize: "1.2rem" }}>🛡️</Box>
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: "bold", fontSize: "0.9rem" }}
                  >
                    Zwei-Faktor-Authentifizierung
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: "action.hover",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "action.selected",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <Box sx={{ fontSize: "1.2rem" }}>⚡</Box>
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: "bold", fontSize: "0.9rem" }}
                  >
                    Sichere Synchronisation
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: "action.hover",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "action.selected",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <Box sx={{ fontSize: "1.2rem" }}>🎯</Box>
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: "bold", fontSize: "0.9rem" }}
                  >
                    Benutzerfreundlich
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Fortfahren Button */}
          <Button
            variant="contained"
            size="large"
            onClick={handleContinue}
            sx={{
              px: 5,
              py: 1.5,
              fontSize: "1rem",
              fontWeight: "bold",
              borderRadius: 3,
              background: "linear-gradient(45deg, #1976d2, #42a5f5)",
              "&:hover": {
                background: "linear-gradient(45deg, #1565c0, #1976d2)",
                transform: "translateY(-2px)",
                boxShadow: 4,
              },
              transition: "all 0.3s ease",
              mt: 2,
            }}
          >
            Jetzt starten
          </Button>

          {/* Rechtliche Links */}
          <Box sx={{ mt: 3, display: "flex", gap: 3, justifyContent: "center" }}>
            <Link
              component={RouterLink}
              to="/impressum"
              sx={{
                color: "text.secondary",
                textDecoration: "none",
                fontSize: "0.8rem",
                "&:hover": {
                  textDecoration: "underline",
                  color: "primary.main",
                },
                transition: "color 0.3s ease",
              }}
            >
              Impressum
            </Link>
            <Link
              component={RouterLink}
              to="/datenschutz"
              sx={{
                color: "text.secondary",
                textDecoration: "none",
                fontSize: "0.8rem",
                "&:hover": {
                  textDecoration: "underline",
                  color: "primary.main",
                },
                transition: "color 0.3s ease",
              }}
            >
              Datenschutz
            </Link>
          </Box>

          {/* Zusätzliche Info */}
          <Typography
            variant="caption"
            sx={{
              mt: 2,
              color: "text.secondary",
              fontStyle: "italic",
            }}
          >
            Sicherheit und Vertrauen seit 2025
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default WelcomePage;
