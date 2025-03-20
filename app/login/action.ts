'use server';

export async function handleForm(prevState: any, formData: FormData) {
	console.log(formData.get('email'), formData.get('password'));
	await new Promise(resolve => setTimeout(resolve, 5000));
	return { error: ['wrong password', 'password too short'] };
}
