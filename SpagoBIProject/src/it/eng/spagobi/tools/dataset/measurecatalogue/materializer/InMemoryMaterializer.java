 /* SpagoBI, the Open Source Business Intelligence suite

 * Copyright (C) 2012 Engineering Ingegneria Informatica S.p.A. - SpagoBI Competency Center
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0, without the "Incompatible With Secondary Licenses" notice. 
 * If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/. */

package it.eng.spagobi.tools.dataset.measurecatalogue.materializer;

import it.eng.spagobi.metamodel.HierarchyWrapper;
import it.eng.spagobi.tools.dataset.bo.IDataSet;
import it.eng.spagobi.tools.dataset.common.datastore.DataStore;
import it.eng.spagobi.tools.dataset.common.datastore.IDataStore;
import it.eng.spagobi.tools.dataset.common.datastore.IField;
import it.eng.spagobi.tools.dataset.common.datastore.IRecord;
import it.eng.spagobi.tools.dataset.common.datastore.Record;
import it.eng.spagobi.tools.dataset.common.metadata.IFieldMetaData;
import it.eng.spagobi.tools.dataset.common.metadata.IFieldMetaData.FieldType;
import it.eng.spagobi.tools.dataset.common.metadata.IMetaData;
import it.eng.spagobi.tools.dataset.common.metadata.MetaData;
import it.eng.spagobi.tools.dataset.common.query.AggregationFunctions;
import it.eng.spagobi.tools.dataset.common.query.IAggregationFunction;
import it.eng.spagobi.tools.dataset.measurecatalogue.MeasureCatalogueDimension;
import it.eng.spagobi.tools.dataset.measurecatalogue.MeasureCatalogueMeasure;
import it.eng.spagobi.utilities.assertion.Assert;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import edu.emory.mathcs.backport.java.util.Collections;

public class InMemoryMaterializer implements IMaterializer {
	
	private IAggregationFunction aggreationFunction =  AggregationFunctions.SUM_FUNCTION;
	 
	public IDataStore joinMeasures(List<MeasureCatalogueMeasure> measures){
    	
		//STEP1: gets the common dimensions
		List<List<MeasureCatalogueDimension>> commonDimensions =  getCommonDimensions(measures.get(0),measures.get(1));
		
		if(commonDimensions.size()==0 || commonDimensions.get(0).size()==0 ){
			throw new RuntimeException("No common dimensions found");
		}
		
		List<List<MeasureCatalogueDimension>> commonDimensionsFilterd = new ArrayList<List<MeasureCatalogueDimension>>();
		for(int i=0; i<commonDimensions.size(); i++){
			commonDimensionsFilterd.add(filterHierarchies(commonDimensions.get(i)));
		}
		
		
    	
    	//STEP2: execute the roll up 
    	List<InMemoryAggregator> rolledUpMeasures = rollUpMeasures(measures.get(0), measures.get(1), commonDimensionsFilterd.get(0), commonDimensionsFilterd.get(1));

    	return joinAggreteMeasures(rolledUpMeasures);
	}
	

	
	
    public List<InMemoryAggregator> rollUpMeasures(MeasureCatalogueMeasure measure1, MeasureCatalogueMeasure measure2, List<MeasureCatalogueDimension> commonDimensions1, List<MeasureCatalogueDimension> commonDimensions2){
    	List<InMemoryAggregator> resultSets = new ArrayList<InMemoryAggregator>();

    	 InMemoryAggregator groupMeasure1 =  groupBy(measure1, commonDimensions1, aggreationFunction);
    	 InMemoryAggregator groupMeasure2 =  groupBy(measure2, commonDimensions2, aggreationFunction);
		 
		 resultSets.add(groupMeasure1);
		 resultSets.add(groupMeasure2);
		 
    	return resultSets;
    }
    
