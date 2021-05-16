/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

/* -*- mode: javascript; c-basic-offset: 4; indent-tabs-mode: nil -*- */

//
// Dalliance Genome Explorer
// (c) Thomas Down 2006-2010
//
// bigwig.js: indexed binary WIG (and BED) files
//

/* eslint-disable */

import { inflateBuffer, arrayCopy } from "jszlib";

import { Range, union, intersection } from "./spans";
import { DASFeature, DASGroup } from "./das";
import { shallowCopy } from "./utils";
import { readInt } from "./bin";

var BIG_WIG_MAGIC = 0x888ffc26;
var BIG_WIG_MAGIC_BE = 0x26fc8f88;
var BIG_BED_MAGIC = 0x8789f2eb;
var BIG_BED_MAGIC_BE = 0xebf28987;

var BIG_WIG_TYPE_GRAPH = 1;
var BIG_WIG_TYPE_VSTEP = 2;
var BIG_WIG_TYPE_FSTEP = 3;

var M1 = 256;
var M2 = 256 * 256;
var M3 = 256 * 256 * 256;
var M4 = 256 * 256 * 256 * 256;

var BED_COLOR_REGEXP = new RegExp("^[0-9]+,[0-9]+,[0-9]+");

function bwg_readOffset(ba, o) {
  var offset =
    ba[o] + ba[o + 1] * M1 + ba[o + 2] * M2 + ba[o + 3] * M3 + ba[o + 4] * M4;
  return offset;
}

class BigWig {
  readChromTree(callback) {
    var thisB = this;
    this.chromsToIDs = {};
    this.idsToChroms = {};
    this.maxID = 0;

    var udo = this.unzoomedDataOffset;
    var eb = (udo - this.chromTreeOffset) & 3;
    udo = udo + 4 - eb;

    this.data
      .slice(this.chromTreeOffset, udo - this.chromTreeOffset)
      .fetch(function (bpt) {
        var ba = new Uint8Array(bpt);
        var sa = new Int16Array(bpt);
        var la = new Int32Array(bpt);
        var keySize = la[2];

        var rootNodeOffset = 32;

        var bptReadNode = function (offset) {
          var nodeType = ba[offset];
          var cnt = sa[offset / 2 + 1];
          offset += 4;
          for (var n = 0; n < cnt; ++n) {
            if (nodeType === 0) {
              offset += keySize;
              var childOffset = bwg_readOffset(ba, offset);
              offset += 8;
              childOffset -= thisB.chromTreeOffset;
              bptReadNode(childOffset);
            } else {
              var key = "";
              for (var ki = 0; ki < keySize; ++ki) {
                var charCode = ba[offset++];
                if (charCode !== 0) {
                  key += String.fromCharCode(charCode);
                }
              }
              var chromId =
                (ba[offset + 3] << 24) |
                (ba[offset + 2] << 16) |
                (ba[offset + 1] << 8) |
                ba[offset + 0];
              offset += 8;

              thisB.chromsToIDs[key] = chromId;
              if (key.indexOf("chr") === 0) {
                thisB.chromsToIDs[key.substr(3)] = chromId;
              }
              thisB.idsToChroms[chromId] = key;
              thisB.maxID = Math.max(thisB.maxID, chromId);
            }
          }
        };
        bptReadNode(rootNodeOffset);

        callback(thisB);
      });
  }

  readWigData(chrName, min, max, callback) {
    this.getUnzoomedView().readWigData(chrName, min, max, callback);
  }

  getUnzoomedView() {
    if (!this.unzoomedView) {
      var cirLen = 4000;
      var nzl = this.zoomLevels[0];
      if (nzl) {
        cirLen = this.zoomLevels[0].dataOffset - this.unzoomedIndexOffset;
      }
      this.unzoomedView = new BigWigView(
        this,
        this.unzoomedIndexOffset,
        cirLen,
        false
      );
    }
    return this.unzoomedView;
  }

  getZoomedView(z) {
    var zh = this.zoomLevels[z];
    if (!zh.view) {
      zh.view = new BigWigView(
        this,
        zh.indexOffset,
        /* this.zoomLevels[z + 1].dataOffset - zh.indexOffset */ 4000,
        true
      );
    }
    return zh.view;
  }

  _tsFetch(zoom, chr, min, max, callback) {
    var bwg = this;
    if (zoom >= this.zoomLevels.length - 1) {
      if (!this.topLevelReductionCache) {
        this.getZoomedView(this.zoomLevels.length - 1).readWigDataById(
          -1,
          0,
          300000000,
          function (feats) {
            bwg.topLevelReductionCache = feats;
            return bwg._tsFetch(zoom, chr, min, max, callback);
          }
        );
      } else {
        var f = [];
        var c = this.topLevelReductionCache;
        for (var fi = 0; fi < c.length; ++fi) {
          if (c[fi]._chromId === chr) {
            f.push(c[fi]);
          }
        }
        return callback(f);
      }
    } else {
      var view;
      if (zoom < 0) {
        view = this.getUnzoomedView();
      } else {
        view = this.getZoomedView(zoom);
      }
      return view.readWigDataById(chr, min, max, callback);
    }
  }

