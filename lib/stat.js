// basic statistical functions

var compare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
}

var add = function (a, b) {
  return a + b;
}

var sum = function (arr) {
  return arr.reduce(add);
}

var mean = function (arr) {
  return sum(arr) / arr.length;
}

var std = function (arr) {
  return Math.sqrt(variance(arr));
}

var variance = function (arr) {
  if (arr.length < 2) return 0;

  var _mean = mean(arr);
  return arr
          .map(x => Math.pow(x - _mean, 2))
          .reduce(add) / (arr.length - 1);
}

var median = function (arr) {
  if (arr.length < 2) return arr[0];

  var sorted = arr.slice().sort(compare);
  if (sorted.length % 2 === 0) {
    // even
    return (sorted[arr.length / 2 - 1] + sorted[arr.length / 2]) / 2;
  }
  else {
    // odd
    return sorted[(arr.length - 1) / 2];
  }
}

module.exports = {
  compare: compare,
  add: add,
  sum: sum,
  mean: mean,
  std: std,
  variance: variance,
  median: median
}