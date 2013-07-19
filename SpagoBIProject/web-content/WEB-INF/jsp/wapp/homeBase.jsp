<%-- SpagoBI, the Open Source Business Intelligence suite

Copyright (C) 2012 Engineering Ingegneria Informatica S.p.A. - SpagoBI Competency Center
This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0, without the "Incompatible With Secondary Licenses" notice. 
If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/. --%>
<%@page import="it.eng.spagobi.commons.utilities.UserUtilities"%>
<%@page import="org.json.JSONObject"%>
<%@page language="java" 
	contentType="text/html; charset=ISO-8859-1" pageEncoding="ISO-8859-1"
		import="it.eng.spago.base.*,
                 java.util.List,
                 java.util.ArrayList"%>
<%@page import="it.eng.spagobi.commons.utilities.ChannelUtilities"%>
<%@page import="it.eng.spagobi.commons.services.LoginModule"%>
<%@page import="it.eng.spagobi.wapp.util.MenuUtilities"%>
<%@page import="it.eng.spagobi.commons.serializer.MenuThemesListJSONSerializer"%>
<%@page import="it.eng.spagobi.wapp.services.DetailMenuModule"%>
<%@page import="it.eng.spagobi.wapp.bo.Menu"%>
<%@page import="org.json.JSONArray"%>
<%@page import="it.eng.spagobi.commons.constants.ObjectsTreeConstants"%>
<%@page import="it.eng.spagobi.commons.serializer.MenuListJSONSerializer"%>
<%@page import="java.net.URLEncoder"%>
<%@page import="org.apache.log4j.Logger"%>
<%@page import="it.eng.spagobi.services.common.SsoServiceInterface"%>

<%!private static transient Logger logger = Logger.getLogger("it.eng.spagobi.home_jsp");%>

<%@ include file="/WEB-INF/jsp/commons/portlet_base410.jsp"%>
<%@ include file="/WEB-INF/jsp/commons/importSbiJS410.jspf"%>
    
<script type="text/javascript">
    Ext.BLANK_IMAGE_URL = '/SpagoBI/js/lib/ext-4.1.1a/resources/themes/images/default/tree/s.gif';
</script>

<%
	String contextName = ChannelUtilities.getSpagoBIContextName(request);
	SourceBean moduleResponse = (SourceBean)aServiceResponse.getAttribute("LoginModule"); 
	boolean isTechnicalUser = UserUtilities.isTechnicalUser(userProfile);
	
	if(moduleResponse==null) moduleResponse=aServiceResponse;
	
	List lstMenu = new ArrayList();
	
	if (moduleResponse.getAttribute(MenuUtilities.LIST_MENU) != null){
		lstMenu = (List)moduleResponse.getAttribute(MenuUtilities.LIST_MENU);
	}
	List filteredMenuList = MenuUtilities.filterListForUser(lstMenu, userProfile);
	MenuListJSONSerializer serializer = new MenuListJSONSerializer(userProfile);
	JSONArray jsonMenuList = (JSONArray) serializer.serialize(filteredMenuList,locale);
	//System.out.println(jsonMenuList);
