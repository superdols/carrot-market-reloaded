export const PASSWORD_MIN_LENGTH = 4;
export const PASSWORD_REGEX = new RegExp(
	/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*?[#?!@$%^&*-]).+$/,
);

export const PASSWORD_REGEX_ERROR =
	'Password should have at least one uppercase, one lowercase, one number and one special character';
