/* SpagoBI, the Open Source Business Intelligence suite

 * Copyright (C) 2012 Engineering Ingegneria Informatica S.p.A. - SpagoBI Competency Center
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0, without the "Incompatible With Secondary Licenses" notice. 
 * If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/. */
package it.eng.spagobi.engines.whatif.template;

import java.util.HashMap;
import java.util.List;


/**
 * @author Zerbetto Davide (davide.zerbetto@eng.it)
 */
public class WhatIfTemplate {

	private String mondrianSchema;
	private String mdxQuery;
	private String mondrianMdxQuery;
	private HashMap<String, Object> properties;
	private List<Parameter> parameters;
		
	public WhatIfTemplate() {
		properties = new HashMap<String, Object>();
	}

	public void setProperty(String pName, Object pValue) {
		properties.put(pName, pValue);
	}
	
	public Object getProperty(String pName) {
		return properties.get(pName);
	}

	public String getMondrianSchema() {
		return mondrianSchema;
	}

	public void setMondrianSchema(String mondrianSchema) {
		this.mondrianSchema = mondrianSchema;
	}

	public String getMdxQuery() {
		return mdxQuery;
	}

	public void setMdxQuery(String mdxQuery) {
		this.mdxQuery = mdxQuery;
	}

	public String getMondrianMdxQuery() {
		return mondrianMdxQuery;
	}

	public void setMondrianMdxQuery(String mondrianMdxQuery) {
		this.mondrianMdxQuery = mondrianMdxQuery;
	}
	
	public List<Parameter> getParameters() {
		return parameters;
	}

	public void setParameters(List<Parameter> parameters) {
		this.parameters = parameters;
	}
	
	public class Parameter {
		private String name;
		private String alias;
		
		public String getName() {
			return name;
		}
		public void setName(String name) {
			this.name = name;
		}
		public String getAlias() {
			return alias;
		}
		public void setAlias(String alias) {
			this.alias = alias;
		}
		
	}
	
}
