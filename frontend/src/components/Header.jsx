import React from 'react';
import { Box, Typography } from '@mui/material';
import layer8Logo from '../assets/layer8.png';

// Header-Komponente mit Layer8-Logo und TrustMe-Branding
const Header = () => {
  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 2,
        px: 3,
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)', // Subtiler Schatten
      }}
    >
      {/* Logo und Titel Container */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Layer8 Logo */}
        <img 
          src={layer8Logo} 
          alt="Layer8 Logo" 
          style={{ 
            height: '50px', 
            width: 'auto'
          }} 
        />
        {/* Branding Text */}
        <Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            TrustMe
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
            Password Manager
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Header;