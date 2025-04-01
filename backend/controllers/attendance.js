exports.generateQR = async (req, res) => {
    res.send({ qrCode: 'sample-qr-url' });
  };
  
  exports.verifyQR = async (req, res) => {
    res.send({ verified: true });
  };