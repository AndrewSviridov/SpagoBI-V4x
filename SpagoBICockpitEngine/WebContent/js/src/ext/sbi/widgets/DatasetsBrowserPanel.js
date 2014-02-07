/** SpagoBI, the Open Source Business Intelligence suite

 * Copyright (C) 2012 Engineering Ingegneria Informatica S.p.A. - SpagoBI Competency Center
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0, without the "Incompatible With Secondary Licenses" notice. 
 * If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/. **/

Ext.ns("Sbi.widgets");

/**
 * Class: Sbi.widgets.DatasetsBrowserPanel
 * A panel that shows the list of dataset available to te logged in user grouped by category. 
 * In line sort and filter are also provided.
 */
Sbi.widgets.DatasetsBrowserPanel = function(config) { 

	Sbi.trace("[DatasetsBrowserPanel.constructor]: IN");
	
	var defaultSettings = {		
		autoScroll: true
	  , height: '100%'
	};
	var settings = Sbi.getObjectSettings('Sbi.widgets.DatasetsBrowserPanel', defaultSettings);
	var c = Ext.apply(settings, config || {});
	Ext.apply(this, c);
	
	this.filterOption = this.defaultFilterOption;
	Sbi.trace("[DatasetsBrowserPanel.constructor]: initially the list will be filtered on type [" + this.filterOption + "]");
	
	this.initServices();
	this.initDatasetStore();
	this.init();
	
	this.items = [this.toolbar, this.viewPanel];
		
	Sbi.widgets.DatasetsBrowserPanel.superclass.constructor.call(this, c);
	
	this.addEvents("select");
	
	this.on("render", function() {
		Sbi.trace("[DatasetsBrowserPanel.constructor]: panel succesfully rendered.");
		this.refresh();
	}, this);
	
	Sbi.trace("[DatasetsBrowserPanel.constructor]: IN");
	
};

