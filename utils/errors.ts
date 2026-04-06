type ErrorLike = {
  code?: string;
  message?: string;
  status?: number;
  details?: string;
  hint?: string;
};

export function asErrorLike(error: unknown): ErrorLike {
  if (typeof error === 'object' && error !== null) {
    return error as ErrorLike;
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  return {};
}

export function getErrorMessage(error: unknown): string {
  return asErrorLike(error).message ?? '';
}

export function getErrorCode(error: unknown): string | undefined {
  return asErrorLike(error).code;
}

export function getErrorStatus(error: unknown): number | undefined {
  return asErrorLike(error).status;
}

export function getErrorDetails(error: unknown): string {
  return asErrorLike(error).details ?? '';
}

export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('timed out') ||
    message.includes('failed to fetch')
  );
}
