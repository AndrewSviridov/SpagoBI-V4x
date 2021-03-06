/**

SpagoBI - The Business Intelligence Free Platform

Copyright (C) 2005-2010 Engineering Ingegneria Informatica S.p.A.

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with this library; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

**/
package it.eng.spagobi.dataset.cache.test;

import junit.framework.Test;
import junit.framework.TestCase;
import junit.framework.TestSuite;

/**
 * @author Marco Cortella (marco.cortella@eng.it)
 *
 */
public class SQLDBCacheTestSuite extends TestCase {
	static public Test suite() {
		TestSuite suite = new TestSuite("SQLDBCache tests");
		if(TestConstants.enableTestsOnMySql){
			//suite.addTestSuite(MySqlSQLDBCacheTest.class);
		}
		if(TestConstants.enableTestsOnPostgres){
			//suite.addTestSuite(PostgresSQLDBCacheTest.class);
		}
		if(TestConstants.enableTestsOnOracle){
			//suite.addTestSuite(OracleSQLDBCacheTest.class);
		}
		if(TestConstants.enableTestsOnSQLServer){
			//suite.addTestSuite(SQLServerSQLDBCacheTest.class);
		}
		return suite;
	}
}
