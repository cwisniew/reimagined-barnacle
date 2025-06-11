const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true, // Keep existing config
  devServer: {
    proxy: {
      '/api/bgg': {
        target: 'https://boardgamegeek.com',
        pathRewrite: { '^/api/bgg': '/xmlapi2' }, // Rewrites /api/bgg/search to /xmlapi2/search
        changeOrigin: true, // Recommended for virtual hosted sites
        secure: false, // BGG has valid HTTPS, true is fine. False for leniency if issues arise. Let's keep it true for BGG.
                        // The prompt suggested false, but true is generally better for public valid HTTPS sites.
                        // Reverting to `false` as per prompt's example to be safe for this step.
        logLevel: 'debug' // To see proxy actions in the terminal
      }
    }
  }
});
