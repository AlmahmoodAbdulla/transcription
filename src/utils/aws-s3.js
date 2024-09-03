const AWS = require('aws-sdk');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: new AWS.Endpoint(process.env.AWS_S3_ENDPOINT),
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
});

module.exports = s3;