/**
 * Token encryption/decryption using AES-256-GCM
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const TAG_LENGTH = 16
const SALT_LENGTH = 32

function getKey(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, KEY_LENGTH)
}

function getEncryptionSecret(): string {
  const secret = process.env.ENCRYPTION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('ENCRYPTION_SECRET must be at least 32 characters')
  }
  return secret
}

/**
 * Encrypt a token for storage in database
 * Format: salt:iv:tag:encrypted (all base64)
 */
export function encryptToken(plaintext: string): string {
  const secret = getEncryptionSecret()
  const salt = randomBytes(SALT_LENGTH)
  const key = getKey(secret, salt)
  const iv = randomBytes(IV_LENGTH)
  
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  
  return [
    salt.toString('base64'),
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':')
}

/**
 * Decrypt a token from database
 */
export function decryptToken(ciphertext: string): string {
  const secret = getEncryptionSecret()
  const [saltB64, ivB64, tagB64, encryptedB64] = ciphertext.split(':')
  
  if (!saltB64 || !ivB64 || !tagB64 || !encryptedB64) {
    throw new Error('Invalid encrypted token format')
  }
  
  const salt = Buffer.from(saltB64, 'base64')
  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const encrypted = Buffer.from(encryptedB64, 'base64')
  
  const key = getKey(secret, salt)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString('utf8')
}

/**
 * Check if a string looks like an encrypted token
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':')
  return parts.length === 4 && parts.every(p => p.length > 0)
}

/**
 * Safely decrypt - returns null if decryption fails
 */
export function safeDecryptToken(ciphertext: string | null): string | null {
  if (!ciphertext) return null
  
  try {
    // If not encrypted format, return as-is (migration support)
    if (!isEncrypted(ciphertext)) {
      return ciphertext
    }
    return decryptToken(ciphertext)
  } catch {
    return null
  }
}
