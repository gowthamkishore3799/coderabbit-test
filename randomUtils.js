function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomHexColor() {
  return "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = { shuffleArray, randomInt, randomHexColor, pickRandom };
