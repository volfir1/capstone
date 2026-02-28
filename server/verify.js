// verify.js
import crypto from 'crypto';

const publicKeyPem = `-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEAuqYFucDzijZfvBBKblSMqrUCSZq5JG7ipEIiN3152eQl6j5mTC0B
DLTwa+zR0ZqrbhkA4bx9C60r+l+MWOhgNubw7nPqOCriXdf5P0FsmOFzedPgjVd7
RFEa/QdNFJZZG6N2l0hm1nfDDombtNEuM0kizwLTmD85d0kPC5WH5o4FyFVeeowC
JZMTDGdpb+mqBd3Y0rKdxHRxnuo4Udra5IQie7nPNKkYotVJXSCg40YbQxbSFNh8
kBct0ljEXJph51XLBkP/ILOp5nm7Zo1A0duwH/D9lG2urRw6ROETZzoo3mVZLfDd
Mp7x3Zybsh3kmpIUQegDflhFnj5QP1iFZQIDAQAB
-----END RSA PUBLIC KEY-----
`;

const documentHash = 'd80f2f6c06d82c96a7362ddd12ff6472f8ba870530c83d28bb9fac1a23666875';
const digitalSignature = 'FNdQUg7Q/...base64...';

const verifier = crypto.createVerify('SHA256');
verifier.update(documentHash);
verifier.end();
const ok = verifier.verify(publicKeyPem, digitalSignature, 'base64');
console.log('valid:', ok);