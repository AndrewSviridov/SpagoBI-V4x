/* SpagoBI, the Open Source Business Intelligence suite

 * Copyright (C) 2012 Engineering Ingegneria Informatica S.p.A. - SpagoBI Competency Center
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0, without the "Incompatible With Secondary Licenses" notice. 
 * If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/. */


package it.eng.qbe.statement;

import it.eng.qbe.datasource.jpa.IJpaDataSource;
import it.eng.qbe.model.accessmodality.IModelAccessModality;
import it.eng.qbe.model.structure.IModelEntity;
import it.eng.qbe.model.structure.IModelField;
import it.eng.qbe.model.structure.IModelStructure;
import it.eng.qbe.model.structure.ModelStructure.RootEntitiesGraph.Relationship;
import it.eng.qbe.query.ExpressionNode;
import it.eng.qbe.query.Filter;
import it.eng.qbe.query.Query;
import it.eng.qbe.query.WhereField;
import it.eng.qbe.statement.jpa.JPQLStatementConditionalOperators;
import it.eng.spagobi.utilities.StringUtils;
import it.eng.spagobi.utilities.assertion.Assert;

import java.io.IOException;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import javax.persistence.EntityManager;
import javax.persistence.metamodel.BasicType;
import javax.persistence.metamodel.EmbeddableType;
import javax.persistence.metamodel.EntityType;
import javax.persistence.metamodel.Metamodel;
import javax.persistence.metamodel.SingularAttribute;
import javax.persistence.metamodel.Type;

import org.apache.log4j.Logger;

/**

 * @author Alberto Ghedin (alberto.ghedin@eng.it)
 *
 */

public abstract class AbstractStatementWhereClause extends AbstractStatementFilteringClause {

	
	public static final String WHERE = "WHERE";
	
	public static transient Logger logger = Logger.getLogger(AbstractStatementWhereClause.class);

	/**
	 * Builds the where clause part of the statement. If something goes wrong during the build process a
	 * StatementCompositionException will be thrown
	 *
	 * @param query The target query
	 * @param entityAliasesMaps Contains an alias to entity map for each query build so far.
	 * 
	 * @return a string representing in JPQL format the where clause part of the statement. 
	 * 			It never returns null. If the target query have no filtering conditions it 
	 * 			returns an empty String
	 */
	public String buildClause(Query query, Map<String, Map<String, String>> entityAliasesMaps) {
		
		StringBuffer buffer;

		buffer = new StringBuffer();
		
		logger.debug("IN");
		
		try {
			addUserProvidedConditions(buffer, query, entityAliasesMaps);
			addProfilingConditions(buffer, query, entityAliasesMaps);
//			addJoinConditions(buffer, query, entityAliasesMaps);
		} catch(Throwable t) {
			throw new StatementCompositionException("Impossible to build where clause", t);
		} finally {
			logger.debug("OUT");
		}
	
		return buffer.toString().trim();
	}
	
	private StringBuffer addCondition(StringBuffer buffer, String condition) {
		if(condition != null) {
			if(buffer.toString().trim().length() > 0) {
				buffer.append(" AND ");
			} else {
				buffer.append(" " + WHERE + " ");
			}
			buffer.append(condition + " ");
		}
		
		return buffer;
	}
	
	/**
	 * Add where conditions explicitly defined by user
	 * 
	 * @param buffer Contains the part of where clause build so far
	 * @param query The target query
	 * @param entityAliasesMaps Contains an alias to entity map for each query build so far.
	 * 
	 * @return Appends to the where clause build so far all the conditions explicitly defined by user and returns it
	 */
	private StringBuffer addUserProvidedConditions(StringBuffer buffer, Query query, Map entityAliasesMaps) {
		ExpressionNode filterExp = query.getWhereClauseStructure(); 
		if (filterExp  != null){
			String userProvidedConditions = buildUserProvidedConditions(filterExp, query, entityAliasesMaps);
			addCondition(buffer, userProvidedConditions);
		}
		
		return buffer;
	}
	
