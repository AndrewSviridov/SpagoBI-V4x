/** SpagoBI, the Open Source Business Intelligence suite

 * Copyright (C) 2012 Engineering Ingegneria Informatica S.p.A. - SpagoBI Competency Center
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0, without the "Incompatible With Secondary Licenses" notice. 
 * If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/. **/
 
Ext.ns("Sbi.settings");

Sbi.settings.cockpit = {
		
	
};


Sbi.settings.mydata = {
		/**
		 * This options will set the default active
		 * filter used the first time the MyData page is opened
		 * Possibile values are:
		 * -'MyDataSet'
		 * -'EnterpriseDataSet'
		 * -'SharedDataSet'
		 * -'AllDataSet'
		 * 
		 * Make attention that the default filter selected must be 
		 * a visible filter, so for example if 
		 * defaultFilter:'MyDataSet'
		 * showMyDataSetFilter must be true
		 */
		  defaultFilter: 'UsedDataSet'
		
		, showUsedDataSetFilter: true
		, showMyDataSetFilter: true
		, showEnterpriseDataSetFilter: true
		, showSharedDataSetFilter: true
		, showAllDataSetFilter: true
		/**
		 * MY DATA :
		 * put false for previous behavior (all USER public ds + owned)
		 * put true for showing only owned datasets
		 */
		, showOnlyOwner: true
		/**
		 * Visibility of MyData tabs
		 */
		, showDataSetTab: true
		, showModelsTab: false
		/**
		 * Visibility of MyData TabToolbar (this hide the whole tab toolbar)
		 */
		, showTabToolbar: true
	};