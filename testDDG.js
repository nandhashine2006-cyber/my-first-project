const { image_search } = require('duckduckgo-images-api');

(async () => {
  try {
    const results = await image_search({ query: "amaranthus fresh vegetable", moderate: true });
    console.log(results.slice(0, 3));
  } catch(e) {
    console.error(e);
  }
})();
