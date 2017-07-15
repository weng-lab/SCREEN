export default function searchItem(item,
  columnName, customSearch) {

  var customSearchCondition = false;
  let search_item;
  var columnIndex = 0;

  if (customSearch.length > 0) {
    for (let i = 0; i < customSearch.length; i++) {
      if (customSearch[i].column == columnName) {
        customSearchCondition = true;
        if (customSearch[i].value == undefined ||
          customSearch[i].value == null ||
          customSearch[i].value == '') {
          search_item = item[columnName];
        } else {
          search_item =
          item[columnName][customSearch[i].value];
        }
        columnIndex = i;
        break;
      }
      if (!customSearchCondition
        && i == customSearch.length - 1) {
        search_item = item[columnName];
      }
    }
  } else {
    search_item = item[columnName];
  }
  return {
    search_item,
    columnIndex
  };
}
