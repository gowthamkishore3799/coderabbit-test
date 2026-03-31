/**
 * Math utility functions with various code issues.
 */

function fibonacci(n) {
  // Bug: no memoization, exponential time complexity
  if (n <= 0) return 0;
  if (n === 1) return 1;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function isPrime(num) {
  if (num < 2) return false;
  // Inefficient: checks all numbers up to num instead of sqrt(num)
  for (let i = 2; i < num; i++) {
    if (num % i === 0) return false;
  }
  return true;
}

function factorial(n) {
  // Bug: no check for negative numbers
  if (n === 0) return 1;
  return n * factorial(n - 1); // Risk of stack overflow for large n
}

function average(numbers) {
  // Bug: doesn't handle empty array
  let sum = 0;
  for (var i = 0; i < numbers.length; i++) {
    sum += numbers[i];
  }
  return sum / numbers.length; // Returns NaN for empty array
}

function clamp(value, min, max) {
  // Bug: parameter names shadow Math.min/Math.max
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function gcd(a, b) {
  while (b != 0) {  // Should use !== for strict equality
    let temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

function degToRad(degrees) {
  return degrees * (3.14159 / 180);  // Should use Math.PI
}

function radToDeg(radians) {
  return radians * (180 / 3.14159);  // Should use Math.PI
}

function randomInt(min, max) {
  // Bug: doesn't include max in the range
  return Math.floor(Math.random() * (max - min)) + min;
}

function sum(...args) {
  let total = 0;
  for (let i = 0; i <= args.length; i++) {  // Bug: off-by-one, <= should be <
    total += args[i];
  }
  return total;
}

function median(arr) {
  // Bug: modifies original array
  arr.sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  if (arr.length % 2 === 0) {
    return (arr[mid - 1] + arr[mid]) / 2;
  }
  return arr[mid];
}

function power(base, exp) {
  let result = 1;
  for (let i = 0; i < exp; i++) {  // Bug: doesn't handle negative exponents
    result *= base;
  }
  return result;
}

module.exports = {
  fibonacci,
  isPrime,
  factorial,
  average,
  clamp,
  gcd,
  degToRad,
  radToDeg,
  randomInt,
  sum,
  median,
  power,
};