  thresholdSearch(chrName, referencePoint, dir, threshold, callback) {
    dir = dir < 0 ? -1 : 1;
    var bwg = this;
    var initialChr = this.chromsToIDs[chrName];
    var candidates = [
      {
        chrOrd: 0,
        chr: initialChr,
        zoom: bwg.zoomLevels.length - 4,
        min: 0,
        max: 300000000,
        fromRef: true,
      },
    ];
    for (var i = 1; i <= this.maxID + 1; ++i) {
      var chrId = (initialChr + dir * i) % (this.maxID + 1);
      if (chrId < 0) chrId += this.maxID + 1;
      candidates.push({
        chrOrd: i,
        chr: chrId,
        zoom: bwg.zoomLevels.length - 1,
        min: 0,
        max: 300000000,
      });
    }

    function fbThresholdSearchRecur() {
      if (candidates.length === 0) {
        return callback(null);
      }
      candidates.sort(function (c1, c2) {
        var d = c1.zoom - c2.zoom;
        if (d !== 0) return d;

        d = c1.chrOrd - c2.chrOrd;
        if (d !== 0) return d;
        else return c1.min - c2.min * dir;
      });

      var candidate = candidates.splice(0, 1)[0];
      bwg._tsFetch(
        candidate.zoom,
        candidate.chr,
        candidate.min,
        candidate.max,
        function (feats) {
          var rp = dir > 0 ? 0 : 300000000;
          if (candidate.fromRef) rp = referencePoint;

          for (var fi = 0; fi < feats.length; ++fi) {
            var f = feats[fi];
            var score;
            if (f.maxScore !== undefined) score = f.maxScore;
            else score = f.score;

            if (dir > 0) {
              if (score > threshold) {
                if (candidate.zoom < 0) {
                  if (f.min > rp) return callback(f);
                } else if (f.max > rp) {
                  candidates.push({
                    chr: candidate.chr,
                    chrOrd: candidate.chrOrd,
                    zoom: candidate.zoom - 2,
                    min: f.min,
                    max: f.max,
                    fromRef: candidate.fromRef,
                  });
                }
              }
            } else {
              if (score > threshold) {
                if (candidate.zoom < 0) {
                  if (f.max < rp) return callback(f);
                } else if (f.min < rp) {
                  candidates.push({
                    chr: candidate.chr,
                    chrOrd: candidate.chrOrd,
                    zoom: candidate.zoom - 2,
                    min: f.min,
                    max: f.max,
                    fromRef: candidate.fromRef,
                  });
                }
              }
            }
          }
          fbThresholdSearchRecur();
        }
      );
    }

    fbThresholdSearchRecur();
  }

  getAutoSQL(callback) {
    if (!this.asOffset) {
      return callback(null);
    }

    this.data.slice(this.asOffset, 2048).fetch(function (result) {
      var ba = new Uint8Array(result);
      var s = "";
      for (var i = 0; i < ba.length; ++i) {
        if (ba[i] === 0) break;
        s += String.fromCharCode(ba[i]);
      }

      /*
       * Quick'n'dirty attempt to parse autoSql format.
       * See: http://www.linuxjournal.com/files/linuxjournal.com/linuxjournal/articles/059/5949/5949l2.html
       */

      var header_re = /(\w+)\s+(\w+)\s+("([^"]+)")?\s+\(\s*/;
      var field_re = /([\w\[\]]+)\s+(\w+)\s*;\s*("([^"]+)")?\s*/g;

      var headerMatch = header_re.exec(s);
      if (headerMatch) {
        var as = {
          declType: headerMatch[1],
          name: headerMatch[2],
          comment: headerMatch[4],

          fields: [],
        };

        s = s.substring(headerMatch[0]);
        for (var m = field_re.exec(s); m !== null; m = field_re.exec(s)) {
          as.fields.push({ type: m[1], name: m[2], comment: m[4] });
        }

        return callback(as);
      }
    });
  }

  getExtraIndices(callback) {
    var thisB = this;
    if (
      this.version < 4 ||
      this.extHeaderOffset === 0 ||
      this.type !== "bigbed"
    ) {
      return callback(null);
    } else {
      this.data.slice(this.extHeaderOffset, 64).fetch(function (result) {
        if (!result) {
          return callback(null, "Couldn't fetch extension header");
        }

        var ba = new Uint8Array(result);
        var sa = new Int16Array(result);

        var extraIndexCount = sa[1];
        var extraIndexListOffset = bwg_readOffset(ba, 4);

        if (extraIndexCount === 0) {
          return callback(null);
        }

        // FIXME 20byte records only make sense for single-field indices.
        // Right now, these seem to be the only things around, but the format
        // is actually more general.
        thisB.data
          .slice(extraIndexListOffset, extraIndexCount * 20)
          .fetch(function (eil) {
            if (!eil) {
              return callback(null, "Couldn't fetch index info");
            }

            var ba = new Uint8Array(eil);
            var sa = new Int16Array(eil);

            var indices = [];
            for (var ii = 0; ii < extraIndexCount; ++ii) {
              var eiType = sa[ii * 10];
              var eiFieldCount = sa[ii * 10 + 1];
              var eiOffset = bwg_readOffset(ba, ii * 20 + 4);
              var eiField = sa[ii * 10 + 8];
              var index = new BBIExtraIndex(
                thisB,
                eiType,
                eiFieldCount,
                eiOffset,
                eiField
              );
              indices.push(index);
            }
            callback(indices);
          });
      });
    }
  }
}

