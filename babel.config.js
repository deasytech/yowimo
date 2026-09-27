module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // laravel-echo's compiled output uses static class blocks (ES2022) — not covered by the
    // default Metro/Expo transform target, so it fails to parse without this.
    plugins: ['@babel/plugin-transform-class-static-block'],
  };
};
