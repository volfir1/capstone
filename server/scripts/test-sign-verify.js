import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const keysDir = path.join(process.cwd(), 'server', 'config', 'keys')
const privPath = path.join(keysDir, 'privateKey.pem')
const pubPath = path.join(keysDir, 'publicKey.pem')

if (!fs.existsSync(privPath) || !fs.existsSync(pubPath)) {
  console.error('Keys not found. Run generate-keys.js first.')
  process.exit(2)
}

const privateKey = fs.readFileSync(privPath, 'utf8')
const publicKey = fs.readFileSync(pubPath, 'utf8')

const doc = { ownerUid: 'test-user', username: 'tester', firstName: 'Test', lastName: 'User', signatureUrl: 'https://example.com/sign.png', purpose: 'profile_signature' }
const canonical = JSON.stringify(Object.keys(doc).sort().reduce((acc, k) => { acc[k] = doc[k]; return acc }, {}))
const documentHash = crypto.createHash('sha256').update(canonical).digest('hex')

const signer = crypto.createSign('SHA256')
signer.update(documentHash)
signer.end()
const signature = signer.sign(privateKey, 'base64')

const verifier = crypto.createVerify('SHA256')
verifier.update(documentHash)
verifier.end()
const ok = verifier.verify(publicKey, signature, 'base64')

console.log('canonical:', canonical)
console.log('documentHash:', documentHash)
console.log('signature (base64):', signature)
console.log('verification result:', ok)

process.exit(ok ? 0 : 1)
