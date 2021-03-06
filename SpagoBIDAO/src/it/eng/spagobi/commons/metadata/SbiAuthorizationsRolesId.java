package it.eng.spagobi.commons.metadata;

// Generated 2-dic-2013 14.44.44 by Hibernate Tools 3.4.0.CR1

/**
 * SbiAuthorizationsRolesId generated by hbm2java
 */
public class SbiAuthorizationsRolesId implements java.io.Serializable {

	private int authorizationId;
	private int roleId;

	public SbiAuthorizationsRolesId() {
	}

	public SbiAuthorizationsRolesId(int authorizationId, int roleId) {
		this.authorizationId = authorizationId;
		this.roleId = roleId;
	}

	public int getAuthorizationId() {
		return this.authorizationId;
	}

	public void setAuthorizationId(int authorizationId) {
		this.authorizationId = authorizationId;
	}

	public int getRoleId() {
		return this.roleId;
	}

	public void setRoleId(int roleId) {
		this.roleId = roleId;
	}

	public boolean equals(Object other) {
		if ((this == other))
			return true;
		if ((other == null))
			return false;
		if (!(other instanceof SbiAuthorizationsRolesId))
			return false;
		SbiAuthorizationsRolesId castOther = (SbiAuthorizationsRolesId) other;

		return (this.getAuthorizationId() == castOther.getAuthorizationId())
				&& (this.getRoleId() == castOther.getRoleId());
	}

	public int hashCode() {
		int result = 17;

		result = 37 * result + this.getAuthorizationId();
		result = 37 * result + this.getRoleId();
		return result;
	}

}
