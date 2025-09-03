import React from "react";
import { Container, Typography, Box, Button, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
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
    <>
      <Container
        component="main"
        maxWidth="md"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh", // Vollbildhöhe ohne Footer
          color: "text.primary",
          px: 2,
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 6,
            width: "100%",
            maxWidth: "md",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: "background.paper",
            borderRadius: 3,
            boxShadow: 4,
            textAlign: "center",
          }}
        >
          {/* Theme Toggle Button */}
          <Box sx={{ position: "absolute", top: 20, right: 20 }}>
            <Button
              onClick={toggleColorMode}
              color="inherit"
              sx={{
                minWidth: "unset",
                padding: "12px",
                borderRadius: "50%",
              }}
            >
              {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
            </Button>
          </Box>

          {/* Logo */}
          <Box sx={{ mb: 4 }}>
            <img
              src={logoImage}
              alt="TrustMe Logo"
              style={{
                width: "120px",
                height: "120px",
                objectFit: "contain",
                filter: mode === "dark" ? "brightness(0.9)" : "none",
              }}
            />
          </Box>

          {/* Haupttitel */}
          <Typography
            variant="h2"
            component="h1"
            sx={{
              mb: 3,
              fontWeight: "bold",
              background: "linear-gradient(45deg, #1976d2, #42a5f5)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: { xs: "2.5rem", md: "3.5rem" },
            }}
          >
            TrustMe
          </Typography>

          {/* Untertitel */}
          <Typography
            variant="h5"
            sx={{
              mb: 4,
              color: "text.secondary",
              fontWeight: 300,
              fontSize: { xs: "1.2rem", md: "1.5rem" },
            }}
          >
            DEIN sicherer Password Manager
          </Typography>

          {/* Beschreibung */}
          <Box sx={{ mb: 5, maxWidth: "600px" }}>
            <Typography
              variant="body1"
              sx={{
                mb: 2,
                color: "text.primary",
                fontSize: "1.1rem",
                lineHeight: 1.6,
              }}
            >
              Willkommen bei TrustMe - dem Password Manager, dem DU vertrauen
              kannst!
            </Typography>

            <Typography
              variant="body1"
              sx={{
                mb: 3,
                color: "text.primary",
                fontSize: "1.1rem",
                lineHeight: 1.6,
              }}
            >
              Deine Passwörter werden mit modernster Verschlüsselung geschützt
              und bleiben immer unter DEINER Kontrolle!
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                textAlign: "left",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                🔒 <strong>End-to-End Verschlüsselung</strong> - Ihre Daten sind
                nur für Sie zugänglich
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                🛡️ <strong>Zwei-Faktor-Authentifizierung</strong> - Doppelter
                Schutz für Ihr Konto
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                ⚡ <strong>Sichere Synchronisation</strong> - Zugriff von
                überall, immer verschlüsselt
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                🎯 <strong>Benutzerfreundlich</strong> - Einfach zu bedienen,
                schwer zu knacken
              </Typography>
            </Box>
          </Box>

          {/* Fortfahren Button */}
          <Button
            variant="contained"
            size="large"
            onClick={handleContinue}
            sx={{
              px: 6,
              py: 2,
              fontSize: "1.1rem",
              fontWeight: "bold",
              borderRadius: 3,
              background: "linear-gradient(45deg, #1976d2, #42a5f5)",
              "&:hover": {
                background: "linear-gradient(45deg, #1565c0, #1976d2)",
                transform: "translateY(-2px)",
                boxShadow: 4,
              },
              transition: "all 0.3s ease",
            }}
          >
            Jetzt starten
          </Button>

          {/* Zusätzliche Info */}
          <Typography
            variant="caption"
            sx={{
              mt: 4,
              color: "text.secondary",
              fontStyle: "italic",
            }}
          >
            Sicherheit und Vertrauen seit 2025
          </Typography>
        </Paper>
      </Container>
    </>
  );
};

export default WelcomePage;
