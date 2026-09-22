export class AppError extends Error {
  readonly status: number;

  constructor(message: string, status: number, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
    this.status = status;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found", options?: ErrorOptions) {
    super(message, 404, options);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", options?: ErrorOptions) {
    super(message, 403, options);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid request", options?: ErrorOptions) {
    super(message, 400, options);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", options?: ErrorOptions) {
    super(message, 401, options);
  }
}
