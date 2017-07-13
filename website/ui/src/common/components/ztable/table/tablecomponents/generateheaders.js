export default function generateHeaders(handleClick, cols, columnkey, columnlabel, columnSort) {


      // generate our header (th) cell components

      return cols.map(function(colData, index) {

        if (columnSort.length>0){
          for (let i = 0; i < columnSort.length; i ++) {




            if(columnSort[i].column == colData[columnkey] && columnSort[i].sortOn != 'disabled') {
              if(columnSort[i].direction == 'asc') {
                return <th key = { colData[columnkey] }
                        onClick={handleClick.bind(this, colData[columnkey])}>
                          <tr>
                            <th>{ colData[columnlabel] }</th>
                            <th><font size="5" color="#1589FF">&#8593;</font>
                              <font color="gray" size="2">&#8595;</font>
                            </th>
                          </tr>
                        </th>;
              } else {
                return <th key = { colData[columnkey] }
                          onClick={handleClick.bind(this, colData[columnkey])}>
                          <tr>
                            <th>{ colData[columnlabel] }</th>
                              <th><font color="gray" size="2">&#8593;</font>
                              <font size="5" color="#1589FF">&#8595;</font>
                            </th>
                          </tr>
                        </th>;
              }
            }
          }


        }
        return <th key = { colData[columnkey] }
                  onClick={handleClick.bind(this,
                    colData[columnkey])}>{ colData[columnlabel] }
                  </th>;
      });
    }
