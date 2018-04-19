const Promise = require('bluebird');

// This is a polyfill from stack overflow for making Error properly extensible.
class ExtendableError extends Error {
  constructor(errorObj) {
    super(errorObj.message);

    this.status = errorObj.status;
    this.code = errorObj.code;
    this.message = errorObj.message;
    this.messageCode = errorObj.messageCode;
    this.data = errorObj.data;

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(this.message)).stack;
    }
  }
}

class ApplicationError extends ExtendableError {
  /**
     * Return self as rejected promise.
     */
  reject() {
    return Promise.reject(this);
  }

  /**
     * Throw error
     */
  throw() {
    throw this;
  }

  toJson() {
    return {
      status:  this.status,
      code: this.code,
      message: this.message,
      messageCode: this.messageCode,
      data: this.data
    }
  }


  /**
     * Checks if the argument is an ApplicationError.
     */
  static is(test) {
    if (!test) return false;
    return test instanceof this;
  }


  /**
     * Checks if the first argument is an ApplicationError, of the specific
     * type of the second argument.
     */
  static isSpecificError(err, test) {
    if (!this.is(err)) return false;
    if (test.status == undefined || !test.message) return false;
    return test.status === err.status && test.message === err.message;
  }


  /**
     * Passes through any ApplicationErrors provided as err. If err is NOT an
     * ApplicationError, create one with 'otherwise' as constructor.
     */
  static pass(err, otherwise) {
    if (this.is(err)) return err;
    if (this.is(otherwise)) return otherwise;
    const error = new ApplicationError(otherwise);
    return error;
  }


  /**
     * Checks if an error is an ApplicationError. If it is, return rejection with
     * it. Else return rejection with new ApplicationError 'otherwise' and log the
     * error.
     */
  static reject(err, otherwise) {
    if (!this.is(err)) this.logger.error(err);
    return this.pass(err, otherwise).reject();
  }

  /**
     * Checks if an error is an ApplicationError. If it is, throw error with
     * it. Else throw rejection with new ApplicationError 'otherwise' and log the
     * error.
     */
  static throw(err, otherwise) {
    if (!this.is(err)) this.logger.error(err);
    throw this.pass(err, otherwise);
  }

  /**
     * Checks if an error is an RPC error or Application error. If it is, throw error with
     * it. Else throw rejection with new ApplicationError 'otherwise' and log the
     * error.
     */
  static throwRPC(err, otherwise) {
    if (this.isRPC(err)) throw new ApplicationError({});
    if (!this.is(err)) this.logger.error(err);
    throw this.pass(err, otherwise);
  }

  /**
     * Resolves a promise if the err is an ApplicationError and matches the
     * status and message of the conditional provided.
     */
  static resolveIf(err, conditional) {
    if (!this.is(err)) return Promise.reject(err);
    if (!(conditional.status === err.status && conditional.message === err.message))
      return Promise.reject(err);
    return Promise.resolve(err);
  }
}

ApplicationError.logger = console;
module.exports = ApplicationError;
