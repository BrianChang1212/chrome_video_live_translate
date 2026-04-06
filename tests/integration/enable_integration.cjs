/**
 * Preload for `npm run test:integration`.
 * Enables the live_services suite when VLT_INTEGRATION is unset.
 * Set VLT_INTEGRATION=0 or false to keep the suite disabled.
 */
(function enableVltIntegration() {
  const v = process.env.VLT_INTEGRATION;
  if (v === undefined || v === "") {
    process.env.VLT_INTEGRATION = "1";
  }
})();