	private String buildUserProvidedConditions( ExpressionNode filterExp, Query query, Map entityAliasesMaps) {		
		StringBuffer buffer = new StringBuffer();
		
		String type = filterExp.getType();
		if("NODE_OP".equalsIgnoreCase( type )) {
			for(int i = 0; i < filterExp.getChildNodes().size(); i++) {
				ExpressionNode child = (ExpressionNode)filterExp.getChildNodes().get(i);
				String childStr = buildUserProvidedConditions(child, query, entityAliasesMaps);
				if("NODE_OP".equalsIgnoreCase( child.getType() )) {
					childStr = "(" + childStr.toString() + ")";
				}
				buffer.append( (i==0? "": " " + filterExp.getValue()) );
				buffer.append(" " + childStr.toString() );
			}
		} else {
			WhereField whereField = query.getWhereFieldByName( filterExp.getValue() );
			buffer.append(buildUserProvidedCondition(whereField, query, entityAliasesMaps));
		}
		
		return buffer.toString().trim();
	}
	
	private String buildUserProvidedCondition(WhereField whereField, Query query, Map entityAliasesMaps) {
		
		StringBuffer buffer;
		String whereClauseElement = "";
		String[] rightOperandElements;
		String[] leftOperandElements;
				
		logger.debug("IN");
		
		buffer = new StringBuffer();
		try {
			IConditionalOperator conditionalOperator = null;
			conditionalOperator = (IConditionalOperator)JPQLStatementConditionalOperators.getOperator( whereField.getOperator() );
			Assert.assertNotNull(conditionalOperator, "Unsopported operator " + whereField.getOperator() + " used in query definition");
			
		
			if(whereField.getLeftOperand().type.equalsIgnoreCase(AbstractStatement.OPERAND_TYPE_INLINE_CALCULATED_FIELD)) {
				whereClauseElement = buildInLineCalculatedFieldClause(whereField.getOperator(), whereField.getLeftOperand(), whereField.isPromptable(), whereField.getRightOperand(), query, entityAliasesMaps, conditionalOperator);
			} else {
				
				leftOperandElements = buildOperand(whereField.getLeftOperand(), query, entityAliasesMaps);
				
				if (parentStatement.OPERAND_TYPE_STATIC.equalsIgnoreCase(whereField.getRightOperand().type) && whereField.isPromptable()) {
					// get last value first (the last value edited by the user)
					rightOperandElements = whereField.getRightOperand().lastValues;
				} else {
					rightOperandElements = buildOperand(whereField.getRightOperand(), query, entityAliasesMaps);
				}
				
				
				if (parentStatement.OPERAND_TYPE_STATIC.equalsIgnoreCase(whereField.getLeftOperand().type) )  {
					leftOperandElements = getTypeBoundedStaticOperand(whereField.getRightOperand(), whereField.getOperator(), leftOperandElements);
				}				
				if (parentStatement.OPERAND_TYPE_STATIC.equalsIgnoreCase(whereField.getRightOperand().type) )  {
					rightOperandElements = getTypeBoundedStaticOperand(whereField.getLeftOperand(), whereField.getOperator(), rightOperandElements);
				}
				
				whereClauseElement = conditionalOperator.apply(leftOperandElements[0], rightOperandElements);
			}
			
			logger.debug("where element value [" + whereClauseElement + "]");
		} finally {
			logger.debug("OUT");
		}
		
		buffer.append(whereClauseElement);
		
		//addCondition(buffer, whereClauseElement);
		
		return  buffer.toString().trim();
	}
	
	private StringBuffer addProfilingConditions(StringBuffer buffer, Query query, Map entityAliasesMaps) {
		Map<String, String> entityAliases;
		
		entityAliases = (Map<String, String>)entityAliasesMaps.get(query.getId());
				
		for(String entityUniqueName : entityAliases.keySet()){
			addProfilingConditionsOnEntity(buffer, entityUniqueName, query, entityAliasesMaps);
			addProfilingConditionsOnSubEntity(buffer, entityUniqueName, query, entityAliasesMaps);			
		}
		
		return buffer;
	}
	
