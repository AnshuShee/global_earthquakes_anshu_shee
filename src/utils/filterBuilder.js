/**
 * Utility to dynamically build MongoDB query filters from Express request queries.
 */
class FilterBuilder {
  static build(query) {
    const filter = { isDeleted: { $ne: true } }; // Exclude soft-deleted by default

    // 1. Text/Regex filtering on Country & Place
    if (query.country) {
      filter.country = { $regex: new RegExp(query.country, 'i') };
    }
    if (query.place) {
      filter.place = { $regex: new RegExp(query.place, 'i') };
    }

    // 2. Exact match fields
    if (query.status) {
      filter.status = query.status.toLowerCase();
    }
    if (query.magType) {
      filter.magType = query.magType.toLowerCase();
    }
    if (query.type) {
      filter.type = query.type.toLowerCase();
    }
    
    const network = query.network || query.net;
    if (network) {
      filter.net = network.toLowerCase();
    }

    // 3. Range validations: Magnitude
    if (query.minMagnitude || query.maxMagnitude) {
      filter.mag = {};
      if (query.minMagnitude) {
        filter.mag.$gte = parseFloat(query.minMagnitude);
      }
      if (query.maxMagnitude) {
        filter.mag.$lte = parseFloat(query.maxMagnitude);
      }
    }

    // 4. Range validations: Depth
    if (query.minDepth || query.maxDepth) {
      filter.depth = {};
      if (query.minDepth) {
        filter.depth.$gte = parseFloat(query.minDepth);
      }
      if (query.maxDepth) {
        filter.depth.$lte = parseFloat(query.maxDepth);
      }
    }

    // 5. Range validations: Seismic Gap
    if (query.minGap || query.maxGap) {
      filter.gap = {};
      if (query.minGap) {
        filter.gap.$gte = parseFloat(query.minGap);
      }
      if (query.maxGap) {
        filter.gap.$lte = parseFloat(query.maxGap);
      }
    }

    // 6. Range validations: RMS
    if (query.minRms || query.maxRms) {
      filter.rms = {};
      if (query.minRms) {
        filter.rms.$gte = parseFloat(query.minRms);
      }
      if (query.maxRms) {
        filter.rms.$lte = parseFloat(query.maxRms);
      }
    }

    // 7. Date filtering: Year & Month
    if (query.year && query.month) {
      const year = parseInt(query.year);
      const month = parseInt(query.month);
      const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      filter.time = { $gte: startDate, $lte: endDate };
    } else if (query.year) {
      const year = parseInt(query.year);
      const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
      filter.time = { $gte: startDate, $lte: endDate };
    } else if (query.month) {
      const month = parseInt(query.month);
      // If only month is provided, match that month across all years using Mongo $expr
      filter.$expr = { $eq: [{ $month: '$time' }, month] };
    }

    return filter;
  }
}

module.exports = FilterBuilder;
