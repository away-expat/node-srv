'use strict'
/** random 128-bit number as a string */
function random128() {
  var result = "";
  for (var i = 0; i < 8; i++)
    result += String.fromCharCode(Math.random() * 0x10000);
  return result;
}

/** random 128-bit number in canonical uuid format. all bits are random. */
function random128Hex() {
  function random16Hex() { return (0x10000 | Math.random() * 0x10000).toString(16).substr(1); }
  return random16Hex() + random16Hex() +
   "-" + random16Hex() +
   "-" + random16Hex() +
   "-" + random16Hex() +
   "-" + random16Hex() + random16Hex() + random16Hex();
}

module.exports = {
	random128,
	random128Hex,
}