	private StringBuffer addProfilingConditionsOnEntity(StringBuffer buffer, String entityUniqueName, Query query, Map entityAliasesMaps) {
		
		IModelStructure dataMartModelStructure;
		IModelAccessModality dataMartModelAccessModality;
		Map<String, String> entityAliases;
		
		entityAliases = (Map<String, String>)entityAliasesMaps.get(query.getId());
		dataMartModelStructure = parentStatement.getDataSource().getModelStructure();
		dataMartModelAccessModality = parentStatement.getDataSource().getModelAccessModality();
		
		IModelEntity entity = dataMartModelStructure.getEntity( entityUniqueName );
		List<Filter> filters = dataMartModelAccessModality.getEntityFilterConditions(entity.getType());
		
		if(filters == null || filters.isEmpty())return buffer;
		
		for(Filter filter: filters) {
			Set fields = filter.getFields();
			Properties props = new Properties();
			Iterator fieldIterator = fields.iterator();
			while(fieldIterator.hasNext()) {
				String fieldName = (String)fieldIterator.next();
				String entityAlias = (String)entityAliases.get(entityUniqueName);
				props.put(fieldName, entityAlias + "." + fieldName);
			}
			String filterCondition = null;
			try {
				filterCondition = StringUtils.replaceParameters(filter.getFilterCondition(), "F", props);
			} catch (IOException e) {
				e.printStackTrace();
			}
			
			addCondition(buffer, filterCondition);
		}
		
		return buffer;
	}
	
	private StringBuffer addProfilingConditionsOnSubEntity(StringBuffer buffer, String entityUniqueName, Query query, Map entityAliasesMaps) {
		
		IModelStructure dataMartModelStructure;
		IModelAccessModality dataMartModelAccessModality;
		Map<String, String> entityAliases;
		
		entityAliases = (Map<String, String>)entityAliasesMaps.get(query.getId());
		
		dataMartModelStructure = parentStatement.getDataSource().getModelStructure();
		dataMartModelAccessModality = parentStatement.getDataSource().getModelAccessModality();
		
		IModelEntity entity = dataMartModelStructure.getEntity( entityUniqueName );
		List filters = dataMartModelAccessModality.getEntityFilterConditions(entity.getType());
		
		if(dataMartModelAccessModality.getRecursiveFiltering() == null 
				|| dataMartModelAccessModality.getRecursiveFiltering().booleanValue() == true) {
			//	check for condition filter on sub entities
			List subEntities = entity.getAllSubEntities();
			for(int i = 0; i < subEntities.size(); i++) {
				IModelEntity subEntity = (IModelEntity)subEntities.get(i);
				filters = dataMartModelAccessModality.getEntityFilterConditions(subEntity.getType());
				for(int j = 0; j < filters.size(); j++) {
					Filter filter = (Filter)filters.get(j);
					Set fields = filter.getFields();
					Properties props = new Properties();
					Iterator fieldIterator = fields.iterator();
					while(fieldIterator.hasNext()) {
						String fieldName = (String)fieldIterator.next();
						IModelField filed = null;
						Iterator subEntityFields = subEntity.getAllFields().iterator();
						while(subEntityFields.hasNext()) {
							filed = (IModelField)subEntityFields.next();
							if(((String)filed.getQueryName().getFirst()).endsWith("." + fieldName)) break;
						}
						String entityAlias = (String)entityAliases.get(entityUniqueName);
						props.put(fieldName, entityAlias + "." + filed.getQueryName().getFirst());
					}
					
					String filterCondition = null;
					try {
						filterCondition = StringUtils.replaceParameters(filter.getFilterCondition(), "F", props);
					} catch (IOException e) {
						e.printStackTrace();
					}
					
					addCondition(buffer, filterCondition);
				}
			}
		}
	
	
		return buffer;
	}
	
