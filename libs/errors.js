'use strict';

class ErrorCode {
  constructor(id, message, status=400) {
    this.id = id;
    this.message = message;
    this.status = status;
  }

  toJSON() {
    return {
      id: this.id,
      message: this.message,
      status: this.status
    };
  }
}

const code = (id, message, status) => new ErrorCode(id, message, status);

class Err extends Error {
  constructor(errorCode, data = {}) {
    super(errorCode.message);

    this.name = this.constructor.name;
    this.data = data;
    this.message = errorCode.message;
    this.code = errorCode.id;
    this.status = errorCode.status;

    if (typeof (Error.captureStackTrace) === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(errorCode.message)).stack;
    }
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      data: this.data
    };
  }
}

class DatabaseError extends Err {}

module.exports = {
  ErrorCode,
  Err, DatabaseError,
  code,
  codes: {
    INTERNAL_ERROR:     code(1, 'Internal Error', 500),
    NOT_FOUND:          code(2, 'Not Found', 404),
    INVALID_PARAMETERS: code(2, 'Invalid parameters'),
    MISSING_PARAMETERS: code(3, 'Missing parameters')
  }
};
