const { execSync } = require('child_process');

function getPM2Version () {
  const output = execSync('pm2 --version', { encoding: 'utf-8' });
  return output.trim();
}

function getNodeVersion () {
  const output = execSync('node -v', { encoding: 'utf-8' });
  return output.trim();
}


module.exports = {
  getPM2Version,
  getNodeVersion,
}