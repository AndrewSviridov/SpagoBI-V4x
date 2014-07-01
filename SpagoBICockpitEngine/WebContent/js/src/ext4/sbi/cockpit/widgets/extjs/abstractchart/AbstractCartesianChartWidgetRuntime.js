/** SpagoBI, the Open Source Business Intelligence suite

 * Copyright (C) 2012 Engineering Ingegneria Informatica S.p.A. - SpagoBI Competency Center
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0, without the "Incompatible With Secondary Licenses" notice. 
 * If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/. **/


/*
 * NOTE: This class is meant to be extended and not directly istantiated
 */
Ext.ns("Sbi.cockpit.widgets.extjs.abstractchart");

Sbi.cockpit.widgets.extjs.abstractchart.AbstractCartesianChartWidgetRuntime = function(config) {	
	Sbi.trace("[AbstractCartesianChartWidgetRuntime.constructor]: IN");
	var defaultSettings = {
			
	};
	
	var settings = Sbi.getObjectSettings('Sbi.cockpit.widgets.extjs.abstractchart.AbstractCartesianChartWidgetRuntime', defaultSettings);
	var c = Ext.apply(settings, config || {});
	Ext.apply(this, c);
	
	var categories = [];
	categories.push(this.wconf.category);
	if(this.wconf.groupingVariable) categories.push(this.wconf.groupingVariable);
	
	this.aggregations = {
		measures: this.wconf.series,
		categories: categories
	};
	
	Sbi.cockpit.widgets.extjs.abstractchart.AbstractCartesianChartWidgetRuntime.superclass.constructor.call(this, c);
	
	this.boundStore();
	this.reload();
	this.addEvents('selection');
	
	Sbi.trace("[AbstractCartesianChartWidgetRuntime.constructor]: OUT");
};

Ext.extend(Sbi.cockpit.widgets.extjs.abstractchart.AbstractCartesianChartWidgetRuntime, Sbi.cockpit.widgets.extjs.abstractchart.AbstractChartWidgetRuntime, {
	
	// =================================================================================================================
	// PROPERTIES
	// =================================================================================================================
	// no props for the moment

	
    // =================================================================================================================
	// METHODS
	// =================================================================================================================
	
	// -----------------------------------------------------------------------------------------------------------------
    // public methods
	// -----------------------------------------------------------------------------------------------------------------
	
	getSeriesConfig: function() {
	    	
		var store = this.getStore();
	    	
	    var seriesFields = [];
		var seriesTitles = [];
		for(var i = 0; i < this.wconf.series.length; i++) {
			var id = this.wconf.series[i].id;
			seriesFields.push(store.fieldsMeta[id].name);
			seriesTitles.push(id);
		}
			
		var series = {
			fields: seriesFields,
			titles: seriesTitles,
			position: this.isHorizontallyOriented()? 'bottom' : 'left'
		};
			
		return series;
	}
	    
	, getCategoriesConfig: function() {
	    	
	    	var store = this.getStore();
	    	
	    	var categories = [];
			categories.push(this.wconf.category);
			if(this.wconf.groupingVariable) categories.push(this.wconf.groupingVariable);
			
			var categoriesFields = [];
			var categoriesTitles = [];
			for(var i = 0; i < categories.length; i++) {
				var id = categories[i].id;
				categoriesFields.push(store.fieldsMeta[id].name);
				categoriesTitles.push(id);
			}
			
			var categories = {
				fields: categoriesFields,
				titles: categoriesTitles, 
				position: this.isHorizontallyOriented()? 'left': 'bottom'
			};
			
			return categories;
	}
	
	, getOrientation: function() {
		return this.wconf? this.wconf.orientation: null;
	}

	, isVerticallyOriented: function() {
		return this.getOrientation() === 'vertical';
	}
	
	, isHorizontallyOriented: function() {
		return this.getOrientation() === 'horizontal';
	}
	
	, getBackground: function() {
		var background = {
		    gradient: {
			    id: 'backgroundGradient',
			    angle: 45,
			    stops: {
				    0: {color: '#ffffff'},
				    100: {color: '#eaf1f8'}
				}
			}
		};
		return background;
	}
	
	, getTooltip : function(storeItem, item){
		
		Sbi.trace("[AbstractCartesianChartWidgetRuntime.getTooltip]: IN");
		
		var tooltip;
		
		var itemMeta = this.getItemMeta(item);
		tooltip =  itemMeta.seriesFieldHeader + ': ' + itemMeta.seriesFieldValue 
					+ " <p> " + itemMeta.categoryFieldHeaders;
		
		Sbi.trace("[AbstractCartesianChartWidgetRuntime.getTooltip]: IN");
		
		return tooltip;
	}
	
	, getSeriesTips: function(series) {
		var thisPanel = this;
		
		var tips =  {
			trackMouse: true,
           	minWidth: 140,
           	maxWidth: 300,
           	width: 'auto',
           	minHeight: 28,
           	renderer: function(storeItem, item) {
           		var tooltipContent = thisPanel.getTooltip(storeItem, item);
           		this.setTitle(tooltipContent);
            }
        };
		
		return tips;
	}
	
	, getSeriesLabel: function(seriesConfig) {
		var label = {
            display: 'insideEnd',
            field: seriesConfig.titles.length == 1? seriesConfig.titles[0]: undefined,
            renderer: Ext.util.Format.numberRenderer('0'),
            orientation: 'horizontal',
            color: '#333',
            'text-anchor': 'middle'
		};
		return label;
	}

	// -----------------------------------------------------------------------------------------------------------------
    // private methods
	// -----------------------------------------------------------------------------------------------------------------
	, getFieldMetaByName: function(fieldName) {
		var store = this.getStore();
		var fieldsMeta = store.fieldsMeta;
    	for(var h in fieldsMeta) {
    		var fieldMeta = fieldsMeta[h];
    		if(fieldMeta.name == fieldName) {
    			return fieldMeta;
    		}
    	}
    	return null;
	}
	
	, getFieldHeaderByName: function(fieldName) {
		var fieldMeta = this.getFieldMetaByName(fieldName);
		Sbi.trace("[AbstractCartesianChartWidgetRuntime.getFieldHeaderByName]: " + Sbi.toSource(fieldMeta));
		return fieldMeta!=null?fieldMeta.header: null;
	}
	
	// -----------------------------------------------------------------------------------------------------------------
    // utility methods
	// -----------------------------------------------------------------------------------------------------------------
	
	, onItemMouseDown: function(item) {
		Sbi.trace("[AbstractCartesianChartWidgetRuntime.onItemMouseDown]: IN");
		var itemMeta = this.getItemMeta(item);
	    var selections = {};
		selections[itemMeta.categoryFieldHeaders[0]] = {values: []};
	    Ext.Array.include(selections[itemMeta.categoryFieldHeaders].values, itemMeta.categoryValues[0]);
	    this.fireEvent('selection', this, selections);
	    Sbi.trace("[AbstractCartesianChartWidgetRuntime.onItemMouseDown]: OUT");
	}
	
});