class BBIExtraIndex {
  constructor(bbi, type, fieldCount, offset, field) {
    this.bbi = bbi;
    this.type = type;
    this.fieldCount = fieldCount;
    this.offset = offset;
    this.field = field;
  }

  lookup(name, callback) {
    var thisB = this;

    this.bbi.data.slice(this.offset, 32).fetch(function (bpt) {
      var la = new Int32Array(bpt);
      var blockSize = la[1];
      var keySize = la[2];
      var valSize = la[3];
      var rootNodeOffset = 32;

      function bptReadNode(nodeOffset) {
        thisB.bbi.data
          .slice(nodeOffset, 4 + blockSize * (keySize + valSize))
          .fetch(function (node) {
            var ba = new Uint8Array(node);
            var sa = new Uint16Array(node);

            var nodeType = ba[0];
            var cnt = sa[1];

            var offset = 4;
            let n = 0;
            let ki = 0;
            let key = "";
            if (nodeType === 0) {
              var lastChildOffset = null;
              for (n = 0; n < cnt; ++n) {
                key = "";
                for (ki = 0; ki < keySize; ++ki) {
                  var charCode = ba[offset++];
                  if (charCode !== 0) {
                    key += String.fromCharCode(charCode);
                  }
                }

                var childOffset = bwg_readOffset(ba, offset);
                offset += 8;

                if (name.localeCompare(key) < 0 && lastChildOffset) {
                  bptReadNode(lastChildOffset);
                  return;
                }
                lastChildOffset = childOffset;
              }
              bptReadNode(lastChildOffset);
            } else {
              for (n = 0; n < cnt; ++n) {
                key = "";
                for (ki = 0; ki < keySize; ++ki) {
                  var charCode2 = ba[offset++];
                  if (charCode2 !== 0) {
                    key += String.fromCharCode(charCode2);
                  }
                }

                // Specific for EI case.
                if (key === name) {
                  var start = bwg_readOffset(ba, offset);
                  var length = readInt(ba, offset + 8);

                  return thisB.bbi.getUnzoomedView().fetchFeatures(
                    function (chr, min, max, toks) {
                      if (toks && toks.length > thisB.field - 3)
                        return toks[thisB.field - 3] === name;
                    },
                    [{ offset: start, size: length }],
                    callback
                  );
                }
                offset += valSize;
              }
              return callback([]);
            }
          });
      }

      bptReadNode(thisB.offset + rootNodeOffset);
    });
  }
}

class BigWigView {
  constructor(bwg, cirTreeOffset, cirTreeLength, isSummary) {
    this.bwg = bwg;
    this.cirTreeOffset = cirTreeOffset;
    this.cirTreeLength = cirTreeLength;
    this.isSummary = isSummary;
  }

  readWigData(chrName, min, max, callback) {
    var chr = this.bwg.chromsToIDs[chrName];
    if (chr === undefined) {
      // Not an error because some .bwgs won't have data for all chromosomes.
      return callback([]);
    } else {
      this.readWigDataById(chr, min, max, callback);
    }
  }

