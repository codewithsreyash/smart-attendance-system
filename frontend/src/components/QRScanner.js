import { QrReader } from 'react-qr-reader';
import api from '../services/api';

export default function QRScanner() {
  const handleScan = async (result) => {
    if (result) {
      try {
        await api.post('/qr/verify', { token: result });
        alert('Attendance marked!');
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }
  };

  return <QrReader onResult={handleScan} />;
}