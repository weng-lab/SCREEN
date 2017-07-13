export default function customSort(data, columnSortType) {

  if (columnSortType.sortOn != 'disabled') {
    columnSortType.custumFunction(data, columnSortType);
  }

}