    /**
     * Get the dimensions associated to a hierarchy in common between the 2 measures
     * @param measure1
     * @param measure2
     * @return
     */
    private List<List<MeasureCatalogueDimension>> getCommonDimensions(MeasureCatalogueMeasure measure1, MeasureCatalogueMeasure measure2){	
    	
    	List<MeasureCatalogueDimension> measure1DimensionsCommon = new ArrayList<MeasureCatalogueDimension>();
    	List<MeasureCatalogueDimension> measure2DimensionsCommon = new ArrayList<MeasureCatalogueDimension>();
    	
    	List<List<MeasureCatalogueDimension>> measureDimensionsCommon = new ArrayList<List<MeasureCatalogueDimension>>();
    	
    	Set<MeasureCatalogueDimension> measure1Dimensions = (measure1.getDatasetDimension());
    	Set<MeasureCatalogueDimension> measure2Dimensions = (measure2.getDatasetDimension());
    	
    	if(measure1Dimensions!=null && measure2Dimensions!=null){
        	for (Iterator<MeasureCatalogueDimension> iterator1 = measure1Dimensions.iterator(); iterator1.hasNext();) {
    			MeasureCatalogueDimension dimension1 = (MeasureCatalogueDimension) iterator1.next();
    	    	for (Iterator<MeasureCatalogueDimension> iterator2 = measure2Dimensions.iterator(); iterator2.hasNext();) {
    				MeasureCatalogueDimension dimension2 = (MeasureCatalogueDimension) iterator2.next();
    				if(dimension1.getHierarchy()!= null && dimension2.getHierarchy()!= null && dimension1.getHierarchy().equals(dimension2.getHierarchy()) && dimension1.getHierarchyLevel().equals(dimension2.getHierarchyLevel())){
    					measure1DimensionsCommon.add(dimension1);
    					measure2DimensionsCommon.add(dimension2);
    					break;
    				}
    			} 
    		} 
    	}

    	measureDimensionsCommon.add(measure1DimensionsCommon);
    	measureDimensionsCommon.add(measure2DimensionsCommon);
    	
    	return measureDimensionsCommon;
    }
    
    /**
     * Check if in the dimensions the hierarchies are complete. For complete we mean that they start from the top level and 
     * there is no step between levels
     * @param dimensions 
     * @return
     */
    private List<MeasureCatalogueDimension> filterHierarchies( List<MeasureCatalogueDimension> dimensions){
    	//map with the hiearchy and the list of levels
    	Map<HierarchyWrapper, List<Integer>> hierarchiesLevels = new HashMap<HierarchyWrapper, List<Integer>>();
    	Map<HierarchyWrapper, Boolean> hierarchiesLevelsValid = new HashMap<HierarchyWrapper, Boolean>();
    	List<MeasureCatalogueDimension> filteredDimensions = new ArrayList<MeasureCatalogueDimension>();
    	
    	//create the map with the hierarchies and levels
    	for (Iterator<MeasureCatalogueDimension> iterator1 = dimensions.iterator(); iterator1.hasNext();) {
    		MeasureCatalogueDimension dimension = (MeasureCatalogueDimension) iterator1.next();
    		HierarchyWrapper hierarchy = dimension.getHierarchy();
    		List<Integer> hierarchyPositions = hierarchiesLevels.get(hierarchy);
    		if(hierarchyPositions==null){
    			hierarchyPositions = new ArrayList<Integer>();
    		}
    		hierarchyPositions.add(dimension.getHierarchyLevelPosition());
    		hierarchiesLevels.put(hierarchy, hierarchyPositions);
    	}
    	
    	//check if the hierarchies has not steps
    	for (Iterator<HierarchyWrapper> iterator = hierarchiesLevels.keySet().iterator(); iterator.hasNext();) {
    		HierarchyWrapper hierarchy = (HierarchyWrapper) iterator.next();
    		List<Integer> hierarchyPositions = hierarchiesLevels.get(hierarchy);
    		Collections.sort(hierarchyPositions);
    		hierarchiesLevelsValid.put(hierarchy, true);
    		if(hierarchyPositions.size()>1){
    			 
        		for(int i=0; i<hierarchyPositions.size(); i++){

        			if(hierarchyPositions.get(i)!=i){
        				hierarchiesLevelsValid.put(hierarchy, false);
        				break; 
        			}
        		}
    		}
		}
    	
    	//filter the array of dimensions
    	for(int i=0; i<dimensions.size(); i++){
    		if(hierarchiesLevelsValid.get(dimensions.get(i).getHierarchy())){
    			filteredDimensions.add(dimensions.get(i));
    		}
    	}
    	
    	return filteredDimensions;

    }
    

