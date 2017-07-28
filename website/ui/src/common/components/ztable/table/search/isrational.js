export default function ifRationalIncreaseIndex(search_item,
  value, search_index, value_index) {
  // if search value and value in table between -1 and 1 eliminate leading zeros
  if (-1 < Number(search_item) &&
    Number(search_item) < 1 &&
    -1 < value && value < 1) {

    // case number is positive
    if (Number(search_item) > 0 && value > 0) {
      if (String(search_item).charAt(0) == 0)
        search_index++;

      if (value.charAt(0) == 0)
        value_index++;
    }

    // case number is negative
    if (Number(search_item) < 0 && value < 0) {
      value_index++;
      search_index++;

      if (String(search_item).charAt(1) == 0)
        search_index++;

      if (value.charAt(1) == 0)
        value_index++;
    }
  }
  // returns index at start of decimal without leading zeros
  return {
    search_index,
    value_index
  };
}
