/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Zhiping Weng
 */

import {makeBwg} from '../external/igvjs/bigwig';
import {URLFetchable} from '../external/igvjs/bin';
 const readBig = (url, chrom, start, end, successF) => {
  makeBwg(new URLFetchable(url), function(bwg, err) {
    if (bwg) {
      var data, zoomFactor = -1;
      if (zoomFactor < 0) {
        data = bwg.getUnzoomedView();
      } else {

        data = bwg.getZoomedView(zoomFactor);
      }
      data.readWigData(chrom, start, end, function(data) {

        successF(data);
      });

    } else {
      console.log("error!", err);
    }
  });
}
export default readBig
