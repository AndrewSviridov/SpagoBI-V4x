/** SpagoBI, the Open Source Business Intelligence suite

 * Copyright (C) 2012 Engineering Ingegneria Informatica S.p.A. - SpagoBI Competency Center
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0, without the "Incompatible With Secondary Licenses" notice. 
 * If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/. **/


/*
 * NOTE: This class is meant to be extended and not directly istantiated
 */
Ext.ns("Sbi.cockpit.widgets.extjs.abstractchart");

Sbi.cockpit.widgets.extjs.abstractchart.AbstractChartWidget = function(config) {	
	Sbi.trace("[AbstractChartWidget.constructor]: IN");
	
	var defaultSettings = {
		layout: 'fit'	
	};

	var settings = Sbi.getObjectSettings('Sbi.cockpit.widgets.extjs.abstractchart.AbstractChartWidget', defaultSettings);
	var c = Ext.apply(settings, config || {});
	Ext.apply(this, c);

	this.chartDivId = Ext.id();
	
	this.init();
	
	this.items = this.chart || this.msgPanel;
	
//	c = Ext.apply(c, {
//		html : '<div id="' + this.chartDivId + '" style="width: 100%; height: 100%;"></div>'
//		, autoScroll: true
//	});
	
	Sbi.cockpit.widgets.extjs.abstractchart.AbstractChartWidget.superclass.constructor.call(this, c);

	Sbi.trace("[AbstractChartWidget.constructor]: OUT");
};

