import { webcrypto } from "crypto";


// #############
// ### Utils ###
// #############

// Convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

// Convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const buff = Buffer.from(base64, "base64");
  return buff.buffer.slice(buff.byteOffset, buff.byteOffset + buff.byteLength);
}

// ################
// ### RSA keys ###
// ################

// Generate RSA Key Pair (Public and Private)
export async function generateRsaKeyPair(): Promise<{ publicKey: string, privateKey: string }> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,  // Length of RSA key (2048 bits)
      publicExponent: new Uint8Array([1, 0, 1]),  // 65537 as public exponent
      hash: "SHA-256",  // Hash algorithm used in RSA-OAEP
    },
    true,  // Whether the keys can be exported
    ["encrypt", "decrypt"]  // Usages for the keys
  );

  const publicKey = await exportKey(keyPair.publicKey);
  const privateKey = await exportKey(keyPair.privateKey);

  return { publicKey, privateKey };
}

// Export an RSA key to base64 (for storage or transmission)
async function exportKey(key: webcrypto.CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("spki", key); // For public key (SPKI format)
  return arrayBufferToBase64(exported);
}

// Import an RSA key from base64 (for use in encryption/decryption)
async function importKey(base64Key: string, isPublic: boolean): Promise<webcrypto.CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(base64Key);
  const keyFormat = isPublic ? "spki" : "pkcs8";  // For public or private key
  const algorithm = { name: "RSA-OAEP", hash: "SHA-256" };

  return await crypto.subtle.importKey(
    keyFormat,
    keyBuffer,
    algorithm,
    true,
    isPublic ? ["encrypt"] : ["decrypt"]
  );
}



// Encrypt data using RSA (Public Key)
export async function rsaEncrypt(publicKeyBase64: string, data: string): Promise<string> {
  const publicKey = await importKey(publicKeyBase64, true);
  const encodedData = new TextEncoder().encode(data);
  
  const encryptedData = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    encodedData
  );

  return arrayBufferToBase64(encryptedData);
}

// Decrypt data using RSA (Private Key)
export async function rsaDecrypt(privateKeyBase64: string, encryptedBase64: string): Promise<string> {
  const privateKey = await importKey(privateKeyBase64, false);
  const encryptedBuffer = base64ToArrayBuffer(encryptedBase64);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedBuffer
  );

  return new TextDecoder().decode(decryptedBuffer);
}


// ######################
// ### Symmetric keys ###
// ######################

// Generates a random symmetric key (AES-GCM)$
export async function createRandomSymmetricKey(): Promise<webcrypto.CryptoKey> {
  const key = await webcrypto.subtle.generateKey(
    {
      name: "AES-CBC", 
      length: 256,
    },
    true, 
    ["encrypt", "decrypt"]
  );
  return key;
}

// Export symmetric key to Base64
export async function exportSymKey(key: webcrypto.CryptoKey): Promise<string> {
  const exported = await webcrypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(exported);
}

// Import Base64 symmetric key
export async function importSymKey(strKey: string): Promise<webcrypto.CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(strKey);
  return await webcrypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-CBC" },
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypt a message using AES-CBC
export async function symEncrypt(
  key: webcrypto.CryptoKey,
  data: string
): Promise<{ encrypted: string; iv: string }> {
  // AES-CBC requires a 16-byte IV (not 12-byte)
  const iv = crypto.getRandomValues(new Uint8Array(16));  // 16 bytes IV for AES-CBC
  const encodedData = new TextEncoder().encode(data);
  
  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    encodedData
  );

  return {
    encrypted: arrayBufferToBase64(encryptedData),
    iv: arrayBufferToBase64(iv),
  };
}

// Decrypt a message using AES-CBC
export async function symDecrypt(
  strKey: string,
  data: { encrypted: string; iv: string }
): Promise<string> {
  const { encrypted, iv } = data;

  const ivBuffer = base64ToArrayBuffer(iv);

  // Import the symmetric key
  const key = await importSymKey(strKey);

  const encryptedBuffer = base64ToArrayBuffer(encrypted);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv: ivBuffer },
    key,
    encryptedBuffer
  );

  return new TextDecoder().decode(decryptedBuffer);
}
