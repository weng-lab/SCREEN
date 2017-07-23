export default function customSort(data, columnSortType, columnName) {
  if (columnSortType.sortOn != 'disabled') {
    columnSortType.custumFunction(data, columnSortType);
  }
}