Ext.extend(Sbi.widgets.DatasetsBrowserPanel, Ext.Panel, {
	
	// =================================================================================================================
	// PROPERTIES
	// =================================================================================================================
	
	/**
     * @property {Array} services
     * This array contains all the services invoked by this class
     */
	services: null
	
	/**
     * @property {Ext.Panel} toolbar
     * The inline toolbar that contains category buttons, filter and sort options
     */
	, toolbar: null
	
	/**
     * @property {Array} services
     * This array contains all the services invoked by this class
     */
	, viewPanel: null

	, id:'this'  // TODO remove
	
	, selectedDatasetLabel: null
	, usedDatasetLabels: null
	
	, datasetStore: null
	, widgetManager: null  // TODO remove
	
	, filterOption: null
	, defaultFilterOption: Sbi.settings.mydata.defaultFilter || "UsedDataSet"
	
	, searchOption: null
	, defaultSearchOption: Sbi.settings.mydata.defaultSortOption || null
	
	, sortOption: null
	, defaultSortOption: Sbi.settings.mydata.defaultSortOption || "dateIn"
	
	
	// =================================================================================================================
	// METHODS
	// =================================================================================================================
	
	// -----------------------------------------------------------------------------------------------------------------
    // public methods
	// -----------------------------------------------------------------------------------------------------------------
	
	, resetToolbarOptions: function() {
		this.resetFilter(true);
		this.resetSearch(true);
		this.resetSort(true);
	}

//	, getToolbarOptions: function() {
//		this.resetFilter(true);
//		this.resetSearch(true);
//		this.resetSort(true);
//	}

	, getSelection: function() {
		return [this.selectedDatasetLabel];
	}

	, resetSelection: function() {
		Sbi.trace("[DatasetsBrowserPanel.resetDatasetSelection]: IN");
		if(this.selectedDatasetLabel !== null) {
			Sbi.trace("[DatasetsBrowserPanel.resetDatasetSelection]: deselected dataset [" + this.selectedDatasetLabel + "]");
			this.selectedDatasetLabel = null;
			this.refreshView();
		}
		Sbi.trace("[DatasetsBrowserPanel.resetDatasetSelection]: OUT");
	}
	
	, select: function(datasetLabel, updateControl) {
		Sbi.trace("[DatasetsBrowserPanel.select]: IN");
		
		Sbi.trace("[DatasetsBrowserPanel.select]: dataset to select is equal to [" + datasetLabel + "]");
		Sbi.trace("[DatasetsBrowserPanel.select]: dataset currently selected is equal to [" + this.selectedDatasetLabel + "]");
		
		var previouslySelectedDatasetLabel = this.selectedDatasetLabel;
		this.selectedDatasetLabel = datasetLabel;

		
		// remove from selection previously slected dataset 
	 	if (datasetLabel != previouslySelectedDatasetLabel 
	 			&& this.widgetManager.getStoreByLabel(previouslySelectedDatasetLabel) != null) {
			this.widgetManager.removeStore(previouslySelectedDatasetLabel);
			Sbi.trace("[DatasetsBrowserPanel.select]: dataset  [" + previouslySelectedDatasetLabel + "] removed from selection");
		}
	
		//adds the dataset to the storeManager (through the WidgetManager)
		var storeConfig = {};
		storeConfig.dsLabel = datasetLabel; //storeConfig.dsLabel = this.widget.dataset;	
	    this.widgetManager.addStore(storeConfig);	
	    Sbi.trace("[DatasetsBrowserPanel.select]: dataset  [" + datasetLabel + "] added to selection");
	    
	    if(updateControl === true) {
	    	this.unselectDatasetComponent(previouslySelectedDatasetLabel);
	    	this.selectDatasetComponent(datasetLabel);
	    }
	    
	    Sbi.trace("[DatasetsBrowserPanel.select]: OUT");
	}
	
	/**
     * @method
     *
     * Filter the list of dataset contained in the DatasetBrowserView by dataset type type.
     * 
     * @param {String} type the dataset type to use for filtering the list. Admissible types
     * are: UsedDataSet, EnterpriseDataSet, SharedDataSet, AllDataSet
     */
	, filter: function(filterOption, updateControl) { 
		Sbi.trace("[DatasetsBrowserPanel.filter]: IN");
		
		Sbi.trace("[DatasetsBrowserPanel.filter]: dataset filterOption parameter is equal to [" + filterOption + "]");
		
		if (filterOption == 'UsedDataSet' || filterOption == 'MyDataSet' 
			|| filterOption == 'EnterpriseDataSet' || filterOption == 'SharedDataSet'
			|| filterOption == 'AllDataSet'){
			this.filterOption = filterOption;	
			this.refresh();
			if(updateControl === true) {
				this.setFilterControl(filterOption);
			}
			
		} else {
			Sbi.trace("[DatasetsBrowserPanel.filter]: value [" + filterOption + "] is not a valid dataset type");
		}

		Sbi.trace("[DatasetsBrowserPanel.filter]: OUT");
	}
	
	, resetFilter: function(updateControl) {
		Sbi.trace("[DatasetsBrowserPanel.resetFilter]: IN");
		this.filterOption = this.defaultFilterOption;
		if(updateControl === true) {
			this.setFilterControl(this.filterOption);
		}
		Sbi.trace("[DatasetsBrowserPanel.resetFilter]: OUT");
	}
	
	, search: function(query, updateControl) {
		
		Sbi.trace("[DatasetsBrowserPanel.search]: IN");
		
		this.filteredProperties =  [ "label","name","description","owner" ];		
		
		if(query!=null && query!=undefined && query!=''){
			this.datasetStore.filterBy(function(record,id){	
				if(Sbi.isValorized(record.data)){
					var data = record.data;
					for(var p in data){
						if(this.filteredProperties.indexOf(p)>=0){//if the column should be considered by the filter
							if(data[p]!=null && data[p]!=undefined && ((""+data[p]).toUpperCase()).indexOf(query.toUpperCase())>=0){
								return true;
							}
						}
					}
				}
				return false;		
			}, this);
		} else{
			this.datasetStore.clearFilter();
		}
		
		if(updateControl === true) {
			this.setSearchControl(query);
		}
		
		Sbi.trace("[DatasetsBrowserPanel.search]: OUT");
	}
	
	, resetSearch: function(updateControl) {
		Sbi.trace("[DatasetsBrowserPanel.resetSearch]: IN");
		this.searchOption = this.defaultSearchOption;
		this.search(this.searchOption, updateControl);
		Sbi.trace("[DatasetsBrowserPanel.resetSearch]: OUT");
	}
	
	, sort: function(sortOption, updateControl) {	
		Sbi.trace("[DatasetsBrowserPanel.sort]: IN");
		
		this.sortOption = sortOption;
		
		var sorters = [{property : 'dateIn', direction: 'DESC', description: LN('sbi.ds.moreRecent')}, 
		               {property : 'label', direction: 'ASC', description:  LN('sbi.ds.label')}, 
		               {property : 'name', direction: 'ASC', description: LN('sbi.ds.name')}, 				
		               {property : 'owner', direction: 'ASC', description: LN('sbi.ds.owner')}];

		
		for (sort in sorters){
			var s = sorters[sort];
			if (s.property == sortOption){
				this.datasetStore.sort(s.property, s.direction);
				break;
			}
		}
				
		this.refreshView();
		
		if(updateControl === true) {
			this.setSortControl(sortOption);
		}
		
		Sbi.trace("[DatasetsBrowserPanel.sort]: OUT");
	}
	
	, resetSort: function(updateControl) {
		this.sortOption = this.defaultSortOption;
		this.sort(this.sortOption, updateControl);
	}
	
	, refresh: function() {
		Sbi.trace("[DatasetsBrowserPanel.refreshDatasetList]: IN");
		
		this.initDatasetListService();
		this.initDatasetStore();	
		
		this.datasetStore.on('load', function() {
			Sbi.trace("[DatasetsBrowserPanel.refreshDatasetList]: refreshing view panel ...");
			
			if (this.viewPanel){
				this.viewPanel.filterOnType = this.filterOption;
				this.viewPanel.bindStore(this.datasetStore);
				Sbi.trace("[DatasetsBrowserPanel.refreshDatasetList]: refreshing view panel 1");
				this.refreshView();
				
				Sbi.trace("[DatasetsBrowserPanel.refreshDatasetList]: refreshing view panel 2");
			}
		}, this);
			
		this.datasetStore.load();	
		
		Sbi.trace("[DatasetsBrowserPanel.refreshDatasetList]: OUT");
	}
	
	, refreshView: function() {
		if(this.viewPanel && this.viewPanel.redered === true) {
			this.viewPanel.refresh();
		}
	}
	
	// -----------------------------------------------------------------------------------------------------------------
    // init methods
	// -----------------------------------------------------------------------------------------------------------------
	/**
	 * @method 
	 * 
	 * Initialize the following services exploited by this component:
	 * 
	 *    - list
	 */
	, initServices: function() {
		this.services = [];
		this.initDatasetListService();
	}
	
	, initDatasetListService: function(){
		Sbi.trace("[DatasetsBrowserPanel.initDatasetListService]: IN");
		if (this.filterOption == 'MyDataSet'){			
			baseParams ={};
			baseParams.isTech = false;
			baseParams.showOnlyOwner = true;
			baseParams.typeDoc = this.typeDoc;

			this.services["list"] = Sbi.config.serviceRegistry.getRestServiceUrl({
				serviceName : 'selfservicedataset',
				baseParams : baseParams,
				baseUrl:{contextPath: 'SpagoBI', restServicesPath: 'restful-services' }
			});		
			
			
		} else if (this.filterOption == 'EnterpriseDataSet'){			
			baseParams ={};
			baseParams.isTech = true;
			baseParams.showOnlyOwner = false;
			baseParams.typeDoc = this.typeDoc;

			this.services["list"] = Sbi.config.serviceRegistry.getRestServiceUrl({
				serviceName : 'certificateddatasets',
				baseParams : baseParams,
				baseUrl:{contextPath: 'SpagoBI', restServicesPath: 'restful-services' }
			});
	
			
		} else if (this.filterOption == 'SharedDataSet'){
			baseParams ={};
			baseParams.isTech = false;
			baseParams.showOnlyOwner = false;
			baseParams.typeDoc = this.typeDoc;

			this.services["list"] = Sbi.config.serviceRegistry.getRestServiceUrl({
				serviceName : 'certificateddatasets',
				baseParams : baseParams,
				baseUrl:{contextPath: 'SpagoBI', restServicesPath: 'restful-services' }
			});
		
			
		} else if (this.filterOption == 'AllDataSet' || this.filterOption == 'UsedDataSet'){

			baseParams ={};
			baseParams.isTech = false;
			baseParams.showOnlyOwner = false;
			baseParams.typeDoc = this.typeDoc;
			baseParams.allMyDataDs = true;

			this.services["list"] = Sbi.config.serviceRegistry.getRestServiceUrl({
				serviceName : 'certificateddatasets',
				baseParams : baseParams, 
				baseUrl:{contextPath: 'SpagoBI', restServicesPath: 'restful-services' }
			});
		
		}
		
		Sbi.trace("[DatasetsBrowserPanel.initDatasetListService]: OUT");
	}
	
	, initDatasetStore: function() {
		Sbi.trace("[DatasetsBrowserPanel.initDatasetStore]: IN");
		
		this.datasetStore = new Ext.data.JsonStore({
			 url: this.services['list']
			 , filteredProperties : this.filteredProperties 
			 , sorters: []
			 , root: 'root'
			 , fields: ["id",
			    	 	"label",
			    	 	"name",
			    	 	"description",
			    	 	"typeCode",
			    	 	"typeId",
			    	 	"encrypt",
			    	 	"visible",
			    	 	"engine",
			    	 	"engineId",
			    	 	"dataset",
			    	 	"stateCode",
			    	 	"stateId",
			    	 	"functionalities",
			    	 	"dateIn",
			    	 	"owner",
			    	 	"refreshSeconds",
			    	 	"isPublic",
			    	 	"actions",
			    	 	"exporters",
			    	 	"decorators",
			    	 	"previewFile",
			    	 	"isUsed", 	/*local property*/
			    	 	"myDSLabel" /*local property*/]
		});
		
		Sbi.trace("[DatasetsBrowserPanel.initDatasetStore]: OUT");
	}

	/**
	 * @method 
	 * 
	 * Initialize the GUI
	 */
	, init: function() {
		Sbi.trace("[DatasetsBrowserPanel.init]: IN");
		this.initToolbar();
		this.initViewPanel();
		Sbi.trace("[DatasetsBrowserPanel.init]: OUT");
	}
	
	
	/**
	 * @method 
	 * 
	 * Initialize the toolbar
	 */
	, initToolbar: function() {
		
		Sbi.trace("[DatasetsBrowserPanel.initToolbar]: IN");
		
		var toolbarInnerHtml = this.getToolbarInnerHtml({});
		this.toolbar = new Ext.Panel({
			height: 70, 
			border: false, 
		   	autoScroll: false,
		   	html: toolbarInnerHtml
		});	
		
		Sbi.trace("[DatasetsBrowserPanel.initToolbar]: OUT");	
	}
	
	
	/**
	 * @method 
	 * 
	 * Create the inner html of the toolbar
	 * 
	 * @param {???} communities ???
	 * 
	 * @return {String} the html code of the toolbar
	 */
	, getToolbarInnerHtml: function(communities){	
		var activeClass = '';
        
        var  toolbarInnerHtml = ''+
     		'<div class="main-datasets-list"> '+
    		'    <div class="list-actions-container"> ';
        
        toolbarInnerHtml += this.getDatasetFilterControlHtml();
        toolbarInnerHtml +=
    		'	    <div id="list-actions" class="list-actions"> '+
    		this.getDatasetSearchControlHtml() + 
    		this.getDatasetSortControlHtml() + 
    		'	    </div> '+
    		'	</div> '+
    		'</div>' ;

        return toolbarInnerHtml;
    }
	
	, getDatasetFilterControlHtml: function() {
		
		var buttonsHtml = '';
		
		buttonsHtml += '<ul class="list-tab" id="list-tab"> ';
     
		if (Sbi.settings.mydata.showMyDataSetFilter){	
	     	if (this.filterOption == 'MyDataSet'){
	     		activeClass = 'active';
	     	} else {
	     		activeClass = '';
	     	}
	     	buttonsHtml +=	
	     	'<li class="first '+activeClass+'" id="MyDataSet"><a href="#" onclick="javascript:Ext.getCmp(\'this\').filter( \'MyDataSet\', true)">'+LN('sbi.mydata.mydataset')+'</a></li> '; 
	     }	
	     
	     if (Sbi.settings.mydata.showEnterpriseDataSetFilter){
	     	if (this.filterOption == 'EnterpriseDataSet'){
	     		activeClass = 'active';
	     	} else {
	     		activeClass = '';
	     	}
	     	buttonsHtml +=
	 		'	    	<li class="'+activeClass+'" id="EnterpriseDataSet"><a href="#" onclick="javascript:Ext.getCmp(\'this\').filter( \'EnterpriseDataSet\', true)">'+LN('sbi.mydata.enterprisedataset')+'</a></li> ';    
	     }
	     if (Sbi.settings.mydata.showSharedDataSetFilter){
	      	if (this.filterOption == 'SharedDataSet'){
	     		activeClass = 'active';
	     	} else {
	     		activeClass = '';
	     	}
	      	buttonsHtml +=	
	  		'	    	<li class="'+activeClass+'" id="SharedDataSet"><a href="#" onclick="javascript:Ext.getCmp(\'this\').filter( \'SharedDataSet\', true)">'+LN('sbi.mydata.shareddataset')+'</a></li> ';    	
	     }
	     
	     if (Sbi.settings.mydata.showAllDataSetFilter){
	       	if (this.filterOption == 'AllDataSet'){
	     		activeClass = 'active';
	     	} else {
	     		activeClass = '';
	     	}
	       	buttonsHtml +=
	 		'	    	<li id="AllDataSet" class="last '+activeClass+'"><a href="#" onclick="javascript:Ext.getCmp(\'this\').filter( \'AllDataSet\', true)">'+LN('sbi.mydata.alldataset')+'</a></li> ';    		    		    		    		        	 
	     }
	     if (Sbi.settings.mydata.showUsedDataSetFilter){	
		    	if (this.filterOption == 'UsedDataSet'){
		    		activeClass = 'active';
		    	} else {
		    		activeClass = '';
		    	}
		    	buttonsHtml +=	
		    	'	    	<li class="first '+activeClass+'" id="UsedDataSet"><a href="#" onclick="javascript:Ext.getCmp(\'this\').filter( \'UsedDataSet\', true)">'+LN('sbi.mydata.useddataset')+'</a></li> '; 
	      }
	     
	      buttonsHtml+= '</ul>';
	      
	      return buttonsHtml;
	}
	
	, getDatasetSearchControlHtml: function() {
		var html = 
			'	        <form action="#" method="get" class="search-form"> '+
    		'	            <fieldset> '+
    		'	                <div class="field"> '+
    		'	                    <label for="search">'+LN('sbi.browser.document.searchDatasets')+'</label> '+
    		'	                    <input type="text" name="search" id="search" onclick="this.value=\'\'" onkeyup="javascript:Ext.getCmp(\'this\').search(this.value)" value="'+LN('sbi.browser.document.searchKeyword')+'" /> '+
    		'	                </div> '+
    		'	                <div class="submit"> '+
    		'	                    <input type="text" value="Cerca" /> '+
    		'	                </div> '+
    		'	            </fieldset> '+
    		'	        </form> ';
    		
    	return html;
	}
	
	, getDatasetSortControlHtml: function() {
		var html = 
			'	        <ul class="order" id="sortList">'+
    		'	            <li id="dateIn" class="active"><a href="#" onclick="javascript:Ext.getCmp(\'this\').sort(\'dateIn\')">'+LN('sbi.ds.moreRecent')+'</a> </li> '+
    		'	            <li id="name"><a href="#" onclick="javascript:Ext.getCmp(\'this\').sort(\'name\')">'+LN('sbi.generic.name')+'</a></li> '+
    		'	            <li id="owner"><a href="#" onclick="javascript:Ext.getCmp(\'this\').sort(\'owner\')">'+LN('sbi.generic.owner')+'</a></li> '+
    		'	        </ul> ';
		
		return html;
	}
	
	, initViewPanel: function() {
		
		Sbi.trace("[DatasetsBrowserPanel.initViewPanel]: IN");
		
		var config = {};
		config.services = this.services;
		config.store = this.datasetStore;
		config.widgetManager = this.widgetManager;
		config.selectedDatasetLabel = this.selectedDatasetLabel;
		config.actions = this.actions;
		config.user = this.user;
		config.fromMyDataCtx = this.displayToolbar;
		config.filterOnType = this.filterOption;
		
		this.viewPanel = new Sbi.widgets.DatasetsBrowserView(config);
		this.viewPanel.addListener('click', this.onClick, this);
		
		Sbi.trace("[DatasetsBrowserPanel.initViewPanel]: OUT");
	}
	
	// -----------------------------------------------------------------------------------------------------------------
    // GUI utils
	// -----------------------------------------------------------------------------------------------------------------
	
	// TODO : the followings methods work only on the gui. They do not modify the state
	
	, selectDatasetComponent: function(datasetLabel) {
		Sbi.trace("[DatasetsBrowserPanel.selectDatasetComponent]: IN");
		if(this.rendered === true) {
			var el = Ext.get(datasetLabel);
	 		if (el) {
	 			Sbi.trace("[DatasetsBrowserPanel.selectDatasetComponent]: class before [" + el.dom.className + "]");
	 			el.dom.className += ' selectbox ';
	 			Sbi.trace("[DatasetsBrowserPanel.selectDatasetComponent]: class after [" + el.dom.className + "]");
	 		} else {
	 			Sbi.trace("[DatasetsBrowserPanel.selectDatasetComponent]: Impossible to find dataset [" + datasetLabel +"]");
	 		}
	 			
	 		var elText = Ext.get('box-text-' + datasetLabel);
		 	if (elText) {
		 		Sbi.trace("[DatasetsBrowserPanel.selectDatasetComponent]: class before [" + elText.dom.className + "]");
		 		elText.dom.className += ' box-text-select ';
		 		Sbi.trace("[DatasetsBrowserPanel.selectDatasetComponent]: class after [" + elText.dom.className + "]");
		 	}
		 	
		 	Sbi.trace("[DatasetsBrowserPanel.selectDatasetComponent]: dataset [" + datasetLabel +"] succesfully selected");
		}
		Sbi.trace("[DatasetsBrowserPanel.selectDatasetComponent]: OUT");
	}
	
	, unselectDatasetComponent: function(datasetLabel) {
		Sbi.trace("[DatasetsBrowserPanel.selectDatasetComponent]: IN");
		if(this.rendered === true) {
			var el = Ext.get(datasetLabel);
	 		if (el) {
	 			Sbi.trace("[DatasetsBrowserPanel.unselectDatasetComponent]: class before [" + el.dom.className + "]");
	 			el.dom.className = el.dom.className.replace( /(?:^|\s)selectbox(?!\S)/g , '' ); //remove active class
	 			Sbi.trace("[DatasetsBrowserPanel.unselectDatasetComponent]: class after [" + el.dom.className + "]");
	 		} else {
	 			Sbi.trace("[DatasetsBrowserPanel.selectDatasetComponent]: Impossible to find dataset [" + datasetLabel +"]");
	 		}
	 			
	 		var elText = Ext.get('box-text-' + datasetLabel);
		 	if (elText) {
		 		Sbi.trace("[DatasetsBrowserPanel.unselectDatasetComponent]: class before [" + elText.dom.className + "]");
		 		elText.dom.className = elText.dom.className.replace( /(?:^|\s)box-text-select(?!\S)/g , '' ); //remove active class
		 		Sbi.trace("[DatasetsBrowserPanel.unselectDatasetComponent]: class after [" + elText.dom.className + "]");
		 	}
		 	
		 	Sbi.trace("[DatasetsBrowserPanel.selectDatasetComponent]: dataset [" + datasetLabel +"] succesfully unselected");
		}
		Sbi.trace("[DatasetsBrowserPanel.selectDatasetComponent]: OUT");
	}
	
	
	, setFilterControl: function(filterOption) {
		Sbi.trace("[DatasetsBrowserPanel.setFilterControl]: IN");
		if(this.rendered === true) {
			if (Ext.get('list-tab') != null){
				var tabEls = Ext.get('list-tab').dom.childNodes;
				
				//Change active dataset type on toolbar
				for(var i=0; i< tabEls.length; i++){
					//nodeType == 1 is  Node.ELEMENT_NODE
					if (tabEls[i].nodeType == 1){
						if (tabEls[i].id === filterOption){					
							tabEls[i].className += ' active '; //append class name to existing others
						} else {
							tabEls[i].className = tabEls[i].className.replace( /(?:^|\s)active(?!\S)/g , '' ); //remove active class
						}
					}
				}
			}
			Sbi.trace("[DatasetsBrowserPanel.setFilterControl]: filter control succesfully set");
		}
		Sbi.trace("[DatasetsBrowserPanel.setFilterControl]: OUT");
	}
	
	, resetFilterControl: function() {
		Sbi.trace("[DatasetsBrowserPanel.resetFilterControl]: IN");
		this.setFilterControl(null);	
		Sbi.trace("[DatasetsBrowserPanel.resetFilterControl]: OUT");
	}
	
	, setSearchControl: function(searchOption) {
		Sbi.trace("[DatasetsBrowserPanel.setSearchControl]: IN");
		if(this.rendered === true) {
			var inputField = Ext.get('search').dom;
			inputField.value = searchOption || '';
			Sbi.trace("[DatasetsBrowserPanel.setSearchControl]: search control succesfully set");
		}		
		Sbi.trace("[DatasetsBrowserPanel.setSearchControl]: OUT");
	}
	
	, resetSearchControl: function() {
		Sbi.trace("[DatasetsBrowserPanel.resetSearchControl]: IN");
		this.setSearchControl(null);	
		Sbi.trace("[DatasetsBrowserPanel.resetSearchControl]: OUT");
	}
	
	, setSortControl: function(sortOption) {
		Sbi.trace("[DatasetsBrowserPanel.setSortControl]: IN");
		if(this.rendered === true) {
			var sortEls = Ext.get('sortList').dom.childNodes;
			
			//move the selected value to the first element
			for(var i=0; i< sortEls.length; i++){
				if (sortEls[i].id === sortOption){					
					sortEls[i].className = 'active';
					break;
				} 
			}
			//append others elements
			for(var i=0; i< sortEls.length; i++){
				if (sortEls[i].id !== sortOption){
					sortEls[i].className = '';		
				}
			}
			
			Sbi.trace("[DatasetsBrowserPanel.setSortControl]: sort control succesfully set");
		}
		Sbi.trace("[DatasetsBrowserPanel.setSortControl]: OUT");
	}
	
	, resetSortControl: function() {
		Sbi.trace("[DatasetsBrowserPanel.resetSortControl]: IN");
		this.setSortControl(null);
		Sbi.trace("[DatasetsBrowserPanel.resetSortControl]: OUT");
	}
	
	

	// -----------------------------------------------------------------------------------------------------------------
    // General utils
	// -----------------------------------------------------------------------------------------------------------------
		
	, onClick : function(obj, i, node, e) {
		Sbi.trace("[DatasetsBrowserPanel.onClick]: IN");
		
		 var store = obj.getStore();
		 var record = store.getAt(store.findExact('label',node.id));
		 if (record){
			 record = record.data;
		 }
		 var clickedDatasetLabel = record.label;
		 Sbi.trace("[DatasetsBrowserPanel.onClick]: clicked dataset label is equal to [" + clickedDatasetLabel + "]");
		 Sbi.trace("[DatasetsBrowserPanel.onClick]: selected dataset label is equal to [" + this.selectedDatasetLabel + "]");
		 
		 
		 if (clickedDatasetLabel == this.selectedDatasetLabel){  // it's an unselect
			 var deleteStoreFromWidgetContainer = false;
    		 var nWidgetsForDS = this.widgetManager.getWidgetUsedByStore(clickedDatasetLabel).getCount();
    		 Sbi.trace("[DatasetsBrowserPanel.onClick]: dataset [" + clickedDatasetLabel + "] is used by [" + nWidgetsForDS + "] widgets");
    		 if(nWidgetsForDS === 1) { // it is used only by this widget
	    		deleteStoreFromWidgetContainer = true;
	    	 }
	    	 
    		 this.resetSelection();
    		 
	    	 if (deleteStoreFromWidgetContainer === true){
	    		 Sbi.trace("[DatasetsBrowserPanel.onClick]: remove dataset from [" + clickedDatasetLabel + "] container");
	    		 this.widgetManager.removeStore(clickedDatasetLabel);
	    	 }		     
	     } else {	   
	    	 this.select(clickedDatasetLabel, true);
	     }
		 
		 Sbi.trace("[DatasetsBrowserPanel.onClick]: OUT");

    	 return true;
	}

	

		
});
