# Customization of SlickGrid

## Index

1. [Customization of `slick.grid.js`](#customization-of-slickgridjs)
  - [Design Pattern & Preparation in `SlickGrid()`](#design-pattern-preparation-in-slickgrid)
  - [Customization of `init()`](#customization-of-init)
  - [Customization of `finishInitialization()`](#customization-of-finishinitialization)
  - [Customization of `handleDblClick()`](#customization-of-handledblclick)
  - [Customization of `gotoCell()`](#customization-of-gotocell)
  - [Customization of `setActiveCellInternal()`](#customization-of-setactivecellinternal)
  - [Customization of `commitCurrentEdit()`](#customization-of-commitcurrentedit)
1. [Customization of `slick.columnpicker.js`](#customization-of-slickcolumnpickerjs)
  - [Design Pattern & Preparation in `SlickColumnPicker()`](#design-pattern-preparation-in-slickcolumnpicker)
  - [Customization of `init()`](#customization-of-init-1)
  - [Customization of `handleHeaderContextMenu()`](#customization-of-handleheadercontextmenu)
  - [Customization of `updateColumn()`](#customization-of-updatecolumn)
  - [Customization of `destroy()`](#customization-of-destroy)
  - [Add `onColumnsPick` event and related processing](#add-oncolumnspick-event-and-related-processing)
1. [Customization of `slick.rowselectionmodel.js`](#customization-of-slickrowselectionmodeljs)
  - [Design Pattern & Preparation in `Slick.RowSelectionModel()`](#design-pattern-preparation-in-slickrowselectionmodel)
  - [Customization of `setSelectedRanges()`](#customization-of-setselectedranges)
  - [Customization of `handleClick()`](#customization-of-handleclick)

## Customization of `slick.grid.js`

### Design Pattern & Preparation in `SlickGrid()`

##### Create `WulinMasterGrid()` to inherit `SlickGrid()`

`master/grid.js`
``` js
(function($) {
  $.extend(true, window, {
    WulinMaster: {
      Grid: WulinMasterGrid
    }
  });

  function WulinMasterGrid(container, data, columns, options) {
    Slick.Grid.call(this, container, data, columns, options);

    var _self = this;

    // Customization ...
  }

  WulinMasterGrid.prototype = Object.create(Slick.Grid.prototype);
})(jQuery);
```

##### Add new `getter`/`setter`s to `SlickGrid()`

`jquery_plugins/SlickGrid/slick.grid.js`
``` js
function SlickGrid(container, data, columns, options) {
  ...

  //////////////////////////////////////////////////////////////////////////////////////////////
  // Ekohe Add: Getters/Setters

  function getRows() {
    return rowsCache;
  }

  function setColumnsById(c){
    columnsById = c;
  }
  ...
}
```

##### Expose new APIs in `SlickGrid()`

`jquery_plugins/SlickGrid/slick.grid.js`
``` js
function SlickGrid(container, data, columns, options) {
  ...

  $.extend(this, {
    ...

    // Ekohe Add: New APIs
    "getRows": getRows,
    "getRowAt": getRowAt,
    "getCanvas": getCanvas,
    "getSerializedEditorValue": getSerializedEditorValue,
    "setColumnsById": setColumnsById,
    "setEditController": setEditController,
    "finishInitialization": finishInitialization,
    "handleDblClick": handleDblClick,
    "makeActiveCellNormal": makeActiveCellNormal,
    "trigger": trigger
  });

  ...
}
```

### Customization of `init()`

`jquery_plugins/SlickGrid/slick.grid.js`
``` js
function SlickGrid(container, data, columns, options) {
  ...
  function init() {
    ...

    // Ekohe Delete: Customized finishInitialization() will be called in WulinMasterGrid()
    // if (!options.explicitInitialization) {
    //   finishInitialization();
    // }
  }

  $.extend(this, {
    ...
    // Ekohe Modify: Expose init() to WulinMasterGrid
    // "init": finishInitialization,
    "init": init,
    ...
  }

  // Ekohe Delete: Will be called in WulinMasterGrid()
  // init();
  }
}
```

`master/grid.js`
``` js
function WulinMasterGrid(container, data, columns, options) {
  ...

  // Ekohe Add: Customization of init()
  function wulinInit() {
    // Call SlickGrid's init()
    _self.init();

    // Use customized commitCurrentEdit() for editController
    _self.setEditController({
      "commitCurrentEdit": wulinCommitCurrentEdit,
      "cancelCurrentEdit": _self.getEditController().cancelCurrentEdit
    });

    // Call customized finishInitialization()
    if (!_self.getOptions().explicitInitialization) {
      wulinFinishInitialization();
    }
  };

  ...
  // Ekohe Add: Call customized initialization
  wulinInit();
}
```

### Customization of `finishInitialization()`

`jquery_plugins/SlickGrid/slick.grid.js`
``` js
function SlickGrid(container, data, columns, options) {
  ...

  function finishInitialization() {
    // No change.
    // Will be called by wulinFinishInitialization()
  }

  ...
}
```

`master/grid.js`
``` js
function WulinMasterGrid(container, data, columns, options) {
  ...

  // Ekohe Add: Customization of finishInitialization()
  function wulinFinishInitialization() {
    // set columnsById to {} for visibility setting feature
    _self.setColumnsById({});
    // Remove invisible columns
    removeInvisibleColumns();
    // Call SlickGrid's finishInitialization()
    _self.finishInitialization()
    // Use customized handler for `dblclick` event
    _self.getCanvas().on("dblclick", wulinHandleDblClick)
  }

  ...
}
```

### Customization of `handleDblClick()`

`jquery_plugins/SlickGrid/slick.grid.js`
``` js
function SlickGrid(container, data, columns, options) {
  ...

  //////////////////////////////////////////////////////////////////////////////////////////////
  // Ekohe Modify
  //   1. Move the call of gotoCell() to WulinMasterGrid() for changing of entry condition

  function handleDblClick(e) {
    ...

    // Ekohe Delete: Move to WulinMasterGrid() for changing of entry condition
    // if (options.editable) {
    //   gotoCell(cell.row, cell.cell, true);
    // }
  }

  ...
}
```

`master/grid.js`
``` js
function WulinMasterGrid(container, data, columns, options) {
  ...

  // Ekohe Add: Customization of handleDblClick()
  //   1. Only work for editable column
  function wulinHandleDblClick(e) {
    var columns = _self.getColumns();
    var cell = _self.getActiveCell();

    // Call SlickGrids handleDblClick()
    _self.handleDblClick(e);

    // Ekohe Modify: Only work for editable column
    if(isColumnEditable(columns[cell.cell])) {
      wulinGotoCell(cell.row, cell.cell, true);
    }
  }

  ...
}
```

### Customization of `gotoCell()`

`jquery_plugins/SlickGrid/slick.grid.js`
``` js
function SlickGrid(container, data, columns, options) {
  ...

  function gotoCell() {
    // No change.
    // Will be called by wulinGotoCell()
  }

  ...
}
```

`master/grid.js`
``` js
function WulinMasterGrid(container, data, columns, options) {
  ...

  // Ekohe Add: Customization of gotoCell()
  //   1. Pass new param `column_editable` to judge if set the cell active or not
  function wulinGotoCell(row, cell, forceEdit) {
    var newCell = _self.getCellNode(row, cell);
    var columns = _self.getColumns();

    // Call SlickGrid's handleDblClick()
    _self.gotoCell(row, cell, forceEdit);

    // Ekohe Modify: Pass new param `column_editable` to judge if set the cell active or not
    _self.setActiveCellInternal(
      newCell,
      (forceEdit || (row === getDataLength()) || options.autoEdit),
      isColumnEditable(columns[cell])
    )
  }

  ...
}
```

### Customization of `setActiveCellInternal()`

`jquery_plugins/SlickGrid/slick.grid.js`
``` js
function SlickGrid(container, data, columns, options) {
  ...

  //////////////////////////////////////////////////////////////////////////////////////////////
  // Ekohe Modify
  //   1. Use new parameter `column_editable` to judge if make active or not

  function setActiveCellInternal(newCell, opt_editMode, column_editable) {
    ...
    if (activeCellNode != null) {
      ...
      // Ekohe Add: Use new parameter `column_editable` to judge if make active or not
      if ((column_editable || options.editable) && opt_editMode && isCellPotentiallyEditable(activeRow, activeCell)) {
        ...
      }
      ...
    }
    ...
  }

  ...
}
```

### Customization of `commitCurrentEdit()`

`jquery_plugins/SlickGrid/slick.grid.js`
``` js
function SlickGrid(container, data, columns, options) {
  ...

  function commitCurrentEdit() {
    // No change.
    // Not be used in wulin_master
  }

  ...
}
```

`master/grid.js`
``` js
function WulinMasterGrid(container, data, columns, options) {
  ...

  // Ekohe Add: Customization of commitCurrentEdit()
  //   1. Use current cell instead of the whole row for submit in onCellChange trigger
  function wulinCommitCurrentEdit() {

    // Ekohe Add: Get properties from SlickGrid
    var activeCell = _self.getActiveCell().cell;
    var activeRow = _self.getActiveCell().row;
    var currentEditor = _self.getCellEditor();
    var serializedEditorValue = _self.getSerializedEditorValue()
    var options = _self.getOptions();
    var activeCellNode = _self.getActiveCellNode();
    var submitItem = {};

    var item = _self.getDataItem(activeRow);
    var column = _self.getColumns()[activeCell];

    if (currentEditor) {
      if (currentEditor.isValueChanged()) {
        var validationResults = currentEditor.validate();

        if (validationResults.valid) {
          if (activeRow < _self.getDataLength()) {
            var editCommand = {
              row: activeRow,
              cell: activeCell,
              editor: currentEditor,
              serializedValue: currentEditor.serializeValue(),
              prevSerializedValue: serializedEditorValue,
              execute: function () {
                currentEditor.applyValue(item, currentEditor.serializeValue());
                _self.updateRow(activeRow);
                // Ekohe Delete: Original SlickGrid Logic: Submit item for the whole row
                // trigger(self.onCellChange, {
                //   row: activeRow,
                //   cell: activeCell,
                //   item: item,
                //   grid: self
                // });
              },
              undo: function () {
                currentEditor.applyValue(item, serializedEditorValue);
                _self.updateRow(activeRow);
                // Ekohe Delete: Original SlickGrid Logic: Submit item for the whole row
                // trigger(self.onCellChange, {
                //   row: activeRow,
                //   cell: activeCell,
                //   item: item,
                //   grid: self
                // });
              }
            };

            ...

            // Ekohe Add: Use item info of current cell for submit in onCellChange trigger
            submitItem['id'] = item.id;
            submitItem[column.field] = item[column.field];
            _self.trigger(_self.onCellChange, {
              row: activeRow,
              cell: activeCell,
              item: submitItem,
              editCommand: editCommand
            });

            ...
          }
          ...
        }
      }
      ...
    }
    ...
  }

  ...
}
```

## Customization of `slick.rowselectionmodel.js`

### Design Pattern & Preparation in `Slick.RowSelectionModel()`

##### Create `WulinMaster.RowSelectionModel` to inherit `Slick.RowSelectionModel`

`master/rowselectionmodel.js`
``` js
(function($) {
  $.extend(true, window, {
    WulinMaster: {
      RowSelectionModel: RowSelectionModel
    }
  });

  function RowSelectionModel(options) {
    Slick.RowSelectionModel.call(this, options);

    var _self = this;

    // Customization ...
  }

  RowSelectionModel.prototype = Object.create(Slick.RowSelectionModel.prototype);
})(jQuery);
```

### Customization of `setSelectedRanges()`

`jquery_plugins/SlickGrid/plugins/slick.rowselectionmodel.js`
``` js
function RowSelectionModel(options) {
  ...
  //////////////////////////////////////////////////////////////////////////////////////////////
  // Ekohe Modify
  //   1. Delete entry check of empty selection for initail toolbar status check

  function setSelectedRanges(ranges) {
    // Ekohe Delete: Also used for empty selection for initial Toolbar status
    // simle check for: empty selection didn't change, prevent firing onSelectedRangesChanged
    // if ((!_ranges || _ranges.length === 0) && (!ranges || ranges.length === 0)) { return; }
    ...
  }

  ...
  }
}
```

### Customization of `handleClick()`

`jquery_plugins/SlickGrid/plugins/slick.rowselectionmodel.js`
``` js
function RowSelectionModel(options) {
  ...
  //////////////////////////////////////////////////////////////////////////////////////////////
  // Ekohe Modify
  //   1. Add data as parameter
  //   2. Add processing for single selection

  // function handleClick(e) {
  function handleClick(e, data) {
    ...
    // Ekohe Delete: Support single selection
    // if (!_grid.getOptions().multiSelect || (
    //     !e.ctrlKey && !e.shiftKey && !e.metaKey)) {
    //   return false;
    // }
    ...
    // Ekohe Add: Processing for single selection
    if (!e.ctrlKey && !e.shiftKey && !e.metaKey) {
      handleActiveCellChange(e, data);
      return false;
    } else if (_grid.getOptions().multiSelect) {
      ...
    }
    ...
  }

  ...
  }
}
```
