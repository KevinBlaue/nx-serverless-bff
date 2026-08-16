const path = require('node:path');

module.exports = () => ({
  bundle: true,
  format: 'cjs',
  metafile: true,
  minify: true,
  platform: 'node',
  sourcemap: false,
  target: 'node24',
  tsconfig: path.join(__dirname, 'tsconfig.app.json'),
});
