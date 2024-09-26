class CustomError extends Error {
  constructor(message, data = null, responseCode = 500, panelStatusCode = 0) {
    super(message);
    this.data = data;
    this.responseCode = responseCode;
    this.panelStatusCode = panelStatusCode;
  }
}

export default CustomError;
