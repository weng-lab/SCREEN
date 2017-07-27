import printColumn from './hc/printcolumn';
import { Glyphicon } from 'react-bootstrap';
import arrowDirectionality from './hc/generatehc';

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
      if (cc.columnHeader){
        columnHeader.push(cc.columnHeader);
      }
      if (!printCols) {
        continue;
      }

      if (columnSortTypes[index]) {
        if (columnSortTypes[index].sortOn != 'disabled') {
          var inactiveArrowColor = "#C0C0C0";

          // if inactive color gray
          if (columnSortTypes[index].sortOn == 'inactive') {


            var inactiveArrow = ( < font color = {
                inactiveArrowColor
              } size = "3" > < Glyphicon glyph = "sort" / > < /font>);

              arrowDirectionality(columnHeader, columnName, columnLabel,
                kclass, handleColumnClicks, index, inactiveArrowColor, inactiveArrow);

            }
          }
        } else {

          arrowDirectionality(columnHeader, columnName, columnLabel,
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

            var inactiveArrow = ( < font color = {
                inactiveArrowColor
              } size = "3" > < Glyphicon glyph = "sort" / > < /font>);

              arrowDirectionality(columnHeader, columnName, columnLabel,
                kclass, handleColumnClicks, index, inactiveArrowColor, inactiveArrow);

            }
            else if (columnSort[index].sortOn == 'active') {

              if (columnSort[index].direction == 'desc') {
                var activeArrow = ( < font color = {
                    activeArrowColor
                  } size = "3" > < Glyphicon glyph = "sort-by-attributes" / > < /font>);

                  arrowDirectionality(columnHeader, columnName, columnLabel,
                    kclass, handleColumnClicks, index, activeArrowColor, activeArrow);
                }
                else {
                  var activeArrow = ( < font color = {
                      activeArrowColor
                    } size = "3" > < Glyphicon glyph = "sort-by-attributes-alt" / > < /font>);

                    arrowDirectionality(columnHeader, columnName, columnLabel,
                      kclass, handleColumnClicks, index, activeArrowColor, activeArrow);
                  }
                }
              } else {
                arrowDirectionality(columnHeader, columnName, columnLabel,
                  kclass, handleColumnClicks, index);
              }
            } else {
              arrowDirectionality(columnHeader, columnName, columnLabel,
                kclass, handleColumnClicks, index);
            }
          }
          // generate our header (th) cell components
          return {
            columnHeader,
            columnSortTypes
          }
        }
