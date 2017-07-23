export default function generateHeaders(handleColumnClicks,
  cols, columnkey, columnlabel, columnSort, sampleData) {
  let columnHeader = [];
  let columnSortTypes = [];

  for (let index = 0; index < cols.length; index++) {

    var colData = cols[index];
    var columnName = colData[columnkey];

    if (columnSort.length == 0) {
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

        if ("visible" in colData) {
          if (!colData["visible"])
            continue;
        }

        // arrow icons for sorting
        var activeArrowColor,
          inactiveArrowColor = "#BEBEBE";

        if (columnSort[index].sortOn != 'disabled') {
          // if inactive color gray
          if (columnSort[index].sortOn == 'inactive') {
            activeArrowColor = "#BEBEBE";
            // if active color blue
          } else if (columnSort[index].sortOn == 'active') {
            activeArrowColor = "#4682B4";
          }

          // case when sorting is asc
          if (columnSort[index].direction == 'desc') {
            columnHeader.push( <th key = { colData[columnkey] }
              className = { "text-center " + colData["className"] }
              onClick = { handleColumnClicks.bind(this, columnName,
                  index) }>
              <tr>
              <th className = { "text-center " + colData["className"] }>
              { colData[columnlabel] } </th>
              <th> <font size = "5" color = { activeArrowColor } > &#8595;</font>
                    <font color = { inactiveArrowColor }
              size = "2" > &#8593;</font>
                  </th>
                </tr>
              </th> );
    } else {
      // case when sorting is desc
      columnHeader.push( <th key = { colData[columnkey] }
              className = { "text-center " + colData["className"] }
              onClick = {
                handleColumnClicks.bind(this, columnName,
                  index) }>
              <tr>
              <th className = {
                "text-center " + colData["className"]}> {
                colData[columnlabel]} </th>
                <th> <font color = { inactiveArrowColor }
              size = "2" > &#8595;</font>
                    <font size= "5"
              color = {
                activeArrowColor
              } > &#8593;</font>
                  </th>
                </tr>
              </th>);
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
