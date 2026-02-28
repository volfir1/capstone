import { generateKeyPairSync } from 'crypto'
import fs from 'fs'
import path from 'path'

const outDir = path.join(process.cwd(), 'server', 'config', 'keys')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
})

fs.writeFileSync(path.join(outDir, 'privateKey.pem'), privateKey, { mode: 0o600 })
fs.writeFileSync(path.join(outDir, 'publicKey.pem'), publicKey)

console.log('Keys generated in', outDir)
console.log('privateKey.pem and publicKey.pem created (private key file is mode 600)')
