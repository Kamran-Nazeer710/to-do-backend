const crypto = require("crypto");

const { IdempotencyKey } = require("../../models");

/*
|--------------------------------------------------------------------------
| Generate Request Hash
|--------------------------------------------------------------------------
*/

const generateRequestHash = (body) => {
  const requestBody = JSON.stringify(body || {});

  return crypto
    .createHash("sha256")
    .update(requestBody)
    .digest("hex");
};

/*
|--------------------------------------------------------------------------
| Get Idempotency Record
|--------------------------------------------------------------------------
*/

const getIdempotencyKey = async (key, userId) => {
  return await IdempotencyKey.findOne({
    where: {
      key,
      userId,
    },
  });
};

/*
|--------------------------------------------------------------------------
| Create Idempotency Record
|--------------------------------------------------------------------------
*/

const createIdempotencyKey = async ({
  key,
  userId,
  requestHash,
}) => {
  return await IdempotencyKey.create({
    key,
    userId,
    requestHash,
  });
};

/*
|--------------------------------------------------------------------------
| Save Response
|--------------------------------------------------------------------------
*/

const saveIdempotencyResponse = async ({
  idempotencyRecord,
  responseStatus,
  responseBody,
}) => {
  idempotencyRecord.responseStatus = responseStatus;
  idempotencyRecord.responseBody = responseBody;

  await idempotencyRecord.save();

  return idempotencyRecord;
};

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {
  generateRequestHash,
  getIdempotencyKey,
  createIdempotencyKey,
  saveIdempotencyResponse,
};