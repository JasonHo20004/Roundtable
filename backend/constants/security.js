import argon2 from "argon2";

const HASH_OPTIONS = { // Argon2 hashing options
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 65536 KiB (64 MB) - Adjust based on server resources
    timeCost: 4,         // Number of iterations
    parallelism: 2,      // Degree of parallelism
};

export {HASH_OPTIONS};