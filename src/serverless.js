module.exports.developerSuffix = (serverless) => {
  if (serverless.variables.options.developer) {
    console.warn(
      'A configuration is applying a developer suffix --> ',
      serverless.variables.options.developer,
    );
    return `-${serverless.variables.options.developer}`;
  }
  return '';
};

module.exports.developerPrefix = (serverless) => {
  if (serverless.variables.options.developer) {
    console.warn(
      'A configuration is applying a developer prefix --> ',
      serverless.variables.options.developer,
    );
    return `${serverless.variables.options.developer}-`;
  }
  return '';
};
