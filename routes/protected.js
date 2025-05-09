const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getSignedCookies } = require('@aws-sdk/cloudfront-signer');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const authenticateJWT = require('../Middleware/authenticateJWT');
 
// AWS S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
 
async function listS3Files(bucketName, prefix) {
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
  });
 
  const response = await s3Client.send(command);
  return response.Contents ? response.Contents.map(file => file.Key) : [];
}
 
router.get('/grant-access', authenticateJWT, async (req, res) => {
  try {
    const privateKeyPath = path.resolve(process.env.CLOUDFRONT_PRIVATE_KEY_PATH);
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
 
    const policy = JSON.stringify({
      Statement: [
        {
          Resource: 'd3t027fsdclmm1.cloudfront.net/uploads/*',
          Condition: {
            DateLessThan: {
              'AWS:EpochTime': Math.floor(Date.now() / 1000) + 3600,
            },
          },
        },
      ],
    });
 
    const signedCookies = getSignedCookies({
      keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
      privateKey,
      policy,
    });
 
    const s3Files = await listS3Files(process.env.BUCKET_NAME, 'uploads/');
 
    res
      .cookie('CloudFront-Policy', signedCookies['CloudFront-Policy'], {
        domain: 'd3t027fsdclmm1.cloudfront.net',
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
      })
      .cookie('CloudFront-Signature', signedCookies['CloudFront-Signature'], {
        domain: 'd3t027fsdclmm1.cloudfront.net',
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
      })
      .cookie('CloudFront-Key-Pair-Id', signedCookies['CloudFront-Key-Pair-Id'], {
        domain: 'd3t027fsdclmm1.cloudfront.net',
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
      })
      .json({
        message: 'Access granted to protected content.',
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        signedCookies,
        files: s3Files.map(filename => `https://d3t027fsdclmm1.cloudfront.net/${filename}`),
      });
 
      console.log(signedCookies);
 
  } catch (error) {
    console.error('Error generating signed cookies or listing files:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
 
module.exports = router;
 