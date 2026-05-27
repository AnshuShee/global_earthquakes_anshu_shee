/**
 * Reusable utility to handle pagination bounds, offsets, and return standard meta fields.
 */
class Pagination {
  /**
   * Safely parses page and limit parameters
   */
  static getParams(query) {
    let page = parseInt(query.page) || 1;
    let limit = parseInt(query.limit) || 10;

    // Prevent negative or zero values
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    
    // Set a maximum limit to prevent CPU/memory exhaustion (e.g., 100 records)
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  /**
   * Generates standard pagination metadata object
   */
  static getMeta(totalRecords, page, limit) {
    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      totalRecords,
      limit,
      page,
      totalPages,
      hasNextPage,
      hasPrevPage
    };
  }
}

module.exports = Pagination;
