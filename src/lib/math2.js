const Math2 = {
  clamp: function(num, min, max){
    return Math.max(Math.min(num, max), min)
  }
}

module.exports = Math2