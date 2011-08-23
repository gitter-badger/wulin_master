(function($) {
	function GridManager() {
		var gridElementPrefix = "#grid_";
		var gridElementSuffix = " .grid";
		var pagerElementSuffix = " .pager";
		var filterTriggerElementSuffix = " .grid-header .filter_toggle";
		var deleteElementSuffix = ' .grid-header .delete_button';
		var createElementSuffix = ' .grid-header .create_button';

		var grids = [];

		var options = {
			editable: true,
			enableAddRow: false,
			enableCellNavigation: true,
			asyncEditorLoading: false,
			autoEdit: false
		}

		function init() {
		}

		function getEditorForType(type){
			switch(type){
				case "string": 
				return TextCellEditor;
				case "text":
				return LongTextCellEditor;
				case "datetime":
				return DateCellEditor2;
				default:
				return TextCellEditor;
			}
		}

		function createNewGrid(name, path, columns) {
			gridElement = $(gridElementPrefix + name + gridElementSuffix);

			// append editor attribute to columns
			for(i in columns){
				if(columns[i].editable == true) {
					columns[i].editor = getEditorForType(columns[i].type);
					if(columns[i].type == "datetime") {
						columns[i].formatter = DateCellFormatter;
						columns[i].DateShowFormat = "yy-mm-dd";
					}
				}
			}

			loader = new Slick.Data.RemoteModel(path, columns);
			// So we know who is the owner
			// loader.connectionManager.  remoteModel = loader;

			grid = new Slick.Grid(gridElement, loader.data, columns, options);
			loader.setGrid(grid);

			// register grid events
			grid.onCellChange = function(currentRow, currentCell, item) {
				update_record(this.store, item);
			};
		
			// Delete action
			deleteElement = $(gridElementPrefix + name + deleteElementSuffix);
			deleteElement.click(function() {
				var _gird = getGrid(name).grid;
				var selectedIndexs = _gird.getSelectedRows();
				//console.log(selectedIndexs.length);
				if (selectedIndexs.length > 0) {
					var ids = selectedIndexs.map(function(n, i) { 
						var item = _gird.store.loader.data[n];
						return item['id']; 
						}).join();
					//console.log(ids)
					if (confirm("Are you sure to do this?"))
						deleteRecord(_gird, ids);	
					
				} else {
					alert("Please select one row first!");
				}
			});
			
			// Create action
			createButtonElement = $(gridElementPrefix + name + createElementSuffix);
			createButtonElement.click(function() {
				$( '#' + name + '-form' ).dialog({
					height: 300,
					width: 500,
					show: "blind",
				});
			});
			createFormElement = $('#new_' + name);
			createFormElement.submit(function() {
		 		// if (confirm("Are you sure to do this?")) {
				var _gird = getGrid(name).grid;
				createRecord(_gird, name);
		 		// }
			  return false;
			});
		
			// Set connection manager
			connectionManager = new ConnectionManager();


			pagerElement = $(gridElementPrefix + name + pagerElementSuffix);
			pager = new Slick.Controls.Pager(loader, grid, pagerElement);

			filterTriggerElement = $(gridElementPrefix + name + filterTriggerElementSuffix);
			filterPanel = new Slick.FilterPanel(grid, loader, filterTriggerElement);

			loader.setLoadingIndicator(createLoadingIndicator(gridElement));

			// Load the first page
			grid.onViewportChanged();

			var grid_object = {name: name, path: path, columns: columns, loader: loader, grid: grid, pager: pager, filterPanel: filterPanel};
			grid.store = grid_object;

			// delete old grid if exsisting
			for(i in grids){
				if(grid_object.name == grids[i].name){
					grids.splice(i, 1);
				}
			}
			grids.push(grid_object);
		}

		function update_record(store, item) {
			delete item.slick_index;
			// format item data like time, date
			format_data(item);
			// put ajax
			$.ajax({
				type: "POST",
				url: store.path + "/" + item.id + ".json",
				data: {_method: 'PUT', item: item, authenticity_token: window._token},
				success: function(msg) {
					if(msg.success == true) {

					} else {
						alert(msg.error_message);
						store.loader.reloadData();
					}
				}
			});
		}

		// Delete rows along ajax 
		function deleteRecord(grid, ids) {
			$.ajax({
				type: 'POST',
				url: grid.store.path + '/' + ids + '.json',
				data: {_method: 'DELETE', authenticity_token: window._token},
				success: function(msg) {
					if(msg.success == true) {
						grid.setSelectedRows([]);
						grid.store.loader.reloadData();
					} else {
						alert(msg.error_message);
					}
				}
			})
		}

		// Create row along ajax
		function createRecord(grid, name) {
			var createFormElement = $('#new_' + name);
			$.ajax({
     		type:'POST',
     		url: grid.store.path + '.json',
     		data: jQuery.param(jQuery(createFormElement).serializeArray()) + "&authenticity_token=" + window._token,
     		success: function(request) { 
					if (request.success == true) {
						resetForm(name);
						$( '#' + name + '-form' ).dialog( "close" );
						grid.store.loader.reloadData();
					} else {
						alert(request.error_message);
					}
				}
   		});
		}
		
		function resetForm(name) {
			var createFormElement = $('#new_' + name);
			createFormElement.not(':button, :submit, :reset, :hidden').val('').removeAttr('checked').removeAttr('selected');
		}

		function format_data(item) {

		}

		function createLoadingIndicator(gridElement) {
			var truncateThreshold = 35;
			var parent = gridElement.parent(".grid_container");
			var id = parent.attr("id");
			var title = parent.find(".grid-header h2").text().trim();
			if (title.length > truncateThreshold) {
				title = title.substring(0, truncateThreshold-2) + "..."
			}
			var indicators = $("#activity #indicators");

			// Remove init indicator if it exists.
			indicators.find("#init_menu").remove();

			var indicator = indicators.find(".loading_indicator#" + id);

			if (indicator.length == 0) {
				indicator = $(buildIndicatorHtml(id, title, "")).appendTo(indicators);
				// Init counter
				indicator.data("requestCount", 0);
			}

			return indicator;
		}

		function buildIndicatorHtml(id, title){
			return "<div class='loading_indicator' id='" + id + "'><div class='loading_text'>"+ title +"</div><div class='loading_bar' /><div class='loading_stats' /></div>"
		}

		function getGrid(name) {
			var theGrid = null;

			$.each(grids, function(index, gridHash) {
				if (gridHash.name==name)
				theGrid = gridHash;
			});

			return theGrid;
		}

		function resizeGrids() {
			$.each(grids, function(index, grid) {
				grid.grid.resizeCanvas();
			});
		}

		init();

		return {
			// properties
			"grids": grids,

			// methods
			"createNewGrid": createNewGrid,
			"getGrid": getGrid,
			"resizeGrids": resizeGrids,
			"buildIndicatorHtml": buildIndicatorHtml			
		};
	}
	$.extend(true, window, { GridManager: GridManager});
	})(jQuery);


	var gridManager = new GridManager();

	$(window).resize(function() { gridManager.resizeGrids(); });

