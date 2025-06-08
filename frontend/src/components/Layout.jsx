import React from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Brightness4 as Brightness4Icon, Brightness7 as Brightness7Icon, ExitToApp as ExitToAppIcon, Dashboard as DashboardIcon, Security as SecurityIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useThemeContext } from '../ThemeContext';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 240;

const Layout = ({ children }) => {
  const { toggleColorMode, mode } = useThemeContext();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: '2FA Einrichtung', icon: <SecurityIcon />, path: '/setup-2fa' },
    { text: 'Einstellungen', icon: <SettingsIcon />, path: '/settings' }, // Eine zukünftige Einstellungsseite
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          boxShadow: 'none', // Flat Design
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)', // Dezenter Trenner im Darkmode
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            TrustMe
          </Typography>
          <IconButton onClick={toggleColorMode} color="inherit">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <IconButton onClick={handleLogout} color="inherit" sx={{ ml: 1 }}>
            <ExitToAppIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            boxShadow: 'none', // Flat Design
            borderRight: '1px solid rgba(255, 255, 255, 0.12)', // Dezenter Trenner im Darkmode
            backgroundColor: mode === 'dark' ? '#1E1E1E' : '#FFFFFF', // Hintergrundfarbe für Sidebar
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar /> {/* Platzhalter für AppBar-Höhe */}
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding onClick={() => navigate(item.path)}>
                <ListItemButton>
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar /> {/* Platzhalter für AppBar-Höhe im Hauptinhalt */}
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 