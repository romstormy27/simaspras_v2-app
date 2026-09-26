import QRCode from 'qrcode';

export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 320,
      margin: 2,
      color: {
        dark: '#034275',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (error) {
    console.error('Failed to generate QR Code:', error);
    throw new Error('Gagal membuat kode QR');
  }
}

export async function generateQrSvg(text: string): Promise<string> {
  try {
    return await QRCode.toString(text, {
      type: 'svg',
      width: 280,
      margin: 2,
      color: {
        dark: '#034275',
        light: '#ffffff',
      },
    });
  } catch (error) {
    console.error('Failed to generate QR SVG:', error);
    throw new Error('Gagal membuat SVG kode QR');
  }
}
