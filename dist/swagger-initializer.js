window.onload = function () {
  window.ui = SwaggerUIBundle({
    url: "docs/v3.0.0.yaml", // change this for default
    dom_id: "#swagger-ui",
    deepLinking: true,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    plugins: [SwaggerUIBundle.plugins.DownloadUrl],
    layout: "StandaloneLayout",
  });
};
