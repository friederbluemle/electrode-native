const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

const afterAll = require('../utils/afterAll');
const run = require('../utils/run');

process.env['SYSTEM_TESTS'] = 'true';
process.on('SIGINT', () => afterAll());

console.log(chalk.bold.blue(`Working directory: ${process.cwd()}`));

// Miniapp commands
const miniAppName = 'BasicMiniApp';
run(`create-miniapp ${miniAppName} --packageName basic-miniapp --skipNpmCheck`);
const miniAppPath = path.join(process.cwd(), miniAppName);
shell.pushd(miniAppPath);
const dependenciesToAdd = [
  'react-native-electrode-bridge',
  'react-native-ernmovie-api-impl@0.0.16',
];
dependenciesToAdd.forEach((dep) => {
  run(`add ${dep}`);
  if (
    !Object.keys(
      JSON.parse(fs.readFileSync('package.json')).dependencies,
    ).includes(dep.split('@')[0])
  ) {
    throw new Error(`${dep} was not added to the MiniApp`);
  }
});
shell.popd();

// Escape backslashes on Windows
const miniApp = `file:${
  process.platform === 'win32'
    ? miniAppPath.replace(/\\/g, '\\\\')
    : miniAppPath
}`;
// Container gen should be successful for the two following commands
run(`create-container -m ${miniApp} -p android`);
run(`create-container -m ${miniApp} -p ios --skipInstall`);
