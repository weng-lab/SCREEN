/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

export const MAKE_SEARCH_QUERY = 'MAKE_SEARCH_QUERY'
export const makeSearchQuery = (q, assembly) => ({ type: MAKE_SEARCH_QUERY, q, assembly });
