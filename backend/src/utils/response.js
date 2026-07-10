/**
 * Standart API cavab formatı
 */

const success = (res, data = {}, message = "Uğurlu", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const error = (
  res,
  message = "Xəta baş verdi",
  statusCode = 400,
  errors = null,
) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { success, error };
