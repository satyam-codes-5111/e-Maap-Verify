/**
 * Reusable backend pagination helper
 */
export function getPaginationParams(query = {}, defaultLimit = 10, maxLimit = 100) {
  const rawPageVal = Array.isArray(query.page) ? query.page[query.page.length - 1] : query.page;
  const parsedPage = parseInt(rawPageVal, 10);
  const page = !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const rawLimitVal = Array.isArray(query.limit) ? query.limit[query.limit.length - 1] : query.limit;
  const parsedLimit = parseInt(rawLimitVal, 10);
  const rawLimit = !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : defaultLimit;
  const limit = Math.min(Math.max(1, rawLimit), maxLimit);
  const skip = (page - 1) * limit;

  // Safe sorting validation
  let sortBy = 'createdAt';
  if (
    typeof query.sortBy === 'string' &&
    /^[a-zA-Z0-9_]{1,40}$/.test(query.sortBy) &&
    !['__proto__', 'constructor', 'prototype'].includes(query.sortBy)
  ) {
    sortBy = query.sortBy;
  }

  const sortOrder =
    query.sortOrder === 'asc' || query.sortOrder === '1' || query.sortOrder === 1 ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  return { page, limit, skip, sort };
}

export function buildPaginationResponse(data, total, page, limit, customKey = null) {
  const totalPages = Math.ceil(total / limit) || 1;
  const result = {
    items: data,
    users: data,
    instruments: data,
    applications: data,
    schedules: data,
    certificates: data,
    data: data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
  if (customKey) {
    result[customKey] = data;
  }
  return result;
}
