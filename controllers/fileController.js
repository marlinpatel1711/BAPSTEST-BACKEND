
const fs = require('fs');
const path = require('path');
const { PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../config/aws');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
 
 
exports.uploadPDF = async (req, res) => {
  try {
    const filePath = path.resolve(process.cwd(), 'HOF.pdf');
 
    console.log('Reading file from path:', filePath);
    const fileContent = fs.readFileSync(filePath);
    console.log('File read successfully. Size:', fileContent.length, 'bytes');
 
    // Generate unique filename
    const randomNumber = Math.floor(1000000 + Math.random() * 9000000); // 7-digit number
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:T]/g, '-').split('.')[0]; // e.g. "2025-05-07-14-30-15"
    const fileName = `${randomNumber}_${timestamp}.pdf`;
    console.log('Generated file name:', fileName);
 
    const uploadParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: fileName,
      Body: fileContent,
      ContentType: 'application/pdf',
      ACL: 'private',
    };
 
    console.log('Uploading to S3 as:', fileName);
    const command = new PutObjectCommand(uploadParams);
    const result = await s3.send(command);
    console.log('Upload successful:', result);
 
    res.json({ message: 'File uploaded successfully', fileName });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
};
exports.getPDF = async (req, res) => {
  try {
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: 'secure-pdf.pdf',
    };
 
    const command = new GetObjectCommand(params);
    const data = await s3.send(command);
 
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="secure-pdf.pdf"');
 
    data.Body.pipe(res);
  } catch (error) {
    console.error('Error fetching PDF:', error);
    res.status(500).json({ error: 'Failed to fetch PDF' });
  }
};