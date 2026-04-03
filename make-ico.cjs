const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const iconPng = path.join('public', 'icon.png');
    const iconFixed = path.join('public', 'icon_fixed.png');
    const iconIco = path.join('public', 'icon.ico');

    console.log('--- Étape 1 : Redimensionnement ---');
    // On utilise jimp-compact via npx pour éviter les soucis d'install locale
    execSync(`npx -y jimp-compact "${iconPng}" --resize 256,256 --output "${iconFixed}"`, { stdio: 'inherit' });
    
    console.log('--- Étape 2 : Conversion ICO ---');
    // On capture le flux binaire de png-to-ico
    const buf = execSync(`npx -y png-to-ico "${iconFixed}"`, { maxBuffer: 10 * 1024 * 1024 });
    
    if (buf && buf.length > 0) {
      fs.writeFileSync(iconIco, buf);
      console.log('--- SUCCÈS ---');
      console.log('Icône créée :', iconIco, '(', buf.length, 'octets )');
    } else {
      throw new Error('Le buffer de conversion est vide.');
    }
  } catch (e) {
    console.error('ERREUR :', e.message);
    process.exit(1);
  }
}

run();
