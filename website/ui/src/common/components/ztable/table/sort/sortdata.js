export default function sortData(data, columnSortType) {

  if (columnSortType.sortOn != 'disabled') {
    // filters data
    // case when numeric
    if (!isNaN(data[0][columnSortType.column])) {
      if (columnSortType.direction == 'asc') {
        data.sort(function(a, b) {
          return a[columnSortType.column] - b[columnSortType.column];
        });
      } else {
        data.sort(function(a, b) {
          return b[columnSortType.column] - a[columnSortType.column];
        });
      }
    } else {


      // case when it is a string
      if (columnSortType.direction == 'asc') {
        data.sort(function(a, b) {
          let nameA = a[columnSortType.column].toLowerCase(); // ignore upper and lowercase
          let nameB = b[columnSortType.column].toLowerCase(); // ignore upper and lowercase
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
          let nameA = a[columnSortType.column].toLowerCase(); // ignore upper and lowercase
          let nameB = b[columnSortType.column].toLowerCase(); // ignore upper and lowercase
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
