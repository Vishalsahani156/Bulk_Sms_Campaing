export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function notFound(message = "Resource not found") {
  return new AppError(404, message, "NOT_FOUND");
}

export function unauthorized(message = "Unauthorized") {
  return new AppError(401, message, "UNAUTHORIZED");
}

export function badRequest(message: string) {
  return new AppError(400, message, "BAD_REQUEST");
}

export function insufficientBalance(message = "Insufficient wallet balance") {
  return new AppError(402, message, "INSUFFICIENT_BALANCE");
}
