module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.json'],
          alias: {
            '*': ['src/*'],
            '@components': './src/components',
            '@styles': './src/assets/styles',
            '@utils': './src/utils',
            '@assets': './src/assets',
            '@app': './src/app',
            'tests': './tests/',
            '@firebaseApp': './src/firebaseApp'  // Fix: Add missing "/"
          }
        }
      ]
    ]
  };
};