    /**
     * Here we prefer not create a data store in order to be more efficient 
     * @param measure
     * @param commonDimensions
     * @param aggreationFunction
     * @return
     */
    private InMemoryAggregator groupBy(MeasureCatalogueMeasure measure, List<MeasureCatalogueDimension> commonDimensions, IAggregationFunction aggreationFunction){
    	IDataSet dataSet;
    	IDataStore dataStore;
    	List<Integer> hierarchiesColumnsIndexInDataSet = new ArrayList<Integer>();//columns of the datastore that contains data of the dimensions
    	int measureColumnIndex = -1;
    	//List<IRecord> aggregatedRecords;
    	//IMetaData aggregatedDataSourceMetadata;
    	List<IFieldMetaData> newDataStoreFieldMetaData = new ArrayList<IFieldMetaData>();
    	Map<MeasureCatalogueDimension, IFieldMetaData> mapDimensionsFields = new HashMap<MeasureCatalogueDimension, IFieldMetaData>();
    	Map<IFieldMetaData, MeasureCatalogueDimension> mapFieldsDimensions = new HashMap<IFieldMetaData, MeasureCatalogueDimension>();
    	
    	
    	//execute dataset
    	dataSet = measure.getDataset();
    	dataSet.loadData();
    	dataStore = dataSet.getDataStore();
    	
    	//A1: gets the columns that contains the measure and the dimensions
    	for(int i=0; i<dataSet.getMetadata().getFieldCount(); i++){
    		IFieldMetaData fmd = dataSet.getMetadata().getFieldMeta(i);
    		String alias = fmd.getAlias();
    		if(alias==null){
    			alias = fmd.getName();
    		}
    		//get the index of the measure
    		if(alias.equals(measure.getColumnName())){
    			measureColumnIndex=i;
    			newDataStoreFieldMetaData.add(fmd);
    		}else if(commonDimensions!=null && commonDimensions.size()>0){
    			//get the indexes of the hierarchies columns in the dataset (by alias)
    			for (Iterator iterator = commonDimensions.iterator(); iterator.hasNext();) {
    				MeasureCatalogueDimension dimension = (MeasureCatalogueDimension) iterator.next();
    				if(dimension.getAlias().equals(alias)){
    					hierarchiesColumnsIndexInDataSet.add(i);
    					newDataStoreFieldMetaData.add(fmd);
    					mapDimensionsFields.put(dimension, fmd);
    					mapFieldsDimensions.put(fmd, dimension);
    					break;
    				}
    			}
    		}
    	}
    	
    	Assert.assertNotNull(dataStore, "the datastore is null");
    	Assert.assertTrue(measureColumnIndex>=0, "no measures found in teh datastore");
    	
    	
    	//A2: aggregate
    	InMemoryAggregator inMemoryAggregator = new InMemoryAggregator(aggreationFunction, measureColumnIndex, newDataStoreFieldMetaData, mapDimensionsFields, mapFieldsDimensions, dataSet);
    	
    	if(dataStore.getRecordsCount()>0){
    		int recordLength = dataStore.getRecordAt(0).getFields().size();
        	//scan the datastore
        	for(int i=0; i<dataStore.getRecordsCount(); i++){
        		IRecord dataStoreRecord = dataStore.getRecordAt(i);
        		IRecord grouppedRecord = new  Record();
        		//for each record create a record that contains only the hierarchies columns
        		for(int j=0; j<recordLength;j++){
        			IField columnField = dataStoreRecord.getFieldAt(j);
        			if(hierarchiesColumnsIndexInDataSet.contains(j) || j==measureColumnIndex){
        				grouppedRecord.appendField(columnField);
        			}
        		}
        		inMemoryAggregator.addRecord(grouppedRecord) ;     		
        	}
    	}
    	
    	return inMemoryAggregator;
    }
    

	private DataStore joinAggreteMeasures(List<InMemoryAggregator> rolledUpMeasures){
		return jonMeasures(rolledUpMeasures.get(0), rolledUpMeasures.get(1));
	}
	
