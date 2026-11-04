// Makes the key pair that lets our server send push notifications. Run once from the repo root:
//   node scripts/make-vapid-keys.mjs
// The PUBLIC key is safe to share: it goes in js/push.js and in the Supabase secret VAPID_PUBLIC_KEY.
// The PRIVATE key is a secret: paste it only into the Supabase secret VAPID_PRIVATE_KEY.
// Never put it in chat, a file in this repo, or anywhere else. Use the same pair forever: if the pair
// changes, every device has to turn notifications on again.
import { createECDH } from "node:crypto";

const ecdh = createECDH("prime256v1");
ecdh.generateKeys();
const b64url = (buf) => buf.toString("base64url");

console.log("PUBLIC KEY (share this one):");
console.log(b64url(ecdh.getPublicKey()));
console.log("");
console.log("PRIVATE KEY (secret, never share):");
console.log(b64url(ecdh.getPrivateKey()));
