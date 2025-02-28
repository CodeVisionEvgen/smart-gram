/**
 *
 * @param mode true - dev | false - prod
 * @returns {string}
 */
export const START_APPLICATION_LOG = (mode: boolean): string =>
  `Launched on ${mode ? "development" : "production"} mode`;

export const AI_ENABLED_LOG = "Ai enabled now";
