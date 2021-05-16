/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import SortOrder from "./sort_order";

class SortCols {
  constructor(sortColOrder) {
    this.sortCols = [];
    this.keys = {};
    if (sortColOrder && sortColOrder.length > 0) {
      let so = sortColOrder[1];
      if (so) {
        so = SortOrder.ASC;
      } else {
        so = SortOrder.DSC;
      }
      this.sortCols = [sortColOrder[0], so];
      this.keys[sortColOrder[0]] = so;
    }
  }

  shouldSort() {
    return this.sortCols.length > 0;
  }

  colClick(colInfo, curOrder) {
    let m = new SortCols();
    const newOrder = curOrder.cycleOrder();
    m.sortCols = [colInfo.data, newOrder];
    m.keys[colInfo.data] = newOrder;
    return m;
  }

  getHeaderKlass(colInfo) {
    let sk = "table-sort";
    let so = SortOrder.NONE;
    if ("orderable" in colInfo) {
      if (!colInfo.orderable) {
        so = SortOrder.DISABLED;
      }
    }
    if (colInfo.data in this.keys) {
      const sortOrder = this.keys[colInfo.data];
      if (SortOrder.ASC === sortOrder) {
        sk = "table-sort-asc";
        so = SortOrder.ASC;
      } else if (SortOrder.DSC === sortOrder) {
        sk = "table-sort-desc";
        so = SortOrder.DSC;
      }
    }
    return { sk, so };
  }
}

export default SortCols;
