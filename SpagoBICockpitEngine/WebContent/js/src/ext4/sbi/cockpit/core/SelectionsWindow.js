/** SpagoBI, the Open Source Business Intelligence suite

 * Copyright (C) 2012 Engineering Ingegneria Informatica S.p.A. - SpagoBI Competency Center
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0, without the "Incompatible With Secondary Licenses" notice. 
 * If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/. **/


Ext.define('Sbi.cockpit.core.SelectionsWindow', {
	extend: 'Ext.Window'
	, layout:'fit'

	, config:{
		title: LN('sbi.cockpit.core.selections.title')				   
		, width: 400
		, height: 250
		, closable: true
		, closeAction: 'destroy'
		, modal: true	
	}
	

	/**
	 * @property {Sbi.cockpit.core.SelectionsPanel} editorMainPanel
	 *  Container of the selections panel
	 */
	, selectionsPanel: null
	
	, constructor : function(config) {
		Sbi.trace("[SelectionsWindow.constructor]: IN");
		this.initConfig(config);
		this.init(config);
		this.callParent(arguments);
		Sbi.trace("[SelectionsWindow.constructor]: OUT");
	}
	
	, initComponent: function() {
  
        Ext.apply(this, {
            items: [this.selectionsPanel]
          , buttons: [
 		         {
 		            id: 'cancel'
 		        	  , text: LN('sbi.ds.wizard.close') 		        	  
 		        	  , handler: this.onCancel
 		        	  , scope: this
 		          }
 		     ]
        });
        
        this.callParent();
    }
	
	// -----------------------------------------------------------------------------------------------------------------
    // public methods
	// -----------------------------------------------------------------------------------------------------------------

	
	
	// -----------------------------------------------------------------------------------------------------------------
    // init methods
	// -----------------------------------------------------------------------------------------------------------------

	, init: function(c){
		Sbi.trace("[SelectionsWindow.init]: IN");		
		
		this.selectionsPanel = Ext.create('Sbi.cockpit.core.SelectionsPanel', {
			widgetManager: c.widgetManager
		});
		this.selectionsPanel.on('cancel', this.onCancel, this);
		
		Sbi.trace("[SelectionsWindow.init]: OUT");
	}
	
	, initEvents: function() {
		this.addEvents(
			/**
			* @event indicatorsChanged
			* Fires when data inserted in the wizard is canceled by the user
			* @param {AssociationEditorWizard} this
			*/
			'cancel'
		);
	}
	
	
	// -----------------------------------------------------------------------------------------------------------------
    // utility methods
	// -----------------------------------------------------------------------------------------------------------------
	
	, onCancel: function(){
		this.fireEvent("cancel", this);
	}	
});
