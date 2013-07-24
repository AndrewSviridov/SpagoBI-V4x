/** SpagoBI, the Open Source Business Intelligence suite

 * Copyright (C) 2012 Engineering Ingegneria Informatica S.p.A. - SpagoBI Competency Center
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0, without the "Incompatible With Secondary Licenses" notice. 
 * If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/. **/
 
  
 
  
 
  

/**
 * Object name 
 * 
 * 
 * Public Properties
 * 
 * [list]
 * 
 * 
 * Public Methods
 * 
 *  [list]
 * 
 * 
 * Public Events
 * 
 *  [list]
 * 
 * Authors
 * 
 * - Marco Cortella (marco.cortella@eng.it)
 */

Ext.define('Sbi.tools.dataset.ValidateDatasetGrid', {
    extend: 'Sbi.widgets.grid.DynamicGridPanel'

	, constructor: function(config) {
		
		thisPanel = this;
		Ext.QuickTips.init();

		var defaultConf = {
				//pagingConfig:{}, 
				storeConfig:{ pageSize: 10, dataRoot : "rows"}	};
		this.title =  "Dataset Validation";
		//this.filterConfig={};
		this.border = true;
		//this.region = 'south';
        this.height = 350;
        this.width = '100%';
        this.autoscroll =  true;
        
        this.firedValidationErrorFound = false;

		//defaultConf = Ext.apply( defaultConf,config ||{} );
        defaultConf.params = config;
        defaultConf.usePost = true;
		Ext.apply(this,defaultConf);
		
		Sbi.debug('ValidateDatasetGrid costructor IN');
		
		defaultConf.serviceUrl =  Sbi.config.serviceRegistry.getRestServiceUrl({
			serviceName: 'selfservicedataset/getDataStore'
			//,baseParams: config
			,baseParams: {}
    	});
		
		/*
      	this.viewConfig = {
      	        getRowClass: function(record, index) {
      	            var c = record.get('column_1'); //example
      	            var parent = thisPanel;
      	            
      	            var validationErrors = thisPanel.store.getValidationErrors();
      	            if ((validationErrors != null) && (validationErrors != undefined)){
          	            for (var i=0; i<validationErrors.length; i++) {
             	        	 if (validationErrors[i].id == index){
             	        		return 'custom-error';
             	        	 }
             	           }
      	            }
      	           

      	        }
      	};
      	*/
      	
      	Ext.util.Format.myRenderer = function(value,metaData,record,rowIndex,colIndex)�{

      		var validationErrors = thisPanel.store.getValidationErrors();�
      		if ((validationErrors != null) && (validationErrors != undefined)){
  	            for (var i=0; i<validationErrors.length; i++) {
     	        	 if (validationErrors[i].id == rowIndex){
     	        		var val = validationErrors[i];
     	        		 for(j in val){

     	        	       var sub_key = j;
     	        	       var sub_val = val[j];
     	        	       var cIndex = sub_key.replace("column_","")
     	        	       if (cIndex == colIndex){
     	     	        		metaData.tdCls = 'custom-error';
     	     	        		metaData.tdAttr = 'data-qtip="'+sub_val+'"';
     	     	        		
     	     	        		if (!thisPanel.firedValidationErrorFound){
         	     	        		this.fireEvent('validationErrorFound');
         	     	        		thisPanel.firedValidationErrorFound = true;
     	     	        		}
     	     	        		

     	        	       }

     	        	    } 

     	        	 }
     	           }
	            }

      		��
      		return value;
      	}
    	
    	this.callParent([defaultConf]);
		this.addEvents('validationErrorFound');	

    	this.store.on('load',function(){this.fireEvent('storeLoad')},this);
    	Sbi.debug('ValidateDatasetGrid costructor OUT');
    }
	


    
	
});