	/*
	private StringBuffer addJoinConditions(StringBuffer buffer, Query query, Map entityAliasesMaps) {
	
		Map<String, String> entityAliases;
		
		entityAliases = (Map<String, String>)entityAliasesMaps.get(query.getId());
		
		try {
			Map<String, Set<String>> viewToInnerEntitiesMap = new HashMap<String, Set<String>>();
			List<ISelectField> selectFields =  query.getSelectFields(true);
			for(ISelectField selectField : selectFields) {
				if(selectField.isSimpleField()){
					SimpleSelectField dataMartSelectField = (SimpleSelectField)selectField;
					IModelField modelField = parentStatement.getDataSource().getModelStructure().getField(dataMartSelectField.getUniqueName());
					List<ModelViewEntity> viewEntities = modelField.getParentViews();
					if(viewEntities!=null){
						for(ModelViewEntity viewEntity : viewEntities) {
							if( !viewToInnerEntitiesMap.containsKey( viewEntity.getUniqueName() ) ) {
								viewToInnerEntitiesMap.put(viewEntity.getUniqueName(), new HashSet<String>());
							}
							Set innerEntities = (Set)viewToInnerEntitiesMap.get( viewEntity.getUniqueName());
							innerEntities.add(modelField.getParent().getUniqueName());
						}
					}				
				}
			}
			
			// per il momento metto le join anche se non ce n'� bisogno
			for(String viewName : viewToInnerEntitiesMap.keySet()) {
				ModelViewEntity view = (ModelViewEntity)parentStatement.getDataSource().getModelStructure().getEntity( viewName );
				List<Join> joins = view.getJoins();
				for(Join join : joins) {
					IConditionalOperator conditionalOperator = null;
					conditionalOperator = (IConditionalOperator)JPQLStatementConditionalOperators.getOperator( CriteriaConstants.EQUALS_TO );
					
					String sourceEntityAlias = (String)entityAliases.get(join.getSourceEntity().getUniqueName());
					if(sourceEntityAlias == null) {
						sourceEntityAlias = parentStatement.getNextAlias(entityAliasesMaps);
						entityAliases.put(join.getSourceEntity().getUniqueName(), sourceEntityAlias);
					}
					String destinationEntityAlias = (String)entityAliases.get(join.getDestinationEntity().getUniqueName());
					if(destinationEntityAlias == null) {
						destinationEntityAlias = parentStatement.getNextAlias(entityAliasesMaps);
						entityAliases.put(join.getDestinationEntity().getUniqueName(), destinationEntityAlias);
					}
					
					for(int i = 0; i < join.getSourceFileds().size(); i++) {
						IModelField sourceField = join.getSourceFileds().get(i);
						IModelField destinationField = join.getDestinationFileds().get(i);
						String sourceFieldName = (String)sourceField.getQueryName().getFirst();
						String destinationFieldName = (String)destinationField.getQueryName().getFirst();
						
						String leftHandValue = sourceEntityAlias + "." + sourceFieldName;
						String rightHandValues = destinationEntityAlias + "." + destinationFieldName;
						
						String filterCondition = conditionalOperator.apply(leftHandValue, new String[]{rightHandValues});
						
						addCondition(buffer, filterCondition);  
					}
				}
			}
		} catch(Throwable t) {
			t.printStackTrace();
		}
			
		return buffer;
		
	}
	*/
	
	
	protected String injectAutoJoins(String whereClause, Query query, Map entityAliasesMaps) {
		logger.debug("IN");
		
		try {
			Map rootEntityAlias = (Map)entityAliasesMaps.get(query.getId());
			
			if(rootEntityAlias == null || rootEntityAlias.keySet().size() == 0) {
				return "";
			}
			
			Set<IModelEntity> unjoinedEntities = getUnjoinedRootEntities(rootEntityAlias);
			if(unjoinedEntities.size() > 0) {
				boolean areConnected = parentStatement.getDataSource().getModelStructure().areRootEntitiesConnected(unjoinedEntities);
				if(areConnected) {
					Set<Relationship> relationships = parentStatement.getDataSource().getModelStructure().getRootEntitiesConnections(unjoinedEntities);
					for(Relationship relationship : relationships) {
						IModelEntity sourceEntity = relationship.getSourceEntity();
						Assert.assertNotNull(sourceEntity, "In a relationship source entity cannot be null");
						IModelEntity targetEntity = relationship.getTargetEntity();
						Assert.assertNotNull(sourceEntity, "In a relationship target entity cannot be null");
						logger.debug("Adding join condition between entity [" + sourceEntity.getName() + "] and entity [" + targetEntity.getName() + "]");
						String sourceEntityAlias = null;
						if( rootEntityAlias.containsKey(sourceEntity.getUniqueName()) ) {
							sourceEntityAlias = (String)rootEntityAlias.get(sourceEntity.getUniqueName());
						} else {
							sourceEntityAlias = parentStatement.getNextAlias(entityAliasesMaps);
							rootEntityAlias.put(sourceEntity.getUniqueName(), sourceEntityAlias);
						}
						logger.debug("Source entity alias is equal to [" + sourceEntityAlias + "]");
						
						String targetEntityAlias = null;
						if( rootEntityAlias.containsKey(targetEntity.getUniqueName()) ) {
							targetEntityAlias = (String)rootEntityAlias.get(targetEntity.getUniqueName());
						} else {
							targetEntityAlias = parentStatement.getNextAlias(entityAliasesMaps);
							rootEntityAlias.put(targetEntity.getUniqueName(), targetEntityAlias);
						}
						logger.debug("Traget entity alias is equal to [" + targetEntityAlias + "]");
						
						String joinCondition;
						List<IModelField> sourceFields = relationship.getSourceFields();
						Assert.assertTrue(sourceFields != null && sourceFields.size() > 0, "A relationship must refer at least one column of the source table");
						List<IModelField> destinationFields = relationship.getTargetFields();
						Assert.assertTrue(destinationFields != null && destinationFields.size() > 0, "A relationship must refer at least one column of the destination table");
						Assert.assertTrue(sourceFields.size() == destinationFields.size(), "The number of columns of source table referred by a relationship must be equal to the number of columns it refer in the target table");
						for(int i = 0; i < sourceFields.size(); i++) {
							IModelField sourceField =  sourceFields.get(i);
							String sourceFieldName = (String)sourceField.getQueryName().getFirst();
							IModelField destinationField =  destinationFields.get(i);
							String destinationFieldName = (String)destinationField.getQueryName().getFirst();
							
							joinCondition = null;
							if( "one-to-many".equalsIgnoreCase(relationship.getType()) ) {
								joinCondition = sourceEntityAlias + "." + sourceFieldName + " = " + targetEntityAlias + "." + destinationFieldName;
							} else if( "many-to-one".equalsIgnoreCase(relationship.getType()) ) {
								joinCondition = sourceEntityAlias + "." + sourceFieldName + " = " + targetEntityAlias + "." + destinationFieldName;
							} else if( "many-to-many".equalsIgnoreCase(relationship.getType()) ) {
								joinCondition = sourceEntityAlias + "." + sourceFieldName + " = " + targetEntityAlias + "." + destinationFieldName;
							} else if( "one-to-one".equalsIgnoreCase(relationship.getType()) ) {
								joinCondition = sourceEntityAlias + "." + sourceFieldName + " = " + targetEntityAlias + "." + destinationFieldName;
							} else if( "optional-one-to-one".equalsIgnoreCase(relationship.getType()) ) {
								joinCondition = sourceEntityAlias + "." + sourceFieldName + " = " + targetEntityAlias + "." + destinationFieldName;
							} else if( "one-to-optional-one".equalsIgnoreCase(relationship.getType()) ) {
								joinCondition = sourceEntityAlias + "." + sourceFieldName + " = " + targetEntityAlias + "." + destinationFieldName;
							} else if( "optional-many-to-one".equalsIgnoreCase(relationship.getType()) ) {
								joinCondition = sourceEntityAlias + "." + sourceFieldName + " = " + targetEntityAlias + "." + destinationFieldName;
							} else if( "many-to-optional-one".equalsIgnoreCase(relationship.getType()) ) {
								joinCondition = sourceEntityAlias + "." + sourceFieldName + " = " + targetEntityAlias + "." + destinationFieldName;
							} else if( "optional-one-to-many".equalsIgnoreCase(relationship.getType()) ) {
								joinCondition = sourceEntityAlias + "." + sourceFieldName + " = " + targetEntityAlias + "." + destinationFieldName;
							} else if( "one-to-optional-many".equalsIgnoreCase(relationship.getType()) ) {
								joinCondition = sourceEntityAlias + "." + sourceFieldName + " = " + targetEntityAlias + "." + destinationFieldName;
							} else {
								joinCondition = sourceEntityAlias + "." + sourceFieldName + " = " + targetEntityAlias + "." + destinationFieldName;
							}
							
							
							logger.debug("succesful added auto-join condition [" + joinCondition + "]");
							if(whereClause == null || whereClause.equals("")) {
								whereClause = "WHERE ";
							} else {
								whereClause = whereClause + " AND ";
							}						
							whereClause += joinCondition;
						}
					}
					//throw new RuntimeException("Impossible to auto join entities");
				} else {
					logger.warn("Impossible to join entities [" + unjoinedEntities + "]. A cartesian product will be generted.");
					throw new RuntimeException("Impossible to auto join entities");
				}
			}
		} catch(Throwable t) {
			throw new RuntimeException("An unexpected error occured while inject auto-joins into query statement", t);
		}finally {
			logger.debug("OUT");
		}
		
		return whereClause;
	}
	
