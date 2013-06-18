/** SpagoBI, the Open Source Business Intelligence suite
 * Copyright (C) 2012 Engineering Ingegneria Informatica S.p.A. - SpagoBI Competency Center
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0, without the "Incompatible With Secondary Licenses" notice. 
 * If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/. **/

/**
 * 
 * This class is the container for the ad-hoc reporting interface 
 *    
 *  @author
 *  Alberto Ghedin (alberto.ghedin@eng.it)
 *  Davide Zerbetto (davide.zerbetto@eng.it)
 */
 
  
Ext.define('Sbi.adhocreporting.AdhocreportingTabsPanel', {
	extend: 'Ext.tab.Panel',

    config: {
    	executionPanel: null,
    	datasetsServicePath : ''
    },
	

	/**
	 * @property {Panel} datasetPanelTab
	 *  Tab panel that contains the datasets
	 */
	datasetPanelTab: null,
	
	/**
	 * @property {Panel} modelstPanelTab
	 *  Tab panel that contains the models
	 */
	modelstPanelTab: null
	
	
	, constructor : function(config) {
		this.initConfig(config);
		
		this.layout = 'fit';
		
		var browserConf = {
				title: LN("sbi.tools.dataset.datasetbrowser.title")
				, user: Sbi.user.userId
				, datasetsServicePath : config.datasetsServicePath
				, displayToolbar : false
		};
		this.datasetPanelTab = Ext.create('Sbi.tools.dataset.DataSetsBrowser', browserConf );
		this.modelstPanelTab = Ext.create('Sbi.tools.model.MetaModelsBrowser',{title: LN("sbi.tools.model.metamodelsbrowser.title")});
		
		this.items = [ this.datasetPanelTab, this.modelstPanelTab  ];

		this.callParent(arguments);
		this.addEvents(
		        /**
		         * @event event1
		         * Execute the qbe clicking in the model/dataset
				 * @param {Object} docType engine to execute 'QBE'/'WORKSHEET'
				 * @param {Object} inputType 'DATASET'/'MODEL'
				 * @param {Object} record the record that contains all the information of the metamodel/dataset
		         */
		        'executeDocument'
				);
		this.modelstPanelTab.on('executeDocument',function(docType, inputType, record){
			this.fireEvent('executeDocument',docType,inputType,record);
		},this);
		this.datasetPanelTab.on('executeDocument',function(docType, inputType, record){
			this.fireEvent('executeDocument',docType,inputType,record);
		},this);
	}

    
	
});