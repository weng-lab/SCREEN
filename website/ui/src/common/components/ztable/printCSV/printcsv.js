export function printCSVHeader(colData, columnlabel) {
  if (typeof colData[columnlabel] == 'object') {
    if ('customSave' in colData) {
      if ('headerValue' in colData['customSave'] &&
        colData['customSave']['headerValue']) {
        var headerLabel = colData['customSave']['headerValue'];
      } else {
        var headerLabel = colData[columnlabel];
      }
    } else if ('value' in colData && colData['value']) {
      var headerLabel = colData['value'];
    } else {
      var headerLabel = colData[columnlabel];
    }
  } else {
    var headerLabel = colData[columnlabel];
  }
  return headerLabel;
}

export function printCSVRowData(colData, columnkey, item) {
  var dataContent = '';

  if ('customSave' in colData && 'render' in colData['customSave']) {
    dataContent = colData['customSave'].render(item[colData[columnkey]]);
  } else if ('render' in colData) {
    dataContent = colData.render(item[colData[columnkey]]);

    if (typeof dataContent == 'object' || typeof dataContent == 'undefined' || typeof dataContent == null)
      if ('value' in colData) {
        if (item[colData[columnkey]][colData['value']]) {
          dataContent = item[colData[columnkey]][colData['value']];
        }
      } else {
        dataContent = item[colData[columnkey]];
      }
  } else if ('value' in colData) {
    if (item[colData[columnkey]][colData['value']]) {
      dataContent = item[colData[columnkey]][colData['value']];
    }
  } else {
    dataContent = item[colData[columnkey]];
  }
  return dataContent;
}