	protected String fixWhereClause(String whereClause, Query query, Map entityAliasesMaps) {
		logger.debug("IN");
		
		try {
			Map rootEntityAlias = (Map)entityAliasesMaps.get(query.getId());
			
			
			if(rootEntityAlias == null || rootEntityAlias.keySet().size() == 0) {
				return "";
			}
		
			Iterator it = rootEntityAlias.keySet().iterator();
			while( it.hasNext() ) {
				String entityUniqueName = (String)it.next();
				logger.debug("entity [" + entityUniqueName +"]");
				
				String entityAlias = (String)rootEntityAlias.get(entityUniqueName);
				logger.debug("entity alias [" + entityAlias +"]");
				
				IModelEntity modelEntity =  parentStatement.getDataSource().getModelStructure().getEntity(entityUniqueName);
				
				addTableFakeCondition(whereClause, modelEntity.getName(), entityAlias);
			}
		} finally {
			logger.debug("OUT");
		}
		
		return whereClause;
	}
	
	private Set<IModelEntity> getUnjoinedRootEntities(Map entityAliases) {
		
		Set<IModelEntity> unjoinedEntities = new HashSet();
		
		Iterator it = entityAliases.keySet().iterator();
		while( it.hasNext() ) {
			String entityUniqueName = (String)it.next();
			IModelEntity modelEntity =  parentStatement.getDataSource().getModelStructure().getEntity(entityUniqueName);
			unjoinedEntities.add(modelEntity);
		}
		
		return unjoinedEntities;
	}

