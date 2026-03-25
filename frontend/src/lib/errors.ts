export function getErrorMessage(error: any): string {
  if (!error?.response) {
    return "Cannot connect to the server. Please check your internet connection or try again later.";
  }

  const status = error.response?.status;
  const serverMessage = error.response?.data?.message || error.response?.data?.error || null;

  switch (status) {
    case 400:
      return serverMessage || "Invalid request. Please check your input and try again.";
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return serverMessage || "The requested resource was not found.";
    case 405:
      return serverMessage || "This action is not supported here.";
    case 409:
      return serverMessage || "A conflict occurred. This record may already exist.";
    case 413:
      return "File is too large. Maximum size is 100MB.";
    case 415:
      return "File type not supported. Please upload MP4, WebM, MOV, or PDF only.";
    case 422:
      return serverMessage || "The data provided is invalid.";
    case 500:
      return serverMessage || "The server encountered an error. Please try again.";
    case 503:
      return "The server is temporarily unavailable. Please try again in a few minutes.";
    default:
      return serverMessage || error?.message || "An unexpected error occurred.";
  }
}

export function getUploadErrorMessage(error: any): string {
  if (!error?.response) {
    return "Upload failed: Cannot reach the server. Check your connection.";
  }

  const status = error.response?.status;
  const serverMessage = error.response?.data?.message || null;

  switch (status) {
    case 400:
      return serverMessage || "Invalid file. Please check the file and try again.";
    case 403:
      return "You do not have permission to upload files to this course.";
    case 413:
      return "File is too large. Maximum file size is 100MB. Please compress the video first.";
    case 415:
      return "File type not supported. Accepted formats: MP4, WebM, MOV (video) and PDF (documents).";
    case 500:
      return serverMessage || "Upload failed on the server. Please try again.";
    default:
      return serverMessage || "Upload failed. Please try again.";
  }
}
