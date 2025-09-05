import React from 'react';
import { Box, Container, Typography, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ImpressumPage = () => {
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
            Impressum
          </Typography>

          <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
            Angaben gemäß § 5 TMG
          </Typography>

          <Typography variant="body1" paragraph>
            <strong>TrustMe Password Manager</strong><br />
            [Ihr Name oder Firmenname]<br />
            [Straße und Hausnummer]<br />
            [PLZ und Ort]<br />
            Deutschland
          </Typography>

          <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1 }}>
            Kontakt
          </Typography>
          <Typography variant="body1" paragraph>
            Telefon: [Ihre Telefonnummer]<br />
            E-Mail: [Ihre E-Mail-Adresse]
          </Typography>

          <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1 }}>
            Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
          </Typography>
          <Typography variant="body1" paragraph>
            [Ihr Name]<br />
            [Straße und Hausnummer]<br />
            [PLZ und Ort]
          </Typography>

          <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
            Haftungsausschluss
          </Typography>

          <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1 }}>
            Haftung für Inhalte
          </Typography>
          <Typography variant="body1" paragraph>
            Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den 
            allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht 
            unter der Verpflichtung, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach 
            Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
          </Typography>

          <Typography variant="body1" paragraph>
            Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen 
            Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt 
            der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden 
            Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
          </Typography>

          <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1 }}>
            Haftung für Links
          </Typography>
          <Typography variant="body1" paragraph>
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. 
            Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der 
            verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
          </Typography>

          <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1 }}>
            Urheberrecht
          </Typography>
          <Typography variant="body1" paragraph>
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem 
            deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung 
            außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen 
            Autors bzw. Erstellers.
          </Typography>

          <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
            Datenschutz
          </Typography>
          <Typography variant="body1" paragraph>
            Die Nutzung unserer Webseite ist in der Regel ohne Angabe personenbezogener Daten möglich. 
            Soweit auf unseren Seiten personenbezogene Daten (beispielsweise Name, Anschrift oder 
            E-Mail-Adressen) erhoben werden, erfolgt dies, soweit möglich, stets auf freiwilliger Basis.
          </Typography>

          <Typography variant="body1" paragraph>
            Wir weisen darauf hin, dass die Datenübertragung im Internet (z.B. bei der Kommunikation per E-Mail) 
            Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist 
            nicht möglich.
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

export default ImpressumPage;