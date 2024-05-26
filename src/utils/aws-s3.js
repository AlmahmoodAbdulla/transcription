const AWS = require('aws-sdk');

const s3 = new AWS.S3({
    accessKeyId: "de4b0de6635182dbfa72e58cd838255a",
    secretAccessKey: "ca700485e772da8a86501c657a9a707f9b12aebb9e05ab71a8210cf345dff271",
    endpoint: new AWS.Endpoint("https://ce3985d61f4008a3d1a53a7d7e73f653.r2.cloudflarestorage.com"),
    s3ForcePathStyle: true, // This is required for custom S3 endpoints
    signatureVersion: 'v4'
});

module.exports = s3;