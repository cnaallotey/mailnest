// Creates a self-signed TLS certificate with node:crypto only, for `mailnest --tls`.
// Node can make key pairs but not X.509 certificates, so this encodes the certificate (DER) by hand.
import { generateKeyPairSync, randomBytes, sign } from 'node:crypto'
import { isIP } from 'node:net'

const len = n => (n < 0x80 ? [n] : n < 0x100 ? [0x81, n] : [0x82, n >> 8, n & 0xff])
const tlv = (tag, ...parts) => { const body = Buffer.concat(parts.map(p => Buffer.from(p))); return Buffer.concat([Buffer.from([tag, ...len(body.length)]), body]) }
const seq = (...p) => tlv(0x30, ...p)
const set = (...p) => tlv(0x31, ...p)
const int = (buf) => tlv(0x02, buf[0] & 0x80 ? Buffer.concat([Buffer.from([0]), buf]) : buf)
const utf8 = s => tlv(0x0c, Buffer.from(s, 'utf8'))
const octets = b => tlv(0x04, b)
const bits = b => tlv(0x03, Buffer.from([0]), b)
const bool = v => tlv(0x01, [v ? 0xff : 0])
function oid(dotted) {
  const [a, b, ...rest] = dotted.split('.').map(Number)
  const out = [a * 40 + b]
  for (let n of rest) {
    const chunk = [n & 0x7f]
    while ((n >>= 7) > 0) chunk.unshift((n & 0x7f) | 0x80)
    out.push(...chunk)
  }
  return tlv(0x06, out)
}
const utcTime = d => tlv(0x17, Buffer.from(d.toISOString().replace(/[-:T]/g, '').slice(2, 14) + 'Z', 'ascii'))

function ipBytes(ip) {
  if (isIP(ip) === 4) return Buffer.from(ip.split('.').map(Number))
  // Expand an IPv6 address such as ::1 to its 16 bytes.
  const [head, tail = ''] = ip.split('::')
  const h = head ? head.split(':') : [], t = tail ? tail.split(':') : []
  const groups = ip.includes('::') ? [...h, ...Array(8 - h.length - t.length).fill('0'), ...t] : h
  return Buffer.concat(groups.map(g => { const b = Buffer.alloc(2); b.writeUInt16BE(parseInt(g, 16)); return b }))
}

/**
 * @param {{ hosts?: string[], days?: number }} [options] names and IP addresses the certificate is valid for
 * @returns {{ key: string, cert: string }} PEM encoded private key and certificate
 */
export function selfSigned({ hosts = ['localhost', '127.0.0.1', '::1'], days = 365 } = {}) {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  const ecdsaSha256 = seq(oid('1.2.840.10045.4.3.2'))
  const name = seq(set(seq(oid('2.5.4.3'), utf8('Mailnest local development'))))
  const now = Date.now()
  const altNames = seq(...hosts.map(h => (isIP(h) ? tlv(0x87, ipBytes(h)) : tlv(0x82, Buffer.from(h, 'ascii')))))
  const extensions = seq(
    seq(oid('2.5.29.19'), bool(true), octets(seq())), // basicConstraints: not a CA
    seq(oid('2.5.29.37'), octets(seq(oid('1.3.6.1.5.5.7.3.1')))), // extKeyUsage: serverAuth
    seq(oid('2.5.29.17'), octets(altNames)), // subjectAltName
  )
  const tbs = seq(
    tlv(0xa0, int(Buffer.from([2]))), // version 3
    int(Buffer.concat([Buffer.from([1]), randomBytes(8)])), // serial number
    ecdsaSha256,
    name, // issuer
    seq(utcTime(new Date(now - 86400000)), utcTime(new Date(now + days * 86400000))),
    name, // subject, same as issuer because it is self-signed
    publicKey.export({ type: 'spki', format: 'der' }),
    tlv(0xa3, extensions),
  )
  const der = seq(tbs, ecdsaSha256, bits(sign('sha256', tbs, privateKey)))
  const cert = `-----BEGIN CERTIFICATE-----\n${der.toString('base64').match(/.{1,64}/g).join('\n')}\n-----END CERTIFICATE-----\n`
  return { key: privateKey.export({ type: 'pkcs8', format: 'pem' }), cert }
}