  readWigDataById(chr, min, max, callback) {
    var thisB = this;
    if (!this.cirHeader) {
      this.bwg.data.slice(this.cirTreeOffset, 48).fetch(function (result) {
        thisB.cirHeader = result;
        var la = new Int32Array(thisB.cirHeader);
        thisB.cirBlockSize = la[1];
        thisB.readWigDataById(chr, min, max, callback);
      });
      return;
    }

    var blocksToFetch = [];
    var outstanding = 0;

    var filter = function (chromId, fmin, fmax, toks) {
      return (chr < 0 || chromId === chr) && fmin <= max && fmax >= min;
    };

    var cirFobRecur = function (offset, level) {
      if (thisB.bwg.instrument)
        console.log(
          "level=" + level + "; offset=" + offset + "; time=" + (Date.now() | 0)
        );

      outstanding += offset.length;

      if (
        offset.length === 1 &&
        offset[0] - thisB.cirTreeOffset === 48 &&
        thisB.cachedCirRoot
      ) {
        cirFobRecur2(thisB.cachedCirRoot, 0, level);
        --outstanding;
        if (outstanding === 0) {
          thisB.fetchFeatures(filter, blocksToFetch, callback);
        }
        return;
      }

      var maxCirBlockSpan = 4 + thisB.cirBlockSize * 32; // Upper bound on size, based on a completely full leaf node.
      var spans;
      for (var i = 0; i < offset.length; ++i) {
        var blockSpan = new Range(offset[i], offset[i] + maxCirBlockSpan);
        spans = spans ? union(spans, blockSpan) : blockSpan;
      }

      var fetchRanges = spans.ranges();
      for (var r = 0; r < fetchRanges.length; ++r) {
        var fr = fetchRanges[r];
        cirFobStartFetch(offset, fr, level);
      }
    };

    var cirFobStartFetch = function (offset, fr, level, attempts) {
      thisB.bwg.data
        .slice(fr.min(), fr.max() - fr.min())
        .fetch(function (resultBuffer) {
          for (var i = 0; i < offset.length; ++i) {
            if (fr.contains(offset[i])) {
              cirFobRecur2(resultBuffer, offset[i] - fr.min(), level);

              if (
                offset[i] - thisB.cirTreeOffset === 48 &&
                offset[i] - fr.min() === 0
              )
                thisB.cachedCirRoot = resultBuffer;

              --outstanding;
              if (outstanding === 0) {
                thisB.fetchFeatures(filter, blocksToFetch, callback);
              }
            }
          }
        });
    };

    var cirFobRecur2 = function (cirBlockData, offset, level) {
      var ba = new Uint8Array(cirBlockData);
      var sa = new Int16Array(cirBlockData);
      var la = new Int32Array(cirBlockData);
      var startChrom, startBase, endChrom, endBase, blockOffset;

      var isLeaf = ba[offset];
      var cnt = sa[offset / 2 + 1];
      offset += 4;
      var i, lo;

      if (isLeaf !== 0) {
        for (i = 0; i < cnt; ++i) {
          lo = offset / 4;
          startChrom = la[lo];
          startBase = la[lo + 1];
          endChrom = la[lo + 2];
          endBase = la[lo + 3];
          blockOffset = bwg_readOffset(ba, offset + 16);
          var blockSize = bwg_readOffset(ba, offset + 24);
          if (
            (chr < 0 ||
              startChrom < chr ||
              (startChrom === chr && startBase <= max)) &&
            (chr < 0 || endChrom > chr || (endChrom === chr && endBase >= min))
          ) {
            blocksToFetch.push({ offset: blockOffset, size: blockSize });
          }
          offset += 32;
        }
      } else {
        var recurOffsets = [];
        for (i = 0; i < cnt; ++i) {
          lo = offset / 4;
          startChrom = la[lo];
          startBase = la[lo + 1];
          endChrom = la[lo + 2];
          endBase = la[lo + 3];
          blockOffset = bwg_readOffset(ba, offset + 16);
          if (
            (chr < 0 ||
              startChrom < chr ||
              (startChrom === chr && startBase <= max)) &&
            (chr < 0 || endChrom > chr || (endChrom === chr && endBase >= min))
          ) {
            recurOffsets.push(blockOffset);
          }
          offset += 24;
        }
        if (recurOffsets.length > 0) {
          cirFobRecur(recurOffsets, level + 1);
        }
      }
    };

    cirFobRecur([thisB.cirTreeOffset + 48], 1);
  }

