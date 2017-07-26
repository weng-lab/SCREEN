export default function sortData(data, columnSortType, columnName) {

  if (columnSortType.sortOn != 'disabled') {
    let testCondition = false;
    if ("value" in columnSortType) {
      if (columnSortType["value"]) {
        testCondition = !isNaN(data[0][columnName][columnSortType["value"]]);
      }
    } else {
      testCondition = !isNaN(data[0][columnName]);
    }
    // filters data
    // case when numeric
    if (testCondition) {

      if ("value" in columnSortType) {
        if (columnSortType["value"]) {
          if (columnSortType.direction == 'asc') {
            data.sort(function(a, b) {
                if(a[columnName][columnSortType["value"]] && b[columnName][columnSortType["value"]])
              return a[columnName][columnSortType["value"]] - b[columnName][columnSortType["value"]];
            });
          } else {
            data.sort(function(a, b) {
                if(a[columnName][columnSortType["value"]] && b[columnName][columnSortType["value"]])
              return b[columnName][columnSortType["value"]] - a[columnName][columnSortType["value"]];
            });
          }
        }
      } else {
        if (columnSortType.direction == 'asc') {
          data.sort(function(a, b) {
          if(a[columnName] && b[columnName])
            return a[columnName] - b[columnName];


          });
        } else {
          data.sort(function(a, b) {
              if(a[columnName] && b[columnName])
            return b[columnName] - a[columnName];
          });
        }
      }
    } else {
      // case when it is a string
      if ("value" in columnSortType) {
        if (columnSortType["value"]) {

          if (columnSortType.direction == 'asc') {
            data.sort(function(a, b) {


                        if(a[columnName][columnSortType["value"]] && b[columnName][columnSortType["value"]]) {
              let nameA =
              a[columnName][columnSortType["value"]].toLowerCase(); // ignore upper and lowercase
              let nameB =
              b[columnName][columnSortType["value"]].toLowerCase(); // ignore upper and lowercase
              if (nameA < nameB) {
                return -1;
              }
              if (nameA > nameB) {
                return 1;
              }
              // names must be equal
              return 0;


            }
            });
          } else {
            data.sort(function(a, b) {

                          if(a[columnName][columnSortType["value"]] && b[columnName][columnSortType["value"]]) {
              let nameA =
              a[columnName][columnSortType["value"]].toLowerCase(); // ignore upper and lowercase
              let nameB =
              b[columnName][columnSortType["value"]].toLowerCase(); // ignore upper and lowercase
              if (nameA > nameB) {
                return -1;
              }
              if (nameA < nameB) {
                return 1;
              }
              // names must be equal
              return 0;


            }
            });
          }
        }
      } else {
        if (columnSortType.direction == 'asc') {
          data.sort(function(a, b) {
            if(a[columnName] && b[columnName]) {
            let nameA = a[columnName].toLowerCase(); // ignore upper and lowercase
            let nameB = b[columnName].toLowerCase(); // ignore upper and lowercase
            if (nameA < nameB) {
              return -1;
            }
            if (nameA > nameB) {
              return 1;
            }
            // names must be equal
            return 0;
}

          }

        );
        } else {
          data.sort(function(a, b) {

                      if(a[columnName] && b[columnName]) {
            let nameA = a[columnName].toLowerCase(); // ignore upper and lowercase
            let nameB = b[columnName].toLowerCase(); // ignore upper and lowercase
            if (nameA > nameB) {
              return -1;
            }
            if (nameA < nameB) {
              return 1;
            }
            // names must be equal
            return 0;
}

          });
        }
      }
    }
  }
}
