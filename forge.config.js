const packageJson = require('./package.json');

module.exports = {
  packagerConfig: {
    icon: 'img/cumulus.ico',
    // uncomment the next line to customize the name of the executable (ie. Cumulus-1.0.0.exe)
    // name: `${packageJson.productName}-${packageJson.version}`,
    overwrite: true,
    platform: 'win32',
    arch: 'x64',
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32']
    }
  ],
  publishers: []
};
