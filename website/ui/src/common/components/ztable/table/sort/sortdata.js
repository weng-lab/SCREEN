export default function sortData(data, columnSortType, columnName) {

  if (columnSortType.sortOn != 'disabled') {
    // filters data
    // case when numeric
    if (!isNaN(data[0][columnName])) {
      if (columnSortType.direction == 'asc') {
        data.sort(function(a, b) {
          return a[columnName] - b[columnName];
        });
      } else {
        data.sort(function(a, b) {
          return b[columnName] - a[columnName];
        });
      }
    } else {
      // case when it is a string
      if (columnSortType.direction == 'asc') {
        data.sort(function(a, b) {
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
        });
      } else {
        data.sort(function(a, b) {
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
        });
      }
    }
  }
}
