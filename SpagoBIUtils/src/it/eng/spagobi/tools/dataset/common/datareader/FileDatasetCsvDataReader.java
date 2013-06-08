/* SpagoBI, the Open Source Business Intelligence suite

 * Copyright (C) 2012 Engineering Ingegneria Informatica S.p.A. - SpagoBI Competency Center
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0, without the "Incompatible With Secondary Licenses" notice. 
 * If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/. */
package it.eng.spagobi.tools.dataset.common.datareader;

import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.LineNumberReader;
import java.util.Map;
import java.util.StringTokenizer;

import org.apache.log4j.Logger;
import org.json.JSONException;
import org.json.JSONObject;
import org.supercsv.cellprocessor.ift.CellProcessor;
import org.supercsv.io.CsvMapReader;
import org.supercsv.io.ICsvMapReader;
import org.supercsv.prefs.CsvPreference;

import it.eng.spagobi.container.ObjectUtils;
import it.eng.spagobi.tools.dataset.common.datastore.DataStore;
import it.eng.spagobi.tools.dataset.common.datastore.Field;
import it.eng.spagobi.tools.dataset.common.datastore.IDataStore;
import it.eng.spagobi.tools.dataset.common.datastore.IField;
import it.eng.spagobi.tools.dataset.common.datastore.IRecord;
import it.eng.spagobi.tools.dataset.common.datastore.Record;
import it.eng.spagobi.tools.dataset.common.metadata.FieldMetadata;
import it.eng.spagobi.tools.dataset.common.metadata.MetaData;

/**
 * @author Marco Cortella
 *         marco.cortella@eng.it
 */
public class FileDatasetCsvDataReader extends AbstractDataReader {
	
	
	private static transient Logger logger = Logger.getLogger(FileDatasetCsvDataReader.class);
	public static final String CSV_FILE_DELIMITER_CHARACTER = "csvDelimiter";
	public static final String CSV_FILE_QUOTE_CHARACTER = "csvQuote";
	private String csvDelimiter;
	private String csvQuote;

	public FileDatasetCsvDataReader(JSONObject jsonConf) {
		super();

		//Get File Dataset Configuration Options
		if (jsonConf != null){
			try {
				if (jsonConf.get(CSV_FILE_DELIMITER_CHARACTER) != null){
					csvDelimiter = jsonConf.get(CSV_FILE_DELIMITER_CHARACTER).toString();
				} else {
					csvDelimiter="";
				}
				
				if (jsonConf.get(CSV_FILE_QUOTE_CHARACTER) != null){
					csvQuote = jsonConf.get(CSV_FILE_QUOTE_CHARACTER).toString();
				} else {
					csvQuote="";
				}
			} catch (JSONException e) {
				throw new RuntimeException("Error Deserializing File Dataset Options", e);
			}
		}

		
	}

	public IDataStore read( Object data ) {
		DataStore dataStore = null;
		
		InputStream inputDataStream;

		
		logger.debug("IN");
		
		inputDataStream = (InputStream)data;
		
		try {				
			dataStore = readWithCsvMapReader(inputDataStream);

				
		} catch (FileNotFoundException e) {
			logger.error("Error reading CSV File: "+e);
			e.printStackTrace();
		}catch (IOException e) {
			logger.error("Error reading CSV File: "+e);
			e.printStackTrace();
		} catch (Exception e) {
			logger.error("Error reading CSV File: "+e);
			e.printStackTrace();
		}
		
		return dataStore;
    }
	
 	private DataStore readWithCsvMapReader( InputStream inputDataStream ) throws Exception {
 		
 		InputStreamReader inputStreamReader = new InputStreamReader(inputDataStream);
    	DataStore dataStore = null;
		MetaData dataStoreMeta;
    	dataStore = new DataStore();
		dataStoreMeta = new MetaData();
		dataStore.setMetaData(dataStoreMeta);

	        
	        ICsvMapReader mapReader = null;
	        
	        try {
	        	
	        	 CsvPreference customPreference = new CsvPreference.Builder(csvQuote.charAt(0), csvDelimiter.charAt(0), "\n").build(); 
	             // mapReader = new CsvMapReader(inputStreamReader, CsvPreference.STANDARD_PREFERENCE);
	        	 	mapReader = new CsvMapReader(inputStreamReader, customPreference);  
	                // the header columns are used as the keys to the Map
	                final String[] header = mapReader.getHeader(true);
	                
	                int columnsNumber = mapReader.length();
	                
                	//Create Datastore Metadata with header file
                    for (int i= 0; i<header.length;i++){
                    	FieldMetadata fieldMeta = new FieldMetadata();
                    	fieldMeta.setName(header[i]);
                    	fieldMeta.setType(String.class);
                    	dataStoreMeta.addFiedMeta(fieldMeta);
	                }

                	
	                
	                
	                final CellProcessor[] processors = new CellProcessor[columnsNumber];
	                for (int i= 0; i<processors.length;i++){
	                	processors[i] = null;
	                }
	                
	                Map<String, Object> contentsMap;
	                while( (contentsMap = mapReader.read(header, processors)) != null ) {
	                	//Create Datastore data 

	                	IRecord record = new Record(dataStore);

	                        for (int i= 0; i<header.length;i++){
	                        	 logger.debug(header[i]+" = "+contentsMap.get(header[i])); 
	                        	 IField field = new Field(contentsMap.get(header[i]));
	 							 record.appendField(field);
	    	                }
	                        dataStore.appendRecord(record);	
	                        
	                }
	                
	        }
	        finally {
	                if( mapReader != null ) {
	                        mapReader.close();
	                }
	        }
	        return dataStore;
	}

}
