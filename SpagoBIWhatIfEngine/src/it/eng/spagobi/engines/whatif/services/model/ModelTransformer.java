/* SpagoBI, the Open Source Business Intelligence suite

 * Copyright (C) 2012 Engineering Ingegneria Informatica S.p.A. - SpagoBI Competency Center
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0, without the "Incompatible With Secondary Licenses" notice. 
 * If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/**
 * @author Alberto Ghedin (alberto.ghedin@eng.it)
 * 
 * @class ModelTransformer
 * 
 * Services that manage the model:
 * <ul>
 * <li>/model/mdx/{mdx}: executes the mdx query</li>
 * </ul>
 * 
 */
package it.eng.spagobi.engines.whatif.services.model;

import it.eng.spagobi.engines.whatif.WhatIfEngineInstance;
import it.eng.spagobi.engines.whatif.services.common.AbstractRestService;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;

import org.apache.log4j.Logger;

import com.eyeq.pivot4j.PivotModel;

@Path("/model")
public class ModelTransformer extends AbstractRestService {
	
	public static transient Logger logger = Logger.getLogger(ModelTransformer.class);
	
	/**
	 * Executes the mdx query. If the mdx is null it executes the query of the model
	 * @param mdx the query to execute
	 * @return the htm table representing the cellset
	 */
	@GET
	@Path("/mdx/{mdx}")
	public String executeSimpleQuery(@PathParam("mdx") String mdx){
		logger.debug("IN");
		WhatIfEngineInstance ei = getWhatIfEngineInstance();
		PivotModel model = ei.getPivotModel();
		
		if(!isNullOrEmpty(mdx)){
			logger.debug("Updating the query in the model");
			model.setMdx(mdx);
		}else{
			logger.debug("No query found");
		}
		
		
		String table = renderModel(model);
		logger.debug("OUT");
		return table;
		
	}
}