	/**
	 * joins 2 measures already aggregated and rolled up
	 * @param rolledUpMeasures1
	 * @param rolledUpMeasures2
	 * @return
	 */
	private DataStore jonMeasures(InMemoryAggregator rolledUpMeasures1, InMemoryAggregator rolledUpMeasures2){
		DataStore dataStore = new DataStore();
		List<IRecord> records1 = rolledUpMeasures1.aggregate();
		List<IRecord> records2 = rolledUpMeasures2.aggregate();

		
		//maps the position of the columns of the second datastore with the ones of the first datastore
		Map<Integer, Integer> records2to1DiemnsionMap = new HashMap<Integer,Integer>();
		
		//position of the measures of records 2
		List<Integer> record2MeasurePosition = new ArrayList<Integer>();
		
		
		
		for(int i=0; i<rolledUpMeasures2.getFiledsMetadata().size(); i++){
			IFieldMetaData field2 = rolledUpMeasures2.getFiledsMetadata().get(i);
			if(field2.getFieldType().equals(FieldType.MEASURE)){
				record2MeasurePosition.add(i);
			}
		}
		
		for(int i=0; i<rolledUpMeasures2.getFiledsMetadata().size(); i++){
			IFieldMetaData field2 = rolledUpMeasures2.getFiledsMetadata().get(i);
			if(field2.getFieldType().equals(FieldType.ATTRIBUTE)){
				for(int j=0; j<rolledUpMeasures1.getFiledsMetadata().size(); j++){
					IFieldMetaData field1 = rolledUpMeasures1.getFiledsMetadata().get(j);
					if(field1.getFieldType().equals(FieldType.ATTRIBUTE)){
						if(rolledUpMeasures1.getDimension(field1).equals(rolledUpMeasures2.getDimension(field2))){
							records2to1DiemnsionMap.put(i, j);
							break;
						}
					}
				}
			}
		}
		
		
		dataStore.setMetaData(buildJoinedDataStoreMetdata(rolledUpMeasures1, rolledUpMeasures2));
		
		for(int i=0; i<records1.size(); i++){
			IRecord joinedrecord = join(records1.get(i), records2, dataStore, records2to1DiemnsionMap, record2MeasurePosition);
			if(joinedrecord!=null){
				dataStore.appendRecord(joinedrecord);
			}
		}
		
		return dataStore;
		
		
	}
	
	private IMetaData buildJoinedDataStoreMetdata(InMemoryAggregator rolledUpMeasures1, InMemoryAggregator rolledUpMeasures2){
		IMetaData metadata = new MetaData();
		
		//gets the fields metadata of records1
		for(int i=0; i<rolledUpMeasures1.getFiledsMetadata().size(); i++){
			IFieldMetaData fieldMetadata = rolledUpMeasures1.getFiledsMetadata().get(i);
			String alias = fieldMetadata.getAlias();
			String name = fieldMetadata.getName();
			if(alias!=null){
				fieldMetadata.setAlias(rolledUpMeasures1.getDataSet().getLabel()+"_"+alias);
			}
			if(name!=null){
				fieldMetadata.setName(rolledUpMeasures1.getDataSet().getLabel()+"_"+name);
			}
			metadata.addFiedMeta(fieldMetadata);
		}
		
		//gets the fields metadata of the measures of records2
		for(int i=0; i<rolledUpMeasures2.getFiledsMetadata().size(); i++){
			IFieldMetaData fieldMetadata = rolledUpMeasures2.getFiledsMetadata().get(i);
			if(fieldMetadata.getFieldType().equals(FieldType.MEASURE)){
				
				String alias = fieldMetadata.getAlias();
				String name = fieldMetadata.getName();
				if(alias!=null){
					fieldMetadata.setAlias(rolledUpMeasures2.getDataSet().getLabel()+"_"+alias);
				}
				if(name!=null){
					fieldMetadata.setName(rolledUpMeasures2.getDataSet().getLabel()+"_"+name);
				}
				metadata.addFiedMeta(fieldMetadata);
			}
		}
		
		return metadata;
	}

	/**
	 * If the dimensions of the  record1 and a record of the datastore of the second measure match than execute the join. 
	 * The records are grouped by the dimensions so there can be only a match between the record1 
	 * @param record1
	 * @param list2Records
	 * @param dataStore
	 * @param records2to1DiemnsionMap
	 * @param record2MeasurePosition
	 * @return
	 */
	private IRecord join(IRecord record1, List<IRecord> list2Records, IDataStore dataStore, Map<Integer, Integer> records2to1DiemnsionMap, List<Integer> record2MeasurePosition  ){
		IRecord joinedRecord = new Record(dataStore);
		

		for(int i=0; i<list2Records.size(); i++){
			IRecord record2 = list2Records.get(i);
			if(isJoinnable(record1, record2, records2to1DiemnsionMap)){
				//add the record1 fields
				for(int j=0; j<record1.getFields().size(); j++){
					joinedRecord.appendField(record1.getFields().get(j));
				}
				//add the record 2 measures
				for(int j=0; j<record2MeasurePosition.size(); j++){
					joinedRecord.appendField(record2.getFields().get(record2MeasurePosition.get(j)));
				}
				
				return joinedRecord;
			}
		}
		
		return null;
		
	}
	