  fetchFeatures(filter, blocksToFetch, callback) {
    var thisB = this;

    blocksToFetch.sort(function (b0, b1) {
      return (b0.offset | 0) - (b1.offset | 0);
    });

    if (blocksToFetch.length === 0) {
      callback([]);
    } else {
      var features = [];
      var createFeature = function (chr, fmin, fmax, opts) {
        if (!opts) {
          opts = {};
        }

        var f = new DASFeature();
        f._chromId = chr;
        f.segment = thisB.bwg.idsToChroms[chr];
        f.min = fmin;
        f.max = fmax;
        f.type = thisB.bwg.type;

        for (var k in opts) {
          f[k] = opts[k];
        }

        features.push(f);
      };

      var tramp = function () {
        if (blocksToFetch.length === 0) {
          // dlog('BWG fetch took ' + (afterBWG - beforeBWG) + 'ms');
          callback(features);
          return; // just in case...
        } else {
          var block = blocksToFetch[0];
          if (block.data) {
            thisB.parseFeatures(block.data, createFeature, filter);
            blocksToFetch.splice(0, 1);
            tramp();
          } else {
            var fetchStart = block.offset;
            var fetchSize = block.size;
            var bi = 1;
            while (
              bi < blocksToFetch.length &&
              blocksToFetch[bi].offset === fetchStart + fetchSize
            ) {
              fetchSize += blocksToFetch[bi].size;
              ++bi;
            }

            thisB.bwg.data
              .slice(fetchStart, fetchSize)
              .fetch(function (result) {
                var offset = 0;
                var bi = 0;
                while (offset < fetchSize) {
                  var fb = blocksToFetch[bi];

                  var data;
                  if (thisB.bwg.uncompressBufSize > 0) {
                    data = inflateBuffer(result, offset + 2, fb.size - 2);
                  } else {
                    var tmp = new Uint8Array(fb.size); // FIXME is this really the best we can do?
                    arrayCopy(
                      new Uint8Array(result, offset, fb.size),
                      0,
                      tmp,
                      0,
                      fb.size
                    );
                    data = tmp.buffer;
                  }
                  fb.data = data;

                  offset += fb.size;
                  ++bi;
                }
                tramp();
              });
          }
        }
      };
      tramp();
    }
  }

