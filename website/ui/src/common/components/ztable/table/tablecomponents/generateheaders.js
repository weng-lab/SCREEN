import {Glyphicon} from 'react-bootstrap';

export default function generateHeaders(handleColumnClicks,
  cols, columnkey, columnlabel, columnSort, sampleData) {
  let columnHeader = [];
  let columnSortTypes = [];

  for (let index = 0; index < cols.length; index++) {
    var colData = cols[index];
    var columnName = colData[columnkey];

    if (columnSort.length == 0) {

      if(!colData[columnlabel]) {
        columnSortTypes.push({
          direction: 'asc',
          sortOn: 'disabled'
        });
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
        className = { "text-center " + colData["className"] }
        onClick = { handleColumnClicks.bind(this,
          columnName, index) } > { colData[columnlabel] }
          </th>);

      }
      else {

        if(!colData[columnlabel]) {
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
              className = { "text-center " + colData["className"] }
              onClick = { handleColumnClicks.bind(this, columnName,
                  index) }>
              <tr>
              <th className = { "text-center " + colData["className"] }>
              { colData[columnlabel] } </th>
              <th>  <font color = { inactiveArrowColor }
              size = "3" ><p>{"     "}</p><Glyphicon glyph="sort" /></font>
                  </th>
                </tr>
              </th> );

          } else if (columnSort[index].sortOn == 'active') {

          if (columnSort[index].direction == 'desc') {
            columnHeader.push( <th key = { colData[columnkey] }
              className = { "text-center " + colData["className"] }
              onClick = { handleColumnClicks.bind(this, columnName,
                  index) }>
              <tr>
              <th className = { "text-center " + colData["className"] }>
              { colData[columnlabel] } </th>
              <th><font size = "3" color = { activeArrowColor } ><p>{"     "}</p><Glyphicon glyph="sort-by-attributes" /></font>
                  </th>
                </tr>
              </th> );
    } else {

        columnHeader.push( <th key = { colData[columnkey] }
          className = { "text-center " + colData["className"] }
          onClick = { handleColumnClicks.bind(this, columnName,
              index) }>
          <tr>
          <th className = { "text-center " + colData["className"] }>
          { colData[columnlabel] } </th>
          <th><font size = "3" color = { activeArrowColor } ><p>{"     "}</p><Glyphicon glyph="sort-by-attributes-alt" /></font>
              </th>
            </tr>
          </th> );


    }



  }
  } else {
    columnHeader.push( <th key = { colData[columnkey] }
              className = { "text-center " + colData["className"] }
              onClick = { handleColumnClicks.bind(this, columnName, index)
              }> { colData[columnlabel] } </th>);
            }
          }
        }

        // generate our header (th) cell components
        return {
          columnHeader,
          columnSortTypes
        }
      }
