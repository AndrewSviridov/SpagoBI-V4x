/** SpagoBI, the Open Source Business Intelligence suite

 * Copyright (C) 2012 Engineering Ingegneria Informatica S.p.A. - SpagoBI Competency Center
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0, without the "Incompatible With Secondary Licenses" notice. 
 * If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/. **/

Ext.ns("Sbi.cockpit.editor.dataset");

Sbi.cockpit.editor.dataset.DatasetBrowserPage = function(config) { 
	
	Sbi.trace("[DatasetBrowserPage.constructor]: IN");

	// init properties...
	var defaultSettings = {
		itemId: 0
	};
	var settings = Sbi.getObjectSettings('Sbi.cockpit.editor.dataset.DatasetBrowserPage', defaultSettings);
	var c = Ext.apply(settings, config || {});
	Ext.apply(this, c);
	
	this.init();
	
	c.items = [this.datasetsBrowserPanel];
	
	Sbi.cockpit.editor.dataset.DatasetBrowserPage.superclass.constructor.call(this, c);
	
	Sbi.trace("[DatasetBrowserPage.constructor]: OUT");
};

/**
 * @class Sbi.xxx.Xxxx
 * @extends Ext.util.Observable
 * 
 * bla bla bla bla bla ...
 */

/**
 * @cfg {Object} config
 * ...
 */
Ext.extend(Sbi.cockpit.editor.dataset.DatasetBrowserPage, Ext.Panel, {
	
	datasetsBrowserPanel: null
	, widgetManager: null
	
	// -----------------------------------------------------------------------------------------------------------------
    // public methods
	// -----------------------------------------------------------------------------------------------------------------
	
	, applyPageState: function(state) {
		Sbi.trace("[WidgetEditor.applyPageState]: IN");
		state =  state || {};
		state.selectedDatasetLabel = this.datasetsBrowserPanel.getSelection()[0];
		Sbi.trace("[WidgetEditor.applyPageState]: OUT");
		return state;
	}	

	, setPageState: function(state) {
		Sbi.trace("[WidgetEditor.setPageState]: IN");
		Sbi.trace("[WidgetEditor.setPageState]: state parameter is equal to [" + Sbi.toSource(state) + "]");
		
		if(Sbi.isValorized(state.dataset)) {
			this.datasetsBrowserPanel.selectDatasetByLabel(state.dataset);
			Sbi.trace("[WidgetEditor.setPageState]: selected dataset [" + state.dataset + "]");
		} else {
			this.datasetsBrowserPanel.resetSelection();
			Sbi.trace("[WidgetEditor.setPageState]: dataset selection cleared");
		}
		Sbi.trace("[WidgetEditor.setPageState]: OUT");
	}
	
	, resetPageState: function() {
		Sbi.trace("[WidgetEditor.resetPageState]: IN");
		this.datasetsBrowserPanel.resetSelection();
		this.datasetsBrowserPanel.resetToolbarOptions();
		
		Sbi.trace("[WidgetEditor.resetPageState]: OUT");
	}
	
	// -----------------------------------------------------------------------------------------------------------------
    // init methods
	// -----------------------------------------------------------------------------------------------------------------

	, init: function(){
		this.datasetsBrowserPanel = new Sbi.widgets.DatasetsBrowserPanel({
			widgetManager: this.widgetManager
		}); 
//		this.datasetsBrowserPanel.on('select',  function(l) {
//			this.onSelect(l);
//			this.datasetsBrowserPanel.viewPanel.refresh();
//		}, this);	
//		

		return this.datasetsBrowserPanel;
	}

	
	// -----------------------------------------------------------------------------------------------------------------
    // utility methods
	// -----------------------------------------------------------------------------------------------------------------
//	, onSelect: function(c){	
//		//removes old selection from the storeManager (if exists)
//		if (c.label != c.oldLabel && this.widgetManager.getStoreByLabel(c.oldLabel) != null) {
//			this.widgetManager.removeStore(c.oldLabel);
//		}
//		//adds the dataset to the storeManager (throught the WidgetManager)
//		//this.widget.dataset = c.label;
//		var storeConfig = {};
//		storeConfig.dsLabel = c.label; //storeConfig.dsLabel = this.widget.dataset;	
//	    this.widgetManager.addStore(storeConfig);		
//	}
});