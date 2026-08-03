const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MAX_LIMIT = 100;

export function parsePagination(query) {
    const hasPage = query.page !== undefined;
    const page = Math.max(1, parseInt(query.page, 10) || 1);

    let pageSize = parseInt(query.pageSize, 10);
    if (!Number.isInteger(pageSize) || pageSize < 1) pageSize = DEFAULT_PAGE_SIZE;
    pageSize = Math.min(pageSize, MAX_PAGE_SIZE);

    const limitParam = parseInt(query.limit, 10);
    const hasLimit = Number.isInteger(limitParam) && limitParam > 0;
    const limit = hasLimit ? Math.min(limitParam, MAX_LIMIT) : undefined;

    return { hasLimit, limit, hasPage, page, pageSize };
}

export async function paginate(query, countPromise, { page, pageSize }) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
        query.skip(skip).limit(pageSize).exec(),
        countPromise
    ]);

    return {
        data,
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
    };
}

export async function paginatedFind(query, Model, filter, reqQuery, { defaultLimit } = {}) {
    const { hasLimit, limit, hasPage, page, pageSize } = parsePagination(reqQuery);

    if (hasPage) {
        return paginate(query, Model.countDocuments(filter), { page, pageSize });
    }

    if (hasLimit) {
        query = query.limit(limit);
    } else if (defaultLimit) {
        query = query.limit(defaultLimit);
    }

    return query.exec();
}

export function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function asString(value) {
    return typeof value === "string" ? value : undefined;
}