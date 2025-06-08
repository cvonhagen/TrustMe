import React, { createContext, useState, useMemo, useContext } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

export const ThemeContext = createContext({
	toggleColorMode: () => {},
	mode: 'dark',
});

export const ThemeProvider = ({ children }) => {
	const [mode, setMode] = useState('dark');

	const toggleColorMode = useMemo(
		() => () => {
			setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
		},
		[],
	);

	const theme = useMemo(
		() =>
			createTheme({
				palette: {
					mode,
					...(mode === 'light'
						? { // Helles Theme
								primary: {
									main: '#00BCD4', // Akzentfarbe für den hellen Modus
								},
								background: {
									default: '#F0F2F5',
									paper: '#FFFFFF',
								},
								text: {
									primary: '#333333',
								},
						  }
						: { // Dunkles Theme
								primary: {
									main: '#00BCD4', // Akzentfarbe (Türkis)
								},
								background: {
									default: '#121212', // Hintergrundfarbe
									paper: '#1E1E1E', // Farbe für Paper-Komponenten
								},
								text: {
									primary: '#E0E0E0', // Textfarbe
								},
						  }),
				},
				shape: {
					borderRadius: 8, // Standard-Border-Radius für Material-UI-Komponenten
				},
				components: {
					MuiButton: {
						styleOverrides: {
							root: {
								borderRadius: 20, // Rundere Buttons
								textTransform: 'none', // Keine Großbuchstaben
								// Schatten und dezente Animationen sind oft in den MUI-Standardvarianten enthalten (z.B. `contained`)
								boxShadow: 'none', // Standardmäßig keinen Box-Schatten, um Flat Design zu unterstützen
								'&:hover': {
									boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)', // Dezenter Schatten beim Hover
								},
							},
							containedPrimary: {
								'&:hover': {
									backgroundColor: mode === 'dark' ? '#00A7BB' : '#0090A0', // Anpassung der Hover-Farbe
								},
							},
						},
					},
					MuiPaper: {
						styleOverrides: {
							root: {
								boxShadow: 'none', // Keine Standard-Schatten für Paper-Komponenten
							},
						},
					},
					MuiAppBar: {
						styleOverrides: {
							root: {
								boxShadow: 'none', // Keine Standard-Schatten für AppBar
							},
						},
					},
				},
			}),
		[mode],
	);

	return (
		<ThemeContext.Provider value={{ toggleColorMode, mode }}>
			<MuiThemeProvider theme={theme}>
				<CssBaseline /> {/* Normalize CSS and apply background color */}
				{children}
			</MuiThemeProvider>
		</ThemeContext.Provider>
	);
};

export const useThemeContext = () => useContext(ThemeContext); 