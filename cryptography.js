/**
 * Cryptography
 * @copyright © 2020 Roy Six
 * @license https://github.com/sixcious/cryptography/blob/main/LICENSE
 */

/**
 * Cryptography is an object responsible for various cryptographic functions.
 *
 * It can:
 * 1. Calculate a cryptographic hash
 * 2. Generate a securely random cryptographic salt
 * 3. Encrypt plaintext into ciphertext
 * 4. Decrypt ciphertext into plaintext
 *
 * How to use it
 * -------------
 *
 * 1. Hashing/Salting:
 * You can use this to store hashes of sensitive data (e.g. passwords) and then run the hash function against the
 * plaintext password when it's entered again to see if it matches the hash you're storing
 * Note that you should also store the salt you used to generate the hash in your schema
 *
 * const salt = Cryptography.salt();
 * const hash = await Cryptography.hash("plaintext", salt);
 *
 * 2. Encrypting/Decrypting:
 * Generate a secret key however you prefer (for quick demonstration purposes,this uses Cryptography.salt())
 * const key = Cryptography.salt();
 * const encryption = await Cryptography.encrypt("plaintext", key);
 * const decryption = await Cryptography.decrypt(encryption.ciphertext, encryption.iv, key);
 */
const Cryptography = (() => {

  /**
   * Calculates a cryptographic hash. We use the PBKDF2 algorithm with an Hmac-SHA512 hash function.
   * For simplicity, we hardcode the algorithm, hash, and iterations. Note: 512 Bits = 64 Bytes = 88 B64 Characters. (Note: Firefox hangs if the text is empty.)
   *
   * @param text the text to hash
   * @param salt the salt to hash with
   * @returns {Promise<string>} the hash as a base 64 encoded string
   * @public
   */
  async function hash(text, salt) {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(text), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-512", salt: b642u8a(salt), iterations: 1000 }, key, 512);
    return u8a2b64(new Uint8Array(bits));
  }

  /**
   * Generates a random cryptographic salt.
   *
   * @returns {string} the salt as a base 64 encoded string
   * @public
   */
  function salt() {
    return u8a2b64(crypto.getRandomValues(new Uint8Array(64)));
  }

  /**
   * Encrypts plaintext into ciphertext using a symmetric key. We use the AES-GCM algorithm with a SHA256 hash function.
   * For simplicity, we hardcode the algorithm. Note: 256 Bits = 32 Bytes = 44 B64 Characters.
   *
   * @param plaintext the text to encrypt
   * @param secret    the secret key
   * @returns {Promise<{iv: string, ciphertext: string}>} the iv and ciphertext as base 64 encoded strings
   * @public
   */
  async function encrypt(plaintext, secret) {
    const algorithm = { name: "AES-GCM", iv: crypto.getRandomValues(new Uint8Array(64)) };
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
    const key = await crypto.subtle.importKey("raw", digest, algorithm, false, ["encrypt"]);
    const encryption = await crypto.subtle.encrypt(algorithm, key, new TextEncoder().encode(plaintext));
    return { iv: u8a2b64(algorithm.iv), ciphertext: u8a2b64(new Uint8Array(encryption)) };
  }

  /**
   * Decrypts ciphertext into plaintext using a symmetric key. We use the AES-GCM algorithm with a SHA256 hash function.
   * For simplicity, we hardcode the algorithm. Note: 256 Bits = 32 Bytes = 44 B64 Characters.
   *
   * @param ciphertext the text to decrypt
   * @param iv         the initialization vector for the algorithm
   * @param secret     the secret key
   * @returns {Promise<string>} the decrypted text
   * @public
   */
  async function decrypt(ciphertext, iv, secret) {
    const algorithm = { name: "AES-GCM", iv: b642u8a(iv) };
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
    const key = await crypto.subtle.importKey("raw", digest, algorithm, false, ["decrypt"]);
    const decryption = await crypto.subtle.decrypt(algorithm, key, b642u8a(ciphertext));
    return new TextDecoder().decode(decryption);
  }

  /**
   * Converts an 8-bit Unsigned Integer Array to a Base 64 Encoded String.
   *
   * @param u8a the unsigned 8-bit integer array
   * @returns {string} the base 64 encoded string
   * @private
   */
  function u8a2b64(u8a) {
    return btoa(String.fromCharCode(...u8a));
  }

  /**
   * Converts a Base 64 Encoded String to an 8-bit Unsigned Integer Array.
   *
   * @param b64 the base 64 encoded string
   * @returns {Uint8Array} the unsigned 8-bit integer array
   * @private
   */
  function b642u8a(b64) {
    return new Uint8Array([...atob(b64)].map(c => c.charCodeAt(0)));
  }

  // Return public members from the Immediately Invoked Function Expression (IIFE, or "Iffy") Revealing Module Pattern (RMP)
  return {
    hash,
    salt,
    encrypt,
    decrypt
  };

})();