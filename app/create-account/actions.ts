'use server';

import {
	PASSWORD_MIN_LENGTH,
	PASSWORD_REGEX,
	PASSWORD_REGEX_ERROR,
} from '@/lib/constants';
import db from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { getIronSession } from 'iron-session';
import { sessions } from 'next/headers';
import { redirect } from 'next/navigation';
import getSession from '@/lib/session';

const checkUsername = (username: string) => !username.includes('potato');

const checkPasswords = ({
	password,
	confirmPassword,
}: {
	password: string;
	confirmPassword: string;
}) => password === confirmPassword;

const checkUniqueUsername = async (username: string) => {
	const user = await db.user.findUnique({
		where: {
			username: username,
		},
		select: {
			id: true,
		},
	});
	return !Boolean(user);
};

const checkUniqueEmail = async (email: string) => {
	const user = await db.user.findUnique({
		where: {
			email: email,
		},
		select: {
			id: true,
		},
	});
	return !Boolean(user);
};

const formSchema = z
	.object({
		username: z
			.string({
				invalid_type_error: 'Username	should be a string',
				required_error: 'Username is required',
			})
			.toLowerCase()
			.trim()
			.refine(checkUsername, 'No potato allowed')
			.refine(checkUniqueUsername, 'Username is already taken'),
		email: z
			.string()
			.email()
			.toLowerCase()
			.refine(checkUniqueEmail, 'Email is already taken'),
		password: z
			.string()
			.min(PASSWORD_MIN_LENGTH)
			.regex(PASSWORD_REGEX, PASSWORD_REGEX_ERROR),
		confirmPassword: z.string().min(PASSWORD_MIN_LENGTH),
	})
	.superRefine(async ({ username }, ctx) => {
		const user = await db.user.findUnique({
			where: {
				username: username,
			},
			select: {
				id: true,
			},
		});
		if (user) {
			return ctx.addIssue({
				code: 'custom',
				message: 'Username is already taken',
				path: ['username'],
				fatal: true,
			});
			z.NEVER;
		}
	})
	.superRefine(async ({ email }, ctx) => {
		const user = await db.user.findUnique({
			where: {
				email,
			},
			select: {
				id: true,
			},
		});
		if (user) {
			return ctx.addIssue({
				code: 'custom',
				message: 'email is already taken',
				path: ['email'],
				fatal: true,
			});
			z.NEVER;
		}
	})
	.refine(checkPasswords, {
		message: "Passwords don't match",
		path: ['confirmPassword'],
	});

export async function createAccount(prevState: any, formData: FormData) {
	const data = {
		username: formData.get('username'),
		email: formData.get('email'),
		password: formData.get('password'),
		confirmPassword: formData.get('confirmPassword'),
	};
	const result = await formSchema.safeParseAsync(data);
	if (!result.success) {
		return result.error.flatten();
	} else {
		const hashedPasswod = await bcrypt.hash(result.data.password, 12);
		const user = await db.user.create({
			data: {
				username: result.data.username,
				email: result.data.email,
				password: hashedPasswod,
			},
			select: {
				id: true,
			},
		});
		const session = await getSession();
		session.id = user.id;
		await session.save();
		redirect('/profile');
	}
}
