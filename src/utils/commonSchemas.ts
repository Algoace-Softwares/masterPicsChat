// reusable text schema for simple text
export const textSchema = ({ dataIn = "body", label = "", required = true, maxLength = 30 }) => ({
  in: [dataIn],
  exists: required ? { options: { checkNull: true, checkFalsy: true } } : null,
  optional: required ? null : { options: { nullable: false } },
  errorMessage: `${label} required`,
  isString: {
    errorMessage: `${label} must be string`,
    bail: true,
  },
  notEmpty: {
    options: { ignore_whitespace: true },
    errorMessage: `${label} should not be empty`,
    bail: true,
  },
  isLength: {
    options: { max: maxLength },
    errorMessage: `${label} must not be more than ${maxLength} characters`,
    bail: true,
  },
  trim: true,
});

// reusable integer schema for validating positive integer values
export const numberValueSchema = ({ dataIn = "body", label = "", required = true, min = 1, max = 5 }) => ({
  in: [dataIn],
  exists: required ? { options: { checkNull: true, checkFalsy: true } } : null,
  optional: required ? null : { options: { nullable: false } },
  errorMessage: `${label} is required`,
  isInt: {
    options: { min, max },
    errorMessage: `${label} must be a positive integer between ${min} and ${max}`,
    bail: true,
  },
  toInt: true,
});

/*
 ** Reusable scehma function for bson id
 */
export const bsonIdSchema = ({ dataIn = "body", label = "userId", required = true }) => ({
  in: [dataIn],
  exists: required ? { options: { checkNull: true, checkFalsy: true } } : null,
  optional: required ? null : { options: { nullable: false } },
  errorMessage: `${label} required`,
  isMongoId: {
    errorMessage: `${label} is not a valid Bson object ID`,
  },
});

/*
 ** Resuable message media type
 */
export const messageMediaType = ({ dataIn = "body", label = "", required = true }) => ({
  in: [dataIn],
  exists: required ? { options: { checkNull: true, checkFalsy: true } } : null,
  optional: required ? null : { options: { nullable: false } },
  errorMessage: `${label} required`,
  isString: {
    errorMessage: `${label} must be string`,
    bail: true,
  },
  matches: {
    options: [/\b(?:TEXT|IMAGE|VIDEO|AUDIO|FILE)\b/],
    errorMessage: `${label} should be TEXT | IMAGE | VIDEO | AUDIO | FILE`,
  },
});
/*
 ** user profile image schema used for url validation
 */
export const urlSchema = ({ dataIn = "body", label = "userProfile", required = true }) => ({
  in: [dataIn],
  // exists: { options: { checkNull: true, checkFalsy: true } },
  optional: required ? null : { options: { nullable: false } },
  errorMessage: `${label} required`,
  isString: {
    errorMessage: `${label} must be string`,
  },
  notEmpty: {
    options: { ignore_whitespace: true },
    errorMessage: `${label} Required`,
    bail: true,
  },
  isURL: {
    errorMessage: `${label} invalid url`,
  },
});