Ext.extend(Sbi.cockpit.widgets.extjs.abstractchart.AbstractChartWidget, Sbi.cockpit.core.WidgetRuntime, {
	
	// =================================================================================================================
	// PROPERTIES
	// =================================================================================================================
	  chartDivId : null
	, chartPanel : null
	
	/**
	 * It's the content panel used when the chart is not yet available. By default it's empty. If the config property
	 * msg is passed in then show the msg text. As soon as the chart became available it is removed and destroyed.
	 */
	, msgPanel: null
	
    // =================================================================================================================
	// METHODS
	// =================================================================================================================
	
    // -----------------------------------------------------------------------------------------------------------------
    // public methods
	// -----------------------------------------------------------------------------------------------------------------
	
	
	, boundStore: function() {
		Sbi.cockpit.widgets.table.TableWidget.superclass.boundStore.call(this);
	}

	, setContentPanel: function(panel) {
		this.items.each( function(item) {
			this.items.remove(item);
	        item.destroy();           
	    }, this);  
		this.msgContent = null;
        this.add(panel);
        this.doLayout();
	}

	
	
	/**
	 * Loads the data for the chart. Call the action which loads the crosstab 
	 * (the crosstab is the object that contains the data for the chart)
	 * 
	 * @param dataConfig the field for the chart.The syntax is {rows, measures}.
	 *  For example 
	 *  {'rows':[{
	 *  	'id':'it.eng.spagobi.SalesFact1998:product(product_id):productClass(product_class_id):productFamily'
	 *  	, 'nature':'attribute'
	 *  	, 'alias':'Product Family'
	 *  	, 'iconCls':'attribute'}
	 *  	]
	 *  , 'measures':[{
	 *  	'id':'it.eng.spagobi.SalesFact1998:storeCost'
	 *  	,'nature':'measure'
	 *  	,'alias':'Store Cost'
	 *  	,'funct':'SUM'
	 *  	,'iconCls':'measure'
	 *  }, {
	 *  	'id':'it.eng.spagobi.SalesFact1998:unitSales'
	 *  	,'nature':'measure'
	 *  	,'alias':'Unit Sales'
	 *  	,'funct':'SUM'
	 *  	,'iconCls':'measure'
	 *  }]}
	 */
	, loadChartData: function(dataConfig, filters){
		
		if ( !this.wconf.hiddenContent ) {
			
			var encodedParams = Ext.JSON.encode({
				'rows': dataConfig.columns,
				'columns': dataConfig.rows,
				'measures': dataConfig.measures,
				'config': {'measureson':'rows'}
			});
			
			var requestParameters = {
				'crosstabDefinition': encodedParams	
			};
			
			if ( filters != null ) {
				requestParameters.FILTERS = Ext.encode(filters);
			}
			
			Ext.Ajax.request({
				url: Sbi.config.serviceReg.getServiceUrl('loadChartDataSetStore', {
					pathParams: {datasetLabel: this.storeId}
				}),
		        params: requestParameters,
		        success : function(response, opts) {
		        	
		        	this.dataContainerObject = Ext.JSON.decode( response.responseText );
		        	if (this.isEmpty()) {
		    			Ext.Msg.show({
		 				   title: LN('sbi.qbe.messagewin.info.title'),
		 				   msg: LN('sbi.qbe.datastorepanel.grid.emptywarningmsg'),
		 				   buttons: Ext.Msg.OK,
		 				   icon: Ext.MessageBox.INFO
		    			});
		    			this.fireEvent('contentloaded');
		        	} else {
			        	if(this.rendered){
			        		this.redraw();
			        		this.fireEvent('contentloaded');
			        	}else{
			        		this.on('afterrender',function(){this.redraw();this.fireEvent('contentloaded');}, this);
			        	}
			        	
		        	}
		        	
		        },
		        scope: this,
				failure: function(response, options) {
					this.fireEvent('contentloaded');
					Sbi.exception.ExceptionHandler.handleFailure(response, options);
				}      
			});
		}else {
        	if(this.rendered){
        		this.fireEvent('contentloaded');
        	}else{
        		this.on('afterrender',function(){this.fireEvent('contentloaded');}, this);
        	}
		}
	}

	/**
	 * Create a Store for Ext Charts
	 */
	, getJsonStore: function(percent){
		
		Sbi.debug("[AbstractChartWidget.getJsonStore]: IN");
		
		Sbi.debug("[AbstractChartWidget.getJsonStore]: storeObject is equal to [" + Sbi.toSource(this.dataContainerObject) + "]");
		
		var storeObject = {};
		
		var series = this.getSeries();
		var categories = this.getCategories();
		
		var data = new Array();
		var fields = new Array();
		var serieNames = new Array();
	
		
		for(var i=0; i<categories.length; i++){
			var z = {};
			var seriesum = 0;
			for(var j=0; j<series.length; j++){
				z['series'+j] = ((series[j]).data)[i];
				seriesum = seriesum + parseFloat(((series[j]).data)[i]);
			}
			if(percent){
				for(var j=0; j<series.length; j++){
					z['seriesflatvalue'+j] = z['series'+j];
					z['series'+j] = (z['series'+j]/seriesum)*100;
				}	
			}
			z['seriesum'] = seriesum;
			z['categories'] = categories[i];
			data.push(z);
		}
		
		for(var j=0; j<series.length; j++){
			fields.push('series'+j);
			fields.push('seriesflatvalue'+j);
			serieNames.push(series[j].name);
		}
		
		fields.push('seriesum');
		fields.push('categories');
	
		
	    var store = new Ext.data.JsonStore({
	        fields:fields,
	        data: data
	    });
	    
	    storeObject.store = store;
	    storeObject.serieNames = serieNames;
	    
	    Sbi.debug("[AbstractChartWidget.getJsonStore]: storeObject fields are equal to [" + Sbi.toSource(fields) + "]");
	    Sbi.debug("[AbstractChartWidget.getJsonStore]: storeObject data is equal to [" + Sbi.toSource(data) + "]");
	    
	    Sbi.debug("[AbstractChartWidget.getJsonStore]: OUT");
	
	    return storeObject;
	}
	
	/**
	 * Loads the series for the chart
	 */
	, getSeries: function(){
		if(this.dataContainerObject!=null){
			var runtimeSeries = this.getRuntimeSeries();
			var data = this.dataContainerObject.data;
			var measures_metadata = this.dataContainerObject.measures_metadata;
			var measures_metadata_map = {};
			//load the metadata of the measures (we need the type)
			var i=0;
	
			for(; i<measures_metadata.length; i++){
				measures_metadata_map[measures_metadata[i].name] ={'format':measures_metadata[i].format, 'type': measures_metadata[i].type};
				//measures_metadata_map[measures_metadata[i].name].scaleFactorValue = (this.getMeasureScaleFactor(measures_metadata[i].name)).value;
				measures_metadata_map[measures_metadata[i].name].scaleFactorValue = 1;
			}
			var series = [];
			var serie;
			var map ;
			var serieData, serieDataFormatted;
			i=0;
			for (; i < runtimeSeries.length; i++){
				serie = {};
				serie.name = runtimeSeries[i].name;
				var measure = runtimeSeries[i].measure;
				serieData = this.dataContainerObject.data[i];
				serieDataFormatted = [];
				var j=0;
				for(; j<serieData.length; j++){
					map = measures_metadata_map[measure];
					serieDataFormatted.push(this.format(serieData[j], map.type, map.format, map.scaleFactorValue ));
				}
				serie.data = serieDataFormatted;
				serie.shadow = false;
				series.push(serie);
			}	
			return series;
		}
	}
	
	/**
	 * Load the categories for the chart
	 */
	, getCategories: function(){
		if(this.dataContainerObject!=null){
			var measures = this.dataContainerObject.columns.node_childs;
			var categories = [];
			var i=0;
			for(; i<measures.length; i++){
				categories.push(measures[i].node_description);
			}
			return  categories;
		}
	}
	
	, getRuntimeSeries : function () {
		var toReturn = [];
		// rows (of dataContainerObject) can contain 2 level, it depends if a groupingVariable was defined or not
		if (this.wconf.groupingVariable != null) {
			// first level contains groupingVariable, second level contains series
			var groupingAttributeValues = this.dataContainerObject.rows.node_childs;
			for(var i = 0; i < groupingAttributeValues.length; i++) {
				var measureNodes = groupingAttributeValues[i].node_childs;
				for(var j = 0; j < measureNodes.length; j++) {
					toReturn.push({
						name : groupingAttributeValues[i].node_description + 
								( measureNodes.length > 1 ? ' [' + measureNodes[j].node_description + ']' : '' )
						, measure : measureNodes[j].node_description
					});
				}
			}
		} else {
			// no grouping variable: series are just first level nodes
			var measureNodes = this.dataContainerObject.rows.node_childs;
			for(var i = 0; i < measureNodes.length; i++) {
				toReturn.push({
					name : measureNodes[i].node_description
					, measure : measureNodes[i].node_description
				});
			}
		}
		return toReturn;
	}
	
	, getRuntimeSerie : function (theSerieName) {
		var allRuntimeSeries = this.getRuntimeSeries();
		var i = 0;
		for (; i < allRuntimeSeries.length; i++) {
			if (allRuntimeSeries[i].name === theSerieName) {
				return allRuntimeSeries[i];
			}
		}
		return null;
	}	

	, addChartConf: function(chartConf, showTipMask){
		if((this.wconf.showlegend !== undefined) ? this.wconf.showlegend : true){
			if (chartConf.extraStyle === undefined || chartConf.extraStyle == null) {
				chartConf.extraStyle = {};
			}
			chartConf.extraStyle.legend = this.legendStyle;
		}
		//chartConf.tipRenderer = this.getTooltipFormatter();
	}
	
	//------------------------------------------------------------------------------------------------------------------
	// utility methods
	// -----------------------------------------------------------------------------------------------------------------
	, init: function() {
		this.initMsgPanel();
		this.initChartThemes();
	}
	
	, initMsgPanel: function() {
		this.msgPanel = new Ext.Panel({
			border: false
			, bodyBorder: false
			, hideBorders: true
			, frame: false
			, html: this.msg || ''
		});
	}
	
	, initChartThemes: function() {
		Ext.define('Ext.chart.theme.CustomBlue', {
	        extend: 'Ext.chart.theme.Base',
	        
	        constructor: function(config) {
	            var titleLabel = {
	                font: 'bold 18px Arial'
	            }, axisLabel = {
	                fill: 'rgb(8,69,148)',
	                font: '12px Arial',
	                spacing: 2,
	                padding: 5
	            };
	            
	            this.callParent([Ext.apply({
	               axis: {
	                   stroke: '#084594'
	               },
	               axisLabelLeft: axisLabel,
	               axisLabelBottom: axisLabel,
	               axisTitleLeft: titleLabel,
	               axisTitleBottom: titleLabel
	           }, config)]);
	        }
	    });
	}
	
	//------------------------------------------------------------------------------------------------------------------
	// utility methods
	// -----------------------------------------------------------------------------------------------------------------
	, getColors : function () {
		var colors = [];
		if (this.wconf !== undefined && this.wconf.groupingVariable != null) {
			colors = Sbi.widgets.Colors.defaultColors;
		} else {
			if (this.wconf !== undefined && this.wconf.series !== undefined && this.wconf.series.length > 0) {
				var i = 0;
				for (; i < this.wconf.series.length; i++) {
					colors.push(this.wconf.series[i].color);
				}
			}
		}
		return colors;
	}
	
	, getMeasureScaleFactor: function (theMeasureName){
		var i=0;
		var scaleFactor={value:1, text:''};
		var optionDefinition = null;
		if ( this.fieldsOptions != null) {
			for (; i < this.fieldsOptions.length; i++) {
				if (this.fieldsOptions[i].alias === theMeasureName) {
					optionDefinition = this.fieldsOptions[i];
					break;
				}
			}
			if(optionDefinition!=null){
				legendSuffix = optionDefinition.options.measureScaleFactor;
				if(legendSuffix != undefined && legendSuffix != null && legendSuffix!='NONE'){
					scaleFactor.text = LN('sbi.worksheet.runtime.options.scalefactor.'+legendSuffix);
					switch (legendSuffix)
					{
					case 'K':
						scaleFactor.value=1000;
						break;
					case 'M':
						scaleFactor.value=1000000;
						break;
					case 'G':
						scaleFactor.value=1000000000;
						break;
					default:
						scaleFactor.value=1;
					}
				}
			}
		}
		return scaleFactor;
	}
	
	, formatTextWithMeasureScaleFactor : function(text, measureName) {
		var legendSuffix;
		legendSuffix = (this.getMeasureScaleFactor(measureName)).text;
		
		if (legendSuffix != '' ) {
			return text + ' ' + legendSuffix;
		}
		return text;
	}
	
	, formatLegendWithScale : function(theSerieName) {
		var serie = this.getRuntimeSerie(theSerieName);
		var toReturn = this.formatTextWithMeasureScaleFactor(serie.name, serie.measure);
		return toReturn;
	}
	
    , format: function(value, type, format, scaleFactor) {
    	if(value==null){
    		return value;
    	}
		try {
			var valueObj = value;
			if (type == 'int') {
				valueObj = (parseInt(value))/scaleFactor;
			} else if (type == 'float') {
				valueObj = (parseFloat(value))/scaleFactor;
			} else if (type == 'date') {
				valueObj = Date.parseDate(value, format);
			} else if (type == 'timestamp') {
				valueObj = Date.parseDate(value, format);
			}
			return valueObj;
		} catch (err) {
			return value;
		}
	}	
	
	
	, isEmpty : function () {		
		var measures = undefined;
		
		if (Sbi.isValorized(this.dataContainerObject.columns))
			measures = this.dataContainerObject.columns.node_childs;
		
		return measures === undefined;
	}
	
	, maximize: function(){
		Sbi.trace("[AbstractChartWidget.maximize]: Ext.window.Window.maximize method overriden has been called");		
		//this.redraw();
	} 
	
	, restore: function() {
		Sbi.trace("[AbstractChartWidget.restore]: Ext.window.Window.restore method overriden has been called");
		//this.redraw();
	}
	
	, resize: function() {
		Sbi.trace("[AbstractChartWidget.resize]: Ext.window.Window.resize method overriden has been called");
		//this.redraw();
	}
	
	, onStoreMetaChange: function(store, meta) {
		Sbi.trace("[AbstractChartWidget.onStoreMetaChange][" + this.getId() + "]: IN");
	
		Sbi.cockpit.widgets.table.TableWidget.superclass.onStoreMetaChange.call(this, store, meta);	
	
		var fieldMeta = {};
		
		for(var i = 0; i < meta.fields.length; i++) {
			var f = meta.fields[i];
			if(Ext.isString(f)) continue;
			f.header = f.header || f.name;
			fieldMeta[f.header] = f;
		}
		store.fieldMeta = fieldMeta;
		
		Sbi.trace("[AbstractChartWidget.onStoreMetaChange][" + this.getId() + "]: OUT");
	}
	
	, onStoreLoad: function() {
		Sbi.trace("[AbstractChartWidget.onStoreLoad][" + this.getId() + "]: IN");
		
		if(this.getStore().status === "error") {
			return;
		}
		
		if(this.rendered){
    		this.redraw();
    	} else {
    		this.on('afterrender', function(){this.redraw();}, this);
    	}
		Sbi.trace("[AbstractChartWidget.onStoreLoad][" + this.getId() + "]: OUT");
	}
	
	//------------------------------------------------------------------------------------------------------------------
	// test methods
	// -----------------------------------------------------------------------------------------------------------------
	
	, getSampleStore: function() {
		var store = Ext.create('Ext.data.JsonStore', {
	        fields: ['name', 'data1', 'data2', 'data3', 'data4', 'data5', 'data6', 'data7', 'data9', 'data9'],
	        data: this.generateData()
	    });
		return store;
	}
	
	, generateData: function(n, floor){
        var data = [],
            p = (Math.random() *  11) + 1,
            i;
            
        floor = (!floor && floor !== 0)? 20 : floor;
        
        for (i = 0; i < (n || 12); i++) {
            data.push({
                name: Ext.Date.monthNames[i % 12],
                data1: Math.floor(Math.max((Math.random() * 100), floor)),
                data2: Math.floor(Math.max((Math.random() * 100), floor)),
                data3: Math.floor(Math.max((Math.random() * 100), floor)),
                data4: Math.floor(Math.max((Math.random() * 100), floor)),
                data5: Math.floor(Math.max((Math.random() * 100), floor)),
                data6: Math.floor(Math.max((Math.random() * 100), floor)),
                data7: Math.floor(Math.max((Math.random() * 100), floor)),
                data8: Math.floor(Math.max((Math.random() * 100), floor)),
                data9: Math.floor(Math.max((Math.random() * 100), floor))
            });
        }
        
        //alert('data: ' + Sbi.toSource(data));
        
        return data;
    }
    
    , generateDataNegative: function(n, floor){
        var data = [],
            p = (Math.random() *  11) + 1,
            i;
            
        floor = (!floor && floor !== 0)? 20 : floor;
            
        for (i = 0; i < (n || 12); i++) {
            data.push({
                name: Ext.Date.monthNames[i % 12],
                data1: Math.floor(((Math.random() - 0.5) * 100), floor),
                data2: Math.floor(((Math.random() - 0.5) * 100), floor),
                data3: Math.floor(((Math.random() - 0.5) * 100), floor),
                data4: Math.floor(((Math.random() - 0.5) * 100), floor),
                data5: Math.floor(((Math.random() - 0.5) * 100), floor),
                data6: Math.floor(((Math.random() - 0.5) * 100), floor),
                data7: Math.floor(((Math.random() - 0.5) * 100), floor),
                data8: Math.floor(((Math.random() - 0.5) * 100), floor),
                data9: Math.floor(((Math.random() - 0.5) * 100), floor)
            });
        }
        return data;
    }

});