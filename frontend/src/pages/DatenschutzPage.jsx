import React from 'react';
import { Box, Container, Typography, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Header from '../components/Header';
import Footer from '../components/Footer';

const DatenschutzPage = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.default' 
    }}>
      <Header />
      
      <Container maxWidth="md" sx={{ flex: 1, py: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
        >
          Zurück
        </Button>

        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Datenschutzerklärung
          </Typography>

          <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
            1. Datenschutz auf einen Blick
          </Typography>

          <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1 }}>
            Allgemeine Hinweise
          </Typography>
          <Typography variant="body1" paragraph>
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen 
            Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit 
            denen Sie persönlich identifiziert werden können.
          </Typography>

          <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1 }}>
            Datenerfassung auf dieser Website
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br />
            Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten 
            können Sie dem Impressum dieser Website entnehmen.
          </Typography>

          <Typography variant="body1" paragraph>
            <strong>Wie erfassen wir Ihre Daten?</strong><br />
            Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich 
            z.B. um Daten handeln, die Sie in ein Kontaktformular eingeben oder bei der Registrierung angeben.
          </Typography>

          <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
            2. Hosting und Content Delivery Networks (CDN)
          </Typography>

          <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1 }}>
            Microsoft Azure
          </Typography>
          <Typography variant="body1" paragraph>
            Wir hosten die Inhalte unserer Website bei Microsoft Azure. Anbieter ist die Microsoft Corporation, 
            One Microsoft Way, Redmond, WA 98052-6399, USA (nachfolgend „Azure").
          </Typography>

          <Typography variant="body1" paragraph>
            Wenn Sie unsere Website besuchen, erfasst Azure verschiedene Logfiles inklusive Ihrer IP-Adressen. 
            Details entnehmen Sie der Datenschutzerklärung von Azure: 
            https://privacy.microsoft.com/de-de/privacystatement
          </Typography>

          <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
            3. Allgemeine Hinweise und Pflichtinformationen
          </Typography>

          <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1 }}>
            Datenschutz
          </Typography>
          <Typography variant="body1" paragraph>
            Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln 
            Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften 
            sowie dieser Datenschutzerklärung.
          </Typography>

          <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1 }}>
            Hinweis zur verantwortlichen Stelle
          </Typography>
          <Typography variant="body1" paragraph>
            Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:<br /><br />
            [Ihr Name oder Firmenname]<br />
            [Straße und Hausnummer]<br />
            [PLZ und Ort]<br />
            Deutschland<br /><br />
            Telefon: [Ihre Telefonnummer]<br />
            E-Mail: [Ihre E-Mail-Adresse]
          </Typography>

          <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
            4. Datenerfassung auf dieser Website
          </Typography>

          <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1 }}>
            Registrierung auf dieser Website
          </Typography>
          <Typography variant="body1" paragraph>
            Sie können sich auf dieser Website registrieren, um zusätzliche Funktionen zu nutzen. Die dazu 
            eingegebenen Daten verwenden wir nur zum Zwecke der Nutzung des jeweiligen Angebotes oder Dienstes, 
            für den Sie sich registriert haben. Die bei der Registrierung abgefragten Pflichtangaben müssen 
            vollständig angegeben werden. Anderenfalls werden wir die Registrierung ablehnen.
          </Typography>

          <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1 }}>
            Verschlüsselung
          </Typography>
          <Typography variant="body1" paragraph>
            Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte eine 
            SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die 
            Adresszeile des Browsers von „http://" auf „https://" wechselt und an dem Schloss-Symbol in Ihrer 
            Browserzeile.
          </Typography>

          <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
            5. Ihre Rechte
          </Typography>

          <Typography variant="body1" paragraph>
            Sie haben jederzeit das Recht unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer 
            gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung, 
            Sperrung oder Löschung dieser Daten zu verlangen. Hierzu sowie zu weiteren Fragen zum Thema 
            Datenschutz können Sie sich jederzeit unter der im Impressum angegebenen Adresse an uns wenden.
          </Typography>

          <Typography variant="body2" sx={{ mt: 4, color: 'text.secondary' }}>
            Stand: {new Date().toLocaleDateString('de-DE')}
          </Typography>
        </Paper>
      </Container>

      <Footer />
    </Box>
  );
};

export default DatenschutzPage;