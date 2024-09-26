
export const apiResponseErr = (data, success, responseCode, errMessage ,panelStatusCode = 0) => {
  return {
    data: data,
    success: success,
    responseCode: responseCode,
    panelStatusCode: panelStatusCode,
    errMessage: errMessage ?? 'Something went wrong',
  };
};
export const apiResponseSuccess = (data, success, successCode, message, pagination = null, panelStatusCode = 0) => {
  return {
    data: data,
    success: success,
    successCode: successCode,
    panelStatusCode: panelStatusCode,
    message: message,
    pagination: pagination,
  };
};

export const apiResponsePagination = (page, totalPages, totalItems, message) => {
  return {
    page: page,
    totalPages: totalPages,
    totalItems: totalItems,
    message: message,
  };
};
