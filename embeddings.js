const tf = require('@tensorflow/tfjs-node');
const use = require('@tensorflow-models/universal-sentence-encoder');

let model;

async function loadModel() {
  if (!model) {
    model = await use.load();
  }
  return model;
}

async function generateFullEmbedding(text) {
  const model = await loadModel();
  const embedding = await model.embed([text]);
  return (await embedding.array())[0]; // 返回一個一維數組
}

function reduceVector(vector, targetDim) {
  const step = vector.length / targetDim;
  return Array(targetDim).fill(0).map((_, i) => {
    const start = Math.floor(i * step);
    const end = Math.floor((i + 1) * step);
    return vector.slice(start, end).reduce((a, b) => a + b, 0) / (end - start);
  });
}

async function generateAndReduceEmbedding(text) {
  const fullEmbedding = await generateFullEmbedding(text);
  const reducedEmbedding = reduceVector(fullEmbedding, 512);
  return reducedEmbedding;
}

module.exports = {
  generateAndReduceEmbedding
};