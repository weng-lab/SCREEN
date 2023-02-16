/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

/* -*- mode: javascript; c-basic-offset: 4; indent-tabs-mode: nil -*- */

//
// Dalliance Genome Explorer
// (c) Thomas Down 2006-2010
//
// utils.js: odds, sods, and ends.
//

function pusho(obj, k, v) {
  if (obj[k]) {
    obj[k].push(v)
  } else {
    obj[k] = [v]
  }
}

function shallowCopy(o) {
  var n = {}
  for (var k in o) {
    n[k] = o[k]
  }
  return n
}

if (typeof module !== "undefined") {
  module.exports = {
    shallowCopy: shallowCopy,
    pusho: pusho,
  }
}