  parseFeatures(data, createFeature, filter) {
    var ba = new Uint8Array(data);
    var sa, la, fa, chromId, itemCount, i, start, end, score;

    if (this.isSummary) {
      sa = new Int16Array(data);
      la = new Int32Array(data);
      fa = new Float32Array(data);

      itemCount = data.byteLength / 32;
      for (i = 0; i < itemCount; ++i) {
        chromId = la[i * 8];
        start = la[i * 8 + 1];
        end = la[i * 8 + 2];
        var validCnt = la[i * 8 + 3];
        var maxVal = fa[i * 8 + 5];
        var sumData = fa[i * 8 + 6];

        if (filter(chromId, start + 1, end)) {
          var summaryOpts = {
            type: "bigwig",
            score: sumData / validCnt,
            maxScore: maxVal,
          };
          if (this.bwg.type === "bigbed") {
            summaryOpts.type = "density";
          }
          createFeature(chromId, start + 1, end, summaryOpts);
        }
      }
    } else if (this.bwg.type === "bigwig") {
      sa = new Int16Array(data);
      la = new Int32Array(data);
      fa = new Float32Array(data);

      chromId = la[0];
      var blockStart = la[1];
      var itemStep = la[3];
      var itemSpan = la[4];
      var blockType = ba[20];
      itemCount = sa[11];

      if (blockType === BIG_WIG_TYPE_FSTEP) {
        for (i = 0; i < itemCount; ++i) {
          score = fa[i + 6];
          var fmin = blockStart + i * itemStep + 1,
            fmax = blockStart + i * itemStep + itemSpan;
          if (filter(chromId, fmin, fmax))
            createFeature(chromId, fmin, fmax, { score: score });
        }
      } else if (blockType === BIG_WIG_TYPE_VSTEP) {
        for (i = 0; i < itemCount; ++i) {
          start = la[i * 2 + 6] + 1;
          end = start + itemSpan - 1;
          score = fa[i * 2 + 7];
          if (filter(chromId, start, end))
            createFeature(chromId, start, end, { score: score });
        }
      } else if (blockType === BIG_WIG_TYPE_GRAPH) {
        for (i = 0; i < itemCount; ++i) {
          start = la[i * 3 + 6] + 1;
          end = la[i * 3 + 7];
          score = fa[i * 3 + 8];
          if (start > end) {
            start = end;
          }
          if (filter(chromId, start, end))
            createFeature(chromId, start, end, { score: score });
        }
      } else {
        console.log("Currently not handling bwgType=" + blockType);
      }
    } else if (this.bwg.type === "bigbed") {
      var offset = 0;
      var dfc = this.bwg.definedFieldCount;
      var schema = this.bwg.schema;

      while (offset < ba.length) {
        chromId =
          (ba[offset + 3] << 24) |
          (ba[offset + 2] << 16) |
          (ba[offset + 1] << 8) |
          ba[offset + 0];
        start =
          (ba[offset + 7] << 24) |
          (ba[offset + 6] << 16) |
          (ba[offset + 5] << 8) |
          ba[offset + 4];
        end =
          (ba[offset + 11] << 24) |
          (ba[offset + 10] << 16) |
          (ba[offset + 9] << 8) |
          ba[offset + 8];
        offset += 12;
        var rest = "";
        while (true) {
          var ch = ba[offset++];
          if (ch !== 0) {
            rest += String.fromCharCode(ch);
          } else {
            break;
          }
        }

        var featureOpts = {};

        var bedColumns;
        if (rest.length > 0) {
          bedColumns = rest.split("\t");
        } else {
          bedColumns = [];
        }
        if (bedColumns.length > 0 && dfc > 3) {
          featureOpts.label = bedColumns[0];
        }
        if (bedColumns.length > 1 && dfc > 4) {
          score = parseInt(bedColumns[1]);
          if (!isNaN(score)) featureOpts.score = score;
        }
        if (bedColumns.length > 2 && dfc > 5) {
          featureOpts.orientation = bedColumns[2];
        }
        if (bedColumns.length > 5 && dfc > 8) {
          var color = bedColumns[5];
          if (BED_COLOR_REGEXP.test(color)) {
            featureOpts.itemRgb = "rgb(" + color + ")";
          }
        }

        if (bedColumns.length > dfc - 3 && schema) {
          for (var col = dfc - 3; col < bedColumns.length; ++col) {
            featureOpts[schema.fields[col + 3].name] = bedColumns[col];
          }
        }

        if (filter(chromId, start + 1, end, bedColumns)) {
          if (dfc < 12) {
            createFeature(chromId, start + 1, end, featureOpts);
          } else {
            var thickStart = bedColumns[3] | 0;
            var thickEnd = bedColumns[4] | 0;
            var blockCount = bedColumns[6] | 0;
            var blockSizes = bedColumns[7].split(",");
            var blockStarts = bedColumns[8].split(",");

            if (featureOpts.exonFrames) {
              var exonFrames = featureOpts.exonFrames.split(",");
              featureOpts.exonFrames = undefined;
            }

            featureOpts.type = "transcript";
            var grp = new DASGroup();
            for (var k in featureOpts) {
              grp[k] = featureOpts[k];
            }
            grp.id = bedColumns[0];
            grp.segment = this.bwg.idsToChroms[chromId];
            grp.min = start + 1;
            grp.max = end;
            grp.notes = [];
            featureOpts.groups = [grp];

            // Moving towards using bigGenePred model, but will
            // still support old Dalliance-style BED12+gene-name for the
            // foreseeable future.
            if (bedColumns.length > 9) {
              var geneId = featureOpts.geneName || bedColumns[9];
              var geneName = geneId;
              if (bedColumns.length > 10) {
                geneName = bedColumns[10];
              }
              if (featureOpts.geneName2) geneName = featureOpts.geneName2;

              var gg = shallowCopy(grp);
              gg.id = geneId;
              gg.label = geneName;
              gg.type = "gene";
              featureOpts.groups.push(gg);
            }

            var spanList = [];
            for (var b = 0; b < blockCount; ++b) {
              var bmin = (blockStarts[b] | 0) + start;
              var bmax = bmin + (blockSizes[b] | 0);
              var span = new Range(bmin, bmax);
              spanList.push(span);
            }
            var spans = union(spanList);

            var tsList = spans.ranges();
            for (var s = 0; s < tsList.length; ++s) {
              var ts = tsList[s];
              createFeature(chromId, ts.min() + 1, ts.max(), featureOpts);
            }

            if (thickEnd > thickStart) {
              var codingRegion =
                featureOpts.orientation === "+"
                  ? new Range(thickStart, thickEnd + 3)
                  : new Range(thickStart - 3, thickEnd);
              // +/- 3 to account for stop codon

              var tl = intersection(spans, codingRegion);
              if (tl) {
                featureOpts.type = "translation";
                var tlList = tl.ranges();
                var readingFrame = 0;

                var tlOffset = 0;
                while (tlList[0].min() > tsList[tlOffset].max()) tlOffset++;

                for (var s = 0; s < tlList.length; ++s) {
                  // Record reading frame for every exon
                  var index = s;
                  if (featureOpts.orientation === "-")
                    index = tlList.length - s - 1;
                  var ts = tlList[index];
                  featureOpts.readframe = readingFrame;
                  if (exonFrames) {
                    var brf = parseInt(exonFrames[index + tlOffset]);
                    if (typeof brf === "number" && brf >= 0 && brf <= 2) {
                      featureOpts.readframe = brf;
                      featureOpts.readframeExplicit = true;
                    }
                  }
                  var length = ts.max() - ts.min();
                  readingFrame = (readingFrame + length) % 3;
                  createFeature(chromId, ts.min() + 1, ts.max(), featureOpts);
                }
              }
            }
          }
        }
      }
    } else {
      throw Error("Don't know what to do with " + this.bwg.type);
    }
  }

