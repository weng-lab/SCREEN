import printColumn from './hc/printcolumn';
import { generateHC, inactiveArrow, activeAscArrow, activeDescArrow } from './hc/generatehc';

export default function generateHeaders(handleColumnClicks, positionText,
  cols, columnkey, columnlabel, columnSort, dataLength) {
  let columnHeader = [];
  let columnSortTypes = [];

  for (let index = 0; index < cols.length; index++) {
    var colData = cols[index];
    var columnName = colData[columnkey];
    var columnLabel = colData[columnlabel];
    var kclass = "";

    if ("className" in colData) {
      kclass = positionText + colData["className"];
    }

    if (columnSort.length == 0) {
      var cc = printColumn(colData, columnName,
        columnLabel, index, kclass, handleColumnClicks);
      var printCols = cc.printCols;
      if (cc.columnSortTypes)
        columnSortTypes.push(cc.columnSortTypes);
      if (cc.columnHeader)
        columnHeader.push(cc.columnHeader);
      if (!printCols) {
        continue;
      }

      if (columnSortTypes) {
        if (columnSortTypes.sortOn != 'disabled') {
          var inactiveArrowColor = "#C0C0C0";

          // if inactive color gray
          if (columnSortTypes.sortOn == 'inactive') {

            inactiveArrow(columnHeader, columnName, columnLabel,
              kclass, handleColumnClicks, index, inactiveArrowColor);
          }
        }
      } else {
        generateHC(columnHeader, columnName, columnLabel,
          kclass, handleColumnClicks, index);
      }
    } else if (dataLength > 1) {

      var cc = printColumn(colData, columnName,
        columnLabel, index, kclass, handleColumnClicks);
      var printCols = cc.printCols;

      if (cc.columnHeader)
        columnHeader.push(cc.columnHeader);
      if (!printCols) {
        continue;
      }

      if (columnSort[index].sortOn != 'disabled') {
        var activeArrowColor = "#9fbedf",
          inactiveArrowColor = "#C0C0C0";

        // if inactive color gray
        if (columnSort[index].sortOn == 'inactive') {

          inactiveArrow(columnHeader, columnName, columnLabel,
            kclass, handleColumnClicks, index, inactiveArrowColor);

        } else if (columnSort[index].sortOn == 'active') {

          if (columnSort[index].direction == 'desc') {
            activeAscArrow(columnHeader, columnLabel, columnName,
              kclass, handleColumnClicks, index, activeArrowColor);
          } else {
            activeDescArrow(columnHeader, columnLabel, columnName,
              kclass, handleColumnClicks, index, activeArrowColor);
          }
        }
      } else {
        generateHC(columnHeader, columnName, columnLabel,
          kclass, handleColumnClicks, index);
      }
    } else {
      generateHC(columnHeader, columnName, columnLabel,
        kclass, handleColumnClicks, index);
    }
  }
  // generate our header (th) cell components
  return {
    columnHeader,
    columnSortTypes
  }
}
