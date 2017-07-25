export default function customSort(data, columnSortType, columnName) {
  if (columnSortType.sortOn != 'disabled') {
    columnSortType.customSort(data, columnSortType, columnName);
  }
}