  //
  // nasty cut/paste, should roll back in!
  //
  getFirstAdjacent(chrName, pos, dir, callback) {
    var chr = this.bwg.chromsToIDs[chrName];
    if (chr === undefined) {
      // Not an error because some .bwgs won't have data for all chromosomes.
      return callback([]);
    } else {
      this.getFirstAdjacentById(chr, pos, dir, callback);
    }
  }

  getFirstAdjacentById(chr, pos, dir, callback) {
    var thisB = this;
    if (!this.cirHeader) {
      this.bwg.data.slice(this.cirTreeOffset, 48).fetch(function (result) {
        thisB.cirHeader = result;
        var la = new Int32Array(thisB.cirHeader);
        thisB.cirBlockSize = la[1];
        thisB.getFirstAdjacentById(chr, pos, dir, callback);
      });
      return;
    }

    var blockToFetch = null;
    var bestBlockChr = -1;
    var bestBlockOffset = -1;

    var outstanding = 0;

    var cirFobRecur = function (offset, level) {
      outstanding += offset.length;

      var maxCirBlockSpan = 4 + thisB.cirBlockSize * 32; // Upper bound on size, based on a completely full leaf node.
      var spans;
      for (var i = 0; i < offset.length; ++i) {
        var blockSpan = new Range(offset[i], offset[i] + maxCirBlockSpan);
        spans = spans ? union(spans, blockSpan) : blockSpan;
      }

      var fetchRanges = spans.ranges();
      for (var r = 0; r < fetchRanges.length; ++r) {
        var fr = fetchRanges[r];
        cirFobStartFetch(offset, fr, level);
      }
    };

    var cirFobStartFetch = function (offset, fr, level, attempts) {
      thisB.bwg.data
        .slice(fr.min(), fr.max() - fr.min())
        .fetch(function (resultBuffer) {
          for (var i = 0; i < offset.length; ++i) {
            if (fr.contains(offset[i])) {
              cirFobRecur2(resultBuffer, offset[i] - fr.min(), level);
              --outstanding;
              if (outstanding === 0) {
                if (!blockToFetch) {
                  if (dir > 0 && (chr !== 0 || pos > 0)) {
                    return thisB.getFirstAdjacentById(0, 0, dir, callback);
                  } else if (
                    dir < 0 &&
                    (chr !== thisB.bwg.maxID || pos < 1000000000)
                  ) {
                    return thisB.getFirstAdjacentById(
                      thisB.bwg.maxID,
                      1000000000,
                      dir,
                      callback
                    );
                  }
                  return callback([]);
                }

                thisB.fetchFeatures(
                  function (chrx, fmin, fmax, toks) {
                    return (
                      (dir < 0 && (chrx < chr || fmax < pos)) ||
                      (dir > 0 && (chrx > chr || fmin > pos))
                    );
                  },
                  [blockToFetch],
                  function (features) {
                    var bestFeature = null;
                    var bestChr = -1;
                    var bestPos = -1;
                    for (var fi = 0; fi < features.length; ++fi) {
                      var f = features[fi];
                      var chrx = f._chromId,
                        fmin = f.min,
                        fmax = f.max;
                      if (
                        bestFeature === null ||
                        (dir < 0 && (chrx > bestChr || fmax > bestPos)) ||
                        (dir > 0 && (chrx < bestChr || fmin < bestPos))
                      ) {
                        bestFeature = f;
                        bestPos = dir < 0 ? fmax : fmin;
                        bestChr = chrx;
                      }
                    }

                    if (bestFeature !== null) return callback([bestFeature]);
                    else return callback([]);
                  }
                );
              }
            }
          }
        });
    };

    var cirFobRecur2 = function (cirBlockData, offset, level) {
      var ba = new Uint8Array(cirBlockData);
      var sa = new Int16Array(cirBlockData);
      var la = new Int32Array(cirBlockData);
      var startChrom, startBase, endChrom, endBase;

      var isLeaf = ba[offset];
      var cnt = sa[offset / 2 + 1];
      offset += 4;

      if (isLeaf !== 0) {
        for (var i = 0; i < cnt; ++i) {
          var lo = offset / 4;
          startChrom = la[lo];
          startBase = la[lo + 1];
          endChrom = la[lo + 2];
          endBase = la[lo + 3];
          var blockOffset = bwg_readOffset(ba, offset + 16);
          var blockSize = bwg_readOffset(ba, offset + 24);
          if (
            (dir < 0 &&
              (startChrom < chr || (startChrom === chr && startBase <= pos))) ||
            (dir > 0 &&
              (endChrom > chr || (endChrom === chr && endBase >= pos)))
          ) {
            // console.log('Got an interesting block: startBase=' + startChrom + ':' + startBase + '; endBase=' + endChrom + ':' + endBase + '; offset=' + blockOffset + '; size=' + blockSize);
            if (/_random/.exec(thisB.bwg.idsToChroms[startChrom])) {
              // dlog('skipping random: ' + thisB.bwg.idsToChroms[startChrom]);
            } else if (
              blockToFetch === null ||
              (dir < 0 &&
                (endChrom > bestBlockChr ||
                  (endChrom === bestBlockChr && endBase > bestBlockOffset))) ||
              (dir > 0 &&
                (startChrom < bestBlockChr ||
                  (startChrom === bestBlockChr && startBase < bestBlockOffset)))
            ) {
              //                        dlog('best is: startBase=' + startChrom + ':' + startBase + '; endBase=' + endChrom + ':' + endBase + '; offset=' + blockOffset + '; size=' + blockSize);
              blockToFetch = { offset: blockOffset, size: blockSize };
              bestBlockOffset = dir < 0 ? endBase : startBase;
              bestBlockChr = dir < 0 ? endChrom : startChrom;
            }
          }
          offset += 32;
        }
      } else {
        var bestRecur = -1;
        var bestPos = -1;
        for (var i = 0; i < cnt; ++i) {
          var lo = offset / 4;
          startChrom = la[lo];
          startBase = la[lo + 1];
          endChrom = la[lo + 2];
          endBase = la[lo + 3];
          if (
            (dir < 0 &&
              (startChrom < chr || (startChrom === chr && startBase <= pos)) &&
              endChrom >= chr) ||
            (dir > 0 &&
              (endChrom > chr || (endChrom === chr && endBase >= pos)) &&
              startChrom <= chr)
          ) {
            if (bestRecur < 0 || endBase > bestPos) {
              bestRecur = blockOffset;
              bestPos = dir < 0 ? endBase : startBase;
            }
          }
          offset += 24;
        }
        if (bestRecur >= 0) {
          cirFobRecur([bestRecur], level + 1);
        }
      }
    };

    cirFobRecur([thisB.cirTreeOffset + 48], 1);
  }
}