%>
<%-- Javascript object useful for session expired management (see also sessionExpired.jsp) --%>
<script>
sessionExpiredSpagoBIJS = 'sessionExpiredSpagoBIJS';
</script>
<%-- End javascript object useful for session expired management (see also sessionExpired.jsp) --%>
<!-- I want to execute if there is an homepage, only for user!-->
<%

	String characterEncoding = response.getCharacterEncoding();
	if (characterEncoding == null) {
		logger.warn("Response characterEncoding not found!!! Using UTF-8 as default.");
		characterEncoding = "UTF-8";
	}
    String firstUrlToCall = "";
	// if a document or a dataset execution is required, execute it
	if (aServiceRequest.getAttribute(ObjectsTreeConstants.OBJECT_LABEL) != null || aServiceRequest.getAttribute(ObjectsTreeConstants.DATASET_LABEL) != null) {
        StringBuffer temp = new StringBuffer();	
		// dcument execution case
		if(aServiceRequest.getAttribute(ObjectsTreeConstants.OBJECT_LABEL) != null){
			String label = (String) aServiceRequest.getAttribute(ObjectsTreeConstants.OBJECT_LABEL);
			   String subobjectName = (String) aServiceRequest.getAttribute(SpagoBIConstants.SUBOBJECT_NAME);
		

			   temp.append(contextName + "/servlet/AdapterHTTP?ACTION_NAME=EXECUTE_DOCUMENT_ACTION&");
			   temp.append(ObjectsTreeConstants.OBJECT_LABEL + "=" + label);
			   if (subobjectName != null && !subobjectName.trim().equals("")) {
				   temp.append("&" + SpagoBIConstants.SUBOBJECT_NAME + "=" + URLEncoder.encode(subobjectName, characterEncoding));
				   }
		}
	    // dataset execution case
		else{  
	         String datasetLabel = (String) aServiceRequest.getAttribute(ObjectsTreeConstants.DATASET_LABEL);
             String engine = (String) aServiceRequest.getAttribute(ObjectsTreeConstants.ENGINE);
             temp.append(contextName + "/servlet/AdapterHTTP?ACTION_NAME=SELECT_DATASET_ACTION&");
             temp.append(ObjectsTreeConstants.DATASET_LABEL + "=" + datasetLabel+"&");
             temp.append(ObjectsTreeConstants.ENGINE + "=" + engine);
		}
	    
	    // propagates other request parameters than PAGE, NEW_SESSION, OBJECT_LABEL and SUBOBJECT_NAME
	    Enumeration parameters = request.getParameterNames();
	    while (parameters.hasMoreElements()) {
	    	String aParameterName = (String) parameters.nextElement();
	    	if (aParameterName != null 
	    			&& !aParameterName.equalsIgnoreCase("PAGE") && !aParameterName.equalsIgnoreCase("NEW_SESSION") 
	    			&& !aParameterName.equalsIgnoreCase(ObjectsTreeConstants.OBJECT_LABEL)
        	    	&& !aParameterName.equalsIgnoreCase(SpagoBIConstants.SUBOBJECT_NAME) 
                    && !aParameterName.equalsIgnoreCase(ObjectsTreeConstants.DATASET_LABEL) 
                    && !aParameterName.equalsIgnoreCase(ObjectsTreeConstants.ENGINE) 
        	    	&& request.getParameterValues(aParameterName) != null) {
	    		String[] values = request.getParameterValues(aParameterName);
	    		
	    		for (int i = 0; i < values.length; i++) {
	    			temp.append("&" + URLEncoder.encode(aParameterName, characterEncoding) + "=" 
	    					+ URLEncoder.encode(values[i], characterEncoding));
	    		}
	    	}
	    }
	    
		firstUrlToCall = temp.toString();
		
	} else {
	
		if (filteredMenuList.size() > 0) {
			//DAO method returns menu ordered by parentId, but null values are higher or lower on different database:
			//PostgreSQL - Nulls are considered HIGHER than non-nulls.
			//DB2 - Higher
			//MSSQL - Lower
			//MySQL - Lower
			//Oracle - Higher
			//Ingres - Higher
			// so we must look for the first menu item with null parentId
			Menu firtsItem = null;
			Iterator it = filteredMenuList.iterator();
			while (it.hasNext()) {
				Menu aMenuElement = (Menu) it.next();
				if (aMenuElement.getParentId() == null) {
					firtsItem = aMenuElement;
					break;
				}
			}
			String pathInit=MenuUtilities.getMenuPath(firtsItem, locale);
			Integer objId=firtsItem.getObjId();
			
			if(objId!=null){
				firstUrlToCall = contextName+"/servlet/AdapterHTTP?ACTION_NAME=MENU_BEFORE_EXEC&MENU_ID="+firtsItem.getMenuId();
			}else if(firtsItem.getStaticPage()!=null){
				firstUrlToCall = contextName+"/servlet/AdapterHTTP?ACTION_NAME=READ_HTML_FILE&MENU_ID="+firtsItem.getMenuId();
			}else if(firtsItem.getFunctionality()!=null){
				firstUrlToCall = DetailMenuModule.findFunctionalityUrl(firtsItem, contextName);
			}else if(firtsItem.getExternalApplicationUrl()!=null && !firtsItem.getExternalApplicationUrl().equals("")){
				firstUrlToCall = firtsItem.getExternalApplicationUrl();
				if (!GeneralUtilities.isSSOEnabled()) {
					if (firstUrlToCall.indexOf("?") == -1) {
						firstUrlToCall += "?" + SsoServiceInterface.USER_ID + "=" + userUniqueIdentifier;
					} else {
						firstUrlToCall += "&" + SsoServiceInterface.USER_ID + "=" + userUniqueIdentifier;
					}
				}
			} else {
				if(isTechnicalUser){
					firstUrlToCall = contextName+"/themes/" + currTheme + "/html/technicalUserIntro.html";	
				}else{
					firstUrlToCall = contextName+"/themes/" + currTheme + "/html/finalUserIntro.html";
				}
				
			}
		} else{
			if(isTechnicalUser){
				firstUrlToCall = contextName+"/themes/" + currTheme + "/html/technicalUserIntro.html";	
			}else{
				firstUrlToCall = contextName+"/themes/" + currTheme + "/html/finalUserIntro.html";
			}
		}
		
	}
	
	String action = (String)aServiceRequest.getAttribute("ACTION_NAME");
 %>
 
<script type="text/javascript" src='<%=urlBuilder.getResourceLink(request, "/js/src/ext4/sbi/wapp/HomeBase.js")%>'></script> 
<%--
 <%if (action != null && action.indexOf("START_ACTION_PUBLIC_USER")>=0) {%>
  	<%@ include file="/themes/sbi_default/jsp/publicUserHome.jsp"%>
 <%}else{ %>
	 <%@ include file="/themes/sbi_default/jsp/home.jsp"%>
 <%}%>	
 
 <%if (action != null && action.indexOf("START_ACTION_PUBLIC_USER")>=0) {%>
  	<%@ include file="/themes/geobi/jsp/publicUserHome.jsp"%>
 <%}else{ %>
	 <%@ include file="/themes/geobi/jsp/home.jsp"%>
 <%}%>	
 --%>
<%if (action != null && action.indexOf("START_ACTION_PUBLIC_USER")>=0) {%>
  	<%@ include file="/themes/geobi/jsp/publicUserHome.jsp"%>
 <%}else if (isTechnicalUser){ %>
 	 <%@ include file="/themes/geobi/jsp/adminHome.jsp"%>
 <%}else{ %>
	 <%@ include file="/themes/geobi/jsp/userHome.jsp"%>
 <%}%>	
 

