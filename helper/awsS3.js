/**
 * @desc this file will hold all the function for retrive, upload, delete files from S3 bucket
 * @author CodeNet Softwares Pvt. Ltd.
 * @file aws.js
 */

import AWS from 'aws-sdk';
import dotenv from 'dotenv';
dotenv.config();

const s3 = new AWS.S3({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESSKEYID,
  secretAccessKey: process.env.SECRETACCESSKEY,
});

const awsS3Obj = {
  addDocumentToS3: async function (base64Data, fileName, bucketName, fileType) {
    const fileBuffer = Buffer.from(base64Data, 'base64');
    const fileExtension = fileType.substring(fileType.lastIndexOf('/') + 1);
    const nameFile = `${fileName}_${Date.now()}.${fileExtension}`;
    // Set the parameters for the S3 upload
    const params = {
      Bucket: bucketName,
      Key: nameFile,
      Body: fileBuffer,
      ContentEncoding: 'base64',
      ContentType: fileType,
      ACL: 'public-read',
    };
    // Upload the file to S3
    return new Promise((resolve, reject) => {
      s3.upload(params, function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  },
  deleteDocumentsFromS3: async function (fileName, bucketName) {
    try {
      const ans = await s3
        .deleteObject({
          Bucket: bucketName,
          Key: fileName,
        })
        .promise();
      console.log(`Successfully deleted file ${fileName} from bucket ${bucketName}`);
    } catch (error) {
      console.error(`Error deleting file ${fileName} from bucket ${bucketName}: ${error}`);
    }
  },
};

export default awsS3Obj;
