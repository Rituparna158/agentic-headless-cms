export class PluginError extends Error {
  public readonly statusCode: number;
  public readonly isPluginError = true;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'PluginError';
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PluginValidationError extends PluginError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'PluginValidationError';
  }
}
