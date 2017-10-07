import {makeBwg} from '../external/igvjs/bigwig';
import {URLFetchable} from '../external/igvjs/bin';
 const readBig = (url, chrom, start, end, successF) => {
  let bbi = new URLFetchable(url);

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
