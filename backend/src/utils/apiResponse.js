class ApiResponse {
  /**
   * Standard success response structure
   */
  static success(res, message = 'Success', data = {}, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  /**
   * Standard pagination response structure
   */
  static paginate(res, message = 'Success', data = [], paginationMeta = {}, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      pagination: {
        totalRecords: paginationMeta.totalRecords || 0,
        limit: paginationMeta.limit || 10,
        page: paginationMeta.page || 1,
        totalPages: paginationMeta.totalPages || 1,
        hasNextPage: paginationMeta.hasNextPage || false,
        hasPrevPage: paginationMeta.hasPrevPage || false
      }
    });
  }
}

module.exports = ApiResponse;
