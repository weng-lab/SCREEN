
export default function packageColumnCells(handleRowClicks, rowClickedData, cols,
  columnkey, item, customSearch) {
  let cells = [];

  for (let i = 0; i < cols.length; i++) {
    var colData = cols[i];
    var columnIndex = i;
    let columnName = colData[columnkey];

    let search_item;

    if ("defaultContent" in colData) {
      search_item = colData.defaultContent;

if(rowClickedData != undefined) {
      var buttons = document.getElementsByClassName("btn btn-default btn-xs");

console.log(buttons);

    buttons[0].addEventListener("click", function(){
        document.getElementById("demo").innerHTML = "Hello World" + rowClickedData["info"].accession;
    });


}
    }
    if ("render" in colData) {
      search_item = colData.render(item[columnName]);
    }

    // if data cannot be outputted, returns blank
    if (typeof(search_item) == 'object') {
      cells.push( < td > {} < /td>);
      }

      // return data per row and column
      if (!isNaN(search_item)) {
        search_item = search_item.toLocaleString();
      }




      var search = [ < td > {
          search_item
        } < /td>]
        cells.push( < td onClick = {
            handleRowClicks.bind(this, columnIndex)
          } > {
            (search_item)
          } < /td>);
        }

        return cells;
      }
