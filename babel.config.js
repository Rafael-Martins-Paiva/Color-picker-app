module.exports = function(api) {
  api.cache(true); // Habilita o cache do Babel
  return {
    presets: ['babel-preset-expo'], // Use o preset do Expo
    plugins: [
      // Outros plugins que você possa ter devem vir aqui
      'react-native-reanimated/plugin', // IMPORTANTE: Este DEVE ser o último plugin na lista.
    ],
  };
};
