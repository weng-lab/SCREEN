export default function searchItem(item, columnName, customSearch) {
  var customSearchCondition = false;

  let search_item;

  var columnIndex = 0;

  var i = 0;

  if (customSearch.length > 0) {
    do {

      if (customSearch[i].column == columnName) {
        customSearchCondition = true;

        if (customSearch[i].filterSearch == 'disabled') {
          columnIndex = i;
        }

        if (customSearch[i].value == undefined
          || customSearch[i].value == null
          || customSearch[i].value == '') {
          search_item = item[columnName];
        } else {
          search_item = item[columnName][customSearch[i].value];
        }
        break;
      }

      if (!customSearchCondition && i == customSearch.length - 1) {
        search_item = item[columnName];
      }

      i++;
    } while (i < customSearch.length);

  } else {
    search_item = item[columnName];
  }

  return {
    search_item: search_item,
    columnIndex: columnIndex
  };

}