	/**
	 * ONLY FOR ECLIPSE LINK
	 * Add to the where clause a fake condition..
	 * Id est, take the primary key (or an attribute of the primary key if it's a composed key) 
	 * of the entity and (for example keyField) and add to the whereClause the clause  
	 * entityAlias.keyField = entityAlias.keyField
	 * @param datamartEntityName the jpa object name
	 * @param entityAlias the alias of the table
	 */
	public void addTableFakeCondition(String whereClause, String datamartEntityName, String entityAlias){
		if(parentStatement.getDataSource() instanceof org.eclipse.persistence.jpa.JpaEntityManager){//check if the provider is eclipse link
			EntityManager entityManager = ((IJpaDataSource)parentStatement.getDataSource()).getEntityManager();
			Metamodel classMetadata =  entityManager.getMetamodel();
			//search the EntityType of the datamartEntityName
			for(Iterator it2 = classMetadata.getEntities().iterator(); it2.hasNext(); ) {
				EntityType et = (EntityType)it2.next();
				String entityName = et.getName();
				
				if(datamartEntityName.equals(entityName)){
				
					Type keyT = et.getIdType();
					
					if (keyT instanceof BasicType) {
						//the key has only one field
						
						String name = (et.getId(Object.class)).getName();
						if(whereClause==null || whereClause.equals("")){
							whereClause = "WHERE ";
						}else{
							whereClause = whereClause+" AND ";
						}
						whereClause = whereClause + " "+ entityAlias+"."+name+"="+entityAlias+"."+name;
					}else if (keyT instanceof EmbeddableType) {
						//the key is a composed key
						String keyName = (et.getId(Object.class)).getName();
						SingularAttribute keyAttr = (SingularAttribute)(((EmbeddableType) keyT).getDeclaredSingularAttributes().iterator().next());
						String name = keyName+"."+keyAttr.getName();
						if(whereClause==null || whereClause.equals("")){
							whereClause = "WHERE ";
						}else{
							whereClause = whereClause+" AND ";
						}
						whereClause = whereClause + " "+ entityAlias+"."+name+"="+entityAlias+"."+name;
					}
					break;
				}
			}
		}
	}

	
	public abstract IConditionalOperator getOperator(String operator);

}