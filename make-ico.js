const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  const iconPng = path.join('public', 'icon.png');
  const iconFixed = path.join('public', 'icon_fixed.png');
  const iconIco = path.join('public', 'icon.ico');

  console.log('Redimensionnement du logo...');
  execSync(`npx -y jimp-compact "${iconPng}" --resize 256,256 --output "${iconFixed}"`, { stdio: 'inherit' });
  
  console.log('Conversion en format .ico Windows...');
  const icoBuffer = execSync(`npx -y png-to-ico "${iconFixed}"`, { maxBuffer: 10 * 1024 * 1024 });
  
  fs.writeFileSync(iconIco, icoBuffer);
  console.log('Succès ! Icône créée :', iconIco, '(', icoBuffer.length, 'octets)');
} catch (e) {
  console.error('Erreur lors de la création de l\'icône :', e.message);
  process.exit(1);
}
