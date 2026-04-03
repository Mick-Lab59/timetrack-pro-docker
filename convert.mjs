import fs from 'fs';
import pngToIco from 'png-to-ico';

async function convert() {
  try {
    const buf = await pngToIco('public/icon.png');
    fs.writeFileSync('public/icon.ico', buf);
    console.log('Icône créée avec succès ! Taille:', buf.length, 'octets');
  } catch (err) {
    console.error('Erreur lors de la conversion:', err);
    process.exit(1);
  }
}

convert();