export function makeBwg(data, callback, name) {
  var bwg = new BigWig();
  bwg.data = data;
  bwg.name = name;
  bwg.data
    .slice(0, 512)
    .salted()
    .fetch(
      function (result) {
        if (!result) {
          return callback(null, "Couldn't fetch file");
        }

        var header = result;
        var ba = new Uint8Array(header);
        var sa = new Int16Array(header);
        var la = new Int32Array(header);
        var magic = ba[0] + M1 * ba[1] + M2 * ba[2] + M3 * ba[3];
        if (magic === BIG_WIG_MAGIC) {
          bwg.type = "bigwig";
        } else if (magic === BIG_BED_MAGIC) {
          bwg.type = "bigbed";
        } else if (magic === BIG_WIG_MAGIC_BE || magic === BIG_BED_MAGIC_BE) {
          return callback(null, "Currently don't support big-endian BBI files");
        } else {
          return callback(
            null,
            "Not a supported format, magic=0x" + magic.toString(16)
          );
        }

        bwg.version = sa[2]; // 4
        bwg.numZoomLevels = sa[3]; // 6
        bwg.chromTreeOffset = bwg_readOffset(ba, 8);
        bwg.unzoomedDataOffset = bwg_readOffset(ba, 16);
        bwg.unzoomedIndexOffset = bwg_readOffset(ba, 24);
        bwg.fieldCount = sa[16]; // 32
        bwg.definedFieldCount = sa[17]; // 34
        bwg.asOffset = bwg_readOffset(ba, 36);
        bwg.totalSummaryOffset = bwg_readOffset(ba, 44);
        bwg.uncompressBufSize = la[13]; // 52
        bwg.extHeaderOffset = bwg_readOffset(ba, 56);

        bwg.zoomLevels = [];
        for (var zl = 0; zl < bwg.numZoomLevels; ++zl) {
          var zlReduction = la[zl * 6 + 16];
          var zlData = bwg_readOffset(ba, zl * 24 + 72);
          var zlIndex = bwg_readOffset(ba, zl * 24 + 80);
          bwg.zoomLevels.push({
            reduction: zlReduction,
            dataOffset: zlData,
            indexOffset: zlIndex,
          });
        }

        bwg.readChromTree(function () {
          bwg.getAutoSQL(function (as) {
            bwg.schema = as;
            return callback(bwg);
          });
        });
      },
      { timeout: 5000 }
    ); // Potential timeout on first request to catch mixed-content errors on
  // Chromium.
}
