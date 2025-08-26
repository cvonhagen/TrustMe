import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import { ExitToApp as ExitToAppIcon, Brightness4 as Brightness4Icon, Brightness7 as Brightness7Icon } from '@mui/icons-material';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { useThemeContext } from '../ThemeContext';

const Navbar = () => {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toggleColorMode, mode } = useThemeContext();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Nur anzeigen, wenn der Benutzer authentifiziert ist
  if (!isAuthenticated) return null;

  return (
    <AppBar position="static" sx={{ mb: 2 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          TrustMe
        </Typography>
        <IconButton onClick={toggleColorMode} color="inherit">
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
        <IconButton onClick={handleLogout} color="inherit">
          <ExitToAppIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;