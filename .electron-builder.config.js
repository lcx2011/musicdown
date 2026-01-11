/**
 * Electron Builder Configuration
 * Optimized for Windows 7 32-bit portable executable
 */

module.exports = {
  appId: 'com.bilibili.downloader',
  productName: 'Bilibili Downloader',
  
  directories: {
    output: 'dist-builder',
    buildResources: 'assets',
  },
  
  files: [
    'dist/**/*',
    'dist-electron/**/*',
    'package.json',
    '!node_modules/**/{CHANGELOG.md,README.md,README,readme.md,readme}',
    '!node_modules/**/{test,__tests__,tests,powered-test,example,examples}',
    '!node_modules/**/*.d.ts',
    '!node_modules/**/*.map',
    '!node_modules/.bin',
    '!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}',
    '!.editorconfig',
    '!**/._*',
    '!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}',
    '!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}',
    '!**/{appveyor.yml,.travis.yml,circle.yml}',
    '!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}',
  ],
  
  // Pack into asar archive for better performance and smaller size
  asar: true,
  asarUnpack: [
    '**/*.node',
  ],
  
  // Maximum compression
  compression: 'maximum',
  
  // Windows-specific configuration
  win: {
    target: [
      {
        target: 'dir',
        arch: ['ia32'],
      },
    ],
    icon: 'assets/icon.ico',
    requestedExecutionLevel: 'asInvoker',
  },
  
  // Exclude unnecessary files from node_modules
  nodeModulesSkip: [
    'typescript',
    'ts-jest',
    'jest',
    '@types',
    'vite',
    'electron-builder',
  ],
};
