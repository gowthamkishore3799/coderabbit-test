/**
 * Random Data Generator Utilities
 */

function generateRandomId(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getRandomColor() {
  const colors = ['#FF6633', '#FFB399', '#FF33FF', '#00B3E6', '#E6B333', '#3366E6'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateRandomUser() {
  const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'];
  return {
    id: generateRandomId(),
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
    email: `${generateRandomId(8)}@example.com`,
    favoriteColor: getRandomColor(),
    createdAt: new Date().toISOString(),
  };
}

module.exports = { generateRandomId, getRandomColor, shuffleArray, generateRandomUser };
