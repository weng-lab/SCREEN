import { Glyphicon } from 'react-bootstrap';
import React from 'react'

export default function generateHeaders(handleColumnClicks, positionText,
  cols, columnkey, columnlabel, columnSort) {
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

      columnHeader.push( < th key = {
          colData[columnkey]
        }
        className = {
          kclass
        }
        onClick = {
          handleColumnClicks.bind(this,
            columnName, index)
        } > {
          columnLabel
        } <
        /th>);

      }
      else {

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
            columnHeader.push( <th key = { colData[columnkey] }
              className = { kclass }
              onClick = { handleColumnClicks.bind(this, columnName,
                  index) }>
              <tr>
              <th>
              { columnLabel } </th>
              <th>  <font color = { inactiveArrowColor }
              size = "3" ><Glyphicon glyph="sort" /></font>
                  </th>
                </tr>
              </th> );

          } else if (columnSort[index].sortOn == 'active') {

          if (columnSort[index].direction == 'desc') {
            columnHeader.push( <th key = { colData[columnkey] }
              className = { kclass }
              onClick = { handleColumnClicks.bind(this, columnName,
                  index) }>
              <tr>
              <th>
              { columnLabel } </th>
              <th><font size = "3" color = { activeArrowColor } ><Glyphicon glyph="sort-by-attributes" /></font>
                  </th>
                </tr>
              </th> );
    } else {

        columnHeader.push( <th key = { colData[columnkey] }
          className = { kclass }
          onClick = { handleColumnClicks.bind(this, columnName,
              index) }>
          <tr>
          <th>
          { columnLabel } </th>
          <th><font size = "3" color = { activeArrowColor } ><Glyphicon glyph="sort-by-attributes-alt" /></font>
              </th>
            </tr>
          </th> );
    }
  }
  } else {
    columnHeader.push( <th key = { colData[columnkey] }
              className = { kclass }
              onClick = { handleColumnClicks.bind(this, columnName, index)
              }> { columnLabel } </th>);
            }
          }
        }
        // generate our header (th) cell components
        return {
          columnHeader,
          columnSortTypes
        }
      }

      function printColumn(colData, columnName,
        columnLabel, index, kclass, handleColumnClicks) {

        var printCols = true;

        if (columnLabel == null || columnLabel == undefined) {
          return {
            printCols: false,
            columnSortTypes: {
              direction: 'asc',
              sortOn: 'disabled'
            },
            columnHeader: undefined
          };
        }
        if (columnLabel == "") {
          return {
            printCols: false,
            columnSortTypes: {
              direction: 'asc',
              sortOn: 'disabled'
            },

            columnHeader: ( < th key = {
                index
              }
              className = {
                kclass
              }
              onClick = {
                handleColumnClicks.bind(this,
                  columnName, index)
              } > {} < /th>)
            }
          }
          if ("visible" in colData) {
            if (!colData["visible"]) {
              return {
                printCols: false,
                columnSortTypes: {
                  direction: 'asc',
                  sortOn: 'disabled'
                },
                columnHeader: undefined
              }
            }
          }
          if ("orderable" in colData) {
            if (!colData["orderable"]) {
              return {
                printCols: true,
                columnSortTypes: {
                  direction: 'asc',
                  sortOn: 'disabled'
                },
                columnHeader: undefined
              };
            } else {
              return {
                printCols: true,
                columnSortTypes: {
                  direction: 'asc',
                  sortOn: 'inactive'
                },
                columnHeader: undefined
              };
            }
          } else {
            if ("columnSort" in colData) {
              return {
                printCols: true,
                columnSortTypes: colData["columnSort"],
                columnHeader: undefined
              };
            } else {
              return {
                printCols: true,
                columnSortTypes: {
                  direction: 'asc',
                  sortOn: 'inactive'
                },
                columnHeader: undefined
              };
            }
          }
          return {
            printCols: true,
            columnSortTypes: undefined,
            columnHeader: undefined

          }
        }
