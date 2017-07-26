import {Glyphicon} from 'react-bootstrap';

export default function generateHeaders(handleColumnClicks, positionText,
  cols, columnkey, columnlabel, columnSort, sampleData) {
  let columnHeader = [];
  let columnSortTypes = [];

  for (let index = 0; index < cols.length; index++) {
    var colData = cols[index];
    var columnName = colData[columnkey];
    var columnLabel = colData[columnlabel];
var kclass = "";

if("className" in colData){
kclass = positionText + colData["className"];

}


    if (columnSort.length == 0) {

      if(columnLabel == null || columnLabel == undefined) {
        columnSortTypes.push({
          direction: 'asc',
          sortOn: 'disabled'
        });
        continue;
  }


if(columnLabel == "") {
  columnSortTypes.push({
    direction: 'asc',
    sortOn: 'disabled'
  });

  columnHeader.push( < th key = { index }
    className = { kclass }
    onClick = { handleColumnClicks.bind(this,
      columnName, index) } > {  }
      </th>);
      continue;

}


      if ("visible" in colData) {
        if (!colData["visible"])
          columnSortTypes.push({
            direction: 'asc',
            sortOn: 'disabled'
          });
        continue;
      }

      if ("orderable" in colData) {
        if (!colData["orderable"]) {
          columnSortTypes.push({
            direction: 'asc',
            sortOn: 'disabled'
          });
        } else {
          columnSortTypes.push({
            direction: 'asc',
            sortOn: 'inactive'
          });
        }

      } else {
        if ("columnSort" in colData) {
          columnSortTypes.push(colData["columnSort"]);
        } else {
          columnSortTypes.push({
            direction: 'asc',
            sortOn: 'inactive'
          });
        }
      }

      columnHeader.push( < th key = { colData[columnkey] }
        className = { kclass }
        onClick = { handleColumnClicks.bind(this,
          columnName, index) } > { columnLabel }
          </th>);

      }
      else {

        if(columnLabel == null || columnLabel == undefined)  {
          continue;
    }


    if(columnLabel == "") {
      columnSortTypes.push({
        direction: 'asc',
        sortOn: 'disabled'
      });

      columnHeader.push( < th key = { index }
        className = { kclass }
        onClick = { handleColumnClicks.bind(this,
          columnName, index) } > {  }
          </th>);
          continue;

    }

        if ("visible" in colData) {
          if (!colData["visible"])
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
              size = "3" ><p>{"     "}</p><Glyphicon glyph="sort" /></font>
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