	/**
	 * Checks if the dimensions of the records are equals
	 * @param record1
	 * @param record2
	 * @param records2to1DiemnsionMap
	 * @return
	 */
	private boolean isJoinnable(IRecord record1, IRecord record2, Map<Integer, Integer> records2to1DiemnsionMap ){
		IField field2, field1=null;
		Integer record2DimensionPosition;
		
		for(int i=0; i<record2.getFields().size(); i++){
			field2 = record2.getFieldAt(i);
			record2DimensionPosition = records2to1DiemnsionMap.get(i);
			if(record2DimensionPosition!=null){
				field1 = record1.getFieldAt(record2DimensionPosition);
				
				if(!field1.equals(field2)){
					return false;
				}
			}else{
				//it's a measure because there is no entry in the dimension map. So don't do anything
			}
		}
		
		return true;
	}
    
    private class InMemoryAggregator{
    	private IAggregationFunction aggreationFunction;
    	private IDataSet dataSet;
    	private List<IFieldMetaData> filedsMetadata;
    	private Map<MeasureCatalogueDimension, IFieldMetaData> mapDimensionsFields;
    	private Map<IFieldMetaData, MeasureCatalogueDimension> mapFieldsDimensions;
    	private List<IRecord> records;
    	private List<List<Object>> recordsMeasuresValues;//for each record a list with the values of the measures
    	private int measureColumnIndex;//index of the measure in the record
    	
    	public InMemoryAggregator(IAggregationFunction aggreationFunction, int measureColumnIndex, List<IFieldMetaData> newDataStoreFieldMetaData, Map<MeasureCatalogueDimension, IFieldMetaData> mapDimensionsFields,	Map<IFieldMetaData, MeasureCatalogueDimension> mapFieldsDimensions,IDataSet dataSet){
    		this.aggreationFunction = aggreationFunction;
    		this.measureColumnIndex = measureColumnIndex;
    		records = new ArrayList<IRecord>();
    		recordsMeasuresValues = new ArrayList<List<Object>>();
    		filedsMetadata = newDataStoreFieldMetaData;
    		this.mapDimensionsFields = mapDimensionsFields;
    		this.mapFieldsDimensions = mapFieldsDimensions;
    		this.dataSet = dataSet;
    	}
    	
    	public void addRecord(IRecord record){

    		//check if the record already exists
    		boolean recordFound = false;
			for(int i=0; i<records.size(); i++){
				recordFound = true;
				for(int j=0; j<records.get(i).getFields().size(); j++){
					
					if(j!=measureColumnIndex && !//checks only dimensions
							(records.get(i).getFieldAt(j).equals(record.getFieldAt(j)))){//if a dimension is not equal
						recordFound = false;
						break;
					}
				}
				if(recordFound){
					List<Object> recordsMeasuresValue = recordsMeasuresValues.get(i);
					recordsMeasuresValue.add(record.getFieldAt(measureColumnIndex).getValue());//record found 
		    		break;
				}
			}
			
			if(!recordFound){
	   			records.add(record);
	   			List<Object> recordsMeasuresValue = new ArrayList<Object>();
	   			recordsMeasuresValue.add(record.getFieldAt(measureColumnIndex).getValue());
	   			recordsMeasuresValues.add(recordsMeasuresValue);
			}
    	}
    	
    	public List<IRecord> aggregate(){
    		
    			for(int i=0; i<records.size(); i++){
    				Double value = null;
    				if(aggreationFunction.equals( AggregationFunctions.AVG_FUNCTION)){
    					List<Object> recordsMeasuresValue = recordsMeasuresValues.get(i);
    					value = (Double)executeSum(recordsMeasuresValue);
    					value = value/recordsMeasuresValue.size();
    				}else {//if(aggreationFunction.equals( AggregationFunctions.SUM_FUNCTION)){
    					List<Object> recordsMeasuresValue = recordsMeasuresValues.get(i);
    					value = (Double)executeSum(recordsMeasuresValue);
    				}
    				//update the value of the measure in the record with the one aggregated
    				records.get(i).getFieldAt(measureColumnIndex).setValue(value);
    				records.get(i).getFieldAt(measureColumnIndex).setDescription(value);	
    			}

    		
    		return records;
    	}
    	
    	private Number executeSum(List<Object> values){
			Double sum = 0d;
			for(int j=0; j<values.size();j++){
				sum = sum+ ((Number)values.get(j)).doubleValue();
			}
			return sum;
    	}

		public List<IFieldMetaData> getFiledsMetadata() {
			return filedsMetadata;
		}
		
		public IFieldMetaData getField(MeasureCatalogueDimension dimension){
			return mapDimensionsFields.get(dimension);
		}
		
		public MeasureCatalogueDimension getDimension(IFieldMetaData fieldMetadata){
			return mapFieldsDimensions.get(fieldMetadata);
		}

		public IDataSet getDataSet() {
			return dataSet;
		}	
		
		
    }

}
