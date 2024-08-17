


// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
// https://github.com/bryc/code/blob/master/jshash/PRNGs.md


/*
     the output of these PRNG functions produce a positive 32-bit number (0 to 232-1) which is then converted to a floating-point number between 0-1 (0 inclusive, 1 exclusive) equivalent to Math.random()

     This example returns a random number between the specified values. The returned value is no lower than (and may possibly equal) min, and is less than (and not equal) max.
        function getRandomArbitrary(min, max) {
            return random() * (max - min) + min;
        }

        Getting a random integer between two values
        This example returns a random integer between the specified values. The value is no lower than min (or the next integer greater than min if min isn't an integer), and is less than (but not equal to) max.

        function getRandomInt(max) {
            return Math.floor(Math.random() * max);
        }


        function getRandomInt(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
        }
*/

// cyrb128 will produce a 128-bit hash value from a string which can be used to seed a PRNG
/*
    // Create cyrb128 state:
    var seed = cyrb128("apples");
    // Four 32-bit component hashes provide the seed for sfc32.
    var rand = sfc32(seed[0], seed[1], seed[2], seed[3]);

    // Only one 32-bit component hash is needed for mulberry32.
    var rand = mulberry32(seed[0]);
*/
function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
}

// sfc32 is part of the PractRand random number testing suite (which it passes of course). sfc32 has a 128-bit state and is very fast in JS.
function sfc32(str=new Date().toString()) {
    let [a, b, c, d] = cyrb128(str)
    return function() {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
      var t = (a + b) | 0;
      a = b ^ b >>> 9;
      b = c + (c << 3) | 0;
      c = (c << 21 | c >>> 11);
      d = d + 1 | 0;
      t = t + d | 0;
      c = c + t | 0;
      return (t >>> 0) / 4294967296;
    }
}

// Mulberry32 is a simple generator with a 32-bit state, but is extremely fast and has good quality randomness (author states it passes all tests of gjrand testing suite and has a full 232 period, but I haven't verified).

function mulberry32(str=new Date().toString()) {
    let [a] = cyrb128(str)
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// As of May 2018, xoshiro128** is the new member of the Xorshift family, by Vigna & Blackman (professor Vigna was also responsible for the Xorshift128+ algorithm powering most Math.random implementations under the hood). It is the fastest generator that offers a 128-bit state.

function xoshiro128ss(str=new Date().toString()) {
    let [a, b, c, d] = cyrb128(str)
    return function() {
        var t = b << 9, r = b * 5; r = (r << 7 | r >>> 25) * 9;
        c ^= a; d ^= b;
        b ^= c; a ^= d; c ^= t;
        d = d << 11 | d >>> 21;
        return (r >>> 0) / 4294967296;
    }
}

// This is JSF or 'smallprng' by Bob Jenkins (2007), who also made ISAAC and SpookyHash. It passes PractRand tests and should be quite fast, although not as fast as sfc32.

function jsf32(str=new Date().toString()) {
    let [a, b, c, d] = cyrb128(str)
    return function() {
        a |= 0; b |= 0; c |= 0; d |= 0;
        var t = a - (b << 27 | b >>> 5) | 0;
        a = b ^ (c << 17 | c >>> 15);
        b = c + d | 0;
        c = d + t | 0;
        d = a + t | 0;
        return (d >>> 0) / 4294967296;
    }
}

// 3-rotate version, improves randomness, same speed.
function jsf32b(str=new Date().toString()) {
    let [a, b, c, d] = cyrb128(str)
    return function() {
        a |= 0; b |= 0; c |= 0; d |= 0;
        var t = a - (b << 23 | b >>> 9) | 0;
        a = b ^ (c << 16 | c >>> 16) | 0;
        b = c + (d << 11 | d >>> 21) | 0;
        b = c + d | 0;
        c = d + t | 0;
        d = a + t | 0;
        return (d >>> 0) / 4294967296;
    }
}

const rngs = {
    sfc32, mulberry32, xoshiro128ss, jsf32, jsf32b,
}

function Prng(str=new Date().toString(), prng="mulberry32") {
    const random = rngs[prng](str)

    // direct access:
    this.rng = random;

    // with 'n' argument, returns integer
    // for range ops, he maximum is exclusive and the minimum is inclusive
    this.random = (n) => (typeof n == "number") ? Math.floor(random()*n) : random()
    this.srandom = (n) => (typeof n == "number") ? random(n*2) - n : random()*2-1
    this.range = (min, max) => random() * (max - min) + min;
    this.int = (max) => Math.floor(random() * max);
    this.randomInt = this.int
    this.intRange = (min, max) => {
        min = Math.ceil(min);
        return Math.floor(random() * (Math.floor(max) - min) + min); 
    }
    this.randomIntRange = this.int

    // array ops:
    this.pick = (a) => a[Math.floor(random() * a.length)]
    this.shuffle = (a) => {
        let j, x;
        for (let i = a.length; i; i--) {
            j = Math.floor(random() * i);
            x = a[i - 1];
            a[i - 1] = a[j];
            a[j] = x;
        }
        return a;
    }

    this.vec2_random = (out, scale) => {
        scale = scale || 1.0;
        const r = random() * 2.0 * Math.PI;
        out[0] = Math.cos(r) * scale;
        out[1] = Math.sin(r) * scale;
        return out;
    }

    this.vec3_random = (out, scale) => {
        scale = scale || 1.0;
        const r = random() * 2.0 * Math.PI;
        const z = random() * 2.0 - 1.0;
        const zScale = Math.sqrt(1.0 - z * z) * scale;
        out[0] = Math.cos(r) * zScale;
        out[1] = Math.sin(r) * zScale;
        out[2] = z * scale;
        return out;
    }

    this.vec4_random = (out, scale) => {
        scale = scale || 1.0; // Marsaglia, George. Choosing a Point from the Surface of a
        // Sphere. Ann. Math. Statist. 43 (1972), no. 2, 645--646.
        // http://projecteuclid.org/euclid.aoms/1177692644;
      
        let v1, v2, v3, v4;
        let s1, s2;
      
        do {
          v1 = random() * 2 - 1;
          v2 = random() * 2 - 1;
          s1 = v1 * v1 + v2 * v2;
        } while (s1 >= 1);
      
        do {
          v3 = random() * 2 - 1;
          v4 = random() * 2 - 1;
          s2 = v3 * v3 + v4 * v4;
        } while (s2 >= 1);
      
        const d = Math.sqrt((1 - s1) / s2);
        out[0] = scale * v1;
        out[1] = scale * v2;
        out[2] = scale * v3 * d;
        out[3] = scale * v4 * d;
        return out;
    }

    this.quat_random = (out) => {
        // Implementation of http://planning.cs.uiuc.edu/node198.html
        // TODO: Calling random 3 times is probably not the fastest solution
        const u1 = random();
        const u2 = random();
        const u3 = random();
        const sqrt1MinusU1 = Math.sqrt(1 - u1);
        const sqrtU1 = Math.sqrt(u1);
        out[0] = sqrt1MinusU1 * Math.sin(2.0 * Math.PI * u2);
        out[1] = sqrt1MinusU1 * Math.cos(2.0 * Math.PI * u2);
        out[2] = sqrtU1 * Math.sin(2.0 * Math.PI * u3);
        out[3] = sqrtU1 * Math.cos(2.0 * Math.PI * u3);
        return out;
    }
}


// const r = new Prng("myseed")
// console.log(r.random())
// console.log(r.srandom())
// console.log(r.range(1, 2))
// console.log(r.int(6))
// console.log(r.intRange(10, 20))


module.exports = Prng