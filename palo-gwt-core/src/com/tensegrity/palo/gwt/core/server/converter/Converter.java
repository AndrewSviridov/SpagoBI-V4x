/*
*
* @file Converter.java
*
* Copyright (C) 2006-2009 Tensegrity Software GmbH
*
* This program is free software; you can redistribute it and/or modify it
* under the terms of the GNU General Public License (Version 2) as published
* by the Free Software Foundation at http://www.gnu.org/copyleft/gpl.html.
*
* This program is distributed in the hope that it will be useful, but WITHOUT
* ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
* FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
* more details.
*
* You should have received a copy of the GNU General Public License along with
* this program; if not, write to the Free Software Foundation, Inc., 59 Temple
* Place, Suite 330, Boston, MA 02111-1307 USA
*
* If you are developing and distributing open source applications under the
* GPL License, then you are free to use JPalo Modules under the GPL License.  For OEMs,
* ISVs, and VARs who distribute JPalo Modules with their products, and do not license
* and distribute their source code under the GPL, Tensegrity provides a flexible
* OEM Commercial License.
*
* @author Philipp Bouillon <Philipp.Bouillon@tensegrity-software.com>
*
* @version $Id: Converter.java,v 1.5 2010/02/16 13:54:00 PhilippBouillon Exp $
*
*/

/*
 * (c) Tensegrity Software 2009
 * All rights reserved
 */
package com.tensegrity.palo.gwt.core.server.converter;

import org.palo.viewapi.exceptions.OperationFailedException;

import com.tensegrity.palo.gwt.core.client.models.XObject;

/**
 * <code>Converter</code>
 * TODO DOCUMENT ME
 *
 * @version $Id: Converter.java,v 1.5 2010/02/16 13:54:00 PhilippBouillon Exp $
 **/
public interface Converter {

	/**
	 * Gets the corresponding native object to the given <code>XObject</code>.
	 * If no native object could be found a new one will be created. 
	 * @param xObj
	 * @param loggedInUser
	 * @return
	 * @throws OperationFailedException
	 */
//	public Object toNative(XObject xObj, AuthUser loggedInUser) throws OperationFailedException;
	public XObject toXObject(Object nativeObj);
}